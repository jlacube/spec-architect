// C001-TC-922 / C001-TS-922 (C001-AC-921.1, C001-REQ-921): --dry-run lists every planned operation with
// file, operation and ID, and leaves every file under .sdd/ byte-identical.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runBundled } from "../cli/helpers.ts";
import { archiveWorkspace, checksum, livingWith } from "./archive-fixture.ts";

test("preview", () => {
  const ws = archiveWorkspace({
    reqs: [
      { cap: "billing", id: "C004-REQ-012", title: "Card payments", delta: "MODIFIED (was C002-REQ-044)" },
      { cap: "billing", id: "C004-REQ-013", title: "Wallets", delta: "ADDED" },
      { cap: "billing", id: "C004-REQ-014", title: "Drop", delta: "REMOVED (was C002-REQ-050)" },
      { cap: "reporting", id: "C004-REQ-030", title: "Statement export", delta: "RENAMED (was C002-REQ-060)" },
    ],
    living: { "CAP-billing.md": livingWith("billing", [["C002-REQ-044", "Card"], ["C002-REQ-050", "Paper"], ["C002-REQ-060", "Invoice export"]]) },
    glossary: { terms: [["payment intent", "A request"]] },
  });
  try {
    runBundled(["status", "--write"], { cwd: ws.root });
    const before = checksum(ws.root);
    const r = runBundled(["archive", "004", "--dry-run"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(checksum(ws.root), before);
    const lines = r.stdout.trimEnd().split("\n");
    assert.match(lines[0]!, /^archive CHG-004 \(dry run\): \d+ operation\(s\)$/);
    for (const want of [
      ".sdd/_living/CAP-billing.md: replace C002-REQ-044",
      ".sdd/_living/CAP-billing.md: add C004-REQ-013",
      ".sdd/_living/CAP-billing.md: remove C002-REQ-050",
      ".sdd/_living/CAP-billing.md: move-out C002-REQ-060",
      ".sdd/_living/CAP-reporting.md: create+move-in C002-REQ-060",
      ".sdd/_constitution/glossary.md: add-term payment intent",
      ".sdd/004-x: move CHG-004",
    ])
      assert.ok(lines.some((l) => l.startsWith(want)), `${want} in\n${r.stdout}`);
    assert.equal(Number(/(\d+) operation/.exec(lines[0]!)![1]), lines.length - 1);
  } finally {
    ws.cleanup();
  }
});
