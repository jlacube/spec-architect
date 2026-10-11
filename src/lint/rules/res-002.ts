// LINT-RES-002 (error): a research-note finding without a confidence of high, medium or low
// followed by a reason (C001-REQ-307, C001-IF-03 §5).
import type { LintRule, RuleFinding } from "../types.ts";
import { researchFindings } from "./res-001.ts";

const RATED = /\bconfidence:\s*(?:high|medium|low)\b\s*(?:\(\s*[^)\s][^)]*\)|[—:–-]\s*\S)/i;

export const res002: LintRule = {
  code: "LINT-RES-002",
  severity: "error",
  fix: "Add high/medium/low with reason",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const f of researchFindings(c))
        if (!RATED.test(f.text)) out.push({ path: `${c.folder}/${f.path}`, line: f.line, message: "Finding without a confidence rating (high, medium or low) and its reason" });
    return out;
  },
};
