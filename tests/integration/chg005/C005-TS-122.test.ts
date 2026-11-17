// C005-TC-022 — verifies C005-TS-122 (C005-AC-108.1, C005-REQ-108): versioned install line accepted.
import { test } from "node:test";
import assert from "node:assert/strict";
import { change002, lint, reporting } from "./lint-fixture.ts";

for (const line of ["npm install -g architect-sdd@0.1.1", "npm install -g architect-sdd@10.20.300"]) {
  test(`"${line}" in the Reporting protocol: no LINT-HAND-003`, () => {
    const ws = change002({ reporting: reporting(line) });
    try {
      const { findings } = lint(ws.root, ["002"]);
      assert.deepEqual(findings.filter((f) => f.code === "LINT-HAND-003"), []);
    } finally {
      ws.cleanup();
    }
  });
}
