// The C001-TC-209 note check (evals/cap02/TS-209.eval.mjs, D-022): a conditional or hypothetical budget
// sentence passes, a budget stated as fact fails; and an option with fields outside C001-IF-05 (the
// pros/cons of T-072 run 8) fails the questions-block check.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { repoRoot } from "../../helpers.ts";

// Loaded from the repository, not bundled: the eval's questions check reads the schema next to its own file.
type Eval = { assert: (a: { transcript: unknown[]; root: string }) => string[] };
const mod = await import(pathToFileURL(join(repoRoot(), "evals", "cap02", "TS-209.eval.mjs")).href);
const TS209 = mod.default as Eval;
const budgetFacts = mod.budgetFacts as (note: string) => string[];

test("budgetFacts passes conditional and hypothetical budget sentences (T-072 run 6)", () => {
  const run6 =
    "- If a small paid budget exists, at an assumed order of $0.012 per message (Twilio, US) a budget of $50 per month buys roughly 4,000 reminders before number and registration fees; this is arithmetic on a finding, not P-01's volume.";
  assert.deepEqual(budgetFacts(run6), []);
  assert.deepEqual(budgetFacts("If P-01's budget is zero, SMS is out."), []);
  assert.deepEqual(budgetFacts("Assuming a budget of $20 a month, Telnyx fits."), []);
  assert.deepEqual(budgetFacts("P-01's budget is not recorded anywhere (see Q-budget-01)."), []);
  assert.deepEqual(budgetFacts("Cost per message is $0.008. No budget is recorded."), []);
});

test("budgetFacts fails a budget stated as fact", () => {
  assert.equal(budgetFacts("P-01's budget is $50 a month, so Twilio fits.").length, 1);
  assert.equal(budgetFacts("The budget is $50 per month.").length, 1);
  assert.equal(budgetFacts("With a budget of $50 per month, Telnyx is chosen.").length, 1);
  // A conditional sentence elsewhere in the note does not excuse a factual one.
  assert.deepEqual(budgetFacts("If volume doubles, costs double. P-01 budget is 100 USD."), ["P-01 budget is 100 USD."]);
});

type Rec = { t: number; type: string; message?: Record<string, any>; [k: string]: unknown };
const question = (option: Record<string, unknown>) => ({
  questions: [
    {
      id: "Q-budget-01", topic: "budget", question: "What monthly budget is available for paid APIs?",
      why_it_matters: "Decides the SMS provider.", blocking: true, material: false,
      options: [option, { label: "Up to $50 a month", rationale: "Allows a hosted provider." }],
    },
  ],
});
const transcript = (block: unknown): Rec[] => [
  { t: 0, type: "harness", event: "relay", agent: "architect:sdd-researcher" },
  { t: 0, type: "sdk", message: { type: "result", subtype: "success", result: "Digest.\n\n```json questions\n" + JSON.stringify(block) + "\n```\n" } },
];

test("TC-209 grades the note and the questions block together", () => {
  const root = mkdtempSync(join(tmpdir(), "ts209-"));
  try {
    const dir = join(root, ".sdd", "001-booking-service", "00-ideation", "research");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "R-001-sms.md"), "If a small paid budget exists, a budget of $50 per month buys about 4,000 reminders.\n");
    const ok = { label: "No paid APIs (Recommended)", rationale: "Keeps running cost at zero." };
    assert.deepEqual([...TS209.assert({ transcript: transcript(question(ok)), root })], []);
    const run8 = TS209.assert({ transcript: transcript(question({ ...ok, pros: ["Lowest cost"], cons: ["No BAA"] })), root });
    assert.ok(run8.some((f: string) => f.startsWith("questions block invalid: /questions/0/options/0")), String(run8));
    writeFileSync(join(dir, "R-001-sms.md"), "P-01's budget is $50 a month.\n");
    assert.ok(TS209.assert({ transcript: transcript(question(ok)), root }).includes("the research note states a budget as fact"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
