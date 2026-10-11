// LINT-RES-001 (error): a research-note finding without a source URL or an access date
// (C001-REQ-302). LINT-RES-002 (error): a finding without a confidence rating and reason
// (C001-REQ-307). Findings are the top-level bullets of the Findings section of
// `00-ideation/research/R-*.md` (C001-IF-03 §5).
import { sectionByName } from "../spec.ts";
import type { LintChange, LintRule, RuleFinding } from "../types.ts";

export interface ResearchFinding {
  path: string;
  line: number;
  text: string;
}

export function researchFindings(c: LintChange): ResearchFinding[] {
  const out: ResearchFinding[] = [];
  for (const [path, doc] of c.spec.docs) {
    if (!/^00-ideation\/research\/R-[^/]*\.md$/.test(path)) continue;
    const s = sectionByName(doc, "findings");
    if (!s) continue;
    let cur: ResearchFinding | null = null;
    for (let l = s.line + 1; l <= s.end; l++) {
      const text = doc.lines[l - 1] ?? "";
      if (doc.blocks.inFence(l)) continue;
      if (/^[-*] /.test(text)) {
        cur = { path, line: l, text: text.slice(2) };
        out.push(cur);
      } else if (cur && /^\s+\S/.test(text)) cur.text += " " + text.trim();
      else cur = null;
    }
  }
  return out;
}

const URL = /\bhttps?:\/\/\S+/;
const DATE = /\b\d{4}-\d{2}-\d{2}\b/;

export const res001: LintRule = {
  code: "LINT-RES-001",
  severity: "error",
  fix: "Add source URL and date",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const f of researchFindings(c)) {
        const missing = [...(URL.test(f.text) ? [] : ["source URL"]), ...(DATE.test(f.text) ? [] : ["access date (YYYY-MM-DD)"])];
        if (missing.length > 0) out.push({ path: `${c.folder}/${f.path}`, line: f.line, message: `Finding without ${missing.join(" and ")}` });
      }
    return out;
  },
};
