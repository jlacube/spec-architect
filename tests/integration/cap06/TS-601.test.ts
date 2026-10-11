// C001-TC-601 — verifies C001-TS-601 (C001-AC-601.1, C001-REQ-601): milestone fields. Plan owner
// C001-T-043 (planner); LINT-PLAN-001 arrives with C001-T-022.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { PLAN, plan } from "./plan-fixture.ts";

const strategy = (row: string): [string, string] => [
  `${PLAN}/10-strategy.md`,
  "---\nid: C004-PLAN-STRATEGY\nartifact: plan/strategy\n---\n\n# Strategy\n\n## 3. Milestones\n\n| ID | Name | Goal | Exit criterion | Tasks |\n|---|---|---|---|---|\n" + row,
];

test("a milestone without an exit criterion raises LINT-PLAN-001", () => {
  const hits = withCode(lint(plan(strategy("| C004-M-01 | One | Ship it |  | C004-T-001 |\n"))).findings, "LINT-PLAN-001");
  assert.equal(hits.length, 1);
  assert.deepEqual(hits[0]?.ids, ["C004-M-01"]);
  assert.match(hits[0]?.message ?? "", /exit criterion/);
});

test("a milestone with goal, exit criterion and a task ID raises none; one without tasks does", () => {
  assert.deepEqual(withCode(lint(plan()).findings, "LINT-PLAN-001"), []);
  const hits = withCode(lint(plan(strategy("| C004-M-01 | One | Ship it | Tests pass | later |\n"))).findings, "LINT-PLAN-001");
  assert.match(hits[0]?.message ?? "", /task IDs/);
});
