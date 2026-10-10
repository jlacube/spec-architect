// LINT-US-001 (error): a user story names a persona that the change's spec does not define
// (C001-REQ-403). Personas are `P-NN` headings, normally in 10-context/stakeholders-and-personas.md.
import type { LintRule, RuleFinding } from "../types.ts";

export const us001: LintRule = {
  code: "LINT-US-001",
  severity: "error",
  fix: "Define the persona or fix the reference",
  scope: "change",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const [id, s] of c.spec.sections) {
        const at = s.lines.findIndex((l) => /\*\*As an?:?\*\*/i.test(l));
        if (at < 0) continue;
        const file = c.graph.byId.get(id)?.[0]?.file ?? "";
        for (const p of new Set(s.lines[at]?.match(/\bP-\d{2,}\b/g) ?? []))
          if (!c.spec.personas.has(p)) out.push({ path: `${c.folder}/${file}`, line: s.line + at, ids: [id], message: `${id} names persona ${p}, which is not defined` });
      }
    return out;
  },
};
