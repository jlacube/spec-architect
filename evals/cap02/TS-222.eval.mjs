// C001-TC-222 — verifies C001-TS-222 (C001-AC-220.1, C001-REQ-220): fatigue guard. Five rounds are
// already logged in the ideation phase and only non-blocking questions remain; round six includes an
// option to resolve the remaining non-blocking questions with their recommendations.
import { optionProblems } from "../harness/assert.mjs";
import { interviewFixture, PROMPT, q, roundChecks } from "./interview.mjs";

const handbacks = {
  "sdd-researcher": [
    q("Q-calendar-01", "calendar", "Should bookings sync with the clinicians' calendar provider?"),
    q("Q-reminders-01", "reminders", "Which channel sends appointment reminders?"),
    q("Q-languages-01", "languages", "Which languages must the booking pages support?"),
  ],
  "sdd-cartographer": [
    q("Q-waitlist-01", "waitlist", "Should cancelled slots be offered to a waitlist?"),
    q("Q-retention-01", "retention", "How long are past appointments kept?"),
  ],
};

export default {
  id: "TS-222",
  title: "Fatigue guard",
  agent: "architect:sdd-conductor",
  fixture: interviewFixture(handbacks, { rounds: 5 }),
  allowTools: ["Write", "Edit"],
  maxTurns: 24,
  prompt: PROMPT,
  assert({ transcript }) {
    const { failures, check, calls } = roundChecks(transcript, optionProblems);
    const round6 = calls[0]?.questions ?? [];
    const shortcut = round6.flatMap((x) => x.options ?? []).some((o) => /recommend/i.test(`${o.label} ${o.description}`) && /remain|all|rest|other/i.test(`${o.label} ${o.description}`));
    check(shortcut, `round six offers no option to resolve the remaining questions with recommendations: ${JSON.stringify(round6.map((x) => x.options?.map((o) => o.label)))}`);
    return failures;
  },
};
