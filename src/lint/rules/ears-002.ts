// LINT-EARS-002 (error): a Statement contains more than one SHALL outside code spans
// (C001-REQ-406; the singularity rule of C001-IF-04 §3.1 checks the keyword count only).
import { countShall } from "../ears.ts";
import type { LintRule } from "../types.ts";

export const ears002: LintRule = {
  code: "LINT-EARS-002",
  severity: "error",
  fix: "Split the requirement",
  scope: "file",
  check(ctx) {
    return ctx.statements
      .map((s) => ({ s, n: countShall(s.text) }))
      .filter(({ n }) => n > 1)
      .map(({ s, n }) => ({ path: s.path, line: s.line, ids: [s.id], message: `Requirement contains ${n} SHALL keywords` }));
  },
};
