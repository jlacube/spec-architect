// Eval runner (C001-T-029, C001-ADR-003, C001-ADR-007). Usage:
//   node evals/harness/run.mjs <scenario.eval.mjs>… [--tier dev|milestone|release] [--runs N]
//                              [--max-total-usd X] [--label NAME]
// Each run copies the scenario's fixture into a temporary directory, runs the session through the
// Agent SDK, applies the scenario's assertions and records metrics. Results go to
// evals/results/<label>-<scenario>-<time>.json (transcripts to evals/results/transcripts/, not
// committed). Exit code 1 when a scenario misses the tier's pass rule or the budget is exhausted.
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { makeWorkspace, ROOT } from "./fixtures.mjs";
import { runMetrics } from "./metrics.mjs";
import { runSession } from "./session.mjs";

export const TIERS = {
  dev: { runs: 1, pass: (passed, runs) => passed === runs, rule: "1 / 1" },
  milestone: { runs: 3, pass: (passed, runs) => passed === runs, rule: "3 / 3 (2 / 3 triggers a 10-run check)" },
  release: { runs: 10, pass: (passed, runs) => passed >= Math.ceil(runs * 0.9), rule: "≥ 9 / 10" },
};

export const RESULTS = join(ROOT, "evals", "results");

/** Runs one scenario `runs` times; returns the result document (also written to evals/results/). */
export async function runScenario(scenario, { tier = "dev", runs, label, budget = { spent: 0, limit: 5 }, log = console.log } = {}) {
  const n = runs ?? TIERS[tier].runs;
  const records = [];
  const time = new Date().toISOString().replace(/[:.]/g, "-");
  for (let i = 0; i < n; i++) {
    if (budget.spent >= budget.limit) {
      log(`budget exhausted ($${budget.spent.toFixed(2)} of $${budget.limit}); stopping`);
      break;
    }
    const ws = makeWorkspace(scenario.fixture ?? null);
    try {
      const prompt = typeof scenario.prompt === "function" ? scenario.prompt(ws.root) : scenario.prompt;
      const session = await runSession({
        cwd: ws.root,
        prompt,
        agent: scenario.agent,
        plugins: (scenario.plugins ?? [join(ROOT, "plugins", "architect")]).map((p) => (typeof p === "function" ? p() : resolve(ROOT, p))),
        answer: scenario.answer,
        allowTools: scenario.allowTools ?? [],
        maxTurns: scenario.maxTurns ?? 30,
        maxBudgetUsd: Math.min(scenario.maxBudgetUsd ?? 0.5, 0.5),
        model: scenario.model,
        env: scenario.env ?? {},
      });
      const failures = [];
      try {
        const r = await scenario.assert({ ...session, root: ws.root });
        if (Array.isArray(r)) failures.push(...r);
      } catch (e) {
        failures.push(`assertion threw: ${e instanceof Error ? e.message : String(e)}`);
      }
      const metrics = runMetrics(session.transcript, session.result, session.wallMs);
      budget.spent += metrics.cost_usd;
      const transcriptFile = join(RESULTS, "transcripts", `${scenario.id}-${time}-run${i + 1}.json`);
      mkdirSync(join(RESULTS, "transcripts"), { recursive: true });
      writeFileSync(transcriptFile, JSON.stringify(session.transcript, null, 1) + "\n");
      records.push({ run: i + 1, pass: failures.length === 0, failures, metrics, transcript: `evals/results/transcripts/${basename(transcriptFile)}` });
      log(`${scenario.id} run ${i + 1}/${n}: ${failures.length === 0 ? "pass" : `FAIL (${failures.join("; ")})`} · $${metrics.cost_usd.toFixed(4)} · ${(metrics.session_ms / 1000).toFixed(1)} s`);
    } finally {
      ws.cleanup();
    }
  }
  const passed = records.filter((r) => r.pass).length;
  const doc = {
    scenario: scenario.id,
    title: scenario.title,
    tier,
    label: label ?? tier,
    agent: scenario.agent ?? null,
    measured_at: new Date().toISOString(),
    runs: records.length,
    passed,
    pass_rule: TIERS[tier].rule,
    pass: records.length === n && TIERS[tier].pass(passed, n),
    cost_usd: records.reduce((s, r) => s + r.metrics.cost_usd, 0),
    records,
  };
  mkdirSync(RESULTS, { recursive: true });
  writeFileSync(join(RESULTS, `${doc.label}-${scenario.id}-${time}.json`), JSON.stringify(doc, null, 2) + "\n");
  return doc;
}

async function main(argv) {
  const files = argv.filter((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
  const opt = (name, def) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : def;
  };
  const tier = opt("tier", "dev");
  if (!TIERS[tier]) throw new Error(`unknown tier ${tier}; use dev, milestone or release`);
  const runs = opt("runs") ? Number(opt("runs")) : undefined;
  const budget = { spent: 0, limit: Number(opt("max-total-usd", "5")) };
  let ok = true;
  for (const f of files) {
    const scenario = (await import(pathToFileURL(resolve(f)).href)).default;
    const doc = await runScenario(scenario, { tier, runs, label: opt("label"), budget });
    console.log(`${doc.scenario}: ${doc.passed}/${doc.runs} passed (rule ${doc.pass_rule}) → ${doc.pass ? "PASS" : "FAIL"} · $${doc.cost_usd.toFixed(4)}`);
    ok &&= doc.pass;
  }
  console.log(`total cost $${budget.spent.toFixed(4)} (limit $${budget.limit})`);
  process.exitCode = ok ? 0 : 1;
}

// Script entry only (bundled into a test, import.meta.filename is the test file).
if (process.argv[1]?.endsWith("run.mjs") && import.meta.filename === process.argv[1]) await main(process.argv.slice(2));
