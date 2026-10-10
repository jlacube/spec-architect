// TR-13 (error): an ID defined more than once among active changes and `_living/`, or a tombstoned
// ID defined again (C001-REQ-718). Archived change folders are history and not compared.
import type { LintRule, RuleFinding } from "../types.ts";

export const tr13: LintRule = {
  code: "TR-13",
  severity: "error",
  fix: "Keep one definition; allocate a new ID with `sdd id next` for the other",
  scope: "change",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const [id, locs] of ctx.activeDefinitions) {
      const first = locs[0]!;
      if (locs.length > 1)
        out.push({ path: first.path, line: first.line, ids: [id], message: `${id} is defined ${locs.length} times: ${locs.map((l) => `${l.path}:${l.line}`).join(", ")}` });
      if (ctx.tombstones.has(id))
        out.push({ path: first.path, line: first.line, ids: [id], message: `${id} is tombstoned but defined again at ${locs.map((l) => `${l.path}:${l.line}`).join(", ")}` });
    }
    return out;
  },
};
