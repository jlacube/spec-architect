// Transpiles tests/**/*.test.ts with esbuild into build/tests/ and runs them with `node --test`
// (C001-ADR-006). Explicit file lists keep behaviour identical on Node 20 and 22.
// Coverage mode (SDD_TEST_COVERAGE=1; C001-NFR-502, the method of docs/nfr-results.md §4): the test files
// are transpiled with inline source maps; both bundles (plugins/architect/scripts/sdd.mjs,
// build/npm/sdd-mcp.mjs) are rebuilt with inline source maps, so the CLI and MCP server processes the tests
// spawn report coverage of src/ too; NODE_OPTIONS carries --enable-source-maps beside the no-network
// preload; `node --test --experimental-test-coverage` (in batches of files, to bound the disk space of the
// raw coverage files) writes lcov, joined into coverage/lcov.info. The timing tests
// still run alone afterwards, without coverage. The rebuilt bundles are not the shipped ones: the `coverage`
// step of scripts/check.mjs restores them with scripts/build.mjs (also when this run fails).
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outdir = process.env.SDD_TEST_OUTDIR ?? join(root, "build", "tests");
const coverage = process.env.SDD_TEST_COVERAGE === "1";
const version = JSON.parse(readFileSync(join(root, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8")).version;

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
  define: { __SDD_VERSION__: JSON.stringify(version) },
  ...(coverage ? { sourcemap: "inline", sourcesContent: false } : {}),
  logLevel: "warning",
});

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * A source map reduced to the segments of `src/` sources (only src/ is measured), with absolute file URLs
 * as sources and no names. Every spawned process writes the map into its coverage file, so a map of the
 * whole bundle (node_modules included) multiplies the disk space a coverage run needs. With the whole
 * map, node 22 also drops the coverage of src/ functions next to node_modules code (C001-T-080: the
 * post-write hook, run by tests through the bundle, showed as uncovered).
 */
function srcOnlyMap(map, abs) {
  const srcDir = join(root, "src") + sep;
  const keep = map.sources.map((s) => abs(s).startsWith(srcDir));
  const index = [];
  const sources = [];
  map.sources.forEach((s, i) => {
    if (keep[i]) {
      index[i] = sources.length;
      sources.push(pathToFileURL(abs(s)).href);
    }
  });
  const decode = (seg) => {
    const out = [];
    let value = 0;
    let shift = 0;
    for (const ch of seg) {
      const d = B64.indexOf(ch);
      value += (d & 31) << shift;
      if (d & 32) shift += 5;
      else {
        out.push(value & 1 ? -(value >>> 1) : value >>> 1);
        value = 0;
        shift = 0;
      }
    }
    return out;
  };
  const encode = (n) => {
    let v = n < 0 ? (-n << 1) | 1 : n << 1;
    let s = "";
    do {
      let d = v & 31;
      v >>>= 5;
      if (v > 0) d |= 32;
      s += B64[d];
    } while (v > 0);
    return s;
  };
  let src = 0, line = 0, col = 0; // running values of the input
  let oSrc = 0, oLine = 0, oCol = 0; // running values of the output
  const lines = map.mappings.split(";").map((group) => {
    let gen = 0;
    let oGen = 0;
    let mapped = false; // the last output segment of this line maps to a source
    const out = [];
    for (const seg of group === "" ? [] : group.split(",")) {
      const f = decode(seg);
      gen += f[0];
      if (f.length >= 4) {
        src += f[1];
        line += f[2];
        col += f[3];
      }
      if (f.length < 4 || !keep[src]) {
        // An unmapped segment ends the previous mapping, so dropped code is not attributed to src/.
        if (mapped) {
          out.push(encode(gen - oGen));
          oGen = gen;
          mapped = false;
        }
        continue;
      }
      mapped = true;
      const ni = index[src];
      out.push(encode(gen - oGen) + encode(ni - oSrc) + encode(line - oLine) + encode(col - oCol));
      oGen = gen;
      oSrc = ni;
      oLine = line;
      oCol = col;
    }
    return out.join(",");
  });
  return { version: 3, sources, names: [], mappings: lines.join(";") };
}

/**
 * Coverage mode: the bundles of scripts/build.mjs (same entries, options and header lines), each with an
 * inline source map whose sources are absolute file URLs, so a spawned process maps its coverage to src/.
 * Input source maps of node_modules are dropped (only src/ is measured).
 */
async function buildMappedBundles() {
  const npmdir = join(root, "build", "npm");
  const ENTRIES = [
    { name: "sdd", entry: join(root, "src", "cli.ts"), outfile: join(root, "plugins", "architect", "scripts", "sdd.mjs"), what: "sdd CLI" },
    { name: "sdd-mcp", entry: join(root, "src", "mcp", "server.ts"), outfile: join(npmdir, "sdd-mcp.mjs"), what: "sdd MCP server" },
  ];
  const res = await build({
    entryPoints: ENTRIES.map((e) => ({ in: e.entry, out: e.name })),
    outdir: npmdir,
    write: false,
    absWorkingDir: root,
    outExtension: { ".js": ".mjs" },
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    charset: "utf8",
    legalComments: "eof",
    define: { __SDD_VERSION__: JSON.stringify(version) },
    sourcemap: "external",
    sourcesContent: false,
    plugins: [
      {
        name: "no-input-maps",
        setup(b) {
          b.onLoad({ filter: /node_modules[\\/].*\.(c|m)?js$/ }, (a) => ({ contents: readFileSync(a.path, "utf8").replace(/^\/\/# sourceMappingURL=.*$/gm, ""), loader: "js", resolveDir: dirname(a.path) }));
        },
      },
    ],
    banner: { js: [`import { createRequire as __sddCreateRequire } from "node:module";`, `const require = __sddCreateRequire(import.meta.url);`].join("\n") },
    logLevel: "warning",
  });
  for (const e of ENTRIES) {
    const js = res.outputFiles.find((f) => f.path === join(npmdir, `${e.name}.mjs`));
    const mapFile = res.outputFiles.find((f) => f.path === join(npmdir, `${e.name}.mjs.map`));
    if (!js || !mapFile) throw new Error(`coverage: no output for ${e.name}`);
    const map = srcOnlyMap(JSON.parse(mapFile.text), (s) => join(npmdir, s));
    map.mappings = ";;" + map.mappings; // the two header lines written below
    const text = js.text.replace(/\/\/# sourceMappingURL=.*\s*$/, "");
    mkdirSync(dirname(e.outfile), { recursive: true });
    const header = `#!/usr/bin/env node\n// architect-plugin@${version} — ${e.what}. Generated by scripts/build.mjs; do not edit.\n`;
    writeFileSync(e.outfile, `${header}${text}\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(map)).toString("base64")}\n`);
  }
  console.log("coverage mode: bundles rebuilt with inline source maps (restore with node scripts/build.mjs)");
}
if (coverage) await buildMappedBundles();

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
// Nor coverage mode: a nested run (the fixtures step of C001-TS-1118) would rebuild the bundles and coverage/.
delete env.SDD_TEST_COVERAGE;
// Timing tests run after the parallel batch, one file at a time: with ~900 tests sharing the cores, a
// spawned CLI's start-up time is bound by machine load, not by the code (C001-TS-705 measured 900–1200 ms
// under load and 285 ms p95 alone). Their thresholds stay as the scenarios state.
const TIMING = ["integration/cap07/TS-705.test"];
const isTiming = (f) => TIMING.some((t) => relative(outdir, f).split(sep).join("/").includes(t));
const parallel = files.filter((f) => !isTiming(f));
const serial = files.filter(isTiming);
/**
 * Coverage mode: the parallel files run in batches of SDD_TEST_COVERAGE_BATCH files (default 16), each a
 * `node --test --experimental-test-coverage` run with its own lcov file; node keeps one raw V8 coverage file
 * (several hundred KB) per spawned process in the temporary folder until its run ends, so batches bound the
 * disk space a coverage run needs. The batch files are joined into coverage/lcov.info, whose records of one
 * source file scripts/check/coverage.mjs merges.
 */
function coverageRun(list) {
  const dir = join(root, "coverage");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const size = Math.max(1, Number(process.env.SDD_TEST_COVERAGE_BATCH) || 16);
  const covEnv = { ...env, NODE_OPTIONS: [env.NODE_OPTIONS, "--enable-source-maps"].join(" ") };
  let status = 0;
  const parts = [];
  for (let i = 0; i < list.length; i += size) {
    const part = join(dir, `lcov-${String(parts.length + 1).padStart(3, "0")}.info`);
    const batch = list.slice(i, i + size);
    console.log(`coverage mode: batch ${parts.length + 1} of ${Math.ceil(list.length / size)} (${batch.length} file(s))`);
    const covFlags = ["--experimental-test-coverage", "--test-reporter=tap", "--test-reporter-destination=stdout", "--test-reporter=lcov", `--test-reporter-destination=${part}`];
    const r = spawnSync(process.execPath, ["--enable-source-maps", "--test", ...covFlags, ...flags, ...batch], { stdio: "inherit", cwd: root, env: covEnv });
    if ((r.status ?? 1) !== 0) status = r.status ?? 1;
    parts.push(part);
  }
  writeFileSync(join(dir, "lcov.info"), parts.filter((p) => existsSync(p)).map((p) => readFileSync(p, "utf8")).join("\n"));
  console.log("coverage mode: lcov written to coverage/lcov.info");
  return { status };
}
const res = parallel.length === 0 ? { status: 0 } : coverage ? coverageRun(parallel) : spawnSync(process.execPath, ["--test", ...flags, ...parallel], { stdio: "inherit", cwd: root, env });
const timed = serial.length > 0 ? spawnSync(process.execPath, ["--test", "--test-concurrency=1", ...flags, ...serial], { stdio: "inherit", cwd: root, env }) : { status: 0 };
const attempts = existsSync(netLog) ? readFileSync(netLog, "utf8").trim() : "";
if (attempts) {
  console.error(`network access attempted during the tests (C001-NFR-202):\n${attempts}`);
  process.exit(1);
}
console.log("network calls during the tests: 0 (C001-NFR-202)");
process.exit((res.status ?? 1) || (timed.status ?? 1));
