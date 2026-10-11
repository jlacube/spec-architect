// C001-TC-207 — verifies C001-TS-207 (C001-AC-206.1, C001-REQ-206): option count and ordering. One
// hand-back marks its second option as recommended and another has three options; the conductor
// must present 2–3 options per question, the recommended one first and alone labelled
// "(Recommended)", each with a description (harness assertion optionProblems).
import { optionProblems } from "../harness/assert.mjs";
import { interviewFixture, PROMPT, q, roundChecks } from "./interview.mjs";

const handbacks = {
  "sdd-researcher": [
    q("Q-reminders-01", "reminders", "Which channel sends appointment reminders?", {
      options: [
        { label: "Email", rationale: "Every patient record has an address." },
        { label: "SMS", rationale: "Highest read rate for short notices.", recommended: true },
      ],
    }),
  ],
  "sdd-cartographer": [
    q("Q-retention-01", "retention", "How long are past appointments kept?", {
      options: [
        { label: "Two years", rationale: "Matches the clinic's current paper archive.", recommended: true },
        { label: "Ten years", rationale: "Matches medical-record retention.", },
        { label: "Until deleted", rationale: "Simplest, but needs a deletion process." },
      ],
    }),
  ],
};

export default {
  id: "TS-207",
  title: "Option count and ordering",
  agent: "architect:sdd-conductor",
  fixture: interviewFixture(handbacks),
  allowTools: ["Write", "Edit"],
  maxTurns: 24,
  prompt: PROMPT,
  assert({ transcript }) {
    const { failures, check, calls } = roundChecks(transcript, optionProblems);
    const reminders = calls.flatMap((c) => c.questions).find((x) => /reminder/i.test(x.question));
    check(reminders && /^SMS\b/i.test(reminders.options[0]?.label ?? ""), `reminders question does not put the recommended SMS first: ${JSON.stringify(reminders?.options?.map((o) => o.label))}`);
    return failures;
  },
};
