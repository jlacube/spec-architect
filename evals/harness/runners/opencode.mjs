// OpenCode eval runner (C002-COMP-009, C002-IF-010; C002-T-044): runs one eval session of the existing
// case API (`runSession` options of session.mjs, unchanged) on the OpenCode target package, through the
// session driver of C002-T-042 (../opencode/driver.mjs: `opencode serve` of the pinned host binary, a
// database of its own, the JS SDK of the same release).
//
// Per session:
//   - the generated OpenCode package (the OpenCode table's enforcement mode) is placed in the case's
//     workspace as INSTALL.md says: `.opencode/` copied, `opencode.json` merged; the `sdd` and `sdd-mcp`
//     commands of its MCP servers run the staged architect-sdd package of this repository
//     (dist/npm/architect-sdd, `npm run package`) with this Node.js, as `npm install -g architect-sdd`
//     would provide them; the same two names are on the host's PATH for its shell;
//   - the host process gets its own config, data, cache and state folders under the run folder (no
//     credential store and no auth.json is read), SERENA_HOME and LOCALAPPDATA in the run folder, and the
//     OpenRouter key from the key file of the driver (`paid`), which refuses the session without it;
//   - the case's agent name loses its `architect:` prefix; a `/architect:<name> <args>` or
//     `/architect-<name> <args>` prompt runs that server command (`session.command`); the eval relay
//     `architect:eval-dispatcher` ("Dispatch: <agent>" + brief) has no OpenCode counterpart, so the
//     specialist is prompted with the brief as the session's agent (recorded as `relay: "direct"`);
//   - permission requests are answered by the case's `allowTools` (Claude Code names, translated with
//     the OpenCode mapping table); read-only requests are allowed, `external_directory` never;
//   - `question` calls are answered from the case's `answer(question, call)` through `question.reply`,
//     or dismissed with `question.reject` when it returns `{ reject: true }`; a call it does not cover
//     (no answer) ends the session with `question unanswerable` (C002-IF-010 §4);
//   - the caps of ../caps.mjs end the session at `maxTurns` turns (assistant steps of the main session)
//     or at `maxBudgetUsd` (spend of every step, subagents included, from the steps' `cost`); a host that
//     reports no spend leaves the turn cap alone (`spend: "unreported"`).
//
// Session result (C002-IF-010 §3): the shape the graders read (`transcript` of `{ t, type: "sdk",
// message }` and `{ t, type: "harness", event }` records, `answers`, `result`, `wallMs`) plus `target`,
// `host_versions`, `end_reason`, `usage`, `provider` and `models`. Tool names: a case written for the
// OpenCode host (its `host` field is "opencode") reads OpenCode's names (`question`,
// `sdd-shell_run_command`, …), as the case files of C002-T-037 and C002-T-038 expect; every other case
// reads the Claude Code names mapped back through the table (`question` → AskUserQuestion,
// `sdd-files_write_file` → Write, `task` → Agent with `architect:<agent>`, …), as C002-IF-010 §3 states.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createCaps } from "../caps.mjs";

// The repository root: the first folder up from this module that holds the OpenCode table (also when a
// test bundles this module elsewhere in the repository).
const ROOT = (() => {
  let dir = import.meta.dirname;
  for (;;) {
    if (existsSync(join(dir, "plugins", "architect", "targets", "opencode.json"))) return dir;
    const up = dirname(dir);
    if (up === dir) return join(import.meta.dirname, "..", "..", "..");
    dir = up;
  }
})();
const WIN = process.platform === "win32";
export const TARGET = "opencode";
/** Provider of the OpenCode eval sessions (test plan E-OCE). */
export const PROVIDER = "openrouter";
/** Wall-clock limit of one session (a hung host must not hold the run). */
const SESSION_TIMEOUT_MS = 20 * 60_000;

/** The OpenCode mapping table (C002-IF-001). */
export function openCodeTable(root = ROOT) {
  return JSON.parse(readFileSync(join(root, "plugins", "architect", "targets", "opencode.json"), "utf8"));
}

/** The tested OpenCode version of the table. */
export const testedVersion = (table = openCodeTable()) => table.host.tested_versions.opencode;

const READ_ONLY = new Set(["read", "glob", "grep", "list", "lsp", "todowrite", "todoread", "codesearch"]);

/**
 * Name mapping of the table for `mode`: `toHost(claudeTool)` → OpenCode tool names; `toSource(hostTool)`
 * → the Claude Code name (null when the table has none). Built-in and MCP tool names both map
 * (`{server}_{tool}` ↔ `mcp__plugin_architect_{server}__{tool}`); the `-` spelling of the sdd servers'
 * tools (`sdd-files-write_file`) maps as the `_` one does. Tools of every mode map back, so that a call
 * under the other mode's name is still reported by its source name.
 */
export function nameMaps(table = openCodeTable(), mode = table.enforcement_mode) {
  const forward = new Map();
  const back = new Map();
  for (const [source, entry] of Object.entries(table.tools)) {
    const byMode = Array.isArray(entry) ? { [mode]: entry } : entry.by_mode;
    forward.set(source, byMode[mode] ?? []);
    for (const names of Object.values(byMode)) for (const n of names) if (!back.has(n)) back.set(n, source);
  }
  forward.set("Agent", table.agent_start?.tools ?? ["task"]);
  forward.set("Task", table.agent_start?.tools ?? ["task"]);
  for (const n of table.agent_start?.tools ?? ["task"]) back.set(n, "Agent");
  const servers = Object.keys(table.mcp_servers ?? {});
  const mcpSource = (server, tool) => table.mcp_tool_names.source_pattern.replace("{server}", server).replace("{tool}", tool);
  const mcpTarget = (server, tool) => table.mcp_tool_names.target_pattern.replace("{server}", server).replace("{tool}", tool);
  return {
    toHost(tool) {
      if (forward.has(tool)) return forward.get(tool);
      const m = /^mcp__plugin_architect_(.+?)__(.+)$/.exec(tool);
      return m ? [mcpTarget(m[1], m[2])] : [];
    },
    toSource(tool) {
      if (back.has(tool)) return back.get(tool);
      const dashed = /^(sdd-files|sdd-shell)-(.+)$/.exec(tool);
      if (dashed && back.has(`${dashed[1]}_${dashed[2]}`)) return back.get(`${dashed[1]}_${dashed[2]}`);
      for (const s of servers) if (tool.startsWith(`${s}_`)) return mcpSource(s, tool.slice(s.length + 1));
      return null;
    },
  };
}

/** The OpenCode agent name of a case's agent (`architect:sdd-critic` → `sdd-critic`). */
export const hostAgent = (agent) => (agent ? String(agent).replace(/^architect:/, "") : undefined);

/**
 * What the session starts with: `{ agent, command: { name, arguments } }` for a command prompt,
 * `{ agent, text, relay }` otherwise. The eval relay's "Dispatch: <agent>" prompt names the agent.
 */
export function sessionStart(agent, prompt) {
  const text = String(prompt ?? "");
  if (agent === "architect:eval-dispatcher") {
    const m = /^Dispatch:\s*(\S+)\r?\n([\s\S]*)$/.exec(text);
    if (m) return { agent: hostAgent(m[1]), text: m[2], relay: "direct" };
  }
  const cmd = /^\/architect[:-]([a-z][a-z0-9-]*)(?:\s+([\s\S]*))?$/.exec(text.trim());
  if (cmd) return { agent: hostAgent(agent), command: { name: `architect-${cmd[1]}`, arguments: (cmd[2] ?? "").trim() } };
  return { agent: hostAgent(agent), text };
}

/** Claude Code input of a mapped call (the host's keys kept beside the source keys). */
function sourceInput(source, input) {
  const i = input && typeof input === "object" ? input : {};
  switch (source) {
    case "Write":
      return { ...i, file_path: i.file_path ?? i.filePath ?? i.path, content: i.content };
    case "Edit":
      return { ...i, file_path: i.file_path ?? i.filePath ?? i.path, old_string: i.old_string ?? i.oldString ?? i.old_text, new_string: i.new_string ?? i.newString ?? i.new_text };
    case "Read":
      return { ...i, file_path: i.file_path ?? i.filePath ?? i.path };
    case "Agent":
      return { ...i, subagent_type: i.subagent_type ? `architect:${hostAgent(i.subagent_type)}` : i.subagent_type };
    case "AskUserQuestion":
      return { ...i, questions: (i.questions ?? []).map((q) => ({ ...q, multiSelect: q.multiSelect ?? q.multiple ?? false })) };
    default:
      return i;
  }
}

// --- Answers and permissions ----------------------------------------------------------------------

/**
 * The SDK reply for one `question` request from the case's answer policy:
 * `{ kind: "reply", answers }` (one label array per question; `[]` when every answer is an empty list),
 * `{ kind: "reject" }` when the policy dismisses the call (`{ reject: true }`), or
 * `{ kind: "unanswerable", question }` when the policy gives no answer for a question.
 */
export function replyFor(questions, answer, call) {
  const per = [];
  for (const q of questions) {
    let a;
    try {
      a = answer(q, call);
    } catch {
      a = undefined;
    }
    if (a && typeof a === "object" && !Array.isArray(a) && a.reject === true) return { kind: "reject" };
    if (Array.isArray(a)) per.push(a.map(String));
    else if (typeof a === "string" && a !== "") per.push([a]);
    else return { kind: "unanswerable", question: q.question ?? q.header ?? "" };
  }
  return { kind: "reply", answers: per.every((p) => p.length === 0) ? [] : per };
}

/**
 * The reply to an OpenCode permission request under the case's `allowTools` (Claude Code names):
 * "once" or "reject". `edit` stands for every file tool, `task` for Agent; read-only permissions are
 * allowed (Claude Code does not ask for them); `external_directory` and `doom_loop` are refused.
 */
export function permissionReply(permission, allowTools, maps) {
  const p = String(permission ?? "");
  if (READ_ONLY.has(p)) return "once";
  if (p === "external_directory" || p === "doom_loop") return "reject";
  const allowed = new Set(allowTools);
  const wants = p === "edit" ? ["Write", "Edit", "MultiEdit", "NotebookEdit"] : p === "bash" ? ["Bash", "PowerShell"] : p === "task" ? ["Agent", "Task"] : p === "question" ? ["AskUserQuestion"] : [maps.toSource(p) ?? p];
  if (wants.includes("AskUserQuestion")) return "once";
  return wants.some((w) => allowed.has(w)) ? "once" : "reject";
}

// --- Transcript ---------------------------------------------------------------------------------

const usageOf = (tokens = {}) => ({
  input_tokens: tokens.input ?? 0,
  output_tokens: tokens.output ?? 0,
  cache_read_input_tokens: tokens.cache?.read ?? 0,
  cache_creation_input_tokens: tokens.cache?.write ?? 0,
});

/**
 * The transcript records of one OpenCode session (root messages and child sessions), in the Agent
 * SDK's shape (assert.mjs, metrics.mjs): an assistant record per assistant message (text and tool_use
 * blocks), a user record with the tool results, a `task_started` system record per child session.
 * `names`: "host" keeps OpenCode's tool names and inputs, "source" maps them back.
 */
export function toTranscript({ messages, children = [] }, { t0, names = "source", maps = nameMaps() } = {}) {
  const records = [];
  const rel = (ms) => Math.max(0, (Number(ms) || t0) - t0);
  const mapCall = (tool, input) => {
    if (names === "host") return { name: tool, input };
    const source = maps.toSource(tool);
    return source ? { name: source, input: sourceInput(source, input) } : { name: tool, input };
  };
  // child session → the task call that started it
  const parentCall = new Map();
  const taskCalls = [];
  const all = [{ sessionID: null, messages }, ...children];
  for (const s of all)
    for (const m of s.messages ?? [])
      for (const p of m.parts ?? [])
        if (p.type === "tool" && p.tool === "task") {
          taskCalls.push(p);
          const child = p.state?.metadata?.sessionId ?? p.state?.metadata?.sessionID;
          if (child) parentCall.set(child, p.callID);
        }
  const emit = (msgs, agentId, parentToolUseId) => {
    for (const m of msgs ?? []) {
      const info = m.info ?? {};
      if (info.role !== "assistant") continue;
      const content = [];
      const results = [];
      for (const p of m.parts ?? []) {
        if (p.type === "text" && !p.synthetic && String(p.text ?? "").trim() !== "") content.push({ type: "text", text: p.text });
        if (p.type === "tool") {
          const { name, input } = mapCall(p.tool, p.state?.input ?? {});
          content.push({ type: "tool_use", id: p.callID, name, input, host_tool: p.tool });
          if (p.state?.status === "completed" || p.state?.status === "error")
            results.push({ t: rel(p.state?.time?.end), block: { type: "tool_result", tool_use_id: p.callID, content: p.state.status === "completed" ? String(p.state.output ?? "") : String(p.state.error ?? ""), is_error: p.state.status === "error" } });
        }
      }
      const model = info.providerID && info.modelID ? `${info.providerID}/${info.modelID}` : (info.modelID ?? "unknown");
      records.push({
        t: rel(info.time?.created),
        type: "sdk",
        message: {
          type: "assistant",
          parent_tool_use_id: parentToolUseId,
          ...(agentId ? { agent_id: agentId } : {}),
          message: { id: info.id, role: "assistant", model, content, usage: usageOf(info.tokens) },
          cost_usd: info.cost ?? null,
        },
      });
      if (results.length > 0)
        records.push({ t: Math.max(...results.map((r) => r.t)), type: "sdk", message: { type: "user", parent_tool_use_id: parentToolUseId, message: { role: "user", content: results.map((r) => r.block) } } });
    }
  };
  emit(messages, null, null);
  for (const c of children) {
    const toolUseId = parentCall.get(c.sessionID) ?? `task:${c.sessionID}`;
    const call = taskCalls.find((p) => p.callID === toolUseId);
    const first = (c.messages ?? [])[0]?.info?.time?.created;
    const agent = (c.messages ?? []).find((m) => m.info?.role === "assistant")?.info?.agent ?? call?.state?.input?.subagent_type ?? "subagent";
    records.push({ t: rel(first), type: "sdk", message: { type: "system", subtype: "task_started", task_id: c.sessionID, subagent_type: names === "host" ? agent : `architect:${hostAgent(agent)}`, tool_use_id: toolUseId } });
    emit(c.messages, c.sessionID, toolUseId);
  }
  return records;
}

/** Tokens and cost per model over every assistant message (result `modelUsage`, metrics.mjs). */
function modelUsage(all) {
  const out = {};
  for (const m of all) {
    const info = m.info ?? {};
    if (info.role !== "assistant") continue;
    const model = info.providerID && info.modelID ? `${info.providerID}/${info.modelID}` : (info.modelID ?? "unknown");
    const u = (out[model] ??= { inputTokens: 0, outputTokens: 0, cacheReadInputTokens: 0, cacheCreationInputTokens: 0, costUSD: 0 });
    u.inputTokens += info.tokens?.input ?? 0;
    u.outputTokens += info.tokens?.output ?? 0;
    u.cacheReadInputTokens += info.tokens?.cache?.read ?? 0;
    u.cacheCreationInputTokens += info.tokens?.cache?.write ?? 0;
    u.costUSD += info.cost ?? 0;
  }
  return out;
}

/** One line for the error of an assistant message (`{ name, data: { message, statusCode, … } }`). */
export function messageError(e) {
  if (typeof e === "string") return e;
  const data = e?.data ?? {};
  const status = data.statusCode ? ` (HTTP ${data.statusCode})` : "";
  const text = data.message ?? e?.message ?? JSON.stringify(e);
  return `assistant message error ${e?.name ?? "Error"}${status}: ${String(text).slice(0, 500)}`;
}

const SUBTYPE = { completed: "success", "turn cap": "error_max_turns", "spend cap": "error_max_budget_usd", "question unanswerable": "error_during_execution", error: "error_during_execution" };

// --- Package and project --------------------------------------------------------------------------

const packages = new Map();

/**
 * The OpenCode package generated from plugins/architect (once per process and `targetPackage`), as
 * `npm run generate` writes it. `targetPackage` (case field of C002-T-038): `mode` the enforcement mode
 * (`--mode opencode=<mode>`); `tested_versions` replaces `host.tested_versions` in a copy of the mapping
 * table; `version` is written into the `.claude-plugin/plugin.json` of that copy before generation, so
 * that the manifest's `package_version` and the `{{package_version}}` token both carry it (C002-IF-010
 * §2.1, C002-TS-515; C002-T-064).
 */
export function generatedPackage(targetPackage = {}, root = ROOT) {
  const key = JSON.stringify(targetPackage ?? {});
  if (packages.has(key) && existsSync(packages.get(key))) return packages.get(key);
  const out = mkdtempSync(join(tmpdir(), "sdd-eval-ocpkg-"));
  process.once("exit", () => rmSync(out, { recursive: true, force: true }));
  let source = join(root, "plugins", "architect");
  if (targetPackage?.tested_versions || targetPackage?.version) {
    const copy = join(out, "source");
    cpSync(source, copy, { recursive: true, filter: (p) => !/[\\/]node_modules([\\/]|$)/.test(p) });
    if (targetPackage.tested_versions) {
      const tableFile = join(copy, "targets", "opencode.json");
      const t = JSON.parse(readFileSync(tableFile, "utf8"));
      t.host.tested_versions = { ...t.host.tested_versions, ...targetPackage.tested_versions };
      writeFileSync(tableFile, JSON.stringify(t, null, 2) + "\n");
    }
    if (targetPackage.version) {
      // The version stamp of C002-IF-010 §2.1: the generator takes the package version and the
      // {{package_version}} token from the source manifest (C002-IF-004 Output).
      const manifestFile = join(copy, ".claude-plugin", "plugin.json");
      const m = JSON.parse(readFileSync(manifestFile, "utf8"));
      writeFileSync(manifestFile, JSON.stringify({ ...m, version: targetPackage.version }, null, 2) + "\n");
    }
    source = copy;
  }
  const args = [join(root, "scripts", "generate.mjs"), "--target", "opencode", "--source", source, "--out", join(out, "pkg"), "--quiet"];
  if (targetPackage?.mode) args.push("--mode", `opencode=${targetPackage.mode}`);
  const r = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", windowsHide: true });
  if (r.status !== 0) throw new Error(`generating the OpenCode package failed (exit ${r.status}): ${(r.stderr || r.stdout).slice(-800)}`);
  const dir = join(out, "pkg", "opencode");
  packages.set(key, dir);
  return dir;
}

/** The staged architect-sdd scripts (sdd.mjs and sdd-mcp.mjs side by side), or an error naming the fix. */
export function sddScripts(root = ROOT) {
  const dir = process.env.SDD_EVAL_SDD_SCRIPTS ?? join(root, "dist", "npm", "architect-sdd", "scripts");
  for (const f of ["sdd.mjs", "sdd-mcp.mjs"]) if (!existsSync(join(dir, f))) throw new Error(`OpenCode eval runner: ${join(dir, f)} is missing; run \`npm run package\` (stages dist/npm/architect-sdd) or set SDD_EVAL_SDD_SCRIPTS`);
  return dir;
}

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

/**
 * Places the package in `project` (INSTALL.md steps 1 and 2) and points the MCP server commands
 * `sdd`/`sdd-mcp` at the staged scripts run by this Node.js.
 */
export function placePackage(project, pkg, scripts, mcpOverrides = {}) {
  cpSync(join(pkg, ".opencode"), join(project, ".opencode"), { recursive: true });
  const own = join(project, "opencode.json");
  const adopter = existsSync(own) ? readJson(own) : {};
  const fragment = readJson(join(pkg, "opencode.json"));
  const merged = { ...fragment, ...adopter };
  for (const key of ["agent", "mcp", "tools"]) merged[key] = { ...(adopter[key] ?? {}), ...(fragment[key] ?? {}) };
  for (const server of Object.values(merged.mcp ?? {})) {
    if (server?.type !== "local" || !Array.isArray(server.command)) continue;
    const [exe, ...args] = server.command;
    if (exe === "sdd" || exe === "sdd-mcp") server.command = [process.execPath, join(scripts, `${exe}.mjs`), ...args];
  }
  // A remote server URL replaced for one case (`mcpOverrides`, the cfg-deepwiki-down row of C002-TS-509).
  for (const [name, url] of Object.entries(mcpOverrides ?? {})) if (merged.mcp?.[name]) merged.mcp[name] = { ...merged.mcp[name], url };
  writeFileSync(own, JSON.stringify(merged, null, 2) + "\n");
  return merged;
}

/** `@opencode-ai/plugin` of the tested version, prepared for the replay (if present), linked into `dest`. */
function linkPluginModules(dest, links) {
  const src = join(ROOT, "tests", "replay", "fixtures", "opencode", ".opencode");
  if (!existsSync(join(src, "node_modules", "@opencode-ai", "plugin", "package.json"))) return;
  mkdirSync(dest, { recursive: true });
  for (const f of ["package.json", "package-lock.json"]) if (!existsSync(join(dest, f))) cpSync(join(src, f), join(dest, f));
  const link = join(dest, "node_modules");
  if (existsSync(link)) return;
  symlinkSync(join(src, "node_modules"), link, WIN ? "junction" : "dir");
  links.push(link);
}

function removeLink(path) {
  try {
    if (lstatSync(path).isSymbolicLink()) unlinkSync(path);
  } catch {
    // gone
  }
}

/**
 * The real host: the pinned binary through the driver, paid (OpenRouter key file), with the package in
 * the project. `start({ project, runDir })` → `{ version, run(options), stop() }`.
 */
export function driverHost({ keyFile, bin, start } = {}) {
  return {
    needsPackage: true,
    async start({ project, runDir, env: caseEnv = {} }) {
      // `start` replaces the driver's startOpenCode in the runner tests (C002-TC-907: no opencode serve).
      const startOpenCode = start ?? (await import("../opencode/driver.mjs")).startOpenCode;
      const links = [];
      const xdg = join(runDir, "xdg");
      for (const d of ["config", "data", "cache", "state"]) mkdirSync(join(xdg, d), { recursive: true });
      const global = join(xdg, "config", "opencode");
      mkdirSync(global, { recursive: true });
      writeFileSync(join(global, "opencode.json"), JSON.stringify({ $schema: "https://opencode.ai/config.json", autoupdate: false, share: "disabled", enabled_providers: [PROVIDER] }, null, 2) + "\n");
      linkPluginModules(global, links);
      linkPluginModules(join(project, ".opencode"), links);
      // `sdd` and `sdd-mcp` on the host's PATH (the shell of OpenCode and the commands it starts).
      const scripts = sddScripts();
      const bindir = join(runDir, "bin");
      mkdirSync(bindir, { recursive: true });
      for (const exe of ["sdd", "sdd-mcp"]) {
        writeFileSync(join(bindir, exe), `#!/bin/sh\nexec "${process.execPath.replace(/\\/g, "/")}" "${join(scripts, `${exe}.mjs`).replace(/\\/g, "/")}" "$@"\n`, { mode: 0o755 });
        if (WIN) writeFileSync(join(bindir, `${exe}.cmd`), `@"${process.execPath}" "${join(scripts, `${exe}.mjs`)}" %*\r\n`);
      }
      const pathKey = Object.keys(process.env).find((k) => k.toUpperCase() === "PATH") ?? "PATH";
      const local = join(runDir, "localappdata");
      mkdirSync(local, { recursive: true });
      // A case that sets PATH (a machine configuration, C002-T-038) keeps it as given: the sdd MCP servers
      // run the staged scripts by path, and `sdd` must not appear on a PATH the case left it off; the
      // machine configuration has already placed the PATH lead in it (evals/harness/machines.mjs).
      const casePathKey = Object.keys(caseEnv).find((k) => k.toUpperCase() === "PATH");
      // PATH lead (C002-IF-010 §4, defect D-020 item 4): without a case PATH, the folder of the pinned host
      // binary comes right after the run's own bin folder, so `sdd host-version opencode` in the session
      // reads the tested install before any other `opencode` of the user's PATH.
      const lead = casePathKey ? [] : [dirname(bin ?? (await import("../opencode/driver.mjs")).resolveOpenCodeBinary())];
      const env = {
        [pathKey]: [bindir, ...lead, process.env[pathKey] ?? ""].join(WIN ? ";" : ":"),
        XDG_CONFIG_HOME: join(xdg, "config"),
        XDG_DATA_HOME: join(xdg, "data"),
        XDG_CACHE_HOME: join(xdg, "cache"),
        XDG_STATE_HOME: join(xdg, "state"),
        SERENA_HOME: join(runDir, "serena-home"),
        ...(WIN ? { LOCALAPPDATA: local } : {}),
      };
      for (const [k, v] of Object.entries(caseEnv)) if (k !== casePathKey) env[k] = v;
      if (casePathKey) env[pathKey] = caseEnv[casePathKey];
      let driver;
      try {
        driver = await startOpenCode({ ...(bin ? { bin } : {}), project, runDir, isolate: false, paid: keyFile ? { keyFile } : {}, env });
      } catch (e) {
        for (const l of links) removeLink(l);
        throw e;
      }
      return {
        version: driver.version,
        run: (o) => driver.run(o),
        async stop() {
          try {
            await driver.stop();
          } finally {
            for (const l of links) removeLink(l);
          }
        },
      };
    },
  };
}

// --- Session --------------------------------------------------------------------------------------

function keepRunDir() {
  return Boolean(process.env.SDD_EVAL_KEEP_RUN);
}

/**
 * One eval session on OpenCode. `options` are the `runSession` options (session.mjs) plus `names`
 * ("host" | "source"); `host` is the host factory (default: the pinned binary through the driver).
 * @param {Record<string, any>} options
 * @param {{ host?: { needsPackage?: boolean, start: (o: any) => Promise<any> }, table?: any }} [deps]
 */
export async function runOpenCodeSession(options, { host = driverHost(), table = openCodeTable() } = {}) {
  const { cwd, prompt, agent, answer, allowTools = [], maxTurns = 30, maxBudgetUsd = 0.5, model, names = "source" } = options;
  const maps = nameMaps(table);
  const caps = createCaps({ maxTurns, maxBudgetUsd });
  const t0 = Date.now();
  const harness = [];
  const answers = [];
  const stamp = (record) => harness.push({ t: Date.now() - t0, type: "harness", ...record });
  const start = sessionStart(agent, prompt);
  if (start.relay) stamp({ event: "relay", agent: start.agent, note: "eval relay has no OpenCode counterpart: the specialist runs as the session agent" });
  const runDir = mkdtempSync(join(tmpdir(), "sdd-eval-oc-run-"));
  let endReason = null;
  const stopper = new AbortController();
  const end = (reason) => {
    if (endReason === null) endReason = reason;
    if (!stopper.signal.aborted) stopper.abort();
  };
  const seenSteps = new Set();
  let version = null;
  let h;
  let r = null;
  let error = null;
  try {
    if (host.needsPackage) placePackage(cwd, generatedPackage(options.targetPackage), sddScripts(), options.mcpOverrides);
    h = await host.start({ project: cwd, runDir, env: options.env ?? {} });
    version = h.version;
    stamp({ event: "host", target: TARGET, host_versions: { opencode: version }, tested: testedVersion(table) });
    const modelRef = model ? (/\//.test(model) ? { providerID: model.split("/")[0], modelID: model.split("/").slice(1).join("/") } : undefined) : undefined;
    r = await h.run({
      agent: start.agent,
      ...(start.command ? { command: start.command } : { text: start.text }),
      ...(modelRef ? { model: modelRef } : {}),
      title: `eval ${String(prompt ?? "").slice(0, 40)}`,
      timeoutMs: SESSION_TIMEOUT_MS,
      signal: stopper.signal,
      onEvent(ev, root) {
        const props = ev?.properties ?? {};
        if (ev.type !== "message.part.updated" || props.part?.type !== "step-finish" || seenSteps.has(props.part.id)) return;
        const part = props.part;
        seenSteps.add(part.id);
        const cost = typeof part.cost === "number" && !(part.cost === 0 && (part.tokens?.output ?? 0) > 0) ? part.cost : null;
        const reason = !root || part.sessionID === root ? caps.turn(cost) : caps.spend(cost);
        if (reason) {
          stamp({ event: "cap", reason, usage: caps.usage() });
          end(reason);
        }
      },
      permission(req) {
        const reply = permissionReply(req.permission, allowTools, maps);
        if (reply === "reject") stamp({ event: "denied", tool: names === "host" ? req.permission : (maps.toSource(req.permission) ?? req.permission), input: { patterns: req.patterns ?? [] } });
        return reply;
      },
      question(req) {
        const qs = req.questions ?? [];
        const call = { questions: qs };
        const view = names === "host" ? qs : sourceInput("AskUserQuestion", call).questions;
        const reply = replyFor(view, answer ?? ((q) => q.options?.[0]?.label ?? ""), names === "host" ? call : { questions: view });
        if (reply.kind === "unanswerable") {
          stamp({ event: "unanswerable", questions: view, question: reply.question });
          end("question unanswerable");
          return null;
        }
        const given = {};
        if (reply.kind === "reply") view.forEach((q, i) => (given[q.question] = (reply.answers[i] ?? []).join(", ")));
        const route = reply.kind === "reply" ? "question.reply" : "question.reject";
        // A dismissed call has no answer: null (C002-IF-010 §3, "AskUserQuestion with null").
        answers.push({ toolUseId: req.tool?.callID ?? null, questions: view, answers: reply.kind === "reply" ? given : null, route });
        stamp({ event: "answer", questions: view, answers: given, route, ...(reply.kind === "reject" ? { dismissed: true } : {}) });
        return reply.kind === "reply" ? reply.answers : null;
      },
    });
    if (r.error && !r.aborted) error = typeof r.error === "string" ? r.error : JSON.stringify(r.error);
    // A provider or host error ends the prompt without a call error: OpenCode stores it on the
    // assistant message (`info.error`, e.g. an OpenRouter APIError) and the message has no parts.
    if (!error && !r.aborted) {
      const failed = (r.messages ?? []).find((m) => m.info?.role === "assistant" && m.info?.error);
      if (failed) error = messageError(failed.info.error);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    stamp({ event: "error", message: error });
  } finally {
    await h?.stop().catch(() => {});
    if (!keepRunDir()) rmSync(runDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    else stamp({ event: "run-dir", path: runDir });
  }
  if (r === null && error !== null && version === null) throw new Error(`OpenCode eval session not started: ${error}`);
  if (endReason === null) endReason = error ? "error" : "completed";
  if (error && endReason === "error") stamp({ event: "error", message: error });
  const messages = r?.messages ?? [];
  const children = r?.children ?? [];
  const transcript = [...toTranscript({ messages, children }, { t0, names, maps }), ...harness].sort((a, b) => a.t - b.t);
  const usage = caps.usage();
  const all = [...messages, ...children.flatMap((c) => c.messages ?? [])];
  const byModel = modelUsage(all);
  const lastText = [...messages].reverse().find((m) => m.info?.role === "assistant" && (m.parts ?? []).some((p) => p.type === "text" && !p.synthetic))?.parts.filter((p) => p.type === "text" && !p.synthetic).map((p) => p.text).join("") ?? "";
  const result = {
    type: "result",
    subtype: SUBTYPE[endReason],
    result: lastText,
    total_cost_usd: usage.usd ?? 0,
    num_turns: usage.turns,
    duration_api_ms: null,
    modelUsage: byModel,
  };
  transcript.push({ t: Date.now() - t0, type: "sdk", message: result });
  return {
    transcript,
    answers,
    result,
    wallMs: Date.now() - t0,
    auth: null,
    apiKeySource: host.needsPackage ? "openrouter-key-file" : null,
    target: TARGET,
    host_versions: { opencode: version },
    end_reason: endReason,
    usage,
    spend: caps.reportsSpend ? "reported" : "unreported",
    provider: host.needsPackage ? PROVIDER : "stub",
    models: Object.keys(byModel),
    ...(error ? { error } : {}),
  };
}
