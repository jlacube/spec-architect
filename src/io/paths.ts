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
