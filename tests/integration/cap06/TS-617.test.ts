// C001-TC-617 — verifies C001-TS-617 (C001-AC-614.1, C001-REQ-614): rollout file, both Examples rows,
// reported as LINT-ROLL-001 (C001-T-076; the structure check of C001-T-043 promoted to a rule after
// defect D-003).
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { PLAN, plan, workedExample } from "./plan-fixture.ts";

const ROLLOUT = `${PLAN}/75-rollout.md`;
const FRONTMATTER = "---\nid: C004-PLAN-ROLLOUT\nartifact: plan/rollout\n---\n\n";
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
  "| C004-RB-001 | errors | disable flag | C004-T-001 |",
  "",
  "## 4. Communication",
  "",
  "Tell support before enabling.",
  "",
].join("\n");
const roll = (body: string) => withCode(lint(plan([ROLLOUT, FRONTMATTER + body])).findings, "LINT-ROLL-001");

test("impact yes: migration, flags with defaults, RB-IDs linked to T or M, communication", () => {
  assert.deepEqual(roll(FULL), []);
  const hits = roll(FULL.replace("| C004-T-001 |", "| none |").replace("Tell support before enabling.\n", ""));
  assert.deepEqual(hits.map((h) => h.message).sort(), [
    "Rollout content missing: C004-RB-001 is not linked to a T or M ID",
    "Rollout content missing: no communication notes",
  ]);
  assert.deepEqual(hits.find((h) => h.message.includes("RB-001"))?.ids, ["C004-RB-001"]);
});

test("impact yes: a flag without a default value raises LINT-ROLL-001; a flags section saying none does not", () => {
  assert.deepEqual(roll(FULL.replace("| coupons | off |", "| coupons |  |")).map((h) => h.message), ["Rollout content missing: feature flag coupons has no default value"]);
  assert.deepEqual(roll(FULL.replace("| Flag | Default |\n|---|---|\n| coupons | off |", "None.")), []);
});

test("impact none: the statement with a reason", () => {
  assert.deepEqual(roll("No rollout impact — the change only adds a report nobody depends on.\n"), []);
  assert.deepEqual(roll("No rollout impact.\n").map((h) => h.message), ['Rollout content missing: "No rollout impact" without a reason']);
});

test("the template's guidance comment is not a no-impact statement", () => {
  const template = '<!-- Guidance: either fill the sections below or replace them with "No rollout impact" and its reason. -->\n\n## Migration steps\n\n## Feature flags\n| Flag | Default | Purpose |\n|---|---|---|\n\n## Rollback\n| ID | Trigger | Steps | Linked to |\n|---|---|---|---|\n\n## Communication\n';
  assert.deepEqual(roll(template).map((h) => h.message).sort(), [
    "Rollout content missing: feature flags lists no flag and does not say none",
    "Rollout content missing: no communication notes",
    "Rollout content missing: no migration steps",
    "Rollout content missing: no rollback steps RB-<seq>",
  ]);
});

test("the CHG-001 rollout (the worked example) raises no LINT-ROLL-001", () => {
  assert.deepEqual(workedExample("LINT-ROLL-001"), []);
});
