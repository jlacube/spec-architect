// C005-TC-080 — verifies C005-TS-179 (C005-AC-127.1, C005-REQ-127): a report field that the section holds is
// replaced where its first field line stands; the file keeps its line count and every other line.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isoDate } from "../../../src/workspace/change.ts";
import { lineAt, placementCase } from "./report-placement.ts";

const HEAD = ["### C004-T-001 — CSV export", "- **Status:** in-progress", "- **Done when:**"];

const ROWS: [string, string[]][] = [
  ["Commit and Completed at after the checkbox", ["  - [ ] CSV header written", "- **Commit:** 0a0a0a0", "- **Completed at:** —", ""]],
  ["Commit and Completed at before the checkbox (the 0.1.0 place)", ["- **Commit:** 0a0a0a0", "- **Completed at:** —", "  - [ ] CSV header written", ""]],
  ["two Commit lines", ["- **Commit:** 0a0a0a0", "  - [ ] CSV header written", "- **Commit:** 0b0b0b0", "- **Completed at:** —", ""]],
];

for (const [row, tail] of ROWS) {
  test(`C005-TS-179 ${row}: fields replaced in place, line count kept`, () => {
    const c = placementCase([...HEAD, ...tail], "mapping");
    try {
      const lines = c.run(["--status", "done", "--commit", "a1b2c3d"]);
      const expected = [...c.before];
      expected[lineAt(expected, "- **Status:** in-progress")] = "- **Status:** done";
      expected[lineAt(expected, "- **Commit:** 0a0a0a0")] = "- **Commit:** a1b2c3d";
      expected[lineAt(expected, "- **Completed at:** —")] = `- **Completed at:** ${isoDate()}`;
      assert.equal(lines.length, c.before.length);
      assert.deepEqual(lines, expected);
    } finally {
      c.cleanup();
    }
  });
}
