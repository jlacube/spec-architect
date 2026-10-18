// Spec-file locator for tests (C002-T-006): tests read the spec contracts of a change by its number
// and a path relative to the change folder, never by a fixed change-folder name, so they keep working
// when `sdd archive` moves the change. Lookup order: the active change folder `.sdd/<NNN>-*/`, then
// `.sdd/_living/` (the living specs), then the archived folder `.sdd/_archive/<NNN>-*/`, where
// `sdd archive` moves the change with its interfaces and schemas.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../helpers.ts";

function folderIn(dir: string, nnn: string): string | undefined {
  if (!existsSync(dir)) return undefined;
  const name = readdirSync(dir, { withFileTypes: true }).find((e) => e.isDirectory() && e.name.startsWith(`${nnn}-`))?.name;
  return name === undefined ? undefined : join(dir, name);
}

function checkNnn(nnn: string): void {
  if (!/^\d{3}$/.test(nnn)) throw new Error(`change number must have three digits: ${nnn}`);
}

/** The folder of change `nnn`: the active `.sdd/<NNN>-*`, else the archived `.sdd/_archive/<NNN>-*`. */
export function changeFolder(nnn: string, root: string = repoRoot()): string {
  checkNnn(nnn);
  const sdd = join(root, ".sdd");
  const dir = folderIn(sdd, nnn) ?? folderIn(join(sdd, "_archive"), nnn);
  if (dir === undefined) throw new Error(`change ${nnn} not found: neither ${join(sdd, `${nnn}-*`)} nor ${join(sdd, "_archive", `${nnn}-*`)} exists`);
  return dir;
}

/**
 * A spec file of change `nnn`, `rel` being its path relative to the change folder (`/` separated,
 * for example `10-spec/50-interfaces/errors.md`). Fails naming every path tried when none exists.
 */
export function specFile(nnn: string, rel: string, root: string = repoRoot()): string {
  checkNnn(nnn);
  const sdd = join(root, ".sdd");
  const parts = rel.split("/");
  const active = folderIn(sdd, nnn);
  const archived = folderIn(join(sdd, "_archive"), nnn);
  const candidates = [
    join(active ?? join(sdd, `${nnn}-*`), ...parts),
    join(sdd, "_living", ...parts),
    ...(archived === undefined ? [] : [join(archived, ...parts)]),
  ];
  const hit = candidates.find((p, i) => (i > 0 || active !== undefined) && existsSync(p));
  if (hit === undefined) throw new Error(`spec file ${rel} of change ${nnn} not found: ${candidates.join(", ")} do not exist`);
  return hit;
}
