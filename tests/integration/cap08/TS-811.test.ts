// C001-TC-811 — verifies C001-TS-811 (C001-AC-810.1, C001-REQ-810): stale propagation.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";
import { approvedChange, REQ, statuses } from "./gate-fixture.ts";

test("a word changed in 10-spec makes 10-spec and 20-plan stale; 00-ideation stays approved", () => {
  const ws = approvedChange();
  try {
    const p = join(ws.root, ...REQ.split("/"));
    writeFileSync(p, readFileSync(p, "utf8").replace("do one thing", "do two things"));
    const r = runBundled(["stale", "check"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(statuses(ws.dir), { "00-ideation": "approved", "10-spec": "stale", "20-plan": "stale" });
    assert.match(r.stdout, /^CHG-004 10-spec: stale \(hash changed\)$/m);
    assert.match(r.stdout, /^CHG-004 20-plan: stale \(earlier phase stale\)$/m);
    // Only the status values changed in change.md.
    assert.match(readFileSync(join(ws.dir, "change.md"), "utf8"), /^ {2}10-spec: \{ status: stale, approved_hash: "sha256:[0-9a-f]{64}", approved_at: 2026-10-11, approved_by: p01 \}$/m);
  } finally {
    ws.cleanup();
  }
});

test("without edits every approved phase stays approved", () => {
  const ws = approvedChange();
  try {
    const r = runBundled(["stale", "check", "004"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(statuses(ws.dir), { "00-ideation": "approved", "10-spec": "approved", "20-plan": "approved" });
  } finally {
    ws.cleanup();
  }
});
