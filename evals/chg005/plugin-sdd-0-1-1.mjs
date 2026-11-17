// Plugin-path function of the cases of C005-TS-120 and C005-TS-121 (C005-TC-020, C005-TC-021; C005-T-007
// step 1): the eval overlay plugin with real specialists (as architectReal()), copied to a folder of its own,
// whose scripts/sdd.mjs is a wrapper. `--version` prints 0.1.1; every other invocation runs the working-tree
// bundle plugins/architect/scripts/sdd.mjs with the same arguments and working folder, standard input, output
// and error inherited (hooks read their input from standard input; Serena's MCP server talks over stdio), and
// exits with the bundle's exit code. The floor runs come before the version bump of C005-T-016, so the
// working-tree CLI still prints 0.1.0. The wrapper lives under evals/, outside plugins/, so the plugin-path
// scan of C005-TS-131 does not see it.
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { architectReal } from "../harness/overlay.mjs";

export const WRAPPED_VERSION = "0.1.1";
const BUNDLE = join(import.meta.dirname, "..", "..", "plugins", "architect", "scripts", "sdd.mjs");

const wrapper = () => `#!/usr/bin/env node
// Eval wrapper (evals/chg005/plugin-sdd-0-1-1.mjs): --version prints ${WRAPPED_VERSION}; anything else runs the bundle.
import { spawnSync } from "node:child_process";
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === "--version") {
  process.stdout.write("${WRAPPED_VERSION}\\n");
  process.exit(0);
}
const r = spawnSync(process.execPath, [${JSON.stringify(BUNDLE)}, ...args], { stdio: "inherit" });
process.exit(r.status ?? 1);
`;

let built = null;

export function architectSdd011() {
  if (built && existsSync(built)) return built;
  const base = architectReal();
  const dir = join(mkdtempSync(join(tmpdir(), "sdd-eval-plugin-011-")), "architect");
  cpSync(base, dir, { recursive: true });
  writeFileSync(join(dir, "scripts", "sdd.mjs"), wrapper());
  process.once("exit", () => {
    try {
      rmSync(dirname(dir), { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch {
      // A session still holds the folder; it is left.
    }
  });
  built = dir;
  return dir;
}
