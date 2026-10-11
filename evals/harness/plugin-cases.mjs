// Runs `claude plugin eval` case files (prompt.md + graders/*.md, C001-REQ-1116) through the Agent SDK
// harness (C001-ADR-007). `claude plugin eval` itself needs an authentication variable for its
// isolated child sessions (for example a token from `claude setup-token`); this runner uses the
// on-disk login of the desktop-bundled Claude Code instead, so routing suites run without one.
// Deterministic graders are supported: regex, tool_used, tool_order, file_exists. `llm` and
// `baseline` graders are reported as not run.
// Usage: node evals/harness/plugin-cases.mjs <plugin dir> [--eval-dir evals] [--case <substring>]
//                                             [--runs N] [--max-total-usd X] [--label NAME]
import { join, resolve } from "node:path";
import { toolCalls } from "./assert.mjs";
import { grade, loadCases } from "./cases.mjs";
import { ROOT } from "./fixtures.mjs";
import { runScenario } from "./run.mjs";

/** Scenario for the SDK runner from one case: default main session with the plugin loaded. */
export function caseScenario(pluginDir, c) {
  return {
    id: `case-${c.name.replace(/[^\w-]+/g, "_")}`,
    title: c.options.description ?? c.name,
    agent: undefined,
    plugins: [pluginDir],
    fixture: null,
    allowTools: c.options.allowed_tools ?? [],
    maxTurns: c.options.max_turns ?? 10,
    model: c.options.model,
    prompt: c.prompt,
    assert({ transcript }) {
      const created = toolCalls(transcript, "Write").map((w) => String(w.input?.file_path ?? "").replace(/\\/g, "/"));
      return grade(c.graders, { transcript, created }).filter((g) => !g.passed).map((g) => `${g.name}: ${g.explanation}`);
    },
  };
}

// Script entry only (bundled into a test, import.meta.filename is the test file).
if (process.argv[1]?.endsWith("plugin-cases.mjs") && import.meta.filename === process.argv[1]) {
  const argv = process.argv.slice(2);
  const opt = (n, d) => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 ? argv[i + 1] : d;
  };
  const target = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
  const pluginDir = resolve(ROOT, target);
  const cases = loadCases(join(pluginDir, opt("eval-dir", "evals"))).filter((c) => !opt("case") || c.name.includes(opt("case")));
  const budget = { spent: 0, limit: Number(opt("max-total-usd", "5")) };
  let ok = true;
  for (const c of cases) {
    const doc = await runScenario(caseScenario(pluginDir, c), { tier: "dev", runs: Number(opt("runs", String(c.options.runs ?? 1))), label: opt("label", "cases"), budget });
    console.log(`${c.name}: ${doc.passed}/${doc.runs} passed · $${doc.cost_usd.toFixed(4)}`);
    ok &&= doc.passed === doc.runs;
  }
  console.log(`total cost $${budget.spent.toFixed(4)} (limit $${budget.limit})`);
  process.exitCode = ok ? 0 : 1;
}
