// LINT-CON-001 (error): a constraint row has an empty Source (C001-REQ-514). Lite constraints are
// heading sections of `spec.md` with a `- **Source:**` field, checked the same way (C001-D-029).
import { findIds } from "../../model/ids.ts";
import { specDocs, tables } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const emptySource = (s: string) => s === "" || s === "—" || s === "-" || /^n\/a$/i.test(s);
const plain = (s: string) => s.replace(/[*_`]/g, "").trim();

export const con001: LintRule = {
  code: "LINT-CON-001",
  severity: "error",
  fix: "Add DEC/ADR/NFR/constitution source",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      for (const n of c.graph.nodes) {
        if (n.type !== "CON" || n.form !== "heading" || !n.file.startsWith("10-spec/")) continue;
        const source = n.fields.find((f) => f.name === "Source");
        if (emptySource(plain(source?.value ?? "")))
          out.push({ path: `${c.folder}/${n.file}`, line: source?.line ?? n.line, ids: [n.id], message: `${n.id} has no source` });
      }
      for (const [path, doc] of specDocs(c))
        for (const t of tables(doc, path)) {
          if (!t.header.includes("source")) continue;
          for (const r of t.rows) {
            const id = findIds(r.raw[0] ?? "", c.change).find((h) => h.id.includes("-CON-"))?.id;
            if (!id) continue;
            if (emptySource(plain(r.cells.get("source") ?? ""))) out.push({ path: `${c.folder}/${path}`, line: r.line, ids: [id], message: `${id} has no source` });
          }
        }
    }
    return out;
  },
};
