// C001-TC-421 — verifies C001-TS-421 (C001-AC-419.1, C001-REQ-419): DoD item structure. The lint parses
// 70-dod.md into items with an ID, a statement, an evidence type and REQ/NFR references (or
// "global"); the file references a constitution item DOD-G-<nn>. A missing evidence type is
// reported (LINT-DOD-001). The same structure check runs on the test-designer's output in
// evals/cap04/TS-421.eval.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWorkspace, minimalChange, runBundled } from "../cli/helpers.ts";

const HEAD = "---\nid: C004-SPEC-DOD\nartifact: spec/dod\n---\n\n| ID | Statement | Evidence type | Covers |\n|---|---|---|---|\n";

/** Structure problems of a DoD file (C001-REQ-419): per item and for the global references. */
export function dodStructureProblems(text: string): string[] {
  const problems: string[] = [];
  const rows = text.split("\n").filter((l) => /^\|\s*C\d{3}-DOD-\d+/.test(l)).map((l) => l.split("|").map((c) => c.trim()));
  if (rows.length === 0) problems.push("no DoD item");
  for (const r of rows) {
    const [, id, statement, evidence, covers] = r;
    if (!/^C\d{3}-DOD-\d+$/.test(id ?? "")) problems.push(`bad ID ${id}`);
    if (!statement) problems.push(`${id}: no statement`);
    if (!evidence) problems.push(`${id}: no evidence type`);
    if (!/C\d{3}-(REQ|NFR)-\d+|\bglobal\b/.test(covers ?? "")) problems.push(`${id}: covers no REQ/NFR and is not global`);
  }
  if (!/\bDOD-G-\d{2}\b/.test(text)) problems.push("no constitution item DOD-G-nn referenced");
  return problems;
}

function lintCodes(dod: string): string[] {
  const ws = makeWorkspace({ ...minimalChange(), ".sdd/004-x/10-spec/70-dod.md": dod });
  try {
    const r = runBundled(["lint", "004", "--json"], { cwd: ws.root });
    return (JSON.parse(r.stdout) as { findings: { code: string }[] }).findings.map((f) => f.code);
  } finally {
    ws.cleanup();
  }
}

test("a well-formed DoD has every field, references DOD-G and lints clean of LINT-DOD-001", () => {
  const dod = `${HEAD}| C004-DOD-001 | Every acceptance scenario passes in CI | test-report | C004-REQ-012 |\n| C004-DOD-002 | The README documents the setting | review-record | global |\n\n## Inherited global items\n\n- DOD-G-01 — applies to the CI run of this change.\n`;
  assert.deepEqual(dodStructureProblems(dod), []);
  assert.equal(lintCodes(dod).includes("LINT-DOD-001"), false);
});

test("missing evidence, missing coverage and no DOD-G reference are detected", () => {
  const dod = `${HEAD}| C004-DOD-001 | Every acceptance scenario passes in CI |  | C004-REQ-012 |\n| C004-DOD-002 | The README documents the setting | review-record |  |\n`;
  const problems = dodStructureProblems(dod);
  assert.ok(problems.includes("C004-DOD-001: no evidence type"));
  assert.ok(problems.includes("C004-DOD-002: covers no REQ/NFR and is not global"));
  assert.ok(problems.includes("no constitution item DOD-G-nn referenced"));
  assert.ok(lintCodes(dod).includes("LINT-DOD-001"));
});
