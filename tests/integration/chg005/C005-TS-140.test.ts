// C005-TC-040 — verifies C005-TS-140 (C005-AC-113.1, C005-REQ-113): Status values of an unmarked lite task.
import { test } from "node:test";
import assert from "node:assert/strict";
import { archiveCase } from "./archive-cases.ts";

for (const [status, ok] of [["done", true], ["dropped", true], ["todo", false], ["blocked", false]] as const) {
  test(`lite C004-T-002 at ${status}: ${ok ? "archived" : "ERR-CLI-009 naming C004-T-002"}`, () => {
    const c = archiveCase([{ status: "done" }, { status }, { status: "done" }], { lite: true });
    try {
      const r = c.archive();
      if (ok) {
        assert.equal(r.code, 0, r.stderr);
        assert.ok(c.archivedExists());
      } else {
        assert.equal(r.code, 2);
        assert.match(r.stderr, /^ERR-CLI-009/);
        assert.match(r.stderr, /C004-T-002/);
      }
    } finally {
      c.cleanup();
    }
  });
}
