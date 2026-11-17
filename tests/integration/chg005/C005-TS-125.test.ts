// C005-TC-025 — verifies C005-TS-125 (C005-AC-108.1, C005-REQ-108): an install line outside the Reporting
// protocol section is reported.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { change002, lint, reporting } from "./lint-fixture.ts";

test("install line only in Ordered task list: an error LINT-HAND-003", () => {
  const ws = change002({ reporting: reporting(null) });
  try {
    const h = join(ws.dir, "20-plan", "handoff.md");
    const text = readFileSync(h, "utf8");
    const at = text.indexOf("## Ordered task list\n") + "## Ordered task list\n".length;
    writeFileSync(h, text.slice(0, at) + "\nnpm install -g architect-sdd@0.1.1\n" + text.slice(at));
    const hits = lint(ws.root, ["002"]).findings.filter((f) => f.code === "LINT-HAND-003");
    assert.equal(hits.length, 1);
    assert.equal(hits[0]!.severity, "error");
    assert.match(hits[0]!.path, /002-[^/]*\/20-plan\/handoff\.md$/);
  } finally {
    ws.cleanup();
  }
});
