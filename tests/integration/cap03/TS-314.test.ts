// C001-TC-314 — verifies C001-TS-314 (C001-AC-313.1, C001-REQ-313): ideation completeness. Plan
// owner C001-T-032 (ideation phase); LINT-IDE-001 arrives with C001-T-021.
import { test } from "node:test";
import assert from "node:assert/strict";
import { IDEATION_SECTIONS } from "../../../src/lint/rules/ide-001.ts";
import { lint, withCode } from "../cap04/spec-fixture.ts";

const IDEATION = ".sdd/004-x/00-ideation/ideation.md";
const FULL = "---\nid: CHG-004\ntitle: x\nprofile: full\n---\n# CHG-004\n";
const doc = (sections: string[]) => "---\nid: C004-IDEA\nartifact: ideation\n---\n# X — ideation\n\n" + sections.map((s, i) => `## ${i + 1}. ${s}\n\nText.\n\n`).join("");

test("every missing section of a full-profile ideation.md raises LINT-IDE-001", () => {
  assert.deepEqual(withCode(lint({ ".sdd/004-x/change.md": FULL, [IDEATION]: doc(IDEATION_SECTIONS) }).findings, "LINT-IDE-001"), []);
  const without = IDEATION_SECTIONS.filter((s) => s !== "Risks" && s !== "Sources");
  const hits = withCode(lint({ ".sdd/004-x/change.md": FULL, [IDEATION]: doc(without) }).findings, "LINT-IDE-001");
  assert.deepEqual(hits.map((h) => h.message), ['Ideation section "Risks" is missing', 'Ideation section "Sources" is missing']);
});

test("a lite change is not checked", () => {
  const lite = "---\nid: CHG-004\ntitle: x\nprofile: lite\n---\n# CHG-004\n";
  assert.deepEqual(withCode(lint({ ".sdd/004-x/change.md": lite, [IDEATION]: doc([]) }).findings, "LINT-IDE-001"), []);
});
