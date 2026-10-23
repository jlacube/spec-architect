// Delegation (routing) eval suite of C001-REQ-1116 (C001-T-063; C001-ADR-007). The prompts and their
// graders are `claude plugin eval` case files under plugins/architect/evals/<case>/ (prompt.md +
// graders/*.md), the location PLG-EVAL-001 checks and the eval command reads. This module derives the
// expectations from those files and runs the suite through `claude plugin eval` (harness/plugin-eval.mjs),
// writing evals/results/delegation-plugin-eval-architect-<time>.json.
//
// Cases (built from the trigger-word ownership of C001-IF-09, "Descriptions (routing contract)"):
// - route-<agent>-nn: a prompt with the agent's trigger words; must route to architect:<agent> and to no
//   other Architect agent;
// - route-conductor-nn: the conductor is started as the main session and never as a subagent
//   (C001-IF-09 A0), so in a default session the right route is the hand-over: the reply names
//   literal `claude --agent architect:sdd-conductor` and no Architect subagent starts (CHG-001 D-016);
//   notroute-conductor-01 also fails when the reply hands over;
// - notroute-<agent>-nn: a near miss (a sibling's trigger words); must route to the owner and must not
//   route to <agent>;
// - offtopic-nn: no Architect agent at all.
// Every case sets `disallowed_tools: [Skill]`: the plugin's commands (/architect:research, :decide, :lint,
// :status, …) are conductor entry points that, outside the conductor session, reply with the hand-over and
// start nothing (diagnostic run t063-diag, 2026-10-23: route-researcher-01 called Skill architect:research).
// Without them the main session decides on the agent descriptions, the routing contract of C001-IF-09.
// Routing accuracy (C001-SC-05, ≥ 90%) = passed runs / runs; a run passes when all its graders pass.
//
// Usage: node evals/delegation/suite.mjs [--runs N] [--case <glob>] [--max-cost-usd X]
//          [--auth subscription|api-key] [--model M] [--subagent-model M] [-j N] [--label NAME] [--implicit]
// --implicit runs the implicit set (plugins/architect/evals-implicit/, no delegation hint, 1 run per case;
// default label delegation-implicit). It is reported apart and counts toward neither the 90 % nor PLG-EVAL-001.
// Defaults: --auth subscription, --subagent-model haiku (the main thread's choice is graded, not the
// subagent's work), --max-cost-usd 0.50, runs per case from the case files (3, the milestone tier).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { grade, loadCases } from "../harness/cases.mjs";
import { ROOT } from "../harness/fixtures.mjs";
import { caseRouting } from "../../scripts/check/evals.mjs";

export const PLUGIN = join(ROOT, "plugins", "architect");
export const EVAL_DIR = join(PLUGIN, "evals");
export const IMPLICIT_EVAL_DIR = join(PLUGIN, "evals-implicit");

/** The ten agent names (sdd-…) and the ones started only as the main session. */
export function agents(plugin = PLUGIN) {
  const dir = join(plugin, "agents");
  const names = readdirSync(dir).filter((n) => /^sdd-.+\.md$/.test(n)).map((n) => n.slice(0, -3));
  const mainSessionOnly = new Set(names.filter((a) => /do not invoke it as a subagent/i.test(readFileSync(join(dir, `${a}.md`), "utf8").split(/\r?\n---/)[0])));
  return { names, mainSessionOnly };
}

/** The suite: one entry per case with its prompt, run options and routing expectations. */
export function suite(evalDir = EVAL_DIR, plugin = PLUGIN) {
  const { names, mainSessionOnly } = agents(plugin);
  return loadCases(evalDir).map((c) => {
    const texts = readdirSync(join(c.dir, "graders")).filter((f) => f.endsWith(".md")).map((g) => readFileSync(join(c.dir, "graders", g), "utf8"));
    const { must, mustNot, problems } = caseRouting(texts, names, mainSessionOnly);
    return { name: c.name, prompt: c.prompt, options: c.options, graders: c.graders, must, mustNot, problems };
  });
}

const TIMED_OUT = /\btimed out\b/i;

/** The kept trace (JSONL of SDK messages) in the transcript shape of harness/assert.mjs. */
export function traceTranscript(text) {
  return String(text)
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .flatMap((l, i) => {
      try {
        return [{ t: i, type: "sdk", message: JSON.parse(l) }];
      } catch {
        return [];
      }
    });
}

/**
 * Re-grades the runs that `claude plugin eval` failed only because they timed out (the session was still
 * waiting for its subagent; the routing decision is in the trace): each such record gets
 * `regraded: { pass, failures, reason }` from the case's own deterministic graders (harness/cases.mjs
 * `grade`) applied to its kept trace. The raw `pass` and `failures` are never changed. Sets
 * `doc.regraded = { passed, runs, regraded }`: passed runs counting re-graded verdicts, all runs, and the
 * number of runs re-graded. `readTrace(rec)` returns the trace text or null (default: the kept file).
 */
export function regradeTimeouts(doc, cases, readTrace = (rec) => (rec.trace ? readFileSync(join(ROOT, rec.trace), "utf8") : null)) {
  const byName = new Map(cases.map((c) => [c.name, c]));
  let regraded = 0;
  for (const rec of doc.records) {
    if (rec.pass || !rec.failures.some((f) => TIMED_OUT.test(f))) continue;
    regraded++;
    const c = byName.get(rec.case);
    let text = null;
    try {
      text = readTrace(rec);
    } catch {
      text = null;
    }
    if (!c || text === null) {
      rec.regraded = { pass: false, failures: [!c ? `no case ${rec.case} in the suite` : "timed out and no trace was kept"], reason: "timed out; not re-gradable" };
      continue;
    }
    const failed = grade(c.graders, { transcript: traceTranscript(text), created: [] }).filter((g) => !g.passed);
    rec.regraded = { pass: failed.length === 0, failures: failed.map((g) => `${g.name}: ${g.explanation}`), reason: "timed out; re-graded from the kept trace" };
  }
  doc.regraded = { passed: doc.records.filter((r) => (r.regraded ? r.regraded.pass : r.pass)).length, runs: doc.records.length, regraded };
  return doc;
}

/** Per-agent counts of must-route and must-not-route prompts. */
export function counts(cases, names = agents().names) {
  const out = Object.fromEntries(names.map((a) => [a, { must: 0, mustNot: 0 }]));
  for (const c of cases) {
    c.must.forEach((a) => out[a].must++);
    c.mustNot.forEach((a) => out[a].mustNot++);
  }
  return out;
}

// Script entry only.
if (process.argv[1]?.endsWith("suite.mjs") && import.meta.filename === process.argv[1]) {
  const argv = process.argv.slice(2);
  const opt = (n, d) => {
    const i = argv.findIndex((a) => a === `--${n}` || (n === "concurrency" && a === "-j"));
    return i >= 0 ? argv[i + 1] : d;
  };
  const implicit = argv.includes("--implicit");
  if (argv.includes("--list")) {
    const cases = suite();
    console.log(`${cases.length} prompts`);
    console.table(counts(cases));
    console.log(`implicit set: ${suite(IMPLICIT_EVAL_DIR).map((c) => c.name).join(", ")}`);
  } else {
    const { runPluginEval } = await import("../harness/plugin-eval.mjs");
    const { doc, file } = runPluginEval(PLUGIN, {
      evalDir: implicit ? "evals-implicit" : undefined,
      runs: opt("runs") ? Number(opt("runs")) : undefined,
      caseGlob: opt("case"),
      maxCostUsd: Number(opt("max-cost-usd", "0.5")),
      auth: opt("auth", "subscription"),
      model: opt("model"),
      subagentModel: opt("subagent-model", "haiku"),
      concurrency: opt("concurrency") ? Number(opt("concurrency")) : undefined,
      label: opt("label", implicit ? "delegation-implicit" : "delegation"),
    });
    // Raw verdicts of claude plugin eval stay as they are; timed-out runs are re-graded beside them.
    regradeTimeouts(doc, suite(implicit ? IMPLICIT_EVAL_DIR : EVAL_DIR));
    writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
    const pct = (n) => (doc.runs ? ((n / doc.runs) * 100).toFixed(1) : "0.0");
    const re = doc.regraded;
    console.log(`delegation${implicit ? " (implicit set, not counted)" : ""}: raw ${doc.passed}/${doc.runs} (${pct(doc.passed)}%) · re-graded ${re.passed}/${re.runs} (${pct(re.passed)}%, ${re.regraded} timed-out run(s) re-graded) · cost $${doc.cost_usd.toFixed(4)}${doc.auth === "subscription" ? " notional (subscription)" : ""}, ${doc.duration_s ?? "?"} s${doc.partial_reason ? `, partial: ${doc.partial_reason}` : ""}`);
    for (const r of doc.records) {
      const reg = r.regraded ? ` → re-graded ${r.regraded.pass ? "pass" : "FAIL"}${r.regraded.failures.length ? ` (${r.regraded.failures.join("; ")})` : ""}` : "";
      console.log(`  ${r.pass ? "pass" : "FAIL"} ${r.case} #${r.run} · $${r.metrics.cost_usd.toFixed(4)} · ${r.metrics.turns ?? "?"} turns · ${r.metrics.session_ms ?? "?"} ms${r.failures.length ? ` · ${r.failures.join("; ")}` : ""}${reg}`);
    }
    process.exitCode = doc.partial_reason ? 2 : (doc.runs ? re.passed / doc.runs : 0) >= 0.9 ? 0 : 1;
  }
}
