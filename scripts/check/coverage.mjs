// Coverage threshold of `npm run check` (C001-NFR-502; C001-T-080, finding F-5): reads the lcov file that
// `scripts/test.mjs` writes in coverage mode (SDD_TEST_COVERAGE=1, method of docs/nfr-results.md §4) and
// computes lines and branches over every TypeScript file under `src/`, with no exclusions. A file of src/
// that no test loaded has no lcov record; it counts with all its lines uncovered (node's lcov counts every
// line of a file, blank and comment lines included). Prints both figures and the 10 files with the lowest
// line coverage; exits 1 below 85.00% lines or 75.00% branches.
//   node scripts/check/coverage.mjs [lcov file (default coverage/lcov.info)]
// SDD_TEST_COVERAGE_MIN_LINES / SDD_TEST_COVERAGE_MIN_BRANCHES (tests only) raise a threshold, to show that
// an unmet threshold fails the step (C001-TC-1130); a value below the NFR's threshold is ignored.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const MIN_LINES = 85;
export const MIN_BRANCHES = 75;

/** The thresholds in percent: the NFR's, raised (never lowered) by the test-only variables. */
export function thresholds(env = process.env) {
  const raise = (min, v) => (v !== undefined && v !== "" && Number.isFinite(Number(v)) ? Math.max(min, Number(v)) : min);
  return { lines: raise(MIN_LINES, env["SDD_TEST_COVERAGE_MIN_LINES"]), branches: raise(MIN_BRANCHES, env["SDD_TEST_COVERAGE_MIN_BRANCHES"]) };
}

/**
 * Why the `coverage` step is skipped on this Node.js version, or null when it measures (C001-T-080, F-7;
 * C001-NFR-502 Environment): on Node 20 the test runner crashes while merging the coverage of several
 * processes, so C001-NFR-502 is measured on Node 22.22.3. The skipped step counts as passed.
 */
export function coverageSkip(version = process.versions.node) {
  if (Number(String(version).replace(/^v/, "").split(".")[0]) !== 20) return null;
  return `Node ${String(version).replace(/^v/, "")}: Node 20's test runner crashes while merging coverage from several processes ("reading 'startOffset'"); C001-NFR-502 is measured on Node 22.22.3`;
}

/** `src/…` path of an lcov SF entry relative to `root`, with `/`; null outside src/. Case-insensitive on Windows. */
export function srcPath(sf, root) {
  const abs = isAbsolute(sf) ? sf : join(root, sf);
  let rel = relative(root, abs).split(sep).join("/");
  if (process.platform === "win32" && rel.toLowerCase().startsWith("src/")) rel = "src/" + rel.slice(4);
  return rel.startsWith("src/") ? rel : null;
}

/**
 * Parses lcov text into per-file line and branch hits, merging records of the same file (one per batch of
 * scripts/test.mjs): `Map<src path, { lines: Map<line, hits>, branches: Map<"line#k", hits> }>`. node numbers
 * the BRDA blocks of a record in sequence, so the block number of one branch differs between records; a
 * branch is keyed by its line and its rank among the branches of that line in its record instead.
 */
export function parseLcov(text, root) {
  const files = new Map();
  let cur = null;
  let rank = new Map();
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("SF:")) {
      const p = srcPath(line.slice(3), root);
      cur = p === null ? null : files.get(p) ?? { lines: new Map(), branches: new Map() };
      if (p !== null) files.set(p, cur);
      rank = new Map();
    } else if (line === "end_of_record") cur = null;
    else if (cur && line.startsWith("DA:")) {
      const [n, hits] = line.slice(3).split(",");
      cur.lines.set(Number(n), (cur.lines.get(Number(n)) ?? 0) + Number(hits));
    } else if (cur && line.startsWith("BRDA:")) {
      const parts = line.slice(5).split(",");
      const k = rank.get(parts[0]) ?? 0;
      rank.set(parts[0], k + 1);
      const key = `${parts[0]}#${k}`;
      cur.branches.set(key, (cur.branches.get(key) ?? 0) + (parts[3] === "-" ? 0 : Number(parts[3])));
    }
  }
  return files;
}

/** Every `.ts` file under `<root>/src/`, as `src/…` paths. */
export function srcFiles(root) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".ts")) out.push(relative(root, p).split(sep).join("/"));
    }
  };
  walk(join(root, "src"));
  return out;
}

const pct = (hit, found) => (found === 0 ? 100 : (100 * hit) / found);

/**
 * Totals over `sources` (the src/ files): lines and branches found and hit, per file and overall. A source
 * without a record counts with `lineCount(path)` lines found and none hit.
 */
export function summarize(files, sources, lineCount) {
  const per = sources.map((path) => {
    const f = files.get(path);
    if (!f) return { path, lf: lineCount(path), lh: 0, brf: 0, brh: 0, loaded: false };
    const lh = [...f.lines.values()].filter((h) => h > 0).length;
    const brh = [...f.branches.values()].filter((h) => h > 0).length;
    return { path, lf: f.lines.size, lh, brf: f.branches.size, brh, loaded: true };
  });
  const sum = (k) => per.reduce((a, r) => a + r[k], 0);
  const t = { lf: sum("lf"), lh: sum("lh"), brf: sum("brf"), brh: sum("brh") };
  return { per, ...t, lines: pct(t.lh, t.lf), branches: pct(t.brh, t.brf) };
}

/** The report lines and the verdict for a summary against thresholds. */
export function verdict(s, min) {
  const out = [];
  out.push(`coverage over src/ (${s.per.length} files, ${s.per.filter((r) => !r.loaded).length} not loaded by any test):`);
  out.push(`  lines    ${s.lines.toFixed(2)}% (${s.lh} / ${s.lf})  threshold ${min.lines.toFixed(2)}%`);
  out.push(`  branches ${s.branches.toFixed(2)}% (${s.brh} / ${s.brf})  threshold ${min.branches.toFixed(2)}%`);
  out.push("  lowest line coverage:");
  const low = [...s.per].sort((a, b) => pct(a.lh, a.lf) - pct(b.lh, b.lf) || b.lf - b.lh - (a.lf - a.lh)).slice(0, 10);
  for (const r of low) out.push(`    ${pct(r.lh, r.lf).toFixed(1).padStart(5)}% lines  ${pct(r.brh, r.brf).toFixed(1).padStart(5)}% branches  ${r.path}${r.loaded ? "" : " (not loaded)"}`);
  const ok = s.lines >= min.lines && s.branches >= min.branches;
  out.push(`coverage (C001-NFR-502): ${ok ? "pass" : "FAIL"}`);
  return { ok, lines: out };
}

// Run as a script only (not when bundled into a test, where import.meta.url is the test file).
if (process.argv[1]?.endsWith("coverage.mjs") && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
  const lcov = process.argv[2] ?? join(root, "coverage", "lcov.info");
  if (!existsSync(lcov)) {
    console.error(`coverage: ${lcov} not found; run SDD_TEST_COVERAGE=1 node scripts/test.mjs first`);
    process.exit(1);
  }
  const s = summarize(parseLcov(readFileSync(lcov, "utf8"), root), srcFiles(root), (p) => readFileSync(join(root, p), "utf8").replace(/\n$/, "").split("\n").length);
  const v = verdict(s, thresholds());
  for (const l of v.lines) console.log(l);
  process.exitCode = v.ok ? 0 : 1;
}
