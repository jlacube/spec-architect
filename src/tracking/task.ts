// `sdd task set` (C001-REQ-901 … 904, 922): the task state machine of state-machines §3 applied to a
// task file's frontmatter (or a lite plan.md section), with the report fields.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CliError, usage } from "../cli/errors.ts";
import { writeTextAtomic } from "../io/atomic.ts";
import { splitFrontmatter } from "../model/frontmatter.ts";
import { buildChangeGraph } from "../model/graph.ts";
import { flow, setTopLevel } from "../workspace/change-md.ts";
import { isoDate } from "../workspace/change.ts";

export const TASK_STATUSES = ["todo", "in-progress", "blocked", "done", "dropped"] as const;

/** Allowed transitions (state-machines §3); anything else is ERR-CLI-013. */
const TRANSITIONS: Record<string, string[]> = {
  todo: ["in-progress", "dropped", "done"],
  "in-progress": ["blocked", "done", "dropped"],
  blocked: ["in-progress", "dropped"],
  done: ["in-progress"],
  dropped: [],
};

export interface TaskSetOptions {
  status: string;
  commit?: string;
  note?: string;
  reason?: string;
  today?: string;
}

export interface TaskSetResult {
  id: string;
  from: string;
  to: string;
  /** Unfinished dependencies when the task is set to done (WARN-CLI-001). */
  unfinished: string[];
}

interface TaskFile {
  path: string;
  text: string;
  status: string;
  report: Record<string, unknown>;
  dependsOn: string[];
  lite: boolean;
}

function findTask(changeDir: string, id: string): TaskFile {
  const dir = join(changeDir, "20-plan", "50-tasks");
  if (existsSync(dir))
    for (const name of readdirSync(dir).filter((n) => n.endsWith(".md"))) {
      const path = join(dir, name);
      const text = readFileSync(path, "utf8");
      const fm = splitFrontmatter(text).data ?? {};
      if (fm["id"] !== id) continue;
      const deps = Array.isArray(fm["depends_on"]) ? (fm["depends_on"] as unknown[]).map(String) : [];
      return { path, text, status: String(fm["status"] ?? "todo"), report: (fm["report"] ?? {}) as Record<string, unknown>, dependsOn: deps, lite: false };
    }
  const plan = join(changeDir, "20-plan", "plan.md");
  if (existsSync(plan)) {
    const node = buildChangeGraph(changeDir).nodes.find((n) => n.id === id && n.file === "20-plan/plan.md");
    if (node) {
      const field = (name: string) => node.fields.find((f) => f.name === name)?.value ?? "";
      return {
        path: plan, text: readFileSync(plan, "utf8"), status: field("Status") || "todo",
        report: { commit: field("Commit") || null, notes: field("Notes") || null, completed_at: field("Completed at") || null },
        dependsOn: field("Depends on").split(/[,\s]+/).filter((x) => /-T-/.test(x)), lite: true,
      };
    }
  }
  throw usage("task set", `task ${id} not found in ${changeDir}`);
}

/** Status of every task of the change, by ID (task files and lite sections). */
function statuses(changeDir: string): Map<string, string> {
  const out = new Map<string, string>();
  const graph = buildChangeGraph(changeDir);
  for (const n of graph.nodes) {
    if (n.type !== "T") continue;
    if (n.form === "frontmatter") out.set(n.id, String(graph.files.find((f) => f.path === n.file)?.frontmatter?.["status"] ?? "todo"));
    else if (n.form === "heading") out.set(n.id, n.fields.find((f) => f.name === "Status")?.value ?? "todo");
  }
  return out;
}

/** Sets a `- **Name:** value` field inside one lite task section, adding it when absent. */
function setLiteField(text: string, id: string, name: string, value: string): string {
  const lines = text.split("\n");
  const at = lines.findIndex((l) => new RegExp(`^#{2,4}\\s+${id}\\b`).test(l));
  let end = lines.findIndex((l, i) => i > at && /^#{1,4}\s/.test(l));
  if (end < 0) end = lines.length;
  const f = lines.findIndex((l, i) => i > at && i < end && l.startsWith(`- **${name}:**`));
  if (f >= 0) lines[f] = `- **${name}:** ${value}`;
  else {
    let last = at;
    for (let i = at + 1; i < end; i++) if (lines[i]!.startsWith("- **")) last = i;
    lines.splice(last + 1, 0, `- **${name}:** ${value}`);
  }
  return lines.join("\n");
}

export function setTask(changeDir: string, id: string, o: TaskSetOptions): TaskSetResult {
  if (!(TASK_STATUSES as readonly string[]).includes(o.status)) throw new CliError("ERR-CLI-005", { s: o.status });
  if (o.status === "blocked" && (o.reason === undefined || o.reason.trim() === "")) throw new CliError("ERR-CLI-006");
  const task = findTask(changeDir, id);
  if (!(TRANSITIONS[task.status] ?? []).includes(o.status)) throw new CliError("ERR-CLI-013", { from: task.status, to: o.status });

  const today = o.today ?? isoDate();
  const report: Record<string, unknown> = { commit: task.report["commit"] ?? null, completed_at: task.report["completed_at"] ?? null, notes: task.report["notes"] ?? null };
  if (o.commit !== undefined) report["commit"] = o.commit;
  if (o.status === "done") report["completed_at"] = today;
  if (task.status === "done" && o.status === "in-progress") report["completed_at"] = null;
  const notes = [o.note, o.status === "blocked" ? `blocked: ${o.reason}` : undefined].filter((x): x is string => x !== undefined);
  if (notes.length > 0) report["notes"] = notes.join("; ");
  for (const k of Object.keys(report)) if (report[k] instanceof Date) report[k] = (report[k] as Date).toISOString().slice(0, 10);

  let text: string;
  if (task.lite) {
    text = setLiteField(task.text, id, "Status", o.status);
    if (report["commit"] !== null) text = setLiteField(text, id, "Commit", String(report["commit"]));
    if (report["notes"] !== null) text = setLiteField(text, id, "Notes", String(report["notes"]));
    text = setLiteField(text, id, "Completed at", report["completed_at"] === null ? "—" : String(report["completed_at"]));
  } else {
    text = setTopLevel(task.text, "status", o.status);
    text = setTopLevel(text, "report", flow(report));
  }

  const all = statuses(changeDir);
  const unfinished = o.status === "done" ? task.dependsOn.filter((d) => !["done", "dropped"].includes(all.get(d) ?? "todo")) : [];
  writeTextAtomic(task.path, text);
  return { id, from: task.status, to: o.status, unfinished };
}
