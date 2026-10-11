// LINT-TS-001 (error): a scenario has other than exactly one When, or no Then; Given is optional
// (C001-REQ-413). And/But count as the keyword they continue; Outline Examples are not steps.
import { scenarios } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const ts001: LintRule = {
  code: "LINT-TS-001",
  severity: "error",
  fix: "Exactly one When and ≥ 1 Then",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const s of scenarios(c)) {
        if (s.when === 1 && s.then >= 1) continue;
        const label = s.id ?? "Scenario";
        out.push({
          path: `${c.folder}/${s.path}`, line: s.line, ...(s.id ? { ids: [s.id] } : {}),
          message: `${label} has ${s.given} Given, ${s.when} When and ${s.then} Then steps`,
        });
      }
    return out;
  },
};
