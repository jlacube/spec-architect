// LINT-HAND-001 (error): `handoff.md` lacks one of the sections Reading order, Rules, Ordered task
// list, Reporting protocol, Definition of change done; or its Reporting protocol does not name the
// `task set` and `defect add` commands and the frontmatter fallback (C001-REQ-616).
import { sectionByName, textWithoutComments } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const HANDOFF = "20-plan/handoff.md";
export const HANDOFF_SECTIONS = ["Reading order", "Rules", "Ordered task list", "Reporting protocol", "Definition of change done"];

export const hand001: LintRule = {
  code: "LINT-HAND-001",
  severity: "error",
  fix: "Add the section, the `task set` and `defect add` commands and the frontmatter fallback",
  scope: "file",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const doc = c.spec.docs.get(HANDOFF);
      if (!c.spec.planStarted || !doc) continue;
      const path = `${c.folder}/${HANDOFF}`;
      for (const s of HANDOFF_SECTIONS) if (!sectionByName(doc, s, 2)) out.push({ path, line: 1, message: `Hand-off section missing: ${s}` });
      const rp = sectionByName(doc, "Reporting protocol", 2);
      if (!rp) continue;
      const text = textWithoutComments(doc, rp.line + 1, rp.end);
      for (const cmd of ["task set", "defect add"]) if (!text.includes(cmd)) out.push({ path, line: rp.line, message: `Reporting protocol incomplete: no "${cmd}" command` });
      if (!/frontmatter/i.test(text)) out.push({ path, line: rp.line, message: "Reporting protocol incomplete: no frontmatter fallback" });
    }
    return out;
  },
};
