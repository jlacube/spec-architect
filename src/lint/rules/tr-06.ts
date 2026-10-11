// TR-06 (error): a requirement is listed in the `implements` of no task (C001-REQ-605). Plan rule:
// runs once the plan phase has started; dropped tasks do not count.
import { tasks } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const tr06: LintRule = {
  code: "TR-06",
  severity: "error",
  fix: "List the requirement in a task's implements",
  scope: "change",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      if (!c.spec.planStarted) continue;
      const planned = new Set(tasks(c).filter((t) => t.status !== "dropped").flatMap((t) => t.implements));
      for (const n of c.graph.nodes)
        if (n.type === "REQ" && n.form === "heading" && !planned.has(n.id))
          out.push({ path: `${c.folder}/${n.file}`, line: n.line, ids: [n.id], message: `${n.id} is implemented by no task` });
    }
    return out;
  },
};
