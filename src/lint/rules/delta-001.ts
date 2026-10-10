// LINT-DELTA-001 (error): in a brownfield or mixed change, a requirement's Delta is not one of
// ADDED, MODIFIED, REMOVED, RENAMED, or a non-ADDED Delta cites no living-spec requirement that
// exists in `_living/` (C001-REQ-409).
import { findIds } from "../../model/ids.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const TAGS = ["ADDED", "MODIFIED", "REMOVED", "RENAMED"];

export const delta001: LintRule = {
  code: "LINT-DELTA-001",
  severity: "error",
  fix: "Fix the cited ID",
  scope: "change",
  check(ctx) {
    const out: RuleFinding[] = [];
    const living = new Set(ctx.workspace.living.flatMap((l) => l.nodes.map((n) => n.id)));
    for (const c of ctx.changes) {
      if (c.spec.kind === "greenfield") continue;
      for (const n of c.graph.nodes) {
        if (n.type !== "REQ" || n.form !== "heading") continue;
        const delta = n.fields.find((f) => f.name === "Delta");
        if (!delta || delta.value === "") continue; // a missing Delta is LINT-REQ-001's
        const at = { path: `${c.folder}/${n.file}`, line: delta.line, ids: [n.id] };
        const tag = /^[A-Z]+/.exec(delta.value)?.[0] ?? "";
        if (!TAGS.includes(tag)) {
          out.push({ ...at, message: `${n.id} has Delta "${delta.value}", not one of ${TAGS.join(", ")}` });
          continue;
        }
        if (tag === "ADDED") continue;
        // Only full IDs cite another change's requirement.
        const cited = findIds(delta.value, null).filter((h) => !h.short && h.id.includes("-REQ-")).map((h) => h.id);
        if (cited.length === 0) out.push({ ...at, message: `${n.id} is ${tag} but cites no living-spec requirement` });
        for (const id of cited) if (!living.has(id)) out.push({ ...at, ids: [n.id, id], message: `${n.id} cites ${id}, which is not in _living/` });
      }
    }
    return out;
  },
};
