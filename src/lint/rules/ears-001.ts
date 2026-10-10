// LINT-EARS-001 (error): a Statement does not have the keyword shape of its declared Pattern
// (C001-REQ-405, C001-IF-04 §3; keywords case-insensitive).
import { detectShape, matchesShape, PATTERNS } from "../ears.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const ears001: LintRule = {
  code: "LINT-EARS-001",
  severity: "error",
  fix: "Rewrite or change the pattern",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const n of c.graph.nodes) {
        if (n.type !== "REQ" || n.form !== "heading") continue;
        const pattern = n.fields.find((f) => f.name === "Pattern")?.value ?? "";
        const st = n.fields.find((f) => f.name === "Statement");
        // Missing or unknown patterns and missing statements are LINT-REQ-001 findings.
        if (!st || st.value === "" || !(PATTERNS as readonly string[]).includes(pattern)) continue;
        if (!matchesShape(pattern, st.value))
          out.push({ path: `${c.folder}/${n.file}`, line: st.line, ids: [n.id], message: `${n.id} is declared ${pattern} but has the shape ${detectShape(st.value)}` });
      }
    return out;
  },
};
