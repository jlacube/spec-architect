// C001-TC-614 — verifies C001-TS-614 (C001-AC-612.1, C001-REQ-612): TR-15 warning.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { PLAN, plan, task } from "./plan-fixture.ts";

const HOTSPOTS = [`${PLAN}/30-impact/hotspots.md`, "---\nid: C004-PLAN-HOTSPOTS\nartifact: plan/hotspots\n---\n\n| File | Churn | Complexity | Task | Risk |\n|---|---|---|---|---|\n| `src/checkout/payments.ts` | 41 | high | C004-T-031 | |\n"] as [string, string];
const risks = (refs: string) =>
  [`${PLAN}/70-risks.md`, `---\nid: C004-PLAN-RISKS\nartifact: plan/risks\n---\n\n| ID | Risk | Likelihood | Impact | Mitigation | Trigger | Owner | Refs |\n|---|---|---|---|---|---|---|---|\n| C004-RISK-001 | Payments regress | medium | medium | Tests | Failures | dev | ${refs} |\n`] as [string, string];
const t031 = (components: string[] = []) => task("031", { targets: ["`src/checkout/payments.ts`"], components });

test("a task targeting a hotspot with no risk referencing it raises TR-15", () => {
  const { code, findings } = lint(plan(HOTSPOTS, t031(), risks("C004-T-001")));
  const hits = withCode(findings, "TR-15");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.equal(hits[0]?.severity, "warn");
  assert.deepEqual(hits[0]?.ids, ["C004-T-031"]);
  assert.equal(code, 0);
});

test("a risk referencing the task or its component clears TR-15", () => {
  assert.deepEqual(withCode(lint(plan(HOTSPOTS, t031(), risks("C004-T-031"))).findings, "TR-15"), []);
  assert.deepEqual(withCode(lint(plan(HOTSPOTS, t031(["C004-COMP-02"]), risks("C004-COMP-02"))).findings, "TR-15"), []);
});
