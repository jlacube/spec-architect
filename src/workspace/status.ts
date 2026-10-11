// Workspace status (C001-REQ-104, 105, 106, 905): rebuild `registry.json` from frontmatter only,
// render the SDD.md status block, derive implementation status (state-machines §5), and diff a
// stored registry against the rebuild.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { writeFileAtomic, writeTextAtomic } from "../io/atomic.ts";
import { splitFrontmatter } from "../model/frontmatter.ts";
import { parseArtifact } from "../model/graph.ts";
import { adoptBootstrap } from "./adopt.ts";
import { readStatusBlock, STATUS_BEGIN, STATUS_END } from "./sddmd.ts";

export const PHASE_NAMES = ["00-ideation", "10-spec", "20-plan"] as const;
type PhaseName = (typeof PHASE_NAMES)[number];

export interface PhaseEntry {
  status: string;
  approved_hash?: string | null;
  hash_scope?: string;
  approved_at?: string | null;
  approved_by?: string | null;
}

export interface RegistryChange {
  id: string;
  slug: string;
  title: string;
  kind: string;
  profile: string;
  status: string;
  phase: string;
  phases: Record<PhaseName, PhaseEntry>;
  implementation: { status: string; tasks: { total: number; done: number; blocked: number; in_progress: number }; last_report: string | null };
  defects: Record<string, unknown>[];
  waivers: Record<string, unknown>[];
}

export interface Registry {
  sdd_version: 1;
  generated_at: string;
  changes: RegistryChange[];
}

/** state-machines §5 rules 1–5, over non-dropped task statuses. */
export function deriveImplementation(statuses: readonly string[]): string {
  const live = statuses.filter((s) => s !== "dropped");
  if (live.length === 0) return "not-started";
  if (live.every((s) => s === "done")) return "done";
  if (live.includes("blocked") && !live.includes("in-progress")) return "blocked";
  if (live.some((s) => s === "in-progress" || s === "done")) return "in-progress";
  return "not-started";
}

const str = (v: unknown): string | null => (typeof v === "string" ? v : v instanceof Date ? v.toISOString().slice(0, 10) : null);

interface TaskState {
  status: string;
  completedAt: string | null;
}

/**
 * Task statuses of a change: frontmatter of `20-plan/50-tasks/*.md`, plus the task sections of a lite
 * `20-plan/plan.md`. Only those files are read (the session-start brief, C001-NFR-104).
 */
function taskStates(dir: string): TaskState[] {
  const out: TaskState[] = [];
  const tasksDir = join(dir, "20-plan", "50-tasks");
  if (existsSync(tasksDir))
    for (const name of readdirSync(tasksDir).filter((n) => n.endsWith(".md")).sort()) {
      const fm = splitFrontmatter(readFileSync(join(tasksDir, name), "utf8")).data ?? {};
      if (typeof fm["id"] !== "string" || !/-T-\d+$/.test(fm["id"])) continue;
      const report = (fm["report"] ?? {}) as Record<string, unknown>;
      out.push({ status: str(fm["status"]) ?? "todo", completedAt: str(report["completed_at"]) });
    }
  const plan = join(dir, "20-plan", "plan.md");
  if (existsSync(plan))
    for (const n of parseArtifact(plan, "20-plan/plan.md", basename(dir).slice(0, 3)).nodes)
      if (n.type === "T" && n.form === "heading") out.push({ status: n.fields.find((f) => f.name === "Status")?.value.trim() || "todo", completedAt: null });
  return out;
}

function changeEntry(dir: string, folder: string, archived: boolean): RegistryChange {
  const fm = splitFrontmatter(readFileSync(join(dir, "change.md"), "utf8")).data ?? {};
  const phasesFm = (fm["phases"] ?? {}) as Record<string, Record<string, unknown>>;
  const phases = {} as Record<PhaseName, PhaseEntry>;
  for (const p of PHASE_NAMES) {
    const src = phasesFm[p] ?? {};
    const entry: PhaseEntry = { status: str(src["status"]) ?? "not-started" };
    for (const k of ["approved_hash", "hash_scope", "approved_at", "approved_by"] as const) if (k in src) (entry as unknown as Record<string, unknown>)[k] = str(src[k]);
    if (entry.hash_scope === null) delete entry.hash_scope;
    phases[p] = entry;
  }
  const tasks = taskStates(dir);
  const live = tasks.filter((t) => t.status !== "dropped");
  const dates = tasks.map((t) => t.completedAt).filter((d): d is string => d !== null).sort();
  const last = dates.at(-1);
  return {
    id: str(fm["id"]) ?? `CHG-${folder.slice(0, 3)}`,
    slug: folder,
    title: str(fm["title"]) ?? folder.slice(4),
    kind: str(fm["kind"]) ?? "greenfield",
    profile: str(fm["profile"]) ?? "full",
    status: archived ? "archived" : (str(fm["status"]) ?? "active"),
    phase: str(fm["phase"]) ?? "00-ideation",
    phases,
    implementation: {
      status: deriveImplementation(tasks.map((t) => t.status)),
      tasks: {
        total: live.length,
        done: live.filter((t) => t.status === "done").length,
        blocked: live.filter((t) => t.status === "blocked").length,
        in_progress: live.filter((t) => t.status === "in-progress").length,
      },
      last_report: last ? (last.length === 10 ? `${last}T00:00:00Z` : last) : null,
    },
    // The registry carries the C001-IF-02 defect fields; a defect's reopen history stays in change.md.
    defects: Array.isArray(fm["defects"]) ? (fm["defects"] as Record<string, unknown>[]).map(registryDefect) : [],
    waivers: Array.isArray(fm["waivers"]) ? (fm["waivers"] as Record<string, unknown>[]) : [],
  };
}

const DEFECT_FIELDS = ["id", "ref", "summary", "reporter", "date", "status", "resolution", "closed_at"];

function registryDefect(d: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(DEFECT_FIELDS.filter((k) => k in d).map((k) => [k, d[k]]));
}

/** Change folders (`NNN-slug` with a change.md) in `.sdd/` and `.sdd/_archive/`, by number. */
export function listChanges(sddDir: string): { dir: string; folder: string; archived: boolean }[] {
  const out: { dir: string; folder: string; archived: boolean }[] = [];
  for (const [base, archived] of [[sddDir, false], [join(sddDir, "_archive"), true]] as const) {
    if (!existsSync(base)) continue;
    for (const name of readdirSync(base)) {
      const dir = join(base, name);
      if (/^\d{3}-/.test(name) && statSync(dir).isDirectory() && existsSync(join(dir, "change.md"))) out.push({ dir, folder: name, archived });
    }
  }
  return out.sort((a, b) => a.folder.localeCompare(b.folder));
}

export function rebuildRegistry(sddDir: string, now: Date = new Date()): Registry {
  return {
    sdd_version: 1,
    generated_at: now.toISOString().replace(/\.\d{3}Z$/, "Z"),
    changes: listChanges(sddDir).map((c) => changeEntry(c.dir, c.folder, c.archived)),
  };
}

function updated(c: RegistryChange): string {
  const dates = [
    ...Object.values(c.phases).map((p) => p.approved_at ?? null),
    c.implementation.last_report?.slice(0, 10) ?? null,
    ...c.defects.map((d) => str(d["date"])),
  ].filter((d): d is string => !!d);
  return dates.sort().at(-1) ?? "—";
}

/** Status block rows (C001-REQ-105): one per non-archived change. */
export function renderStatusBlock(reg: Registry): string {
  const rows = reg.changes
    .filter((c) => c.status !== "archived")
    .map((c) => {
      const t = c.implementation.tasks;
      const open = c.defects.filter((d) => d["status"] === "open").length;
      const status = c.phases[c.phase as PhaseName]?.status ?? "not-started";
      return `| ${c.id.replace(/^CHG-/, "")} | ${c.title.replace(/\|/g, "\\|")} | ${c.phase} | ${status} | ${t.done}/${t.total} | ${open} | ${updated(c)} |`;
    });
  return ["| Change | Title | Phase | Status | Tasks done | Open defects | Updated |", "|---|---|---|---|---|---|---|", ...rows].join("\n");
}

export interface JsonDiff {
  path: string;
  stored: unknown;
  expected: unknown;
}

/** Differences between two JSON values, as JSON paths (`changes[0].phase`). */
export function diffJson(stored: unknown, expected: unknown, path = ""): JsonDiff[] {
  if (Array.isArray(stored) && Array.isArray(expected)) {
    const out: JsonDiff[] = [];
    for (let i = 0; i < Math.max(stored.length, expected.length); i++) out.push(...diffJson(stored[i], expected[i], `${path}[${i}]`));
    return out;
  }
  const isObj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
  if (isObj(stored) && isObj(expected)) {
    const keys = [...new Set([...Object.keys(expected), ...Object.keys(stored)])];
    return keys.flatMap((k) => diffJson(stored[k], expected[k], path ? `${path}.${k}` : k));
  }
  return JSON.stringify(stored) === JSON.stringify(expected) ? [] : [{ path: path || "$", stored, expected }];
}

/** Registry drift (C001-REQ-106), ignoring `generated_at`. */
export function registryDrift(stored: unknown, rebuilt: Registry): JsonDiff[] {
  if (stored === null) return [{ path: "$", stored: null, expected: "a registry" }];
  return diffJson(stored, rebuilt).filter((d) => d.path !== "generated_at");
}

export interface StatusWriteResult {
  adopted: boolean;
  registryWritten: boolean;
  sddMdWritten: boolean;
  registry: Registry;
}

/** `sdd status --write`: adopt a bootstrap workspace, rebuild registry.json and the SDD.md block. */
export function writeStatus(sddDir: string, now: Date = new Date()): StatusWriteResult {
  const adopted = existsSync(join(sddDir, "SDD.md")) ? adoptBootstrap(sddDir) : false;
  const registry = rebuildRegistry(sddDir, now);
  const regPath = join(sddDir, "registry.json");
  const stored = existsSync(regPath) ? (JSON.parse(readFileSync(regPath, "utf8")) as unknown) : null;
  const registryWritten = stored === null || registryDrift(stored, registry).length > 0;
  if (registryWritten) writeTextAtomic(regPath, JSON.stringify(registry, null, 2) + "\n");
  let sddMdWritten = false;
  const sddPath = join(sddDir, "SDD.md");
  if (existsSync(sddPath)) {
    const raw = readFileSync(sddPath, "utf8");
    if (readStatusBlock(raw.replace(/\r\n/g, "\n")) !== null) {
      // Splice the block into the raw text so every byte outside the markers stays (C001-REQ-105).
      const eol = raw.includes("\r\n") ? "\r\n" : "\n";
      const block = renderStatusBlock(registry).split("\n").join(eol);
      const b = raw.indexOf(STATUS_BEGIN) + STATUS_BEGIN.length;
      const e = raw.indexOf(STATUS_END);
      const next = raw.slice(0, b) + eol + block + eol + raw.slice(e);
      if (next !== raw) {
        writeFileAtomic(sddPath, next);
        sddMdWritten = true;
      }
    }
  }
  return { adopted, registryWritten, sddMdWritten, registry };
}
