// C001-TC-411 — verifies C001-TS-411 (C001-AC-409.1, C001-REQ-409): MODIFIED cites a living
// requirement. Plan owner C001-T-037 (spec-writer); the rule LINT-DELTA-001 arrives with C001-T-020.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BROWNFIELD, lint, REQ_FILE, requirements, withCode } from "./spec-fixture.ts";

const LIVING = "---\ncapability: billing\ninventory_only: false\nupdated: 2026-10-01\n---\n# Billing\n\n## Requirements\n\n### C002-REQ-044 — Invoice\n- **Statement:** THE billing service SHALL issue one invoice per order.\n";
const EVIDENCE = "\n  - **E-1** `src/pay.ts:118` › `createIntent()` — creates the intent\n    - layer: serena · confidence: high\n";

function run(living: boolean) {
  return lint({
    ".sdd/004-x/change.md": BROWNFIELD,
    ...(living ? { ".sdd/_living/CAP-billing.md": LIVING } : {}),
    [REQ_FILE]: requirements({ extra: { Delta: "MODIFIED (was C002-REQ-044)", Evidence: EVIDENCE.trimEnd() } }),
  });
}

test("a MODIFIED requirement citing a living requirement has no delta finding", () => {
  const { findings } = run(true);
  assert.deepEqual(findings.filter((f) => ["LINT-DELTA-001", "TR-09", "LINT-REQ-001"].includes(f.code)), []);
});

test("without the living requirement, LINT-DELTA-001 names it", () => {
  const hits = withCode(run(false).findings, "LINT-DELTA-001");
  assert.equal(hits.length, 1);
  assert.deepEqual(hits[0]?.ids, ["C004-REQ-012", "C002-REQ-044"]);
});

test("an unknown tag and a MODIFIED without a citation are LINT-DELTA-001 findings", () => {
  for (const delta of ["CHANGED", "MODIFIED"]) {
    const { findings } = lint({ ".sdd/004-x/change.md": BROWNFIELD, [REQ_FILE]: requirements({ extra: { Delta: delta, Evidence: EVIDENCE.trimEnd() } }) });
    assert.equal(withCode(findings, "LINT-DELTA-001").length, 1, delta);
  }
});
