// C001-TC-616 — verifies C001-TS-616 (C001-AC-613.2, C001-REQ-613): TR-14 warning. Plan owner
// C001-T-043 (planner); TR-14 arrives with C001-T-022.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { PLAN, plan } from "./plan-fixture.ts";

const risks = (impact: string, mitigation: string): [string, string] => [
  `${PLAN}/70-risks.md`,
  `---\nid: C004-PLAN-RISKS\nartifact: plan/risks\n---\n\n| ID | Risk | Likelihood | Impact | Mitigation | Trigger | Owner | Refs |\n|---|---|---|---|---|---|---|---|\n` +
    `| C004-RISK-002 | Outage | medium | ${impact} | ${mitigation} | Alerts | dev | C004-T-001 |\n`,
];

test('a high-impact risk whose mitigation names no task and no "accepted by P-01" raises TR-14', () => {
  const hits = withCode(lint(plan(risks("high", "Be careful"))).findings, "TR-14");
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.severity, "warn");
  assert.deepEqual(hits[0]?.ids, ["C004-RISK-002"]);
});

test("a mitigation task, a recorded acceptance or a lower impact clears TR-14", () => {
  for (const [impact, mitigation] of [["high", "Retry logic in C004-T-001"], ["high", "Residual risk accepted by P-01 on 2026-10-11"], ["medium", "Be careful"]])
    assert.deepEqual(withCode(lint(plan(risks(impact!, mitigation!))).findings, "TR-14"), [], mitigation);
});
