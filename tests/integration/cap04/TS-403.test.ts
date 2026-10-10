// C001-TC-403 — verifies C001-TS-403 (C001-AC-403.1, C001-REQ-403): persona not defined.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, PERSONAS_FILE, personas, STORIES_FILE, story, storiesFile, withCode } from "./spec-fixture.ts";

test("a story naming P-09 when only P-01 to P-04 exist is reported with LINT-US-001", () => {
  const { code, findings } = lint({
    [PERSONAS_FILE]: personas("P-01", "P-02", "P-03", "P-04"),
    [STORIES_FILE]: storiesFile(story("C004-US-001"), story("C004-US-005", { asA: "P-09 auditor" })),
  });
  const hits = withCode(findings, "LINT-US-001");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.equal(hits[0]?.severity, "error");
  assert.deepEqual(hits[0]?.ids, ["C004-US-005"]);
  assert.match(hits[0]?.message ?? "", /P-09/);
  assert.equal(code, 1);
});

test("a story naming a defined persona has no LINT-US-001", () => {
  const { findings } = lint({ [PERSONAS_FILE]: personas("P-01", "P-02", "P-03", "P-04"), [STORIES_FILE]: storiesFile(story("C004-US-001", { asA: "P-04 auditor" })) });
  assert.deepEqual(withCode(findings, "LINT-US-001"), []);
});
