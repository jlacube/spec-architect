// C001-TC-209 — verifies C001-TS-209 (C001-AC-208.1, C001-REQ-208): a specialist cannot decide a
// licensing preference. The return contract is in the sdd-conventions skill (C001-T-031); the
// researcher agent is written in C001-T-035, so run this scenario once that agent exists.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checker, finalReply } from "../harness/assert.mjs";
import { questionsBlocks, questionsErrors } from "../harness/questions.mjs";
import { interviewFixture } from "./interview.mjs";

const RESEARCH = ".sdd/001-booking-service/00-ideation/research";

export default {
  id: "TS-209",
  title: "Specialist cannot decide licensing preference",
  agent: "architect:sdd-researcher",
  fixture: interviewFixture({}),
  allowTools: ["Write", "WebSearch", "WebFetch"],
  maxTurns: 30,
  prompt: `Research brief — CHG-001, phase 00-ideation. Question: which appointment-reminder SMS provider should the booking service use? The answer depends on how much P-01 is willing to pay for paid APIs each month, which is not recorded anywhere. Write the research note under ${RESEARCH}/ and return per your contract.`,
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const blocks = questionsBlocks(finalReply(transcript));
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
    check(!/budget (is|of)\s*\$?\d|P-01('s)? budget is/i.test(note), "the research note states a budget as fact");
    return failures;
  },
};
