// Platform-neutral path normalisation for the CLI and the path guard (C001-REQ-1104). This is the
// one module allowed to contain Windows-specific path handling (C001-NFR-402, PLG-PORT-002).
//
// - normalisePath: lexical. Absolute, `.`/`..` resolved, forward slashes, no trailing slash,
//   upper-case drive letter, `\\?\` prefixes removed. Works for either platform on any OS.
// - pathKey: comparison key. Windows paths are case-folded (NTFS is case-insensitive by default).
// - realPath: resolves symbolic links, junctions, subst/UNC aliases and 8.3 short names through the
//   file system, for the longest existing prefix; segments that do not exist yet (a file about to
//   be written) are appended lexically.
import { accessSync, constants, realpathSync, statSync } from "node:fs";
import { posix, win32 } from "node:path";

export type Platform = "win32" | "posix";

export interface PathOptions {
  platform?: Platform;
  /** Base for relative paths (default: process.cwd() on the current platform). */
  cwd?: string;
}

const CURRENT: Platform = process.platform === "win32" ? "win32" : "posix";

/** True on Windows, where a fixed command line runs through the platform shell to start `.cmd` shims. */
export const IS_WINDOWS = CURRENT === "win32";

/**
 * The per-user application configuration folder (where VS Code keeps `<product>/User/settings.json`):
 * `%APPDATA%` on Windows, `~/Library/Application Support` on macOS, `$XDG_CONFIG_HOME` or `~/.config`
 * elsewhere.
 */
export function userConfigDir(env: Readonly<Record<string, string | undefined>>, home: string): string {
  if (IS_WINDOWS) return env["APPDATA"] ?? win32.join(home, "AppData", "Roaming");
  if (process.platform === "darwin") return posix.join(home, "Library", "Application Support");
  return env["XDG_CONFIG_HOME"] ?? posix.join(home, ".config");
}

/** The operating system whose per-user folder rules apply (C002-IF-007 `--user-data`). */
export type UserOs = "windows" | "macos" | "linux";

export const USER_OS: UserOs = IS_WINDOWS ? "windows" : process.platform === "darwin" ? "macos" : "linux";

/** The per-user data folder of an application, or the variable that prevents it (unset or empty; relative: `value`). */
export type UserDataFolder = { folder: string } | { variable: string; value?: string };

/**
 * The per-user data folder of `app` (C002-IF-007): `%LOCALAPPDATA%\<app>` (Windows),
 * `$HOME/Library/Application Support/<app>` (macOS), `$XDG_DATA_HOME/<app>`, or
 * `$HOME/.local/share/<app>` when XDG_DATA_HOME is unset or empty (Linux). No other fallback: an unset
 * or empty variable, or a relative value, is returned as such. The folder is normalised (`/`).
 */
export function userDataFolder(app: string, env: Readonly<Record<string, string | undefined>>, os: UserOs = USER_OS): UserDataFolder {
  const xdg = env["XDG_DATA_HOME"];
  const [variable, tail] =
    os === "windows" ? ["LOCALAPPDATA", [app]] : os === "macos" ? ["HOME", ["Library", "Application Support", app]] : xdg ? ["XDG_DATA_HOME", [app]] : ["HOME", [".local", "share", app]];
  const value = env[variable];
  if (value === undefined || value === "") return { variable };
  // Windows: a drive letter with its root, or a UNC path; `C:x` and `\x` depend on the current drive or folder.
  const absolute = os === "windows" ? /^([A-Za-z]:[\\/]|[\\/]{2}[^\\/])/.test(value) : value.startsWith("/");
  if (!absolute) return { variable, value };
  return { folder: normalisePath([value, ...tail].join("/"), { platform: os === "windows" ? "win32" : "posix" }) };
}

function defaultCwd(platform: Platform): string {
  if (platform === CURRENT) return process.cwd();
  return platform === "win32" ? "C:\\" : "/";
}

export function normalisePath(p: string, options: PathOptions = {}): string {
  const platform = options.platform ?? CURRENT;
  const cwd = options.cwd ?? defaultCwd(platform);
  if (platform === "posix") {
    const r = posix.resolve(cwd, p);
    return r.length > 1 && r.endsWith("/") ? r.slice(0, -1) : r;
  }
  let s = p.replace(/\//g, "\\");
  if (s.startsWith("\\\\?\\UNC\\")) s = "\\\\" + s.slice(8);
  else if (s.startsWith("\\\\?\\")) s = s.slice(4);
  let r = win32.resolve(cwd, s).replace(/\\/g, "/");
  r = r.replace(/^([a-zA-Z]):/, (_m, d: string) => d.toUpperCase() + ":");
  const isDriveRoot = /^[A-Z]:\/$/.test(r);
  if (!isDriveRoot && r.length > 1 && r.endsWith("/")) r = r.slice(0, -1);
  return r;
}

export function pathKey(p: string, options: PathOptions = {}): string {
  const platform = options.platform ?? CURRENT;
  const n = normalisePath(p, options);
  return platform === "win32" ? n.toLowerCase() : n;
}

/** Real path on the current platform; see the module comment. */
export function realPath(p: string): string {
  const absolute = normalisePath(p);
  const isWin = CURRENT === "win32";
  const segments = absolute.split("/");
  const rest: string[] = [];
  while (segments.length > 0) {
    let candidate = segments.join("/") || "/";
    // A bare drive (`C:`) means the drive's current directory on Windows; use its root instead.
    if (/^[A-Za-z]:$/.test(candidate)) candidate += "/";
    try {
      const real = realpathSync.native(isWin ? candidate.replace(/\//g, "\\") : candidate);
      return normalisePath([real, ...rest].join(isWin ? "\\" : "/"));
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code !== "ENOENT" && code !== "ENOTDIR") break;
      const last = segments.pop();
      if (last !== undefined && last !== "") rest.unshift(last);
      if (segments.length === 1 && segments[0] === "") break; // POSIX root reached
    }
  }
  return absolute;
}

/**
 * Path the OS would reach when it resolves `..` after following links (POSIX semantics): segments are
 * applied one by one from `cwd` (or the path's root) and every existing prefix is replaced by its real
 * path, so `link/..` is the link target's parent. Current platform only.
 */
export function physicalPath(p: string, cwd: string): string {
  const isWin = CURRENT === "win32";
  let s = isWin ? p.replace(/\//g, "\\") : p;
  if (isWin && s.startsWith("\\\\?\\UNC\\")) s = "\\\\" + s.slice(8);
  else if (isWin && s.startsWith("\\\\?\\")) s = s.slice(4);
  const path = isWin ? win32 : posix;
  const root = path.isAbsolute(s) ? path.parse(s).root : "";
  let cur = root ? normalisePath(root, { cwd }) : normalisePath(cwd);
  const real = (q: string): string => {
    try {
      return normalisePath(realpathSync.native(isWin ? q.replace(/\//g, "\\") : q));
    } catch {
      return q;
    }
  };
  cur = real(cur);
  for (const seg of s.slice(root.length).split(isWin ? "\\" : "/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") {
      cur = normalisePath(cur + "/.."); // `cur` is already real, so its lexical parent is its physical parent
    } else {
      cur = real(cur.endsWith("/") ? cur + seg : cur + "/" + seg);
    }
  }
  return cur;
}

/**
 * Why a write target is ambiguous on Windows, or null: a drive-relative path (`C:x`), a device path
 * (`\\.\`), a colon after the drive (alternate data stream), a name ending in a dot or a space (Windows
 * strips them, so `.. ` means `..`) or a reserved device name. Always null on POSIX.
 */
export function ambiguousWindowsPath(p: string, platform: Platform = CURRENT): string | null {
  if (platform !== "win32") return null;
  const s = p.replace(/\//g, "\\");
  if (/^[a-zA-Z]:(?!\\)/.test(s)) return "drive-relative path";
  if (s.startsWith("\\\\.\\") || s.startsWith("\\\\?\\GLOBALROOT")) return "device path";
  const body = s.startsWith("\\\\?\\") ? s.slice(4) : s;
  const segments = body.replace(/^[a-zA-Z]:\\/, "").split("\\");
  for (const seg of segments) {
    if (seg === "" || seg === "." || seg === "..") continue;
    if (seg.includes(":")) return "alternate data stream or colon in a name";
    if (/[. ]$/.test(seg)) return "name ending in a dot or a space";
    if (/^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])(\..*)?$/i.test(seg)) return "reserved device name";
  }
  return null;
}

/** True when a command word names `name`, also as the Windows executable `<name>.exe` (any case). */
export function isCommand(word: string | undefined, name: string): boolean {
  return word !== undefined && (word === name || word.toLowerCase() === `${name}.exe`);
}

// --- Executable lookup (C002-IF-007 §Executable lookup, C002-IF-002 §5.2 steps 3 and 4, C002-CON-17) ---
//
// Every executable the sdd CLI and the sdd MCP server start (the host probes, `git` of the `gate`
// commands, `serena`, the server's commands and `taskkill`) is resolved here and started by the absolute
// path of its match, never by its bare name: on Windows `cmd.exe`, and Node.js's process start without
// a shell, look for a bare name in the working folder before the PATH folders, and those starts run from
// the repository, whose content is untrusted.
//
// Lookup rule: the folders of the given PATH in their order (on Windows the environment's `Path` key,
// whatever its letter case: `pathValue`); an empty entry, or one that is not an absolute path, is
// skipped, so the working folder is searched only where the PATH names it by an absolute path. On
// Windows each folder is tried for the name with each extension of PATHEXT in its order
// (`.COM;.EXE;.BAT;.CMD` when unset or empty); a name that already ends in an extension is tried as
// given. A `.com` or `.exe` match is `native`, a `.bat` or `.cmd` match a `shim`, and any other extension
// is passed over. On other platforms a regular file with execute permission is a native match.
//
// Two answers: `findOnPath` gives the first match, native or shim (the probes of `host-version`, which
// run a shim through the platform shell by its quoted absolute path); `findNativeOnPath` gives the first
// native match, passing over shims, with the reason `not found on PATH` or `only a .cmd or .bat shim was
// found` (every other start). The resolver only reads the file system; it never starts a process.

/** The kind of a PATH match: a file a process starts without a shell, or a Windows `.cmd`/`.bat` shim. */
export type ExecutableKind = "native" | "shim";

export interface ExecutableMatch {
  /** Absolute path of the match. */
  file: string;
  kind: ExecutableKind;
}

/** Why no native match was found (ERR-MCP-006 reasons, C002-IF-002 §5.2 step 3). */
export type LookupFailure = "not found on PATH" | "only a .cmd or .bat shim was found";

export interface LookupOptions {
  platform?: Platform;
  /** Windows: the PATHEXT value (default: `PATHEXT` of `env`, then `.COM;.EXE;.BAT;.CMD`). */
  pathext?: string;
}

type Env = Readonly<Record<string, string | undefined>>;

const DEFAULT_PATHEXT = ".COM;.EXE;.BAT;.CMD";

/** The value of the environment variable `name`; on Windows the key matches whatever its letter case (`Path`). */
export function envValue(env: Env, name: string, platform: Platform = CURRENT): string | undefined {
  if (platform !== "win32" || env[name] !== undefined) return env[name];
  const key = Object.keys(env).find((k) => k.toUpperCase() === name.toUpperCase());
  return key === undefined ? undefined : env[key];
}

/** The PATH of an environment (on Windows `Path`, `PATH` or any other letter case); `""` when unset. */
export const pathValue = (env: Env, platform: Platform = CURRENT): string => envValue(env, "PATH", platform) ?? "";

/** The PATH folders the lookup searches, in order: empty and non-absolute entries left out. */
export function pathFolders(path: string, platform: Platform = CURRENT): string[] {
  const out: string[] = [];
  for (const raw of path.split(platform === "win32" ? ";" : ":")) {
    // Windows allows an entry in double quotes (a folder whose name holds the separator).
    const entry = platform === "win32" ? raw.trim().replace(/^"(.*)"$/, "$1") : raw;
    if (entry === "") continue;
    // Windows: a drive letter with its root, or a UNC path; `C:x`, `\x` and `.` depend on the current drive or folder.
    const absolute = platform === "win32" ? /^([A-Za-z]:[\\/]|[\\/]{2}[^\\/])/.test(entry) : entry.startsWith("/");
    if (absolute) out.push(entry);
  }
  return out;
}

/** The kind of a Windows file by its extension; null for any extension other than `.com`, `.exe`, `.bat`, `.cmd`. */
function windowsKind(file: string): ExecutableKind | null {
  const ext = win32.extname(file).toLowerCase();
  if (ext === ".exe" || ext === ".com") return "native";
  if (ext === ".bat" || ext === ".cmd") return "shim";
  return null;
}

/**
 * The file names a PATH folder is tried for, in order, for the executable `name`: on Windows the name
 * with each PATHEXT extension (or the name as given when it already has an extension), each with its
 * kind; other extensions are left out. Elsewhere the name itself, native.
 */
export function executableNames(name: string, platform: Platform = CURRENT, pathext: string = DEFAULT_PATHEXT): { name: string; kind: ExecutableKind }[] {
  if (platform !== "win32") return [{ name, kind: "native" }];
  const candidates =
    win32.extname(name) !== ""
      ? [name]
      : (pathext.trim() === "" ? DEFAULT_PATHEXT : pathext)
          .split(";")
          .map((e) => e.trim())
          .filter((e) => e !== "")
          .map((e) => `${name}${e.startsWith(".") ? e : `.${e}`}`.replace(/\.[^.\\/]+$/, (x) => x.toLowerCase()));
  return candidates.flatMap((n) => {
    const kind = windowsKind(n);
    return kind === null ? [] : [{ name: n, kind }];
  });
}

/** True when `file` is a regular file (and, on POSIX, executable). */
function isExecutableFile(file: string, platform: Platform): boolean {
  try {
    if (!statSync(file).isFile()) return false;
    if (platform !== "win32") accessSync(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/** Every match of `name` on `path`, in lookup order (folders, then PATHEXT). */
function* matches(name: string, path: string, options: LookupOptions & { env?: Env }): Generator<ExecutableMatch> {
  const platform = options.platform ?? CURRENT;
  // A name with a folder in it is no PATH lookup; the starts of the table only pass bare names.
  if (/[\\/]/.test(name) || name === "") return;
  const pathext = options.pathext ?? (options.env ? envValue(options.env, "PATHEXT", platform) : undefined) ?? DEFAULT_PATHEXT;
  const names = executableNames(name, platform, pathext);
  const join = platform === "win32" ? win32.join : posix.join;
  for (const dir of pathFolders(path, platform))
    for (const n of names) {
      const file = join(dir, n.name);
      if (isExecutableFile(file, platform)) yield { file, kind: n.kind };
    }
}

/** The first match of `name` on `path`, native or shim (the host probes); null when nothing matches. */
export function findOnPath(name: string, path: string, options: LookupOptions & { env?: Env } = {}): ExecutableMatch | null {
  for (const m of matches(name, path, options)) return m;
  return null;
}

/** The first native match of `name` on `path`, shims passed over (every start but the probes). */
export function findNativeOnPath(name: string, path: string, options: LookupOptions & { env?: Env } = {}): { file: string } | { error: LookupFailure } {
  let shim = false;
  for (const m of matches(name, path, options)) {
    if (m.kind === "native") return { file: m.file };
    shim = true;
  }
  return { error: shim ? "only a .cmd or .bat shim was found" : "not found on PATH" };
}

/** `findNativeOnPath` over an environment's PATH and PATHEXT (default: this process's). */
export function nativeExecutable(name: string, env: Env = process.env, platform: Platform = CURRENT): { file: string } | { error: LookupFailure } {
  return findNativeOnPath(name, pathValue(env, platform), { env, platform });
}

/**
 * The platform shell for the probes' shims (Windows): `ComSpec` when it is an absolute path, else
 * `%SystemRoot%\System32\cmd.exe`, so the shell itself is not looked up by its bare name either.
 */
export function windowsShell(env: Env = process.env): string {
  const spec = envValue(env, "ComSpec", "win32");
  if (spec !== undefined && /^[A-Za-z]:[\\/]/.test(spec)) return spec;
  return win32.join(envValue(env, "SystemRoot", "win32") ?? "C:\\Windows", "System32", "cmd.exe");
}

export interface InsideOptions extends PathOptions {
  /** Resolve both paths through the file system first (current platform only). */
  real?: boolean;
}

/** True when `target` is `root` or lies below it. */
export function isInside(root: string, target: string, options: InsideOptions = {}): boolean {
  const key = (p: string) => (options.real ? pathKey(realPath(p)) : pathKey(p, options));
  const r = key(root);
  const t = key(target);
  if (t === r) return true;
  return t.startsWith(r.endsWith("/") ? r : r + "/");
}

/** `target` relative to `root` with forward slashes; both are normalised first. */
export function relativePath(root: string, target: string, options: PathOptions = {}): string {
  const platform = options.platform ?? CURRENT;
  const r = normalisePath(root, options);
  const t = normalisePath(target, options);
  return (platform === "win32" ? win32.relative(r, t) : posix.relative(r, t)).replace(/\\/g, "/");
}
