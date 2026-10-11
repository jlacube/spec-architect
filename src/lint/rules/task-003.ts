// LINT-TASK-003 (warn): a task has status done and an empty `report.commit` (lite: Commit field)
// (C001-REQ-906).
import { tasks } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const task003: LintRule = {
  code: "LINT-TASK-003",
  severity: "warn",
  fix: "Add `--commit`",
  scope: "file",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const t of tasks(c))
        if (t.status === "done" && (t.commit === "" || t.commit === "null"))
          out.push({ path: `${c.folder}/${t.path}`, line: t.line, ids: [t.id], message: `${t.id} is done but records no commit` });
    return out;
  },
};
