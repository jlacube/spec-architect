// C001-TC-617 — verifies C001-TS-617 (C001-AC-614.1, C001-REQ-614): rollout file, both Examples rows
// (structure check until a lint rule exists, defect D-003).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { rolloutProblems } from "./plan-structure.ts";

const FULL = [
  "## 1. Migration",
  "",
  "Run the migration script.",
  "",
  "## 2. Feature flags",
  "",
  "| Flag | Default |",
  "|---|---|",
  "| coupons | off |",
  "",
  "## 3. Rollback",
  "",
  "| ID | When | Steps | Linked |",
  "|---|---|---|---|",
  "| C004-RB-001 | errors | disable flag | C004-T-007 |",
  "",
  "## 4. Communication",
  "",
  "Tell support before enabling.",
  "",
].join("\n");

test("impact yes: migration, flags with defaults, RB-IDs linked to T or M, communication", () => {
  assert.deepEqual(rolloutProblems(FULL), []);
  const bad = FULL.replace("| C004-T-007 |", "| none |").replace("Tell support before enabling.\n", "");
  assert.deepEqual(rolloutProblems(bad).sort(), ["C004-RB-001: not linked to a T or M ID", "no communication notes"]);
});

test("impact none: the statement with a reason", () => {
  assert.deepEqual(rolloutProblems("No rollout impact — the change only adds a report nobody depends on.\n"), []);
  assert.deepEqual(rolloutProblems("No rollout impact.\n"), ['"No rollout impact" without a reason']);
});

test("the CHG-001 rollout (the worked example) is complete", () => {
  assert.deepEqual(rolloutProblems(readFileSync(join(repoRoot(), ".sdd", "001-architect-agent-suite", "20-plan", "75-rollout.md"), "utf8")), []);
});
