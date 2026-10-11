// LINT-TASK-002 (warn): a task contains a fenced code block longer than five lines in a language
// other than shell, bash, powershell, console or text (C001-REQ-604).
import { tasks } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const ALLOWED = new Set(["shell", "sh", "bash", "powershell", "pwsh", "ps1", "console", "text", "txt"]);

export const task002: LintRule = {
  code: "LINT-TASK-002",
  severity: "warn",
  fix: "Move signatures to 50-interfaces; remove bodies",
  scope: "file",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      if (!c.spec.planStarted) continue;
      for (const t of tasks(c))
        for (const f of t.doc?.blocks.fences ?? []) {
          if (f.start < t.from || f.start > t.to) continue;
          const lang = f.info.split(/\s+/)[0]?.toLowerCase() ?? "";
          const length = f.end - f.start - 1;
          if (length > 5 && !ALLOWED.has(lang))
            out.push({ path: `${c.folder}/${t.path}`, line: f.start, ids: [t.id], message: `${t.id} contains a ${lang || "plain"} code block of ${length} lines` });
        }
    }
    return out;
  },
};
