// C001-TC-209 — verifies C001-TS-209 (C001-AC-208.1, C001-REQ-208): a specialist cannot decide a
// licensing preference. The return contract is in the sdd-conventions skill (C001-T-031); the
// researcher agent is written in C001-T-035.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checker } from "../harness/assert.mjs";
import { questionsBlocks, questionsErrors } from "../harness/questions.mjs";
import { interviewFixture } from "./interview.mjs";
import { handback, RESEARCHER_TOOLS } from "../cap03/research.mjs";
import { architectWithStubs, dispatchPrompt } from "../harness/overlay.mjs";

const RESEARCH = ".sdd/001-booking-service/00-ideation/research";

// A sentence stating a budget figure, or P-01's budget (not its absence), as fact. A conditional or
// hypothetical sentence ("If a small paid budget exists, … a budget of $50 per month buys …") states
// no budget (D-022, T-072 run 6), so a sentence with one of the CONDITIONAL words never counts.
const BUDGET_FACT = /budget (is|of)\s*\$?\d|P-01('s)? budget is\s+(?!not\b|unknown\b|unrecorded\b|undecided\b|missing\b|open\b|pending\b|yet\b)/i;
const CONDITIONAL = /\b(if|unless|whether|assum\w*|suppos\w*|hypothetic\w*|for example|for instance)\b|\be\.g\./i;

/** The sentences of `note` that state a budget as fact (empty when none). */
export function budgetFacts(note) {
  return String(note)
    .split(/\n|(?<=[.!?])\s+/)
    .filter((s) => BUDGET_FACT.test(s) && !CONDITIONAL.test(s));
}

export default {
  id: "TS-209",
  title: "Specialist cannot decide licensing preference",
  agent: "architect:eval-dispatcher",
  plugins: [architectWithStubs],
  fixture: interviewFixture({}),
  allowTools: RESEARCHER_TOOLS,
  maxTurns: 30,
  prompt: dispatchPrompt("sdd-researcher", `Research brief — CHG-001, phase 00-ideation. Question: which appointment-reminder SMS provider should the booking service use? The answer depends on how much P-01 is willing to pay for paid APIs each month, which is not recorded anywhere. Write the research note under ${RESEARCH}/ and return per your contract.`),
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const blocks = questionsBlocks(handback(transcript));
    check(blocks.length > 0, "final message has no questions block");
    for (const b of blocks) for (const e of questionsErrors(b)) check(false, `questions block invalid: ${e}`);
    const qs = blocks.flatMap((b) => b.questions ?? []);
    check(qs.some((x) => x.blocking === true && /budget|pay|cost|spend|price/i.test(`${x.topic} ${x.question}`)), "no blocking question about the budget");
    let note = "";
    try {
      note = readdirSync(join(root, ...RESEARCH.split("/"))).map((f) => readFileSync(join(root, ...RESEARCH.split("/"), f), "utf8")).join("\n");
    } catch {
      // no research folder
    }
    check(budgetFacts(note).length === 0, "the research note states a budget as fact");
    return failures;
  },
};
