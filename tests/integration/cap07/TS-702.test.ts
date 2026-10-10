// C001-TC-702 — verifies C001-TS-702 (C001-AC-702.1, C001-REQ-702): finding format.
// Runs the real LINT-EARS-002 (C001-T-019) through the real CLI front-end.
import { test } from "node:test";
import assert from "node:assert/strict";
import { RULES } from "../../../src/lint/rules/index.ts";
import { makeWorkspace, runInProcess } from "../cli/helpers.ts";

const REQ_FILE = ".sdd/004-x/10-spec/20-capabilities/CAP-01-a/requirements.md";
const ears002 = RULES.filter((r) => r.code === "LINT-EARS-002");

test("a two-SHALL requirement at line 42 is reported with severity, code, path, line, ID and message", () => {
  const padding = Array.from({ length: 34 }, (_, i) => `Padding line ${i + 1}.`).join("\n");
  const content =
    "---\nid: C004-CAP-01\nartifact: spec/requirements\n---\n" + padding + "\n\n### C004-REQ-012 — Two outcomes\n- **Pattern:** ubiquitous\n" +
    "- **Statement:** THE sdd CLI SHALL write the file and SHALL print its path.\n";
  const lines = content.split("\n");
  assert.equal(lines.findIndex((l) => l.startsWith("- **Statement:**")) + 1, 42, "fixture puts the statement on line 42");
  const ws = makeWorkspace({ ".sdd/SDD.md": "# SDD\n", ".sdd/004-x/change.md": "---\nid: CHG-004\n---\n", [REQ_FILE]: content });
  try {
    const r = runInProcess(["lint"], { cwd: ws.root, rules: ears002 });
    assert.equal(r.code, 1);
    const line = r.stdout.split("\n").find((l) => l.includes("LINT-EARS-002"));
    assert.ok(line, r.stdout);
    assert.equal(
      line,
      `error LINT-EARS-002 ${REQ_FILE}:42 [C004-REQ-012] — Requirement contains 2 SHALL keywords. Fix: Split the requirement`,
    );
  } finally {
    ws.cleanup();
  }
});
