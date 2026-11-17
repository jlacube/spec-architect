// C005-TC-069 — verifies C005-TS-171 (C005-AC-122.1, C005-REQ-122): after one revision and one G3
// approval with the sdd CLI 0.1.1, task reports leave the plan approved.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runBundled } from "../cli/helpers.ts";
import { liteChange, phaseStatus } from "./lite-fixture.ts";

test("stale once, revised, re-approved, then task set keeps 20-plan approved", () => {
  const ws = liteChange({ rule: "0.1.0" });
  try {
    const run = (...args: string[]) => {
      const r = runBundled(args, { cwd: ws.root });
      assert.equal(r.code, 0, `${args.join(" ")}: ${r.stderr}`);
      return r;
    };
    runBundled(["stale", "check", "004"], { cwd: ws.root });
    assert.equal(phaseStatus(ws.dir, "20-plan"), "stale");
    run("change", "revise", "004", "20-plan", "--reason", "C005-REQ-122: re-approve G3 under the 0.1.1 hash rule");
    run("gate", "approve", "004", "20-plan", "--note", "Approve", "--by", "p01");
    assert.equal(phaseStatus(ws.dir, "20-plan"), "approved");

    run("task", "set", "C004-T-001", "--status", "in-progress");
    const s = run("stale", "check", "004");
    assert.doesNotMatch(s.stdout, /stale \(/);
    assert.equal(phaseStatus(ws.dir, "20-plan"), "approved");
  } finally {
    ws.cleanup();
  }
});
