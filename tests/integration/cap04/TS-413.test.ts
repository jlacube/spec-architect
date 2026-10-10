// C001-TC-413 — verifies C001-TS-413 (C001-AC-411.1, C001-REQ-411): acceptance numbering, as far
// as the lint checks it (TR-03 for a criterion without a scenario). Plan owner C001-T-038
// (test-designer); TR-03 arrives with C001-T-020.
import { test } from "node:test";
import assert from "node:assert/strict";
import { COVERAGE } from "../cli/helpers.ts";
import { ACCEPTANCE_FILE, lint, withCode } from "./spec-fixture.ts";

const HEAD = "---\nid: C004-CAP-01\nartifact: spec/acceptance\n---\n\n";
const SCENARIO = "```gherkin\nScenario: C004-TS-012 — s\n  Given a\n  When b\n  Then c\n```\n";

test("an acceptance criterion without a gherkin block raises TR-03", () => {
  const text = HEAD + "#### C004-AC-012.1 — First\n" + SCENARIO + "\n#### C004-AC-012.2 — Second\nNo scenario.\n\n" + COVERAGE;
  const hits = withCode(lint({ [ACCEPTANCE_FILE]: text }).findings, "TR-03");
  assert.deepEqual(hits.map((h) => h.ids), [["C004-AC-012.2"]]);
});

test("criteria with scenarios raise no TR-03", () => {
  assert.deepEqual(withCode(lint({}).findings, "TR-03"), []);
});
