// TR-08 (error): a scenario is mapped to no test case in the test plan (`60-test-plan.md`; lite:
// the TC table of plan.md) (C001-REQ-609).
import { findIds } from "../../model/ids.ts";
import { planDocs, tables } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const tr08: LintRule = {
  code: "TR-08",
  severity: "error",
  fix: "Map the scenario to a TC in the test plan",
  scope: "change",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      if (!c.spec.planStarted) continue;
      const mapped = new Set<string>();
      for (const [path, doc] of planDocs(c))
        for (const t of tables(doc, path))
          for (const r of t.rows) {
            if (!findIds(r.raw[0] ?? "", c.change).some((h) => h.id.includes("-TC-"))) continue;
            for (const cell of r.raw.slice(1)) for (const h of findIds(cell, c.change)) if (h.id.includes("-TS-")) mapped.add(h.id);
          }
      for (const n of c.graph.nodes)
        if (n.type === "TS" && n.form === "scenario" && n.file.startsWith("10-spec/") && !mapped.has(n.id))
          out.push({ path: `${c.folder}/${n.file}`, line: n.line, ids: [n.id], message: `${n.id} is mapped to no test case` });
    }
    return out;
  },
};
