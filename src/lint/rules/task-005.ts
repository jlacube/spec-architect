// LINT-TASK-005 (error): more than one task of a change carries the archive-task marker (C005-REQ-115,
// C005-IF-002), task files and lite task sections alike, whatever the phase status. One finding per change,
// at the first marked task in ID order, naming every marked task.
import { tasks } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const task005: LintRule = {
  code: "LINT-TASK-005",
  severity: "error",
  fix: "Keep the marker only on the task that runs `sdd archive` for this change",
  scope: "file",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const marked = tasks(c)
        .filter((t) => t.archiveTask)
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      if (marked.length < 2) continue;
      const first = marked[0]!;
      const ids = marked.map((t) => t.id);
      out.push({
        path: `${c.folder}/${first.path}`,
        line: first.line,
        ids,
        message: `${marked.length} tasks carry the archive-task marker: ${ids.join(", ")}; a change has at most one archive task`,
      });
    }
    return out;
  },
};
