// C005-TC-035 — verifies C005-TS-135 (C005-AC-112.1, C005-REQ-112): without a marked task the archive task
// still blocks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { archiveCase } from "./archive-cases.ts";

test("unmarked archive task in-progress: ERR-CLI-009 naming C004-T-003; nothing moved", () => {
  const c = archiveCase([{ status: "done" }, { status: "done" }, { status: "in-progress", title: "Archive CHG-004 into living specs" }]);
  try {
    const r = c.archive();
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^ERR-CLI-009/);
    assert.match(r.stderr, /C004-T-003/);
    assert.ok(c.activeExists());
    assert.ok(!c.archivedExists());
  } finally {
    c.cleanup();
  }
});
