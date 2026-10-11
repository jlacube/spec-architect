// LINT-OBS-001 (error): an NFR of the change has no row in `78-observability.md` naming a signal and
// the task that implements it (C001-REQ-615). Full-profile plan rule.
import { findIds } from "../../model/ids.ts";
import { tables } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const OBS = "20-plan/78-observability.md";

export const obs001: LintRule = {
  code: "LINT-OBS-001",
  severity: "error",
  fix: "Map it in `78-observability.md`",
  scope: "change",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      if (!c.spec.planStarted || c.profile !== "full") continue;
      const nfrs = c.graph.nodes.filter((n) => n.type === "NFR" && n.form === "heading");
      if (nfrs.length === 0) continue;
      const doc = c.spec.docs.get(OBS);
      const mapped = new Set<string>();
      if (doc)
        for (const t of tables(doc, OBS))
          for (const r of t.rows) {
            const signal = (r.raw[1] ?? "").trim();
            const task = r.raw.slice(2).some((cell) => findIds(cell, c.change).some((h) => h.id.includes("-T-")));
            if (signal !== "" && task) for (const h of findIds(r.raw[0] ?? "", c.change)) mapped.add(h.id);
          }
      for (const n of nfrs)
        if (!mapped.has(n.id))
          out.push({ path: `${c.folder}/${doc ? OBS : n.file}`, line: doc ? 1 : n.line, ids: [n.id], message: `${n.id} has no observability signal with an implementing task` });
    }
    return out;
  },
};
