// Workspace discovery shared by the CLI and the hooks (C001-IF-01 "Synopsis", C001-IF-07 §1 `cwd`).
import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

/** First folder containing `.sdd/`, walking up from `start`. */
export function findWorkspace(start: string): string | null {
  let dir = start;
  for (;;) {
    const sdd = join(dir, ".sdd");
    if (existsSync(sdd) && statSync(sdd).isDirectory()) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
