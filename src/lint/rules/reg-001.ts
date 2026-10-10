// LINT-REG-001 (error): registry.json differs from the registry rebuilt from frontmatter
// (C001-REQ-106). One finding per differing JSON path.
import type { LintRule } from "../types.ts";

const show = (v: unknown) => (v === undefined ? "(absent)" : `\`${typeof v === "string" ? v : JSON.stringify(v)}\``);

export const reg001: LintRule = {
  code: "LINT-REG-001",
  severity: "error",
  fix: "Run `sdd status --write`",
  scope: "workspace",
  check(ctx) {
    return ctx.workspace.registryDrift.map((d) => ({
      path: ".sdd/registry.json",
      message: d.path === "$" ? "registry.json is missing" : `${d.path}: stored ${show(d.stored)}, expected ${show(d.expected)}`,
    }));
  },
};
