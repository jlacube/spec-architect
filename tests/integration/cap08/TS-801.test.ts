// C001-TC-801 — verifies C001-TS-801 (C001-AC-801.1, C001-REQ-801): gate show. The scenario writes
// "US: 14" and "lint: 0 error / 3 warn"; the output follows the C001-IF-13 §1 layout ("US 14",
// "Lint: 0 error · 3 warn"), so the assertions accept both punctuations.
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { LintRule } from "../../../src/lint/types.ts";
import { runInProcess, STORY_FIELDS } from "../cli/helpers.ts";
import { approvedChange } from "./gate-fixture.ts";

const warnings: LintRule = {
  code: "LINT-EARS-003", severity: "warn", fix: "f", scope: "change",
  check: (ctx) => [1, 2, 3].map((i) => ({ path: ctx.statements[0]!.path, line: i, message: `warning ${i}` })),
};

test("gate show lists files, ID counts, coverage, lint, critic, markers and stale state", () => {
  const ws = approvedChange(["00-ideation"]);
  try {
    const cap = join(ws.dir, "10-spec", "20-capabilities", "CAP-01-a");
    const stories = Array.from({ length: 14 }, (_, i) => `### C004-US-${String(i + 1).padStart(3, "0")} — S${i + 1}\n${STORY_FIELDS}- **Requirements:** C004-REQ-012\n- **Traces to:** Q1\n`);
    writeFileSync(join(cap, "stories.md"), "---\nid: C004-CAP-01\nartifact: spec/stories\n---\n\n" + stories.join("\n"));
    const reqs = Array.from({ length: 41 }, (_, i) => `### C004-REQ-${String(i + 12).padStart(3, "0")} — R\n- **Pattern:** ubiquitous\n- **Statement:** THE sdd CLI SHALL do thing ${i}.\n- **Stories:** C004-US-001\n- **Acceptance:** C004-AC-012.1\n`);
    writeFileSync(join(cap, "requirements.md"), "---\nid: C004-CAP-01\nartifact: spec/requirements\n---\n\n" + reqs.join("\n"));
    writeFileSync(join(ws.dir, "10-spec", "90-critic-report.md"),
      "---\nartifact: critic-report\n---\n# Critic report\n\n## Findings\n\n### CR-1 — Vague\n- **Severity:** major\n- **Status:** open\n\n### CR-2 — Typo\n- **Severity:** minor\n- **Status:** resolved\n");
    const r = runInProcess(["gate", "show", "004", "10-spec"], { cwd: ws.root, rules: [warnings] });
    assert.equal(r.code, 0, r.stderr);
    const out = r.stdout;
    assert.match(out, /^Gate G2 — CHG-004 "x" — phase 10-spec \(status: draft\)$/m);
    assert.match(out, /^Files \(\d+\): .*20-capabilities\/CAP-01-a\/requirements\.md/m);
    assert.match(out, /\bUS:? 14\b/);
    assert.match(out, /\bREQ:? 41\b/);
    for (const rule of ["TR-01", "TR-02", "TR-03", "TR-04", "TR-05"]) assert.match(out, new RegExp(`^Coverage: .*${rule} \\d+/\\d+`, "m"), rule);
    assert.match(out, /^Lint: 0 error · 3 warn · \d+ info$/m);
    assert.match(out, /^Critic: 0 blocker · 1 major \(CR-1\) · 0 minor$/m);
    assert.match(out, /^Open markers: none$/m);
    assert.match(out, /^Stale: no · Previous approval: none$/m);
  } finally {
    ws.cleanup();
  }
});
