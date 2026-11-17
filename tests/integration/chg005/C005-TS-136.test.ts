// C005-TC-036 — verifies C005-TS-136 (C005-AC-112.1, C005-REQ-112): every unmet precondition listed; the
// marked task is not.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checksum } from "../cap09/archive-fixture.ts";
import { archiveCase } from "./archive-cases.ts";

test("G3 not approved, C004-T-002 in-progress, D-001 open, marked C004-T-003 todo", () => {
  const c = archiveCase([{ status: "done" }, { status: "in-progress" }, { status: "todo", marked: true }], {
    planStatus: "in-review",
    defects: [{ id: "D-001", status: "open" }],
  });
  try {
    const before = checksum(c.root);
    const r = c.archive();
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^ERR-CLI-009/);
    for (const s of ["G3 not approved", "C004-T-002", "D-001"]) assert.ok(r.stderr.includes(s), r.stderr);
    assert.ok(!r.stderr.includes("C004-T-003"), r.stderr);
    assert.equal(checksum(c.root), before);
  } finally {
    c.cleanup();
  }
});
