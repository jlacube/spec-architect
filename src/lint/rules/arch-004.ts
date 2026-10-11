// LINT-ARCH-004 (error): a runtime flow listed in the Runtime flows section has no Mermaid sequence
// diagram (C001-REQ-508). A diagram belongs to a flow when the flow's label appears in the heading
// above it, in the diagram itself, or in the name of its file (`60-architecture/sequences/`).
import { headingAbove, mermaidBlocks, sectionByName, tables } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const PATH = "10-spec/60-architecture/architecture.md";

export const arch004: LintRule = {
  code: "LINT-ARCH-004",
  severity: "error",
  fix: "Add the diagram",
  scope: "change",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const doc = c.spec.docs.get(PATH);
      const section = doc ? sectionByName(doc, "runtime flows") : null;
      if (!doc || !section) continue;
      const docs = [...c.spec.docs].filter(([p]) => p.startsWith("10-spec/60-architecture/"));
      const sequences = mermaidBlocks(docs)
        .filter((b) => b.kind === "sequenceDiagram")
        .map((b) => [headingAbove(c.spec.docs.get(b.path)!, b.line), ...b.lines, b.path.slice(b.path.lastIndexOf("/") + 1)].join("\n"));
      for (const t of tables(doc, PATH))
        for (const r of t.rows) {
          if (r.line <= section.line || r.line > section.end) continue;
          const flow = (r.raw[0] ?? "").replace(/[*`]/g, "").trim();
          if (flow === "") continue;
          const word = new RegExp(`(^|[^\\w-])${flow.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`);
          if (!sequences.some((s) => word.test(s))) out.push({ path: `${c.folder}/${PATH}`, line: r.line, message: `Runtime flow ${flow} has no sequence diagram` });
        }
    }
    return out;
  },
};
