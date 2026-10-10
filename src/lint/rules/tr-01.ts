// TR-01 (error): every user story lists at least one requirement, and story and requirement list
// each other (C001-IF-04 §5). Dangling IDs are TR-12's.
import { findIds } from "../../model/ids.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const tr01: LintRule = {
  code: "TR-01",
  severity: "error",
  fix: "List the story's requirements under Requirements and the story under each requirement's Stories",
  scope: "change",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const heading = (id: string) => c.graph.byId.get(id)?.find((n) => n.form === "heading");
      const listed = (id: string, field: string, type: string) =>
        findIds(heading(id)?.fields.find((f) => f.name === field)?.value ?? "", c.change).map((h) => h.id).filter((x) => x.includes(`-${type}-`));
      for (const n of c.graph.nodes) {
        if (n.form !== "heading") continue;
        const path = `${c.folder}/${n.file}`;
        if (n.type === "US") {
          const reqs = listed(n.id, "Requirements", "REQ");
          if (reqs.length === 0) out.push({ path, line: n.line, ids: [n.id], message: `${n.id} lists no requirement` });
          for (const r of reqs)
            if (heading(r) && !listed(r, "Stories", "US").includes(n.id)) out.push({ path, line: n.line, ids: [n.id, r], message: `${n.id} lists ${r}, but ${r} does not list ${n.id}` });
        } else if (n.type === "REQ") {
          for (const s of listed(n.id, "Stories", "US"))
            if (heading(s) && !listed(s, "Requirements", "REQ").includes(n.id)) out.push({ path, line: n.line, ids: [n.id, s], message: `${n.id} lists ${s}, but ${s} does not list ${n.id}` });
        }
      }
    }
    return out;
  },
};
