// C001-TC-615 — verifies C001-TS-615 (C001-AC-613.1, C001-REQ-613): risk entry structure, reported as
// LINT-RISK-001 (C001-T-076; the structure check of C001-T-043 promoted to a rule after defect D-003).
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { LITE_CHANGE_MD, PLAN, plan, workedExample } from "./plan-fixture.ts";

const RISKS = `${PLAN}/70-risks.md`;
const risks = (row: string): [string, string] => [
  RISKS,
  "---\nid: C004-PLAN-RISKS\nartifact: plan/risks\n---\n\n| ID | Risk | Likelihood | Impact | Mitigation | Trigger | Owner | Refs |\n|---|---|---|---|---|---|---|---|\n" + row + "\n",
];

test("a complete risk row raises no LINT-RISK-001", () => {
  const files = plan(risks("| C004-RISK-001 | Provider outage | medium | high | C004-T-001 retries | 3 failed charges | ops | C004-T-001, C004-COMP-02 |"));
  assert.deepEqual(withCode(lint(files).findings, "LINT-RISK-001"), []);
});

test("an unknown rating, a missing trigger and no T or COMP ID raise LINT-RISK-001", () => {
  const hits = withCode(lint(plan(risks("| C004-RISK-002 | Outage | likely | high | retry |  | ops | C004-REQ-012 |"))).findings, "LINT-RISK-001");
  assert.deepEqual(hits.map((h) => h.message).sort(), [
    "Risk field missing: C004-RISK-002 has no trigger",
    "Risk field missing: C004-RISK-002 names no T or COMP ID",
    'Risk rating outside low, medium, high: C004-RISK-002 has likelihood "likely"',
  ]);
  assert.ok(hits.every((h) => h.line === 8 && h.ids?.[0] === "C004-RISK-002" && h.path === RISKS));
});

test("lite: a risk row of plan.md needs ratings and a mitigation", () => {
  const lite = (row: string) => ({
    ...plan(),
    ".sdd/004-x/change.md": LITE_CHANGE_MD,
    [`${PLAN}/plan.md`]: `---\nid: C004-PLAN\nartifact: plan/lite\n---\n\n## Risks\n| ID | Risk | Likelihood | Impact | Mitigation |\n|---|---|---|---|---|\n${row}\n`,
  });
  assert.deepEqual(withCode(lint(lite("| C004-RISK-001 | Late data | low | low | Retry |")).findings, "LINT-RISK-001"), []);
  const hits = withCode(lint(lite("| C004-RISK-001 | Late data | low | severe |  |")).findings, "LINT-RISK-001");
  assert.deepEqual(hits.map((h) => h.message).sort(), [
    "Risk field missing: C004-RISK-001 has no mitigation",
    'Risk rating outside low, medium, high: C004-RISK-001 has impact "severe"',
  ]);
});

test("the CHG-001 risk register (the worked example) raises no LINT-RISK-001", () => {
  assert.deepEqual(workedExample("LINT-RISK-001"), []);
});
