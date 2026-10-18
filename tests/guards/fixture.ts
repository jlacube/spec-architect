// Guard test fixtures (C001-T-050, C002-T-007): builds the repository layout of
// tests/guards/path-corpus.json in a temporary folder, resolves the corpus placeholders against it, and
// holds the case format shared by the path and shell corpus tests and the replay suite (C002-COMP-008).
//
// Case fields common to both corpora (C002-IF-009 §2.1, §2.2):
//   id        unique case ID (PG-nnn, BG-nnn)
//   category  one of PATH_CATEGORIES / BASH_CATEGORIES; the replay applicability rules key on it
//   tool      hook tool name (null: the hook input has no tool_name)
//   agent     agent_type of the hook input (null: left out)
//   cwd       optional working folder with placeholders; absent: {repo}; null: left out; "" empty
//   env       optional stub of environment variables set while the case is decided, values with
//             placeholders, null unsets the variable (for example CLAUDE_PLUGIN_DATA)
//   requires  optional host capability the case needs (HOST_CAPABILITIES); the corpus tests skip the
//             case when the fixture cannot provide it, the replay suite never does (C002-REQ-633)
//   dialect   optional shell dialect of the tool, "bash" or "powershell"; when given it must match
//             the tool (PowerShell: powershell, any other tool: bash); absent: derived from the tool
//   stdin     raw hook input used unchanged instead of the fields above
//   expect    "allow" | "deny" (path cases also per platform: { win32, posix })
//   note      free text
import { spawnSync } from "node:child_process";
import { linkSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { decidePath, type PathOptions } from "../../src/hooks/guard-path.ts";
import { parseHookInput } from "../../src/hooks/input.ts";
import { repoRoot } from "../helpers.ts";

const WIN = process.platform === "win32";

export type Dialect = "bash" | "powershell";
export type EnvStub = Record<string, string | null>;

export const HOST_CAPABILITIES: readonly string[] = ["file-symlink"];
export const DIALECTS: readonly Dialect[] = ["bash", "powershell"];

const COMMON_FIELDS = ["id", "category", "tool", "agent", "cwd", "env", "requires", "dialect", "stdin", "expect", "note"];
/** Path cases additionally carry the target path, the tool_input field it goes to, and platforms. */
export const PATH_FIELDS: readonly string[] = [...COMMON_FIELDS, "path", "field", "platforms"];
/** Shell cases additionally carry the command and, on a denial, the expected rule. */
export const BASH_FIELDS: readonly string[] = [...COMMON_FIELDS, "command", "rule"];

export const PATH_CATEGORIES: readonly string[] = [
  "inside", "outside", "prefix", "traversal", "relative", "cwd", "case", "separators", "symlink", "unc",
  "short-name", "windows-names", "drive", "memory", "identity", "tool", "malformed",
];
export const BASH_CATEGORIES: readonly string[] = [
  "scenario", "sdd", "ripwire", "ast-grep", "git", "version", "pipe", "compound", "quoted", "powershell",
  "identity", "tool", "malformed",
];

export interface CorpusCase {
  id: string;
  category: string;
  tool: string | null;
  agent: unknown;
  path?: unknown;
  field?: string;
  cwd?: string | null;
  env?: EnvStub;
  dialect?: Dialect;
  stdin?: string;
  expect: "allow" | "deny" | { win32: "allow" | "deny"; posix: "allow" | "deny" };
  platforms?: string[];
  requires?: string;
  note?: string;
}

export interface BashCase {
  id: string;
  category: string;
  tool: string;
  agent: unknown;
  command: unknown;
  cwd?: string | null;
  env?: EnvStub;
  requires?: string;
  dialect?: Dialect;
  stdin?: string;
  expect: "allow" | "deny";
  rule?: string;
  note?: string;
}

export function loadBashCorpus(): BashCase[] {
  return (JSON.parse(readFileSync(join(repoRoot(), "tests", "guards", "bash-corpus.json"), "utf8")) as { cases: BashCase[] }).cases;
}

/** The shell dialect a case's tool is decided in (C002-IF-009 §2.2). */
export function dialectOf(c: { tool: string | null; dialect?: Dialect }): Dialect {
  return c.dialect ?? (c.tool === "PowerShell" ? "powershell" : "bash");
}

/** Problems of the case format: duplicate IDs, unknown categories, unknown fields, bad optional fields. */
export function formatProblems(cases: readonly Record<string, unknown>[], fields: readonly string[], categories: readonly string[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const c of cases) {
    const id = typeof c["id"] === "string" ? c["id"] : JSON.stringify(c["id"]);
    if (typeof c["id"] !== "string" || c["id"] === "") problems.push(`${id}: missing id`);
    else if (seen.has(id)) problems.push(`${id}: duplicate id`);
    seen.add(id);
    if (!categories.includes(c["category"] as string)) problems.push(`${id}: unknown category ${JSON.stringify(c["category"])}`);
    for (const k of Object.keys(c)) if (!fields.includes(k)) problems.push(`${id}: unknown field ${k}`);
    if ("cwd" in c && c["cwd"] !== null && typeof c["cwd"] !== "string") problems.push(`${id}: cwd is neither a string nor null`);
    if ("env" in c) {
      const env = c["env"];
      if (env === null || typeof env !== "object" || Array.isArray(env) || Object.values(env).some((v) => v !== null && typeof v !== "string"))
        problems.push(`${id}: env is not an object of strings or null`);
    }
    if ("requires" in c && !HOST_CAPABILITIES.includes(c["requires"] as string)) problems.push(`${id}: unknown host capability ${JSON.stringify(c["requires"])}`);
    if ("dialect" in c) {
      if (!DIALECTS.includes(c["dialect"] as Dialect)) problems.push(`${id}: unknown dialect ${JSON.stringify(c["dialect"])}`);
      else if (c["dialect"] !== dialectOf({ tool: c["tool"] as string | null })) problems.push(`${id}: dialect ${String(c["dialect"])} does not match tool ${JSON.stringify(c["tool"])}`);
    }
  }
  return problems;
}

/** Runs `fn` with the case's environment stub applied (placeholders resolved), then restores the environment. */
export function withEnv<T>(env: EnvStub | undefined, resolve: (s: string) => string, fn: () => T): T {
  if (env === undefined) return fn();
  const saved = new Map<string, string | undefined>();
  for (const [k, v] of Object.entries(env)) {
    saved.set(k, process.env[k]);
    if (v === null) delete process.env[k];
    else process.env[k] = resolve(v);
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of saved) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

export interface Corpus {
  fixture: {
    files: Record<string, string>;
    dirs: string[];
    junctions: Record<string, string>;
    hardlinks: Record<string, string>;
    fileSymlinks: Record<string, string>;
  };
  cases: CorpusCase[];
}

export function loadCorpus(): Corpus {
  return JSON.parse(readFileSync(join(repoRoot(), "tests", "guards", "path-corpus.json"), "utf8")) as Corpus;
}

const fwd = (p: string) => p.split("\\").join("/");

/** 8.3 short spelling of an existing path (the long path when short names are not generated). */
function shortPath(p: string): string {
  const r = spawnSync("cmd.exe", ["/d", "/s", "/c", `"for %I in ("${p.split("/").join("\\")}") do @echo %~sI"`], { encoding: "utf8", windowsVerbatimArguments: true });
  const out = r.stdout.trim();
  return out ? fwd(out) : p;
}

export interface Fixture {
  base: string;
  repo: string;
  capabilities: Set<string>;
  resolve(text: string): string;
  cleanup(): void;
}

export function buildFixture(spec: Corpus["fixture"]): Fixture {
  const base = fwd(realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-guard-"))));
  const repo = `${base}/repository-root`;
  const outside = `${base}/outside`;
  const repolink = `${base}/repolink`;
  const repo2 = `${base}/repo2`;
  const linkType = WIN ? "junction" : "dir";
  const vars: Record<string, string> = { "{outside}": outside };
  const at = (rel: string) => (rel === "." ? repo : `${repo}/${rel}`);
  const target = (t: string) => (t.startsWith("{") ? vars[t]! : at(t));

  mkdirSync(outside, { recursive: true });
  for (const [rel, content] of Object.entries(spec.files)) {
    mkdirSync(dirname(at(rel)), { recursive: true });
    writeFileSync(at(rel), content);
  }
  for (const rel of spec.dirs) mkdirSync(at(rel), { recursive: true });
  // A .git folder next to .sdd makes {repo} the repository root whatever the case's cwd (C002-T-007).
  mkdirSync(`${repo}/.git`, { recursive: true });
  for (const [rel, t] of Object.entries(spec.junctions)) {
    mkdirSync(dirname(at(rel)), { recursive: true });
    symlinkSync(target(t), at(rel), linkType);
  }
  for (const [rel, t] of Object.entries(spec.hardlinks)) linkSync(target(t), at(rel));
  const capabilities = new Set<string>();
  try {
    for (const [rel, t] of Object.entries(spec.fileSymlinks)) symlinkSync(target(t), at(rel), "file");
    capabilities.add("file-symlink");
  } catch {
    // Windows without Developer Mode cannot create file symbolic links; those cases are skipped.
  }
  symlinkSync(repo, repolink, linkType);
  mkdirSync(`${repo2}/src`, { recursive: true });
  writeFileSync(`${repo2}/src/app.ts`, "x\n");
  symlinkSync(`${repo2}/src`, `${repo2}/.sdd`, linkType);

  const drive = WIN ? repo[0]! : "";
  Object.assign(vars, {
    "{repo}": repo,
    "{REPO}": repo.toUpperCase(),
    "{repo\\}": repo.split("/").join("\\"),
    "{repo-nodrive\\}": repo.slice(3).split("/").join("\\"),
    "{repo-lowerdrive}": drive.toLowerCase() + repo.slice(1),
    "{repolink}": repolink,
    "{repo2}": repo2,
    "{drive}": drive,
    "{otherdrive}": drive.toUpperCase() === "Q" ? "R" : "Q",
  });
  const resolve = (text: string): string =>
    text
      .replace(/\{short:([^}]+)\}/g, (_m, rel: string) => (WIN ? shortPath(at(rel)) : at(rel)))
      .replace(/\{shortname:([^}]+)\}/g, (_m, rel: string) => (WIN ? shortPath(at(rel)) : at(rel)).split("/").pop()!)
      .replace(/\{[A-Za-z0-9\\-]+\}/g, (m) => vars[m] ?? m);
  return { base, repo, capabilities, resolve, cleanup: () => rmSync(base, { recursive: true, force: true }) };
}

/** The PreToolUse hook input of a corpus case, as Claude Code would send it (spike S-04 field names). */
export function hookInput(c: CorpusCase, fx: Fixture): string {
  if (c.stdin !== undefined) return c.stdin;
  const doc: Record<string, unknown> = { session_id: "00000000-0000-0000-0000-000000000000", hook_event_name: "PreToolUse", permission_mode: "acceptEdits" };
  const cwd = c.cwd === undefined ? "{repo}" : c.cwd;
  if (cwd !== null) doc["cwd"] = fx.resolve(cwd);
  if (c.agent !== null) doc["agent_type"] = c.agent;
  if (c.tool !== null) doc["tool_name"] = c.tool;
  if (c.path !== null) doc["tool_input"] = { [c.field ?? "file_path"]: typeof c.path === "string" ? fx.resolve(c.path) : c.path, content: "x" };
  return JSON.stringify(doc);
}

export function expected(c: CorpusCase): "allow" | "deny" {
  return typeof c.expect === "string" ? c.expect : WIN ? c.expect.win32 : c.expect.posix;
}

export function applies(c: CorpusCase, fx: Fixture): boolean {
  if (c.platforms && !c.platforms.includes(WIN ? "win32" : "posix")) return false;
  return !c.requires || fx.capabilities.has(c.requires);
}

/** The path guard core's decision on a hook input; `options` as in C002-IF-008 §5 (default: Claude Code). */
export function decide(stdin: string, env?: EnvStub, resolve: (s: string) => string = (s) => s, options?: PathOptions): "allow" | "deny" {
  return withEnv(env, resolve, () => decidePath(parseHookInput(stdin), options).allow) ? "allow" : "deny";
}
