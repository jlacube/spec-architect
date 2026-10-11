// Guard test fixtures (C001-T-050): builds the repository layout of tests/guards/path-corpus.json in a
// temporary folder and resolves the corpus placeholders against it.
import { spawnSync } from "node:child_process";
import { linkSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { decidePath } from "../../src/hooks/guard-path.ts";
import { parseHookInput } from "../../src/hooks/input.ts";
import { repoRoot } from "../helpers.ts";

const WIN = process.platform === "win32";

export interface CorpusCase {
  id: string;
  category: string;
  tool: string | null;
  agent: unknown;
  path?: unknown;
  field?: string;
  cwd?: string | null;
  stdin?: string;
  expect: "allow" | "deny" | { win32: "allow" | "deny"; posix: "allow" | "deny" };
  platforms?: string[];
  requires?: string;
  note?: string;
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

export function decide(stdin: string): "allow" | "deny" {
  return decidePath(parseHookInput(stdin)).allow ? "allow" : "deny";
}
