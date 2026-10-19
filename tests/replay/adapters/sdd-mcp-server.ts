// Replay adapter of the mechanism `sdd-mcp-server` (C002-T-041, C002-IF-009 §2): every case is decided
// by the sdd MCP server of the packed `architect-sdd` tarball (C002-IF-002), host-independent. The
// adapter installs the tarball (default `dist/architect-sdd-<version>.tgz` of `npm run package`;
// SDD_REPLAY_TGZ overrides it) offline into a clean prefix in its run folder, starts the installed
// `scripts/sdd-mcp.mjs` with the replay fixture's `{repo}` as working folder (no `--root`, no client
// roots: the server takes the working folder, C002-IF-002 §3), one session per profile (`files`,
// `shell`) and per environment stub of a case (the stub is the guard's environment, so a case that
// stubs one gets a session of its own), and feeds each case as the tool call of §2.2:
//
//   Write, NotebookEdit (no tool name)  write_file   { path: <path joined to the case's cwd>, content }
//   Edit, MultiEdit                     replace_text { path, old_text: the file's first line, new_text }
//   Bash (path corpus)                  run_command  { command: "git status -- <path>", dialect: "bash" }
//   Bash / PowerShell (shell corpus)    run_command  { command, dialect: "bash" | "powershell" }
//   Read, Glob, Grep                    not sent: allow when the package grants the agent the mapped tool
//   raw stdin, C002-REQ-630 case        the tool of the case with {} as arguments
//
// A shell-corpus case of a write tool (BG-268) is fed as write_file with its command text as the path,
// as the OpenCode adapter feeds it. The decision is read per §2.3: deny on GUARD-PATH-001,
// GUARD-BASH-001, GUARD-BASH-002 or ERR-MCP-001; allow on success, `completed`, `timed_out` or a
// refusal after the boundary allowed the call (ERR-MCP-004 … ERR-MCP-006); error on ERR-MCP-002,
// ERR-MCP-003, a JSON-RPC error or no response. Allowed commands run for real inside the replay
// fixture, in the sandbox of ./package.ts (inert stubs on PATH, per-user data folders in the run folder).
import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Mode } from "../../../scripts/generate/tables.ts";
import { npmCli } from "../../../scripts/package.mjs";
import { repoRoot } from "../../helpers.ts";
import { type Actual, type AdapterDecision, joinedPath, type ReplayAdapter, type ReplayFixture, type ReplayInput, type Target } from "../adapter.ts";
import { sourceVersion } from "../report.ts";
import { clip, createSandbox, firstLine, generatedPackage, type Grants, packageGrants, type Sandbox } from "./package.ts";

const WIN = process.platform === "win32";
const MODE: Mode = "sdd-mcp-server";
/** Per-call limit; a call without a response by then has no decision (`error`, §2.3). */
const CALL_TIMEOUT_MS = 150_000;

type Profile = "files" | "shell";
type ServerTool = "write_file" | "replace_text" | "run_command";
const PROFILE: Record<ServerTool, Profile> = { write_file: "files", replace_text: "files", run_command: "shell" };

export interface McpServerAdapterOptions {
  /** Target package whose grants decide the Read/Glob/Grep row and the playing agent (default copilot). */
  target?: Target;
  /** The packed tarball to install (default SDD_REPLAY_TGZ, else dist/architect-sdd-<version>.tgz). */
  tgz?: string;
  /** A server entry to run instead of installing a tarball (`sdd.mjs` beside it; unit tests). */
  serverEntry?: string;
}

interface RpcMessage {
  id?: number | string | null;
  result?: { content?: { type: string; text?: string }[]; structuredContent?: Record<string, unknown>; isError?: boolean };
  error?: { code: number; message: string };
}

/** One server process speaking newline-delimited JSON-RPC over its standard input and output. */
class Session {
  private nextId = 1;
  private pending = new Map<number, (m: RpcMessage) => void>();
  private buffer = "";
  stderr = "";
  exited = false;

  private constructor(private readonly child: ChildProcess) {
    child.stdout!.setEncoding("utf8");
    child.stderr!.setEncoding("utf8");
    child.stdout!.on("data", (s: string) => {
      this.buffer += s;
      for (let i = this.buffer.indexOf("\n"); i >= 0; i = this.buffer.indexOf("\n")) {
        const line = this.buffer.slice(0, i);
        this.buffer = this.buffer.slice(i + 1);
        let m: RpcMessage;
        try {
          m = JSON.parse(line) as RpcMessage;
        } catch {
          continue;
        }
        if (typeof m.id === "number") {
          const w = this.pending.get(m.id);
          this.pending.delete(m.id);
          w?.(m);
        }
      }
    });
    child.stderr!.on("data", (s: string) => {
      this.stderr = (this.stderr + s).slice(-4000);
    });
    child.on("exit", () => {
      this.exited = true;
      for (const w of this.pending.values()) w({ error: { code: -1, message: `server exited; stderr: ${this.stderr.trim()}` } });
      this.pending.clear();
    });
    child.stdin!.on("error", () => {});
  }

  static async start(entry: string, profile: Profile, cwd: string, env: Record<string, string>): Promise<Session> {
    const s = new Session(spawn(process.execPath, [entry, "--profile", profile], { cwd, env, stdio: ["pipe", "pipe", "pipe"], windowsHide: true }));
    const init = await s.request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "sdd-replay", version: sourceVersion() } }, 30_000);
    if (!init.result) throw new Error(`sdd-mcp --profile ${profile}: initialize failed: ${JSON.stringify(init.error ?? init)}; stderr: ${s.stderr.trim()}`);
    s.child.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
    return s;
  }

  request(method: string, params: Record<string, unknown>, timeoutMs = CALL_TIMEOUT_MS): Promise<RpcMessage> {
    if (this.exited) return Promise.resolve({ error: { code: -1, message: `server exited; stderr: ${this.stderr.trim()}` } });
    const id = this.nextId++;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        resolve({ error: { code: -2, message: `no response within ${timeoutMs} ms` } });
      }, timeoutMs);
      this.pending.set(id, (m) => {
        clearTimeout(timer);
        resolve(m);
      });
      this.child.stdin!.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  }

  async close(): Promise<void> {
    if (this.exited) return;
    const done = new Promise<void>((resolve) => this.child.once("exit", () => resolve()));
    this.child.stdin!.end();
    const timer = setTimeout(() => this.child.kill(), 10_000);
    await done;
    clearTimeout(timer);
  }

  kill(): void {
    if (!this.exited) this.child.kill();
  }
}

/** The tool call of a case (§2.2), or the local grant decision of the Read/Glob/Grep row. */
export type ServerCall = { tool: ServerTool; args: Record<string, unknown> } | { local: string };

/** The server tool of a corpus tool for the malformed rows (§2.2 last two rows). */
function malformedTool(input: ReplayInput): ServerTool {
  if (input.corpus === "shell" || input.tool === "Bash" || input.tool === "PowerShell") return "run_command";
  if (input.tool === "Edit" || input.tool === "MultiEdit") return "replace_text";
  return "write_file";
}

function writeArgs(path: unknown, id: string): Record<string, unknown> {
  return path === undefined || path === null ? { content: `replay ${id}\n` } : { path, content: `replay ${id}\n` };
}

function replaceArgs(path: unknown, id: string): Record<string, unknown> {
  const first = firstLine(path);
  const args: Record<string, unknown> = { old_text: first !== null && first !== "" ? first : "x", new_text: `replay ${id}` };
  if (path !== undefined && path !== null) args["path"] = path;
  return args;
}

/** The call of one replayed case (C002-IF-009 §2.2). */
export function serverCallOf(input: ReplayInput): ServerCall {
  if (input.malformed !== false) return { tool: malformedTool(input), args: {} };
  const tool = input.tool;
  if (tool === "Read" || tool === "Glob" || tool === "Grep") return { local: tool };
  if (input.corpus === "shell") {
    if (tool === "Bash" || tool === "PowerShell") return { tool: "run_command", args: { command: input.command, dialect: input.dialect } };
    if (tool === "Edit" || tool === "MultiEdit") return { tool: "replace_text", args: replaceArgs(input.command, input.id) };
    return { tool: "write_file", args: writeArgs(input.command, input.id) };
  }
  const path = joinedPath(input);
  if (tool === "Bash") return { tool: "run_command", args: { command: `git status -- ${typeof path === "string" ? path : String(path)}`, dialect: "bash" } };
  if (tool === "Edit" || tool === "MultiEdit") return { tool: "replace_text", args: replaceArgs(path, input.id) };
  return { tool: "write_file", args: writeArgs(path, input.id) };
}

const DENY = new Set(["GUARD-PATH-001", "GUARD-BASH-001", "GUARD-BASH-002", "ERR-MCP-001"]);
const ALLOWED_REFUSAL = new Set(["ERR-MCP-004", "ERR-MCP-005", "ERR-MCP-006"]);

/** The decision of one tool call from the server's response (C002-IF-009 §2.3). */
export function readServerDecision(m: RpcMessage): { actual: Actual; detail: string } {
  if (m.error) return { actual: "error", detail: clip(`no decision: JSON-RPC error ${m.error.code}: ${m.error.message}`) };
  const r = m.result;
  if (!r) return { actual: "error", detail: "no decision: a response without result" };
  const sc = r.structuredContent ?? {};
  const text = r.content?.[0]?.text ?? "";
  const code = typeof sc["code"] === "string" ? sc["code"] : undefined;
  if (r.isError === true) {
    if (code !== undefined && DENY.has(code)) return { actual: "deny", detail: clip(text || code) };
    if (code !== undefined && ALLOWED_REFUSAL.has(code)) return { actual: "allow", detail: clip(`${code} after the boundary allowed the call: ${text}`) };
    return { actual: "error", detail: clip(`no decision: ${code ?? "error result without a code"}: ${text}`) };
  }
  return { actual: "allow", detail: clip(text) };
}

/** Installs the tarball into `<runDir>/prefix` with npm offline; returns the installed `scripts/sdd-mcp.mjs`. */
function installTarball(tgz: string, sandbox: Sandbox): string {
  if (!existsSync(tgz)) throw new Error(`${tgz} not found: run \`npm run package\` first (or set SDD_REPLAY_TGZ)`);
  const prefix = join(sandbox.runDir, "prefix");
  mkdirSync(prefix, { recursive: true });
  const rc = join(sandbox.runDir, "npmrc");
  writeFileSync(rc, "");
  execFileSync(
    process.execPath,
    [npmCli(), "install", "--global", tgz, "--prefix", prefix, "--cache", join(sandbox.runDir, "npm-cache"), "--userconfig", rc, "--offline", "--no-audit", "--no-fund", "--no-update-notifier", "--loglevel", "error"],
    { cwd: sandbox.runDir, stdio: ["ignore", "ignore", "pipe"], env: sandbox.env() },
  );
  const pkgDir = WIN ? join(prefix, "node_modules", "architect-sdd") : join(prefix, "lib", "node_modules", "architect-sdd");
  const entry = join(pkgDir, "scripts", "sdd-mcp.mjs");
  if (!existsSync(entry) || !existsSync(join(pkgDir, "scripts", "sdd.mjs"))) throw new Error(`the install of ${tgz} holds no scripts/sdd-mcp.mjs with scripts/sdd.mjs`);
  const installed = (JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")) as { version: string }).version;
  if (installed !== sourceVersion()) console.log(`sdd-mcp-server: the tarball holds architect-sdd ${installed}, the source plugin is ${sourceVersion()}`);
  return entry;
}

export interface McpServerAdapter extends ReplayAdapter {
  /** Every call sent, in order. */
  readonly calls: { id: string; profile: Profile | null; tool: string; args: unknown }[];
}

export function createMcpServerAdapter(opts: McpServerAdapterOptions = {}): McpServerAdapter {
  const target: Target = opts.target ?? "copilot";
  const calls: McpServerAdapter["calls"] = [];
  const sessions = new Map<string, Session>();
  let sandbox: Sandbox | undefined;
  let fixture: ReplayFixture | undefined;
  let entry: string | undefined;
  let grants: Grants = () => true;

  async function session(profile: Profile, stub: Record<string, string | null> | undefined): Promise<Session> {
    const key = `${profile}|${JSON.stringify(stub ?? {})}`;
    const open = sessions.get(key);
    if (open && !open.exited) return open;
    const s = await Session.start(entry!, profile, fixture!.repo, sandbox!.env(stub));
    sessions.set(key, s);
    return s;
  }

  return {
    mechanism: "sdd-mcp-server",
    target,
    name: "sdd-mcp-server",
    calls,
    grants: (agent, corpusTool) => grants(agent, corpusTool),
    async setup(fx) {
      fixture = fx;
      calls.length = 0;
      sandbox = createSandbox("sdd-mcp-run-");
      try {
        grants = packageGrants(target, MODE, generatedPackage(target, MODE));
        entry = opts.serverEntry ?? installTarball(opts.tgz ?? process.env["SDD_REPLAY_TGZ"] ?? join(repoRoot(), "dist", `architect-sdd-${sourceVersion()}.tgz`), sandbox);
      } catch (e) {
        await this.teardown();
        throw e;
      }
    },
    async decide(input: ReplayInput): Promise<AdapterDecision> {
      if (!fixture || !entry) throw new Error("the sdd-mcp-server adapter is not set up");
      const call = serverCallOf(input);
      if ("local" in call) {
        const tool = call.local.toLowerCase();
        calls.push({ id: input.id, profile: null, tool, args: null });
        const ok = grants(input.caller, call.local);
        return { actual: ok ? "allow" : "deny", tool, detail: `not sent to the server (C002-IF-009 §2.2): the ${target} package ${ok ? "grants" : "does not grant"} ${input.caller} the tool ${call.local} maps to` };
      }
      const profile = PROFILE[call.tool];
      calls.push({ id: input.id, profile, tool: call.tool, args: call.args });
      const stub = input.env === undefined ? undefined : Object.fromEntries(Object.entries(input.env).map(([k, v]) => [k, v === null ? null : input.resolve(v)]));
      const s = await session(profile, stub);
      const m = await s.request("tools/call", { name: call.tool, arguments: call.args });
      // A call without a response leaves the session's queue blocked: the next case gets a new one.
      if (m.error && m.error.code < 0) s.kill();
      const d = readServerDecision(m);
      const dialect = call.tool === "run_command" ? ((call.args["dialect"] as "bash" | "powershell" | undefined) ?? "bash") : undefined;
      return { actual: d.actual, tool: call.tool, ...(input.corpus === "shell" && dialect ? { dialect } : {}), detail: d.detail };
    },
    async teardown() {
      try {
        await Promise.all([...sessions.values()].map((s) => s.close()));
      } finally {
        sessions.clear();
        sandbox?.cleanup();
        sandbox = undefined;
        entry = undefined;
      }
    },
  };
}
