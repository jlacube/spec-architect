// C001-TC-514 — verifies C001-TS-514 (C001-AC-514.1, C001-REQ-514): constraint without source.
// Plan owner C001-T-042 (architect); LINT-CON-001 arrives with C001-T-021.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";

const CONSTRAINTS = ".sdd/004-x/10-spec/60-architecture/constraints.md";
const table = (source: string) =>
  "---\nid: C004-SPEC-CONSTRAINTS\nartifact: spec/constraints\n---\n\n| ID | Constraint | Source | Affects |\n|---|---|---|---|\n" +
  `| C004-CON-03 | One writer at a time | ${source} | C004-COMP-01 |\n`;

test("a constraint without a source raises LINT-CON-001", () => {
  for (const source of ["", "—"]) {
    const hits = withCode(lint({ [CONSTRAINTS]: table(source) }).findings, "LINT-CON-001");
    assert.deepEqual(hits.map((h) => h.ids), [["C004-CON-03"]], JSON.stringify(source));
  }
});

test("a constraint with a source raises none", () => {
  assert.deepEqual(withCode(lint({ [CONSTRAINTS]: table("C004-DEC-001") }).findings, "LINT-CON-001"), []);
});
