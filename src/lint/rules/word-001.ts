// LINT-WORD-001 (error): a weak word of C001-IF-04 §4 in a requirement or NFR Statement or in an
// acceptance-criterion title, outside code spans and double quotes (C001-REQ-408).
import { weakWords } from "../ears.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const word001: LintRule = {
  code: "LINT-WORD-001",
  severity: "error",
  fix: "Replace with a measurable term",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    const report = (path: string, line: number, id: string, where: string, text: string) => {
      const words = weakWords(text);
      if (words.length > 0) out.push({ path, line, ids: [id], message: `Weak word${words.length > 1 ? "s" : ""} ${words.map((w) => `"${w}"`).join(", ")} in the ${where}` });
    };
    for (const c of ctx.changes)
      for (const n of c.graph.nodes) {
        if (n.form !== "heading") continue;
        const path = `${c.folder}/${n.file}`;
        if (n.type === "REQ" || n.type === "NFR") {
          const st = n.fields.find((f) => f.name === "Statement");
          if (st) report(path, st.line, n.id, "Statement", st.value);
        } else if (n.type === "AC") report(path, n.line, n.id, "criterion title", n.title);
      }
    return out;
  },
};
