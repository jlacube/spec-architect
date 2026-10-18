// C001-TC-615 — verifies C001-TS-615 (C001-AC-613.1, C001-REQ-613): risk entry structure (structure check
// until a lint rule exists, defect D-003).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { specFile } from "../../helpers/spec-file.ts";
import { riskProblems } from "./plan-structure.ts";

const HEAD = "| ID | Risk | Likelihood | Impact | Mitigation | Trigger | Owner | Refs |\n|---|---|---|---|---|---|---|---|\n";

test("a complete risk row has no problem", () => {
  assert.deepEqual(riskProblems(HEAD + "| C004-RISK-001 | Provider outage | medium | high | C004-T-009 retries | 3 failed charges | ops | C004-T-009, C004-COMP-02 |\n"), []);
});

test("an unknown rating, a missing trigger and no T or COMP ID are reported", () => {
  const p = riskProblems(HEAD + "| C004-RISK-002 | Outage | likely | high | retry |  | ops | C004-REQ-001 |\n");
  assert.deepEqual(p.sort(), ['C004-RISK-002: likelihood "likely"', "C004-RISK-002: no T or COMP ID", "C004-RISK-002: no trigger"]);
});

test("the CHG-001 risk register (the worked example) is complete", () => {
  assert.deepEqual(riskProblems(readFileSync(specFile("001", "20-plan/70-risks.md"), "utf8")), []);
});
