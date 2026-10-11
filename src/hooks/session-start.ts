// `sdd hook session-start` (C001-REQ-911, C001-REQ-912, C001-IF-07 §4): the SessionStart brief. In a
// repository with `.sdd/`, at most 10 lines: `SDD workspace: <n> active change(s)`, then one line per
// active change (not archived, not stopped) with phase, phase status, task progress and open defects.
// Without `.sdd/`, no output at all.
import { join } from "node:path";
import { normalisePath } from "../io/paths.ts";
import { findWorkspace } from "../workspace/find.ts";
import { rebuildRegistry, type RegistryChange } from "../workspace/status.ts";
import type { HookInput } from "./input.ts";

export const MAX_LINES = 10;

export function changeLine(c: RegistryChange): string {
  const t = c.implementation.tasks;
  const open = c.defects.filter((d) => d["status"] === "open").length;
  return `${c.id} ${c.phase} ${c.phases[c.phase as "10-spec"]?.status ?? "not-started"} · tasks ${t.done}/${t.total} · ${open} open defect${open === 1 ? "" : "s"}`;
}

/** The brief lines, or [] when no workspace is found from `cwd`. */
export function sessionBrief(input: HookInput | null, fallbackCwd: string): string[] {
  const cwd = typeof input?.cwd === "string" && input.cwd !== "" ? input.cwd : fallbackCwd;
  const root = findWorkspace(normalisePath(cwd));
  if (root === null) return [];
  try {
    const active = rebuildRegistry(join(root, ".sdd")).changes.filter((c) => c.status !== "archived" && c.status !== "stopped");
    const head = `SDD workspace: ${active.length} active change(s)`;
    if (active.length < MAX_LINES) return [head, ...active.map(changeLine)];
    const shown = MAX_LINES - 2;
    return [head, ...active.slice(0, shown).map(changeLine), `… ${active.length - shown} more: run sdd status`];
  } catch (e) {
    return [`SDD workspace: status unavailable (${e instanceof Error ? e.message.split("\n")[0] : String(e)}); run sdd status`];
  }
}
