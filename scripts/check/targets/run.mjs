// Target structure checks entry (C002-IF-005 §6, C002-COMP-007): bundles ./index.mjs (which imports the
// generator's TypeScript modules) with esbuild into build/check-targets/ and runs it, as
// scripts/generate.mjs does for the generator. The bundle is per process and removed after the run.
//   node scripts/check/targets/run.mjs [--plugin <plugin-dir>] [--mode <target>=<mode>]… [--json]
//   (each target in its table's mode unless --mode names another; exit 1 on any finding)
// The plugin folder defaults to plugins/architect, or SDD_CHECK_PLUGIN when set.
import { build } from "esbuild";
import { readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const plugin = join(root, "plugins", "architect");
// C002-CON-16, C002-ADR-004: plugin.json is the single version source.
const { version } = JSON.parse(readFileSync(join(plugin, ".claude-plugin", "plugin.json"), "utf8"));
const outfile = join(root, "build", "check-targets", `index-${process.pid}.mjs`);

let code = 2;
try {
  await build({
    entryPoints: [join(root, "scripts", "check", "targets", "index.mjs")],
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
  const { cli } = await import(pathToFileURL(outfile).href);
  code = cli(process.argv.slice(2), plugin);
} catch (e) {
  console.error(`target structure checks: internal error: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
  code = 2;
} finally {
  rmSync(outfile, { force: true });
}
process.exitCode = code;
