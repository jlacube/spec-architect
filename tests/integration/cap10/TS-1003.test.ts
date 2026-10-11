// C001-TC-1003 — verifies C001-TS-1003 (C001-AC-1002.1, C001-REQ-1002): evidence entry fields. Plan
// owner C001-T-041 (cartographer); LINT-EVD-001 arrives with C001-T-021.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";

const SURVEY = ".sdd/004-x/00-ideation/evidence/baseline-survey.md";
const survey = (entries: string) => "---\nid: C004-IDEA-BASELINE\nartifact: ideation/baseline-survey\n---\n# Baseline survey\n\n## Evidence\n" + entries;
const ENTRY = (layer: string) =>
  "- **E-1** `src/checkout/payments.ts:118` › `createIntent()` — creates the payment intent\n" +
  `  - ${layer}confidence: high\n  - commit: abc1234 · pattern: none\n  - disclosures: none\n`;

test("a complete entry raises no LINT-EVD-001; a file-level claim may use '-' as symbol", () => {
  assert.deepEqual(withCode(lint({ [SURVEY]: survey(ENTRY("layer: serena · ")) }).findings, "LINT-EVD-001"), []);
  const fileLevel = ENTRY("layer: grep · ").replace("› `createIntent()`", "› -");
  assert.deepEqual(withCode(lint({ [SURVEY]: survey(fileLevel) }).findings, "LINT-EVD-001"), []);
});

test("an entry missing the layer raises LINT-EVD-001", () => {
  const hits = withCode(lint({ [SURVEY]: survey(ENTRY("")) }).findings, "LINT-EVD-001");
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.line, 8);
  assert.match(hits[0]?.message ?? "", /layer/);
});
