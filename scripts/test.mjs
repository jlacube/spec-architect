// Transpiles tests/**/*.test.ts with esbuild into build/tests/ and runs them with `node --test`
// (C001-ADR-006). Explicit file lists keep behaviour identical on Node 20 and 22.
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync } from "node:fs";
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

// Positional arguments filter test files by path substring (`npm test -- model`); flags go to node --test.
const args = process.argv.slice(2);
const filters = args.filter((a) => !a.startsWith("-"));
const flags = args.filter((a) => a.startsWith("-"));
const entries = findTests(join(root, "tests")).filter(
  (p) => filters.length === 0 || filters.some((f) => relative(root, p).split(sep).join("/").includes(f)),
);
if (entries.length === 0) {
  console.error(`no test files match: ${filters.join(", ")}`);
  process.exit(1);
}
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
  define: { __SDD_VERSION__: JSON.stringify(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version) },
  logLevel: "warning",
});

const files = entries.map((e) => join(outdir, relative(join(root, "tests"), e)).replace(/\.ts$/, ".mjs"));
console.log(`running ${files.length} test file(s): ${files.map((f) => relative(root, f).split(sep).join("/")).join(", ")}`);
const res = spawnSync(process.execPath, ["--test", ...flags, ...files], { stdio: "inherit", cwd: root });
process.exit(res.status ?? 1);
