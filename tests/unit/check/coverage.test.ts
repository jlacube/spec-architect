// C001-TC-1130 (C001-NFR-502; C001-T-080, finding F-5): the threshold check of the `coverage` step
// (scripts/check/coverage.mjs) — lcov records of src/ merged per file, files no test loaded counted as
// uncovered, 85% lines and 75% branches, and test-only variables that can raise but never lower a threshold.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { MIN_BRANCHES, MIN_LINES, parseLcov, srcPath, summarize, thresholds, verdict } from "../../../scripts/check/coverage.mjs";

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
