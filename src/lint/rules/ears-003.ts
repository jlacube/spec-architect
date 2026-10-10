// LINT-EARS-003 (warn): the system named after THE is neither a glossary system name (change delta
// or project glossary) nor a component (C001-REQ-407, C001-IF-04 §3).
import { knownSystem, systemName } from "../ears.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const ears003: LintRule = {
  code: "LINT-EARS-003",
  severity: "warn",
  fix: "Add to glossary or fix the name",
  scope: "change",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const s of ctx.statements) {
      const name = systemName(s.text);
      const systems = ctx.changes.find((c) => s.path.startsWith(c.folder + "/"))?.spec.systems ?? [];
      if (name !== null && !knownSystem(name, systems))
        out.push({ path: s.path, line: s.line, ids: [s.id], message: `System "${name}" is not a glossary system name or component` });
    }
    return out;
  },
};
