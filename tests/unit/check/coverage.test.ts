// C001-TC-1130 (C001-NFR-502; C001-T-080, finding F-5): the threshold check of the `coverage` step
// (scripts/check/coverage.mjs) — lcov records of src/ merged per file, files no test loaded counted as
// uncovered, 85% lines and 75% branches, and test-only variables that can raise but never lower a threshold.
// D-021: per-process summaries summed in any order give the same lcov; a batch whose coverage was lost fails
// scripts/check/coverage-raw.mjs, which then writes no lcov.
// F-7: on Node 20 the step reports skipped with its reason, runs no coverage and counts as passed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { addSummary, coverageSkip, MIN_BRANCHES, MIN_LINES, missingTestFiles, parseLcov, srcPath, summarize, thresholds, toLcov, verdict } from "../../../scripts/check/coverage.mjs";
import { repoRoot } from "../../helpers.ts";

const ROOT = process.platform === "win32" ? "C:\\repo" : "/repo";
const rec = (sf: string, da: [number, number][], brda: [number, number, number, string][] = []) =>
  [`SF:${sf}`, ...brda.map((b) => `BRDA:${b.join(",")}`), ...da.map(([l, h]) => `DA:${l},${h}`), `LF:${da.length}`, "end_of_record"].join("\n");

test("thresholds: 85% lines and 75% branches; the test-only variables raise them and never lower them", () => {
  assert.equal(MIN_LINES, 85);
  assert.equal(MIN_BRANCHES, 75);
  assert.deepEqual(thresholds({}), { lines: 85, branches: 75 });
  assert.deepEqual(thresholds({ SDD_TEST_COVERAGE_MIN_LINES: "99.5", SDD_TEST_COVERAGE_MIN_BRANCHES: "90" }), { lines: 99.5, branches: 90 });
  assert.deepEqual(thresholds({ SDD_TEST_COVERAGE_MIN_LINES: "10", SDD_TEST_COVERAGE_MIN_BRANCHES: "0" }), { lines: 85, branches: 75 });
  assert.deepEqual(thresholds({ SDD_TEST_COVERAGE_MIN_LINES: "abc", SDD_TEST_COVERAGE_MIN_BRANCHES: "" }), { lines: 85, branches: 75 });
});

test("srcPath: relative and absolute SF entries under src/ map to src/… paths; other files are left out", () => {
  assert.equal(srcPath(join("src", "io", "atomic.ts"), ROOT), "src/io/atomic.ts");
  assert.equal(srcPath(join(ROOT, "src", "cli.ts"), ROOT), "src/cli.ts");
  assert.equal(srcPath(join(ROOT, "tests", "x.test.ts"), ROOT), null);
  assert.equal(srcPath(join(ROOT, "node_modules", "yaml", "a.js"), ROOT), null);
  assert.equal(srcPath(join(ROOT, "srcx", "a.ts"), ROOT), null);
});

test("parseLcov merges the records of one file: a line or branch is hit when any record hits it", () => {
  const text = [
    rec(join("src", "a.ts"), [[1, 1], [2, 0], [3, 0]], [[2, 0, 0, "1"], [2, 0, 1, "-"]]),
    rec(join(ROOT, "src", "a.ts"), [[1, 0], [2, 3], [3, 0]], [[2, 0, 0, "0"], [2, 0, 1, "0"]]),
    rec(join(ROOT, "tests", "t.test.ts"), [[1, 1]]),
  ].join("\n");
  const files = parseLcov(text, ROOT);
  assert.deepEqual([...files.keys()], ["src/a.ts"]);
  const a = files.get("src/a.ts")!;
  assert.deepEqual([...a.lines.entries()], [[1, 1], [2, 3], [3, 0]]);
  assert.deepEqual([...a.branches.entries()], [["2#0", 1], ["2#1", 0]]);
});

test("parseLcov keys a branch by its line and rank on that line, not by node's per-record block number", () => {
  // The same two branches of line 7, numbered differently in two records (as two batches number them).
  const text = [rec(join("src", "b.ts"), [[7, 1]], [[7, 4, 0, "0"], [7, 5, 0, "2"]]), rec(join("src", "b.ts"), [[7, 1]], [[7, 9, 0, "1"], [7, 10, 0, "0"]])].join("\n");
  const b = parseLcov(text, ROOT).get("src/b.ts")!;
  assert.deepEqual([...b.branches.entries()], [["7#0", 1], ["7#1", 2]]);
});

test("summarize counts a src/ file without a record as wholly uncovered, and verdict fails below a threshold", () => {
  const files = parseLcov(rec(join("src", "a.ts"), [[1, 1], [2, 1], [3, 1], [4, 0]], [[1, 0, 0, "1"], [1, 0, 1, "0"]]), ROOT);
  const s = summarize(files, ["src/a.ts", "src/b.ts"], (p: string) => (p === "src/b.ts" ? 6 : 0));
  assert.equal(s.lf, 10);
  assert.equal(s.lh, 3);
  assert.equal(s.brf, 2);
  assert.equal(s.brh, 1);
  assert.equal(s.lines, 30);
  assert.equal(s.branches, 50);
  assert.deepEqual(
    s.per.map((r: { path: string; loaded: boolean }) => [r.path, r.loaded]),
    [["src/a.ts", true], ["src/b.ts", false]],
  );
  const v = verdict(s, thresholds({}));
  assert.equal(v.ok, false);
  assert.match(v.lines.join("\n"), /lines {4}30\.00% \(3 \/ 10\) {2}threshold 85\.00%/);
  assert.match(v.lines.join("\n"), /0\.0% lines .* src\/b\.ts \(not loaded\)/);
  assert.match(v.lines.at(-1)!, /coverage \(C001-NFR-502\): FAIL/);
});

test("verdict passes at the thresholds and fails when a raised threshold is above the measured value", () => {
  const da: [number, number][] = Array.from({ length: 100 }, (_, i) => [i + 1, i < 85 ? 1 : 0]);
  const br: [number, number, number, string][] = Array.from({ length: 4 }, (_, i) => [1, 0, i, i < 3 ? "1" : "0"]);
  const s = summarize(parseLcov(rec(join("src", "a.ts"), da, br), ROOT), ["src/a.ts"], () => 0);
  assert.equal(s.lines, 85);
  assert.equal(s.branches, 75);
  assert.equal(verdict(s, thresholds({})).ok, true);
  assert.equal(verdict(s, thresholds({ SDD_TEST_COVERAGE_MIN_LINES: "85.01" })).ok, false);
  assert.equal(verdict(s, thresholds({ SDD_TEST_COVERAGE_MIN_BRANCHES: "76" })).ok, false);
});

test("coverageSkip: Node 20 versions skip with the reason, Node 22 and later measure", () => {
  for (const v of ["20.20.2", "v20.0.0", "20.11.1"]) {
    const reason = coverageSkip(v);
    assert.ok(reason !== null, v);
    assert.match(reason!, /Node 20's test runner crashes while merging coverage/);
    assert.match(reason!, /measured on Node 22\.22\.3/);
  }
  for (const v of ["22.22.3", "v22.13.0", "24.1.0", "18.20.0"]) assert.equal(coverageSkip(v), null, v);
  assert.equal(coverageSkip(), coverageSkip(process.versions.node), "defaults to the running version");
});

const NODE20 = Number(process.versions.node.split(".")[0]) === 20;

// Not skipped on any version (C001-TC-1128 allows only POSIX-only skips): on Node 20 the step itself is
// run end to end; on other versions the step measures, which the four check runs show (C001-TC-1127).
test(
  "C001-TC-1130: on Node 20 `check --steps coverage` prints skipped with its reason, starts no coverage run and exits 0; on Node 22 the step measures",
  () => {
    if (!NODE20) {
      assert.equal(coverageSkip(), null, `Node ${process.versions.node} measures`);
      return;
    }
    const env: Record<string, string | undefined> = { ...process.env };
    delete env["NODE_OPTIONS"];
    const r = spawnSync(process.execPath, [join(repoRoot(), "scripts", "check.mjs"), "--steps", "coverage"], { cwd: repoRoot(), env, encoding: "utf8", timeout: 60000 });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /^coverage: skipped — Node 20\./m);
    assert.match(r.stdout, /^SKIP {2}coverage \(C001-NFR-502\) — Node 20\./m);
    assert.doesNotMatch(r.stdout, /coverage mode:/, "no coverage run");
  },
);

// D-021: three processes' summaries of src/a.ts (node's TestCoverage, one raw file each). Line 3 and the
// second branch of line 2 are hit by one process only.
type Summary = { path: string; lines: { line: number; count: number }[]; branches: { line: number; count: number }[] };
const proc = (lines: number[], branches: [number, number][]): Summary[] => [
  { path: join(ROOT, "src", "a.ts"), lines: lines.map((count, i) => ({ line: i + 1, count })), branches: branches.map(([line, count]) => ({ line, count })) },
  { path: join(ROOT, "tests", "a.test.ts"), lines: [{ line: 1, count: 1 }], branches: [] },
];
const PROCS = [proc([1, 0, 0, 0], [[2, 0], [2, 0]]), proc([2, 1, 0, 0], [[2, 1], [2, 0]]), proc([1, 0, 4, 0], [[2, 0], [2, 3]])];

test("D-021: addSummary sums per-process hits, so every order of the processes gives the same lcov; a line hit by one process stays hit", () => {
  const orders = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const texts = orders.map((o) => {
    const files = new Map();
    for (const i of o) addSummary(files, PROCS[i]!, ROOT);
    return toLcov(files);
  });
  for (const t of texts) assert.equal(t, texts[0]);
  const a = parseLcov(texts[0]!, ROOT).get("src/a.ts")!;
  assert.deepEqual([...parseLcov(texts[0]!, ROOT).keys()], ["src/a.ts"], "only src/ is kept");
  assert.deepEqual([...a.lines.entries()], [[1, 4], [2, 1], [3, 4], [4, 0]]);
  assert.deepEqual([...a.branches.entries()], [["2#0", 1], ["2#1", 3]]);
  const s = summarize(parseLcov(texts[0]!, ROOT), ["src/a.ts"], () => 0);
  assert.deepEqual([s.lh, s.lf, s.brh, s.brf], [3, 4, 2, 2]);
});

test("D-021: toLcov writes what parseLcov reads back, branches in rank order", () => {
  const files = addSummary(new Map(), proc([1, 0], [[1, 0], [1, 2], [2, 5]]), ROOT);
  const text = toLcov(files);
  assert.match(text, /^SF:src\/a\.ts\nBRDA:1,0,0,0\nBRDA:1,0,1,2\nBRDA:2,0,0,5\nBRF:3\nBRH:2\nDA:1,1\nDA:2,0\nLF:2\nLH:1\nend_of_record\n$/);
  assert.deepEqual(parseLcov(text, ROOT), files);
  assert.equal(toLcov(new Map()), "");
});

test("D-021: missingTestFiles names the test files whose process left no raw coverage (case-insensitive on Windows)", () => {
  const flushed = new Set([String.raw`C:\repo\build\t\a.test.mjs`, String.raw`C:\repo\node_modules\x.js`]);
  assert.deepEqual(missingTestFiles(flushed, ["c:/REPO/build/t/a.test.mjs", String.raw`C:\repo\build\t\b.test.mjs`], "win32"), [String.raw`C:\repo\build\t\b.test.mjs`]);
  assert.deepEqual(missingTestFiles(new Set(["/repo/t/a.test.mjs"]), ["/repo/t/A.test.mjs", "/repo/t/a.test.mjs"], "linux"), ["/repo/t/A.test.mjs"]);
  assert.deepEqual(missingTestFiles(flushed, [], "win32"), []);
});

test("D-021: coverage-raw.mjs fails loudly and writes no lcov when a batch's coverage was lost, and writes it otherwise", () => {
  const dir = mkdtempSync(join(tmpdir(), "sdd-cov-raw-"));
  try {
    const script = join(repoRoot(), "scripts", "check", "coverage-raw.mjs");
    const testFile = join(dir, "a.test.mjs");
    const run = (raw: string) => {
      const out = join(dir, "out.info");
      rmSync(out, { force: true });
      const r = spawnSync(process.execPath, ["--expose-internals", script, raw, out, testFile], { encoding: "utf8" });
      return { status: r.status, stderr: r.stderr, written: existsSync(out) ? readFileSync(out, "utf8") : null };
    };
    const raw = (name: string, files: Record<string, string>) => {
      const d = join(dir, name);
      rmSync(d, { recursive: true, force: true });
      mkdirSync(d);
      for (const [f, text] of Object.entries(files)) writeFileSync(join(d, f), text);
      return d;
    };
    const script1 = (url: string) => JSON.stringify({ result: [{ scriptId: "1", url, functions: [] }] });
    let r = run(raw("ok", { "coverage-1-1700000000000-0.json": script1(pathToFileURL(testFile).href) }));
    if (coverageSkip() !== null) {
      // Node 20 (the coverage step is skipped there, F-7): the summariser refuses, loudly, with no lcov.
      assert.equal(r.status, 1);
      assert.match(r.stderr, /has no internal\/test_runner\/coverage/);
      assert.equal(r.written, null);
      return;
    }
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.written, "");
    r = run(raw("empty", {}));
    assert.equal(r.status, 1);
    assert.match(r.stderr, /coverage of this batch was lost \(D-021\)[\s\S]*no raw coverage file/);
    assert.equal(r.written, null);
    r = run(raw("truncated", { "coverage-1-1700000000000-0.json": script1(pathToFileURL(testFile).href), "coverage-2-1700000000000-0.json": '{"result":[' }));
    assert.equal(r.status, 1);
    assert.match(r.stderr, /coverage-2-1700000000000-0\.json: /);
    assert.equal(r.written, null);
    r = run(raw("missing", { "coverage-1-1700000000000-0.json": script1(pathToFileURL(join(dir, "other.mjs")).href) }));
    assert.equal(r.status, 1);
    assert.match(r.stderr, /no raw coverage from the process of .*a\.test\.mjs/);
    assert.equal(r.written, null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
