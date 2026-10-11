// LINT-IDE-001 (error): the ideation document of a full-profile change lacks a section of
// C001-REQ-313. Section headings are matched by name, ignoring numbering and case; "Goals,
// non-goals and …" counts as "Goals and non-goals".
import { headingName } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const IDEATION_SECTIONS = [
  "Document control", "Problem statement", "Q&A decision record", "Goals and non-goals", "Scope boundary", "Research index",
  "Options and decisions index", "Design direction", "Risks", "Assumptions", "Open questions", "Sources",
];

export const ide001: LintRule = {
  code: "LINT-IDE-001",
  severity: "error",
  fix: "Add the section",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      if (c.profile !== "full") continue;
      const doc = c.spec.docs.get("00-ideation/ideation.md");
      if (!doc) continue;
      const names = doc.blocks.headings.map((h) => headingName(h.text).replace(/,\s+/g, " and "));
      const missing = IDEATION_SECTIONS.filter((s) => !names.some((n) => n.startsWith(s.toLowerCase())));
      for (const s of missing) out.push({ path: `${c.folder}/00-ideation/ideation.md`, line: 1, message: `Ideation section "${s}" is missing` });
    }
    return out;
  },
};
