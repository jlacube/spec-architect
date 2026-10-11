// C001-TC-206 — verifies C001-TS-206 (C001-AC-205.1, C001-REQ-205): round size limit. Three specialists
// hand back 9 distinct questions; every AskUserQuestion call holds 1–4 of them and all 9 are asked.
import { optionProblems } from "../harness/assert.mjs";
import { interviewFixture, PROMPT, q, readLog, roundChecks } from "./interview.mjs";

// One distinctive keyword per question, so a reworded question can still be recognised.
const QUESTIONS = [
  ["researcher", q("Q-calendar-01", "calendar", "Should bookings sync with the clinicians' calendar provider?")],
  ["researcher", q("Q-reminders-01", "reminders", "Which channel sends appointment reminders?")],
  ["researcher", q("Q-payments-01", "payments", "Must patients pay a deposit when booking?")],
  ["cartographer", q("Q-languages-01", "languages", "Which languages must the booking pages support?")],
  ["cartographer", q("Q-waitlist-01", "waitlist", "Should cancelled slots be offered to a waitlist?")],
  ["cartographer", q("Q-accessibility-01", "accessibility", "Which accessibility level must the booking pages meet?")],
  ["options-analyst", q("Q-retention-01", "retention", "How long are past appointments kept?")],
  ["options-analyst", q("Q-overbooking-01", "overbooking", "May clinicians allow overbooking of a slot?")],
  ["options-analyst", q("Q-telehealth-01", "telehealth", "Are video (telehealth) appointments in scope for v1?")],
];
const KEYWORDS = ["calendar", "reminder", "deposit", "language", "waitlist", "accessib", "kept|retention|retain", "overbook", "video|telehealth"];

const handbacks = {};
for (const [agent, question] of QUESTIONS) (handbacks[`sdd-${agent}`] ??= []).push(question);

export default {
  id: "TS-206",
  title: "Round size limit",
  agent: "architect:sdd-conductor",
  fixture: interviewFixture(handbacks),
  allowTools: ["Write", "Edit"],
  maxTurns: 30,
  prompt: PROMPT,
  assert({ transcript, root }) {
    const { failures, check, calls } = roundChecks(transcript, optionProblems);
    check(calls.length >= 3, `9 questions need at least 3 rounds, got ${calls.length}`);
    const asked = calls.flatMap((c) => c.questions.map((x) => `${x.header} ${x.question}`.toLowerCase()));
    for (const k of KEYWORDS) check(asked.some((a) => new RegExp(k).test(a)), `no question about /${k}/ was asked`);
    const log = readLog(root);
    for (const [, x] of QUESTIONS) check(log.includes(x.id), `${x.id} not in questions-log.md`);
    return failures;
  },
};
