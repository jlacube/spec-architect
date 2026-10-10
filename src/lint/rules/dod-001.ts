// LINT-DOD-001 (error): a feature DoD item has no evidence type of C001-IF-03 §8 (C001-REQ-420).
import { dodRows } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const EVIDENCE_TYPES = ["test-report", "coverage-report", "benchmark-report", "command-output", "screenshot", "link", "review-record", "metric-snapshot"];

export const dod001: LintRule = {
  code: "LINT-DOD-001",
  severity: "error",
  fix: "Add an evidence type (C001-IF-03 §8)",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const r of dodRows(c)) {
        const words = r.evidence.replace(/`/g, "").split(/[\s,;/]+/).filter(Boolean);
        if (!words.some((w) => EVIDENCE_TYPES.includes(w)))
          out.push({ path: `${c.folder}/${r.path}`, line: r.line, ids: [r.id], message: r.evidence.trim() === "" ? `${r.id} has no evidence type` : `${r.id} has evidence "${r.evidence}", not a type of ${EVIDENCE_TYPES.join(", ")}` });
      }
    return out;
  },
};
