// `sdd install copilot [--package <dir>]` (C002-IF-007 §Install; C002-REQ-322 … C002-REQ-324,
// C002-REQ-326, C002-REQ-327; sources and targets of C002-IF-005 §3). P-03 runs it in their own
// terminal; the bash guard denies it to every Architect agent (C002-REQ-325).
//
//   1  package   `--package`, else the package that holds the running `scripts/sdd.mjs`; ERR-CLI-022
//                when it cannot be used (manifest, source files with `scripts/sdd.mjs` among them,
//                characters of its absolute path). The agent list comes from the template
//                `install/hooks.template.json`: the one `hook guard` command of its PreToolUse entries
//                and its `--agents` value, which the manifest's `agents/<name>.agent.md` files must match
//                both ways (C002-IF-007 §Install step 1, revised for critic CR-50)
//   2  record    `.github/architect-install.json`; a record that does not parse counts as absent
//   3  recognition: a file or server entry is this command's when the record lists the SHA-256 of
//                its present content
//   4  checks    every target before the first write; one ERR-CLI-021 line per conflict, exit 2
//   5  writes    (a) <package>/hooks.json, (b) .github/hooks/architect-guard.json, (c)
//                <package>/plugin.json, (d) the agents, (e) .vscode/mcp.json, (f) the record — the
//                guard hook before the agents (C002-CON-08); each through a temporary file and a rename
//   6  output    `written|unchanged <path>`, `merged .vscode/mcp.json (<names>)`, then `next: …`
//
// Nothing else in the repository is read or written; `.sdd/` is neither required nor created.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileAtomic } from "../io/atomic.ts";
import { normalisePath } from "../io/paths.ts";
import { findRepositoryRoot } from "../io/repo-root.ts";
import type { CommandContext } from "./commands.ts";
import { CliError } from "./errors.ts";

/** Fixed paths of C002-IF-005 §3 (package) and C002-IF-007 §Install (repository). */
export const PACKAGE_FILES = {
  manifest: "architect-target.json",
  pluginManifest: "install/plugin.json",
  mcp: "install/mcp.json",
  hooksTemplate: "install/hooks.template.json",
  toolClasses: "hooks/tool-classes.json",
  cliCopy: "scripts/sdd.mjs",
  hooks: "hooks.json",
  plugin: "plugin.json",
} as const;
export const REPO_FILES = {
  agentsDir: ".github/agents",
  guardHook: ".github/hooks/architect-guard.json",
  mcp: ".vscode/mcp.json",
  record: ".github/architect-install.json",
} as const;
export const CLI_COPY_TOKEN = "@CLI_COPY@";
export const NEXT_LINE = "next: select sdd-conductor in a Local chat (INSTALL.md step 4)";
const AGENT_FILE = /^agents\/([^/]+\.agent\.md)$/;

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type JsonObject = { [k: string]: Json };

export interface InstallRecord {
  package_version: string;
  agents: Record<string, string>;
  hook_files: Record<string, string>;
  mcp_servers: Record<string, string>;
}

const isObject = (v: unknown): v is JsonObject => typeof v === "object" && v !== null && !Array.isArray(v);

/** `sha256:<hex>` of bytes or text. */
export function sha256(data: string | Uint8Array): string {
  return `sha256:${createHash("sha256").update(data).digest("hex")}`;
}

/** A JSON value serialised with sorted keys and no white space (the hash form of a server entry). */
export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  if (isObject(v))
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(v[k])}`)
      .join(",")}}`;
  return JSON.stringify(v);
}

/** SHA-256 of a server entry (C002-IF-007 §Install step 2). */
export const serverHash = (entry: unknown): string => sha256(canonicalJson(entry));

/** Two-space indentation, LF, final newline. */
const jsonText = (doc: unknown): string => JSON.stringify(doc, null, 2) + "\n";

/**
 * Why an absolute package path cannot be written into a hook command (`"`, `$`, `%`, a backtick or a
 * control character, C002-IF-008 §4), or null.
 */
export function unusablePathReason(path: string): string | null {
  for (const ch of path) {
    const code = ch.codePointAt(0)!;
    if (code < 0x20 || code === 0x7f) return `the path holds the control character U+${code.toString(16).toUpperCase().padStart(4, "0")}, which a hook command cannot carry`;
    if (ch === '"' || ch === "$" || ch === "%" || ch === "`") return `the path holds the character ${ch}, which a hook command cannot carry`;
  }
  return null;
}

/** The file of the running CLI (`<package>/scripts/sdd.mjs` once bundled). */
export function runningCli(): string {
  return fileURLToPath(import.meta.url);
}

const refuse = (path: string, reason: string) => new CliError("ERR-CLI-022", { path, reason });

function readManifest(pkg: string): { target?: unknown; package_version?: unknown; files?: unknown } | string {
  const file = join(pkg, PACKAGE_FILES.manifest);
  if (!existsSync(file)) return `the folder holds no ${PACKAGE_FILES.manifest}`;
  try {
    const doc = JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, "")) as unknown;
    if (!isObject(doc)) return `${PACKAGE_FILES.manifest} is not a JSON object`;
    return doc;
  } catch (e) {
    return `${PACKAGE_FILES.manifest} cannot be parsed: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/** The package folder: `--package` resolved against the working folder, else the running CLI's package. */
function resolvePackage(given: string | undefined, cwd: string, cli: string): string {
  if (given !== undefined) return normalisePath(given, { cwd });
  const file = normalisePath(cli);
  const pkg = dirname(dirname(file));
  const fromPackage = basename(file) === "sdd.mjs" && basename(dirname(file)) === "scripts";
  const manifest = fromPackage ? readManifest(pkg) : null;
  if (manifest === null || typeof manifest === "string" || manifest.target !== "copilot")
    throw refuse(file, "no --package given, and the running CLI is not the scripts/sdd.mjs of a Copilot package");
  return pkg;
}

export interface PackageSources {
  /** Absolute package folder, `/` separators. */
  dir: string;
  version: string;
  /** Agent file names (`sdd-critic.agent.md`) of the guard hook's `--agents` names, in manifest order. */
  agents: string[];
  agentBytes: Map<string, Buffer>;
  pluginManifest: Buffer;
  /** `<package>/hooks.json` text, `@CLI_COPY@` replaced. */
  hooksJson: string;
  /** `.github/hooks/architect-guard.json` text. */
  guardHook: string;
  /** `servers` of `install/mcp.json`. */
  servers: JsonObject;
}

/** Step 1: the package and its source files, or ERR-CLI-022 (nothing read from the repository yet). */
export function loadPackage(given: string | undefined, cwd: string, cli: string = runningCli()): PackageSources {
  const dir = resolvePackage(given, cwd, cli);
  const bad = unusablePathReason(dir);
  if (bad !== null) throw refuse(dir, bad);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) throw refuse(dir, "the folder does not exist");
  const manifest = readManifest(dir);
  if (typeof manifest === "string") throw refuse(dir, manifest);
  if (manifest.target !== "copilot") throw refuse(dir, `${PACKAGE_FILES.manifest} names the target ${JSON.stringify(manifest.target ?? null)}, not "copilot"`);
  if (typeof manifest.package_version !== "string" || manifest.package_version === "") throw refuse(dir, `${PACKAGE_FILES.manifest} gives no package_version`);
  const listed = Array.isArray(manifest.files) ? manifest.files.map((f) => (isObject(f) && typeof f["path"] === "string" ? f["path"] : "")) : [];
  const agents = listed.map((p) => AGENT_FILE.exec(p)?.[1]).filter((n): n is string => n !== undefined);
  if (agents.length === 0) throw refuse(dir, `${PACKAGE_FILES.manifest} lists no agents/<agent name>.agent.md file`);
  const sources = [...agents.map((a) => `agents/${a}`), PACKAGE_FILES.pluginManifest, PACKAGE_FILES.mcp, PACKAGE_FILES.hooksTemplate, PACKAGE_FILES.toolClasses, PACKAGE_FILES.cliCopy];
  const missing = sources.filter((s) => !isFile(join(dir, s)));
  if (missing.length > 0) throw refuse(dir, `source file${missing.length === 1 ? "" : "s"} missing: ${missing.join(", ")}`);

  const parse = (rel: string): unknown => {
    try {
      return JSON.parse(readFileSync(join(dir, rel), "utf8").replace(/^﻿/, "")) as unknown;
    } catch (e) {
      throw refuse(dir, `${rel} cannot be parsed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  const mcp = parse(PACKAGE_FILES.mcp);
  if (!isObject(mcp) || !isObject(mcp["servers"])) throw refuse(dir, `${PACKAGE_FILES.mcp} has no servers object`);
  parse(PACKAGE_FILES.hooksTemplate);
  const cliCopy = `${dir}/${PACKAGE_FILES.cliCopy}`;
  const hooksJson = readFileSync(join(dir, PACKAGE_FILES.hooksTemplate), "utf8").replace(/^﻿/, "").split(CLI_COPY_TOKEN).join(cliCopy);
  const hooks = JSON.parse(hooksJson) as unknown;
  const pre = isObject(hooks) && isObject(hooks["hooks"]) ? hooks["hooks"]["PreToolUse"] : undefined;
  if (!Array.isArray(pre) || pre.length === 0) throw refuse(dir, `${PACKAGE_FILES.hooksTemplate} has no PreToolUse entry`);
  const names = guardAgents(pre);
  if (names === null) throw refuse(dir, `${PACKAGE_FILES.hooksTemplate} has no single hook guard command with --agents`);
  const unlisted = names.filter((n) => !agents.includes(`${n}.agent.md`)).map((n) => `agents/${n}.agent.md`);
  if (unlisted.length > 0) throw refuse(dir, `${PACKAGE_FILES.manifest} does not list ${unlisted.join(", ")}, which --agents names`);
  const unnamed = agents.filter((a) => !names.includes(a.slice(0, -".agent.md".length))).map((a) => `agents/${a}`);
  if (unnamed.length > 0) throw refuse(dir, `${PACKAGE_FILES.manifest} lists ${unnamed.join(", ")}, which --agents does not name`);
  return {
    dir,
    version: manifest.package_version,
    agents,
    agentBytes: new Map(agents.map((a) => [a, readFileSync(join(dir, "agents", a))])),
    pluginManifest: readFileSync(join(dir, PACKAGE_FILES.pluginManifest)),
    hooksJson,
    guardHook: jsonText({ hooks: { PreToolUse: pre } }),
    servers: mcp["servers"],
  };
}

const GUARD_COMMAND = /(?:^|\s)hook\s+guard(?:\s|$)/;

/**
 * The agent names of the template's single `hook guard` command with a non-empty `--agents` value: the
 * word after `--agents`, split at commas, blank names dropped, as the hook splits it (C002-IF-008 §2);
 * null when the PreToolUse entries hold no such command or more than one.
 */
export function guardAgents(preToolUse: unknown[]): string[] | null {
  const found: string[][] = [];
  for (const entry of preToolUse) {
    const command = isObject(entry) ? entry["command"] : undefined;
    if (typeof command !== "string" || !GUARD_COMMAND.test(command)) continue;
    const words = command.trim().split(/\s+/);
    const at = words.indexOf("--agents");
    const value = at >= 0 ? words[at + 1] : words.find((w) => w.startsWith("--agents="))?.slice("--agents=".length);
    const names = (value ?? "").split(",").map((a) => a.trim()).filter((a) => a !== "");
    if (names.length > 0) found.push(names);
  }
  return found.length === 1 ? found[0]! : null;
}

function isFile(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function readIfFile(p: string): Buffer | null {
  return isFile(p) ? readFileSync(p) : null;
}

/** Step 2: the install record; one that does not parse counts as absent, missing maps as empty. */
export function readRecord(repo: string): InstallRecord | null {
  const bytes = readIfFile(join(repo, REPO_FILES.record));
  if (bytes === null) return null;
  let doc: unknown;
  try {
    doc = JSON.parse(bytes.toString("utf8").replace(/^﻿/, ""));
  } catch {
    return null;
  }
  if (!isObject(doc)) return null;
  const map = (v: Json | undefined): Record<string, string> => (isObject(v) ? Object.fromEntries(Object.entries(v).filter((e): e is [string, string] => typeof e[1] === "string")) : {});
  return { package_version: typeof doc["package_version"] === "string" ? doc["package_version"] : "", agents: map(doc["agents"]), hook_files: map(doc["hook_files"]), mcp_servers: map(doc["mcp_servers"]) };
}

interface FilePlan {
  /** Absolute path. */
  abs: string;
  /** Path as printed: repository-relative, or absolute for the package's own files. */
  shown: string;
  bytes: Buffer;
  changed: boolean;
}

interface McpPlan {
  abs: string;
  text: string | null;
  existed: boolean;
  /** Package servers added or replaced. */
  names: string[];
}

interface Plan {
  files: FilePlan[];
  mcp: McpPlan;
  conflicts: CliError[];
}

const conflict = (path: string, reason: string) => new CliError("ERR-CLI-021", { path, reason });
const NOT_OURS = "was not written by sdd install copilot";

/** Steps 3 and 4: what each target receives, and every conflict, before anything is written. */
function plan(pkg: PackageSources, repo: string, record: InstallRecord | null): Plan {
  const conflicts: CliError[] = [];
  const pkgFile = (rel: string, bytes: Buffer): FilePlan => {
    const abs = `${pkg.dir}/${rel}`;
    const present = readIfFile(abs);
    return { abs, shown: abs, bytes, changed: present === null || !present.equals(bytes) };
  };
  const repoFile = (rel: string, bytes: Buffer, recorded: Record<string, string>): FilePlan => {
    const abs = join(repo, rel);
    const present = readIfFile(abs);
    const changed = present === null || !present.equals(bytes);
    if (present !== null && changed && recorded[rel] !== sha256(present)) conflicts.push(conflict(rel, NOT_OURS));
    return { abs, shown: rel, bytes, changed };
  };
  const guardBytes = Buffer.from(pkg.guardHook, "utf8");
  const files: FilePlan[] = [
    pkgFile(PACKAGE_FILES.hooks, Buffer.from(pkg.hooksJson, "utf8")),
    repoFile(REPO_FILES.guardHook, guardBytes, record?.hook_files ?? {}),
    pkgFile(PACKAGE_FILES.plugin, pkg.pluginManifest),
    ...pkg.agents.map((a) => repoFile(`${REPO_FILES.agentsDir}/${a}`, pkg.agentBytes.get(a)!, record?.agents ?? {})),
  ];
  const mcp = planMcp(pkg, repo, record, conflicts);
  return { files, mcp, conflicts };
}

/** `.vscode/mcp.json`: strict JSON, an object with an object `servers`; the package's entries added or replaced. */
function planMcp(pkg: PackageSources, repo: string, record: InstallRecord | null, conflicts: CliError[]): McpPlan {
  const abs = join(repo, REPO_FILES.mcp);
  const present = readIfFile(abs);
  const names = Object.keys(pkg.servers);
  if (present === null) {
    const servers = Object.fromEntries([...names].sort().map((n) => [n, pkg.servers[n]!]));
    return { abs, text: jsonText({ servers }), existed: false, names: [...names].sort() };
  }
  const bad = (detail: string) => {
    conflicts.push(conflict(REPO_FILES.mcp, `cannot be parsed as JSON without comments: ${detail}`));
    return { abs, text: null, existed: true, names: [] };
  };
  let doc: unknown;
  try {
    doc = JSON.parse(present.toString("utf8").replace(/^﻿/, ""));
  } catch (e) {
    return bad(e instanceof Error ? e.message : String(e));
  }
  if (!isObject(doc)) return bad("the top level is not an object");
  const servers = doc["servers"];
  if (servers !== undefined && !isObject(servers)) return bad('"servers" is not an object');
  const existing: JsonObject = servers ?? {};
  const changed: string[] = [];
  for (const n of names) {
    if (!(n in existing)) {
      changed.push(n);
      continue;
    }
    const mine = canonicalJson(pkg.servers[n]);
    if (canonicalJson(existing[n]) === mine) continue;
    if ((record?.mcp_servers ?? {})[n] !== serverHash(existing[n])) conflicts.push(conflict(REPO_FILES.mcp, `server "${n}" ${NOT_OURS}`));
    changed.push(n);
  }
  if (changed.length === 0) return { abs, text: null, existed: true, names: [] };
  const merged: JsonObject = {};
  for (const [k, v] of Object.entries(existing)) merged[k] = changed.includes(k) ? pkg.servers[k]! : v;
  for (const n of changed.filter((c) => !(c in existing)).sort()) merged[n] = pkg.servers[n]!;
  // `servers` keeps its place; a file without it gets it appended.
  const out: JsonObject = { ...doc, servers: merged };
  return { abs, text: jsonText(out), existed: true, names: names.filter((n) => changed.includes(n)) };
}

/** The install record this run writes. */
function recordText(pkg: PackageSources): string {
  const rec: InstallRecord = {
    package_version: pkg.version,
    agents: Object.fromEntries(pkg.agents.map((a) => [`${REPO_FILES.agentsDir}/${a}`, sha256(pkg.agentBytes.get(a)!)])),
    hook_files: { [REPO_FILES.guardHook]: sha256(pkg.guardHook) },
    mcp_servers: Object.fromEntries(Object.keys(pkg.servers).sort().map((n) => [n, serverHash(pkg.servers[n])])),
  };
  return jsonText(rec);
}

/** `sdd install copilot [--package <dir>]`: 0 installed, 2 refused (ERR-CLI-021/022), 3 failed write (ERR-CLI-017). */
export function installCopilot(ctx: CommandContext): number {
  const pkg = loadPackage(ctx.values["package"] as string | undefined, ctx.cwd);
  const repo = findRepositoryRoot(ctx.cwd);
  ctx.out.trace("install.copilot", { package: pkg.dir, repo, agents: pkg.agents.length });
  const record = readRecord(repo);
  const p = plan(pkg, repo, record);
  if (p.conflicts.length > 0) {
    for (const c of p.conflicts) ctx.out.error(c);
    return 2;
  }
  const written: string[] = [];
  const write = (abs: string, shown: string, bytes: string | Buffer) => {
    try {
      mkdirSync(dirname(abs), { recursive: true });
      writeFileAtomic(abs, bytes);
    } catch {
      const already = written.length > 0 ? written.join(", ") : "none";
      throw new CliError("ERR-CLI-017", { file: `${shown} (already written: ${already})` });
    }
    written.push(shown);
  };
  // (a) hooks.json, (b) the workspace hook file, (c) plugin.json, (d) the agents.
  for (const f of p.files) {
    if (f.changed) write(f.abs, f.shown, f.bytes);
    ctx.out.line(`${f.changed ? "written" : "unchanged"} ${f.shown}`);
  }
  // (e) .vscode/mcp.json.
  if (p.mcp.text === null) ctx.out.line(`unchanged ${REPO_FILES.mcp}`);
  else {
    write(p.mcp.abs, REPO_FILES.mcp, p.mcp.text);
    ctx.out.line(p.mcp.existed ? `merged ${REPO_FILES.mcp} (${p.mcp.names.join(", ")})` : `written ${REPO_FILES.mcp}`);
  }
  // (f) the install record, last.
  const rec = recordText(pkg);
  const recAbs = join(repo, REPO_FILES.record);
  const present = readIfFile(recAbs);
  const recChanged = present === null || present.toString("utf8") !== rec;
  if (recChanged) write(recAbs, REPO_FILES.record, rec);
  ctx.out.line(`${recChanged ? "written" : "unchanged"} ${REPO_FILES.record}`);
  ctx.out.line(NEXT_LINE);
  return 0;
}
