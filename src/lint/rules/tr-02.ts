// TR-02 (error): every requirement lists at least one user story and one acceptance criterion
// (C001-IF-04 §5). Its inputs are the requirement block itself, so it also runs in quick mode.
import { findIds } from "../../model/ids.ts";
import type { LintRule, RuleFinding } from "../types.ts";

export const tr02: LintRule = {
  code: "TR-02",
  severity: "error",
  fix: "List the requirement's user stories under Stories and its criteria under Acceptance",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const n of c.graph.nodes) {
        if (n.type !== "REQ") continue;
        const field = (name: string) => n.fields.find((f) => f.name === name)?.value ?? "";
        const types = (name: string) => findIds(field(name), c.change).map((h) => h.id.split("-")[1]);
        const missing = [
          ...(types("Stories").includes("US") ? [] : ["user story"]),
          ...(types("Acceptance").includes("AC") ? [] : ["acceptance criterion"]),
        ];
        if (missing.length > 0) out.push({ path: `${c.folder}/${n.file}`, line: n.line, ids: [n.id], message: `${n.id} lists no ${missing.join(" and no ")}` });
      }
    return out;
  },
};
