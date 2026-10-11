// C001-TC-306 — verifies C001-TS-306 (C001-AC-305.1, C001-REQ-305): researcher return size. The returned
// text, excluding the questions JSON block and file paths, is at most 15 lines.
import { checker } from "../harness/assert.mjs";
import { handback, researcherRun } from "./research.mjs";

/** Lines of a reply that count: no fenced blocks, no lines that are only a path. */
export function countedLines(text) {
  return String(text)
    .replace(/```[\s\S]*?```/g, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "")
    .filter((l) => !/^([-*]\s+)?(\*\*)?(Written|Note|Path|Notes)?:?(\*\*)?\s*`?[\w./\\-]+\.md`?$/i.test(l));
}

export default {
  id: "TS-306",
  title: "Researcher return size",
  ...researcherRun("Which open-source libraries can generate iCalendar (.ics) invitations in Node.js, and are they maintained?"),
  assert({ transcript }) {
    const { failures, check } = checker();
    const reply = handback(transcript);
    check(reply.trim(), "no final reply");
    const lines = countedLines(reply);
    check(lines.length <= 15, `${lines.length} counted lines:\n${lines.join("\n")}`);
    return failures;
  },
};
