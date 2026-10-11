// C001-TC-608 — verifies C001-TS-608 (C001-AC-607.2, C001-REQ-607): dangling depends_on.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { plan, task } from "./plan-fixture.ts";

test("T-005 depending on C004-T-099, neither defined nor tombstoned, raises TR-11 naming it", () => {
  const hits = withCode(lint(plan(task("005", { dependsOn: ["C004-T-099"] }))).findings, "TR-11");
  assert.equal(hits.length, 1);
  assert.deepEqual(hits[0]?.ids, ["C004-T-005", "C004-T-099"]);
  assert.match(hits[0]?.message ?? "", /C004-T-099/);
});

test("a dependency on a tombstoned task is not dangling", () => {
  const ids = JSON.stringify({ ledger_version: 1, change: "CHG-004", counters: {}, tombstones: [{ id: "C004-T-099", reason: "dropped", date: "2026-10-11" }] }, null, 2);
  const hits = withCode(lint({ ...plan(task("005", { dependsOn: ["C004-T-099"] })), ".sdd/004-x/ids.json": ids }).findings, "TR-11");
  assert.deepEqual(hits, []);
});
