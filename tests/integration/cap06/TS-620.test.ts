// C001-TC-620 — verifies C001-TS-620 (C001-AC-617.1, C001-REQ-617): the ordered task list respects
// dependencies, reported as LINT-HAND-002 (C001-T-076; the structure check of C001-T-043 promoted to a
// rule after defect D-003).
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { LITE_CHANGE_MD, PLAN, plan, task, workedExample } from "./plan-fixture.ts";

const HANDOFF = `${PLAN}/handoff.md`;
const TASKS = [task("002", { dependsOn: ["C004-T-001"] }), task("003", { dependsOn: ["C004-T-001"], status: "dropped" })];
const row = (id: string) => `| ${id} | Thing | .sdd/004-x/20-plan/50-tasks/T-${id.slice(-3)}-x.md |`;
const handoff = (lines: string[]): [string, string] => [
  HANDOFF,
  ["---", "id: C004-PLAN-HANDOFF", "artifact: plan/handoff", "---", "", "## Ordered task list", "", "| Task | Title | File |", "|---|---|---|", ...lines, ""].join("\n"),
];
const hits = (lines: string[]) => withCode(lint(plan(...TASKS, handoff(lines))).findings, "LINT-HAND-002");

test("every non-dropped task once, with its path, after its dependencies: no LINT-HAND-002", () => {
  assert.deepEqual(hits([row("C004-T-001"), row("C004-T-002")]), []);
});

test("a task before its dependency, a missing task, a repeated task and a wrong or missing path raise LINT-HAND-002", () => {
  assert.deepEqual(hits([row("C004-T-002"), row("C004-T-001")]).map((h) => [h.line, h.ids, h.message]), [
    [10, ["C004-T-002", "C004-T-001"], "Ordered task list out of dependency order: C004-T-002 is listed before its dependency C004-T-001"],
  ]);
  assert.deepEqual(hits([row("C004-T-001")]).map((h) => [h.line, h.ids, h.message]), [[6, ["C004-T-002"], "Ordered task list incomplete: C004-T-002 is not listed"]]);
  assert.deepEqual(hits([row("C004-T-001"), row("C004-T-002"), row("C004-T-001")]).map((h) => h.message), ["Ordered task list incomplete: C004-T-001 is listed 2 times"]);
  assert.deepEqual(hits(["- C004-T-001 Thing", row("C004-T-002").replace("T-002-x.md", "T-009-x.md")]).map((h) => h.message), [
    "Ordered task list incomplete: C004-T-001 has no path relative to the repository root",
    "Ordered task list incomplete: C004-T-002 names .sdd/004-x/20-plan/50-tasks/T-009-x.md, not its file .sdd/004-x/20-plan/50-tasks/T-002-x.md",
  ]);
});

test("a mention of a task ID in prose is not a list entry", () => {
  assert.deepEqual(hits(["", "C004-T-002 waits for C004-T-001.", "", "| Task | Title | File |", "|---|---|---|", row("C004-T-001"), row("C004-T-002")]), []);
});

test("lite: tasks of plan.md are listed with the path of plan.md", () => {
  const plan_md = "---\nid: C004-PLAN\nartifact: plan/lite\n---\n\n## Tasks\n\n### C004-T-001 — Thing\n- **Status:** todo\n\n### C004-T-002 — Other\n- **Status:** todo\n- **Depends on:** C004-T-001\n";
  const files = (lines: string[]) => {
    const out: Record<string, string> = { ...plan(handoff(lines)), ".sdd/004-x/change.md": LITE_CHANGE_MD, [`${PLAN}/plan.md`]: plan_md };
    delete out[`${PLAN}/50-tasks/T-001-x.md`];
    return out;
  };
  const lite = (id: string) => `| ${id} | Thing | .sdd/004-x/20-plan/plan.md |`;
  assert.deepEqual(withCode(lint(files([lite("C004-T-001"), lite("C004-T-002")])).findings, "LINT-HAND-002"), []);
  assert.deepEqual(withCode(lint(files([lite("C004-T-002"), lite("C004-T-001")])).findings, "LINT-HAND-002").length, 1);
});

test("the CHG-001 hand-off (the worked example) raises no LINT-HAND-002", () => {
  assert.deepEqual(workedExample("LINT-HAND-002"), []);
});
