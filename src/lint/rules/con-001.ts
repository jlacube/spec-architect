// LINT-CON-001 (error): a constraint row has an empty Source (C001-REQ-514).
import { findIds } from "../../model/ids.ts";
import { specDocs, tables } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const con001: LintRule = {
  code: "LINT-CON-001",
  severity: "error",
  fix: "Add DEC/ADR/NFR/constitution source",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const [path, doc] of specDocs(c))
        for (const t of tables(doc, path)) {
          if (!t.header.includes("source")) continue;
          for (const r of t.rows) {
            const id = findIds(r.raw[0] ?? "", c.change).find((h) => h.id.includes("-CON-"))?.id;
            if (!id) continue;
            const source = (r.cells.get("source") ?? "").replace(/[*_`]/g, "").trim();
            if (source === "" || source === "—" || source === "-" || /^n\/a$/i.test(source))
              out.push({ path: `${c.folder}/${path}`, line: r.line, ids: [id], message: `${id} has no source` });
          }
        }
    return out;
  },
};
