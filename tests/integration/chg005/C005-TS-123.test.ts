// C005-TC-023 — verifies C005-TS-123 (C005-AC-108.1, C005-REQ-108): missing or unversioned install line reported.
import { test } from "node:test";
import assert from "node:assert/strict";
import { change002, lint, reporting } from "./lint-fixture.ts";

const ROWS: (string | null)[] = [
  "npm install -g architect-sdd@<version>",
  "npm install -g architect-sdd@{{VERSION}}",
  "npm install -g architect-sdd@latest",
  "npm install -g architect-sdd@0.1",
  "npm install -g architect-sdd@0.1.1-rc.1",
  null,
];

for (const line of ROWS) {
  test(`${line === null ? "no install line" : `"${line}"`}: an error LINT-HAND-003 naming 002-*/20-plan/handoff.md, exit not 0`, () => {
    const ws = change002({ reporting: reporting(line) });
    try {
      const { code, findings } = lint(ws.root, ["002"]);
      const hits = findings.filter((f) => f.code === "LINT-HAND-003");
      assert.equal(hits.length, 1);
      assert.equal(hits[0]!.severity, "error");
      assert.match(hits[0]!.path, /002-[^/]*\/20-plan\/handoff\.md$/);
      assert.notEqual(code, 0);
    } finally {
      ws.cleanup();
    }
  });
}
