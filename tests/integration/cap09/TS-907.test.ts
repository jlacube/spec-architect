// C001-TC-907 — verifies C001-TS-907 (C001-AC-906.1, C001-REQ-906): missing commit link.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { plan, task } from "../cap06/plan-fixture.ts";

test("a done task with an empty report.commit is a LINT-TASK-003 warning", () => {
  const { code, findings } = lint(plan(task("031", { status: "done" })));
  const hits = withCode(findings, "LINT-TASK-003");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.equal(hits[0]?.severity, "warn");
  assert.deepEqual(hits[0]?.ids, ["C004-T-031"]);
  assert.equal(code, 0);
});

test("a done task with a commit, or an open task, raises none", () => {
  assert.deepEqual(withCode(lint(plan(task("031", { status: "done", commit: "abc1234" }))).findings, "LINT-TASK-003"), []);
  assert.deepEqual(withCode(lint(plan(task("031"))).findings, "LINT-TASK-003"), []);
});

test("LINT-GATE-001: a gate-log row without a Usage cell is reported", () => {
  const changeMd = (usage: string) =>
    "---\nid: CHG-004\ntitle: x\nphases:\n  20-plan: { status: draft }\n---\n# CHG-004\n\n## Gate log\n| Date | Gate | Decision | Words of approver | Waivers | Usage |\n|---|---|---|---|---|---|\n" +
    `| 2026-10-11 | G1 (ideation) | Approved | "ok" | none | ${usage} |\n`;
  assert.deepEqual(withCode(lint({ ...plan(), ".sdd/004-x/change.md": changeMd("unavailable") }).findings, "LINT-GATE-001"), []);
  assert.equal(withCode(lint({ ...plan(), ".sdd/004-x/change.md": changeMd("") }).findings, "LINT-GATE-001").length, 1);
});
