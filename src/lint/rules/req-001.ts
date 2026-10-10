// LINT-REQ-001 (error): a functional requirement lacks a field of C001-REQ-404 or leaves it empty,
// or declares a pattern that is not one of the EARS patterns of C001-IF-04 §3.
import { PATTERNS } from "../ears.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const FIELDS = ["Pattern", "Statement", "Rationale", "Stories", "Priority", "Acceptance"];

export const req001: LintRule = {
  code: "LINT-REQ-001",
  severity: "error",
  fix: "Add the field",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const required = c.spec.kind === "greenfield" ? FIELDS : [...FIELDS, "Delta"];
      for (const n of c.graph.nodes) {
        if (n.type !== "REQ" || n.form !== "heading") continue;
        const path = `${c.folder}/${n.file}`;
        const field = (name: string) => n.fields.find((f) => f.name === name);
        const missing = required.filter((name) => (field(name)?.value ?? "") === "");
        if (missing.length > 0)
          out.push({ path, line: n.line, ids: [n.id], message: `${n.id} lacks the field${missing.length > 1 ? "s" : ""} ${missing.map((m) => `"${m}"`).join(", ")}` });
        const pattern = field("Pattern");
        if (pattern && pattern.value !== "" && !(PATTERNS as readonly string[]).includes(pattern.value))
          out.push({ path, line: pattern.line, ids: [n.id], message: `${n.id} declares pattern "${pattern.value}", which is not one of ${PATTERNS.join(", ")}` });
      }
    }
    return out;
  },
};
