// TR-14 (warn): a high-impact risk has neither a mitigation task nor an explicit acceptance
// ("accepted by P-NN") in its Mitigation (C001-IF-04 §5).
import { findIds } from "../../model/ids.ts";
import { planDocs, tables } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export interface RiskRow {
  id: string;
  path: string;
  line: number;
  impact: string;
  mitigation: string;
  /** Every cell, for references to tasks and components. */
  text: string;
}

/** Risk register rows (`70-risks.md`; lite: the Risks table of plan.md). */
export function risks(c: Parameters<typeof planDocs>[0]): RiskRow[] {
  const out: RiskRow[] = [];
  for (const [path, doc] of planDocs(c))
    for (const t of tables(doc, path)) {
      if (!t.header.includes("impact") || !t.header.includes("mitigation")) continue;
      for (const r of t.rows) {
        const id = findIds(r.raw[0] ?? "", c.change).find((h) => h.id.includes("-RISK-"))?.id;
        if (id) out.push({ id, path, line: r.line, impact: (r.cells.get("impact") ?? "").replace(/[*_`]/g, "").trim().toLowerCase(), mitigation: r.cells.get("mitigation") ?? "", text: r.raw.join(" | ") });
      }
    }
  return out;
}

export const tr14: LintRule = {
  code: "TR-14",
  severity: "warn",
  fix: "Reference a mitigation task, or record the acceptance (accepted by P-01)",
  scope: "change",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      if (!c.spec.planStarted) continue;
      for (const r of risks(c)) {
        if (r.impact !== "high") continue;
        const task = findIds(r.mitigation, c.change).some((h) => h.id.includes("-T-"));
        if (!task && !/\baccepted by P-\d+/i.test(r.mitigation))
          out.push({ path: `${c.folder}/${r.path}`, line: r.line, ids: [r.id], message: `${r.id} has high impact but no mitigation task or recorded acceptance` });
      }
    }
    return out;
  },
};
