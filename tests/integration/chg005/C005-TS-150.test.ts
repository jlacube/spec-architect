// C005-TC-050 — verifies C005-TS-150 (C005-AC-117.1, C005-REQ-117): a writing subcommand naming an archived
// change by an ID; defect add keeps ERR-CLI-008.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runBundled } from "../cli/helpers.ts";
import { archivedChange, snapshot } from "./archived-fixture.ts";

const ROWS: [string[], string][] = [
  [["task", "set", "C001-T-075", "--status", "done"], "ERR-CLI-014"],
  [["defect", "add", "--ref", "C001-REQ-913", "--summary", "late finding"], "ERR-CLI-008"],
  [["id", "tombstone", "C001-REQ-913", "--reason", "retire"], "ERR-CLI-014"],
];

for (const [args, code] of ROWS) {
  test(`sdd ${args.join(" ")}: exit 2, ${code}, nothing written`, () => {
    const ws = archivedChange();
    try {
      const before = snapshot(ws.root);
      const r = runBundled(args, { cwd: ws.root });
      assert.equal(r.code, 2, r.stderr);
      assert.ok(r.stderr.startsWith(code), r.stderr);
      assert.deepEqual(snapshot(ws.root), before);
    } finally {
      ws.cleanup();
    }
  });
}
