// C001-TC-606 — verifies C001-TS-606 (C001-AC-606.1, C001-REQ-606): task links.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { plan, task } from "./plan-fixture.ts";

// The scenario's Examples table ("(empty)" = an empty list); C004-TS-040 is the example's scenario ID.
const rows: [impl: string[], ac: string[], ver: string[], contains: boolean][] = [
  [["C004-REQ-012"], ["C004-AC-012.1"], ["C004-TS-040"], false],
  [[], [], ["C004-TS-040"], true],
  [["C004-REQ-012"], [], [], true],
];

for (const [impl, ac, ver, contains] of rows) {
  test(`implements [${impl}], satisfies_ac [${ac}], verified_by [${ver}]: TR-07 ${contains ? "reported" : "not reported"}`, () => {
    const hits = withCode(lint(plan(task("001", { implements: impl, satisfiesAc: ac, verifiedBy: ver }))).findings, "TR-07");
    assert.equal(hits.length, contains ? 1 : 0, JSON.stringify(hits));
    if (contains) assert.deepEqual(hits[0]?.ids, ["C004-T-001"]);
  });
}
