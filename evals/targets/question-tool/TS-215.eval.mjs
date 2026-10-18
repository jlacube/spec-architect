// C002-TC-215 — verifies C002-TS-215 (C002-AC-211.1, C002-REQ-211; C002-T-037): the conductor asks P-01
// through its host's question tool in rounds of at most four questions. Scenario Outline, one case per
// Examples row:
//   TS-215-claude-code-4  Claude Code, 4 questions → 1 AskUserQuestion call     (C002-T-037 step 4)
//   TS-215-opencode-4     OpenCode, 4 questions    → 1 `question` call          (carried to C002-T-056)
//   TS-215-opencode-5     OpenCode, 5 questions    → at least 2 `question` calls (carried to C002-T-056)
// The interview Given is the C001 interview fixture (evals/cap02/interview.mjs: the real CLI, a change in
// ideation whose specialists' hand-backs are saved in the workspace), with the questions of one topic,
// so the scenario controls exactly how many questions the conductor has to ask. The existing harness
// runs Claude Code only: run the Claude Code row with `--only TS-215-claude-code-4`; the `host` field
// selects the OpenCode rows for the runner of C002-T-044 (`run.mjs --host opencode`).
import { checker, toolCalls } from "../../harness/assert.mjs";
import { interviewFixture, PROMPT, q } from "../../cap02/interview.mjs";

const HOST = {
  "claude-code": { agent: "architect:sdd-conductor", tool: "AskUserQuestion" },
  opencode: { agent: "sdd-conductor", tool: "question" },
};

// One interview topic (booking rules); each question has its own intent, so none merges with another.
const QUESTIONS = [
  q("Q-booking-rules-01", "booking rules", "How far ahead may a patient book an appointment?", {
    options: [
      { label: "Up to 90 days (Recommended)", rationale: "Matches the clinics' published schedules.", recommended: true },
      { label: "Up to 1 year", rationale: "Needs schedules a year ahead." },
    ],
  }),
  q("Q-booking-rules-02", "booking rules", "How late before the start may a patient cancel without a fee?", {
    options: [
      { label: "24 hours (Recommended)", rationale: "The clinics' current rule.", recommended: true },
      { label: "2 hours", rationale: "Leaves little time to refill the slot." },
    ],
  }),
  q("Q-booking-rules-03", "booking rules", "How many open bookings may one patient hold at a time?", {
    options: [
      { label: "Three (Recommended)", rationale: "Covers follow-ups without blocking slots.", recommended: true },
      { label: "No limit", rationale: "Lets one patient block many slots." },
    ],
  }),
  q("Q-booking-rules-04", "booking rules", "May a patient book on behalf of a family member?", {
    options: [
      { label: "Yes, linked accounts (Recommended)", rationale: "Parents book for children today.", recommended: true },
      { label: "No", rationale: "Each person needs an own account." },
    ],
  }),
  q("Q-booking-rules-05", "booking rules", "Must a booking name the reason for the visit?", {
    options: [
      { label: "Optional (Recommended)", rationale: "Helps triage without blocking the booking.", recommended: true },
      { label: "Required", rationale: "Adds a step for every patient." },
    ],
  }),
];

/** One case of the outline: `n` questions on `host`; `calls` checks the number of question-tool calls. */
function row(host, n, calls, rule) {
  const { agent, tool } = HOST[host];
  return {
    id: `TS-215-${host}-${n}`,
    title: `Round size on ${host}: ${n} questions of one topic, ${rule} (TS-215)`,
    host,
    agent,
    fixture: interviewFixture({ "sdd-researcher": QUESTIONS.slice(0, n) }),
    allowTools: ["Write", "Edit"],
    maxTurns: 20,
    maxBudgetUsd: 0.35,
    prompt: PROMPT,
    assert({ transcript }) {
      const { failures, check } = checker();
      const asks = toolCalls(transcript).filter((c) => c.name === tool && c.agent === null);
      check(calls(asks.length), `TS-215 ${host} n=${n}: ${asks.length} ${tool} call(s); expected ${rule}`);
      for (const [i, c] of asks.entries()) {
        const k = (c.input?.questions ?? []).length;
        check(k >= 1 && k <= 4, `TS-215 ${host}: call ${i + 1} carries ${k} questions`);
      }
      const others = toolCalls(transcript).filter((c) => c.name !== tool && ["AskUserQuestion", "question", "ask_user"].includes(c.name));
      check(others.length === 0, `TS-215 ${host}: another host's question tool was called: ${others.map((c) => c.name).join(", ")}`);
      return failures;
    },
  };
}

export default [
  row("claude-code", 4, (k) => k === 1, "1 call"),
  row("opencode", 4, (k) => k === 1, "1 call"),
  row("opencode", 5, (k) => k >= 2, "at least 2 calls"),
];
