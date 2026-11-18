// C005-TC-078 — verifies C005-TS-177 (C005-AC-127.1, C005-REQ-127): a missing report field goes directly after the
// last field line and its continuation lines, by the form of the lines that follow (whole-file comparison).
import { test } from "node:test";
import assert from "node:assert/strict";
import { lineAt, placementCase } from "./report-placement.ts";

const HEAD = ["### C004-T-001 — CSV export", "- **Status:** todo", "- **Done when:**"];

// [row, tail lines after Done when, the line that Completed at directly follows]
const ROWS: [string, string[], string][] = [
  ["Archive task marker last", ["  - [ ] CSV header written", "- **Archive task:** true", ""], "- **Archive task:** true"],
  ["blank line then an indented checkbox", ["  - [ ] CSV header written", "", "  - [ ] CSV rows written", ""], "  - [ ] CSV header written"],
  ["unindented checkbox after an indented one", ["  - [ ] CSV header written", "- [ ] CSV rows written", ""], "  - [ ] CSV header written"],
  ["unindented checkbox directly after Done when", ["- [ ] CSV header written", ""], "- **Done when:**"],
];

for (const [row, tail, before] of ROWS) {
  test(`C005-TS-177 ${row}: Completed at directly after ${JSON.stringify(before)}, every other line unchanged`, () => {
    const c = placementCase([...HEAD, ...tail], "mapping");
    try {
      const lines = c.run(["--status", "in-progress"]);
      const expected = [...c.before];
      expected[lineAt(expected, "- **Status:** todo")] = "- **Status:** in-progress";
      expected.splice(lineAt(expected, before) + 1, 0, "- **Completed at:** —");
      assert.deepEqual(lines, expected);
    } finally {
      c.cleanup();
    }
  });
}
