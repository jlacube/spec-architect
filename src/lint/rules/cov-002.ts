// LINT-COV-002 (error): a coverage-table cell is neither TS IDs nor `n/a: <reason>`, or is a bare
// `n/a` without a note directly below the table, or the table lacks a checklist column
// (C001-REQ-412, C001-IF-03 §7).
import { findIds } from "../../model/ids.ts";
import { COVERAGE_COLUMNS, coverageTables } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const cov002: LintRule = {
  code: "LINT-COV-002",
  severity: "error",
  fix: "Add TS IDs or `n/a: <reason>`",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const t of coverageTables(c)) {
        const path = `${c.folder}/${t.path}`;
        const header = t.rows[0] ? [...t.rows[0].cells.keys()] : [];
        const absent = COVERAGE_COLUMNS.filter((col) => t.rows.length > 0 && !header.includes(col));
        if (absent.length > 0) out.push({ path, line: t.line, message: `Coverage table lacks the column${absent.length > 1 ? "s" : ""} ${absent.join(", ")}` });
        for (const r of t.rows) {
          const req = r.raw[0] ?? "";
          for (const col of COVERAGE_COLUMNS) {
            if (!r.cells.has(col)) continue;
            const cell = (r.cells.get(col) ?? "").trim();
            let problem: string | null = null;
            if (cell === "") problem = "is empty";
            else if (/^n\/a$/i.test(cell)) problem = t.note ? null : "is a bare n/a without a reason note below the table";
            else if (/^n\/a\s*:\s*\S/i.test(cell)) problem = null;
            else if (!findIds(cell, c.change).some((h) => h.id.includes("-TS-"))) problem = `holds "${cell}", neither TS IDs nor n/a: <reason>`;
            if (problem) out.push({ path, line: r.line, ids: findIds(req, c.change).map((h) => h.id), message: `Cell ${col} of ${req} ${problem}` });
          }
        }
      }
    return out;
  },
};
