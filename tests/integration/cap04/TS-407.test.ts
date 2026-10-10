// C001-TC-407 — verifies C001-TS-407 (C001-AC-406.1, C001-REQ-406): two SHALLs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, REQ_FILE, requirements, withCode } from "./spec-fixture.ts";

test("a statement with SHALL and SHALL NOT is reported with LINT-EARS-002", () => {
  const { code, findings } = lint({
    [REQ_FILE]: requirements({ fields: { Pattern: "event-driven", Statement: "WHEN init runs, THE sdd CLI SHALL create SDD.md and SHALL NOT overwrite files." } }),
  });
  const hits = withCode(findings, "LINT-EARS-002");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.equal(hits[0]?.severity, "error");
  assert.deepEqual(hits[0]?.ids, ["C004-REQ-012"]);
  assert.equal(code, 1);
});

test("SHALL inside a code span does not count", () => {
  const { findings } = lint({ [REQ_FILE]: requirements({ fields: { Statement: "THE sdd CLI SHALL print `SHALL` in the report." } }) });
  assert.deepEqual(withCode(findings, "LINT-EARS-002"), []);
});
