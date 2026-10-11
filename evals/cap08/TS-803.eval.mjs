// C001-TC-803 — verifies C001-TS-803 (C001-AC-803.1, C001-REQ-803): note equals answer. P-01 answers the
// G2 question in free text; `sdd gate approve 004 10-spec` runs with --note equal to that text.
import { checker } from "../harness/assert.mjs";
import { answering, approvals, gateG2 } from "./gate.mjs";

const ANSWER = "Approve — but revisit NFR-101 in plan";

/** The --note value of a shell command (double- or single-quoted). */
export function noteOf(command) {
  const m = /--note\s+(?:"((?:[^"\\]|\\.)*)"|'([^']*)')/.exec(command);
  return m ? (m[1] !== undefined ? m[1].replace(/\\(["\\$`])/g, "$1") : m[2]) : null;
}

export default {
  id: "TS-803",
  title: "Note equals answer",
  ...gateG2,
  answer: answering(ANSWER),
  assert({ transcript }) {
    const { failures, check } = checker();
    const runs = approvals(transcript).filter((c) => /\bgate\s+approve\s+0*4\s+10-spec\b/.test(c));
    check(runs.length > 0, `no "sdd gate approve 004 10-spec" call (approvals: ${approvals(transcript).join(" | ") || "none"})`);
    for (const c of runs) check(noteOf(c) === ANSWER, `--note is ${JSON.stringify(noteOf(c))}`);
    return failures;
  },
};
