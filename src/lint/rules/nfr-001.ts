// LINT-NFR-001 (error): an NFR lacks a field of C001-REQ-414 or leaves it empty. Metric, Threshold
// and Method are TR-04's (C001-REQ-415).
import type { LintRule, RuleFinding } from "../types.ts";

const FIELDS = ["Category", "Statement", "Environment", "Rationale", "DoD"];

export const nfr001: LintRule = {
  code: "LINT-NFR-001",
  severity: "error",
  fix: "Add the field",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const n of c.graph.nodes) {
        if (n.type !== "NFR" || n.form !== "heading") continue;
        const missing = FIELDS.filter((name) => (n.fields.find((f) => f.name === name)?.value ?? "") === "");
        if (missing.length > 0)
          out.push({ path: `${c.folder}/${n.file}`, line: n.line, ids: [n.id], message: `${n.id} lacks the field${missing.length > 1 ? "s" : ""} ${missing.map((m) => `"${m}"`).join(", ")}` });
      }
    return out;
  },
};
