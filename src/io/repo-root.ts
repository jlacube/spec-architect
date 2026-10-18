// Repository root and "inside the repository" test (C002-IF-008 §1.1 rule 3), shared by the Serena
// data-folder rule (§1.1 rule 2), the `--cwd` rule of the writing subcommands (§1.2, C002-REQ-521)
// and ERR-CLI-020 of the sdd CLI (C002-REQ-516, C002-IF-007). No other module re-implements the root.
//
// - findRepositoryRoot: the nearest folder upward, the start included, that holds `.git` (a folder,
//   or the file of a worktree or submodule); else the nearest that holds a `.sdd/` folder; else the
//   start folder itself.
// - locateInRepository: where a folder lies relative to the root, as written (lexical) and after link
//   resolution (real paths of both sides), compared per path segment with the keys of paths.ts.
//
// `decidePath` (guard-path) and the CLI's workspace lookup keep `findWorkspace` (nearest `.sdd/`):
// the workspace and the repository root are different rules (CHG-002 blast radius §5 question 2).
import { existsSync, statSync } from "node:fs";
import { dirname } from "node:path";
import { isInside, normalisePath, realPath } from "./paths.ts";

function holds(dir: string, name: string, folderOnly: boolean): boolean {
  const p = dir.endsWith("/") ? dir + name : dir + "/" + name;
  try {
    return folderOnly ? statSync(p).isDirectory() : existsSync(p);
  } catch {
    return false;
  }
}

/** Nearest ancestor of `dir` (itself included) that holds `name`, or null. */
function nearest(dir: string, name: string, folderOnly: boolean): string | null {
  for (let d = dir; ; ) {
    if (holds(d, name, folderOnly)) return d;
    const parent = normalisePath(dirname(d));
    if (parent === d) return null;
    d = parent;
  }
}

/** Repository root for `start` (normalised; relative paths resolve against process.cwd()). */
export function findRepositoryRoot(start: string): string {
  const dir = normalisePath(start);
  return nearest(dir, ".git", false) ?? nearest(dir, ".sdd", true) ?? dir;
}

export interface RepositoryLocation {
  /** The folder resolved lexically against `cwd`. */
  written: string;
  /** The folder through the real path of its longest existing prefix. */
  real: string;
  /** `written` is the root or lies below it (lexical root). */
  insideWritten: boolean;
  /** `real` is the real root or lies below it. */
  insideReal: boolean;
}

/** Where `folder` (absolute, or relative to `cwd`) lies relative to the repository `root`. */
export function locateInRepository(root: string, folder: string, cwd: string): RepositoryLocation {
  const written = normalisePath(folder, { cwd: normalisePath(cwd) });
  const real = realPath(written);
  return {
    written,
    real,
    insideWritten: isInside(normalisePath(root), written),
    insideReal: isInside(realPath(root), real),
  };
}

/** True when `folder` lies inside `root` both as written and after link resolution (§1.2 `--cwd` rule). */
export function isInsideRepository(root: string, folder: string, cwd: string): boolean {
  const l = locateInRepository(root, folder, cwd);
  return l.insideWritten && l.insideReal;
}

/** True when `folder` lies outside `root` both as written and after link resolution (§1.1 rule 2). */
export function isOutsideRepository(root: string, folder: string, cwd: string): boolean {
  const l = locateInRepository(root, folder, cwd);
  return !l.insideWritten && !l.insideReal;
}
