// C005-TC-068 — verifies C005-TS-170 (C005-AC-122.1, C005-REQ-122): the first 0.1.1 stale check on
// a plan approved with the hash of the sdd CLI 0.1.0.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runBundled } from "../cli/helpers.ts";
import { liteChange, phaseStatus } from "./lite-fixture.ts";

test("lite: the 0.1.0 hash of a plan with todo task sections is reported stale", () => {
  const ws = liteChange({ rule: "0.1.0" });
  try {
    const s = runBundled(["stale", "check", "004"], { cwd: ws.root });
    assert.match(s.stdout, /20-plan: stale \(hash changed\)/);
    assert.equal(phaseStatus(ws.dir, "20-plan"), "stale");
  } finally {
    ws.cleanup();
  }
});

test("full: the 0.1.0 hash of task files at todo still matches", () => {
  const ws = liteChange({ profile: "full", rule: "0.1.0" });
  try {
    const s = runBundled(["stale", "check", "004"], { cwd: ws.root });
    assert.equal(s.code, 0, s.stderr);
    assert.doesNotMatch(s.stdout, /stale \(/);
    assert.equal(phaseStatus(ws.dir, "20-plan"), "approved");
  } finally {
    ws.cleanup();
  }
});
