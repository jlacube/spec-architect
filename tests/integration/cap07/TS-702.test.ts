// C001-TC-702 — verifies C001-TS-702 (C001-AC-702.1, C001-REQ-702): finding format.
// The CLI front-end (dispatch, lint scope, formatting, exit code) is the real one. LINT-EARS-002 is
// implemented by C001-T-019; until then a test double with the same code and behaviour produces
// the finding, and C001-T-019 re-runs this scenario against the real rule.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { LintRule } from "../../../src/lint/types.ts";
import { makeWorkspace, runInProcess } from "../cli/helpers.ts";

const REQ_FILE = ".sdd/004-x/10-spec/20-capabilities/CAP-01-a/requirements.md";

/** Test double of LINT-EARS-002: a Statement with more than one SHALL. */
const ears002: LintRule = {
  code: "LINT-EARS-002",
  severity: "error",
  fix: "Split into two requirements", scope: "change",
  check(ctx) {
    return ctx.statements
      .filter((s) => (s.text.match(/\bSHALL\b/g) ?? []).length > 1)
      .map((s) => ({ path: s.path, line: s.line, ids: [s.id], message: `Requirement contains ${(s.text.match(/\bSHALL\b/g) ?? []).length} SHALL keywords` }));
  },
};

test("a two-SHALL requirement at line 42 is reported with severity, code, path, line, ID and message", () => {
  const padding = Array.from({ length: 34 }, (_, i) => `Padding line ${i + 1}.`).join("\n");
  const content =
    "---\nid: C004-CAP-01\nartifact: spec/requirements\n---\n" + padding + "\n\n### C004-REQ-012 — Two outcomes\n- **Pattern:** ubiquitous\n" +
    "- **Statement:** THE sdd CLI SHALL write the file and SHALL print its path.\n";
  const lines = content.split("\n");
  assert.equal(lines.findIndex((l) => l.startsWith("- **Statement:**")) + 1, 42, "fixture puts the statement on line 42");
  const ws = makeWorkspace({ ".sdd/SDD.md": "# SDD\n", ".sdd/004-x/change.md": "---\nid: CHG-004\n---\n", [REQ_FILE]: content });
  try {
    const r = runInProcess(["lint"], { cwd: ws.root, rules: [ears002] });
    assert.equal(r.code, 1);
    const line = r.stdout.split("\n").find((l) => l.includes("LINT-EARS-002"));
    assert.ok(line, r.stdout);
    assert.equal(
      line,
      `error LINT-EARS-002 ${REQ_FILE}:42 [C004-REQ-012] — Requirement contains 2 SHALL keywords. Fix: Split into two requirements`,
    );
  } finally {
    ws.cleanup();
  }
});
