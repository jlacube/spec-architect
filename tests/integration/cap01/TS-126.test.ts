// C001-TC-126 — verifies C001-TS-126 (C001-AC-120.1, C001-REQ-120): full to lite is refused.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";

function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) for (const [k, v] of Object.entries(snapshot(p))) out[`${name}/${k}`] = v;
    else out[name] = readFileSync(p, "base64");
  }
  return out;
}

test("change profile 003 lite on a full change exits 2 with ERR-CLI-007 and modifies nothing", () => {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    runBundled(["init"], { cwd: ws.root });
    for (const t of ["One", "Two", "Three"]) assert.equal(runBundled(["change", "new", t, "--profile", "full"], { cwd: ws.root }).code, 0);
    const dir = join(ws.root, ".sdd", "003-three");
    const before = snapshot(dir);
    const r = runBundled(["change", "profile", "003", "lite"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^ERR-CLI-007: A full change cannot become lite\. Fix: Keep full; split the work into a new lite change\n$/);
    assert.deepEqual(snapshot(dir), before);
    assert.match(runBundled(["change", "profile", "003", "full"], { cwd: ws.root }).stdout, /already full/);
  } finally {
    ws.cleanup();
  }
});
