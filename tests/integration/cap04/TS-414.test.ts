// C001-TC-414 — verifies C001-TS-414 (C001-AC-412.1, C001-REQ-412): coverage table check. Plan
// owner C001-T-038 (test-designer); LINT-COV-001/002 arrive with C001-T-020.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ACCEPTANCE_FILE, acceptance, lint, REQ_FILE, requirements, withCode } from "./spec-fixture.ts";

const HEAD = "| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |\n|---|---|---|---|---|---|---|---|\n";
const row = (req: string, happy = "TS-012", rest = "n/a: x") => `| ${req} | ${happy} | ${Array(6).fill(rest).join(" | ")} |\n`;
const acceptanceWith = (table: string) => acceptance("Criterion").replace(/\| REQ \|[\s\S]*$/, table);

test("a coverage table omitting C004-REQ-015 raises LINT-COV-001 naming it", () => {
  const reqs = requirements() + "\n### C004-REQ-015 — Other\n- **Pattern:** ubiquitous\n- **Statement:** THE sdd CLI SHALL do another thing.\n- **Rationale:** r\n- **Stories:** C004-US-001\n- **Priority:** Must\n- **Acceptance:** C004-AC-012.1\n";
  const { findings } = lint({ [REQ_FILE]: reqs, [ACCEPTANCE_FILE]: acceptanceWith(HEAD + row("C004-REQ-012")) });
  const hits = withCode(findings, "LINT-COV-001");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.deepEqual(hits[0]?.ids, ["C004-REQ-015"]);
  assert.equal(hits[0]?.path, ACCEPTANCE_FILE);
});

test("an empty cell raises LINT-COV-002; TS IDs, n/a: <reason> and noted n/a do not", () => {
  const empty = withCode(lint({ [ACCEPTANCE_FILE]: acceptanceWith(HEAD + row("C004-REQ-012", "")) }).findings, "LINT-COV-002");
  assert.equal(empty.length, 1);
  assert.match(empty[0]?.message ?? "", /happy/);
  assert.deepEqual(withCode(lint({}).findings, "LINT-COV-002"), []);
  const noted = acceptanceWith(HEAD + row("C004-REQ-012", "TS-012", "n/a") + "\nPer-column reasons: local single-user tool.\n");
  assert.deepEqual(withCode(lint({ [ACCEPTANCE_FILE]: noted }).findings, "LINT-COV-002"), []);
});

test("a bare n/a without a note below the table raises LINT-COV-002", () => {
  const hits = withCode(lint({ [ACCEPTANCE_FILE]: acceptanceWith(HEAD + row("C004-REQ-012", "TS-012", "n/a")) }).findings, "LINT-COV-002");
  assert.equal(hits.length, 6);
});
