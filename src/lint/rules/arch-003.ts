// LINT-ARCH-003 (error): a catalogue component lacks a field of C001-REQ-502, or its Status is not
// existing, new, modified or removed.
import type { LintRule, RuleFinding } from "../types.ts";

const FIELDS = ["Name", "Responsibility", "Owned data", "Interfaces", "Depends on", "Realizes", "Status"];
export const COMPONENT_STATUSES = ["existing", "new", "modified", "removed"];

/** The component's Status value without emphasis, lower-cased. */
export function componentStatus(value: string): string {
  return value.replace(/[*`_]/g, "").trim().toLowerCase();
}

export const arch003: LintRule = {
  code: "LINT-ARCH-003",
  severity: "error",
  fix: "Add the field",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const n of c.graph.nodes) {
        if (n.type !== "COMP" || n.form !== "heading") continue;
        const at = { path: `${c.folder}/${n.file}`, line: n.line, ids: [n.id] };
        const missing = FIELDS.filter((name) => !n.fields.some((f) => f.name === name));
        if (missing.length > 0) out.push({ ...at, message: `${n.id} lacks the field${missing.length > 1 ? "s" : ""} ${missing.map((m) => `"${m}"`).join(", ")}` });
        const status = n.fields.find((f) => f.name === "Status");
        if (status && !COMPONENT_STATUSES.includes(componentStatus(status.value)))
          out.push({ ...at, line: status.line, message: `${n.id} has Status "${status.value}", not one of ${COMPONENT_STATUSES.join(", ")}` });
      }
    return out;
  },
};
