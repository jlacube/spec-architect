// C001-TC-611 — verifies C001-TS-611 (C001-AC-609.2, C001-REQ-609): test case fields, reported as
// LINT-TC-001 (C001-T-076; the structure check of C001-T-043 promoted to a rule after defect D-003).
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { LITE_CHANGE_MD, PLAN, plan, workedExample } from "./plan-fixture.ts";

const TEST_PLAN = `${PLAN}/60-test-plan.md`;
const testPlan = (owner: string): [string, string] => [
  TEST_PLAN,
  [
    "---",
    "id: C004-PLAN-TEST",
    "artifact: plan/test-plan",
    "---",
    "",
    "## Manual procedures",
    "",
    "| TC | Procedure owner | Notes |",
    "|---|---|---|",
    `| C004-TC-003 | ${owner} | - |`,
    "",
    "## Test cases",
    "",
    "| TC | Verifies | Level | Location | Test data | Environment | Task |",
    "|---|---|---|---|---|---|---|",
    "| C004-TC-012 | C004-TS-012 | unit | tests/a.test.ts | inline | Node 20 | C004-T-001 |",
    "| C004-TC-002 | C004-TS-012 | eval | evals/b.eval.mjs | fx-empty | REF-WIN | C004-T-001 |",
    "| C004-TC-003 | C004-TS-012 | manual | tests/manual/c.md | checklist | REF-WIN | C004-T-001 |",
    "",
  ].join("\n"),
];

test("every TC has level, location, data and environment, and the manual one an executor: no LINT-TC-001", () => {
  assert.deepEqual(withCode(lint(plan(testPlan("P-01"))).findings, "LINT-TC-001"), []);
});

test("a bad level, a missing environment and a manual TC without an executor raise LINT-TC-001", () => {
  const [path, text] = testPlan("");
  const bad = text.replace("| unit |", "| smoke |").replace("| fx-empty | REF-WIN |", "| fx-empty |  |");
  const hits = withCode(lint(plan([path, bad])).findings, "LINT-TC-001");
  assert.deepEqual(hits.map((h) => [h.line, h.ids, h.message]), [
    [16, ["C004-TC-012"], 'Test case field missing: C004-TC-012 has level "smoke", not one of unit, integration, e2e, eval, manual'],
    [17, ["C004-TC-002"], "Test case field missing: C004-TC-002 has no environment"],
    [18, ["C004-TC-003"], "Test case field missing: C004-TC-003 is manual but names no executor"],
  ]);
});

test("a test plan without a test-case table raises LINT-TC-001", () => {
  const hits = withCode(lint(plan([TEST_PLAN, "---\nid: C004-PLAN-TEST\nartifact: plan/test-plan\n---\n\n# Test plan\n\nLater.\n"])).findings, "LINT-TC-001");
  assert.equal(hits.length, 1);
  assert.match(hits[0]?.message ?? "", /no test-case table/);
});

test("lite: the TC table of plan.md needs a level and a location", () => {
  const lite = (row: string) => {
    const files: Record<string, string> = {
      ...plan(),
      ".sdd/004-x/change.md": LITE_CHANGE_MD,
      [`${PLAN}/plan.md`]: `---\nid: C004-PLAN\nartifact: plan/lite\n---\n\n## Test mapping\n| TC | TS | Level | Location |\n|---|---|---|---|\n${row}\n`,
    };
    delete files[TEST_PLAN];
    return files;
  };
  assert.deepEqual(withCode(lint(lite("| C004-TC-012 | C004-TS-012 | integration | tests/x.test.ts |")).findings, "LINT-TC-001"), []);
  const hits = withCode(lint(lite("| C004-TC-012 | C004-TS-012 | integration |  |")).findings, "LINT-TC-001");
  assert.deepEqual(hits.map((h) => h.message), ["Test case field missing: C004-TC-012 has no location"]);
});

test("the CHG-001 test plan (the worked example) raises no LINT-TC-001", () => {
  assert.deepEqual(workedExample("LINT-TC-001"), []);
});
