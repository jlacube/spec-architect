// C001-TC-812 — verifies C001-TS-812 (C001-AC-810.2, C001-REQ-810): regeneration does not stale.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runBundled } from "../cli/helpers.ts";
import { approvedChange, statuses } from "./gate-fixture.ts";

test("`sdd trace 004 --write` then `sdd stale check` keeps 10-spec approved", () => {
  const ws = approvedChange(["10-spec"]);
  try {
    assert.equal(runBundled(["trace", "004", "--write"], { cwd: ws.root }).code, 0);
    const r = runBundled(["stale", "check"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(statuses(ws.dir)["10-spec"], "approved");
    assert.match(r.stdout, /^CHG-004 10-spec: approved \(hash matches\)$/m);
  } finally {
    ws.cleanup();
  }
});
