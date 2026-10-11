// Structure checks of plan artifacts for C001-TS-602, 611, 615, 617, 619 and 620. The scenarios say "the
// lint checks", but the error catalogue has no rule codes for these artifacts yet (defect D-003); until
// it does, the checks live here and run on inline samples, on CHG-001's own plan (the worked example)
// and, through the evals, on the planner's output. Each function returns problems (empty = valid).
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";

interface Table {
  header: string[];
  rows: string[][];
}

/** Markdown tables of a text: lower-cased header cells and the data rows' trimmed cells. */
export function tables(text: string): Table[] {
  const out: Table[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length - 1; i++) {
    if (!/^\s*\|/.test(lines[i]!) || !/^\s*\|\s*:?-{3,}/.test(lines[i + 1]!)) continue;
    const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    const header = cells(lines[i]!).map((h) => h.toLowerCase());
    const rows: string[][] = [];
    let j = i + 2;
    while (j < lines.length && /^\s*\|/.test(lines[j]!)) rows.push(cells(lines[j++]!));
    out.push({ header, rows });
    i = j - 1;
  }
  return out;
}

const col = (t: Table, name: RegExp) => t.header.findIndex((h) => name.test(h));

/** The body of the `## <name>` section (any numbering), up to the next `## ` heading. */
export function section(text: string, name: string): string {
  const m = new RegExp(`^##\\s+(?:\\d+\\.\\s*)?${name}\\b[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, "mi").exec(text);
  return m ? m[1]! : "";
}

const TASK_KEYS = ["id", "title", "milestone", "status", "depends_on", "implements", "satisfies_ac", "verified_by", "components", "risk_refs", "estimate", "report"];
const TASK_SECTIONS = ["Intent", "Targets", "Preconditions", "Step outline", "Verification", "Done when"];

/** C001-TS-602: task frontmatter per C001-IF-03 §3 and the six body headings in order. */
export function taskProblems(text: string): string[] {
  const p: string[] = [];
  const doc = splitFrontmatter(text);
  const fm = (doc.data ?? {}) as Record<string, unknown>;
  for (const k of TASK_KEYS) if (!(k in fm)) p.push(`frontmatter lacks ${k}`);
  if ("status" in fm && !["todo", "in-progress", "blocked", "done", "dropped"].includes(String(fm["status"]))) p.push(`status ${fm["status"]}`);
  if ("estimate" in fm && !["S", "M", "L"].includes(String(fm["estimate"]))) p.push(`estimate ${fm["estimate"]}`);
  for (const k of ["depends_on", "implements", "satisfies_ac", "verified_by", "components", "risk_refs"]) if (k in fm && !Array.isArray(fm[k])) p.push(`${k} is not a list`);
  const heads = [...text.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1]!);
  // A heading may carry a qualifier, e.g. "Step outline (no production code)".
  const found = TASK_SECTIONS.map((s) => heads.findIndex((h) => h === s || h.startsWith(`${s} (`)));
  TASK_SECTIONS.forEach((s, i) => found[i]! < 0 && p.push(`heading ${s} missing`));
  if (found.every((i) => i >= 0) && found.some((v, i) => i > 0 && v < found[i - 1]!)) p.push("headings out of order");
  return p;
}

const LEVELS = ["unit", "integration", "e2e", "eval", "manual"];

/** C001-TS-611: every TC has level, location, test data and environment; manual TCs name an executor. */
export function testPlanProblems(text: string): string[] {
  const p: string[] = [];
  const all = tables(text);
  const owners = new Map<string, string>();
  for (const t of all.filter((x) => col(x, /owner|executed by|executor/) >= 0)) for (const r of t.rows) owners.set(r[0]!.replace(/`/g, ""), r[col(t, /owner|executed by|executor/)] ?? "");
  const tcTables = all.filter((t) => col(t, /^level$/) >= 0 && col(t, /^tc$|^id$/) >= 0);
  if (tcTables.length === 0) p.push("no test-case table (TC, Level, Location, Test data, Environment)");
  for (const t of tcTables) {
    const [id, level, loc, data, env] = [col(t, /^tc$|^id$/), col(t, /^level$/), col(t, /location/), col(t, /test data/), col(t, /environment/)];
    for (const r of t.rows) {
      const tc = r[id]!.replace(/`/g, "");
      if (!/TC-\d+/.test(tc)) continue;
      if (!LEVELS.includes(r[level] ?? "")) p.push(`${tc}: level "${r[level]}"`);
      for (const [name, i] of [["location", loc], ["test data", data], ["environment", env]] as const) if (i < 0 || !r[i]) p.push(`${tc}: no ${name}`);
      if (r[level] === "manual" && !(owners.get(tc) ?? "").trim()) p.push(`${tc}: manual without an executor`);
    }
  }
  return p;
}

const LMH = ["low", "medium", "high"];

/** C001-TS-615: every RISK has likelihood/impact in low/medium/high, mitigation, trigger, owner, a T or COMP ID. */
export function riskProblems(text: string): string[] {
  const p: string[] = [];
  const t = tables(text).find((x) => col(x, /likelihood/) >= 0);
  if (!t) return ["no risk table"];
  const c = { lik: col(t, /likelihood/), imp: col(t, /impact/), mit: col(t, /mitigation/), trig: col(t, /trigger/), own: col(t, /owner/), refs: col(t, /refs|concerns|ids/) };
  for (const r of t.rows) {
    const id = /C\d{3}-RISK-\d+/.exec(r[0] ?? "")?.[0];
    if (!id) continue;
    if (!LMH.includes((r[c.lik] ?? "").toLowerCase())) p.push(`${id}: likelihood "${r[c.lik]}"`);
    if (!LMH.includes((r[c.imp] ?? "").toLowerCase())) p.push(`${id}: impact "${r[c.imp]}"`);
    for (const [n, i] of [["mitigation", c.mit], ["trigger", c.trig], ["owner", c.own]] as const) if (i < 0 || !r[i]) p.push(`${id}: no ${n}`);
    if (!/-(T|COMP)-\d+/.test(c.refs >= 0 ? r[c.refs] ?? "" : r.join(" "))) p.push(`${id}: no T or COMP ID`);
  }
  return p;
}

/** C001-TS-617: rollout content, or "No rollout impact" with a reason. */
export function rolloutProblems(text: string): string[] {
  const none = /No rollout impact\s*[—–:-]?\s*(.*)/i.exec(text);
  if (none) return none[1]!.trim().split(/\s+/).filter(Boolean).length >= 3 ? [] : ['"No rollout impact" without a reason'];
  const p: string[] = [];
  if (!section(text, "Migration").trim()) p.push("no migration steps");
  const flags = section(text, "Feature flags");
  if (!flags.trim()) p.push("no feature flags section");
  else if (!/default/i.test(flags) && !/^\s*none\b|no (feature )?flags?/im.test(flags)) p.push("feature flags without default values");
  const rb = tables(text).flatMap((t) => t.rows).filter((r) => /C\d{3}-RB-\d+/.test(r[0] ?? ""));
  if (rb.length === 0) p.push("no rollback steps RB-<seq>");
  for (const r of rb) if (!/-(T|M)-\d+/.test(r.join(" "))) p.push(`${/C\d{3}-RB-\d+/.exec(r[0]!)![0]}: not linked to a T or M ID`);
  if (!section(text, "Communication").trim()) p.push("no communication notes");
  return p;
}

const HANDOFF = ["Reading order", "Rules", "Ordered task list", "Reporting protocol", "Definition of change done"];

/** C001-TS-619: hand-off headings; the reporting protocol names task set, defect add and the frontmatter fallback. */
export function handoffProblems(text: string): string[] {
  const p: string[] = [];
  for (const h of HANDOFF) if (!new RegExp(`^##\\s+(\\d+\\.\\s*)?${h}\\b`, "m").test(text)) p.push(`heading ${h} missing`);
  const rp = section(text, "Reporting protocol");
  for (const s of ["task set", "defect add"]) if (!rp.includes(s)) p.push(`Reporting protocol lacks "${s}"`);
  if (!/frontmatter/i.test(rp)) p.push("Reporting protocol lacks the frontmatter fallback");
  return p;
}

export interface TaskRef {
  id: string;
  dependsOn: string[];
  status: string;
}

/** C001-TS-620: the Ordered task list holds every non-dropped task once, with its path, in dependency order. */
export function orderedListProblems(text: string, tasks: TaskRef[]): string[] {
  const p: string[] = [];
  const body = section(text, "Ordered task list");
  const lines = body.split(/\r?\n/).filter((l) => /-T-\d+/.test(l));
  const order: string[] = [];
  for (const l of lines) {
    const id = /\b(C\d{3}-T-\d+)\b/.exec(l)?.[1];
    if (!id) continue;
    order.push(id);
    if (!/\.sdd\/[^\s|`]+\/(50-tasks\/T-\d+[^\s|`]*\.md|plan\.md)/.test(l)) p.push(`${id}: no path relative to the repository root`);
  }
  for (const t of tasks.filter((x) => x.status !== "dropped")) {
    const n = order.filter((x) => x === t.id).length;
    if (n !== 1) p.push(`${t.id} appears ${n} times`);
  }
  const pos = new Map(order.map((id, i) => [id, i]));
  for (const t of tasks) for (const d of t.dependsOn) if (pos.has(t.id) && pos.has(d) && pos.get(d)! > pos.get(t.id)!) p.push(`${t.id} listed before its dependency ${d}`);
  return p;
}
