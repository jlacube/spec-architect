// Agent-behaviour check of C001-REQ-411, 412 and 419 for C001-T-038 (test-designer): with requirements of
// two capabilities written, the test-designer's acceptance files and 70-dod.md lint clean of TR-02,
// TR-03, LINT-COV-001/002 and LINT-DOD-001, and the DoD has the structure of C001-TS-421 (the
// deterministic check is tests/integration/cap04/TS-421.test.ts).
import { execFileSync } from "node:child_process";
import { checker } from "../harness/assert.mjs";
import { architectWithStubs, dispatchPrompt } from "../harness/overlay.mjs";
import { CLI, write } from "../harness/workspaces.mjs";
import { read, SPEC, specStartFull } from "./spec.mjs";

const REQ = (cap, n, statement) => `### C004-REQ-${cap}0${n} — R${n}\n- **Pattern:** event-driven\n- **Statement:** ${statement}\n- **Rationale:** ideation Goals\n- **Stories:** C004-US-${cap}01\n- **Priority:** Must\n- **Acceptance:** C004-AC-${cap}0${n}.1\n`;

function given(root) {
  specStartFull(root);
  write(root, `${SPEC}/20-capabilities/CAP-01-billing/requirements.md`, `---\nid: C004-CAP-01\nartifact: spec/requirements\n---\n\n${REQ(1, 1, "WHEN a billing month ends, THE billing service SHALL charge each active clinic's card the subscription price.")}\n${REQ(1, 2, "IF a card charge fails, THEN THE billing service SHALL retry the charge once after 24 hours.")}`);
  write(root, `${SPEC}/20-capabilities/CAP-02-notifications/requirements.md`, `---\nid: C004-CAP-02\nartifact: spec/requirements\n---\n\n${REQ(2, 1, "WHEN an appointment is 24 hours away, THE notification service SHALL send the patient a reminder by the patient's preferred channel.")}`);
}

/** Same structure check as the integration test (C001-TS-421). */
function dodStructureProblems(text) {
  const problems = [];
  const rows = text.split("\n").filter((l) => /^\|\s*C\d{3}-DOD-\d+/.test(l)).map((l) => l.split("|").map((c) => c.trim()));
  if (rows.length === 0) problems.push("no DoD item");
  for (const [, id, statement, evidence, covers] of rows) {
    if (!statement) problems.push(`${id}: no statement`);
    if (!evidence) problems.push(`${id}: no evidence type`);
    if (!/C\d{3}-(REQ|NFR)-\d+|\bglobal\b/.test(covers ?? "")) problems.push(`${id}: covers no REQ/NFR and is not global`);
  }
  if (!/\bDOD-G-\d{2}\b/.test(text)) problems.push("no constitution item DOD-G-nn referenced");
  return problems;
}

const BRIEF = `Brief — test-designer: acceptance and DoD.
- Change: CHG-004 "Clinic subscriptions" · profile full · kind greenfield
- Phase / step: 10-spec · step 4 — Acceptance and DoD
- Task: write the acceptance criteria, scenarios and coverage tables for CAP-01 billing and CAP-02 notifications, and the feature DoD.
- Inputs: \`${SPEC}/20-capabilities/CAP-01-billing/requirements.md\`, \`${SPEC}/20-capabilities/CAP-02-notifications/requirements.md\`, \`.sdd/_constitution/constitution.md\`.
- IDs to use: allocate TS and DOD IDs with \`sdd id next <TYPE> --change 004\`.
- Outputs: \`${SPEC}/20-capabilities/CAP-01-billing/acceptance.md\`, \`${SPEC}/20-capabilities/CAP-02-notifications/acceptance.md\`, \`${SPEC}/70-dod.md\`.
- Quality bar: acceptance-scenarios, dod-catalogue, sdd-conventions.
- Return contract: digest (at most 15 lines), the paths written, and a questions block for what P-01 alone can decide.`;

export default {
  id: "TS-421-agent",
  title: "Test-designer output: acceptance and DoD structure",
  agent: "architect:eval-dispatcher",
  plugins: [architectWithStubs],
  fixture: given,
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 30,
  prompt: dispatchPrompt("sdd-test-designer", BRIEF),
  assert({ root }) {
    const { failures, check } = checker();
    let out;
    try {
      out = execFileSync(process.execPath, [CLI, "lint", "004", "--phase", "10-spec", "--json"], { cwd: root, encoding: "utf8" });
    } catch (e) {
      out = e.stdout ?? "{}";
    }
    const findings = JSON.parse(out || "{}").findings ?? [];
    for (const code of ["TR-02", "TR-03", "LINT-COV-001", "LINT-COV-002", "LINT-DOD-001"]) {
      const f = findings.filter((x) => x.code === code);
      check(f.length === 0, `${code}: ${f.map((x) => x.message).join("; ")}`);
    }
    const dod = read(root, `${SPEC}/70-dod.md`);
    check(dod, "70-dod.md not written");
    for (const p of dodStructureProblems(dod)) check(false, p);
    return failures;
  },
};
