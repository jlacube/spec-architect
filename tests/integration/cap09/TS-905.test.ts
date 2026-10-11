// C001-TC-905 — verifies C001-TS-905 (C001-AC-904.1, C001-REQ-904): dependency unfinished.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runBundled } from "../cli/helpers.ts";
import { taskFm, tracking } from "./tracking-fixture.ts";

test("done before C004-T-029 is finished: recorded, exit 0, WARN-CLI-001 naming C004-T-029", () => {
  const ws = tracking();
  try {
    const r = runBundled(["task", "set", "C004-T-031", "--status", "done", "--commit", "abc1234"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout + r.stderr, /WARN-CLI-001: `C004-T-031` done before `C004-T-029`/);
    assert.equal(taskFm(ws.dir, "031")["status"], "done");
  } finally {
    ws.cleanup();
  }
});
