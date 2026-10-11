// C001-TC-501 — verifies C001-TS-501 (C001-AC-501.1, C001-REQ-501): architecture.md sections by
// kind. Plan owner C001-T-042 (architect); LINT-ARCH-002 arrives with C001-T-021.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BROWNFIELD, lint, withCode } from "../cap04/spec-fixture.ts";
import { ARCH_FILE, architecture } from "./arch-fixture.ts";

test("greenfield: every mandatory section missing is reported", () => {
  assert.deepEqual(withCode(lint({ [ARCH_FILE]: architecture() }).findings, "LINT-ARCH-002"), []);
  const hits = withCode(lint({ [ARCH_FILE]: architecture({ omitSections: ["Data view", "Deployment view"] }) }).findings, "LINT-ARCH-002");
  assert.deepEqual(hits.map((h) => h.message), ['Architecture section "Data view" is missing', 'Architecture section "Deployment view" is missing']);
});

test('brownfield: the greenfield set plus "As-is to to-be delta"', () => {
  const missing = withCode(lint({ ".sdd/004-x/change.md": BROWNFIELD, [ARCH_FILE]: architecture() }).findings, "LINT-ARCH-002");
  assert.deepEqual(missing.map((h) => h.message), ['Architecture section "As-is to to-be delta" is missing']);
  const ok = lint({ ".sdd/004-x/change.md": BROWNFIELD, [ARCH_FILE]: architecture({ extraSections: ["As-is to to-be delta"] }) });
  assert.deepEqual(withCode(ok.findings, "LINT-ARCH-002"), []);
});
