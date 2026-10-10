// TR-03 (error): every acceptance criterion has at least one scenario (C001-IF-04 §5; C001-TS-413).
import type { LintRule, RuleFinding } from "../types.ts";

export const tr03: LintRule = {
  code: "TR-03",
  severity: "error",
  fix: "Add a gherkin Scenario titled with a TS ID under the criterion",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const covered = new Set(c.graph.edges.filter((e) => e.kind === "scenario").map((e) => e.from));
      for (const n of c.graph.nodes)
        if (n.type === "AC" && n.form === "heading" && !covered.has(n.id))
          out.push({ path: `${c.folder}/${n.file}`, line: n.line, ids: [n.id], message: `${n.id} has no scenario` });
    }
    return out;
  },
};
