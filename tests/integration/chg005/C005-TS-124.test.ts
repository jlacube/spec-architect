// C005-TC-024 — verifies C005-TS-124 (C005-AC-108.1, C005-REQ-108): install-line check only while the plan
// is open.
import { test } from "node:test";
import assert from "node:assert/strict";
import { change002, lint, reporting } from "./lint-fixture.ts";

const ROWS: [string, boolean, number][] = [
  ["draft", false, 1],
  ["in-review", false, 1],
  ["in-revision", false, 1],
  ["approved", false, 0],
  ["stale", false, 0],
  ["approved", true, 0],
];

for (const [status, archived, count] of ROWS) {
  test(`20-plan ${status}${archived ? " in .sdd/_archive/" : ""}: ${count} LINT-HAND-003 finding(s) from a workspace lint`, () => {
    const ws = change002({ planStatus: status, reporting: reporting(null), archived });
    try {
      const { findings } = lint(ws.root, []);
      assert.equal(findings.filter((f) => f.code === "LINT-HAND-003").length, count);
    } finally {
      ws.cleanup();
    }
  });
}
