import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Repository root: the nearest ancestor of the running test file that holds package.json. */
export function repoRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(join(dir, "package.json"))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error("package.json not found above " + fileURLToPath(import.meta.url));
    dir = parent;
  }
  return dir;
}
