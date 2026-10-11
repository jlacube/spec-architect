// LINT-EVD-001 (error): an evidence entry (`- **E-<n>** …`, C001-IF-03 §11) lacks its path and
// line, symbol (or `-`), claim, layer, confidence or disclosures (C001-REQ-1002).
import type { LintRule, RuleFinding } from "../types.ts";

const ENTRY = /^(\s*)[-*] \*\*E-\d+\*\*(.*)$/;

const CHECKS: [string, RegExp][] = [
  ["path and line", /`[^`\s]+:\d+(?:-\d+)?`/],
  ["symbol", /›\s*(?:`[^`]+`|-)/],
  ["claim", /\s[—–]\s+\S/],
  ["layer", /\blayer:\s*(?:ripwire|serena|lsp|grep|ast-grep)\b/],
  ["confidence", /\bconfidence:\s*(?:high|medium|low)\b/],
  ["disclosures", /\bdisclosures:\s*\S/],
];

export const evd001: LintRule = {
  code: "LINT-EVD-001",
  severity: "error",
  fix: "Add path/symbol/layer/confidence/disclosures",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const [path, doc] of c.spec.docs)
        doc.lines.forEach((line, i) => {
          const m = ENTRY.exec(line);
          if (!m || doc.blocks.inFence(i + 1)) return;
          const indent = m[1]?.length ?? 0;
          let text = line;
          for (let j = i + 1; j < doc.lines.length; j++) {
            const next = doc.lines[j] ?? "";
            if (next.trim() === "" || next.length - next.trimStart().length <= indent) break;
            text += "\n" + next;
          }
          const missing = CHECKS.filter(([, re]) => !re.test(text)).map(([name]) => name);
          if (missing.length > 0) out.push({ path: `${c.folder}/${path}`, line: i + 1, message: `Evidence entry lacks ${missing.join(", ")}` });
        });
    return out;
  },
};
