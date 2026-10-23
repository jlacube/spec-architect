// LINT-HAND-002 (error): the Ordered task list of `handoff.md` does not hold every non-dropped task
// exactly once with the path of its task file relative to the repository root, or lists a task
// before a task it depends on (C001-REQ-617). Entries are the table rows and list items of the
// section; the first task ID of an entry is the task it lists.
import { findIds } from "../../model/ids.ts";
import { sectionByName, tasks } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const HANDOFF = "20-plan/handoff.md";
const ENTRY = /^\s*(?:\||[-*+]\s|\d+[.)]\s)/;
const PATH = /\.sdd\/[^\s|`'"<>()]+\.md/;

export const hand002: LintRule = {
  code: "LINT-HAND-002",
  severity: "error",
  fix: "List every non-dropped task once, with its path, after its dependencies",
  scope: "change",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const doc = c.spec.docs.get(HANDOFF);
      if (!c.spec.planStarted || !doc) continue;
      const section = sectionByName(doc, "Ordered task list", 2);
      if (!section) continue; // LINT-HAND-001 reports the missing section
      const path = `${c.folder}/${HANDOFF}`;
      const all = tasks(c);
      const fileOf = new Map(all.map((t) => [t.id, `${c.folder}/${t.path}`]));
      const entries: { id: string; line: number }[] = [];
      for (let l = section.line + 1; l <= section.end; l++) {
        const text = doc.lines[l - 1] ?? "";
        if (doc.blocks.inFence(l) || !ENTRY.test(text)) continue;
        const id = findIds(text, c.change).find((h) => h.id.includes("-T-"))?.id;
        if (!id) continue;
        entries.push({ id, line: l });
        const named = PATH.exec(text.replace(/\\/g, "/"))?.[0];
        const file = fileOf.get(id);
        if (named === undefined) out.push({ path, line: l, ids: [id], message: `Ordered task list incomplete: ${id} has no path relative to the repository root` });
        else if (file !== undefined && named !== file) out.push({ path, line: l, ids: [id], message: `Ordered task list incomplete: ${id} names ${named}, not its file ${file}` });
      }
      for (const t of all.filter((x) => x.status !== "dropped")) {
        const n = entries.filter((e) => e.id === t.id).length;
        if (n === 0) out.push({ path, line: section.line, ids: [t.id], message: `Ordered task list incomplete: ${t.id} is not listed` });
        else if (n > 1) out.push({ path, line: entries.filter((e) => e.id === t.id)[1]!.line, ids: [t.id], message: `Ordered task list incomplete: ${t.id} is listed ${n} times` });
      }
      const first = new Map<string, number>();
      for (const e of entries) if (!first.has(e.id)) first.set(e.id, e.line);
      for (const t of all) {
        const at = first.get(t.id);
        if (at === undefined) continue;
        for (const d of t.dependsOn) {
          const dl = first.get(d);
          if (dl !== undefined && dl > at) out.push({ path, line: at, ids: [t.id, d], message: `Ordered task list out of dependency order: ${t.id} is listed before its dependency ${d}` });
        }
      }
    }
    return out;
  },
};
