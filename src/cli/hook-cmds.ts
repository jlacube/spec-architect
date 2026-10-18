// Hook entry points of the sdd CLI shared by Claude Code and the Copilot target package (C001-IF-07 §2,
// C002-IF-007, C002-IF-008 §2–§4): `hook session-start [--host]`, `hook guard --host copilot` and
// `hook subagent-stop --host copilot`, plus the active-change trace refresh behind `trace --active`.
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { decideCopilot, denyDecision, agentList, agentName } from "../hooks/copilot.ts";
import { parseHookInput } from "../hooks/input.ts";
import { sessionBrief } from "../hooks/session-start.ts";
import { trace } from "../trace/write.ts";
import { findWorkspace } from "../workspace/find.ts";
import { listChanges, rebuildRegistry } from "../workspace/status.ts";
import { normalisePath } from "../io/paths.ts";
import type { CommandContext, CommandSpec } from "./commands.ts";
import { CliError } from "./errors.ts";
import type { Output } from "./output.ts";

const S = { type: "string" } as const;

/** `sdd hook guard`'s default tool classes file: `hooks/tool-classes.json` of the package holding the running CLI. */
export function defaultClassesFile(cliFile: string = fileURLToPath(import.meta.url)): string {
  return join(dirname(cliFile), "..", "hooks", "tool-classes.json");
}

/**
 * Traces every active change (not archived, not stopped) of the workspace found from `cwd`, writing
 * when `write` is set (`trace --active`, the SubagentStop hooks). Never throws; does nothing outside a
 * workspace.
 */
export function traceActiveChanges(ctx: CommandContext, cwd: string, write: boolean): void {
  try {
    const root = findWorkspace(cwd);
    if (root === null) return;
    const sdd = join(root, ".sdd");
    const registry = rebuildRegistry(sdd);
    listChanges(sdd).forEach((c, i) => {
      const status = registry.changes[i]?.status;
      if (c.archived || status === "stopped" || status === "archived") return;
      const r = trace(c.dir, { write });
      if (!ctx.values["quiet"]) ctx.out.line(`${registry.changes[i]!.id}: open items ${r.markers.length}${r.written.length > 0 ? `, written ${r.written.length} file(s)` : ""}`);
    });
  } catch (e) {
    ctx.out.trace("trace.active.error", { detail: e instanceof Error ? e.message : String(e) });
  }
}

/** SessionStart hook (C001-REQ-911, 912; C002-REQ-313, 314 with `--host copilot`): the brief, nothing without .sdd/. Always exit 0. */
function hookSessionStart(ctx: CommandContext): number {
  for (const line of sessionBrief(parseHookInput(ctx.stdin()), ctx.cwd)) ctx.out.line(line);
  return 0;
}

/** Writes a deny of `hook guard`: the decision on standard output, the message on standard error, exit 2. */
function guardDeny(out: Output, message: string): number {
  out.line(denyDecision(message));
  out.errorLine(message);
  return 2;
}

/**
 * `sdd hook guard --host copilot --mode <mode> --agents <list> [--classes <file>]` (C002-IF-007,
 * C002-IF-008 §2): allow is exit 0 with nothing on either stream; every deny and fault is exit 2 with
 * the deny decision on standard output (C002-NFR-204).
 */
function hookGuard(ctx: CommandContext): number {
  const host = ctx.values["host"] as string | undefined;
  const classes = ctx.values["classes"] as string | undefined;
  const d =
    host !== "copilot"
      ? ({ allow: false, message: "GUARD-HOOK-001: tool call denied — hook command usage: --host." } as const)
      : decideCopilot(ctx.stdin(), {
          mode: ctx.values["mode"] as string | undefined,
          agents: ctx.values["agents"] as string | undefined,
          classesFile: classes !== undefined ? resolve(ctx.cwd, classes) : defaultClassesFile(),
          env: ctx.env,
        });
  ctx.out.trace("hook.guard", { decision: d.allow ? "allow" : "deny" });
  return d.allow ? 0 : guardDeny(ctx.out, d.message);
}

/**
 * A fault of `hook guard` outside its decision, option parsing included: a GUARD-HOOK-001 deny with
 * exit 2, never a usage error (C002-IF-007 exit codes, C002-CON-08).
 */
function hookGuardFault(e: unknown, out: Output): number {
  const fault =
    e instanceof CliError && e.code === "ERR-CLI-003"
      ? `hook command usage: ${String(e.params["detail"] ?? e.message)}`
      : `internal error: ${e instanceof Error ? e.message : String(e)}`;
  return guardDeny(out, `GUARD-HOOK-001: tool call denied — ${fault}.`);
}

/**
 * `sdd hook subagent-stop --host copilot --agents <list>` (C002-REQ-315): when the input's `agent_type`,
 * with any `architect:` prefix removed, is in the list, `trace --quiet --write --active` from the input's
 * `cwd`. Always exit 0, also when the trace fails.
 */
function hookSubagentStop(ctx: CommandContext): number {
  try {
    const input = parseHookInput(ctx.stdin());
    const at = input?.agent_type;
    if (typeof at !== "string" || !agentList(ctx.values["agents"] as string | undefined).includes(agentName(at))) return 0;
    const cwd = typeof input?.cwd === "string" && input.cwd !== "" ? normalisePath(input.cwd) : ctx.cwd;
    traceActiveChanges({ ...ctx, values: { ...ctx.values, quiet: true } }, cwd, true);
  } catch (e) {
    ctx.out.trace("hook.subagent-stop.error", { detail: e instanceof Error ? e.message : String(e) });
  }
  return 0;
}

export const HOSTS_SESSION = ["claude-code", "copilot"] as const;

const AGENTS = "sdd-conductor,sdd-planner";

export const HOOK_ROWS: readonly Omit<CommandSpec, "writes">[] = [
  { name: "hook session-start", usage: "[--host claude-code|copilot] (hook JSON on stdin)", summary: "Print the session brief", positionals: [], options: { host: S }, workspace: false, sampleArgs: ["--host", "copilot"], run: hookSessionStart },
  {
    name: "hook guard",
    usage: "--host copilot --mode sdd-mcp-server|copilot-hooks --agents <agent>[,<agent>…] [--classes <tool-classes.json>] (hook JSON on stdin)",
    summary: "Allow/deny a Copilot tool call (hook)",
    positionals: [],
    options: { host: S, mode: S, agents: S, classes: S },
    workspace: false,
    sampleArgs: ["--host", "copilot", "--mode", "sdd-mcp-server", "--agents", AGENTS],
    run: hookGuard,
    onFault: hookGuardFault,
  },
  {
    name: "hook subagent-stop",
    usage: "--host copilot --agents <agent>[,<agent>…] (hook JSON on stdin)",
    summary: "Refresh the trace after an author agent (hook)",
    positionals: [],
    options: { host: S, agents: S },
    workspace: false,
    sampleArgs: ["--host", "copilot", "--agents", AGENTS],
    run: hookSubagentStop,
    onFault: () => 0,
  },
];
