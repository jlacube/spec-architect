// C001-TC-706 — verifies C001-TS-706 (C001-AC-706.1, C001-REQ-706): trace outputs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runTrace } from "./trace-fixture.ts";

test("a change in phase 20-plan gets both matrices and trace.json", () => {
  const r = runTrace(["--write"], {}, true);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.notEqual(r.file("10-spec/80-traceability.md"), null);
  assert.notEqual(r.file("20-plan/80-traceability.md"), null);
  assert.notEqual(r.file("trace.json"), null);
  assert.match(r.stdout, /^written: trace\.json$/m);
});

test("a change in phase 10-spec gets no 20-plan/80-traceability.md", () => {
  const r = runTrace(["--write"], {});
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.notEqual(r.file("10-spec/80-traceability.md"), null);
  assert.equal(r.file("20-plan/80-traceability.md"), null);
  assert.notEqual(r.file("trace.json"), null);
});

test("without --write nothing is written and the coverage is printed", () => {
  const r = runTrace([], {});
  assert.equal(r.file("trace.json"), null);
  assert.match(r.stdout, /^TR-02 Every REQ has ≥ 1 AC: 1 \/ 1 \(100%\)$/m);
});
