// Platform-neutral path normalisation for the CLI and the path guard (C001-REQ-1104). This is the
// one module allowed to contain Windows-specific path handling (C001-NFR-402, PLG-PORT-002).
//
// - normalisePath: lexical. Absolute, `.`/`..` resolved, forward slashes, no trailing slash,
//   upper-case drive letter, `\\?\` prefixes removed. Works for either platform on any OS.
// - pathKey: comparison key. Windows paths are case-folded (NTFS is case-insensitive by default).
// - realPath: resolves symbolic links, junctions, subst/UNC aliases and 8.3 short names through the
//   file system, for the longest existing prefix; segments that do not exist yet (a file about to
//   be written) are appended lexically.
import { realpathSync } from "node:fs";
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
