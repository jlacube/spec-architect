// C001-TC-110 — verifies C001-TS-110 (C001-AC-107.1, C001-REQ-107): first change number.
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

test("C001-TS-110: the first change is 001", () => {
  const ws = initialised();
  try {
    const r = runBundled(["change", "new", "Add login"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.ok(statSync(join(ws.root, ".sdd", "001-add-login")).isDirectory());
    assert.equal(r.stdout, "CHG-001 .sdd/001-add-login\n");
  } finally {
    ws.cleanup();
  }
});
