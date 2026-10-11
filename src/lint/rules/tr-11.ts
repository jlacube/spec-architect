// TR-11 (error): the task `depends_on` relation has a cycle, or names a task that does not exist and
// is not tombstoned (C001-REQ-607). Cycles are listed once, from their smallest task ID.
import { tasks } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const short = (id: string) => id.slice(id.indexOf("-") + 1);

export const tr11: LintRule = {
  code: "TR-11",
  severity: "error",
  fix: "Remove the cycle or fix the dependency ID",
  scope: "change",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      if (!c.spec.planStarted) continue;
      const all = tasks(c);
      const byId = new Map(all.map((t) => [t.id, t]));
      for (const t of all)
        for (const d of t.dependsOn)
          if (!byId.has(d) && !ctx.tombstones.has(d))
            out.push({ path: `${c.folder}/${t.path}`, line: t.line, ids: [t.id, d], message: `${t.id} depends on ${d}, which does not exist` });

      // Cycles: depth-first search over depends_on; a back edge closes a cycle.
      const state = new Map<string, "open" | "done">();
      const seen = new Set<string>();
      const stack: string[] = [];
      const visit = (id: string): void => {
        state.set(id, "open");
        stack.push(id);
        for (const d of byId.get(id)?.dependsOn ?? []) {
          if (!byId.has(d)) continue;
          if (state.get(d) === "open") {
            const cycle = stack.slice(stack.indexOf(d));
            const start = cycle.indexOf([...cycle].sort()[0]!);
            const ordered = [...cycle.slice(start), ...cycle.slice(0, start)];
            const key = ordered.join(" ");
            if (!seen.has(key)) {
              seen.add(key);
              const first = byId.get(ordered[0]!)!;
              out.push({
                path: `${c.folder}/${first.path}`, line: first.line, ids: ordered,
                message: `Dependency cycle ${[...ordered, ordered[0]!].map(short).join(" → ")}`,
              });
            }
          } else if (!state.has(d)) visit(d);
        }
        stack.pop();
        state.set(id, "done");
      };
      for (const t of [...all].sort((a, b) => a.id.localeCompare(b.id))) if (!state.has(t.id)) visit(t.id);
    }
    return out;
  },
};
