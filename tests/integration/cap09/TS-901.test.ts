// C001-TC-901 — verifies C001-TS-901 (C001-AC-901.1, C001-REQ-901): mark a task done.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isoDate } from "../../../src/workspace/change.ts";
import { runBundled } from "../cli/helpers.ts";
import { registry, taskFm, tracking } from "./tracking-fixture.ts";

test("task set done records status, commit, note and completed_at, and the registry counts it", () => {
  const ws = tracking({ "031": { status: "in-progress" } });
  try {
    const r = runBundled(["task", "set", "C004-T-031", "--status", "done", "--commit", "3f2a9c1", "--note", "merged"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const fm = taskFm(ws.dir, "031");
    assert.equal(fm["status"], "done");
    const report = fm["report"] as Record<string, unknown>;
    assert.equal(String(report["commit"]), "3f2a9c1");
    assert.equal(report["notes"], "merged");
    assert.equal(String(report["completed_at"]), isoDate());
    assert.equal(registry(ws.root).changes.find((c) => c.id === "CHG-004")?.implementation.tasks.done, 1);
  } finally {
    ws.cleanup();
  }
});
