// C001-TC-809 — verifies C001-TS-809 (C001-AC-808.1, C001-REQ-808): refuse on unresolved blocker.
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { runInProcess } from "../cli/helpers.ts";
import { approvedChange } from "./gate-fixture.ts";

const report = (status: string) =>
  `---\nartifact: critic-report\n---\n# Critic report\n\n## Findings\n\n### CR-3 — Missing failure mode\n- **Severity:** blocker\n- **Refs:** C004-REQ-012\n- **Status:** ${status}\n`;

test("an open blocker CR-3 refuses the approval with ERR-CLI-012", () => {
  const ws = approvedChange(["00-ideation"]);
  try {
    writeFileSync(join(ws.dir, "10-spec", "90-critic-report.md"), report("open"));
    const r = runInProcess(["gate", "approve", "004", "10-spec"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /ERR-CLI-012/);
    assert.match(r.stderr, /CR-3/);
  } finally {
    ws.cleanup();
  }
});

test("a resolved blocker does not block", () => {
  const ws = approvedChange(["00-ideation"]);
  try {
    writeFileSync(join(ws.dir, "10-spec", "90-critic-report.md"), report("resolved (by CHG-004)"));
    assert.equal(runInProcess(["gate", "approve", "004", "10-spec", "--note", "ok", "--by", "p01"], { cwd: ws.root }).code, 0);
  } finally {
    ws.cleanup();
  }
});
