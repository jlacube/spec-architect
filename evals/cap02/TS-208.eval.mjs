// C001-TC-208 — verifies C001-TS-208 (C001-AC-207.1, C001-REQ-207): options analysis behind a material
// question. The options-analyst hands back a material question (persistence technology) analysed
// over 4 candidates; the conductor presents it and its questions-log entry records
// candidates_considered (4 or 5) and every non-presented candidate under Rejected with a reason.
import { optionProblems } from "../harness/assert.mjs";
import { interviewFixture, PROMPT, q, readLog, roundChecks } from "./interview.mjs";

const material = {
  id: "Q-persistence-01",
  topic: "persistence",
  question: "Which persistence technology stores bookings?",
  why_it_matters: "Fixes a dependency and the data-access interface of the service (OA-001).",
  blocking: true,
  material: true,
  candidates_considered: 4,
  options: [
    { label: "PostgreSQL", rationale: "Scores 4.35 in OA-001: transactions and the team knows it.", score: 4.35, recommended: true },
    { label: "SQLite", rationale: "Scores 3.80: simplest to run, single writer limits growth.", score: 3.8 },
  ],
  rejected: [
    { label: "MongoDB", reason: "No multi-document constraints needed for slot locking; scores 2.9." },
    { label: "Spreadsheet export", reason: "Cannot lock a slot; violates the double-booking requirement." },
  ],
  source_refs: ["OA-001"],
};

export default {
  id: "TS-208",
  title: "Options analysis behind a material question",
  agent: "architect:sdd-conductor",
  fixture: interviewFixture({ "sdd-options-analyst": [material], "sdd-researcher": [q("Q-reminders-01", "reminders", "Which channel sends appointment reminders?")] }),
  allowTools: ["Write", "Edit"],
  maxTurns: 24,
  prompt: PROMPT,
  assert({ transcript, root }) {
    const { failures, check, calls } = roundChecks(transcript, optionProblems);
    check(calls.flatMap((c) => c.questions).some((x) => /persist|database|store/i.test(x.question)), "the persistence question was not asked");
    const log = readLog(root);
    const at = log.indexOf("Q-persistence-01");
    check(at >= 0, "Q-persistence-01 not in questions-log.md");
    const entry = at >= 0 ? log.slice(at, (log.indexOf("\n### ", at) + 1 || log.length + 1) - 1) : "";
    check(/candidates[ _]considered[^\n]*\b[45]\b/i.test(entry), `entry does not record candidates considered 4 or 5:\n${entry}`);
    check(/rejected[\s\S]*MongoDB[^\n]*\w{4,}/i.test(entry) && /rejected[\s\S]*Spreadsheet[^\n]*\w{4,}/i.test(entry), "entry does not list both rejected candidates with reasons");
    return failures;
  },
};
