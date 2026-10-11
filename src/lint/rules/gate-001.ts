// LINT-GATE-001 (error): a row of the change.md gate log has no Usage cell (C001-NFR-701); the
// usage is the row's last cell, or `unavailable`.
import { tables } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const gate001: LintRule = {
  code: "LINT-GATE-001",
  severity: "error",
  fix: "Record usage or `unavailable`",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const doc = c.spec.docs.get("change.md");
      if (!doc) continue;
      for (const t of tables(doc, "change.md")) {
        if (!t.header.includes("gate") || !t.header.includes("usage")) continue;
        for (const r of t.rows) {
          const usage = r.raw.length >= t.header.length ? (r.raw[r.raw.length - 1] ?? "").trim() : "";
          if (usage === "") out.push({ path: `${c.folder}/change.md`, line: r.line, message: `Gate-log row for ${(r.raw[1] ?? "").trim() || "a gate"} has no Usage cell` });
        }
      }
    }
    return out;
  },
};
