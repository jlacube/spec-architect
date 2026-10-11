// C001-TC-618 — verifies C001-TS-618 (C001-AC-615.1, C001-REQ-615): observability mapping. Plan
// owner C001-T-043 (planner); LINT-OBS-001 arrives with C001-T-022.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOD_FILE, dodFile, lint, NFR_FILE, withCode } from "../cap04/spec-fixture.ts";
import { PLAN, plan } from "./plan-fixture.ts";

const NFR = (id: string) =>
  `### ${id} — Q\n- **Category:** c\n- **Statement:** THE sdd CLI SHALL answer within the threshold.\n- **Metric:** m\n- **Threshold:** t\n- **Method:** b\n- **Environment:** e\n- **Rationale:** r\n- **DoD:** C004-DOD-001\n\n`;
const spec = {
  [NFR_FILE]: "---\nid: C004-SPEC-NFR\nartifact: spec/nfr\n---\n\n" + NFR("C004-NFR-101") + NFR("C004-NFR-301"),
  [DOD_FILE]: dodFile(["C004-DOD-001", "test-report", "C004-REQ-012, C004-NFR-101, 301"]),
};
const obs = (rows: string): [string, string] => [
  `${PLAN}/78-observability.md`,
  "---\nid: C004-PLAN-OBS\nartifact: plan/observability\n---\n\n| NFR | Signal | Implemented by |\n|---|---|---|\n" + rows,
];

test("each NFR mapped to a signal and a task raises no LINT-OBS-001", () => {
  const files = { ...plan(obs("| C004-NFR-101 | p95 metric | C004-T-001 |\n| C004-NFR-301 | fault log | C004-T-001 |\n")), ...spec };
  assert.deepEqual(lint(files).findings, []);
});

test("a missing NFR, or a row without a task, raises LINT-OBS-001", () => {
  const hits = withCode(lint({ ...plan(obs("| C004-NFR-101 | p95 metric | C004-T-001 |\n| C004-NFR-301 | fault log | |\n")), ...spec }).findings, "LINT-OBS-001");
  assert.deepEqual(hits.map((h) => h.ids), [["C004-NFR-301"]]);
  const none = withCode(lint({ ...plan(), ...spec }).findings, "LINT-OBS-001");
  assert.equal(none.length, 2);
});
