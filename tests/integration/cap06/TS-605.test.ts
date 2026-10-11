// C001-TC-605 — verifies C001-TS-605 (C001-AC-605.1, C001-REQ-605): REQ without task.
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWorkspace, minimalChange, runInProcess } from "../cli/helpers.ts";
import { lint, REQ_FILE, requirements, withCode } from "../cap04/spec-fixture.ts";
import { plan } from "./plan-fixture.ts";

const SECOND =
  "\n### C004-REQ-019 — Other\n- **Pattern:** ubiquitous\n- **Statement:** THE sdd CLI SHALL do another thing.\n- **Rationale:** r\n- **Stories:** C004-US-001\n- **Priority:** Must\n- **Acceptance:** C004-AC-012.1\n";

test('C004-REQ-019 in no task\'s implements: "sdd lint --phase 20-plan" reports TR-06 for it', () => {
  const ws = makeWorkspace({ ...minimalChange(), ...plan([REQ_FILE, requirements() + SECOND]) });
  try {
    const r = runInProcess(["lint", "--phase", "20-plan", "--json"], { cwd: ws.root });
    const findings = (JSON.parse(r.stdout) as { findings: { code: string; ids?: string[] }[] }).findings;
    assert.deepEqual(findings.filter((f) => f.code === "TR-06").map((f) => f.ids), [["C004-REQ-019"]]);
    assert.equal(r.code, 1);
  } finally {
    ws.cleanup();
  }
});

test("every requirement of the minimal plan is implemented", () => {
  assert.deepEqual(withCode(lint(plan()).findings, "TR-06"), []);
});
