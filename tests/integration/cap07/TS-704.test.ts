// C001-TC-704 — verifies C001-TS-704 (C001-AC-704.1, C001-REQ-704): lint exit codes.
// Rows with findings use test-double rules (the real rules arrive with C001-T-018 … T-022); the
// exit-code policy under test is the real one.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { LintRule } from "../../../src/lint/types.ts";
import { makeWorkspace, minimalChange, runBundled, runInProcess } from "../cli/helpers.ts";

function rule(severity: LintRule["severity"], count: number): LintRule {
  return {
    code: severity === "error" ? "LINT-TXT-001" : "LINT-EARS-003",
    severity,
    fix: "Fix it", scope: "change",
    check: (ctx) => Array.from({ length: count }, (_, i) => ({ path: ctx.statements[0]!.path, line: i + 1, message: `finding ${i + 1}` })),
  };
}

const rows: [number, number, number][] = [
  [0, 0, 0],
  [0, 5, 0],
  [1, 0, 1],
];

for (const [errors, warnings, code] of rows) {
  test(`${errors} errors and ${warnings} warnings exit with ${code}`, () => {
    const ws = makeWorkspace(minimalChange());
    try {
      const rules = [rule("error", errors), rule("warn", warnings)];
      const r = runInProcess(["lint"], { cwd: ws.root, rules });
      assert.equal(r.code, code, r.stdout + r.stderr);
      assert.match(r.stdout, new RegExp(`lint: ${errors} errors?, ${warnings} warnings?, 0 info`));
    } finally {
      ws.cleanup();
    }
  });
}

test("the bundled CLI exits 0 on a clean workspace and 2 on --bogus-flag", () => {
  const ws = makeWorkspace(minimalChange());
  try {
    assert.equal(runBundled(["lint"], { cwd: ws.root }).code, 0);
    const r = runBundled(["lint", "--bogus-flag"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.equal(r.stdout, "");
    assert.match(r.stderr, /^ERR-CLI-003: Usage error: .*bogus-flag.*\. Fix: See `sdd lint --help`\n$/);
  } finally {
    ws.cleanup();
  }
});
