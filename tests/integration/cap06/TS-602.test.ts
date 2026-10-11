// C001-TC-602 — verifies C001-TS-602 (C001-AC-602.1, C001-REQ-602): task file shape (structure check of
// plan-structure.ts until a lint rule exists, defect D-003).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { taskProblems } from "./plan-structure.ts";

const GOOD = [
  "---",
  "id: C004-T-031",
  "title: Expiry guard",
  "milestone: C004-M-2",
  "status: todo",
  "depends_on: [C004-T-029]",
  "implements: [C004-REQ-012]",
  "satisfies_ac: [C004-AC-012.1]",
  "verified_by: [C004-TS-040, C004-TC-077]",
  "components: [C004-COMP-03]",
  "risk_refs: []",
  "estimate: M",
  "report: { commit: null, completed_at: null, notes: null }",
  "---",
  "# C004-T-031 — Expiry guard",
  "",
  ...["Intent", "Targets", "Preconditions", "Step outline", "Verification", "Done when"].flatMap((h) => [`## ${h}`, "x", ""]),
].join("\n");

test("a task file with the IF-03 §3 frontmatter and the six headings has no problem", () => {
  assert.deepEqual(taskProblems(GOOD), []);
});

test("missing frontmatter keys, a bad status and a missing heading are reported", () => {
  const bad = GOOD.replace("estimate: M\n", "").replace("status: todo", "status: started").replace("## Preconditions\nx\n", "");
  assert.deepEqual(taskProblems(bad).sort(), ["frontmatter lacks estimate", "heading Preconditions missing", "status started"]);
});

test("every task file of CHG-001 (the worked example) has the shape", () => {
  const dir = join(repoRoot(), ".sdd", "001-architect-agent-suite", "20-plan", "50-tasks");
  for (const f of readdirSync(dir)) assert.deepEqual(taskProblems(readFileSync(join(dir, f), "utf8")), [], f);
});
