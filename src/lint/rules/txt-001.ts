// LINT-TXT-001 (error): placeholder words `TBD`, `TODO`, `lorem` or `etc.` outside code blocks,
// code spans and quoted strings (C001-REQ-719).
import type { LintRule, RuleFinding } from "../types.ts";

const WORDS = /\bTBD\b|\bTODO\b|\b[Ll]orem\b|\betc\./g;

/** The line with code spans and double-quoted strings blanked out. */
export function prose(line: string): string {
  return line.replace(/`[^`]*`/g, (m) => " ".repeat(m.length)).replace(/"[^"]*"|“[^”]*”/g, (m) => " ".repeat(m.length));
}

export const txt001: LintRule = {
  code: "LINT-TXT-001",
  severity: "error",
  fix: "Replace with real content",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const t of ctx.texts) {
      if (!t.path.endsWith(".md")) continue;
      t.lines.forEach((line, i) => {
        if (t.inFence(i + 1)) return;
        const words = [...prose(line).matchAll(WORDS)].map((m) => m[0]);
        if (words.length > 0) out.push({ path: t.path, line: i + 1, message: `Placeholder text ${words.map((w) => `\`${w}\``).join(", ")}` });
      });
    }
    return out;
  },
};
