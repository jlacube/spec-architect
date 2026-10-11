// LINT-ARCH-002 (error): `60-architecture/architecture.md` lacks a section of C001-REQ-501; the
// "As-is to to-be delta" section is required for brownfield and mixed changes.
import { headingName } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const ARCHITECTURE_SECTIONS = [
  "Context and scope", "Component catalogue", "Runtime flows", "Data view", "Deployment view", "Cross-cutting concerns", "Constraints", "Diagrams",
];
const PATH = "10-spec/60-architecture/architecture.md";

export const arch002: LintRule = {
  code: "LINT-ARCH-002",
  severity: "error",
  fix: "Add the section",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const doc = c.spec.docs.get(PATH);
      if (!doc) continue;
      const required = c.spec.kind === "greenfield" ? ARCHITECTURE_SECTIONS : [...ARCHITECTURE_SECTIONS, "As-is to to-be delta"];
      const names = doc.blocks.headings.map((h) => headingName(h.text));
      for (const s of required.filter((r) => !names.some((n) => n.startsWith(r.toLowerCase()))))
        out.push({ path: `${c.folder}/${PATH}`, line: 1, message: `Architecture section "${s}" is missing` });
    }
    return out;
  },
};
