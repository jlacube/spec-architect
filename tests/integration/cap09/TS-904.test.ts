// C001-TC-904 — verifies C001-TS-904 (C001-AC-903.1, C001-REQ-903): missing reason.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runInProcess } from "../cli/helpers.ts";
import { taskFm, tracking } from "./tracking-fixture.ts";

test("blocked without --reason is refused with ERR-CLI-006; with a reason it is recorded", () => {
  const ws = tracking();
  try {
    const r = runInProcess(["task", "set", "C004-T-031", "--status", "blocked"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /ERR-CLI-006/);
    const ok = runInProcess(["task", "set", "C004-T-031", "--status", "blocked", "--reason", "waiting for S-07"], { cwd: ws.root });
    assert.equal(ok.code, 0, ok.stderr);
    assert.equal((taskFm(ws.dir, "031")["report"] as Record<string, unknown>)["notes"], "blocked: waiting for S-07");
  } finally {
    ws.cleanup();
  }
});
