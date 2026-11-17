// C005-TC-049 — verifies C005-TS-149 (C005-AC-117.1, C005-REQ-117): a writing subcommand naming an archived
// change by number is refused at lookup with ERR-CLI-014 and writes nothing.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runBundled } from "../cli/helpers.ts";
import { archivedChange, snapshot } from "./archived-fixture.ts";

const ROWS: string[][] = [
  ["trace", "001", "--write"],
  ["stale", "check", "001"],
  ["gate", "approve", "001", "20-plan", "--note", "again"],
  ["gate", "record", "001", "20-plan", "--decision", "revise", "--note", "redo"],
  ["change", "revise", "001", "10-spec", "--reason", "edit"],
  ["change", "stop", "001", "--reason", "stop"],
  ["defect", "reopen", "D-001", "--change", "001"],
  ["defect", "close", "D-001", "--change", "001", "--resolution", "again"],
  ["id", "next", "TS", "--change", "001"],
  ["change", "profile", "001", "full"],
  ["archive", "001"],
];

for (const args of ROWS) {
  test(`sdd ${args.join(" ")}: exit 2, ERR-CLI-014, nothing written`, () => {
    const ws = archivedChange();
    try {
      const before = snapshot(ws.root);
      const r = runBundled(args, { cwd: ws.root });
      assert.equal(r.code, 2, r.stderr);
      assert.match(r.stderr, /^ERR-CLI-014/);
      assert.deepEqual(snapshot(ws.root), before);
    } finally {
      ws.cleanup();
    }
  });
}
