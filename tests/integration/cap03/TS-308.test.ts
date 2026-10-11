// C001-TC-308 — verifies C001-TS-308 (C001-AC-307.1, C001-REQ-307): confidence rating present. Plan
// owner C001-T-035 (researcher); LINT-RES-002 arrives with C001-T-021.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { NOTE, note } from "./research-fixture.ts";

const SRC = "sources: https://docs.example.com/x (2026-10-01)";

test("a finding without high, medium or low and a reason raises LINT-RES-002", () => {
  const { findings } = lint({
    [NOTE]: note([
      `Rated — ${SRC} — confidence: high (official docs)`,
      `Unrated — ${SRC}`,
      `Bad level — ${SRC} — confidence: certain (docs)`,
      `No reason — ${SRC} — confidence: medium`,
    ]),
  });
  assert.deepEqual(withCode(findings, "LINT-RES-002").map((h) => h.line), [12, 13, 14], JSON.stringify(findings));
  assert.deepEqual(withCode(findings, "LINT-RES-001"), []);
});
