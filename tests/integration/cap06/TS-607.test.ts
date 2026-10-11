// C001-TC-607 — verifies C001-TS-607 (C001-AC-607.1, C001-REQ-607): dependency cycle.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { plan, task } from "./plan-fixture.ts";

test('T-001 → T-003 → T-002 → T-001 is reported once by TR-11, listing the cycle', () => {
  const { findings } = lint(
    plan(task("001", { dependsOn: ["C004-T-003"] }), task("002", { dependsOn: ["C004-T-001"] }), task("003", { dependsOn: ["C004-T-002"] })),
  );
  const hits = withCode(findings, "TR-11");
  assert.equal(hits.length, 1, JSON.stringify(hits));
  assert.match(hits[0]?.message ?? "", /T-001 → T-003 → T-002 → T-001/);
  assert.deepEqual(hits[0]?.ids, ["C004-T-001", "C004-T-003", "C004-T-002"]);
});

test("an acyclic chain raises no TR-11", () => {
  const { findings } = lint(plan(task("002", { dependsOn: ["C004-T-001"] }), task("003", { dependsOn: ["C004-T-001", "C004-T-002"] })));
  assert.deepEqual(withCode(findings, "TR-11"), []);
});
