// C001-TC-417 — verifies C001-TS-417 (C001-AC-415.1, C001-REQ-415): empty threshold.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOD_FILE, dodFile, lint, NFR_FILE, nfrFile, withCode } from "./spec-fixture.ts";

const DOD = dodFile(["C004-DOD-001", "test-report", "C004-REQ-012, C004-NFR-101 … 102"]);

test("an NFR whose Threshold is empty raises TR-04", () => {
  const { code, findings } = lint({ [DOD_FILE]: DOD, [NFR_FILE]: nfrFile("C004-NFR-102", { empty: ["Threshold"] }) });
  const hits = withCode(findings, "TR-04");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.equal(hits[0]?.severity, "error");
  assert.deepEqual(hits[0]?.ids, ["C004-NFR-102"]);
  assert.match(hits[0]?.message ?? "", /"Threshold"/);
  assert.deepEqual(withCode(findings, "LINT-NFR-001"), [], "the empty measure field is reported once");
  assert.equal(code, 1);
});

test("missing Metric and Method are TR-04 too", () => {
  const hits = withCode(lint({ [DOD_FILE]: DOD, [NFR_FILE]: nfrFile("C004-NFR-102", { omit: ["Metric", "Method"] }) }).findings, "TR-04");
  assert.equal(hits.length, 1);
  assert.match(hits[0]?.message ?? "", /"Metric", "Method"/);
});
