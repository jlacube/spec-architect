// C005-TC-064 — verifies C005-TS-166 (C005-AC-117.1, C005-REQ-117): the refusal line of a writing
// subcommand on an archived change.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runBundled } from "../cli/helpers.ts";
import { archivedChange } from "./archived-fixture.ts";

test("sdd stale check 001: the single ERR-CLI-014 line, exit 2", () => {
  const ws = archivedChange();
  try {
    const r = runBundled(["stale", "check", "001"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.equal(r.stderr, "ERR-CLI-014: Change `001` is `archived`. Fix: Create a new change\n");
  } finally {
    ws.cleanup();
  }
});
