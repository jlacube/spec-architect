// C001-TC-611 — verifies C001-TS-611 (C001-AC-609.2, C001-REQ-609): test case fields (structure check until a
// lint rule exists, defect D-003).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { specFile } from "../../helpers/spec-file.ts";
import { testPlanProblems } from "./plan-structure.ts";

const PLAN = (owner: string) =>
  [
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
    "| C004-TC-001 | C004-TS-001 | unit | tests/a.test.ts | inline | Node 20 | C004-T-001 |",
    "| C004-TC-002 | C004-TS-002 | eval | evals/b.eval.mjs | fx-empty | REF-WIN | C004-T-002 |",
    "| C004-TC-003 | C004-TS-003 | manual | tests/manual/c.md | checklist | REF-WIN | C004-T-003 |",
    "",
  ].join("\n");

test("every TC has level, location, data and environment, and the manual one an executor", () => {
  assert.deepEqual(testPlanProblems(PLAN("P-01")), []);
});

test("a bad level, a missing environment and a manual TC without an executor are reported", () => {
  const bad = PLAN("").replace("| unit |", "| smoke |").replace("| fx-empty | REF-WIN |", "| fx-empty |  |");
  assert.deepEqual(testPlanProblems(bad).sort(), ['C004-TC-001: level "smoke"', "C004-TC-002: no environment", "C004-TC-003: manual without an executor"]);
});

test("the CHG-001 test plan (the worked example) has every field", () => {
  assert.deepEqual(testPlanProblems(readFileSync(specFile("001", "20-plan/60-test-plan.md"), "utf8")), []);
});
