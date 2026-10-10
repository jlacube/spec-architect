// C001-TC-416 — verifies C001-TS-416 (C001-AC-414.1, C001-REQ-414): NFR missing Environment.
// Plan owner C001-T-037 (spec-writer); LINT-NFR-001 arrives with C001-T-020.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOD_FILE, dodFile, lint, NFR_FILE, nfrFile, withCode } from "./spec-fixture.ts";

const DOD = dodFile(["C004-DOD-001", "test-report", "C004-REQ-012, C004-NFR-101"]);

test('an NFR without "Environment" raises LINT-NFR-001 naming the field', () => {
  const { findings } = lint({ [DOD_FILE]: DOD, [NFR_FILE]: nfrFile("C004-NFR-101", { omit: ["Environment"] }) });
  const hits = withCode(findings, "LINT-NFR-001");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.deepEqual(hits[0]?.ids, ["C004-NFR-101"]);
  assert.match(hits[0]?.message ?? "", /"Environment"/);
});

test("a complete NFR raises no finding", () => {
  const { findings } = lint({ [DOD_FILE]: DOD, [NFR_FILE]: nfrFile("C004-NFR-101") });
  assert.deepEqual(findings, []);
});
