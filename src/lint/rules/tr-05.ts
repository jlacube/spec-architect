// TR-05 (error): every requirement and NFR is covered by a feature DoD item, directly (IDs, lists
// such as `C001-NFR-101, 102` and ranges such as `C001-REQ-101 … 127`) or through its capability
// (C001-IF-04 §5).
import { capabilityOf, dodRows, expandIds } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const tr05: LintRule = {
  code: "TR-05",
  severity: "error",
  fix: "Add the requirement, its capability or the NFR to a DoD item's Covers",
  scope: "change",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const covered = new Set<string>();
      for (const row of dodRows(c)) for (const id of expandIds(row.covers, c.change)) covered.add(id);
      for (const n of c.graph.nodes) {
        if (n.form !== "heading" || (n.type !== "REQ" && n.type !== "NFR")) continue;
        if (covered.has(n.id)) continue;
        if (n.type === "REQ" && capabilityOf(c, n).some((cap) => covered.has(cap))) continue;
        out.push({ path: `${c.folder}/${n.file}`, line: n.line, ids: [n.id], message: `${n.id} is covered by no DoD item` });
      }
    }
    return out;
  },
};
