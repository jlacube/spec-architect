// TR-07 (error): a task lists no REQ or AC in implements/satisfies_ac, or no TS or TC in
// verified_by (C001-REQ-606). Dropped tasks are not checked.
import { tasks } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const has = (ids: string[], ...types: string[]) => ids.some((id) => types.some((t) => id.includes(`-${t}-`)));

export const tr07: LintRule = {
  code: "TR-07",
  severity: "error",
  fix: "Link the task to a REQ or AC and to a TS or TC",
  scope: "file",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      if (!c.spec.planStarted) continue;
      for (const t of tasks(c)) {
        if (t.status === "dropped") continue;
        const missing = [
          ...(has([...t.implements, ...t.satisfiesAc], "REQ", "AC") ? [] : ["no REQ or AC in implements or satisfies_ac"]),
          ...(has(t.verifiedBy, "TS", "TC") ? [] : ["no TS or TC in verified_by"]),
        ];
        if (missing.length > 0) out.push({ path: `${c.folder}/${t.path}`, line: t.line, ids: [t.id], message: `${t.id} lists ${missing.join(" and ")}` });
      }
    }
    return out;
  },
};
