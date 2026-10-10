// C001-TC-412 — verifies C001-TS-412 (C001-AC-410.1, C001-REQ-410): TR-09 enforcement.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BROWNFIELD, lint, REQ_FILE, requirements, withCode } from "./spec-fixture.ts";

const LIVING = "---\ncapability: pay\ninventory_only: false\nupdated: 2026-10-01\n---\n# Pay\n\n## Requirements\n\n### C002-REQ-044 — Intent\n- **Statement:** THE payment service SHALL create one intent per order.\n";

// The scenario's Examples table, verbatim ("(none)" = no Evidence field).
const rows: [delta: string, evidence: string, contains: boolean][] = [
  ["MODIFIED", "src/pay.ts:118 createIntent() — layer: serena", false],
  ["MODIFIED", "(none)", true],
  ["REMOVED", "src/legacy/batch.ts — layer: grep", true],
  ["ADDED", "(none)", false],
];

for (const [delta, evidence, contains] of rows) {
  test(`Delta ${delta} with Evidence "${evidence}": TR-09 ${contains ? "reported" : "not reported"}`, () => {
    const tag = delta === "ADDED" ? "ADDED" : `${delta} (was C002-REQ-044)`;
    const { findings } = lint({
      ".sdd/004-x/change.md": BROWNFIELD,
      ".sdd/_living/CAP-pay.md": LIVING,
      [REQ_FILE]: requirements({ extra: { Delta: tag, ...(evidence === "(none)" ? {} : { Evidence: evidence }) } }),
    });
    const hits = withCode(findings, "TR-09");
    assert.equal(hits.length, contains ? 1 : 0, JSON.stringify(findings));
    if (contains) assert.deepEqual(hits[0]?.ids, ["C004-REQ-012"]);
    // The third row fails because the symbol is missing.
    if (delta === "REMOVED") assert.match(hits[0]?.message ?? "", /symbol/);
  });
}

test("a greenfield change is not checked", () => {
  const { findings } = lint({ [REQ_FILE]: requirements({ extra: { Delta: "MODIFIED (was C002-REQ-044)" } }) });
  assert.deepEqual(withCode(findings, "TR-09"), []);
});
