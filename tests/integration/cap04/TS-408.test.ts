// C001-TC-408 — verifies C001-TS-408 (C001-AC-407.1, C001-REQ-407): system not in glossary.
import { test } from "node:test";
import assert from "node:assert/strict";
import { GLOSSARY_FILE, glossary, lint, REQ_FILE, requirements, withCode } from "./spec-fixture.ts";

test("an unknown system is a LINT-EARS-003 warning that does not fail the run", () => {
  const { code, findings } = lint({
    [GLOSSARY_FILE]: glossary("sdd CLI", "lint", "conductor"),
    [REQ_FILE]: requirements({ fields: { Statement: "THE frobnicator SHALL emit events." } }),
  });
  const hits = withCode(findings, "LINT-EARS-003");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.equal(hits[0]?.severity, "warn");
  assert.match(hits[0]?.message ?? "", /frobnicator/);
  assert.deepEqual(findings.filter((f) => f.severity === "error"), []);
  assert.equal(code, 0);
});

test("glossary names, prefixes of longer names and component titles are known", () => {
  const comp = "---\nid: C004-SPEC-ARCH\nartifact: spec/architecture\n---\n\n### C004-COMP-01 — Gate engine\n- **Responsibility:** gates\n";
  for (const statement of ["THE lint SHALL report findings.", "THE sdd CLI's lint SHALL report findings.", "the conductor shall stop.", "WHEN asked, THE Gate engine SHALL approve."]) {
    const { findings } = lint({
      [GLOSSARY_FILE]: glossary("sdd CLI", "lint", "conductor"),
      ".sdd/004-x/10-spec/60-architecture/architecture.md": comp,
      [REQ_FILE]: requirements({ fields: { Pattern: statement.startsWith("WHEN") ? "event-driven" : "ubiquitous", Statement: statement } }),
    });
    assert.deepEqual(withCode(findings, "LINT-EARS-003"), [], statement);
  }
});
