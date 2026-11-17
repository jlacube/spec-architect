// C005-TC-047 — verifies C005-TS-147 (C005-AC-116.1, C005-REQ-116): archive --dry-run on an archived change
// reaches the archive plan's refusal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runBundled } from "../cli/helpers.ts";
import { archivedChange, snapshot } from "./archived-fixture.ts";

test("sdd archive 001 --dry-run: ERR-CLI-014, not ERR-CLI-002; nothing written", () => {
  const ws = archivedChange();
  try {
    const before = snapshot(ws.root);
    const r = runBundled(["archive", "001", "--dry-run"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^ERR-CLI-014:/);
    assert.doesNotMatch(r.stderr, /ERR-CLI-002/);
    assert.deepEqual(snapshot(ws.root), before);
  } finally {
    ws.cleanup();
  }
});
