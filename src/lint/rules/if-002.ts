// LINT-IF-002 (error): a file under `50-interfaces/` has no row in the interface registry
// `50-interfaces/README.md` (C001-REQ-510). The registry itself and `errors.md` are exempt.
import { tables } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const REGISTRY = "10-spec/50-interfaces/README.md";
const EXEMPT = new Set(["README.md", "errors.md"]);

export const if002: LintRule = {
  code: "LINT-IF-002",
  severity: "error",
  fix: "Add a row to `50-interfaces/README.md`",
  scope: "change",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const doc = c.spec.docs.get(REGISTRY);
      const registered = new Set<string>();
      if (doc)
        for (const t of tables(doc, REGISTRY)) {
          const col = t.header.findIndex((h) => h === "file" || h === "files");
          if (col < 0) continue;
          for (const r of t.rows) for (const m of (r.raw[col] ?? "").matchAll(/[^\s`,;]+/g)) registered.add(m[0].replace(/^\.\//, ""));
        }
      for (const path of c.spec.interfaces.keys()) {
        const name = path.slice(path.lastIndexOf("/") + 1);
        if (EXEMPT.has(name) || registered.has(name)) continue;
        out.push({ path: `${c.folder}/${path}`, line: 1, message: `${name} has no row in the interface registry (50-interfaces/README.md)` });
      }
    }
    return out;
  },
};
