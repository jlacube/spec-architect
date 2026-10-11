// C001-TC-620 — verifies C001-TS-620 (C001-AC-617.2, C001-REQ-618): the ordered task list respects
// dependencies (structure check until a lint rule exists, defect D-003).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { repoRoot } from "../../helpers.ts";
import { orderedListProblems, type TaskRef } from "./plan-structure.ts";

const TASKS: TaskRef[] = [
  { id: "C004-T-001", dependsOn: [], status: "todo" },
  { id: "C004-T-002", dependsOn: ["C004-T-001"], status: "todo" },
  { id: "C004-T-003", dependsOn: ["C004-T-001"], status: "dropped" },
];
const row = (id: string) => `| ${id} | title | .sdd/004-x/20-plan/50-tasks/T-${id.slice(-3)}-x.md |`;
const LIST = (ids: string[]) => ["## Ordered task list", "", "| Task | Title | File |", "|---|---|---|", ...ids.map(row), ""].join("\n");

test("every non-dropped task once, with its path, after its dependencies", () => {
  assert.deepEqual(orderedListProblems(LIST(["C004-T-001", "C004-T-002"]), TASKS), []);
});

test("a task before its dependency, a missing task and a missing path are reported", () => {
  assert.deepEqual(orderedListProblems(LIST(["C004-T-002", "C004-T-001"]), TASKS), ["C004-T-002 listed before its dependency C004-T-001"]);
  assert.deepEqual(orderedListProblems(LIST(["C004-T-001"]), TASKS), ["C004-T-002 appears 0 times"]);
  const noPaths = "## Ordered task list\n\n- C004-T-001 title\n- C004-T-002 title\n";
  assert.deepEqual(orderedListProblems(noPaths, TASKS).sort(), ["C004-T-001: no path relative to the repository root", "C004-T-002: no path relative to the repository root"]);
});

test("the CHG-001 hand-off (the worked example) lists its tasks in dependency order", () => {
  const plan = join(repoRoot(), ".sdd", "001-architect-agent-suite", "20-plan");
  const tasks = readdirSync(join(plan, "50-tasks")).map((f) => {
    const fm = (splitFrontmatter(readFileSync(join(plan, "50-tasks", f), "utf8")).data ?? {}) as Record<string, unknown>;
    return { id: String(fm["id"]), dependsOn: (fm["depends_on"] as string[]) ?? [], status: String(fm["status"]) };
  });
  assert.deepEqual(orderedListProblems(readFileSync(join(plan, "handoff.md"), "utf8"), tasks), []);
});
