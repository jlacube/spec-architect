// C001-TC-211 — verifies C001-TS-211 (C001-AC-210.1, C001-REQ-210): free-text answer logged verbatim.
// Round 1 is already logged; the step's four questions form round 2, and P-01 answers its third
// question in free text. questions-log.md gets a "Round 2" section whose third question carries its
// options, its recommendation and exactly that answer.
import { optionProblems } from "../harness/assert.mjs";
import { interviewFixture, PROMPT, q, readLog, roundChecks, roundSection } from "./interview.mjs";

const FREE = "1 + search for other tools we might have missed";

const handbacks = {
  "sdd-researcher": [
    q("Q-calendar-01", "calendar", "Should bookings sync with the clinicians' calendar provider?"),
    q("Q-reminders-01", "reminders", "Which channel sends appointment reminders?"),
    q("Q-tools-01", "tools", "Which existing scheduling tools should the research compare against?", {
      options: [
        { label: "Top three SaaS tools", rationale: "Covers most of the market with little effort.", recommended: true },
        { label: "Open-source tools only", rationale: "Self-hostable options the clinic could run." },
      ],
    }),
    q("Q-waitlist-01", "waitlist", "Should cancelled slots be offered to a waitlist?"),
  ],
};

export default {
  id: "TS-211",
  title: "Free-text answer logged verbatim",
  agent: "architect:sdd-conductor",
  fixture: interviewFixture(handbacks, { rounds: 1 }),
  allowTools: ["Write", "Edit"],
  maxTurns: 24,
  prompt: PROMPT,
  // Question 3 of the first round asked (round 2 of the phase) gets the free text.
  answer: (question, input) => (input.questions.indexOf(question) === 2 ? FREE : question.options[0].label),
  assert({ transcript, root }) {
    const { failures, check, calls } = roundChecks(transcript, optionProblems);
    const third = calls[0]?.questions?.[2];
    check(third, "the first round asked has fewer than 3 questions");
    const r2 = roundSection(readLog(root), 2);
    check(r2, "questions-log.md has no Round 2 section");
    const entries = (r2 ?? "").split(/^### /m).slice(1);
    const e3 = entries[2] ?? "";
    check(entries.length >= 3, `Round 2 has ${entries.length} questions`);
    const answer = /^\s*[-*]?\s*\**Answer\**:\**\s*(.*)$/m.exec(e3)?.[1]?.trim().replace(/^["“>`]|["”`]$/g, "") ?? "";
    check(answer === FREE, `question 3 answer is not verbatim: ${JSON.stringify(answer)}`);
    check(/Recommended/.test(e3) && (third?.options ?? []).every((o) => e3.includes(o.label.replace(/\s*\(Recommended\)$/, ""))), `question 3 entry lacks its options or recommendation:\n${e3}`);
    return failures;
  },
};
