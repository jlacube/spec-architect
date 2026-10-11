// C001-TC-610 — verifies C001-TS-610 (C001-AC-609.1, C001-REQ-609): TR-08 enforcement. Plan owner
// C001-T-043 (planner); TR-08 arrives with C001-T-022.
import { test } from "node:test";
import assert from "node:assert/strict";
import { COVERAGE, makeWorkspace, minimalChange, runInProcess } from "../cli/helpers.ts";
import { ACCEPTANCE_FILE } from "../cap04/spec-fixture.ts";
import { plan } from "./plan-fixture.ts";

const ACCEPTANCE =
  "---\nid: C004-CAP-01\nartifact: spec/acceptance\n---\n\n#### C004-AC-012.1 — Criterion\n```gherkin\nScenario: C004-TS-012 — s\n  Given a\n  When b\n  Then c\n```\n" +
  "```gherkin\nScenario: C004-TS-041 — t\n  Given a\n  When b\n  Then c\n```\n\n" + COVERAGE;

test('C004-TS-041 mapped to no TC: "sdd lint --phase 20-plan" reports TR-08 for it', () => {
  const ws = makeWorkspace({ ...minimalChange(), ...plan([ACCEPTANCE_FILE, ACCEPTANCE]) });
  try {
    const r = runInProcess(["lint", "--phase", "20-plan", "--json"], { cwd: ws.root });
    const findings = (JSON.parse(r.stdout) as { findings: { code: string; ids?: string[] }[] }).findings;
    assert.deepEqual(findings.filter((f) => f.code === "TR-08").map((f) => f.ids), [["C004-TS-041"]]);
  } finally {
    ws.cleanup();
  }
});
