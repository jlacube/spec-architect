// Target generator entry (C002-IF-004, C002-ADR-003): bundles scripts/generate/main.ts with esbuild into
// build/generate/ and runs it, with the arguments and the exit code passed through. The bundle file is
// per process, so that concurrent runs (tests, check, packaging) never share one; it is removed after the run.
//   node scripts/generate.mjs [--target opencode|copilot]… [--source <plugin-dir>] [--out <dir>]
//                             [--mode <target>=<mode>]… [--json] [--quiet]
import { build } from "esbuild";
import { readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// C002-CON-16, C002-ADR-004: plugin.json is the single version source, as in scripts/build.mjs.
const { version } = JSON.parse(readFileSync(join(root, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8"));
const outfile = join(root, "build", "generate", `main-${process.pid}.mjs`);

let code = 3;
try {
  await build({
    entryPoints: [join(root, "scripts", "generate", "main.ts")],
    outfile,
    bundle: true,
    packages: "external",
    platform: "node",
    format: "esm",
    target: "node20",
    charset: "utf8",
    define: { __SDD_VERSION__: JSON.stringify(version) },
    logLevel: "warning",
  });
  const { main } = await import(pathToFileURL(outfile).href);
  code = main(process.argv.slice(2));
} catch (e) {
  console.error(`generate: internal error: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
  code = 3;
} finally {
  rmSync(outfile, { force: true });
}
process.exitCode = code;
