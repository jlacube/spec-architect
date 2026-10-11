// C001-TC-603 — verifies C001-TS-603 (C001-AC-603.1, C001-REQ-603): minimum task content.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { plan, task } from "./plan-fixture.ts";

test("the minimal plan is lint-clean", () => {
  assert.deepEqual(lint(plan()).findings, []);
});

const rows: [section: string, opts: Parameters<typeof task>[1]][] = [
  ["Targets", { targets: [] }],
  ["Verification", { verification: [] }],
  ["Done when", { doneWhen: [] }],
];

for (const [section, opts] of rows) {
  test(`a task whose ${section} is empty raises LINT-TASK-001 naming it`, () => {
    const hits = withCode(lint(plan(task("001", opts))).findings, "LINT-TASK-001");
    assert.equal(hits.length, 1);
    assert.deepEqual(hits[0]?.ids, ["C004-T-001"]);
    assert.match(hits[0]?.message ?? "", new RegExp(`empty ${section} section`));
  });
}

test("plan rules do not run before the plan phase has started", () => {
  const files = plan(task("001", { targets: [] }));
  files[".sdd/004-x/change.md"] = "---\nid: CHG-004\ntitle: x\nphases:\n  20-plan: { status: not-started }\n---\n# CHG-004\n";
  assert.deepEqual(withCode(lint(files).findings, "LINT-TASK-001"), []);
});
