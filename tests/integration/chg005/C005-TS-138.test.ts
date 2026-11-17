// C005-TC-038 — verifies C005-TS-138 (C005-AC-113.1, C005-REQ-113): an open lite task blocks the archive.
import { test } from "node:test";
import assert from "node:assert/strict";
import { archiveCase } from "./archive-cases.ts";

test("lite C004-T-002 in-progress: ERR-CLI-009 naming C004-T-002; the folder stays", () => {
  const c = archiveCase([{ status: "done" }, { status: "in-progress" }, { status: "done" }], { lite: true });
  try {
    const r = c.archive();
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^ERR-CLI-009/);
    assert.match(r.stderr, /C004-T-002/);
    assert.ok(c.activeExists());
  } finally {
    c.cleanup();
  }
});
