// LINT-WS-002 (info): an entry of `.sdd/` that the workspace layout does not define. It is
// preserved and reported, never an error (C001-REQ-124).
import { isKnownRootEntry } from "../../workspace/layout.ts";
import type { LintRule } from "../types.ts";

export const ws002: LintRule = {
  code: "LINT-WS-002",
  severity: "info",
  fix: "None needed (preserved)",
  check(ctx) {
    return ctx.workspace.entries
      .filter((e) => !isKnownRootEntry(e.name, e.isDirectory))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((e) => {
        const name = e.isDirectory ? `${e.name}/` : e.name;
        return { path: `.sdd/${name}`, message: `Unknown entry \`${name}\` in .sdd/ is preserved` };
      });
  },
};
