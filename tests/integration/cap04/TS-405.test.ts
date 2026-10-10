// C001-TC-405 — verifies C001-TS-405 (C001-AC-405.1, C001-REQ-405): EARS shape mismatch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, REQ_FILE, requirements, withCode } from "./spec-fixture.ts";

// The scenario's Examples table, verbatim.
const rows: [declared: string, statement: string, contains: boolean][] = [
  ["event-driven", "WHEN a file is saved, THE linter SHALL re-run checks.", false],
  ["event-driven", "THE linter SHALL re-run checks after saves.", true],
  ["unwanted-behaviour", "IF the file is missing, THEN THE sdd CLI SHALL exit with code 2.", false],
  ["unwanted-behaviour", "IF the file is missing, THE sdd CLI SHALL exit with code 2.", true],
  ["state-driven", "WHILE a gate is pending, THE conductor SHALL refuse new phases.", false],
  ["optional-feature", "WHERE lite profile is used, THE sdd CLI SHALL scaffold 6 files.", false],
  ["complex", "WHILE offline, WHEN a sync is requested, THE client SHALL queue it.", false],
  ["ubiquitous", "WHEN asked, THE sdd CLI SHALL print its version.", true],
];

for (const [declared, statement, contains] of rows) {
  test(`${declared}: "${statement}" ${contains ? "is" : "is not"} reported`, () => {
    const { findings } = lint({ [REQ_FILE]: requirements({ fields: { Pattern: declared, Statement: statement } }) });
    const hits = withCode(findings, "LINT-EARS-001");
    assert.equal(hits.length, contains ? 1 : 0, JSON.stringify(findings));
    if (contains) {
      assert.equal(hits[0]?.severity, "error");
      assert.deepEqual(hits[0]?.ids, ["C004-REQ-012"]);
      // The message carries the declared pattern and the detected shape.
      assert.match(hits[0]?.message ?? "", new RegExp(`declared ${declared} but has the shape \\S+`));
    }
  });
}
