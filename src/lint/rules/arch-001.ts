// LINT-ARCH-001 (error): a component ID in a Mermaid component diagram is not in the catalogue, or
// a non-removed catalogue component appears in no component diagram (C001-REQ-509). Diagram IDs
// are compared after mapping `_` back to `-`; short forms belong to the change.
import { formatId } from "../../model/ids.ts";
import { mermaidBlocks } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";
import { componentStatus } from "./arch-003.ts";

const COMPONENT_DIAGRAMS = /^(flowchart|graph|C4Context|C4Container|C4Component|block-beta|architecture-beta)$/;
const DIAGRAM_ID = /\b(?:C(\d{3})[-_])?COMP[-_](\d+)\b/g;

export const arch001: LintRule = {
  code: "LINT-ARCH-001",
  severity: "error",
  fix: "Align IDs",
  scope: "change",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const catalogue = c.graph.nodes.filter((n) => n.type === "COMP" && n.form === "heading");
      const known = new Set(catalogue.map((n) => n.id));
      const shown = new Set<string>();
      const docs = [...c.spec.docs].filter(([p]) => p.startsWith("10-spec/60-architecture/"));
      for (const b of mermaidBlocks(docs)) {
        if (!COMPONENT_DIAGRAMS.test(b.kind)) continue;
        b.lines.forEach((text, i) => {
          for (const m of text.matchAll(DIAGRAM_ID)) {
            const id = formatId({ change: m[1] ?? c.change, type: "COMP", seq: m[2]! });
            if (shown.has(id)) continue;
            shown.add(id);
            if (!known.has(id)) out.push({ path: `${c.folder}/${b.path}`, line: b.line + 1 + i, ids: [id], message: `${id} is in a component diagram but not in the catalogue` });
          }
        });
      }
      for (const n of catalogue)
        if (!shown.has(n.id) && componentStatus(n.fields.find((f) => f.name === "Status")?.value ?? "") !== "removed")
          out.push({ path: `${c.folder}/${n.file}`, line: n.line, ids: [n.id], message: `${n.id} is in the catalogue but in no component diagram` });
    }
    return out;
  },
};
