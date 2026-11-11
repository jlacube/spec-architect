// `sdd hook session-start` (C001-REQ-911, C001-REQ-912, C001-IF-07 §4): the SessionStart brief. In a
// repository with `.sdd/`, at most 10 lines: `SDD workspace: <n> active change(s)`, then one line per
// active change (not archived, not stopped) with phase, phase status, task progress and open defects.
// Without `.sdd/`, no output at all. Under `--host copilot` (C002-REQ-313, C002-IF-008 §3, defect D-053) the
// same lines go out as one JSON object `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":…}}`,
// the only form GitHub Copilot Chat 0.73.0 adds to the session.
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

/**
 * The standard output lines of `hook session-start` for a host: the brief lines as they are (Claude Code,
 * no `--host`), or under `copilot` one line holding the JSON object of C002-IF-008 §3, the brief lines
 * joined by line feeds in `additionalContext`. No brief lines (no workspace): no output in either form.
 */
export function sessionStartOutput(lines: readonly string[], host: string | undefined): string[] {
  if (lines.length === 0) return [];
  if (host !== "copilot") return [...lines];
  return [JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: lines.join("\n") } })];
}
