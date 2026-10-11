// `claude plugin eval` integration (C001-ADR-007): routing and delegation suites (C001-REQ-1116,
// C001-T-063) use Claude Code's own eval command with deterministic `tool_used` graders. This
// wrapper runs it with the desktop-bundled Claude Code, a cost ceiling and no publishing, and
// converts its aggregate-result.json into a result document of evals/results/ so the metrics
// report covers both mechanisms.
// Usage: node evals/harness/plugin-eval.mjs <plugin dir> [--eval-dir <dir>] [--runs N]
//                                            [--max-cost-usd X] [--label NAME] [--case <glob>]
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ROOT } from "./fixtures.mjs";
import { childEnv, claudeExecutable } from "./env.mjs";

/** Converts a `claude plugin eval` aggregate result (schemaVersion 1) into a result document. */
export function fromAggregate(agg, { label = "plugin-eval", suite = "plugin-eval" } = {}) {
  const records = [];
  for (const c of agg.cases ?? [])
    for (const [i, run] of (c.arms?.with ?? []).entries())
      records.push({
        case: c.name,
        run: i + 1,
        pass: (run.passed ?? (run.score ?? 0) >= 1) && !run.error && !run.aborted,
        failures: [run.error, run.aborted?.reason, ...(run.graders ?? []).filter((g) => g.scored !== false && !g.passed).map((g) => `${g.name}: ${g.explanation}`)].filter(Boolean),
        metrics: {
          cost_usd: run.costUsd ?? 0,
          session_ms: run.durationSeconds !== undefined ? run.durationSeconds * 1000 : null,
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
    measured_at: new Date().toISOString(),
    runs: records.length,
    passed: records.filter((r) => r.pass).length,
    pass_rule: "every grader passes (score 1.0)",
    pass: !agg.partial && records.every((r) => r.pass),
    partial_reason: agg.partialReason ?? null,
    cost_usd: agg.costUsd ?? records.reduce((s, r) => s + r.metrics.cost_usd, 0),
    overall_score: agg.aggregates?.overallScore ?? null,
    claude_version: agg.claudeVersion ?? null,
    records,
  };
}

/** Runs the suite of a plugin; returns `{ status, doc }`. */
export function runPluginEval(pluginDir, { evalDir, runs, maxCostUsd = 1, label = "plugin-eval", caseGlob } = {}) {
  const out = mkdtempSync(join(tmpdir(), "sdd-plugin-eval-"));
  try {
    const json = join(out, "result.json");
    const args = ["plugin", "eval", resolve(pluginDir), "--json", json, "--no-publish", "--trust-plugin", "--ablation", "none", "--max-cost-usd", String(maxCostUsd), "--output-dir", out, "--threshold", "1"];
    if (evalDir) args.push("--eval-dir", evalDir);
    if (runs) args.push("--runs", String(runs));
    if (caseGlob) args.push("--case", caseGlob);
    const r = spawnSync(claudeExecutable(), args, { env: childEnv(), encoding: "utf8", timeout: 3_600_000 });
    let agg;
    try {
      agg = JSON.parse(readFileSync(json, "utf8"));
    } catch {
      throw new Error(`claude plugin eval produced no result (exit ${r.status}): ${(r.stderr || r.stdout).slice(-800)}`);
    }
    const suite = `plugin-eval-${pluginDir.split(/[\\/]/).filter(Boolean).at(-1)}`;
    const doc = fromAggregate(agg, { label, suite });
    const dir = join(ROOT, "evals", "results");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${label}-${suite}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`), JSON.stringify(doc, null, 2) + "\n");
    return { status: r.status, doc };
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

// Script entry only (bundled into a test, import.meta.filename is the test file).
if (process.argv[1]?.endsWith("plugin-eval.mjs") && import.meta.filename === process.argv[1]) {
  const argv = process.argv.slice(2);
  const opt = (n) => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const target = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
  if (!target) {
    console.error("usage: node evals/harness/plugin-eval.mjs <plugin dir> [--eval-dir d] [--runs n] [--max-cost-usd x] [--label l] [--case glob]");
    process.exit(2);
  }
  const { doc } = runPluginEval(target, { evalDir: opt("eval-dir"), runs: opt("runs") ? Number(opt("runs")) : undefined, maxCostUsd: Number(opt("max-cost-usd") ?? 1), label: opt("label") ?? "plugin-eval", caseGlob: opt("case") });
  console.log(`${doc.scenario}: ${doc.passed}/${doc.runs} runs passed, score ${doc.overall_score}, cost $${(doc.cost_usd ?? 0).toFixed(4)} → ${doc.pass ? "PASS" : "FAIL"}`);
  process.exitCode = doc.pass ? 0 : 1;
}
