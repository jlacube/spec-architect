// C001-TC-513 — verifies C001-TS-513 (C001-AC-513.1, C001-REQ-513): error codes catalogued. Plan
// owner C001-T-042 (architect); LINT-ERR-001 arrives with C001-T-021.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, REQ_FILE, requirements, withCode } from "../cap04/spec-fixture.ts";

const ERRORS = ".sdd/004-x/10-spec/50-interfaces/errors.md";
const statement = "IF the card is declined, THEN THE sdd CLI SHALL report `ERR-PAY-007`.";

test("a code referenced in a requirement and catalogued raises no LINT-ERR-001", () => {
  const { findings } = lint({
    [REQ_FILE]: requirements({ fields: { Pattern: "unwanted-behaviour", Statement: statement } }),
    [ERRORS]: "# Errors\n\n| Code | Condition | Message | Spec |\n|---|---|---|---|\n| ERR-PAY-007 | Card declined | The card was declined | C004-REQ-012 |\n",
  });
  assert.deepEqual(withCode(findings, "LINT-ERR-001"), []);
});

test("a code absent from errors.md raises LINT-ERR-001", () => {
  const { findings } = lint({ [REQ_FILE]: requirements({ fields: { Pattern: "unwanted-behaviour", Statement: statement } }), [ERRORS]: "# Errors\n" });
  const hits = withCode(findings, "LINT-ERR-001");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.deepEqual(hits[0]?.ids, ["C004-REQ-012"]);
  assert.match(hits[0]?.message ?? "", /ERR-PAY-007/);
});
