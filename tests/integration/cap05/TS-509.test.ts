// C001-TC-509 — verifies C001-TS-509 (C001-AC-509.1, C001-REQ-509): catalogue vs diagram IDs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { ARCH_FILE, architecture } from "./arch-fixture.ts";

// The scenario's Examples table; the diagram writes IDs with "_" as Mermaid requires.
const rows: [diagram: string[], contains: boolean][] = [
  [["COMP_01", "COMP_02"], false],
  [["COMP_01", "COMP_02", "COMP_09"], true],
  [["COMP_01"], true],
];

for (const [diagram, contains] of rows) {
  test(`catalogue COMP-01, COMP-02; diagram ${diagram.join(", ")}: LINT-ARCH-001 ${contains ? "reported" : "not reported"}`, () => {
    const { findings } = lint({ [ARCH_FILE]: architecture({ components: [{ id: "C004-COMP-01" }, { id: "C004-COMP-02" }], diagram }) });
    const hits = withCode(findings, "LINT-ARCH-001");
    assert.equal(hits.length, contains ? 1 : 0, JSON.stringify(findings));
  });
}

test("full-form diagram IDs (C004_COMP_01) match the catalogue", () => {
  assert.deepEqual(withCode(lint({ [ARCH_FILE]: architecture() }).findings, "LINT-ARCH-001"), []);
});

test("a runtime flow without a sequence diagram raises LINT-ARCH-004", () => {
  const text = architecture({ flows: ["F1", "F2"] }).replace(/### F2 —[\s\S]*?```\n```\n|### F2 — A flow \(realizes C004-TS-012\)\n\n```mermaid\nsequenceDiagram\n {2}A->>B: call\n```\n/, "");
  const hits = withCode(lint({ [ARCH_FILE]: text }).findings, "LINT-ARCH-004");
  assert.deepEqual(hits.map((h) => h.message), ["Runtime flow F2 has no sequence diagram"]);
  assert.deepEqual(withCode(lint({ [ARCH_FILE]: architecture({ flows: ["F1", "F2"] }) }).findings, "LINT-ARCH-004"), []);
});
