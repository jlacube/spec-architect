// C001-TC-404 — verifies C001-TS-404 (C001-AC-404.1, C001-REQ-404): missing requirement field.
// Plan owner C001-T-037 (spec-writer); the rule LINT-REQ-001 arrives with C001-T-019.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, REQ_FILE, requirements, withCode } from "./spec-fixture.ts";

const rows: [kind: string, field: string, contains: boolean][] = [
  ["greenfield", "Pattern", true],
  ["greenfield", "Acceptance", true],
  ["greenfield", "Delta", false],
  ["brownfield", "Delta", true],
];

for (const [kind, field, contains] of rows) {
  test(`${kind} requirement without ${field}: LINT-REQ-001 ${contains ? "reported" : "not reported"}`, () => {
    const { findings } = lint({
      ".sdd/004-x/change.md": `---\nid: CHG-004\ntitle: x\nkind: ${kind}\n---\n# CHG-004\n`,
      [REQ_FILE]: requirements({ omit: [field] }),
    });
    const hits = withCode(findings, "LINT-REQ-001").filter((f) => f.message.includes(`"${field}"`));
    assert.equal(hits.length, contains ? 1 : 0, JSON.stringify(findings));
    if (contains) assert.deepEqual(hits[0]?.ids, ["C004-REQ-012"]);
  });
}

test("a pattern outside the EARS patterns is a LINT-REQ-001 finding", () => {
  const { findings } = lint({ [REQ_FILE]: requirements({ fields: { Pattern: "conditional" } }) });
  assert.ok(withCode(findings, "LINT-REQ-001").some((f) => f.message.includes('"conditional"')), JSON.stringify(findings));
});
