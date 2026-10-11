// C001-TC-619 — verifies C001-TS-619 (C001-AC-617.1, C001-REQ-617): handoff.md shape (structure check until
// a lint rule exists, defect D-003).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { handoffProblems } from "./plan-structure.ts";

const GOOD = [
  "## Reading order",
  "x",
  "## Rules",
  "x",
  "## Reporting protocol",
  "Use sdd task set and sdd defect add; frontmatter fallback: edit status in the task file.",
  "## Definition of change done",
  "x",
  "## Ordered task list",
  "x",
  "",
].join("\n");

test("the five headings and a reporting protocol with both commands and the fallback", () => {
  assert.deepEqual(handoffProblems(GOOD), []);
  const bad = GOOD.replace("## Rules\nx\n", "").replace("; frontmatter fallback: edit status in the task file.", ".");
  assert.deepEqual(handoffProblems(bad).sort(), ["Reporting protocol lacks the frontmatter fallback", "heading Rules missing"]);
});

test("the CHG-001 hand-off (the worked example) has the shape", () => {
  assert.deepEqual(handoffProblems(readFileSync(join(repoRoot(), ".sdd", "001-architect-agent-suite", "20-plan", "handoff.md"), "utf8")), []);
});
