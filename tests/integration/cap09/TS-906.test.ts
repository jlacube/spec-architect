// C001-TC-906 — verifies C001-TS-906 (C001-AC-905.1, C001-REQ-905): implementation status rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";
import { changeMd, SDD_MD, taskMd } from "../workspace-fixtures.ts";

const ROWS: [string[], string][] = [
  [["todo", "todo", "todo"], "not-started"],
  [["done", "in-progress", "todo"], "in-progress"],
  [["done", "blocked", "todo"], "blocked"],
  [["done", "done", "dropped"], "done"],
  [[], "not-started"],
];

for (const [statuses, derived] of ROWS) {
  test(`tasks [${statuses.join(", ")}] derive implementation.status ${derived}`, () => {
    const files: Record<string, string> = { ".sdd/SDD.md": SDD_MD, ".sdd/004-x/change.md": changeMd({ nnn: "004", phase: "20-plan" }) };
    statuses.forEach((s, i) => (files[`.sdd/004-x/20-plan/50-tasks/T-00${i + 1}-t.md`] = taskMd("004", i + 1, s)));
    const ws = makeWorkspace(files);
    try {
      assert.equal(runBundled(["status", "--write"], { cwd: ws.root }).code, 0);
      const reg = JSON.parse(readFileSync(join(ws.root, ".sdd", "registry.json"), "utf8")) as {
        changes: { implementation: { status: string; tasks: Record<string, number> } }[];
      };
      assert.equal(reg.changes[0]?.implementation.status, derived);
      const live = statuses.filter((s) => s !== "dropped");
      assert.deepEqual(reg.changes[0]?.implementation.tasks, {
        total: live.length,
        done: live.filter((s) => s === "done").length,
        blocked: live.filter((s) => s === "blocked").length,
        in_progress: live.filter((s) => s === "in-progress").length,
      });
    } finally {
      ws.cleanup();
    }
  });
}

test("lite changes derive task statuses from the task blocks of plan.md", () => {
  const plan = ["---", "id: C005-PLAN", "artifact: plan/lite", "change: CHG-005", "phase: 20-plan", "status: draft", "---", "# Plan", "", "## Tasks", "",
    "### C005-T-001 — One", "- **Status:** done", "", "### C005-T-002 — Two", "- **Status:** in-progress", ""].join("\n");
  const ws = makeWorkspace({ ".sdd/SDD.md": SDD_MD, ".sdd/005-lite/change.md": changeMd({ nnn: "005", profile: "lite", phase: "20-plan" }), ".sdd/005-lite/20-plan/plan.md": plan });
  try {
    assert.equal(runBundled(["status", "--write"], { cwd: ws.root }).code, 0);
    const reg = JSON.parse(readFileSync(join(ws.root, ".sdd", "registry.json"), "utf8")) as { changes: { implementation: { status: string; tasks: { done: number } } }[] };
    assert.equal(reg.changes[0]?.implementation.status, "in-progress");
    assert.equal(reg.changes[0]?.implementation.tasks.done, 1);
  } finally {
    ws.cleanup();
  }
});
