// LINT-OA-001 (error): a weighted total in an option-analysis score table differs from
// Σ score × weight by more than 0.01 (C001-REQ-310). Score tables are the ideation tables whose
// last column is "Weighted"; weights come from a "Weights" row, from the file's criteria table
// (Criterion | Weight) or from the header itself ("Weighted (50/50)").
import { tables, type Table } from "../spec.ts";
import type { LintRule, RuleFinding, SpecDoc } from "../types.ts";

const num = (cell: string): number => {
  const m = /-?\d+(?:\.\d+)?/.exec(cell.replace(/\*/g, ""));
  return m ? Number(m[0]) : NaN;
};

/** Weights of the criteria columns of a score table, or null when they cannot be determined. */
function weights(t: Table, all: Table[]): number[] | null {
  const criteria = t.header.slice(1, -1);
  const row = t.rows.find((r) => /^weights?$/i.test((r.raw[0] ?? "").replace(/\*/g, "").trim()));
  if (row) {
    const w = row.raw.slice(1, 1 + criteria.length).map(num);
    return w.every((x) => !Number.isNaN(x)) ? w : null;
  }
  const byName = new Map<string, number>();
  for (const ct of all)
    if (ct !== t && ct.header.length >= 2 && ct.header[0]?.startsWith("criteri") && ct.header[1]?.startsWith("weight"))
      for (const r of ct.rows) byName.set((r.raw[0] ?? "").replace(/\*/g, "").trim().toLowerCase(), num(r.raw[1] ?? ""));
  if (byName.size > 0) {
    const w = criteria.map((c) => byName.get(c) ?? NaN);
    return w.every((x) => !Number.isNaN(x)) ? w : null;
  }
  const inHeader = /\(([\d\s/.]+)\)/.exec(t.header[t.header.length - 1] ?? "")?.[1]?.split("/").map(Number);
  return inHeader && inHeader.length === criteria.length && inHeader.every((x) => !Number.isNaN(x)) ? inHeader : null;
}

export function weightedErrors(doc: SpecDoc, path: string): { line: number; candidate: string; stated: number; computed: number }[] {
  const out: { line: number; candidate: string; stated: number; computed: number }[] = [];
  const all = tables(doc, path);
  for (const t of all) {
    if (t.header.length < 3 || !(t.header[t.header.length - 1] ?? "").startsWith("weighted")) continue;
    const w = weights(t, all);
    if (!w) continue;
    const total = w.reduce((a, b) => a + b, 0);
    if (total <= 0) continue;
    for (const r of t.rows) {
      const name = (r.raw[0] ?? "").replace(/\*/g, "").trim();
      if (/^weights?$/i.test(name)) continue;
      const scores = r.raw.slice(1, 1 + w.length).map(num);
      const stated = num(r.raw[w.length + 1] ?? "");
      if (scores.some(Number.isNaN) || Number.isNaN(stated)) continue;
      const computed = scores.reduce((a, s, i) => a + s * (w[i] ?? 0), 0) / total;
      if (Math.abs(stated - computed) > 0.01 + 1e-9) out.push({ line: r.line, candidate: name, stated, computed });
    }
  }
  return out;
}

export const oa001: LintRule = {
  code: "LINT-OA-001",
  severity: "error",
  fix: "Recompute Σ score × weight",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const [path, doc] of c.spec.docs) {
        if (!path.startsWith("00-ideation/")) continue;
        for (const e of weightedErrors(doc, path)) {
          const candidate = e.candidate.length > 60 ? e.candidate.slice(0, 57) + "…" : e.candidate;
          out.push({ path: `${c.folder}/${path}`, line: e.line, message: `Candidate "${candidate}" states ${e.stated.toFixed(2)}, computed ${e.computed.toFixed(2)}` });
        }
      }
    return out;
  },
};
