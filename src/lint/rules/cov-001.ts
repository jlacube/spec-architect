// LINT-COV-001 (error): a requirement has no row in the coverage table of its capability folder
// (C001-REQ-412; lite: the coverage table of spec.md).
import { findIds } from "../../model/ids.ts";
import { coverageTables } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const dir = (p: string) => p.slice(0, p.lastIndexOf("/") + 1);

export const cov001: LintRule = {
  code: "LINT-COV-001",
  severity: "error",
  fix: "Add its row",
  scope: "change",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const tables = coverageTables(c);
      for (const n of c.graph.nodes) {
        if (n.type !== "REQ" || n.form !== "heading") continue;
        const here = tables.filter((t) => dir(t.path) === dir(n.file));
        if (here.some((t) => t.rows.some((r) => findIds(r.raw[0] ?? "", c.change).some((h) => h.id === n.id)))) continue;
        const at = here[0] ? { path: `${c.folder}/${here[0].path}`, line: here[0].line } : { path: `${c.folder}/${n.file}`, line: n.line };
        out.push({ ...at, ids: [n.id], message: `${n.id} has no row in the coverage table` });
      }
    }
    return out;
  },
};
