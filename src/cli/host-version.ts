// `sdd host-version opencode|vscode|vscode-insiders [--json]` (C002-IF-007, C002-REQ-508): the doctor
// on a generated target reads the host versions through the CLI, so no probe of `opencode`, `code` or
// a VS Code setting is added to the bash allowlist (C002-IF-006 §2, architecture §6.2).
//
// Each probe is a fixed command line (architecture §6.1 Portability): on Windows it runs through the
// platform shell, which starts the `.cmd` shims that `opencode` (npm) and `code`/`code-insiders`
// install; elsewhere the executable runs directly with a fixed argument list. Nothing from the
// command line or the environment is placed in a probe.
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
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { IS_WINDOWS, userConfigDir } from "../io/paths.ts";
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

/** Standard output of a probe, or null when the executable is missing or fails. */
function run(p: Probe): string | null {
  const opts = { encoding: "utf8" as const, windowsHide: true, timeout: 30_000, stdio: ["ignore", "pipe", "pipe"] as ["ignore", "pipe", "pipe"] };
  const r = IS_WINDOWS ? spawnSync([p.command, ...p.args].join(" "), { ...opts, shell: true }) : spawnSync(p.command, [...p.args], opts);
  if (r.error || r.status !== 0) return null;
  return r.stdout;
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
  const out = run(insiders ? PROBES.insiders : PROBES.code);
  const v = out === null ? null : parseVersion(out);
  if (v === null) return { host, versions: { vscode: null }, missing: true };
  const ext = run(insiders ? PROBES.insidersExtensions : PROBES.codeExtensions);
  return { host, versions: { vscode: v, "copilot-chat": ext === null ? null : parseCopilotChat(ext) }, hooks: hooksState(cwd, insiders), missing: false };
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
