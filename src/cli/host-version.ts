// `sdd host-version opencode|vscode|vscode-insiders [--json]` (C002-IF-007, C002-REQ-508): the doctor
// on a generated target reads the host versions through the CLI, so no probe of `opencode`, `code` or
// a VS Code setting is added to the bash allowlist (C002-IF-006 §2, architecture §6.2).
//
// Each probe is a fixed command line (architecture §6.1 Portability). Its executable is found by the
// executable lookup of C002-IF-007 (src/io/paths.ts `findOnPath`: PATH order, empty and relative entries
// skipped, PATHEXT order; the first match, native or shim) and started by the absolute path of the match,
// with the folder of the match as working folder, never the repository: a native match without a shell;
// a `.cmd` or `.bat` match (the shims that `opencode` (npm) and `code`/`code-insiders` install) through
// the platform shell with the match's absolute path quoted and the fixed arguments after it, the only use
// of a shell. No match is `<host> missing` without anything started. Nothing from the command line or
// the environment is placed in a probe (C002-CON-17).
//
// The copilot-chat line (revised for defect D-047): first the `github.copilot-chat` entry of
// `code --list-extensions --show-versions` (an installed extension, which takes precedence over a built-in
// one); without it, the GitHub Copilot Chat that the probed build ships built in (VS Code 1.14x and later:
// no entry in that list). The built-in extension is read from the install folder of the match, its
// symbolic links resolved, as `<install>/<commit prefix>/resources/app/extensions/copilot` (Windows
// installers since the commit-prefixed layout; the prefix is the first 10 characters of the commit on the
// second line of `--version`), `<install>/resources/app/extensions/copilot` (the older Windows layout,
// Linux `/usr/share/code`) or `<app>/extensions/copilot` (macOS `…/Contents/Resources/app/bin/code`),
// in this order; its `package.json` counts only with publisher `GitHub` and name `copilot-chat`.
//
// The hooks line reads `chat.useHooks` only (C002-IF-007 host-version Output, revised for critic CR-45):
// first the workspace settings (`.vscode/settings.json` at the repository root), which take precedence;
// only a missing workspace file, or one without the key, leads to the user settings of the default
// profile of the matching VS Code build. A workspace file that exists but cannot be read, does not
// parse, has no object at its top level or holds a non-boolean `chat.useHooks` is `unknown`, the user
// settings unread (VS Code may still take a value from it). `true` is `enabled`, `false` is
// `disabled (chat.useHooks)`; anything else is `unknown`, never `enabled` (C002-REQ-510, C002-TS-526).
// Not read: the settings of other VS Code profiles, of a `.code-workspace` file, Workspace Trust and
// organisation policy (C002-IF-006 §2).
import { spawnSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { findOnPath, pathValue, userConfigDir, windowsShell } from "../io/paths.ts";
import { findRepositoryRoot } from "../io/repo-root.ts";

export const HOSTS = ["opencode", "vscode", "vscode-insiders"] as const;
export type Host = (typeof HOSTS)[number];

/** Fixed probes: command and argument list, never built from input. */
const PROBES = {
  opencode: { command: "opencode", args: ["--version"] },
  code: { command: "code", args: ["--version"] },
  codeExtensions: { command: "code", args: ["--list-extensions", "--show-versions"] },
  insiders: { command: "code-insiders", args: ["--version"] },
  insidersExtensions: { command: "code-insiders", args: ["--list-extensions", "--show-versions"] },
} as const;

type Probe = (typeof PROBES)[keyof typeof PROBES];

export interface HooksState {
  state: "enabled" | "disabled" | "unknown";
  source?: "chat.useHooks" | "workspace-trust" | "policy";
}

export interface HostVersions {
  host: Host;
  /** Null when the host is not installed or not found on PATH. */
  versions: Record<string, string | null>;
  hooks?: HooksState;
  missing: boolean;
}

const VERSION = /\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?/;

/** Standard output of a probe and the file of its match, or null when the executable is missing or fails. */
function runAt(p: Probe): { stdout: string; file: string } | null {
  const match = findOnPath(p.command, pathValue(process.env), { env: process.env });
  if (match === null) return null;
  const opts = { encoding: "utf8" as const, windowsHide: true, timeout: 30_000, cwd: dirname(match.file), stdio: ["ignore", "pipe", "pipe"] as ["ignore", "pipe", "pipe"] };
  // A shim: the platform shell `/d /s /c ""<absolute shim>" <fixed arguments>"`, the shell itself by its absolute path.
  const r =
    match.kind === "shim"
      ? spawnSync(windowsShell(), ["/d", "/s", "/c", `""${match.file}" ${p.args.join(" ")}"`], { ...opts, windowsVerbatimArguments: true })
      : spawnSync(match.file, [...p.args], opts);
  if (r.error || r.status !== 0) return null;
  return { stdout: r.stdout, file: match.file };
}

/** Standard output of a probe, or null when the executable is missing or fails. */
function run(p: Probe): string | null {
  return runAt(p)?.stdout ?? null;
}

/** The first semantic version on the first non-empty line of a `--version` output. */
export function parseVersion(stdout: string): string | null {
  const first = stdout.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  return VERSION.exec(first)?.[0] ?? null;
}

/** The GitHub Copilot Chat version in a `--list-extensions --show-versions` output. */
export function parseCopilotChat(stdout: string): string | null {
  for (const line of stdout.split(/\r?\n/)) {
    const m = /^\s*github\.copilot-chat@(\S+)\s*$/i.exec(line);
    if (m) return VERSION.exec(m[1]!)?.[0] ?? null;
  }
  return null;
}

/** The commit (40 hexadecimal digits) on the second non-empty line of a `code --version` output, or null. */
export function parseCommit(stdout: string): string | null {
  const second = stdout.split(/\r?\n/).filter((l) => l.trim() !== "")[1]?.trim() ?? "";
  return /^[0-9a-f]{40}$/i.test(second) ? second.toLowerCase() : null;
}

/**
 * The folders where the build of the `code` (or `code-insiders`) match keeps its built-in GitHub Copilot
 * Chat, in the order they are read: `<install>/<commit prefix>/resources/app/extensions/copilot` (only with
 * a commit), `<install>/resources/app/extensions/copilot` and `<install>/extensions/copilot`, where
 * `<install>` is the parent of the folder that holds the match, its symbolic links resolved.
 */
export function builtinCopilotDirs(match: string, commit: string | null): string[] {
  let file = match;
  try {
    file = realpathSync(match);
  } catch {
    // An unresolvable link: the match as found.
  }
  const install = dirname(dirname(file));
  const tail = ["resources", "app", "extensions", "copilot"];
  return [...(commit === null ? [] : [join(install, commit.slice(0, 10), ...tail)]), join(install, ...tail), join(install, "extensions", "copilot")];
}

/** The version in a built-in extension folder's `package.json` when it is GitHub Copilot Chat; else null. */
export function readCopilotChatPackage(dir: string): string | null {
  let doc: unknown;
  try {
    doc = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  } catch {
    return null;
  }
  if (doc === null || typeof doc !== "object") return null;
  const { publisher, name, version } = doc as Record<string, unknown>;
  if (typeof publisher !== "string" || publisher.toLowerCase() !== "github" || name !== "copilot-chat" || typeof version !== "string") return null;
  return VERSION.exec(version)?.[0] ?? null;
}

/** The built-in GitHub Copilot Chat version of the build of the match: the first folder that holds it. */
export function builtinCopilotChat(match: string, commit: string | null): string | null {
  for (const dir of builtinCopilotDirs(match, commit)) {
    const v = readCopilotChatPackage(dir);
    if (v !== null) return v;
  }
  return null;
}

/** Parses JSON with comments and trailing commas (VS Code settings files); null when invalid. */
export function parseJsonc(text: string): unknown {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (c === '"') {
      const start = i;
      for (i++; i < text.length && text[i] !== '"'; i++) if (text[i] === "\\") i++;
      out += text.slice(start, i + 1);
    } else if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (c === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end < 0 ? text.length : end + 1;
      out += " ";
    } else out += c;
  }
  try {
    return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
  } catch {
    return null;
  }
}

/** The user settings file of VS Code (`Code`) or VS Code Insiders (`Code - Insiders`). */
export function userSettingsPath(insiders: boolean, env: Readonly<Record<string, string | undefined>> = process.env): string {
  const home = env["HOME"] ?? env["USERPROFILE"] ?? homedir();
  return join(userConfigDir(env, home), insiders ? "Code - Insiders" : "Code", "User", "settings.json");
}

/**
 * `chat.useHooks` of one settings file: `true`/`false`; `"missing"` when the file does not exist;
 * `"unset"` when the file holds an object without the key; `"unusable"` when it cannot be read, does
 * not parse, has no object at its top level or holds another value.
 */
export function useHooks(file: string): boolean | "missing" | "unset" | "unusable" {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === "ENOENT" ? "missing" : "unusable";
  }
  const doc = parseJsonc(text);
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) return "unusable";
  if (!Object.prototype.hasOwnProperty.call(doc, "chat.useHooks")) return "unset";
  const v = (doc as Record<string, unknown>)["chat.useHooks"];
  return typeof v === "boolean" ? v : "unusable";
}

/**
 * The hooks state: the workspace settings first; only a missing workspace file or one without the key
 * leads to the user settings; an unusable workspace file is unknown without reading the user settings.
 */
export function hooksState(cwd: string, insiders: boolean, env: Readonly<Record<string, string | undefined>> = process.env): HooksState {
  const workspace = useHooks(join(findRepositoryRoot(cwd), ".vscode", "settings.json"));
  const value = workspace === "missing" || workspace === "unset" ? useHooks(userSettingsPath(insiders, env)) : workspace;
  if (value === true) return { state: "enabled" };
  if (value === false) return { state: "disabled", source: "chat.useHooks" };
  return { state: "unknown" };
}

/** Reads the versions of one host (and, for VS Code, the Copilot Chat version and the hooks state). */
export function hostVersions(host: Host, cwd: string): HostVersions {
  if (host === "opencode") {
    const out = run(PROBES.opencode);
    const v = out === null ? null : parseVersion(out);
    return { host, versions: { opencode: v }, missing: v === null };
  }
  const insiders = host === "vscode-insiders";
  const out = runAt(insiders ? PROBES.insiders : PROBES.code);
  const v = out === null ? null : parseVersion(out.stdout);
  if (out === null || v === null) return { host, versions: { vscode: null }, missing: true };
  const ext = run(insiders ? PROBES.insidersExtensions : PROBES.codeExtensions);
  const chat = (ext === null ? null : parseCopilotChat(ext)) ?? builtinCopilotChat(out.file, parseCommit(out.stdout));
  return { host, versions: { vscode: v, "copilot-chat": chat }, hooks: hooksState(cwd, insiders), missing: false };
}

/** The text lines of C002-IF-007 §Output. */
export function formatHostVersions(r: HostVersions): string[] {
  if (r.host === "opencode") return [`opencode ${r.versions["opencode"] ?? "missing"}`];
  if (r.missing) return ["vscode missing"];
  const h = r.hooks!;
  return [
    `vscode ${r.versions["vscode"]}`,
    `copilot-chat ${r.versions["copilot-chat"] ?? "missing"}`,
    h.state === "disabled" ? `hooks disabled (${h.source})` : `hooks ${h.state}`,
  ];
}

/** The `--json` document of C002-IF-007 §Output. */
export function hostVersionsJson(r: HostVersions): Record<string, unknown> {
  return { host: r.host, versions: r.versions, ...(r.hooks ? { hooks: r.hooks } : {}) };
}
