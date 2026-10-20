// Copilot CLI eval runner (C002-COMP-009, C002-IF-010 §4; C002-T-045): runs one eval session of the
// existing case API (`runSession` options of session.mjs, unchanged) on the Copilot target package
// through Copilot CLI in non-interactive mode (C002-REQ-612), within the caps of ../caps.mjs
// (C002-REQ-611, C002-NFR-105).
//
// Per session (C002-IF-010 §4, Copilot CLI row):
//   - the Copilot package (`dist/copilot/`, or a package generated from plugins/architect when the row
//     names a `targetPackage` with a mode, tested versions or a version) is copied to a temporary
//     folder, and `sdd install copilot --package <copy>` runs in the case workspace with the copy's own
//     CLI (`scripts/sdd.mjs`), so the copy gets its `plugin.json` and `hooks.json` and the workspace its
//     agents, `.github/hooks/architect-guard.json` and `.vscode/mcp.json` (C002-IF-007, C002-T-058);
//   - the `servers` of the copy's `install/mcp.json` are written in Copilot CLI's `mcpServers` form to a
//     servers file passed with `--additional-mcp-config @<file>`; Copilot CLI 1.0.98 does not read
//     `.vscode/mcp.json`, so no server name is declared twice (step 1); `sdd` and `sdd-mcp` commands
//     run the staged architect-sdd scripts (dist/npm/architect-sdd) with this Node.js;
//   - Copilot CLI runs as `copilot -p <prompt> --agent architect:<agent> --plugin-dir <copy>
//     --additional-mcp-config @<servers file> --output-format json --no-ask-user` in the workspace, with
//     a temporary `COPILOT_HOME`; the runner adds `--no-auto-update`, `--disable-builtin-mcps`,
//     `--max-ai-credits` (the spend cap in AI Credits, 1 credit = 0.01 USD, test plan §4.4),
//     `--usage-output-file`, `--log-dir` in the run folder and one `--allow-tool` per permission that
//     the case's `allowTools` maps to (C002-IF-010 §2);
//   - workspace hooks: in prompt mode Copilot CLI loads `.github/hooks/*.json` only for a trusted folder
//     or with GITHUB_COPILOT_PROMPT_MODE_REPO_HOOKS=true; the runner sets the variable (the folder is not
//     trusted, so no workspace agent or MCP file of the folder is loaded besides the hooks) and records
//     the CLI's log line "Loading repo hooks in prompt mode" as the event `hooks`;
//   - credentials (step 1): the temporary home holds a `config.json` with the login identity of P-01's
//     Copilot CLI login only (host, login, kind; read from `~/.copilot/config.json`), never a token; the
//     host then reads the token from the system credential store, where `copilot login` keeps it
//     (`api_key_source` "copilot-credential-store"). Token variables (COPILOT_GITHUB_TOKEN, GH_TOKEN,
//     GITHUB_TOKEN) and BYOK provider variables are removed from the host's environment. After the
//     session the temporary home is scanned for token text; the session fails when one is found;
//   - a prompt `/<name> <arguments>` (also `/architect:<name>`, `/architect-<name>`) of a package prompt
//     file runs that prompt file's body, because Copilot CLI 1.0.98 sends slash text in `-p` to the model
//     unexpanded (it registers prompt files as skills `architect:<name>.prompt`); the eval relay
//     `architect:eval-dispatcher` ("Dispatch: <agent>" + brief) starts `architect:<agent>` with the brief
//     (`relay: "direct"`, as on OpenCode);
//   - caps: a turn is an assistant message of the session agent; at `maxTurns` turns the process tree is
//     killed (`turn cap`); spend comes from `--usage-output-file` (`totalNanoAiu` / 1e9 = AI Credits), and
//     the host's own `--max-ai-credits` limit ends a session as `spend cap`; per-turn spend is not in the
//     JSON events, so `usage.usd` is the session total estimated from the measured AI Credits.
//
// Session result (C002-IF-010 §3): the graders' shape (`transcript` of `{ t, type: "sdk", message }` and
// `{ t, type: "harness", event }` records, `answers`, `result`, `wallMs`) plus `target` "copilot",
// `host_versions`, `end_reason`, `usage`, `spend`, `provider`, `models`, `apiKeySource` and
// `copilot_usage` (the measured units). Every tool call carries `host_tool` and `agent`, the agent that
// made it (`architect:<agent>` for the ten Architect agents, a host built-in agent by its own name); a
// call that a PreToolUse hook denied (a fail-closed hook error, S-08 §2.2) is reported as not run
// (`not_run: true`, `denied_by: "hook"` on its tool result, and a harness `denied` record).
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { createInterface } from "node:readline";
import { createCaps } from "../caps.mjs";

// The repository root: the first folder up from this module that holds the Copilot table (also when a
// test bundles this module elsewhere in the repository).
const ROOT = (() => {
  let dir = import.meta.dirname;
  for (;;) {
    if (existsSync(join(dir, "plugins", "architect", "targets", "copilot.json"))) return dir;
    const up = dirname(dir);
    if (up === dir) return join(import.meta.dirname, "..", "..", "..");
    dir = up;
  }
})();
const WIN = process.platform === "win32";
export const TARGET = "copilot";
/** Inference provider of the Copilot CLI sessions (E-CPC: P-01's GitHub Copilot plan). */
export const PROVIDER = "github-copilot";
/** The credential source the runner gives the host (C002-IF-010 §3; step 1 of C002-T-045). */
export const API_KEY_SOURCE = "copilot-credential-store";
/** Configuration variable naming the Copilot CLI executable (absolute path). */
export const COPILOT_BIN_VAR = "SDD_EVAL_COPILOT_BIN";
/** Configuration variable naming the Copilot CLI config file whose login identity the runner copies. */
export const COPILOT_CONFIG_VAR = "SDD_EVAL_COPILOT_CONFIG";
/** USD per AI Credit (test plan §4.4): the estimate of a session's cost from its measured credits. */
export const USD_PER_CREDIT = 0.01;
/** Minimum of `--max-ai-credits` (Copilot CLI 1.0.98, `copilot help limits`). */
export const MIN_AI_CREDITS = 30;
/** Wall-clock limit of one session (a hung host must not hold the run). */
const SESSION_TIMEOUT_MS = 20 * 60_000;
/** Token shapes of GitHub credentials; text that matches is never written to a result or a log. */
export const TOKEN_PATTERN = /\b(?:gh[opsur]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g;

/** Host variables never passed to Copilot CLI: credentials, BYOK provider settings, other providers. */
const DROPPED_VARS = /^(COPILOT_GITHUB_TOKEN|GH_TOKEN|GITHUB_TOKEN|GH_ENTERPRISE_TOKEN|GITHUB_ENTERPRISE_TOKEN|COPILOT_PROVIDER_.*|COPILOT_OFFLINE|COPILOT_MODEL|COPILOT_ALLOW_ALL|COPILOT_HOME|COPILOT_AUTO_TIER|NODE_OPTIONS|CLAUDE.*|ANTHROPIC_.*|OPENAI_.*|OPENROUTER_.*)$/i;

/** The Copilot mapping table (C002-IF-001). */
export function copilotTable(root = ROOT) {
  return JSON.parse(readFileSync(join(root, "plugins", "architect", "targets", "copilot.json"), "utf8"));
}

/** The tested Copilot CLI version of the S-08 record (`host_versions.copilot-cli`). */
export function testedVersion(root = ROOT) {
  const text = readFileSync(join(root, "docs", "spikes", "S-08-copilot-vscode.md"), "utf8");
  return /copilot-cli:\s*"([^"]+)"/.exec(text)?.[1] ?? null;
}

/** Redacts token text (never printed or written). */
export const redact = (s) => String(s ?? "").replace(TOKEN_PATTERN, "<redacted>");

// --- Names ----------------------------------------------------------------------------------------

/** The ten Architect agents (the guard hook's `--agents` of the package's hooks template). */
export function architectAgents(pkg) {
  const t = JSON.parse(readFileSync(join(pkg, "install", "hooks.template.json"), "utf8"));
  for (const e of t.hooks?.PreToolUse ?? []) {
    const m = /\bhook guard\b.*--agents\s+(\S+)/.exec(String(e.command ?? ""));
    if (m) return m[1].split(",").filter(Boolean);
  }
  throw new Error(`${pkg}: install/hooks.template.json has no hook guard command with --agents`);
}

/**
 * The reported name of an agent of the host: `architect:<agent>` for an Architect agent (a bare name,
 * the `architect:` form or a `<plugin>:` form of one of `architect`), else the host's own name.
 */
export function agentName(name, architect) {
  const s = String(name ?? "");
  const bare = s.replace(/^architect:/, "");
  return architect.includes(bare) ? `architect:${bare}` : s;
}

/** The `architect:<agent>` form Copilot CLI requires (S-08 fact F-6): a case's `architect:` name unchanged. */
export const hostAgent = (agent) => (agent ? (String(agent).includes(":") ? String(agent) : `architect:${agent}`) : "architect:sdd-conductor");

/**
 * Copilot CLI 1.0.98 tool names (the JSON events) → Claude Code names and inputs (C002-IF-010 §3):
 * the sdd MCP server tools, the generic edit and terminal tools (hook names `Write` and `Bash`, S-08
 * §2.3), the subagent tool and the read and search tools. The host's keys stay beside the source keys.
 */
const BACK = {
  "sdd-files-write_file": ["Write", (i) => ({ file_path: i.path, content: i.content })],
  "sdd-files-replace_text": ["Edit", (i) => ({ file_path: i.path, old_string: i.old_text, new_string: i.new_text })],
  "sdd-shell-run_command": ["Bash", (i) => ({ command: i.command })],
  create: ["Write", (i) => ({ file_path: i.path, content: i.file_text })],
  edit: ["Edit", (i) => ({ file_path: i.path, old_string: i.old_str, new_string: i.new_str })],
  view: ["Read", (i) => ({ file_path: i.path })],
  powershell: ["Bash", (i) => ({ command: i.command })],
  bash: ["Bash", (i) => ({ command: i.command })],
  grep: ["Grep", (i) => ({ pattern: i.pattern, path: i.path })],
  glob: ["Glob", (i) => ({ pattern: i.pattern, path: i.path })],
  ask_user: ["AskUserQuestion", (i) => ({ questions: i.questions ?? (i.question ? [{ question: i.question, options: (i.choices ?? []).map((c) => ({ label: String(c) })) }] : []) })],
  web_fetch: ["WebFetch", (i) => ({ url: i.url })],
};

/** The package's MCP servers of the table (`<server>-<tool>` ↔ `mcp__plugin_architect_<server>__<tool>`). */
const tableServers = (table) => Object.keys(table.mcp_servers ?? {}).sort((a, b) => b.length - a.length);

/** `{ name, input }` of one host call under `names` ("host" keeps the host's names, "source" maps back). */
export function mapCall(tool, input, { names = "source", architect = [], table = copilotTable() } = {}) {
  const i = input && typeof input === "object" ? input : {};
  if (names === "host") return { name: tool, input: i };
  if (tool === "task") return { name: "Agent", input: { ...i, subagent_type: i.agent_type ? agentName(i.agent_type, architect) : i.agent_type, prompt: i.prompt, description: i.description } };
  const back = BACK[tool];
  if (back) return { name: back[0], input: { ...i, ...back[1](i) } };
  for (const s of tableServers(table)) if (tool.startsWith(`${s}-`)) return { name: `mcp__plugin_architect_${s}__${tool.slice(s.length + 1)}`, input: i };
  return { name: tool, input: i };
}

/**
 * `--allow-tool` values for the case's `allowTools` (Claude Code names; C002-IF-010 §2): each tool goes
 * through the table's forward mapping for `mode` (Write/Edit → `sdd-files/*` or `edit`, Bash →
 * `sdd-shell/*` or `execute`); `<server>/*` grants a server, `edit` the host's `write` permission,
 * `execute` its `shell` permission; an MCP source name `mcp__plugin_architect_<server>__<tool>` grants
 * `<server>(<tool>)`. Read-only tools need no permission. Sorted, each once.
 */
export function allowToolArgs(allowTools = [], { table = copilotTable(), mode = table.enforcement_mode } = {}) {
  const out = new Set();
  for (const tool of allowTools) {
    const m = /^mcp__plugin_architect_(.+?)__(.+)$/.exec(tool);
    if (m) {
      out.add(`${m[1]}(${m[2]})`);
      continue;
    }
    const entry = table.tools?.[tool];
    const targets = entry === undefined ? [] : Array.isArray(entry) ? entry : (entry.by_mode?.[mode] ?? []);
    for (const t of targets) {
      const server = /^([^/]+)\/\*$/.exec(t);
      if (server) out.add(server[1]);
      else if (t === "edit") out.add("write");
      else if (t === "execute") out.add("shell");
    }
  }
  return [...out].sort().map((v) => `--allow-tool=${v}`);
}

// --- Prompt ---------------------------------------------------------------------------------------

/** A prompt file's body without its frontmatter. */
const bodyOf = (text) => String(text).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();

/**
 * What the session starts with: `{ agent, text, promptFile?, relay? }`. `agent` is the `--agent` value.
 * A prompt `/<name> <arguments>` of a package prompt file runs that file's body (with `Arguments:` and
 * the arguments when given); the eval relay starts its specialist directly.
 */
export function sessionStart(agent, prompt, pkg) {
  const text = String(prompt ?? "");
  if (agent === "architect:eval-dispatcher") {
    const m = /^Dispatch:\s*(\S+)\r?\n([\s\S]*)$/.exec(text);
    if (m) return { agent: hostAgent(m[1]), text: m[2], relay: "direct" };
  }
  const cmd = /^\/(?:architect[:-])?([a-z][a-z0-9-]*)(?:\s+([\s\S]*))?$/.exec(text.trim());
  if (cmd && pkg && existsSync(join(pkg, "prompts", `${cmd[1]}.prompt.md`))) {
    const args = (cmd[2] ?? "").trim();
    const body = bodyOf(readFileSync(join(pkg, "prompts", `${cmd[1]}.prompt.md`), "utf8"));
    return { agent: hostAgent(agent), text: args ? `${body}\n\nArguments: ${args}` : body, promptFile: `prompts/${cmd[1]}.prompt.md` };
  }
  return { agent: hostAgent(agent), text };
}

// --- Package and workspace ------------------------------------------------------------------------

const packages = new Map();

/**
 * The Copilot package to copy for a session: `dist/copilot/` when the row names no `targetPackage`
 * field beside its target, else (or when `dist/copilot/` is absent) one generated from plugins/architect
 * (once per process and `targetPackage`): `mode` → `--mode copilot=<mode>`; `tested_versions` replaces
 * `host.tested_versions` in a copy of the table; `version` is written into the copy's plugin manifest
 * (C002-IF-010 §2.1).
 */
export function copilotPackage(targetPackage = {}, root = ROOT) {
  const tp = targetPackage ?? {};
  const custom = Boolean(tp.mode || tp.tested_versions || tp.version);
  const dist = join(root, "dist", "copilot");
  if (!custom && existsSync(join(dist, "architect-target.json")) && !process.env.SDD_EVAL_COPILOT_GENERATE) return dist;
  const key = JSON.stringify(tp);
  if (packages.has(key) && existsSync(packages.get(key))) return packages.get(key);
  const out = mkdtempSync(join(tmpdir(), "sdd-eval-cppkg-"));
  process.once("exit", () => rmSync(out, { recursive: true, force: true }));
  let source = join(root, "plugins", "architect");
  if (tp.tested_versions || tp.version) {
    const copy = join(out, "source");
    cpSync(source, copy, { recursive: true, filter: (p) => !/[\\/]node_modules([\\/]|$)/.test(p) });
    if (tp.tested_versions) {
      const tableFile = join(copy, "targets", "copilot.json");
      const t = JSON.parse(readFileSync(tableFile, "utf8"));
      t.host.tested_versions = { ...t.host.tested_versions, ...tp.tested_versions };
      writeFileSync(tableFile, JSON.stringify(t, null, 2) + "\n");
    }
    if (tp.version) {
      const manifestFile = join(copy, ".claude-plugin", "plugin.json");
      const m = JSON.parse(readFileSync(manifestFile, "utf8"));
      writeFileSync(manifestFile, JSON.stringify({ ...m, version: tp.version }, null, 2) + "\n");
    }
    source = copy;
  }
  const args = [join(root, "scripts", "generate.mjs"), "--target", "copilot", "--source", source, "--out", join(out, "pkg"), "--quiet"];
  if (tp.mode) args.push("--mode", `copilot=${tp.mode}`);
  const r = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", windowsHide: true });
  if (r.status !== 0) throw new Error(`generating the Copilot package failed (exit ${r.status}): ${(r.stderr || r.stdout).slice(-800)}`);
  const dir = join(out, "pkg", "copilot");
  packages.set(key, dir);
  return dir;
}

/** The staged architect-sdd scripts (sdd.mjs and sdd-mcp.mjs side by side), or an error naming the fix. */
export function sddScripts(root = ROOT) {
  const dir = process.env.SDD_EVAL_SDD_SCRIPTS ?? join(root, "dist", "npm", "architect-sdd", "scripts");
  for (const f of ["sdd.mjs", "sdd-mcp.mjs"]) if (!existsSync(join(dir, f))) throw new Error(`Copilot CLI eval runner: ${join(dir, f)} is missing; run \`npm run package\` (stages dist/npm/architect-sdd) or set SDD_EVAL_SDD_SCRIPTS`);
  return dir;
}

/**
 * Prepares one session (C002-IF-010 §4): copies `pkg` to `<runDir>/package` and runs `sdd install
 * copilot --package <copy>` in `cwd` with the copy's CLI. Returns `{ copy, install }` (the install's
 * output lines); throws when the install fails or leaves no workspace hook file.
 */
export function prepareWorkspace(cwd, pkg, runDir) {
  const copy = join(runDir, "package");
  cpSync(pkg, copy, { recursive: true });
  if (!existsSync(join(cwd, ".git"))) spawnSync("git", ["init", "-q"], { cwd, windowsHide: true });
  const r = spawnSync(process.execPath, [join(copy, "scripts", "sdd.mjs"), "install", "copilot", "--package", copy], { cwd, encoding: "utf8", windowsHide: true, env: { ...process.env, SDD_DEBUG: "", SDD_TEST_FAULT: "" } });
  if (r.status !== 0) throw new Error(`sdd install copilot failed (exit ${r.status}): ${(r.stderr || r.stdout).slice(-800)}`);
  for (const f of [join(cwd, ".github", "hooks", "architect-guard.json"), join(copy, "hooks.json"), join(copy, "plugin.json")]) if (!existsSync(f)) throw new Error(`sdd install copilot left no ${f}`);
  return { copy, install: (r.stdout ?? "").trim().split(/\r?\n/) };
}

/**
 * The servers file of a session: the `servers` of `<copy>/install/mcp.json` in Copilot CLI's
 * `mcpServers` form (`stdio` → `local` with `tools: ["*"]`, `http` kept), with `sdd` and `sdd-mcp`
 * commands run by this Node.js from the staged scripts, and `mcpOverrides` URLs applied.
 */
export function serversConfig(copy, scripts, mcpOverrides = {}) {
  const { servers = {} } = JSON.parse(readFileSync(join(copy, "install", "mcp.json"), "utf8"));
  const mcpServers = {};
  for (const [name, s] of Object.entries(servers)) {
    if (s.type === "http" || s.type === "sse") {
      mcpServers[name] = { type: s.type, url: mcpOverrides?.[name] ?? s.url, tools: ["*"] };
      continue;
    }
    let command = s.command;
    let args = s.args ?? [];
    if (command === "sdd" || command === "sdd-mcp") {
      args = [join(scripts, `${command}.mjs`), ...args];
      command = process.execPath;
    }
    mcpServers[name] = { type: "local", command, args, ...(s.env ? { env: s.env } : {}), tools: ["*"] };
  }
  return { mcpServers };
}

/**
 * The login identity of the user's Copilot CLI config (`loggedInUsers` and `lastLoggedInUser`, the
 * fields host, login and kind only), or null when there is none. The config's other fields are not
 * copied; no credential is read (the token stays in the system credential store).
 */
export function loginIdentity(file = process.env[COPILOT_CONFIG_VAR] ?? join(homedir(), ".copilot", "config.json")) {
  if (!existsSync(file)) return null;
  let c;
  try {
    c = JSON.parse(readFileSync(file, "utf8").split(/\r?\n/).filter((l) => !/^\s*\/\//.test(l)).join("\n"));
  } catch {
    return null;
  }
  const pick = (u, keys) => Object.fromEntries(keys.filter((k) => typeof u?.[k] === "string").map((k) => [k, u[k]]));
  const users = (Array.isArray(c?.loggedInUsers) ? c.loggedInUsers : []).map((u) => pick(u, ["host", "login", "kind"])).filter((u) => u.host && u.login);
  const last = pick(c?.lastLoggedInUser, ["host", "login"]);
  if (users.length === 0) return null;
  return { loggedInUsers: users, lastLoggedInUser: last.host && last.login ? last : { host: users[0].host, login: users[0].login } };
}

/** Files under `dir` (up to 2 MB each) whose text holds a token; their relative paths. */
export function tokenFiles(dir) {
  const out = [];
  const walk = (d) => {
    let entries;
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else
        try {
          if (statSync(p).size <= 2_000_000 && new RegExp(TOKEN_PATTERN.source).test(readFileSync(p, "latin1"))) out.push(p.slice(dir.length + 1));
        } catch {
          // unreadable: skipped
        }
    }
  };
  walk(dir);
  return out;
}

// --- Host process ---------------------------------------------------------------------------------

/**
 * The Copilot CLI executable: `SDD_EVAL_COPILOT_BIN`, else the native binary of the npm install that the
 * `copilot` of PATH starts (`node_modules/@github/copilot/node_modules/@github/copilot-<platform>-<arch>/`).
 */
export function resolveCopilotBin(env = process.env) {
  const configured = env[COPILOT_BIN_VAR];
  if (configured && configured.trim() !== "") {
    if (!existsSync(configured.trim())) throw new Error(`${COPILOT_BIN_VAR} names no file: ${configured}`);
    return configured.trim();
  }
  const pathKey = Object.keys(env).find((k) => k.toUpperCase() === "PATH") ?? "PATH";
  const native = `copilot-${process.platform}-${process.arch}`;
  for (const d of String(env[pathKey] ?? "").split(delimiter).filter(Boolean)) {
    if (!existsSync(join(d, WIN ? "copilot.cmd" : "copilot"))) continue;
    const exe = join(d, "node_modules", "@github", "copilot", "node_modules", "@github", native, WIN ? "copilot.exe" : "copilot");
    if (existsSync(exe)) return exe;
  }
  throw new Error(`Copilot CLI not found: install it (npm install -g @github/copilot) or set ${COPILOT_BIN_VAR} to the copilot executable`);
}

/** The version `copilot --version` prints (`GitHub Copilot CLI 1.0.98.` → `1.0.98`). */
export function readCopilotVersion(bin, env = process.env) {
  const r = spawnSync(bin, ["--version"], { encoding: "utf8", env, windowsHide: true, timeout: 60_000 });
  const v = /(\d+\.\d+\.\d+)/.exec(r.stdout ?? "")?.[1];
  if (r.error || r.status !== 0 || !v) throw new Error(`cannot read the version of ${bin}: ${r.error?.message ?? (r.stderr || r.stdout || `exit ${r.status}`)}`);
  return v;
}

/** Ends a process and its children (MCP servers, hooks). */
function killTree(child) {
  if (!child.pid || child.exitCode !== null) return;
  if (WIN) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
  else child.kill("SIGKILL");
}

/**
 * The real host: Copilot CLI as a child process. `version()` reads its version; `run({ bin, args, cwd,
 * env, onEvent, signal })` starts it and calls `onEvent` with each JSON event of standard output;
 * resolves `{ exitCode, stderr }`.
 */
export function cliHost({ bin } = {}) {
  let exe;
  const resolve = () => (exe ??= bin ?? resolveCopilotBin());
  return {
    paid: true,
    version: (env) => readCopilotVersion(resolve(), env),
    run({ args, cwd, env, onEvent, signal }) {
      return new Promise((done, fail) => {
        let child;
        try {
          child = spawn(resolve(), args, { cwd, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
        } catch (e) {
          fail(e);
          return;
        }
        let stderr = "";
        child.stderr.on("data", (c) => (stderr = (stderr + c).slice(-20_000)));
        const lines = createInterface({ input: child.stdout });
        lines.on("line", (line) => {
          if (!line.trim()) return;
          let ev;
          try {
            ev = JSON.parse(line);
          } catch {
            ev = { type: "stdout.text", data: { text: line } };
          }
          onEvent(ev);
        });
        const abort = () => killTree(child);
        if (signal?.aborted) abort();
        signal?.addEventListener("abort", abort, { once: true });
        child.on("error", fail);
        child.on("close", (code) => {
          signal?.removeEventListener("abort", abort);
          done({ exitCode: code, stderr });
        });
      });
    },
  };
}

/**
 * The environment of the host process: the caller's variables without credentials and provider
 * settings, then the run's own (`COPILOT_HOME`, auto-update off, workspace hooks in prompt mode,
 * SERENA_HOME and LOCALAPPDATA in the run folder, `sdd` on PATH), then the case's (a case PATH replaces
 * the PATH, as on OpenCode), then `extra` (the runner tests).
 */
export function hostEnv({ runDir, home, scripts, caseEnv = {}, extra = {}, base = process.env }) {
  const env = Object.fromEntries(Object.entries(base).filter(([k]) => !DROPPED_VARS.test(k)));
  const pathKey = Object.keys(env).find((k) => k.toUpperCase() === "PATH") ?? "PATH";
  const bindir = join(runDir, "bin");
  mkdirSync(bindir, { recursive: true });
  for (const exe of ["sdd", "sdd-mcp"]) {
    writeFileSync(join(bindir, exe), `#!/bin/sh\nexec "${process.execPath.replace(/\\/g, "/")}" "${join(scripts, `${exe}.mjs`).replace(/\\/g, "/")}" "$@"\n`, { mode: 0o755 });
    if (WIN) writeFileSync(join(bindir, `${exe}.cmd`), `@"${process.execPath}" "${join(scripts, `${exe}.mjs`)}" %*\r\n`);
  }
  const local = join(runDir, "localappdata");
  mkdirSync(local, { recursive: true });
  Object.assign(env, {
    [pathKey]: `${bindir}${delimiter}${env[pathKey] ?? ""}`,
    COPILOT_HOME: home,
    COPILOT_AUTO_UPDATE: "false",
    GITHUB_COPILOT_PROMPT_MODE_REPO_HOOKS: "true",
    NO_COLOR: "1",
    SERENA_HOME: join(runDir, "serena-home"),
    ...(WIN ? { LOCALAPPDATA: local } : {}),
  });
  const casePathKey = Object.keys(caseEnv).find((k) => k.toUpperCase() === "PATH");
  for (const [k, v] of Object.entries(caseEnv)) if (k !== casePathKey && !DROPPED_VARS.test(k)) env[k] = v;
  if (casePathKey) env[pathKey] = caseEnv[casePathKey];
  return { ...env, ...extra };
}

/** The Copilot CLI arguments of one session (C002-IF-010 §4 plus the runner's own options). */
export function cliArgs({ text, agent, copy, serversFile, maxAiCredits, model, allow = [], logDir, usageFile }) {
  return [
    "-p",
    text,
    "--agent",
    agent,
    "--plugin-dir",
    copy,
    "--additional-mcp-config",
    `@${serversFile}`,
    "--output-format",
    "json",
    "--no-ask-user",
    "--no-auto-update",
    "--disable-builtin-mcps",
    "--max-ai-credits",
    String(maxAiCredits),
    "--usage-output-file",
    usageFile,
    "--log-dir",
    logDir,
    ...(model ? ["--model", model] : []),
    ...allow,
  ];
}

/** `--max-ai-credits` for a spend cap in USD (at least the host's minimum). */
export const maxAiCredits = (maxBudgetUsd) => Math.max(MIN_AI_CREDITS, Math.round(maxBudgetUsd / USD_PER_CREDIT));

// --- Transcript ---------------------------------------------------------------------------------

/** The text of a hook deny: `Denied by preToolUse hook from "<source>" (hook errored)` → its source. */
export function hookDenySource(error) {
  const m = /Denied by preToolUse hook from "([^"]*)"/i.exec(String(error?.message ?? ""));
  return m ? m[1] : null;
}

/** Spend-cap text of the host (the `--max-ai-credits` session limit). */
const LIMIT_TEXT = /session limit|ai credit limit|max-ai-credits|limits? (?:has been |was )?reached/i;

/**
 * The transcript records of one Copilot CLI session in the Agent SDK's shape (assert.mjs, metrics.mjs):
 * an assistant record per `assistant.message` (text and tool_use blocks, `parent_tool_use_id` the
 * subagent's task call), a user record per `tool.execution_complete`, `task_started` and
 * `task_notification` system records per subagent, and harness `denied` records for calls a hook
 * denied. `names`: "host" keeps Copilot CLI's tool names and inputs, "source" maps them back.
 */
export function toTranscript(events, { t0, names = "source", architect = [], table = copilotTable(), sessionAgent = "architect:sdd-conductor" } = {}) {
  const records = [];
  const rel = (ts) => Math.max(0, (Date.parse(ts ?? "") || t0) - t0);
  const agents = new Map(); // agentId → { name, toolCallId }
  const calls = new Map(); // toolCallId → { tool, agent }
  const who = (agentId) => (agentId ? (agents.get(agentId)?.name ?? "subagent") : agentName(sessionAgent, architect));
  for (const ev of events) {
    const d = ev.data ?? {};
    const t = rel(ev.timestamp);
    if (ev.type === "subagent.started") {
      const name = agentName(d.agentName ?? d.agentType, architect);
      agents.set(ev.agentId, { name, toolCallId: d.toolCallId });
      records.push({ t, type: "sdk", message: { type: "system", subtype: "task_started", task_id: ev.agentId, subagent_type: name, host_agent: d.agentName ?? null, model: d.model ?? null, tool_use_id: d.toolCallId } });
    } else if (ev.type === "subagent.completed" || ev.type === "subagent.failed") {
      records.push({ t, type: "sdk", message: { type: "system", subtype: "task_notification", task_id: ev.agentId, status: ev.type === "subagent.failed" ? "failed" : "completed", usage: { total_tokens: d.totalTokens ?? null, tool_uses: d.totalToolCalls ?? null, duration_ms: d.durationMs ?? null }, ...(d.error ? { error: redact(typeof d.error === "string" ? d.error : JSON.stringify(d.error)) } : {}) } });
    } else if (ev.type === "assistant.message") {
      const content = [];
      if (String(d.content ?? "").trim() !== "") content.push({ type: "text", text: redact(d.content) });
      for (const r of d.toolRequests ?? []) {
        const { name, input } = mapCall(r.name, r.arguments, { names, architect, table });
        const agent = who(ev.agentId);
        calls.set(r.toolCallId, { tool: r.name, agent, input });
        content.push({ type: "tool_use", id: r.toolCallId, name, input, host_tool: r.name, agent });
      }
      records.push({ t, type: "sdk", message: { type: "assistant", parent_tool_use_id: d.parentToolCallId ?? null, ...(ev.agentId ? { agent_id: ev.agentId } : {}), agent: who(ev.agentId), message: { id: d.messageId, role: "assistant", model: d.model ?? "unknown", content, usage: { input_tokens: 0, output_tokens: d.outputTokens ?? 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } } });
    } else if (ev.type === "tool.execution_complete") {
      const call = calls.get(d.toolCallId);
      const source = d.success ? null : hookDenySource(d.error);
      const text = d.success ? String(d.result?.content ?? "") : String(d.error?.message ?? "");
      const block = { type: "tool_result", tool_use_id: d.toolCallId, content: redact(text), is_error: !d.success, ...(source !== null ? { not_run: true, denied_by: "hook", hook_source: source } : {}) };
      records.push({ t, type: "sdk", message: { type: "user", parent_tool_use_id: d.parentToolCallId ?? null, message: { role: "user", content: [block] } } });
      if (source !== null) {
        const { name, input } = mapCall(call?.tool ?? "unknown", call?.input ?? {}, { names, architect, table });
        records.push({ t, type: "harness", event: "denied", by: "hook", hook_source: source, tool: name, host_tool: call?.tool ?? null, agent: call?.agent ?? who(ev.agentId), input });
      } else if (!d.success && /permission denied/i.test(text)) {
        const { name, input } = mapCall(call?.tool ?? "unknown", call?.input ?? {}, { names, architect, table });
        records.push({ t, type: "harness", event: "denied", by: "permission", tool: name, host_tool: call?.tool ?? null, agent: call?.agent ?? who(ev.agentId), input });
      }
    }
  }
  return records;
}

const SUBTYPE = { completed: "success", "turn cap": "error_max_turns", "spend cap": "error_max_budget_usd", "question unanswerable": "error_during_execution", error: "error_during_execution" };

/**
 * Measured units of `--usage-output-file` (`totalNanoAiu`, premium requests, tokens per model) and the
 * estimate in USD (credits × USD_PER_CREDIT). `credits` null when the host reports none.
 */
export function usageOf(file) {
  if (!file || !existsSync(file)) return null;
  let u;
  try {
    u = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
  const available = u.aiCreditsStatus !== "unavailable" && typeof u.totalNanoAiu === "number";
  const credits = available ? u.totalNanoAiu / 1e9 : null;
  const models = {};
  for (const [model, m] of Object.entries(u.modelMetrics ?? {})) {
    const c = typeof m.totalNanoAiu === "number" && available ? m.totalNanoAiu / 1e9 : null;
    models[model] = {
      requests: m.requests?.count ?? null,
      input_tokens: m.usage?.inputTokens ?? 0,
      output_tokens: m.usage?.outputTokens ?? 0,
      cache_read_tokens: m.usage?.cacheReadTokens ?? 0,
      cache_write_tokens: m.usage?.cacheWriteTokens ?? 0,
      ai_credits: c,
      usd_estimate: c === null ? null : Math.round(c * USD_PER_CREDIT * 1e6) / 1e6,
    };
  }
  return {
    source: "copilot --usage-output-file",
    ai_credits: credits,
    nano_aiu: available ? u.totalNanoAiu : null,
    ai_credits_status: u.aiCreditsStatus ?? null,
    premium_requests: u.totalPremiumRequestCost ?? null,
    usd_estimate: credits === null ? null : Math.round(credits * USD_PER_CREDIT * 1e6) / 1e6,
    usd_estimate_rule: `AI Credits × ${USD_PER_CREDIT} USD (test plan §4.4)`,
    models,
  };
}

// --- Session --------------------------------------------------------------------------------------

/**
 * One eval session on Copilot CLI. `options` are the `runSession` options (session.mjs) plus `names`
 * ("host" | "source"). `deps.host` replaces the host process (the stub host of the runner tests);
 * `deps.identity` the login identity, `deps.pkg` the package, `deps.scripts` the sdd scripts folder and
 * `deps.extraEnv` variables added last (tests).
 * @param {Record<string, any>} options
 * @param {{ host?: any, identity?: any, extraEnv?: Record<string, string>, table?: any, pkg?: string, scripts?: string }} [deps]
 */
export async function runCopilotCliSession(options, deps = {}) {
  const { cwd, prompt, agent, maxTurns = 30, maxBudgetUsd = 0.5, model, allowTools = [], names = "source" } = options;
  const host = deps.host ?? cliHost();
  const table = deps.table ?? copilotTable();
  const caps = createCaps({ maxTurns, maxBudgetUsd });
  const t0 = Date.now();
  const harness = [];
  const stamp = (record) => harness.push({ t: Date.now() - t0, type: "harness", ...record });
  const runDir = mkdtempSync(join(tmpdir(), "sdd-eval-cp-run-"));
  const events = [];
  let endReason = null;
  let error = null;
  let version = null;
  let started = false;
  let usage = null;
  let architect = [];
  const stopper = new AbortController();
  const end = (reason) => {
    if (endReason === null) endReason = reason;
    if (!stopper.signal.aborted) stopper.abort();
  };
  let start = { agent: hostAgent(agent), text: String(prompt ?? "") };
  try {
    const identity = deps.identity !== undefined ? deps.identity : loginIdentity();
    if ((host.paid || host.credential) && !identity) throw new Error("no Copilot CLI login: run `copilot login` once (P-01); the runner copies the login identity, never a token");
    const pkg = deps.pkg ?? copilotPackage(options.targetPackage);
    architect = architectAgents(pkg);
    const { copy, install } = prepareWorkspace(cwd, pkg, runDir);
    stamp({ event: "install", package: "package copy in the run folder", output: install });
    start = sessionStart(agent, prompt, copy);
    if (start.relay) stamp({ event: "relay", agent: start.agent, note: "eval relay has no Copilot CLI counterpart: the specialist runs as the session agent" });
    if (start.promptFile) stamp({ event: "prompt-file", file: start.promptFile, note: "Copilot CLI -p does not expand slash commands; the prompt file's body is the prompt" });
    const scripts = deps.scripts ?? sddScripts();
    const serversFile = join(runDir, "mcp-servers.json");
    writeFileSync(serversFile, JSON.stringify(serversConfig(copy, scripts, options.mcpOverrides), null, 2) + "\n");
    const home = join(runDir, "copilot-home");
    mkdirSync(home, { recursive: true });
    writeFileSync(join(home, "config.json"), JSON.stringify(identity ?? {}, null, 2) + "\n");
    const env = hostEnv({ runDir, home, scripts, caseEnv: options.env ?? {}, extra: deps.extraEnv ?? {} });
    version = host.version(env);
    const tested = testedVersion();
    stamp({ event: "host", target: TARGET, host_versions: { "copilot-cli": version }, tested, ...(version !== tested ? { note: `Copilot CLI ${version} is not the tested ${tested}` } : {}) });
    const logDir = join(runDir, "logs");
    const usageFile = join(runDir, "usage.json");
    const allow = allowToolArgs(allowTools, { table, mode: options.targetPackage?.mode ?? table.enforcement_mode });
    const args = cliArgs({ text: start.text, agent: start.agent, copy, serversFile, maxAiCredits: maxAiCredits(maxBudgetUsd), model, allow, logDir, usageFile });
    // The command line without the prompt text and the run folder's paths (the case's own data).
    stamp({ event: "start", agent: start.agent, flags: args.filter((a, i) => a.startsWith("--") || args[i - 1] === "--agent" || args[i - 1] === "--max-ai-credits" || args[i - 1] === "--model") });
    started = true;
    const timer = setTimeout(() => {
      error = `session exceeded ${SESSION_TIMEOUT_MS / 60000} minutes`;
      end("error");
    }, SESSION_TIMEOUT_MS);
    let r;
    try {
      r = await host.run({
        args,
        cwd,
        env,
        signal: stopper.signal,
        usageFile,
        onEvent(ev) {
          events.push(ev);
          const d = ev.data ?? {};
          if (ev.type === "assistant.message" && !ev.agentId) {
            const reason = caps.turn(null);
            if (reason) {
              stamp({ event: "cap", reason, usage: caps.usage() });
              end(reason);
            }
          }
          if (ev.type === "session.error" || ev.type === "session.warning" || (ev.type === "session.info" && d.infoType !== "model_retry")) {
            const text = String(d.message ?? "");
            if (LIMIT_TEXT.test(text)) {
              stamp({ event: "cap", reason: "spend cap", host_text: redact(text) });
              if (endReason === null) endReason = "spend cap";
            } else if (ev.type === "session.error" && error === null) error = redact(text);
          }
        },
      });
    } finally {
      clearTimeout(timer);
    }
    usage = usageOf(usageFile);
    // The host's limit blocks the next model call; a session whose measured credits reached it ended there.
    const limit = maxAiCredits(maxBudgetUsd);
    if (endReason === null && usage?.ai_credits !== null && usage?.ai_credits !== undefined && usage.ai_credits + 1e-9 >= limit) {
      stamp({ event: "cap", reason: "spend cap", ai_credits: usage.ai_credits, limit });
      endReason = "spend cap";
    }
    if (r && r.exitCode !== 0 && endReason === null && error === null) error = redact(`Copilot CLI exit ${r.exitCode}: ${String(r.stderr ?? "").trim().slice(-800)}`);
    const log = existsSync(logDir) ? readdirSync(logDir).filter((f) => f.endsWith(".log")).map((f) => readFileSync(join(logDir, f), "utf8")).join("\n") : "";
    stamp({ event: "hooks", workspace_hooks_loaded: /Loading repo hooks in prompt mode/.test(log), hook_deny_sources: [...new Set(events.filter((e) => e.type === "tool.execution_complete").map((e) => hookDenySource(e.data?.error)).filter(Boolean))] });
    const leaked = tokenFiles(home);
    if (leaked.length > 0) {
      error = `credential text found in the temporary Copilot home (${leaked.length} file(s)); the session is not valid evidence`;
      stamp({ event: "credential-in-home", files: leaked.length });
      end("error");
    }
  } catch (e) {
    error = redact(e instanceof Error ? e.message : String(e));
    stamp({ event: "error", message: error });
  } finally {
    if (!process.env.SDD_EVAL_KEEP_RUN) rmSync(runDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    else stamp({ event: "run-dir", path: runDir });
  }
  if (!started && error !== null) throw new Error(`Copilot CLI eval session not started: ${error}`);
  if (endReason === null) endReason = error ? "error" : "completed";
  if (error && endReason === "error" && !harness.some((h) => h.event === "error")) stamp({ event: "error", message: error });
  const usd = usage?.usd_estimate ?? null;
  if (usd !== null) caps.spend(usd);
  const transcript = [...toTranscript(events, { t0, names, architect, table, sessionAgent: start.agent }), ...harness].sort((a, b) => a.t - b.t);
  const lastText = [...events].reverse().find((e) => e.type === "assistant.message" && !e.agentId && String(e.data?.content ?? "").trim() !== "")?.data?.content ?? "";
  const modelUsage = {};
  for (const [m, u] of Object.entries(usage?.models ?? {})) modelUsage[m] = { inputTokens: u.input_tokens, outputTokens: u.output_tokens, cacheReadInputTokens: u.cache_read_tokens, cacheCreationInputTokens: u.cache_write_tokens, costUSD: u.usd_estimate ?? 0 };
  const sessionModels = [...new Set(events.filter((e) => e.type === "assistant.message" && e.data?.model).map((e) => e.data.model))];
  const result = { type: "result", subtype: SUBTYPE[endReason], result: redact(lastText), total_cost_usd: usd ?? 0, num_turns: caps.usage().turns, duration_api_ms: null, modelUsage };
  transcript.push({ t: Date.now() - t0, type: "sdk", message: result });
  return {
    transcript,
    answers: [],
    result,
    wallMs: Date.now() - t0,
    auth: null,
    apiKeySource: host.paid || host.credential ? API_KEY_SOURCE : null,
    target: TARGET,
    host_versions: { "copilot-cli": version },
    end_reason: endReason,
    usage: { turns: caps.usage().turns, usd },
    spend: usd !== null ? "reported" : "unreported",
    provider: host.paid ? PROVIDER : "stub",
    models: Object.keys(modelUsage).length > 0 ? Object.keys(modelUsage) : sessionModels,
    copilot_usage: usage,
    ...(error ? { error } : {}),
  };
}
