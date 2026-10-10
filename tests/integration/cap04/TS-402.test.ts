// C001-TC-402 — verifies C001-TS-402 (C001-AC-402.1, C001-REQ-402): missing story field.
// Plan owner C001-T-037 (spec-writer); the rule LINT-US-002 arrives with C001-T-019.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, STORIES_FILE, story, storiesFile, withCode } from "./spec-fixture.ts";

test('a story without "So that" is reported with LINT-US-002 naming the field', () => {
  const { findings } = lint({ [STORIES_FILE]: storiesFile(story("C004-US-001"), story("C004-US-003", { omit: "So that" })) });
  const hits = withCode(findings, "LINT-US-002");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.deepEqual(hits[0]?.ids, ["C004-US-003"]);
  assert.match(hits[0]?.message ?? "", /"So that"/);
});

test("a story with every field has no LINT-US-002", () => {
  assert.deepEqual(withCode(lint({}).findings, "LINT-US-002"), []);
});
