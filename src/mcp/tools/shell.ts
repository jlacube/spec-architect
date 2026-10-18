// The command tool of the `shell` profile (C002-IF-002 §5.2; C002-REQ-405 … C002-REQ-407). Each call is
// (1) validated against its input schema (ERR-MCP-001), (2) decided by the bash guard core of the Claude
// Code hook (C002-CON-06) for an Architect agent with `cwd` = the repository root, in the dialect the
// call names (GUARD-BASH-001, GUARD-BASH-002; a deny starts no process; an exception is ERR-MCP-002),
// then (3) executed without a shell (C002-CON-07): the words of each pipe segment come from the guard
// core's tokeniser, the first segment runs as one child process with `shell: false` (a first word `sdd`
// runs the server's own package CLI, `<package>/scripts/sdd.mjs`, with the Node.js executable that runs
// the server; any other executable is resolved on PATH, and one found only as a `.cmd` or `.bat` shim is
// not run, ERR-MCP-006), and the pipe-only segments (head, tail, wc -l, sort, uniq) are applied to its
// standard output in process. (4) The result holds the exit code and both streams, each cut at
// 1,048,576 characters; at `timeout_ms` the process tree is killed (C002-REQ-406).
import { spawn, type ChildProcess } from "node:child_process";
import { accessSync, constants, existsSync, statSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { decideBash, RULE_ALLOWLIST, RULE_COMPOUND, tokenise, toolOfDialect, type Dialect } from "../../hooks/guard-bash.ts";
import { executableNames, IS_WINDOWS } from "../../io/paths.ts";
import type { ToolContext, ToolHandler } from "../handlers.ts";
import { errorResult } from "../results.ts";
import { AGENT_TYPE } from "./files.ts";

/** Each stream of a result is cut at this many characters (C002-IF-002 §5.2 step 4). */
export const STREAM_CAP = 1_048_576;
/** Bytes of standard output kept for the pipe-only filters; beyond it the output counts as truncated. */
const RAW_CAP = 32 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 120_000;
const WIN = IS_WINDOWS;

function reason(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Test fault: `SDD_TEST_FAULT=mcp-bash-guard-throw` makes the bash guard core throw (ERR-MCP-002). */
function guardFault(): boolean {
  return /(?:^|,)mcp-bash-guard-throw(?:,|$)/.test(process.env["SDD_TEST_FAULT"] ?? "");
}

/** The CLI of the server's own package: `sdd.mjs` beside the server bundle (C002-REQ-407, C002-IF-003). */
export function ownCli(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "sdd.mjs");
}

function env(name: string): string {
  // process.env is case-insensitive on Windows; elsewhere PATH is spelt in capitals.
  return process.env[name] ?? "";
}

function isNativeFile(p: string, checkMode: boolean): boolean {
  try {
    if (!statSync(p).isFile()) return false;
    if (checkMode) accessSync(p, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export type Resolved = { file: string } | { error: "not found on PATH" | "only a .cmd or .bat shim was found" };

/**
 * Resolves an executable name on PATH, without a shell (C002-IF-002 §5.2 step 3): the first native file
 * in PATH order (src/io/paths.ts executableNames). A Windows `.cmd` or `.bat` match needs the command interpreter and
 * is never run; when it is the only match the reason says so (ERR-MCP-006).
 */
export function resolveOnPath(name: string, path = env("PATH")): Resolved {
  const dirs = path.split(delimiter).filter((d) => d !== "");
  const { native, shims, checkMode } = executableNames(name);
  let shim = false;
  for (const dir of dirs) {
    for (const n of native) if (isNativeFile(join(dir, n), checkMode)) return { file: join(dir, n) };
    if (shims.some((n) => existsSync(join(dir, n)))) shim = true;
  }
  return { error: shim ? "only a .cmd or .bat shim was found" : "not found on PATH" };
}

// --- pipe-only filters (C001-IF-07 §3), applied to the standard output line by line ---

function lines(text: string): string[] {
  if (text === "") return [];
  const all = text.split("\n");
  if (all[all.length - 1] === "") all.pop();
  return all;
}

function joinLines(ls: string[]): string {
  return ls.length === 0 ? "" : ls.join("\n") + "\n";
}

/** N of `head`/`tail`: `-n N`, `-N`, `-nN`, or 10 without arguments. */
function count(args: string[]): number {
  if (args.length === 0) return 10;
  if (args.length === 2) return Number(args[1]);
  return Number(args[0]!.replace(/^-n?/, ""));
}

/** The leading number of a line for `sort -n` (no number counts as 0). */
function numericKey(line: string): number {
  const m = /^\s*([+-]?(?:\d+\.?\d*|\.\d+))/.exec(line);
  return m ? Number(m[1]) : 0;
}

function sortLines(ls: string[], flags: string[]): string[] {
  const fold = flags.includes("-f");
  const numeric = flags.includes("-n");
  const key = (s: string) => (fold ? s.toUpperCase() : s);
  const byText = (a: string, b: string) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
  const cmp = numeric ? (a: string, b: string) => numericKey(a) - numericKey(b) || byText(a, b) : byText;
  const sorted = [...ls].sort(cmp);
  if (flags.includes("-r")) sorted.reverse();
  if (!flags.includes("-u")) return sorted;
  const same = numeric ? (a: string, b: string) => numericKey(a) === numericKey(b) : (a: string, b: string) => key(a) === key(b);
  return sorted.filter((s, i) => i === 0 || !same(sorted[i - 1]!, s));
}

function uniqLines(ls: string[], flags: string[]): string[] {
  const groups: { line: string; n: number }[] = [];
  for (const l of ls) {
    const last = groups[groups.length - 1];
    if (last !== undefined && last.line === l) last.n++;
    else groups.push({ line: l, n: 1 });
  }
  const kept = groups.filter((g) => (flags.includes("-d") ? g.n > 1 : true) && (flags.includes("-u") ? g.n === 1 : true));
  return kept.map((g) => (flags.includes("-c") ? `${String(g.n).padStart(7)} ${g.line}` : g.line));
}

/** Applies one pipe-only segment (words as the guard core allowed them) to a text. */
export function applyFilter(text: string, words: string[]): string {
  const [cmd, ...args] = words;
  switch (cmd) {
    case "head":
      return joinLines(lines(text).slice(0, count(args)));
    case "tail": {
      const n = count(args);
      return n === 0 ? "" : joinLines(lines(text).slice(-n));
    }
    case "wc":
      return `${(text.match(/\n/g) ?? []).length}\n`;
    case "sort":
      return joinLines(sortLines(lines(text), args));
    case "uniq":
      return joinLines(uniqLines(lines(text), args));
    default:
      // The guard core admits no other piped segment; refuse to guess.
      throw new Error(`no in-process filter for "${words.join(" ")}"`);
  }
}

// --- execution ---

function cut(s: string): { text: string; truncated: boolean } {
  return s.length > STREAM_CAP ? { text: s.slice(0, STREAM_CAP), truncated: true } : { text: s, truncated: false };
}

/** Kills the child and its descendants: `taskkill /T` on Windows (no shell), the process group elsewhere. */
function killTree(child: ChildProcess): void {
  if (child.pid === undefined) return;
  if (WIN) {
    const k = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { shell: false, windowsHide: true, stdio: "ignore" });
    k.on("error", () => child.kill("SIGKILL"));
    return;
  }
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    child.kill("SIGKILL");
  }
}

interface Run {
  code: number | null;
  timedOut: boolean;
  stdout: Buffer;
  stdoutCut: boolean;
  stderr: Buffer;
  stderrCut: boolean;
}

function collect(stream: NodeJS.ReadableStream, limit: number): { chunks: Buffer[]; size: number; over: boolean } {
  const acc = { chunks: [] as Buffer[], size: 0, over: false };
  stream.on("data", (b: Buffer) => {
    if (acc.size >= limit) {
      acc.over = true;
      return;
    }
    const room = limit - acc.size;
    if (b.length > room) acc.over = true;
    const part = b.length > room ? b.subarray(0, room) : b;
    acc.chunks.push(part);
    acc.size += part.length;
  });
  return acc;
}

function execute(file: string, args: string[], cwd: string, timeoutMs: number): Promise<Run | { spawnError: Error }> {
  return new Promise((resolve) => {
    let child: ChildProcess;
    try {
      child = spawn(file, args, { cwd, shell: false, windowsHide: true, detached: !WIN, stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) {
      resolve({ spawnError: e instanceof Error ? e : new Error(String(e)) });
      return;
    }
    const out = collect(child.stdout!, RAW_CAP);
    // Standard error is not filtered: keep a little more than the cap to know it was cut.
    const err = collect(child.stderr!, STREAM_CAP * 4 + 4);
    let timedOut = false;
    let settled = false;
    const timer = setTimeout(() => {
      timedOut = true;
      killTree(child);
    }, timeoutMs);
    child.on("error", (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ spawnError: e });
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code: timedOut ? null : code, timedOut, stdout: Buffer.concat(out.chunks), stdoutCut: out.over, stderr: Buffer.concat(err.chunks), stderrCut: err.over });
    });
  });
}

function denyCode(message: string): string {
  return message.startsWith(`${RULE_COMPOUND}:`) ? RULE_COMPOUND : RULE_ALLOWLIST;
}

async function run(args: Record<string, unknown>, ctx: ToolContext): Promise<CallToolResult> {
  const problems = ctx.schemas.validateInput("run_command", args);
  if (problems.length > 0) {
    ctx.debug("invalid-arguments", { tool: "run_command", code: "ERR-MCP-001" });
    return errorResult("run_command", "failed", "ERR-MCP-001", `invalid arguments for run_command: ${problems.join("; ")}`);
  }
  const command = args["command"] as string;
  const dialect = (args["dialect"] as Dialect | undefined) ?? "bash";
  const timeoutMs = (args["timeout_ms"] as number | undefined) ?? DEFAULT_TIMEOUT_MS;

  // Step 2: the decision of the hook's guard core; a deny starts no process.
  let decision: ReturnType<typeof decideBash>;
  try {
    if (guardFault()) throw new Error("SDD_TEST_FAULT: bash guard core failure");
    decision = decideBash({ hook_event_name: "PreToolUse", tool_name: toolOfDialect(dialect), tool_input: { command }, cwd: ctx.root, agent_type: AGENT_TYPE });
  } catch (e) {
    ctx.debug("guard-bash", { tool: "run_command", code: "ERR-MCP-002", reason: reason(e) });
    return errorResult("run_command", "failed", "ERR-MCP-002", `internal fault in run_command: the bash guard core failed: ${reason(e)}; the call was refused`);
  }
  if (!decision.allow) {
    const code = denyCode(decision.message);
    ctx.debug("guard-bash", { tool: "run_command", dialect, decision: "deny", code });
    return errorResult("run_command", "refused", code, decision.message);
  }
  ctx.debug("guard-bash", { tool: "run_command", dialect, decision: "allow" });

  // Step 3: the words the guard core decided on, run without a shell.
  const t = tokenise(command.trim(), dialect);
  if ("error" in t) return errorResult("run_command", "failed", "ERR-MCP-002", `internal fault in run_command: ${t.error}; the call was refused`);
  const [first, ...filters] = t.segments;
  const [exe, ...rest] = first!.words;
  let file: string;
  let argv: string[];
  if (exe === "sdd") {
    const cli = ownCli();
    if (!existsSync(cli)) return errorResult("run_command", "failed", "ERR-MCP-006", `could not start "sdd": not found beside the server (${cli})`);
    file = process.execPath;
    argv = [cli, ...rest];
  } else {
    const r = resolveOnPath(exe!);
    if ("error" in r) {
      ctx.debug("resolve", { tool: "run_command", exe, code: "ERR-MCP-006", reason: r.error });
      return errorResult("run_command", "failed", "ERR-MCP-006", `could not start "${exe}": ${r.error}`);
    }
    file = r.file;
    argv = rest;
  }
  const started = Date.now();
  const r = await execute(file, argv, ctx.root, timeoutMs);
  const duration = Date.now() - started;
  if ("spawnError" in r) {
    ctx.debug("spawn-failed", { tool: "run_command", exe, code: "ERR-MCP-006", reason: r.spawnError.message });
    return errorResult("run_command", "failed", "ERR-MCP-006", `could not start "${exe}": ${r.spawnError.message}`);
  }
  let stdoutText = r.stdout.toString("utf8");
  for (const f of filters) stdoutText = applyFilter(stdoutText, f.words);
  const stdout = cut(stdoutText);
  const stderr = cut(r.stderr.toString("utf8"));
  const truncated = { stdout: stdout.truncated || r.stdoutCut, stderr: stderr.truncated || r.stderrCut };
  const status = r.timedOut ? "timed_out" : "completed";
  ctx.debug("run_command", { exe, status, exit_code: r.code, duration_ms: duration });
  const head = r.timedOut ? `timed out after ${timeoutMs} ms` : `exit ${r.code}`;
  const text = `${head}\n--- stdout ---\n${stdout.text}\n--- stderr ---\n${stderr.text}`;
  return {
    content: [{ type: "text", text }],
    structuredContent: { status, tool: "run_command", exit_code: r.code, stdout: stdout.text, stderr: stderr.text, truncated, duration_ms: duration },
  };
}

/** `run_command`; any unexpected exception is ERR-MCP-002 (C002-CON-08). */
export const runCommand: ToolHandler = async (args, ctx) => {
  try {
    return await run(args, ctx);
  } catch (e) {
    ctx.debug("internal-fault", { tool: "run_command", code: "ERR-MCP-002", reason: reason(e) });
    return errorResult("run_command", "failed", "ERR-MCP-002", `internal fault in run_command: ${reason(e)}; the call was refused`);
  }
};
