// C001-TC-707 — verifies C001-TS-707 (C001-AC-707.1, C001-REQ-707): forward and backward tables.
import { test } from "node:test";
import assert from "node:assert/strict";
import { REQ_FILE, requirements } from "../cap04/spec-fixture.ts";
import { runTrace } from "./trace-fixture.ts";

// C004-REQ-019 is listed by no story: it must still appear in the forward table.
const SECOND =
  "\n### C004-REQ-019 — Other\n- **Pattern:** ubiquitous\n- **Statement:** THE sdd CLI SHALL do another thing.\n- **Rationale:** r\n- **Stories:** C004-US-001\n- **Priority:** Must\n- **Acceptance:** C004-AC-012.1\n";

function section(md: string, heading: string): string {
  const start = md.indexOf(`## ${heading}`);
  assert.ok(start >= 0, heading);
  const end = md.indexOf("\n## ", start + 1);
  return md.slice(start, end < 0 ? undefined : end);
}

test("the spec matrix has the forward and backward tables, and every REQ is in the forward table", () => {
  const md = runTrace(["--write"], { [REQ_FILE]: requirements() + SECOND }).file("10-spec/80-traceability.md") ?? "";
  const forward = section(md, "Forward: US → REQ → AC → TS");
  section(md, "Backward: TS → AC → REQ → US");
  for (const req of ["C004-REQ-012", "C004-REQ-019"]) assert.match(forward, new RegExp(`\\| ${req} \\|`), req);
  assert.match(forward, /\| CAP-01-a \| C004-US-001 \| C004-REQ-012 \| C004-AC-012\.1 \| C004-TS-012 \|/);
});

test("the plan matrix has REQ → T → TC → DOD and TC → T → REQ", () => {
  const md = runTrace(["--write"], {}, true).file("20-plan/80-traceability.md") ?? "";
  assert.match(section(md, "Forward: REQ → T → TC → DOD"), /\| C004-REQ-012 \| C004-T-001 \| C004-TC-012 \| C004-DOD-001 \|/);
  assert.match(section(md, "Backward: TC → T → REQ"), /\| C004-TC-012 \| C004-T-001 \| C004-REQ-012 \|/);
});
