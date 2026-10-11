// C001-TC-516 — verifies C001-TS-516 (C001-AC-516.1, C001-REQ-516): modified component without
// evidence. Plan owner C001-T-042 (architect); LINT-ARCH-005 arrives with C001-T-021.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { ARCH_FILE, architecture } from "./arch-fixture.ts";

const EVIDENCE = "\n  - **E-1** `src/pay.ts:118` › `createIntent()` — creates the intent\n    - layer: serena · confidence: high\n    - disclosures: none";

test('a "modified" component without evidence raises LINT-ARCH-005', () => {
  const { findings } = lint({ [ARCH_FILE]: architecture({ components: [{ id: "C004-COMP-01" }, { id: "C004-COMP-02", status: "modified" }] }) });
  const hits = withCode(findings, "LINT-ARCH-005");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.deepEqual(hits[0]?.ids, ["C004-COMP-02"]);
});

test("a modified component with path, symbol and layer raises none", () => {
  const { findings } = lint({ [ARCH_FILE]: architecture({ components: [{ id: "C004-COMP-01" }, { id: "C004-COMP-02", status: "modified", evidence: EVIDENCE }] }) });
  assert.deepEqual(withCode(findings, "LINT-ARCH-005"), []);
  assert.deepEqual(withCode(findings, "LINT-EVD-001"), []);
});
