// LINT-LIV-001 (error): a requirement entry in a `_living/` file marked `inventory_only: true`
// (C001-REQ-122).
import type { LintRule, RuleFinding } from "../types.ts";

export const liv001: LintRule = {
  code: "LINT-LIV-001",
  severity: "error",
  fix: "Remove it or set `inventory_only: false` via archive",
  scope: "workspace",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const l of ctx.workspace.living) {
      if (!l.inventoryOnly) continue;
      for (const n of l.nodes)
        if (n.type === "REQ" && n.form === "heading")
          out.push({ path: l.path, line: n.line, ids: [n.id], message: `${n.id} is a requirement in an inventory-only living file` });
    }
    return out;
  },
};
