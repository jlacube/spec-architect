// TR-12 (error): a reference to an ID that is neither defined in the workspace nor tombstoned
// (C001-REQ-717). References inside code (fences, backticks) and quotes are example IDs and exempt.
import type { LintRule } from "../types.ts";

export const tr12: LintRule = {
  code: "TR-12",
  severity: "error",
  fix: "Define the ID, correct the reference, or tombstone the ID",
  scope: "change",
  check(ctx) {
    return ctx.references
      .filter((r) => r.context === "text" && !ctx.definitions.has(r.to) && !ctx.tombstones.has(r.to))
      .map((r) => ({ path: r.path, line: r.line, ids: [r.to], message: `${r.to} is neither defined nor tombstoned` }));
  },
};
