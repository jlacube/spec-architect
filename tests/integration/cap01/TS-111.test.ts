// C001-TC-111 — verifies C001-TS-111 (C001-AC-107.2, C001-REQ-107): numbering counts archived changes.
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

test("C001-TS-111: numbering counts archived changes", () => {
  const ws = initialised();
  try {
    mkdirSync(join(ws.root, ".sdd", "002-foo"));
    mkdirSync(join(ws.root, ".sdd", "_archive", "005-bar"), { recursive: true });
    assert.equal(runBundled(["change", "new", "Baz"], { cwd: ws.root }).code, 0);
    assert.ok(statSync(join(ws.root, ".sdd", "006-baz")).isDirectory());
  } finally {
    ws.cleanup();
  }
});
