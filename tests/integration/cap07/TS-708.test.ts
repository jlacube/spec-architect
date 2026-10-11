// C001-TC-708 — verifies C001-TS-708 (C001-AC-708.1, C001-REQ-708): coverage statistics.
import { test } from "node:test";
import assert from "node:assert/strict";
import { REQ_FILE, requirements } from "../cap04/spec-fixture.ts";
import { runTrace } from "./trace-fixture.ts";

function tenRequirements(): string {
  let text = requirements();
  for (let i = 13; i <= 21; i++) {
    const acceptance = i === 21 ? "" : "C004-AC-012.1";
    text += `\n### C004-REQ-0${i} — R${i}\n- **Pattern:** ubiquitous\n- **Statement:** THE sdd CLI SHALL do thing ${i}.\n- **Rationale:** r\n- **Stories:** C004-US-001\n- **Priority:** Must\n- **Acceptance:** ${acceptance}\n`;
  }
  return text;
}

test('10 REQs of which 9 have an AC: the TR-02 line reads "9 / 10 (90%)"', () => {
  const r = runTrace(["--write"], { [REQ_FILE]: tenRequirements() });
  assert.match(r.file("10-spec/80-traceability.md") ?? "", /^\| TR-02 Every REQ has ≥ 1 AC \| 9 \/ 10 \(90%\) \|$/m);
  assert.match(r.stdout, /^TR-02 Every REQ has ≥ 1 AC: 9 \/ 10 \(90%\) — missing C004-REQ-021$/m);
  assert.equal(r.code, 1, "a coverage gap is an error-severity result");
});

test("every rule TR-01 … TR-08 has a coverage line once the plan has started", () => {
  const r = runTrace([], {}, true);
  for (const rule of ["TR-01", "TR-02", "TR-03", "TR-04", "TR-05", "TR-06", "TR-07", "TR-08"]) assert.match(r.stdout, new RegExp(`^${rule} .*: \\d+ / \\d+ \\(\\d+%\\)$`, "m"), rule);
  assert.equal(r.code, 0, r.stdout);
});
