// `sdd hook guard --host copilot --mode <mode> --agents <list> [--classes <file>]` (C002-IF-007,
// C002-IF-008 §2): the one PreToolUse hook command of the Copilot target package, in both enforcement
// modes. It reads the caller from the input's `agent_type` and decides by the eight rules of the
// decision order of C002-IF-008 §2:
//   1  `--mode` missing or unknown, `--agents` missing or empty        → GUARD-HOOK-001
//   2  input empty, not JSON or not a JSON object                       → GUARD-HOOK-001
//   3  no `agent_type` key (the session agent)                          → allow, nothing read
//   4  Architect agent, `--mode sdd-mcp-server`                         → allow, nothing read
//   5  Architect agent, `--mode copilot-hooks`                          → rules 7 and 8
//   6  non-Architect subagent, both modes: `.sdd/` found from `cwd` → by tool class (write/terminal
//      GUARD-HOOK-002, read_only allow, unclassed GUARD-HOOK-001); no `.sdd/` → allow, classes not read
//   7  Architect agent under the fallback without `cwd` or `tool_name`, unreadable classes → GUARD-HOOK-001
//   8  otherwise the path or bash guard core decides by class, memory folder off (C002-IF-008 §5)
// Every exception becomes a GUARD-HOOK-001 deny (C002-CON-08). Tool names and input fields come from
// the tool classes file, not from code (C002-REQ-318).
import { readFileSync } from "node:fs";
import { normalisePath } from "../io/paths.ts";
import { findWorkspace } from "../workspace/find.ts";
import { decideBash, toolOfDialect, type Dialect } from "./guard-bash.ts";
import { decidePath, deny as denyPath } from "./guard-path.ts";
import { isArchitectAgent, type HookInput } from "./input.ts";

export const RULE_FAULT = "GUARD-HOOK-001";
export const RULE_SUBAGENT = "GUARD-HOOK-002";
export const MODES = ["sdd-mcp-server", "copilot-hooks"] as const;
export type Mode = (typeof MODES)[number];

export type CopilotDecision = { allow: true } | { allow: false; message: string };

export interface CopilotGuardOptions {
  /** `--mode` as given (undefined when missing). */
  mode: string | undefined;
  /** `--agents` as given (undefined when missing). */
  agents: string | undefined;
  /** The tool classes file (`--classes`, else `<cli folder>/../hooks/tool-classes.json`). */
  classesFile: string;
  /** Environment of the invocation, read for the test faults only. */
  env?: Readonly<Record<string, string | undefined>>;
}

interface WriteClass {
  tool: string;
  paths: string[];
  always_deny?: boolean;
}
interface TerminalClass {
  tool: string;
  command: string;
  dialect?: "bash" | "powershell" | "strictest";
}
export interface ToolClasses {
  write: WriteClass[];
  terminal: TerminalClass[];
  read_only: string[];
}

class Fault extends Error {}

/** Test faults (C002-TS-362 fault-injection rows): `SDD_TEST_FAULT=hook-lookup-throw` / `hook-decision-throw`. */
function fault(env: CopilotGuardOptions["env"], name: string): boolean {
  return new RegExp(`(?:^|,)${name}(?:,|$)`).test(env?.["SDD_TEST_FAULT"] ?? "");
}

function hookDeny(rule: string, tool: string, text: string): CopilotDecision {
  return { allow: false, message: `${rule}: ${tool} denied — ${text}.` };
}

/** The input's `agent_type` with one `architect:` prefix removed (VS Code `sdd-x`, Copilot CLI `architect:sdd-x`). */
export function agentName(agentType: string): string {
  return agentType.startsWith("architect:") ? agentType.slice("architect:".length) : agentType;
}

/** The `--agents` list; empty when missing or blank. */
export function agentList(agents: string | undefined): string[] {
  return (agents ?? "").split(",").map((a) => a.trim()).filter((a) => a !== "");
}

/** Reads and checks the tool classes file (`hook_tool_classes` of C002-IF-001); throws a Fault with the detail. */
export function readToolClasses(file: string): ToolClasses {
  let doc: unknown;
  try {
    doc = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    throw new Fault(e instanceof Error ? e.message : String(e));
  }
  const bad = (what: string) => new Fault(`${file}: ${what}`);
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) throw bad("not a JSON object");
  const d = doc as Record<string, unknown>;
  const list = (k: string): unknown[] => {
    if (!Array.isArray(d[k])) throw bad(`"${k}" is not an array`);
    return d[k] as unknown[];
  };
  const str = (v: unknown) => typeof v === "string" && v !== "";
  const pointer = (v: unknown) => typeof v === "string" && v.startsWith("/");
  const write = list("write").map((e, i) => {
    const o = (e ?? {}) as Record<string, unknown>;
    if (!str(o["tool"]) || !Array.isArray(o["paths"]) || o["paths"].length === 0 || !o["paths"].every(pointer)) throw bad(`write[${i}] needs "tool" and JSON pointers in "paths"`);
    if (o["always_deny"] !== undefined && typeof o["always_deny"] !== "boolean") throw bad(`write[${i}].always_deny is not a boolean`);
    return o as unknown as WriteClass;
  });
  const terminal = list("terminal").map((e, i) => {
    const o = (e ?? {}) as Record<string, unknown>;
    if (!str(o["tool"]) || !pointer(o["command"])) throw bad(`terminal[${i}] needs "tool" and a JSON pointer in "command"`);
    if (o["dialect"] !== undefined && !["bash", "powershell", "strictest"].includes(o["dialect"] as string)) throw bad(`terminal[${i}].dialect is not bash, powershell or strictest`);
    return o as unknown as TerminalClass;
  });
  const readOnly = list("read_only");
  if (!readOnly.every(str)) throw bad(`"read_only" holds a value that is not a tool name`);
  return { write, terminal, read_only: readOnly as string[] };
}

/** Every string at a JSON pointer (RFC 6901) into `doc`; a `*` segment walks every element of an array. */
export function stringsAt(doc: unknown, ptr: string): string[] {
  const segments = ptr.split("/").slice(1).map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));
  let nodes: unknown[] = [doc];
  for (const s of segments) {
    const next: unknown[] = [];
    for (const n of nodes) {
      if (s === "*" && Array.isArray(n)) next.push(...n);
      else if (Array.isArray(n) && /^(0|[1-9]\d*)$/.test(s)) next.push(n[Number(s)]);
      else if (n !== null && typeof n === "object" && !Array.isArray(n) && Object.prototype.hasOwnProperty.call(n, s)) next.push((n as Record<string, unknown>)[s]);
    }
    nodes = next;
  }
  return nodes.filter((n): n is string => typeof n === "string");
}

type ClassOf = { kind: "write"; entry: WriteClass } | { kind: "terminal"; entry: TerminalClass } | { kind: "read_only" } | null;

/** The class of a hook tool name, compared exactly (letter case included); the most restrictive class first. */
function classOf(classes: ToolClasses, tool: string): ClassOf {
  const w = classes.write.find((e) => e.tool === tool);
  if (w) return { kind: "write", entry: w };
  const t = classes.terminal.find((e) => e.tool === tool);
  if (t) return { kind: "terminal", entry: t };
  return classes.read_only.includes(tool) ? { kind: "read_only" } : null;
}

function loadClasses(file: string, tool: string): ToolClasses | CopilotDecision {
  try {
    return readToolClasses(file);
  } catch (e) {
    return hookDeny(RULE_FAULT, tool, `tool classes file unreadable: ${e instanceof Error ? e.message : String(e)}`);
  }
}

const isDecision = (x: ToolClasses | CopilotDecision): x is CopilotDecision => "allow" in x;

/** Rule 6: a non-Architect subagent's call, in both modes (C002-REQ-327 … C002-REQ-329). */
function decideSubagent(input: Record<string, unknown>, tool: string, opts: CopilotGuardOptions): CopilotDecision {
  const cwd = input["cwd"];
  if (typeof cwd !== "string" || cwd === "") return hookDeny(RULE_FAULT, tool, "no cwd");
  let root: string | null;
  try {
    if (fault(opts.env, "hook-lookup-throw")) throw new Error("SDD_TEST_FAULT: workspace lookup failure");
    root = findWorkspace(normalisePath(cwd));
  } catch (e) {
    return hookDeny(RULE_FAULT, tool, `workspace lookup failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (root === null) return { allow: true };
  const name = input["tool_name"];
  if (typeof name !== "string" || name === "") return hookDeny(RULE_FAULT, tool, "no tool name");
  const classes = loadClasses(opts.classesFile, name);
  if (isDecision(classes)) return classes;
  const c = classOf(classes, name);
  if (c === null) return hookDeny(RULE_FAULT, name, `tool ${name} is not in the tool classes`);
  if (c.kind === "read_only") return { allow: true };
  const at = input["agent_type"];
  const shown = typeof at === "string" ? at : JSON.stringify(at);
  return { allow: false, message: `${RULE_SUBAGENT}: ${name} denied — subagent ${shown} is not an Architect agent, and this repository contains .sdd/. Allowed: read-only tools.` };
}

/** Rules 7 and 8: an Architect agent's call under the Copilot hooks fallback (C002-REQ-308, C002-REQ-309, C002-REQ-319). */
function decideArchitect(input: Record<string, unknown>, agent: string, tool: string, opts: CopilotGuardOptions): CopilotDecision {
  const cwd = input["cwd"];
  if (typeof cwd !== "string" || cwd === "") return hookDeny(RULE_FAULT, tool, "no cwd");
  const name = input["tool_name"];
  if (typeof name !== "string" || name === "") return hookDeny(RULE_FAULT, tool, "no tool name");
  const classes = loadClasses(opts.classesFile, name);
  if (isDecision(classes)) return classes;
  const c = classOf(classes, name);
  if (c === null) return hookDeny(RULE_FAULT, name, `tool ${name} is not in the tool classes`);
  if (c.kind === "read_only") return { allow: true };
  // The guard core input of C001-IF-07 §1 (C002-IF-008 §2 rule 8).
  const agentType = `architect:${agent}`;
  const core: HookInput = { hook_event_name: "PreToolUse", cwd, agent_type: agentType };
  // The cores guard `architect:sdd-*` callers only; any other name in --agents would pass them unchecked.
  if (!isArchitectAgent(core)) return hookDeny(RULE_FAULT, name, `internal error: agent ${agent} of --agents is not an sdd- agent name`);
  const toolInput = input["tool_input"];
  if (c.kind === "write") {
    if (c.entry.always_deny === true) {
      const repo = normalisePath(findWorkspace(normalisePath(cwd)) ?? cwd);
      return denyPath(name, "(unknown target)", "its targets cannot be read from its input", [normalisePath(".sdd", { cwd: repo })], false);
    }
    const paths = c.entry.paths.flatMap((p) => stringsAt(toolInput, p));
    if (paths.length === 0) return hookDeny(RULE_FAULT, name, `no path in the tool input (${c.entry.paths.join(", ")})`);
    for (const p of paths) {
      const d = decidePath({ ...core, tool_name: "Write", tool_input: { file_path: p } }, { memoryFolder: false });
      if (!d.allow) return d;
    }
    return { allow: true };
  }
  const command = stringsAt(toolInput, c.entry.command)[0] ?? "";
  const dialect = c.entry.dialect ?? "strictest";
  const dialects: Dialect[] = dialect === "strictest" ? ["bash", "powershell"] : [dialect];
  for (const d of dialects) {
    const r = decideBash({ ...core, tool_name: toolOfDialect(d), tool_input: { command } });
    if (!r.allow) return r;
  }
  return { allow: true };
}

/** Standard input as a JSON object; null when it is empty, not JSON or not a JSON object. */
function parseObject(stdin: string): Record<string, unknown> | null {
  try {
    const doc: unknown = JSON.parse(stdin);
    return doc !== null && typeof doc === "object" && !Array.isArray(doc) ? (doc as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** `<tool or "tool call">` of GUARD-HOOK-001 (errors.md §6): the input's `tool_name` when it is a non-empty string of a JSON object, else `tool call`. */
export function shownTool(input: string | Record<string, unknown> | null): string {
  const doc = typeof input === "string" ? parseObject(input) : input;
  const name = doc?.["tool_name"];
  return typeof name === "string" && name !== "" ? name : "tool call";
}

/** The decision of `hook guard --host copilot` on its standard input (C002-IF-008 §2). Never throws. */
export function decideCopilot(stdin: string, opts: CopilotGuardOptions): CopilotDecision {
  let tool = "tool call";
  try {
    const doc = parseObject(stdin);
    tool = shownTool(doc);
    // Rule 1: the command's own arguments, whatever the input.
    if (opts.mode === undefined || !(MODES as readonly string[]).includes(opts.mode)) return hookDeny(RULE_FAULT, tool, "hook command usage: --mode");
    if (agentList(opts.agents).length === 0) return hookDeny(RULE_FAULT, tool, "hook command usage: --agents");
    // Rule 2: unreadable input; no identity can be read.
    if (doc === null) return hookDeny(RULE_FAULT, tool, "unreadable hook input");
    const input = doc;
    // Rule 3: the session agent's calls carry no `agent_type` (S-08 §2.3).
    if (!Object.prototype.hasOwnProperty.call(input, "agent_type")) return { allow: true };
    if (fault(opts.env, "hook-decision-throw")) throw new Error("SDD_TEST_FAULT: decision failure");
    const at = input["agent_type"];
    const agents = agentList(opts.agents);
    const architect = typeof at === "string" && agents.includes(agentName(at)) ? agentName(at) : null;
    // Rules 4 and 5.
    if (architect !== null) return opts.mode === "sdd-mcp-server" ? { allow: true } : decideArchitect(input, architect, tool, opts);
    // Rule 6.
    return decideSubagent(input, tool, opts);
  } catch (e) {
    return hookDeny(RULE_FAULT, tool, `internal error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * The deny decision of C002-IF-008 §2 on standard output, in both forms the S-08 probe wrote. Written
 * with exit 2 only, never with exit 0 (C002-NFR-204).
 */
export function denyDecision(message: string): string {
  return JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: message },
    permissionDecision: "deny",
    permissionDecisionReason: message,
  });
}
