// C001-TC-415 — verifies C001-TS-415 (C001-AC-413.1, C001-REQ-413): scenario step structure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { COVERAGE } from "../cli/helpers.ts";
import { ACCEPTANCE_FILE, lint, withCode } from "./spec-fixture.ts";

function acceptanceWith(steps: string): string {
  return `---\nid: C004-CAP-01\nartifact: spec/acceptance\n---\n\n#### C004-AC-012.1 — Criterion\n\`\`\`gherkin\nScenario: C004-TS-012 — s\n${steps}\`\`\`\n\n${COVERAGE}`;
}

// The scenario's Examples table, verbatim.
const rows: [givens: number, whens: number, thens: number, contains: boolean][] = [
  [1, 1, 1, false],
  [0, 1, 1, false],
  [1, 2, 1, true],
  [2, 1, 0, true],
];

for (const [givens, whens, thens, contains] of rows) {
  test(`${givens} Given, ${whens} When, ${thens} Then: LINT-TS-001 ${contains ? "reported" : "not reported"}`, () => {
    const steps = [...Array(givens).fill("  Given g"), ...Array(whens).fill("  When w"), ...Array(thens).fill("  Then t")].join("\n") + "\n";
    const hits = withCode(lint({ [ACCEPTANCE_FILE]: acceptanceWith(steps) }).findings, "LINT-TS-001");
    assert.equal(hits.length, contains ? 1 : 0, JSON.stringify(hits));
    if (contains) assert.deepEqual(hits[0]?.ids, ["C004-TS-012"]);
  });
}

test("And/But continue the previous keyword and Outline Examples are not steps", () => {
  const steps = "  Given g\n  And g2\n  When w\n  Then t\n  But t2\n  Examples:\n    | a |\n    | When |\n";
  assert.deepEqual(withCode(lint({ [ACCEPTANCE_FILE]: acceptanceWith(steps) }).findings, "LINT-TS-001"), []);
  const twoWhens = "  Given g\n  When w\n  And w2\n  Then t\n";
  assert.equal(withCode(lint({ [ACCEPTANCE_FILE]: acceptanceWith(twoWhens) }).findings, "LINT-TS-001").length, 1);
});
