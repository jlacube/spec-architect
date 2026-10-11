// Harness self-test (C001-T-029): the assertions of C001-TS-206 (round size) and C001-TS-207 (option
// format) applied to a stub interviewer in place of the conductor (C001-T-031 writes the real eval
// against architect:sdd-conductor). It proves that AskUserQuestion is asked and answered with
// scripted choices, in every tier.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { askUserQuestions, checker, finalReply, optionProblems, writesOutside } from "../harness/assert.mjs";
import { ROOT } from "../harness/fixtures.mjs";

const FIXTURE = join(ROOT, "evals", "samples", "fx-nine-questions");
const EXPECTED = JSON.parse(readFileSync(join(FIXTURE, "questions.json"), "utf8")).map((q) => q.question);

export default {
  id: "TS-206-stub",
  title: "Round size and option format (stub interviewer)",
  agent: "stub:stub-interviewer",
  plugins: ["evals/fixtures/stub-plugin"],
  fixture: FIXTURE,
  allowTools: ["Read"],
  maxTurns: 12,
  maxBudgetUsd: 0.2,
  prompt: "Run the interview.",
  // Scripted choice: always the recommended (first) option.
  answer: (q) => q.options[0].label,
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const calls = askUserQuestions(transcript);
    check(calls.length >= 3, `expected at least 3 AskUserQuestion calls for 9 questions, got ${calls.length}`);
    for (const [i, c] of calls.entries()) check(c.questions.length >= 1 && c.questions.length <= 4, `call ${i + 1} has ${c.questions.length} questions`);
    const asked = calls.flatMap((c) => c.questions.map((q) => q.question));
    for (const q of EXPECTED) check(asked.includes(q), `question not asked: ${q}`);
    for (const q of calls.flatMap((c) => c.questions)) for (const p of optionProblems(q)) check(false, `${q.header}: ${p}`);
    check(writesOutside(transcript, root).length === 0, "wrote files outside the workspace");
    check(/^DONE: 9\b/m.test(finalReply(transcript)), `final reply: ${finalReply(transcript).slice(0, 80)}`);
    return failures;
  },
};
