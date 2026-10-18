// `npm run replay` (C002-COMP-008, C002-T-040): the corpus replay suite's own command. It transpiles
// tests/replay/ with esbuild into build/replay/ and runs it WITHOUT the tests/no-network.mjs preload of
// `npm test`, so that the OpenCode adapter's loopback stub model can listen (C002-ADR-005); `npm test`
// leaves tests/replay/ out (scripts/test.mjs).
//
//   npm run replay                                   every replay scenario file (tests/replay/**/*.test.ts)
//   npm run replay -- suite opencode-host            the scenario files whose path contains a filter
//   npm run replay -- --mechanism <m>[,…] | --all    mechanism runs writing replay reports (tests/replay/main.ts)
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const outdir = join(root, "build", "replay");

function findTests(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === "fixtures" ? [] : findTests(p);
    return e.name.endsWith(".test.ts") ? [p] : [];
  });
}

const args = process.argv.slice(2);
const mechanismRun = args.some((a) => a.startsWith("--"));
const filters = mechanismRun ? [] : args;
const tests = findTests(here).filter((p) => filters.length === 0 || filters.some((f) => relative(root, p).split(sep).join("/").includes(f)));
if (!mechanismRun && tests.length === 0) {
  console.error(`no replay test files match: ${filters.join(", ")}`);
  process.exit(1);
}

rmSync(outdir, { recursive: true, force: true });
await build({
  entryPoints: [join(here, "main.ts"), ...(mechanismRun ? [] : tests)],
  outdir,
  outbase: here,
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  target: "node20",
  outExtension: { ".js": ".mjs" },
  define: { __SDD_VERSION__: JSON.stringify(JSON.parse(readFileSync(join(root, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8")).version) },
  logLevel: "warning",
});

if (mechanismRun) {
  const { main } = await import(pathToFileURL(join(outdir, "main.mjs")).href);
  process.exit(await main(args));
}

const files = tests.map((t) => join(outdir, relative(here, t)).replace(/\.ts$/, ".mjs"));
console.log(`running ${files.length} replay file(s): ${files.map((f) => relative(root, f).split(sep).join("/")).join(", ")}`);
const env = { ...process.env };
delete env.NODE_TEST_CONTEXT;
const res = spawnSync(process.execPath, ["--test", ...files], { stdio: "inherit", cwd: root, env });
process.exit(res.status ?? 1);
