// C001-TC-619 — verifies C001-TS-619 (C001-AC-616.1, C001-REQ-616): handoff.md shape, reported as
// LINT-HAND-001 (C001-T-076; the structure check of C001-T-043 promoted to a rule after defect D-003).
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { PLAN, plan, workedExample } from "./plan-fixture.ts";

const HANDOFF = `${PLAN}/handoff.md`;
const GOOD = [
  "---",
  "id: C004-PLAN-HANDOFF",
  "artifact: plan/handoff",
  "---",
  "",
  "## Reading order",
  "x",
  "## Rules",
  "x",
  "## Reporting protocol",
  "Use sdd task set and sdd defect add; frontmatter fallback: edit status in the task file.",
  "## Definition of change done",
  "x",
  "## Ordered task list",
  "| Task | Title | File |",
  "|---|---|---|",
  "| C004-T-001 | Thing | .sdd/004-x/20-plan/50-tasks/T-001-x.md |",
  "",
].join("\n");
const hand = (text: string) => withCode(lint(plan([HANDOFF, text])).findings, "LINT-HAND-001");

test("the five headings and a reporting protocol with both commands and the fallback raise no LINT-HAND-001", () => {
  assert.deepEqual(hand(GOOD), []);
});

test("a missing heading and a reporting protocol without the fallback raise LINT-HAND-001", () => {
  const hits = hand(GOOD.replace("## Rules\nx\n", "").replace("; frontmatter fallback: edit status in the task file.", "."));
  assert.deepEqual(hits.map((h) => [h.line, h.message]), [
    [1, "Hand-off section missing: Rules"],
    [8, "Reporting protocol incomplete: no frontmatter fallback"],
  ]);
});

test("a reporting protocol without the defect add command raises LINT-HAND-001", () => {
  assert.deepEqual(hand(GOOD.replace(" and sdd defect add", "")).map((h) => h.message), ['Reporting protocol incomplete: no "defect add" command']);
});

test("the CHG-001 hand-off (the worked example) raises no LINT-HAND-001", () => {
  assert.deepEqual(workedExample("LINT-HAND-001"), []);
});
