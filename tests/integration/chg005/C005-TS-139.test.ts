// C005-TC-039 — verifies C005-TS-139 (C005-AC-113.1, C005-REQ-113): a lite change whose only open task is the
// marked archive task is archived.
import { test } from "node:test";
import assert from "node:assert/strict";
import { archiveCase } from "./archive-cases.ts";

test("lite: marked C004-T-003 todo, others done: archive exits 0", () => {
  const c = archiveCase([{ status: "done" }, { status: "done" }, { status: "todo", marked: true, title: "Archive CHG-004 into living specs" }], { lite: true });
  try {
    const r = c.archive();
    assert.equal(r.code, 0, r.stderr);
    assert.ok(c.archivedExists());
    assert.equal(c.status("C004-T-003", true), "todo");
  } finally {
    c.cleanup();
  }
});
