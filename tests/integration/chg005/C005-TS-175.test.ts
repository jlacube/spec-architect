// C005-TC-073 — verifies C005-TS-175 (C005-AC-126.1, C005-REQ-126): an unresolved ID reference in a pre-phase
// log keeps its finding.
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { lint } from "./lint-fixture.ts";
import { prePhaseChange, prePhaseLog } from "./prephase-fixture.ts";

test("Sources naming C003-REQ-999 in 10-spec/questions-log.md: error TR-12 there, naming the ID", () => {
  const ws = prePhaseChange("lite", "G1");
  try {
    writeFileSync(join(ws.dir, "10-spec", "questions-log.md"), prePhaseLog("10-spec", "G1", "C003-REQ-999"));
    const hits = lint(ws.root, ["003"]).findings.filter((f) => f.code === "TR-12" && f.path.endsWith("10-spec/questions-log.md"));
    assert.equal(hits.length, 1, JSON.stringify(hits));
    assert.equal(hits[0]!.severity, "error");
    assert.ok((hits[0]!.ids ?? []).includes("C003-REQ-999") || hits[0]!.message.includes("C003-REQ-999"), JSON.stringify(hits[0]));
  } finally {
    ws.cleanup();
  }
});
