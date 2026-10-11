// C001-TC-502 — verifies C001-TS-502 (C001-AC-502.1, C001-REQ-502): component without Status.
// Plan owner C001-T-042 (architect); LINT-ARCH-003 arrives with C001-T-021.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { ARCH_FILE, architecture } from "./arch-fixture.ts";

test('a component without "Status" raises LINT-ARCH-003 naming the field', () => {
  const { findings } = lint({ [ARCH_FILE]: architecture({ components: [{ id: "C004-COMP-01" }, { id: "C004-COMP-03", omit: ["Status"] }] }) });
  const hits = withCode(findings, "LINT-ARCH-003");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.deepEqual(hits[0]?.ids, ["C004-COMP-03"]);
  assert.match(hits[0]?.message ?? "", /"Status"/);
});

test("a Status outside existing, new, modified, removed is reported", () => {
  const hits = withCode(lint({ [ARCH_FILE]: architecture({ components: [{ id: "C004-COMP-01", status: "planned" }] }) }).findings, "LINT-ARCH-003");
  assert.equal(hits.length, 1);
  assert.match(hits[0]?.message ?? "", /"planned"/);
});
