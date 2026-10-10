// C001-TC-409 — verifies C001-TS-409 (C001-AC-408.1, C001-REQ-408): weak word in a requirement.
import { test } from "node:test";
import assert from "node:assert/strict";
import { GLOSSARY_FILE, glossary, lint, REQ_FILE, requirements, withCode } from "./spec-fixture.ts";

test('"THE API SHALL respond fast." is reported with LINT-WORD-001 naming "fast" and the line', () => {
  const text = requirements({ fields: { Statement: "THE API SHALL respond fast." } });
  const line = text.split("\n").findIndex((l) => l.startsWith("- **Statement:**")) + 1;
  const { code, findings } = lint({ [GLOSSARY_FILE]: glossary("sdd CLI", "API"), [REQ_FILE]: text });
  const hits = withCode(findings, "LINT-WORD-001");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.equal(hits[0]?.severity, "error");
  assert.equal(hits[0]?.path, REQ_FILE);
  assert.equal(hits[0]?.line, line);
  assert.match(hits[0]?.message ?? "", /"fast"/);
  assert.equal(code, 1);
});

test("weak phrases and NFR statements are checked too", () => {
  const nfr = "---\nid: C004-SPEC-NFR\nartifact: spec/nfr\n---\n\n### C004-NFR-101 — Speed\n- **Statement:** THE sdd CLI SHALL answer as soon as possible.\n";
  const { findings } = lint({ ".sdd/004-x/10-spec/30-nfr/nfr.md": nfr });
  const hits = withCode(findings, "LINT-WORD-001");
  assert.deepEqual(hits.map((h) => h.ids), [["C004-NFR-101"]], JSON.stringify(findings));
  assert.match(hits[0]?.message ?? "", /"as soon as possible"/);
});
