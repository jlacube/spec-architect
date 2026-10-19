// Release check entry (C002-IF-009 §5, C002-COMP-010, C002-ADR-003): bundles scripts/release/main.ts
// with esbuild into build/release/ and runs it, with the arguments and the exit code passed through. The
// bundle file is per process, so that concurrent runs never share one; it is removed after the run.
//   node scripts/release-check.mjs --target opencode|copilot [--version <v>] [--dry-run] [--root <dir>]
// The check never publishes anything: it decides, prints the refusals and writes the release record.
import { build } from "esbuild";
import { readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// C002-CON-16, C002-ADR-004: plugin.json is the single version source, as in scripts/generate.mjs.
const { version } = JSON.parse(readFileSync(join(root, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8"));
const outfile = join(root, "build", "release", `main-${process.pid}.mjs`);

let code = 3;
try {
  await build({
    entryPoints: [join(root, "scripts", "release", "main.ts")],
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
  code = main(process.argv.slice(2), { root });
} catch (e) {
  console.error(`release-check: internal error: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
  code = 3;
} finally {
  rmSync(outfile, { force: true });
}
process.exitCode = code;
