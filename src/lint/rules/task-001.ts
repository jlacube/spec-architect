// LINT-TASK-001 (error): a task has no row in Targets, no runnable step in Verification or no
// checkbox in Done when (C001-REQ-603). Lite tasks need non-empty Targets, Verification and Done
// when fields.
import { fieldText, sectionByName, tables, tasks, type TaskInfo } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

function emptySections(t: TaskInfo): string[] {
  const doc = t.doc;
  if (!doc) return [];
  if (t.lite) {
    const lines = doc.lines.slice(t.from - 1, t.to);
    return ["Targets", "Verification", "Done when"].filter((name) => (fieldText(lines, name) ?? "") === "");
  }
  const section = (name: string) => {
    const s = sectionByName(doc, name);
    return s ? doc.lines.slice(s.line, s.end) : [];
  };
  const targets = sectionByName(doc, "targets");
  const hasRow = targets !== null && tables(doc, t.path).some((tb) => tb.headerLine > targets.line && tb.headerLine <= targets.end && tb.rows.length > 0);
  const step = section("verification").some((l) => /^\s*(?:[-*+]|\d+[.)])\s+\S/.test(l));
  const box = section("done when").some((l) => /^\s*[-*+] \[[ xX]\]\s+\S/.test(l));
  return [...(hasRow ? [] : ["Targets"]), ...(step ? [] : ["Verification"]), ...(box ? [] : ["Done when"])];
}

export const task001: LintRule = {
  code: "LINT-TASK-001",
  severity: "error",
  fix: "Fill Targets, Verification, Done when",
  scope: "file",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      if (!c.spec.planStarted) continue;
      for (const t of tasks(c)) {
        const empty = emptySections(t);
        if (empty.length > 0) out.push({ path: `${c.folder}/${t.path}`, line: t.line, ids: [t.id], message: `${t.id} has an empty ${empty.join(", ")} section` });
      }
    }
    return out;
  },
};
