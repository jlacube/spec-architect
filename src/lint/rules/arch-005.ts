// LINT-ARCH-005 (error): a component with Status existing, modified or removed cites no
// cartographer evidence with file path, symbol and evidence layer (C001-REQ-516).
import { evidenceGaps, fieldText } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";
import { componentStatus } from "./arch-003.ts";

export const arch005: LintRule = {
  code: "LINT-ARCH-005",
  severity: "error",
  fix: "Add cartographer evidence",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const n of c.graph.nodes) {
        if (n.type !== "COMP" || n.form !== "heading") continue;
        const status = componentStatus(n.fields.find((f) => f.name === "Status")?.value ?? "");
        if (!["existing", "modified", "removed"].includes(status)) continue;
        const missing = evidenceGaps(fieldText(c.spec.sections.get(n.id)?.lines ?? [], "Evidence") ?? "");
        if (missing.length > 0)
          out.push({ path: `${c.folder}/${n.file}`, line: n.line, ids: [n.id], message: `${n.id} (${status}) has no evidence ${missing.join(", ")}` });
      }
    return out;
  },
};
