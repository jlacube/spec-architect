// Transpiles tests/**/*.test.ts with esbuild into build/tests/ and runs them with `node --test`
// (C001-ADR-006). Explicit file lists keep behaviour identical on Node 20 and 22.
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outdir = join(root, "build", "tests");

function findTests(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === "fixtures" ? [] : findTests(p);
    return e.name.endsWith(".test.ts") ? [p] : [];
  });
}

const entries = findTests(join(root, "tests"));
rmSync(outdir, { recursive: true, force: true });
await build({
  entryPoints: entries,
  outdir,
  outbase: join(root, "tests"),
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  target: "node20",
  outExtension: { ".js": ".mjs" },
  logLevel: "warning",
});

const files = entries.map((e) => join(outdir, relative(join(root, "tests"), e)).replace(/\.ts$/, ".mjs"));
console.log(`running ${files.length} test file(s): ${files.map((f) => relative(root, f).split(sep).join("/")).join(", ")}`);
const res = spawnSync(process.execPath, ["--test", ...process.argv.slice(2), ...files], { stdio: "inherit", cwd: root });
process.exit(res.status ?? 1);
