// C001-TC-406 — verifies C001-TS-406 (C001-AC-405.2, C001-REQ-405): lower-case keywords accepted.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, REQ_FILE, requirements, withCode } from "./spec-fixture.ts";

test("an event-driven statement in lower case is not reported", () => {
  const { findings } = lint({
    [REQ_FILE]: requirements({ fields: { Pattern: "event-driven", Statement: "When a file is saved, the linter shall re-run checks." } }),
  });
  assert.deepEqual(withCode(findings, "LINT-EARS-001"), []);
});
