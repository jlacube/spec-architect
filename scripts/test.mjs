// Transpiles tests/**/*.test.ts with esbuild into build/tests/ and runs them with `node --test`
// (C001-ADR-006). Explicit file lists keep behaviour identical on Node 20 and 22.
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outdir = process.env.SDD_TEST_OUTDIR ?? join(root, "build", "tests");

// tests/replay/ is the corpus replay suite (C002-COMP-008): it runs only under `npm run replay`
// (tests/replay/run.mjs), without the no-network preload, never under `npm test` (C002-T-040, CR-17).
const REPLAY = join(root, "tests", "replay");

function findTests(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === "fixtures" || p === REPLAY ? [] : findTests(p);
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
  // C002-ADR-004: the version comes from plugin.json, as in scripts/build.mjs.
  define: { __SDD_VERSION__: JSON.stringify(JSON.parse(readFileSync(join(root, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8")).version) },
  logLevel: "warning",
});

const files = entries.map((e) => join(outdir, relative(join(root, "tests"), e)).replace(/\.ts$/, ".mjs"));
console.log(`running ${files.length} test file(s): ${files.map((f) => relative(root, f).split(sep).join("/")).join(", ")}`);
// C001-NFR-202: every Node process of the run (tests and the CLI they spawn) loads the no-network stubs;
// any recorded attempt fails the run.
const netLog = join(outdir, "..", `${outdir.split(sep).pop()}-no-network.log`);
rmSync(netLog, { force: true });
const preload = `--import=${pathToFileURL(join(root, "tests", "no-network.mjs")).href}`;
const env = { ...process.env, NODE_OPTIONS: [process.env.NODE_OPTIONS, preload].filter(Boolean).join(" "), SDD_NO_NETWORK_LOG: netLog };
// A run started from inside a test (C001-TS-1118) must not inherit node:test's child marker, or it
// reports to the outer runner instead of failing with its own exit code.
delete env.NODE_TEST_CONTEXT;
// Timing tests run after the parallel batch, one file at a time: with ~900 tests sharing the cores, a
// spawned CLI's start-up time is bound by machine load, not by the code (C001-TS-705 measured 900–1200 ms
// under load and 285 ms p95 alone). Their thresholds stay as the scenarios state.
const TIMING = ["integration/cap07/TS-705.test"];
const isTiming = (f) => TIMING.some((t) => relative(outdir, f).split(sep).join("/").includes(t));
const parallel = files.filter((f) => !isTiming(f));
const serial = files.filter(isTiming);
const res = parallel.length > 0 ? spawnSync(process.execPath, ["--test", ...flags, ...parallel], { stdio: "inherit", cwd: root, env }) : { status: 0 };
const timed = serial.length > 0 ? spawnSync(process.execPath, ["--test", "--test-concurrency=1", ...flags, ...serial], { stdio: "inherit", cwd: root, env }) : { status: 0 };
const attempts = existsSync(netLog) ? readFileSync(netLog, "utf8").trim() : "";
if (attempts) {
  console.error(`network access attempted during the tests (C001-NFR-202):\n${attempts}`);
  process.exit(1);
}
console.log("network calls during the tests: 0 (C001-NFR-202)");
process.exit((res.status ?? 1) || (timed.status ?? 1));
