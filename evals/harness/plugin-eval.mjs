// `claude plugin eval` integration (C001-ADR-007): routing and delegation suites (C001-REQ-1116,
// C001-T-063) use Claude Code's own eval command with deterministic `tool_used` graders. This
// wrapper runs it with the desktop-bundled Claude Code on a scratch copy of the plugin, a cost
// ceiling and no publishing, and converts its aggregate-result.json into a result document of
// evals/results/ so the metrics report covers both mechanisms.
// Usage: node evals/harness/plugin-eval.mjs <plugin dir> [--eval-dir <dir>] [--runs N]
//          [--max-cost-usd X] [--label NAME] [--case <glob>] [--auth api-key|subscription]
//          [--model M] [--subagent-model M] [-j N]
//
// Notes (Claude Code 2.1.299):
// - the plugin is the command's target, so there is no --plugin-dir; `--setting-sources` is a global
//   option (before `plugin`), passed as `project,local`;
// - a case's `env` may set only EVAL_* keys; anything else comes from this process's environment,
//   so `--subagent-model` sets CLAUDE_CODE_SUBAGENT_MODEL for the child sessions (routing suites
//   grade the main thread's Agent call; the subagent's own work is not graded);
// - `--auth subscription` (env.mjs) gives the children CLAUDE_CODE_OAUTH_TOKEN and an isolated
//   CLAUDE_CONFIG_DIR; without an authentication route the children fail with "Not logged in".
import { spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { ROOT } from "./fixtures.mjs";
import { childEnv, claudeExecutable, resolveAuth } from "./env.mjs";

/** Converts a `claude plugin eval` aggregate result (schemaVersion 1) into a result document. */
export function fromAggregate(agg, { label = "plugin-eval", suite = "plugin-eval", auth = null } = {}) {
  const records = [];
  for (const c of agg.cases ?? [])
    for (const [i, run] of (c.arms?.with ?? []).entries())
      records.push({
        case: c.name,
        run: i + 1,
        pass: (run.passed ?? (run.score ?? 0) >= 1) && !run.error && !run.aborted,
        trace: /** @type {string | null} */ (null),
        failures: [run.error, run.aborted?.reason, ...(run.graders ?? []).filter((g) => g.scored !== false && !g.passed).map((g) => `${g.name}: ${g.explanation}`)].filter(Boolean),
        metrics: {
          cost_usd: run.costUsd ?? 0,
          session_ms: run.durationSeconds !== undefined ? run.durationSeconds * 1000 : null,
          turns: run.turns ?? null,
          tokens_by_model: run.modelUsage ?? {},
          tokens_by_agent: {},
          subagents: [],
          tool_calls: {},
          tool_timings: [],
          score: run.score ?? null,
        },
      });
  return {
    scenario: suite,
    title: "claude plugin eval suite",
    tier: "plugin-eval",
    label,
    auth,
    measured_at: new Date().toISOString(),
    runs: records.length,
    passed: records.filter((r) => r.pass).length,
    pass_rule: "every grader passes (score 1.0)",
    pass: !agg.partial && records.every((r) => r.pass),
    partial_reason: agg.partialReason ?? null,
    cost_usd: agg.costUsd ?? records.reduce((s, r) => s + r.metrics.cost_usd, 0),
    duration_s: agg.durationSeconds ?? null,
    overall_score: agg.aggregates?.overallScore ?? null,
    claude_version: agg.claudeVersion ?? null,
    records,
  };
}

/**
 * Command-line arguments of one `claude plugin eval` run of the plugin copy `target`.
 * @param {string} target
 * @param {{ json?: string, out?: string, maxCostUsd?: number, evalDir?: string, runs?: number, caseGlob?: string, model?: string, concurrency?: number }} [options]
 */
export function evalArgs(target, { json, out, maxCostUsd = 1, evalDir, runs, caseGlob, model, concurrency } = {}) {
  const args = ["--setting-sources", "project,local", "plugin", "eval", target, "--json", json, "--no-publish", "--trust-plugin", "--ablation", "none", "--max-cost-usd", String(maxCostUsd), "--output-dir", out, "--threshold", "1", "--keep-temp"];
  if (evalDir) args.push("--eval-dir", evalDir);
  if (runs) args.push("--runs", String(runs));
  if (caseGlob) args.push("--case", caseGlob);
  if (model) args.push("--model", model);
  if (concurrency) args.push("--concurrency", String(concurrency));
  return args;
}

/** Scratch copy of the plugin without the generator's targets/ and earlier eval results. */
function pluginCopy(pluginDir, dest) {
  const src = resolve(pluginDir);
  // Node 20 passes the filter `\\?\`-prefixed paths on Windows (D-014 F-1).
  const plain = (p) => (p.startsWith("\\\\?\\") ? p.slice(4) : p);
  cpSync(src, dest, { recursive: true, filter: (p) => !/^(targets|evals\/results)(\/|$)/.test(relative(src, plain(p)).split(sep).join("/")) });
  return dest;
}

const stamp = () => new Date().toISOString().replace(/[:.]/g, "-");

/** Suite name of a plugin directory: `plugin-eval-<folder name>` (Windows or POSIX separators). */
export const suiteName = (pluginDir) => `plugin-eval-${basename(resolve(String(pluginDir).replace(/[\\/]+$/, "")))}`;

/** Result file name in evals/results/: `<label>-<suite>-<time>.json`, with no path separator or colon. */
export const resultFileName = (label, suite) => `${label}-${suite}-${stamp()}.json`.replace(/[\\/:]/g, "_");

/**
 * Keeps each run's trace (`--keep-temp` leaves the run sandboxes with their trace.jsonl in the temporary
 * folder) and the raw aggregate in evals/results/transcripts/ (not committed: local paths, account
 * details), sets `records[].trace` to the kept file, and removes the run sandboxes.
 */
export function keepTraces(agg, doc, dir, label) {
  mkdirSync(dir, { recursive: true });
  const t = stamp();
  writeFileSync(join(dir, `${label}-aggregate-${t}.json`), JSON.stringify(agg, null, 2) + "\n");
  const tmp = resolve(tmpdir());
  for (const c of agg.cases ?? [])
    for (const [i, run] of (c.arms?.with ?? []).entries()) {
      if (!run.tracePath || !existsSync(run.tracePath)) continue;
      const kept = join(dir, `${label}-${c.name}-run${i + 1}-${t}.jsonl`.replace(/[\\/:]/g, "_"));
      copyFileSync(run.tracePath, kept);
      const rec = doc.records.find((r) => r.case === c.name && r.run === i + 1);
      if (rec) rec.trace = relative(ROOT, kept).split(sep).join("/");
      const sandbox = dirname(resolve(run.tracePath));
      if (sandbox.startsWith(tmp + sep) && sandbox !== tmp) rmSync(sandbox, { recursive: true, force: true });
    }
}

/** Runs the suite of a plugin; returns `{ status, doc, file }` (`file`: the result document written). */
export function runPluginEval(pluginDir, { evalDir, runs, maxCostUsd = 1, label = "plugin-eval", caseGlob, auth, model, subagentModel, concurrency } = {}) {
  const mode = resolveAuth(auth);
  const out = mkdtempSync(join(tmpdir(), "sdd-plugin-eval-"));
  try {
    const json = join(out, "result.json");
    const target = pluginCopy(pluginDir, join(out, "plugin"));
    const args = evalArgs(target, { json, out: join(out, "results"), maxCostUsd, evalDir, runs, caseGlob, model, concurrency });
    const extra = subagentModel ? { CLAUDE_CODE_SUBAGENT_MODEL: subagentModel } : {};
    const r = spawnSync(claudeExecutable(), args, { env: childEnv(extra, mode), cwd: out, encoding: "utf8", timeout: 3_600_000 });
    let agg;
    try {
      agg = JSON.parse(readFileSync(json, "utf8"));
    } catch {
      throw new Error(`claude plugin eval produced no result (exit ${r.status}): ${(r.stderr || r.stdout).slice(-800)}`);
    }
    try {
      const doc = fromAggregate(agg, { label, suite: suiteName(pluginDir), auth: mode });
      const dir = join(ROOT, "evals", "results");
      mkdirSync(dir, { recursive: true });
      keepTraces(agg, doc, join(dir, "transcripts"), label);
      const file = join(dir, resultFileName(label, doc.scenario));
      writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
      return { status: r.status, doc, file };
    } catch (e) {
      // A paid run's aggregate is never lost with the temporary folder: keep it beside it.
      const kept = join(tmpdir(), `sdd-plugin-eval-aggregate-${stamp()}.json`);
      writeFileSync(kept, JSON.stringify(agg, null, 2) + "\n");
      throw new Error(`${e.message} (aggregate result kept at ${kept})`);
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

// Script entry only (bundled into a test, import.meta.filename is the test file).
if (process.argv[1]?.endsWith("plugin-eval.mjs") && import.meta.filename === process.argv[1]) {
  const argv = process.argv.slice(2);
  const opt = (n) => {
    const i = argv.findIndex((a) => a === `--${n}` || (n === "concurrency" && a === "-j"));
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const target = argv.find((a, i) => !a.startsWith("-") && !argv[i - 1]?.startsWith("-"));
  if (!target) {
    console.error("usage: node evals/harness/plugin-eval.mjs <plugin dir> [--eval-dir d] [--runs n] [--max-cost-usd x] [--label l] [--case glob] [--auth api-key|subscription] [--model m] [--subagent-model m] [-j n]");
    process.exit(2);
  }
  const { doc } = runPluginEval(target, { evalDir: opt("eval-dir"), runs: opt("runs") ? Number(opt("runs")) : undefined, maxCostUsd: Number(opt("max-cost-usd") ?? 1), label: opt("label") ?? "plugin-eval", caseGlob: opt("case"), auth: opt("auth"), model: opt("model"), subagentModel: opt("subagent-model"), concurrency: opt("concurrency") ? Number(opt("concurrency")) : undefined });
  console.log(`${doc.scenario}: ${doc.passed}/${doc.runs} runs passed, score ${doc.overall_score}, cost $${(doc.cost_usd ?? 0).toFixed(4)}${doc.auth === "subscription" ? " (subscription, notional)" : ""} → ${doc.pass ? "PASS" : "FAIL"}`);
  process.exitCode = doc.pass ? 0 : 1;
}
