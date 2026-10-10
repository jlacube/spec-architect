// TR-04 (error): every NFR has a non-empty Metric, Threshold and Method (C001-REQ-415). The other
// NFR fields are LINT-NFR-001's.
import type { LintRule, RuleFinding } from "../types.ts";

export const MEASURE_FIELDS = ["Metric", "Threshold", "Method"];

export const tr04: LintRule = {
  code: "TR-04",
  severity: "error",
  fix: "Give the NFR a Metric, a Threshold and a Method",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const n of c.graph.nodes) {
        if (n.type !== "NFR" || n.form !== "heading") continue;
        const empty = MEASURE_FIELDS.filter((name) => (n.fields.find((f) => f.name === name)?.value ?? "") === "");
        if (empty.length > 0) out.push({ path: `${c.folder}/${n.file}`, line: n.line, ids: [n.id], message: `${n.id} is not measurable: empty ${empty.map((e) => `"${e}"`).join(", ")}` });
      }
    return out;
  },
};
