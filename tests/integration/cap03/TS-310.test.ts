// C001-TC-310 — verifies C001-TS-310 (C001-AC-310.1, C001-REQ-310): arithmetic error.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";

const OA = ".sdd/004-x/00-ideation/options/OA-001-topology.md";
const head = "---\nid: C004-OA-001\nartifact: ideation/option-analysis\n---\n\n# OA-001 — Topology\n\n## Scores\n";

test("weights 30/20/20/15/15, scores 3,3,3,2,3 and a stated 2.90: LINT-OA-001 with stated 2.90 and computed 2.85", () => {
  const table = "| Candidate | A | B | C | D | E | Weighted |\n|---|---|---|---|---|---|---|\n| Weights | 30% | 20% | 20% | 15% | 15% | |\n| X. Option | 3 | 3 | 3 | 2 | 3 | **2.90** |\n";
  const hits = withCode(lint({ [OA]: head + table }).findings, "LINT-OA-001");
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.path, OA);
  assert.equal(hits[0]?.line, 12);
  assert.match(hits[0]?.message ?? "", /"X\. Option" states 2\.90, computed 2\.85/);
});

test("weights from the criteria table of the OA template, and the 0.01 tolerance", () => {
  const criteria = "## Criteria\n| Criterion | Weight (%) |\n|---|---|\n| Cost | 60 |\n| Speed | 40 |\n\n";
  const scores = (stated: string) => `| Candidate | Cost | Speed | Weighted |\n|---|---|---|---|\n| A | 4 | 3 | ${stated} |\n`;
  assert.deepEqual(withCode(lint({ [OA]: head.replace("## Scores\n", criteria + "## Scores\n") + scores("3.60") }).findings, "LINT-OA-001"), []);
  assert.deepEqual(withCode(lint({ [OA]: head.replace("## Scores\n", criteria + "## Scores\n") + scores("3.61") }).findings, "LINT-OA-001"), []);
  assert.equal(withCode(lint({ [OA]: head.replace("## Scores\n", criteria + "## Scores\n") + scores("3.65") }).findings, "LINT-OA-001").length, 1);
});
