// C001-TC-503 — verifies C001-TS-503 (C001-AC-503.1, C001-REQ-503): orphan component.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { ARCH_FILE, architecture } from "./arch-fixture.ts";

test("a new component with an empty Realizes is a TR-10 warning", () => {
  const { code, findings } = lint({ [ARCH_FILE]: architecture({ components: [{ id: "C004-COMP-01" }, { id: "C004-COMP-07", status: "new", realizes: "" }] }) });
  const hits = withCode(findings, "TR-10");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.equal(hits[0]?.severity, "warn");
  assert.deepEqual(hits[0]?.ids, ["C004-COMP-07"]);
  assert.deepEqual(findings.filter((f) => f.severity === "error"), []);
  assert.equal(code, 0);
});

test("a removed component realizing nothing is not reported", () => {
  const { findings } = lint({
    [ARCH_FILE]: architecture({ components: [{ id: "C004-COMP-01" }, { id: "C004-COMP-07", status: "removed", realizes: "", evidence: " `src/old.ts:1` › `old()` — gone\n    - layer: grep" }] }),
  });
  assert.deepEqual(withCode(findings, "TR-10"), []);
});
