// LINT-PLAN-001 (error): a milestone of `10-strategy.md` lacks a goal, an exit criterion or a task
// ID (C001-REQ-601).
import { findIds } from "../../model/ids.ts";
import { tables } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const STRATEGY = "20-plan/10-strategy.md";

export const plan001: LintRule = {
  code: "LINT-PLAN-001",
  severity: "error",
  fix: "Add goal, exit criterion, tasks",
  scope: "file",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const doc = c.spec.docs.get(STRATEGY);
      if (!c.spec.planStarted || !doc) continue;
      for (const t of tables(doc, STRATEGY))
        for (const r of t.rows) {
          const id = findIds(r.raw[0] ?? "", c.change).find((h) => h.id.includes("-M-"))?.id;
          if (!id) continue;
          const cell = (name: string) => (r.cells.get(name) ?? "").trim();
          const missing = [
            ...(cell("goal") === "" ? ["goal"] : []),
            ...(cell("exit criterion") === "" ? ["exit criterion"] : []),
            ...(findIds(cell("tasks"), c.change).some((h) => h.id.includes("-T-")) ? [] : ["task IDs"]),
          ];
          if (missing.length > 0) out.push({ path: `${c.folder}/${STRATEGY}`, line: r.line, ids: [id], message: `${id} lacks ${missing.join(", ")}` });
        }
    }
    return out;
  },
};
