// LINT-RISK-001 (error): a risk of `70-risks.md` has a likelihood or impact outside low, medium,
// high, or no mitigation, trigger, owner or T or COMP ID (C001-REQ-613). Lite: the risk table of
// plan.md, whose template defines the ratings and the mitigation only.
import { findIds } from "../../model/ids.ts";
import { tables, type Table } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const RISKS = "20-plan/70-risks.md";
const LITE_PLAN = "20-plan/plan.md";
const RATINGS = ["low", "medium", "high"];

const col = (t: Table, name: RegExp) => t.header.findIndex((h) => name.test(h));
const plain = (cell: string | undefined) => (cell ?? "").replace(/[`*]/g, "").trim();

export const risk001: LintRule = {
  code: "LINT-RISK-001",
  severity: "error",
  fix: "Fix the risk row",
  scope: "file",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      if (!c.spec.planStarted) continue;
      const lite = c.profile === "lite";
      const file = lite ? LITE_PLAN : RISKS;
      const doc = c.spec.docs.get(file);
      if (!doc) continue;
      const path = `${c.folder}/${file}`;
      const riskTables = tables(doc, file).filter((t) => col(t, /likelihood/) >= 0);
      if (riskTables.length === 0 && !lite) out.push({ path, line: 1, message: "Risk field missing: no risk table (ID, Risk, Likelihood, Impact, Mitigation, Trigger, Owner, Refs)" });
      for (const t of riskTables) {
        const [lik, imp, mit, trig, own, refs] = [col(t, /likelihood/), col(t, /impact/), col(t, /mitigation/), col(t, /trigger/), col(t, /owner/), col(t, /refs|concerns|ids/)];
        const required: [string, number][] = lite ? [["mitigation", mit]] : [["mitigation", mit], ["trigger", trig], ["owner", own]];
        for (const r of t.rows) {
          const id = findIds(r.raw[0] ?? "", c.change).find((h) => h.id.includes("-RISK-"))?.id;
          if (!id) continue;
          const at = (message: string): void => void out.push({ path, line: r.line, ids: [id], message });
          for (const [name, i] of [["likelihood", lik], ["impact", imp]] as const) {
            const v = plain(r.raw[i]).toLowerCase();
            if (!RATINGS.includes(v)) at(`Risk rating outside low, medium, high: ${id} has ${name} "${plain(r.raw[i])}"`);
          }
          for (const [name, i] of required) if (i < 0 || plain(r.raw[i]) === "") at(`Risk field missing: ${id} has no ${name}`);
          if (!lite && !findIds(refs >= 0 ? (r.raw[refs] ?? "") : r.raw.join(" "), c.change).some((h) => /-(T|COMP)-/.test(h.id))) at(`Risk field missing: ${id} names no T or COMP ID`);
        }
      }
    }
    return out;
  },
};
