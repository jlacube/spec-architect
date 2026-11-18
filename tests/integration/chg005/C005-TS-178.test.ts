// C005-TC-079 — verifies C005-TS-178 (C005-AC-127.1, C005-REQ-127): in a task section with no field line, the
// report fields are written directly after its heading line.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lineAt, placementCase } from "./report-placement.ts";

test("C005-TS-178 section with no field line: Status, then Completed at, directly after the heading line", () => {
  const c = placementCase(["### C004-T-001 — CSV export", "Write the CSV export.", ""], "mapping");
  try {
    const lines = c.run(["--status", "in-progress"]);
    const head = lineAt(lines, "### C004-T-001 — CSV export");
    assert.deepEqual(lines.slice(head, head + 5), [
      "### C004-T-001 — CSV export",
      "- **Status:** in-progress",
      "- **Completed at:** —",
      "Write the CSV export.",
      "",
    ]);
    assert.equal(lines[head + 5], "## Test mapping");
  } finally {
    c.cleanup();
  }
});
