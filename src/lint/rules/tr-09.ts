// TR-09 (error): in a brownfield or mixed change, a requirement with Delta MODIFIED or REMOVED has
// an Evidence field with a file path, a symbol and an evidence layer (C001-REQ-410, C001-IF-03 §11).
import { fieldText } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const PATH = /[\w@-]+(?:\/[\w@.-]+)*\.[A-Za-z]\w*(?::\d+)?/;
const SYMBOL = /[A-Za-z_$][\w$.#:]*\(\)|›\s*`?[A-Za-z_$][\w$.#:]*/;
const LAYER = /\blayer:\s*(?:ripwire|serena|lsp|grep|ast-grep)\b/;

export const tr09: LintRule = {
  code: "TR-09",
  severity: "error",
  fix: "Add Evidence with a file path, a symbol and an evidence layer",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      if (c.spec.kind === "greenfield") continue;
      for (const n of c.graph.nodes) {
        if (n.type !== "REQ" || n.form !== "heading") continue;
        const delta = n.fields.find((f) => f.name === "Delta")?.value ?? "";
        if (!/^(MODIFIED|REMOVED)\b/.test(delta)) continue;
        const evidence = fieldText(c.spec.sections.get(n.id)?.lines ?? [], "Evidence") ?? "";
        const text = evidence.replace(/`/g, "");
        const missing = [
          ...(PATH.test(text) ? [] : ["file path"]),
          ...(SYMBOL.test(text) ? [] : ["symbol"]),
          ...(LAYER.test(text) ? [] : ["evidence layer"]),
        ];
        if (missing.length > 0)
          out.push({ path: `${c.folder}/${n.file}`, line: n.line, ids: [n.id], message: `${n.id} (${delta.split(/\s/)[0]}) has no evidence ${missing.join(", ")}` });
      }
    }
    return out;
  },
};
