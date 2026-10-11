// TR-10 (warn): a component whose Status is not `removed` realizes no requirement or NFR
// (C001-REQ-503). Realizes may name IDs, lists, ranges and capabilities.
import { expandIds } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";
import { componentStatus } from "./arch-003.ts";

export const tr10: LintRule = {
  code: "TR-10",
  severity: "warn",
  fix: "List the requirements or NFRs the component realizes, or mark it removed",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const n of c.graph.nodes) {
        if (n.type !== "COMP" || n.form !== "heading") continue;
        if (componentStatus(n.fields.find((f) => f.name === "Status")?.value ?? "") === "removed") continue;
        const realizes = [...expandIds(n.fields.find((f) => f.name === "Realizes")?.value ?? "", c.change)];
        if (!realizes.some((id) => /-(REQ|NFR|CAP)-/.test(id)))
          out.push({ path: `${c.folder}/${n.file}`, line: n.line, ids: [n.id], message: `${n.id} realizes no requirement or NFR` });
      }
    return out;
  },
};
