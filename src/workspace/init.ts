// `sdd init` (C001-REQ-101, 102): create `.sdd/` or complete it. Existing files are never changed
// unless `--force` is given, and then only SDD.md is re-rendered (its status block is kept).
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { writeTextAtomic } from "../io/atomic.ts";
import { TOOL } from "../version.ts";
import { ROOT_DIRS } from "./layout.ts";
import { readStatusBlock, renderSddMd } from "./sddmd.ts";

export interface InitResult {
  root: string;
  existed: boolean;
  /** Entries created, relative to `.sdd/` (directories end with `/`). */
  created: string[];
  /** Entries rewritten by --force. */
  rewritten: string[];
}

const isDir = (p: string) => existsSync(p) && statSync(p).isDirectory();

/** Repository root for init: nearest folder with `.sdd/`, else nearest with `.git`, else `start`. */
export function initRoot(start: string): string {
  for (const marker of [".sdd", ".git"]) {
    let dir = start;
    for (;;) {
      if (existsSync(join(dir, marker))) return dir;
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return start;
}

export function initWorkspace(root: string, options: { force?: boolean; now?: Date } = {}): InitResult {
  const sdd = join(root, ".sdd");
  const existed = isDir(sdd);
  const created: string[] = [];
  const rewritten: string[] = [];
  if (!existed) mkdirSync(sdd, { recursive: true });
  for (const d of ROOT_DIRS) {
    if (!isDir(join(sdd, d))) {
      mkdirSync(join(sdd, d));
      created.push(d + "/");
    }
  }
  const registry = join(sdd, "registry.json");
  if (!existsSync(registry)) {
    const doc = { sdd_version: 1, generated_at: (options.now ?? new Date()).toISOString().replace(/\.\d{3}Z$/, "Z"), changes: [] };
    writeTextAtomic(registry, JSON.stringify(doc, null, 2) + "\n");
    created.push("registry.json");
  }
  const sddMd = join(sdd, "SDD.md");
  if (!existsSync(sddMd)) {
    writeTextAtomic(sddMd, renderSddMd(TOOL));
    created.push("SDD.md");
  } else if (options.force) {
    const block = readStatusBlock(readFileSync(sddMd, "utf8"));
    writeTextAtomic(sddMd, block === null ? renderSddMd(TOOL) : renderSddMd(TOOL, block));
    rewritten.push("SDD.md");
  }
  return { root, existed, created, rewritten };
}
