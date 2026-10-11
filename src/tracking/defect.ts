// Spec defects (C001-REQ-907, 908, 910, 923): `D-<nnn>` entries of the `defects` list in change.md,
// with a history of earlier closures when a defect is reopened.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { usage } from "../cli/errors.ts";
import { writeTextAtomic } from "../io/atomic.ts";
import { splitFrontmatter } from "../model/frontmatter.ts";
import { listYaml, setTopLevel } from "../workspace/change-md.ts";
import { isoDate } from "../workspace/change.ts";

export type Defect = Record<string, unknown> & { id: string; status: string };

function read(changeDir: string): { text: string; defects: Defect[] } {
  const text = readFileSync(join(changeDir, "change.md"), "utf8");
  const fm = splitFrontmatter(text).data ?? {};
  const list = Array.isArray(fm["defects"]) ? (fm["defects"] as Defect[]) : [];
  return { text, defects: list.map((d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v instanceof Date ? v.toISOString().slice(0, 10) : v])) as Defect) };
}

function write(changeDir: string, text: string, defects: Defect[]): void {
  writeTextAtomic(join(changeDir, "change.md"), setTopLevel(text, "defects", listYaml(defects)));
}

/** Adds an open defect against `ref` (the caller checked that `ref` is defined in an active change). */
export function addDefect(changeDir: string, ref: string, summary: string, reporter: string, today = isoDate()): Defect {
  const { text, defects } = read(changeDir);
  const seq = defects.reduce((m, d) => Math.max(m, Number(/^D-(\d+)$/.exec(d.id)?.[1] ?? 0)), 0) + 1;
  const defect: Defect = { id: `D-${String(seq).padStart(3, "0")}`, ref, summary, reporter, date: today, status: "open", resolution: null, closed_at: null };
  write(changeDir, text, [...defects, defect]);
  return defect;
}

function find(defects: Defect[], id: string): Defect {
  const d = defects.find((x) => x.id === id);
  if (!d) throw usage("defect", `defect ${id} not found`);
  return d;
}

export function closeDefect(changeDir: string, id: string, resolution: string, today = isoDate()): Defect {
  const { text, defects } = read(changeDir);
  const d = find(defects, id);
  if (d.status === "closed") throw usage("defect close", `${id} is already closed`);
  Object.assign(d, { status: "closed", resolution, closed_at: today });
  write(changeDir, text, defects);
  return d;
}

/** Reopens a closed defect, moving its resolution and closing date into `history`. */
export function reopenDefect(changeDir: string, id: string): Defect {
  const { text, defects } = read(changeDir);
  const d = find(defects, id);
  if (d.status !== "closed") throw usage("defect reopen", `${id} is not closed`);
  const history = Array.isArray(d["history"]) ? (d["history"] as unknown[]) : [];
  Object.assign(d, { status: "open", history: [...history, { resolution: d["resolution"] ?? null, closed_at: d["closed_at"] ?? null }], resolution: null, closed_at: null });
  write(changeDir, text, defects);
  return d;
}

