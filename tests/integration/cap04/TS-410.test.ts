// C001-TC-410 — verifies C001-TS-410 (C001-AC-408.2, C001-REQ-408): weak words in code or quotes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ACCEPTANCE_FILE, acceptance, lint, withCode } from "./spec-fixture.ts";

test("an acceptance criterion with `--fast` and \"as needed\" is not reported", () => {
  const { findings } = lint({ [ACCEPTANCE_FILE]: acceptance('The output contains `--fast` and the message "as needed"') });
  assert.deepEqual(withCode(findings, "LINT-WORD-001"), []);
});

test("the same words outside code and quotes are reported", () => {
  const { findings } = lint({ [ACCEPTANCE_FILE]: acceptance("The output is fast and arrives as needed") });
  const hits = withCode(findings, "LINT-WORD-001");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.deepEqual(hits[0]?.ids, ["C004-AC-012.1"]);
  assert.match(hits[0]?.message ?? "", /"fast", "as needed"/);
});
