// C005-TC-048 — verifies C005-TS-148 (C005-AC-116.1, C005-REQ-116): a number carried by no change folder.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runBundled } from "../cli/helpers.ts";
import { archivedChange } from "./archived-fixture.ts";

test("sdd hash 009 10-spec: ERR-CLI-002, exit 2", () => {
  const ws = archivedChange();
  try {
    const r = runBundled(["hash", "009", "10-spec"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^ERR-CLI-002:/);
  } finally {
    ws.cleanup();
  }
});
