// LINT-TASK-004 (error): a task file lacks a frontmatter key of C001-IF-03 §3, has a status or
// estimate outside its values, or lacks one of the six body headings or has them out of order
// (C001-REQ-602). Lite tasks (sections of plan.md) need the task fields of the lite template.
import { fieldText, headingName, tasks } from "../spec.ts";
import type { LintChange, LintRule, RuleFinding } from "../types.ts";

const KEYS = ["id", "title", "milestone", "status", "depends_on", "implements", "satisfies_ac", "verified_by", "components", "risk_refs", "estimate", "report"];
const LISTS = ["depends_on", "implements", "satisfies_ac", "verified_by", "components", "risk_refs"];
const HEADINGS = ["Intent", "Targets", "Preconditions", "Step outline", "Verification", "Done when"];
const LITE_FIELDS = ["Status", "Depends on", "Implements", "Satisfies AC", "Verified by", "Estimate"];
const STATUSES = ["todo", "in-progress", "blocked", "done", "dropped"];
const ESTIMATES = ["S", "M", "L"];
const TASKS_DIR = "20-plan/50-tasks/";

const problem = (text: string) => `Task file shape wrong: ${text}`;

/** True when a heading is `name`, possibly with a qualifier: "Step outline (no production code)". */
function isHeading(text: string, name: string): boolean {
  const n = headingName(text);
  return n === name.toLowerCase() || n.startsWith(`${name.toLowerCase()} (`);
}

function taskFiles(c: LintChange): RuleFinding[] {
  const out: RuleFinding[] = [];
  for (const [path, doc] of c.spec.docs) {
    if (!path.startsWith(TASKS_DIR) || !/^T-[^/]*\.md$/.test(path.slice(TASKS_DIR.length))) continue;
    const fm = c.graph.files.find((f) => f.path === path)?.frontmatter ?? {};
    const id = typeof fm["id"] === "string" ? fm["id"] : "";
    const name = id || path.slice(TASKS_DIR.length);
    const at = (line: number, message: string): RuleFinding => ({ path: `${c.folder}/${path}`, line, ...(id ? { ids: [id] } : {}), message: problem(message) });
    const keyLine = (k: string) => Math.max(1, doc.lines.findIndex((l) => l.startsWith(`${k}:`)) + 1);
    for (const k of KEYS) if (!(k in fm)) out.push(at(1, `${name} lacks the frontmatter key ${k}`));
    if ("status" in fm && !STATUSES.includes(String(fm["status"]))) out.push(at(keyLine("status"), `${name} has status "${String(fm["status"])}", not one of ${STATUSES.join(", ")}`));
    if ("estimate" in fm && !ESTIMATES.includes(String(fm["estimate"]))) out.push(at(keyLine("estimate"), `${name} has estimate "${String(fm["estimate"])}", not one of ${ESTIMATES.join(", ")}`));
    for (const k of LISTS) if (k in fm && !Array.isArray(fm[k])) out.push(at(keyLine(k), `${name} has a ${k} that is not a list`));
    // A heading may carry a qualifier, e.g. "Step outline (no production code)".
    const heads = doc.blocks.headings.filter((h) => h.level === 2);
    const found = HEADINGS.map((s) => heads.find((h) => isHeading(h.text, s)));
    HEADINGS.forEach((s, i) => found[i] === undefined && out.push(at(1, `${name} has no heading ${s}`)));
    // One finding per file: the first expected heading that is not where the order puts it.
    const present = found.flatMap((h, i) => (h ? [{ name: HEADINGS[i]!, line: h.line }] : []));
    const byLine = [...present].sort((a, b) => a.line - b.line);
    const misplaced = present.find((p, i) => byLine[i] !== p);
    if (misplaced) out.push(at(misplaced.line, `${name} has heading ${misplaced.name} out of order (expected ${HEADINGS.join(", ")})`));
  }
  return out;
}

function liteTasks(c: LintChange): RuleFinding[] {
  const out: RuleFinding[] = [];
  for (const t of tasks(c)) {
    if (!t.lite || !t.doc) continue;
    const lines = t.doc.lines.slice(t.from - 1, t.to);
    const at = (message: string): RuleFinding => ({ path: `${c.folder}/${t.path}`, line: t.line, ids: [t.id], message: problem(message) });
    for (const f of LITE_FIELDS) if (fieldText(lines, f) === null) out.push(at(`${t.id} lacks the field ${f}`));
    const status = fieldText(lines, "Status");
    if (status !== null && !STATUSES.includes(status.toLowerCase())) out.push(at(`${t.id} has status "${status}", not one of ${STATUSES.join(", ")}`));
    const estimate = fieldText(lines, "Estimate");
    if (estimate !== null && !ESTIMATES.includes(estimate)) out.push(at(`${t.id} has estimate "${estimate}", not one of ${ESTIMATES.join(", ")}`));
  }
  return out;
}

export const task004: LintRule = {
  code: "LINT-TASK-004",
  severity: "error",
  fix: "Add the field or heading, in order",
  scope: "file",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) if (c.spec.planStarted) out.push(...taskFiles(c), ...liteTasks(c));
    return out;
  },
};
