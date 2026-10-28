// Coverage mode of scripts/test.mjs (C001-NFR-502; D-021): turns the raw V8 coverage files one batch left in
// its NODE_V8_COVERAGE folder into one lcov file, and fails loudly when coverage of the batch was lost.
//   node --expose-internals scripts/check/coverage-raw.mjs <raw folder> <lcov out> [test file …]
// Each raw file (one per process) is summarised alone by node's own TestCoverage (same source-map handling
// and line rules as `--experimental-test-coverage`), and the per-process figures are summed by
// scripts/check/coverage.mjs (addSummary). node's merge of several raw files depends on the order of the
// files in the folder (their names hold the process id), which made the figure change from run to run.
// Exit 1, with no lcov file written, when the folder holds no raw file, a raw file cannot be read or parsed,
// or a test file of the batch left no raw coverage of its own process.
import { createRequire } from "node:module";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { addSummary, missingTestFiles, toLcov } from "./coverage.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const [rawDir, out, ...expected] = process.argv.slice(2);
if (!rawDir || !out) {
  console.error("usage: node --expose-internals scripts/check/coverage-raw.mjs <raw folder> <lcov out> [test file …]");
  process.exit(2);
}
let TestCoverage;
try {
  ({ TestCoverage } = createRequire(import.meta.url)("internal/test_runner/coverage"));
  for (const m of ["mergeCoverage", "mapCoverageWithSourceMap", "summary"]) if (typeof TestCoverage?.prototype?.[m] !== "function") throw new Error(`TestCoverage.${m} is missing`);
} catch (e) {
  console.error(`coverage: node ${process.version} has no internal/test_runner/coverage (run with --expose-internals on Node 22): ${e.message}`);
  process.exit(1);
}

const srcUrl = pathToFileURL(join(root, "src") + sep).href.toLowerCase();
const names = readdirSync(rawDir).filter((n) => /^coverage-\d+-\d+-\d+\.json$/.test(n)).sort();
const errors = [];
const flushed = new Set();
const files = new Map();
for (const name of names) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(join(rawDir, name), "utf8"));
    if (!Array.isArray(raw.result)) throw new Error("no result array");
  } catch (e) {
    errors.push(`${name}: ${e.message}`);
    continue;
  }
  const maps = raw["source-map-cache"] ?? {};
  for (const s of raw.result) if (s.url.startsWith("file:")) flushed.add(fileURLToPath(s.url));
  // Only scripts that can hold src/ code: those with a source map (the bundles and the transpiled tests)
  // and src/ files loaded directly. Leaving node_modules and node: scripts out keeps this fast.
  const coverage = { ...raw, result: raw.result.filter((s) => maps[s.url] != null || s.url.toLowerCase().startsWith(srcUrl)) };
  const cov = new TestCoverage(rawDir, undefined, root, undefined, undefined, true, { line: 0, branch: 0, function: 0 });
  // One process alone: no cross-process merge by node (the order-dependent step D-021 removes).
  cov.getCoverageFromDirectory = function () {
    const merged = new Map();
    this.mergeCoverage(merged, this.mapCoverageWithSourceMap(coverage));
    return [...merged.values()];
  };
  try {
    addSummary(files, cov.summary().files, root);
  } catch (e) {
    errors.push(`${name}: ${e.message}`);
  }
}
const missing = missingTestFiles(flushed, expected);
if (names.length === 0) errors.push(`no raw coverage file in ${rawDir}`);
for (const m of missing) errors.push(`no raw coverage from the process of ${m} (killed, timed out or crashed before it exited)`);
if (errors.length > 0) {
  console.error(`coverage: coverage of this batch was lost (D-021); no lcov written:\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
writeFileSync(out, toLcov(files));
console.log(`coverage mode: ${names.length} raw coverage file(s) summed into ${out}`);
