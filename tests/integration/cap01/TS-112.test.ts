// C001-TC-112 — verifies C001-TS-112 (C001-AC-108.1, C001-REQ-108): change folder content.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";

function initialised(extra: Record<string, string> = {}) {
  const ws = makeWorkspace({ "README.md": "x\n", ...extra });
  assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
  return ws;
}

test("C001-TS-112: a full change folder has change.md, ids.json and the three phase folders", () => {
  const ws = initialised();
  try {
    assert.equal(runBundled(["change", "new", "Payment retries", "--profile", "full"], { cwd: ws.root }).code, 0);
    const dir = join(ws.root, ".sdd", "001-payment-retries");
    assert.deepEqual(readdirSync(dir).sort(), ["00-ideation", "10-spec", "20-plan", "change.md", "ids.json"]);
    for (const d of ["00-ideation", "10-spec", "20-plan"]) assert.ok(statSync(join(dir, d)).isDirectory(), d);
  } finally {
    ws.cleanup();
  }
});
