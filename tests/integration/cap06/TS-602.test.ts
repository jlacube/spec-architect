// C001-TC-602 — verifies C001-TS-602 (C001-AC-602.1, C001-REQ-602): task file shape, reported as
// LINT-TASK-004 (C001-T-076; the structure check of C001-T-043 promoted to a rule after defect D-003).
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { LITE_CHANGE_MD, PLAN, plan, task, workedExample } from "./plan-fixture.ts";

const [TASK_PATH, GOOD] = task("001");

test("a task file with the IF-03 §3 frontmatter and the six headings raises no LINT-TASK-004", () => {
  assert.deepEqual(withCode(lint(plan()).findings, "LINT-TASK-004"), []);
});

test("a missing frontmatter key, a bad status and a missing heading each raise LINT-TASK-004", () => {
  const bad = GOOD.replace("estimate: S\n", "").replace("status: todo", "status: started").replace("## Preconditions\n\nNone.\n\n", "");
  const hits = withCode(lint(plan([TASK_PATH, bad])).findings, "LINT-TASK-004");
  assert.deepEqual(hits.map((h) => h.message).sort(), [
    "Task file shape wrong: C004-T-001 has no heading Preconditions",
    'Task file shape wrong: C004-T-001 has status "started", not one of todo, in-progress, blocked, done, dropped',
    "Task file shape wrong: C004-T-001 lacks the frontmatter key estimate",
  ]);
  assert.ok(hits.every((h) => h.path === `${PLAN}/50-tasks/T-001-x.md` && h.ids?.[0] === "C004-T-001" && h.severity === "error"));
  assert.equal(hits.find((h) => h.message.includes("status"))?.line, 8);
});

test("headings out of order raise LINT-TASK-004 at the misplaced heading", () => {
  const swapped = GOOD.replace("## Intent\n\nDo the thing.\n\n", "").replace("## Done when\n", "## Done when\n\n- [ ] x\n\n## Intent\n\nDo the thing.\n");
  const hits = withCode(lint(plan([TASK_PATH, swapped])).findings, "LINT-TASK-004");
  assert.equal(hits.length, 1);
  assert.match(hits[0]?.message ?? "", /has heading Intent out of order/);
});

test("a task file whose frontmatter has no id is still checked", () => {
  const hits = withCode(lint(plan([TASK_PATH, GOOD.replace("id: C004-T-001\n", "")])).findings, "LINT-TASK-004");
  assert.deepEqual(hits.map((h) => h.message), ["Task file shape wrong: T-001-x.md lacks the frontmatter key id"]);
});

test("lite: a task section of plan.md without Estimate, or with a bad status, raises LINT-TASK-004", () => {
  const section = (fields: string) =>
    `---\nid: C004-PLAN\nartifact: plan/lite\n---\n\n# Plan\n\n## Strategy\n\nx\n\n## Tasks\n\n### C004-T-001 — Thing\n${fields}- **Targets:** src/a.ts\n- **Verification:** npm test\n- **Done when:** tests pass\n`;
  const fields = "- **Status:** todo\n- **Depends on:**\n- **Implements:** C004-REQ-012\n- **Satisfies AC:** C004-AC-012.1\n- **Verified by:** C004-TS-012, C004-TC-012\n- **Estimate:** S\n";
  const files = (f: string) => {
    const out: Record<string, string> = { ...plan(), ".sdd/004-x/change.md": LITE_CHANGE_MD, [`${PLAN}/plan.md`]: section(f) };
    delete out[`${PLAN}/50-tasks/T-001-x.md`];
    return out;
  };
  assert.deepEqual(withCode(lint(files(fields)).findings, "LINT-TASK-004"), []);
  const hits = withCode(lint(files(fields.replace("- **Estimate:** S\n", "").replace("todo", "later"))).findings, "LINT-TASK-004");
  assert.deepEqual(hits.map((h) => h.message).sort(), [
    'Task file shape wrong: C004-T-001 has status "later", not one of todo, in-progress, blocked, done, dropped',
    "Task file shape wrong: C004-T-001 lacks the field Estimate",
  ]);
  assert.ok(hits.every((h) => h.path === `${PLAN}/plan.md`));
});

test("every task file of CHG-001 (the worked example) raises no LINT-TASK-004", () => {
  assert.deepEqual(workedExample("LINT-TASK-004"), []);
});
