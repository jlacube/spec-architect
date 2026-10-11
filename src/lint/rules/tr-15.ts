// TR-15 (warn): a task targets a hotspot of `30-impact/hotspots.md`, and no risk references the task
// or one of its components (C001-REQ-612).
import { findIds } from "../../model/ids.ts";
import { tables, tasks } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";
import { risks } from "./tr-14.ts";

const HOTSPOTS = "20-plan/30-impact/hotspots.md";
const clean = (s: string) => s.replace(/`/g, "").replace(/:\d+$/, "").replace(/^\.\//, "").trim();

/** File paths named in the target cells of a task (Targets table, or the lite Targets field). */
function targets(t: ReturnType<typeof tasks>[number]): string[] {
  if (!t.doc) return [];
  const out: string[] = [];
  for (const tb of tables(t.doc, t.path)) {
    if (tb.headerLine < t.from || tb.headerLine > t.to || !tb.header.includes("target")) continue;
    for (const r of tb.rows) for (const part of (r.cells.get("target") ?? "").split(/[,;]/)) out.push(clean(part));
  }
  if (t.lite)
    for (const l of t.doc.lines.slice(t.from - 1, t.to)) {
      const m = /\*\*Targets:\*\*(.*)$/.exec(l);
      if (m) for (const part of (m[1] ?? "").split(/[,;]/)) out.push(clean(part));
    }
  return out.filter(Boolean);
}

export const tr15: LintRule = {
  code: "TR-15",
  severity: "warn",
  fix: "Add a risk referencing the task or its component",
  scope: "change",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const doc = c.spec.docs.get(HOTSPOTS);
      if (!c.spec.planStarted || !doc) continue;
      const hot = new Set<string>();
      for (const t of tables(doc, HOTSPOTS)) {
        const col = t.header.findIndex((h) => h === "file" || h === "path");
        if (col >= 0) for (const r of t.rows) hot.add(clean(r.raw[col] ?? ""));
      }
      const referenced = new Set(risks(c).flatMap((r) => findIds(r.text, c.change).map((h) => h.id)));
      for (const t of tasks(c)) {
        if (t.status === "dropped") continue;
        const touched = targets(t).filter((p) => hot.has(p));
        if (touched.length === 0 || referenced.has(t.id) || t.components.some((x) => referenced.has(x))) continue;
        out.push({ path: `${c.folder}/${t.path}`, line: t.line, ids: [t.id], message: `${t.id} targets hotspot ${touched.join(", ")} but no risk references it or its components` });
      }
    }
    return out;
  },
};
