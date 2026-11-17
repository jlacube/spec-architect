// C005-TC-034 — verifies C005-TS-134 (C005-AC-112.1, C005-REQ-112): a marked archive task does not block,
// whatever its status.
import { test } from "node:test";
import assert from "node:assert/strict";
import { archiveCase } from "./archive-cases.ts";

for (const status of ["todo", "in-progress", "blocked"]) {
  test(`marked C004-T-003 at ${status}: archive exits 0, the change moves, the task keeps ${status}`, () => {
    const c = archiveCase([{ status: "done" }, { status: "done" }, { status, marked: true, title: "Archive CHG-004 into living specs" }]);
    try {
      const r = c.archive();
      assert.equal(r.code, 0, r.stderr);
      assert.ok(c.archivedExists());
      assert.ok(!c.activeExists());
      assert.equal(c.status("C004-T-003"), status);
    } finally {
      c.cleanup();
    }
  });
}
