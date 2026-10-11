// C001-TC-720 — verifies C001-TS-720 (C001-AC-720.1, C001-REQ-720): gate refusal on open markers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { runInProcess } from "../cli/helpers.ts";
import { approvedChange } from "../cap08/gate-fixture.ts";

test("an open [NEEDS CLARIFICATION: Q-spec-03] refuses with ERR-CLI-011; waiving Q-spec-03 lets it pass", () => {
  const ws = approvedChange(["00-ideation"]);
  try {
    writeFileSync(join(ws.dir, "10-spec", "10-context", "scope.md"), "---\nid: C004-SPEC-CTX-03\nartifact: spec/context/scope\n---\n# Scope\n\nRetry budget [NEEDS CLARIFICATION: Q-spec-03].\n");
    const r = runInProcess(["gate", "approve", "004", "10-spec"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /ERR-CLI-011/);
    assert.match(r.stderr, /Q-spec-03/);
    const ok = runInProcess(["gate", "approve", "004", "10-spec", "--waive", "Q-spec-03", "--note", "decide in plan", "--by", "p01"], { cwd: ws.root });
    assert.equal(ok.code, 0, ok.stderr);
  } finally {
    ws.cleanup();
  }
});
