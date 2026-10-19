// Replay adapter of the mechanism `opencode-permissions` (C002-T-042, C002-ADR-005): every case is
// decided by OpenCode itself at its tested version. The adapter puts the generated OpenCode package
// (native permission rules by default) and the fixture's adopter agent into the replay fixture, starts
// the pinned host binary through the session driver of evals/harness/opencode/driver.mjs, points the
// fixture's model provider at the loopback stub model (../stub-model.mjs), scripts the stub to answer
// each case with exactly its tool call of C002-IF-009 §2.2, and reads the decision from the tool part's
// final state (§2.3).
//
// Host process (C002-IF-010 §4; S-07 F-7 … F-10): the pinned binary by absolute path (SDD_OPENCODE_BIN,
// REF-WIN default), its own OPENCODE_DB, isolated config/data/cache/state folders (no credential store
// read), models fetch, auto-update and sharing off, `@opencode-ai/plugin` of the tested version ready in
// the project `.opencode/` folder and the isolated global config folder with npm offline, and every
// non-loopback request sent to a closed proxy port. No rg.exe is provisioned (S-07 §4). The adapter
// refuses to run when the binary reports a version other than the tested one (C002-T-042 step 4).
import { spawnSync } from "node:child_process";
import {
  cpSync, existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve as resolvePath } from "node:path";
import { startOpenCode } from "../../../evals/harness/opencode/driver.mjs";
import { main as generate } from "../../../scripts/generate/main.ts";
import { loadTargetTable, type Mode } from "../../../scripts/generate/tables.ts";
import { repoRoot } from "../../helpers.ts";
import { type Actual, type AdapterDecision, joinedPath, type ReplayAdapter, type ReplayFixture, type ReplayInput } from "../adapter.ts";
import { ADOPTER_AGENT } from "../expect.ts";
import { STUB_MODEL, STUB_PROVIDER, startStubModel } from "../stub-model.mjs";

const WIN = process.platform === "win32";
const FIXTURE = join(repoRoot(), "tests", "replay", "fixtures", "opencode");
/** Per-case session limit; a case that reaches it has no decision (`error`, §2.3). */
const CASE_TIMEOUT_MS = 120_000;
/** Allowlisted executables (C001-IF-07 §3) that the shell tool finds as inert shims; node and git stay real. */
const INERT = ["sdd", "sdd-mcp", "ripwire", "ast-grep", "sg", "serena", "uv", "uvx", "claude"];

/** One entry of the command list of the OpenCode server API (`GET /command`). */
export interface HostCommand {
  name: string;
  description?: string;
  agent?: string;
}

/** The scripted tool call of a case: OpenCode tool name and arguments (any JSON value, also an invalid one). */
export interface ScriptedCall {
  tool: string;
  args: unknown;
}

/** The tool call sent for a case, with the target file's text before the call (C002-TS-655). */
export interface SentCall extends ScriptedCall {
  id: string;
  agent: string;
  /** The target file's content before the call; null when no file was there; absent for non-path calls. */
  before?: string | null;
}

/** A session's result as the adapter reads it. */
export interface HostResult {
  parts: unknown[];
  error?: unknown;
}

/**
 * The OpenCode host the adapter drives: the pinned binary through the session driver (driverHost), or an
 * in-process stub host in the unit tests (C002-TC-656), which has no socket.
 */
export interface OpenCodeHost {
  /** Starts the host on the prepared project; returns the version the host reports. */
  start(project: string, runDir: string): Promise<{ version: string }>;
  /** One session of `agent` whose model answers with exactly `call`. */
  call(agent: string, call: ScriptedCall, token: string): Promise<HostResult>;
  commands(): Promise<HostCommand[]>;
  /** The executable of the host's shell tool once a shell call ran (null: not known). */
  shell?(): string | null;
  stop(): Promise<void>;
}

export interface OpenCodeAdapterOptions {
  /** Enforcement mode of the generated package (default `native-permissions`, the mechanism's rules). */
  mode?: Mode;
  /** C002-TS-647: the package's permission rules also bind adopter agents (a top-level `edit` rule). */
  bindAdopters?: boolean;
  /** Host to drive (default: the pinned binary through the session driver). */
  host?: OpenCodeHost;
  /** Version the host must report (default: the OpenCode table's tested version). */
  testedVersion?: string;
}

export interface OpenCodeAdapter extends ReplayAdapter {
  /** Every call sent, in order (C002-TS-655). */
  readonly calls: SentCall[];
  /** The command list of the running session, without a model call (C002-TC-226). */
  commands(): Promise<HostCommand[]>;
  /** A `write` of `content` to `path` by `agent`, with the tool result the agent sees (C002-TC-222, C002-TC-223). */
  writeFile(agent: string, path: string, content: string): Promise<{ actual: Actual; output: string }>;
}

// --- Decision reading (C002-IF-009 §2.3; S-07 facts F-4, F-5) ----------------------------------------

interface ToolState {
  status?: string;
  input?: unknown;
  output?: unknown;
  error?: unknown;
}
interface ToolPart {
  type?: string;
  tool?: string;
  state?: ToolState;
}

const UNAVAILABLE = /Model tried to call unavailable tool/;
const INVALID_ARGS = /The arguments provided to the tool are invalid/;
/** Refused by a permission rule, or a request rejected (S-07 §3.2). */
const RULE = /prevents you from using this specific tool call|rejected permission to use this specific tool call|PermissionDeniedError|PermissionRejectedError/;
/** Tool errors raised before the permission check (F-4), and argument (schema) errors. */
const PRE_CHECK = /Could not find oldString|BadResource|SchemaError|Invalid input|invalid_type|Expected .* received|Missing key|must read|is a directory|EISDIR/i;
const MAX_DETAIL = 500;

const text = (v: unknown): string => (typeof v === "string" ? v : v === undefined || v === null ? "" : JSON.stringify(v));
const clip = (s: string) => (s.length > MAX_DETAIL ? `${s.slice(0, MAX_DETAIL)}…` : s);

/**
 * The decision of one replayed call from the session's parts (§2.3): `deny` when OpenCode refused the
 * call before the tool ran — by a permission rule, as an unavailable tool in either form (a part with
 * the called name, status `error`, `Model tried to call unavailable tool …`; or a part named `invalid`),
 * by rejecting its arguments, or by a tool error raised before the permission check; `allow` when the
 * tool ran, whatever its own result; `error` when no decision can be read. A refusal whose target file
 * changed is an `error` (`changed`: the target's content differs after the call; null when not known).
 */
export function readDecision(result: HostResult, changed: boolean | null = null): { actual: Actual; detail?: string; output: string } {
  const parts = (result.parts as ToolPart[]).filter((p) => p?.type === "tool");
  const part = parts[0];
  if (!part) {
    const why = result.error ? text(result.error) : "the session holds no tool part";
    return { actual: "error", detail: clip(`no decision: ${why}`), output: "" };
  }
  const state = part.state ?? {};
  const output = text(state.output);
  const err = text(state.error);
  let actual: Actual;
  let detail: string;
  if (part.tool === "invalid") {
    actual = "deny";
    detail = output || err;
  } else if (state.status === "error") {
    detail = err;
    actual = UNAVAILABLE.test(err) || INVALID_ARGS.test(err) || RULE.test(err) || PRE_CHECK.test(err) ? "deny" : "allow";
  } else if (state.status === "completed") {
    actual = "allow";
    detail = output;
  } else {
    return { actual: "error", detail: clip(`no decision: tool part ${part.tool ?? "?"} ended in status ${state.status ?? "unknown"}`), output };
  }
  if (actual === "deny" && changed === true) return { actual: "error", detail: clip(`refused, but the target changed: ${detail}`), output };
  return { actual, detail: clip(detail), output: output || err };
}

// --- Case to call (C002-IF-009 §2.2) ------------------------------------------------------------------

/** The OpenCode tool a corpus tool maps to (§2.2 table; OpenCode has one shell tool). */
export function openCodeTool(corpusTool: string | null): string {
  switch (corpusTool) {
    case "Edit":
    case "MultiEdit":
      return "edit";
    case "Read":
      return "read";
    case "Glob":
      return "glob";
    case "Grep":
      return "grep";
    case "Bash":
    case "PowerShell":
      return "bash";
    case "Write":
    case "NotebookEdit":
    case null:
      return "write";
    default:
      return corpusTool;
  }
}

/** First line of a file, or null when it cannot be read as a file. */
function firstLine(path: string): string | null {
  try {
    if (!statSync(path).isFile()) return null;
    return readFileSync(path, "utf8").split(/\r?\n/)[0] ?? "";
  } catch {
    return null;
  }
}

function contentOf(path: unknown): string | null | undefined {
  if (typeof path !== "string" || path.trim() === "") return undefined;
  try {
    return statSync(path).isFile() ? readFileSync(path, "utf8") : undefined;
  } catch {
    return null;
  }
}

/** True when `path` lies in the replay fixture (the project or its sibling folders under the base). */
function inFixture(fx: ReplayFixture, path: string): boolean {
  const norm = (p: string) => resolvePath(p).split("\\").join("/").toLowerCase();
  const p = norm(path);
  const base = norm(fx.base);
  return p.startsWith(`${base}/`);
}

/**
 * An `Edit` case's target file (§2.2, C002-TS-655): the fixture holds a file at every Edit target that
 * lies in the fixture, so that OpenCode's text check does not decide in place of the rule.
 */
function ensureEditTarget(fx: ReplayFixture, path: string): void {
  if (existsSync(path) || /[\\/]$/.test(path) || !inFixture(fx, path)) return;
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, "x\n");
  } catch {
    // a name the file system refuses (device names, …): OpenCode decides on it as it is
  }
}

/** The tool call of a case (§2.2 table). */
export function callOf(input: ReplayInput, fx: ReplayFixture): ScriptedCall & { target?: string } {
  const description = `replay ${input.id}`;
  if (input.malformed !== false) return { tool: input.corpus === "shell" ? "bash" : openCodeTool(input.tool), args: {} };
  if (input.corpus === "shell") {
    const tool = openCodeTool(input.tool);
    const command = input.command;
    switch (tool) {
      case "bash":
        return { tool, args: { command, description } };
      case "write":
        return { tool, args: { filePath: command, content: `${description}\n` } };
      case "read":
        return { tool, args: { filePath: command } };
      case "glob":
        return { tool, args: { pattern: command } };
      case "grep":
        return { tool, args: { pattern: command } };
      default:
        return { tool, args: { command } };
    }
  }
  const p = joinedPath(input);
  const target = typeof p === "string" ? p : undefined;
  const tool = openCodeTool(input.tool);
  switch (tool) {
    case "edit": {
      if (target !== undefined) ensureEditTarget(fx, target);
      const old = target !== undefined ? firstLine(target) : null;
      return { tool, args: { filePath: p, oldString: old ?? "x", newString: description }, ...(target !== undefined ? { target } : {}) };
    }
    case "read":
      return { tool, args: { filePath: p } };
    case "glob":
      return { tool, args: { pattern: p } };
    case "grep":
      return { tool, args: { pattern: "x", path: p } };
    case "bash":
      return { tool, args: { command: `git status -- ${typeof p === "string" ? p : String(p)}`, description } };
    case "write":
      return { tool, args: { filePath: p, content: `${description}\n` }, ...(target !== undefined ? { target } : {}) };
    default:
      // A tool the case names by its host name (an adopter MCP tool, C002-TS-133): the path in the case's field.
      return { tool, args: { [input.field ?? "filePath"]: p, content: `${description}\n` }, ...(target !== undefined ? { target } : {}) };
  }
}

// --- Fixture state (allowed shell cases run for real, e.g. `rm -rf src` of an adopter agent) -----------

type Entry = { rel: string; kind: "dir" } | { rel: string; kind: "file"; content: Buffer; ino: number } | { rel: string; kind: "link"; target: string; dir: boolean };

/** The fixture's entries under `root`, links not followed (`.git` and `.opencode` left out). */
function snapshot(root: string): Entry[] {
  const out: Entry[] = [];
  const walk = (rel: string) => {
    for (const name of readdirSync(join(root, rel))) {
      const r = rel ? `${rel}/${name}` : name;
      if (!rel && (name === ".git" || name === ".opencode")) continue;
      const abs = join(root, r);
      const st = lstatSync(abs);
      if (st.isSymbolicLink()) {
        let dir = false;
        try {
          dir = statSync(abs).isDirectory();
        } catch {
          // dangling
        }
        out.push({ rel: r, kind: "link", target: readlinkSync(abs), dir });
      } else if (st.isDirectory()) {
        out.push({ rel: r, kind: "dir" });
        walk(r);
      } else if (st.isFile()) out.push({ rel: r, kind: "file", content: readFileSync(abs), ino: st.nlink > 1 ? st.ino : 0 });
    }
  };
  walk("");
  return out;
}

/** Restores every entry of the snapshot that a case removed (contents a case changed stay changed). */
function repair(root: string, entries: Entry[]): void {
  const inode = new Map<number, string>();
  for (const e of entries) {
    const abs = join(root, e.rel);
    let present = true;
    try {
      lstatSync(abs);
    } catch {
      present = false;
    }
    if (e.kind === "file" && e.ino !== 0) {
      const first = inode.get(e.ino);
      if (first === undefined) inode.set(e.ino, abs);
      if (present) continue;
      mkdirSync(dirname(abs), { recursive: true });
      if (first !== undefined && existsSync(first)) linkSync(first, abs);
      else writeFileSync(abs, e.content);
      continue;
    }
    if (present) continue;
    mkdirSync(dirname(abs), { recursive: true });
    if (e.kind === "dir") mkdirSync(abs, { recursive: true });
    else if (e.kind === "file") writeFileSync(abs, e.content);
    else symlinkSync(e.target, abs, e.dir ? (WIN ? "junction" : "dir") : "file");
  }
  // hard links whose partner was recreated as a plain file: link them again
  for (const e of entries) {
    if (e.kind !== "file" || e.ino === 0) continue;
    const first = inode.get(e.ino)!;
    const abs = join(root, e.rel);
    if (first !== abs && existsSync(first) && existsSync(abs) && statSync(first).ino !== statSync(abs).ino) {
      unlinkSync(abs);
      linkSync(first, abs);
    }
  }
}

// --- Package and project ------------------------------------------------------------------------------

type Json = Record<string, unknown>;
const packages = new Map<Mode, string>();
let packageRoot: string | undefined;

/** The OpenCode package generated for `mode` (once per process), as `npm run generate` writes it. */
function generatedPackage(mode: Mode): string {
  const done = packages.get(mode);
  if (done) return done;
  if (!packageRoot) {
    packageRoot = mkdtempSync(join(tmpdir(), "sdd-oc-pkg-"));
    const dir = packageRoot;
    process.once("exit", () => rmSync(dir, { recursive: true, force: true }));
  }
  const out = join(packageRoot, mode);
  const lines: string[] = [];
  const code = generate(["--target", "opencode", "--mode", `opencode=${mode}`, "--source", join(repoRoot(), "plugins", "architect"), "--out", out, "--quiet"], {
    cwd: repoRoot(),
    stdout: (l) => lines.push(l),
    stderr: (l) => lines.push(l),
  });
  if (code !== 0) throw new Error(`generating the OpenCode package (${mode}) failed (exit ${code}):\n${lines.join("\n")}`);
  const dir = join(out, "opencode");
  packages.set(mode, dir);
  return dir;
}

const readJson = (file: string): Json => JSON.parse(readFileSync(file, "utf8")) as Json;

/** The adopter's opencode.json merged with the package's entries (INSTALL.md step 2) and the fixture's adopter agent. */
function projectConfig(adopter: Json, pkg: Json, fixture: Json, bindAdopters: boolean): Json {
  const merged: Json = { ...pkg, ...adopter };
  for (const key of ["agent", "mcp", "tools"]) {
    const a = (adopter[key] ?? {}) as Json;
    const p = (pkg[key] ?? {}) as Json;
    const f = (fixture[key] ?? {}) as Json;
    if (Object.keys(a).length + Object.keys(p).length + Object.keys(f).length > 0) merged[key] = { ...f, ...a, ...p };
  }
  if (bindAdopters) {
    // C002-TS-647 seed: a project-wide edit rule that binds every agent, adopter agents included.
    merged["permission"] = { ...((adopter["permission"] ?? {}) as Json), edit: { "*": "deny", ".sdd/*": "allow" } };
  }
  return merged;
}

function run(cmd: string, args: string[], cwd: string): void {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", windowsHide: true, shell: WIN && cmd === "npm" });
  if (r.error || r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed in ${cwd}: ${r.error?.message ?? r.stderr}`);
}

/** `@opencode-ai/plugin` of the tested version installed in the fixture's `.opencode/` (once; node_modules is not committed). */
function pluginModules(): string {
  const dir = join(FIXTURE, ".opencode");
  if (!existsSync(join(dir, "node_modules", "@opencode-ai", "plugin", "package.json"))) run("npm", ["ci", "--prefer-offline", "--no-audit", "--no-fund"], dir);
  return dir;
}

/** `package.json`, `package-lock.json` and a link to the prepared `node_modules` in `dest` (F-9). */
function placePluginModules(dest: string): string {
  const src = pluginModules();
  mkdirSync(dest, { recursive: true });
  for (const f of ["package.json", "package-lock.json"]) cpSync(join(src, f), join(dest, f));
  const link = join(dest, "node_modules");
  if (!existsSync(link)) symlinkSync(join(src, "node_modules"), link, WIN ? "junction" : "dir");
  return link;
}

// --- Host through the session driver --------------------------------------------------------------------

/** The pinned host binary through the session driver, its model the loopback stub. */
export function driverHost(opts: { bin?: string } = {}): OpenCodeHost & { links: string[] } {
  let driver: Awaited<ReturnType<typeof startOpenCode>> | undefined;
  let stub: Awaited<ReturnType<typeof startStubModel>> | undefined;
  const links: string[] = [];
  return {
    links,
    async start(project, runDir) {
      stub = await startStubModel();
      // Isolated global config folder: the stub provider, auto-update, sharing and snapshots off, and the
      // plugin package OpenCode 1.18.31 also installs there (S-07 §4).
      const global = join(runDir, "xdg", "config", "opencode");
      mkdirSync(global, { recursive: true });
      writeFileSync(join(global, "opencode.json"), readFileSync(join(FIXTURE, "global.json"), "utf8").replace("@STUB_BASE_URL@", stub.baseURL));
      links.push(placePluginModules(global), placePluginModules(join(project, ".opencode")));
      // PATH shims. OpenCode decides a shell call before it runs, so an allowed command's own result never
      // changes the decision (§2.3); the shims keep allowed commands inert and quick (an allowed
      // `ast-grep run --interactive` would otherwise wait for input, an allowed `sdd serena-launch …`
      // start Serena): every allowlisted executable but node and git exits 0, as an extensionless
      // script for Git Bash and a `.cmd` file for PowerShell (OpenCode's shell tool is the shell OpenCode
      // was started from). `sdd lint …` alone runs the real CLI, for the quick-lint plugin, which starts
      // `sdd lint --quick` through cmd.exe (C002-TS-222).
      const shims = join(runDir, "bin");
      mkdirSync(shims, { recursive: true });
      const sdd = join(repoRoot(), "plugins", "architect", "scripts", "sdd.mjs");
      for (const exe of INERT) {
        writeFileSync(join(shims, exe), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
        if (WIN && exe !== "sdd") writeFileSync(join(shims, `${exe}.cmd`), "@exit /b 0\r\n");
      }
      if (WIN) writeFileSync(join(shims, "sdd.cmd"), `@if /i not "%~1"=="lint" exit /b 0\r\n@"${process.execPath}" "${sdd}" %*\r\n`);
      const pathKey = Object.keys(process.env).find((k) => k.toUpperCase() === "PATH") ?? "PATH";
      // The per-user data folder of an allowed `node <sdd.mjs> serena-launch --user-data …` points into
      // the run folder, so that no case writes the user's own data folder.
      const local = join(runDir, "localappdata");
      mkdirSync(local, { recursive: true });
      const env = { [pathKey]: `${shims}${WIN ? ";" : ":"}${process.env[pathKey] ?? ""}`, ...(WIN ? { LOCALAPPDATA: local } : {}) };
      driver = await startOpenCode({ ...(opts.bin ? { bin: opts.bin } : {}), project, runDir, isolate: true, env });
      return { version: driver.version };
    },
    async call(agent, call, token) {
      if (!driver || !stub) throw new Error("the OpenCode host is not started");
      stub.script(token, call);
      const r = await driver.run({
        agent,
        text: `replay case ${token}`,
        model: { providerID: STUB_PROVIDER, modelID: STUB_MODEL },
        title: `replay ${token}`,
        permission: () => "reject",
        question: () => null,
        timeoutMs: CASE_TIMEOUT_MS,
      });
      return { parts: r.parts, error: r.error };
    },
    shell() {
      return driver?.shell() ?? null;
    },
    async commands() {
      if (!driver) throw new Error("the OpenCode host is not started");
      return (await driver.commands()) as HostCommand[];
    },
    async stop() {
      await driver?.stop();
      await stub?.close();
      driver = undefined;
      stub = undefined;
    },
  };
}

// --- Adapter --------------------------------------------------------------------------------------------

function removeLink(path: string): void {
  try {
    if (lstatSync(path).isSymbolicLink()) unlinkSync(path);
  } catch {
    // gone
  }
}

function removeDir(dir: string): void {
  for (let i = 0; i < 10; i++) {
    try {
      rmSync(dir, { recursive: true, force: true });
      return;
    } catch {
      spawnSync(process.execPath, ["-e", "setTimeout(()=>{},300)"]);
    }
  }
}

export function createOpenCodeAdapter(opts: OpenCodeAdapterOptions = {}): OpenCodeAdapter {
  const mode: Mode = opts.mode ?? "native-permissions";
  const tested = opts.testedVersion ?? loadTargetTable(repoRoot(), "opencode").host.tested_versions["opencode"];
  const calls: SentCall[] = [];
  let host: (OpenCodeHost & { links?: string[] }) | undefined;
  let fixture: ReplayFixture | undefined;
  let runDir: string | undefined;
  let version: string | undefined;
  let agents: Json = {};
  let entries: Entry[] = [];
  let seq = 0;

  async function send(agent: string, call: ScriptedCall, id: string, target?: string): Promise<{ actual: Actual; detail?: string; output: string }> {
    if (!host || !fixture) throw new Error("the opencode-permissions adapter is not set up");
    const before = target !== undefined ? contentOf(target) : undefined;
    calls.push({ id, agent, tool: call.tool, args: call.args, ...(target !== undefined ? { before: before ?? null } : {}) });
    const result = await host.call(agent, call, `${id}#${++seq}`);
    const after = target !== undefined ? contentOf(target) : undefined;
    const changed = target === undefined || before === undefined ? null : before !== after;
    const d = readDecision(result, changed);
    repair(fixture.repo, entries);
    return d;
  }

  return {
    mechanism: "opencode-permissions",
    target: "opencode",
    name: "opencode-permissions",
    calls,
    hostVersions: () => (version ? { opencode: version } : undefined),
    grants(agent, corpusTool) {
      const entry = agents[agent] as { tools?: Record<string, boolean> } | undefined;
      if (!entry?.tools) return true;
      const tool = openCodeTool(corpusTool);
      return entry.tools[tool] ?? entry.tools["*"] ?? true;
    },
    async setup(fx) {
      fixture = fx;
      calls.length = 0;
      runDir = mkdtempSync(join(tmpdir(), "sdd-oc-run-"));
      // A git repository with a root commit at {repo}, as an adopter's: OpenCode takes the project (its ID
      // and worktree) from git; without a commit it runs the folder as its "global" project.
      if (!existsSync(join(fx.repo, ".git", "HEAD"))) {
        run("git", ["-c", "init.defaultBranch=main", "init", "-q"], fx.repo);
        run("git", ["-c", "user.name=replay", "-c", "user.email=replay@localhost", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-q", "-m", "replay fixture"], fx.repo);
      }
      const pkg = generatedPackage(mode);
      cpSync(join(pkg, ".opencode"), join(fx.repo, ".opencode"), { recursive: true });
      const own = join(fx.repo, "opencode.json");
      const config = projectConfig(existsSync(own) ? readJson(own) : {}, readJson(join(pkg, "opencode.json")), readJson(join(FIXTURE, "adopter.json")), opts.bindAdopters === true);
      writeFileSync(own, JSON.stringify(config, null, 2) + "\n");
      agents = (config["agent"] ?? {}) as Json;
      host = opts.host ?? driverHost();
      try {
        version = (await host.start(fx.repo, runDir)).version;
        if (version !== tested) throw new Error(`OpenCode ${version} is not the tested version ${tested}: the opencode-permissions replay refuses to run (ERR-REL-006; set SDD_OPENCODE_BIN to the pinned ${tested} binary)`);
      } catch (e) {
        await this.teardown();
        throw e;
      }
      entries = snapshot(fx.repo);
    },
    async decide(input: ReplayInput): Promise<AdapterDecision> {
      if (!fixture) throw new Error("the opencode-permissions adapter is not set up");
      const call = callOf(input, fixture);
      const agent = input.caller === ADOPTER_AGENT ? ADOPTER_AGENT : input.caller;
      const d = await send(agent, call, input.id, call.target);
      // OpenCode has one shell tool: the case is decided in the dialect of the shell it runs (Git Bash
      // when OpenCode starts from Git Bash, PowerShell when it starts from PowerShell).
      const shell = input.corpus === "shell" ? (host?.shell?.() ?? null) : null;
      const dialect = shell !== null && /(pwsh|powershell)(\.exe)?$/i.test(shell) ? ("powershell" as const) : ("bash" as const);
      return { actual: d.actual, tool: call.tool, ...(input.corpus === "shell" ? { dialect } : {}), ...(d.detail !== undefined ? { detail: d.detail } : {}) };
    },
    async commands() {
      if (!host) throw new Error("the opencode-permissions adapter is not set up");
      return (await host.commands()).map((c) => ({ name: c.name, ...(c.description !== undefined ? { description: c.description } : {}), ...(c.agent !== undefined ? { agent: c.agent } : {}) }));
    },
    async writeFile(agent, path, content) {
      const d = await send(agent, { tool: "write", args: { filePath: path, content } }, `write-${agent}`, path);
      return { actual: d.actual, output: d.output };
    },
    async teardown() {
      try {
        await host?.stop();
      } finally {
        for (const l of host?.links ?? []) removeLink(l);
        if (host?.links) host.links.length = 0;
        host = undefined;
        if (fixture) removeLink(join(fixture.repo, ".opencode", "node_modules"));
        // SDD_REPLAY_KEEP_RUN keeps the run folder (server log, database) for inspection.
        if (runDir && process.env["SDD_REPLAY_KEEP_RUN"]) console.log(`opencode-permissions: run folder kept: ${runDir}`);
        else if (runDir) removeDir(runDir);
        runDir = undefined;
      }
    },
  };
}
