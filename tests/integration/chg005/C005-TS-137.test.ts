// C005-TC-037 — verifies C005-TS-137 (C005-AC-112.1, C005-REQ-112): statuses of an unmarked task (full profile).
import { test } from "node:test";
import assert from "node:assert/strict";
import { archiveCase } from "./archive-cases.ts";

for (const [status, ok] of [["done", true], ["dropped", true], ["todo", false], ["blocked", false]] as const) {
  test(`unmarked C004-T-002 at ${status}: ${ok ? "archived" : "ERR-CLI-009 naming C004-T-002"}`, () => {
    const c = archiveCase([{ status: "done" }, { status }, { status: "done" }]);
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
