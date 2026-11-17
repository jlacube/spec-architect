// C005-TC-065 — verifies C005-TS-167 (C005-AC-121.1, C005-REQ-121): a task reported in a lite plan
// after G3 leaves the plan approved.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";
import { approvedHash, liteChange, phaseStatus } from "./lite-fixture.ts";

test("task set on a lite task after G3: report written, hash unchanged, no stale phase", () => {
  const ws = liteChange({ t1Status: "in-progress" });
  try {
    const r = runBundled(["task", "set", "C004-T-001", "--status", "done", "--commit", "a1b2c3d", "--note", "CSV export done"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const plan = readFileSync(join(ws.dir, "20-plan", "plan.md"), "utf8");
    const section = plan.slice(plan.indexOf("### C004-T-001"), plan.indexOf("### C004-T-002"));
    assert.match(section, /^- \*\*Status:\*\* done$/m);
    assert.match(section, /^- \*\*Commit:\*\* a1b2c3d$/m);
    assert.match(section, /^- \*\*Notes:\*\* CSV export done$/m);
    assert.match(section, /^- \*\*Completed at:\*\* \d{4}-\d{2}-\d{2}$/m);

    const h = runBundled(["hash", "004", "20-plan"], { cwd: ws.root });
    assert.equal(h.code, 0, h.stderr);
    assert.equal(h.stdout.trim(), approvedHash(ws.dir, "20-plan"));

    const s = runBundled(["stale", "check", "004"], { cwd: ws.root });
    assert.equal(s.code, 0, s.stderr);
    assert.doesNotMatch(s.stdout, /stale \(/);
    assert.equal(phaseStatus(ws.dir, "20-plan"), "approved");
  } finally {
    ws.cleanup();
  }
});
