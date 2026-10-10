// C001-TC-115 — verifies C001-TS-115 (C001-AC-110.1, C001-REQ-110): no reuse after tombstone.
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWorkspace, minimalChange, runBundled } from "../cli/helpers.ts";

test("with REQ allocated up to 12 and C004-REQ-012 tombstoned, id next prints C004-REQ-013", () => {
  const ws = makeWorkspace({
    ...minimalChange(),
    ".sdd/004-x/ids.json": JSON.stringify({
      change: "CHG-004",
      allocated: { REQ: 12 },
      blocks: [],
      tombstones: [{ id: "C004-REQ-012", reason: "merged", date: "2026-10-01" }],
    }),
  });
  try {
    const r = runBundled(["id", "next", "REQ", "--change", "004"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout, "C004-REQ-013\n");
  } finally {
    ws.cleanup();
  }
});

test("a tombstoned number above the counter is skipped as well", () => {
  const ws = makeWorkspace({
    ...minimalChange(),
    ".sdd/004-x/ids.json": JSON.stringify({
      change: "CHG-004",
      allocated: { T: 3 },
      blocks: [],
      tombstones: [{ id: "C004-T-004", reason: "never used", date: "2026-10-01" }],
    }),
  });
  try {
    assert.equal(runBundled(["id", "next", "T", "--change", "004"], { cwd: ws.root }).stdout, "C004-T-005\n");
  } finally {
    ws.cleanup();
  }
});
