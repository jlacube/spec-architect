// C001-TC-422 — verifies C001-TS-422 (C001-AC-420.1, C001-REQ-420): DoD item without evidence type.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOD_FILE, dodFile, lint, withCode } from "./spec-fixture.ts";

test("a DoD item without an evidence type raises LINT-DOD-001", () => {
  const { findings } = lint({
    [DOD_FILE]: dodFile(["C004-DOD-001", "test-report", "C004-REQ-012"], ["C004-DOD-004", "", "C004-REQ-012"]),
  });
  const hits = withCode(findings, "LINT-DOD-001");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.equal(hits[0]?.severity, "error");
  assert.deepEqual(hits[0]?.ids, ["C004-DOD-004"]);
});

test("an evidence value outside C001-IF-03 §8 is reported; each listed type is accepted", () => {
  const bad = withCode(lint({ [DOD_FILE]: dodFile(["C004-DOD-001", "manual check", "C004-REQ-012"]) }).findings, "LINT-DOD-001");
  assert.equal(bad.length, 1);
  for (const type of ["test-report", "coverage-report", "benchmark-report", "command-output", "screenshot", "link", "review-record", "metric-snapshot"])
    assert.deepEqual(withCode(lint({ [DOD_FILE]: dodFile(["C004-DOD-001", type, "C004-REQ-012"]) }).findings, "LINT-DOD-001"), [], type);
});

test("TR-05: DoD covers requirements directly, through lists and ranges, or through their capability", () => {
  for (const covers of ["C004-REQ-012", "C004-REQ-011 … 013", "C004-REQ-010, 012", "CAP-01 (C004-REQ-001 … 002)"])
    assert.deepEqual(withCode(lint({ [DOD_FILE]: dodFile(["C004-DOD-001", "test-report", covers]) }).findings, "TR-05"), [], covers);
  const hits = withCode(lint({ [DOD_FILE]: dodFile(["C004-DOD-001", "test-report", "C004-REQ-013"]) }).findings, "TR-05");
  assert.deepEqual(hits.map((h) => h.ids), [["C004-REQ-012"]]);
});
