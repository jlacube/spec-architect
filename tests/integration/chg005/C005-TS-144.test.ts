// C005-TC-044 — verifies C005-TS-144 (C005-AC-115.1, C005-REQ-115): two marked tasks reported, full and
// lite profile.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { taskMd } from "../workspace-fixtures.ts";
import { change002, lint } from "./lint-fixture.ts";

function assertFinding(root: string): void {
  const { code, findings } = lint(root, ["002"]);
  const hits = findings.filter((f) => f.code === "LINT-TASK-005");
  assert.equal(hits.length, 1, JSON.stringify(hits));
  assert.equal(hits[0]!.severity, "error");
  assert.match(hits[0]!.message, /C002-T-003/);
  assert.match(hits[0]!.message, /C002-T-005/);
  assert.notEqual(code, 0);
}

test("full-profile: task files C002-T-003 and C002-T-005 both carry archive_task: true", () => {
  const ws = change002();
  try {
    const dir = join(ws.dir, "20-plan", "50-tasks");
    for (const seq of [3, 4, 5]) {
      const marked = seq !== 4 ? "archive_task: true\n" : "";
      writeFileSync(join(dir, `T-00${seq}-t.md`), taskMd("002", seq, "todo").replace("---\n# ", `${marked}---\n# `));
    }
    assertFinding(ws.root);
  } finally {
    ws.cleanup();
  }
});

test("lite: task sections C002-T-003 and C002-T-005 both carry - **Archive task:** true", () => {
  const ws = change002();
  try {
    const cm = join(ws.dir, "change.md");
    writeFileSync(cm, readFileSync(cm, "utf8").split("profile: full").join("profile: lite"));
    rmSync(join(ws.dir, "20-plan", "50-tasks"), { recursive: true, force: true });
    const section = (seq: number, marked: string) =>
      `### C002-T-00${seq} — Task ${seq}\n- **Status:** todo\n${marked}- **Implements:** C002-REQ-101\n- **Estimate:** S\n\n`;
    writeFileSync(join(ws.dir, "20-plan", "plan.md"),
      "---\nid: C002-PLAN\nartifact: plan/lite\nchange: CHG-002\nphase: 20-plan\nstatus: draft\n---\n# Plan\n\n## Tasks\n\n" +
      section(3, "- **Archive task:** true\n") + section(4, "") + section(5, "- **Archive task:** `**TRUE**`\n"));
    assertFinding(ws.root);
  } finally {
    ws.cleanup();
  }
});
