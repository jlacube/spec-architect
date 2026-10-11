// C001-TC-902 — verifies C001-TS-902 (C001-AC-901.2, C001-REQ-901): start a task.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runInProcess } from "../cli/helpers.ts";
import { taskFm, tracking } from "./tracking-fixture.ts";

test("task set in-progress keeps report.completed_at null", () => {
  const ws = tracking();
  try {
    const r = runInProcess(["task", "set", "C004-T-032", "--status", "in-progress"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const fm = taskFm(ws.dir, "032");
    assert.equal(fm["status"], "in-progress");
    assert.equal((fm["report"] as Record<string, unknown>)["completed_at"], null);
  } finally {
    ws.cleanup();
  }
});
