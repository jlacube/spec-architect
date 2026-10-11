// LINT-ERR-001 (error): an error or rule code named in a requirement or NFR Statement is not
// catalogued (C001-REQ-513). The catalogue is `50-interfaces/errors.md` and the interface tables it
// delegates to (rule tables of C001-IF-04 §5, plugin checks of C001-IF-08 §3), so every table of
// `50-interfaces/`; lite: the tables of spec.md.
import { specDocs, tables } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const CODE = /\b(?:(?:ERR|WARN)-[A-Z]+(?:-[A-Z]+)*-\d{3}|LINT-[A-Z]+-\d{3}|PLG-[A-Z]+-\d{3}|GUARD-[A-Z]+-\d{3}|TR-\d{2})\b/g;

export const err001: LintRule = {
  code: "LINT-ERR-001",
  severity: "error",
  fix: "Add it to `errors.md`",
  scope: "change",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const catalogue = new Set<string>();
      for (const [path, doc] of specDocs(c)) {
        if (!path.startsWith("10-spec/50-interfaces/") && !/(^|\/)spec\.md$/.test(path)) continue;
        for (const t of tables(doc, path)) for (const r of t.rows) for (const m of (r.raw[0] ?? "").matchAll(CODE)) catalogue.add(m[0]);
      }
      for (const n of c.graph.nodes) {
        if ((n.type !== "REQ" && n.type !== "NFR") || n.form !== "heading") continue;
        const st = n.fields.find((f) => f.name === "Statement");
        if (!st) continue;
        for (const code of new Set([...st.value.matchAll(CODE)].map((m) => m[0])))
          if (!catalogue.has(code)) out.push({ path: `${c.folder}/${n.file}`, line: st.line, ids: [n.id], message: `${n.id} names ${code}, which is not in the error catalogue` });
      }
    }
    return out;
  },
};
