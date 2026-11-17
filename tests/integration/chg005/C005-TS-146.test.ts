// C005-TC-046 — verifies C005-TS-146 (C005-AC-116.1, C005-REQ-116): read-only subcommands on an archived
// change. C005-T-005 adds the `lint` rows; C005-T-009 adds the others.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runBundled } from "../cli/helpers.ts";
import { archivedChange, snapshot } from "./archived-fixture.ts";

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
