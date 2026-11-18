// C005-TC-077 — verifies C005-TS-176 (C005-AC-127.1, C005-REQ-127; defect D-001): missing report fields of a lite
// task are written directly after the two indented checkbox lines of Done when, its last field line.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isoDate } from "../../../src/workspace/change.ts";
import { lint } from "./lint-fixture.ts";
import { lineAt, placementCase, type Tail } from "./report-placement.ts";

const SECTION = [
  "### C004-T-001 — CSV export",
  "- **Status:** in-progress",
  "- **Targets:**",
  "  - add src/export/csv.ts",
  "- **Verification:**",
  "  - npm test",
  "- **Done when:**",
  "  - [ ] CSV header written",
  "  - [ ] CSV rows written",
];

// [row, tail, extra section lines, the line expected directly after Completed at (null: Completed at ends the file)]
const ROWS: [string, Tail, string[], string | null][] = [
  ["section followed by the heading of C004-T-002", "t002", [], "### C004-T-002 — Archive CHG-004 into living specs"],
  ["section ended by a blank line before ## Test mapping", "mapping", [""], ""],
  ["section at the end of the file", "eof", [], null],
];

for (const [row, tail, extra, after] of ROWS) {
  test(`C005-TS-176 ${row}: Commit, Notes, Completed at after the checkboxes; Status in place; no LINT-TASK-001`, () => {
    const c = placementCase([...SECTION, ...extra], tail);
    try {
      const statusAt = lineAt(c.before, "- **Status:** in-progress");
      const lines = c.run(["--status", "done", "--commit", "a1b2c3d", "--note", "CSV export done"]);
      const done = lineAt(lines, "- **Done when:**");
      assert.deepEqual(lines.slice(done + 1, done + 3), ["  - [ ] CSV header written", "  - [ ] CSV rows written"]);
      const completed = `- **Completed at:** ${isoDate()}`;
      assert.deepEqual(lines.slice(done + 3, done + 6), ["- **Commit:** a1b2c3d", "- **Notes:** CSV export done", completed]);
      if (after === null) {
        // The file ends with the Completed at line and a line break.
        assert.equal(lines.length, done + 7);
        assert.equal(lines[done + 6], "");
      } else {
        assert.equal(lines[done + 6], after);
        if (after === "") assert.equal(lines[done + 7], "## Test mapping");
      }
      assert.equal(lines[statusAt], "- **Status:** done", "Status replaced in place");
      const findings = lint(c.root, ["004"]).findings.filter((f) => f.code === "LINT-TASK-001" && (f.ids ?? []).includes("C004-T-001"));
      assert.deepEqual(findings, []);
    } finally {
      c.cleanup();
    }
  });
}
