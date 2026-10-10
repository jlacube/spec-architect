// LINT-US-002 (error): a user story lacks one of the fields of C001-REQ-402, or leaves it empty.
// "Context & notes" and "Out of scope" are not checked: whether a story needs them is a judgement
// the critic makes, not a lint.
import type { LintRule, RuleFinding } from "../types.ts";

const LABELS: [string, RegExp][] = [
  ["As a", /\*\*As an?:?\*\*(.*)/i],
  ["I want", /\*\*I want:?\*\*(.*)/i],
  ["So that", /\*\*So that:?\*\*(.*)/i],
  ["Value / outcome", /\*\*Value \/ outcome:?\*\*(.*)/i],
  ["Priority", /\*\*Priority:?\*\*(.*)/i],
  ["Size hint", /\*\*Size hint:?\*\*(.*)/i],
  ["Capability", /\*\*Capability:?\*\*(.*)/i],
  ["Requirements", /\*\*Requirements:?\*\*(.*)/i],
  ["Traces to", /\*\*Traces to:?\*\*(.*)/i],
];

/** The label's value, up to the next `· **Label**` on the same line. */
function value(rest: string): string {
  return (rest.split(/\s·\s\*\*/)[0] ?? "").trim();
}

export const us002: LintRule = {
  code: "LINT-US-002",
  severity: "error",
  fix: "Add the field",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const [id, s] of c.spec.sections) {
        if (!id.includes("-US-")) continue;
        const missing = LABELS.filter(([, re]) => !s.lines.some((l) => value(re.exec(l)?.[1] ?? "") !== "")).map(([name]) => name);
        if (missing.length === 0) continue;
        const file = c.graph.byId.get(id)?.[0]?.file ?? "";
        out.push({ path: `${c.folder}/${file}`, line: s.line, ids: [id], message: `${id} lacks the field${missing.length > 1 ? "s" : ""} ${missing.map((m) => `"${m}"`).join(", ")}` });
      }
    return out;
  },
};
