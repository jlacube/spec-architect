// C005-TC-046 — verifies C005-TS-146 (C005-AC-116.1, C005-REQ-116): read-only subcommands on an archived
// change (rows: hash, gate show, lint, trace).
import { test } from "node:test";
import assert from "node:assert/strict";
import { runBundled } from "../cli/helpers.ts";
import { archivedChange, snapshot } from "./archived-fixture.ts";

test("sdd hash 001 10-spec prints the hash H of before the archive; nothing written", () => {
  const ws = archivedChange();
  try {
    const before = snapshot(ws.root);
    const r = runBundled(["hash", "001", "10-spec"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.doesNotMatch(r.stdout + r.stderr, /ERR-CLI-002/);
    assert.equal(r.stdout.trim(), ws.specHash);
    assert.deepEqual(snapshot(ws.root), before);
  } finally {
    ws.cleanup();
  }
});

test("sdd gate show 001 10-spec prints the gate summary of phase 10-spec of change 001; nothing written", () => {
  const ws = archivedChange();
  try {
    const before = snapshot(ws.root);
    const r = runBundled(["gate", "show", "001", "10-spec"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.doesNotMatch(r.stdout + r.stderr, /ERR-CLI-/);
    assert.match(r.stdout, /^Gate G2 — CHG-001 "Coupon codes" — phase 10-spec/);
    assert.deepEqual(snapshot(ws.root), before);
  } finally {
    ws.cleanup();
  }
});

test("sdd lint 001: no ERR-CLI-002, the findings name files of .sdd/_archive/001-coupon-codes/, nothing written", () => {
  const ws = archivedChange();
  try {
    const before = snapshot(ws.root);
    for (const args of [["lint", "001"], ["lint", "001", "--json"], ["lint", "001", "--phase", "20-plan"]]) {
      const r = runBundled(args, { cwd: ws.root });
      assert.ok(r.code === 0 || r.code === 1, `${args.join(" ")}: ${r.code} ${r.stderr}`);
      assert.doesNotMatch(r.stdout + r.stderr, /ERR-CLI-002/);
      if (args.includes("--json")) {
        const findings = (JSON.parse(r.stdout) as { findings: { path: string }[] }).findings;
        for (const f of findings) assert.ok(f.path.startsWith(".sdd/_archive/001-coupon-codes/"), f.path);
      }
    }
    assert.deepEqual(snapshot(ws.root), before);
  } finally {
    ws.cleanup();
  }
});

test("sdd trace 001 prints the trace result of change 001; nothing written", () => {
  const ws = archivedChange();
  try {
    const before = snapshot(ws.root);
    for (const args of [["trace", "001"], ["trace", "001", "--json"]]) {
      const r = runBundled(args, { cwd: ws.root });
      assert.ok(r.code === 0 || r.code === 1, `${args.join(" ")}: ${r.code} ${r.stderr}`);
      assert.doesNotMatch(r.stdout + r.stderr, /ERR-CLI-/);
      assert.ok(r.stdout.trim().length > 0);
    }
    assert.deepEqual(snapshot(ws.root), before);
  } finally {
    ws.cleanup();
  }
});
