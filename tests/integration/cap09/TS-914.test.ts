// C001-TC-914 / C001-TS-914 (C001-AC-913.1, C001-REQ-913): archive refused while a task is open and a
// defect is open; every unmet precondition is listed and nothing is modified.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runBundled } from "../cli/helpers.ts";
import { archiveWorkspace, checksum, inventoryStub } from "./archive-fixture.ts";

test("archive 004 with task C004-T-032 in-progress and defect D-002 open exits 2 with ERR-CLI-009", () => {
  const ws = archiveWorkspace({
    tasks: ["in-progress", "done"],
    defects: [{ id: "D-002", status: "open" }],
    reqs: [{ cap: "billing", id: "C004-REQ-012", title: "Card payments", delta: "ADDED" }],
    living: { "CAP-billing.md": inventoryStub("billing") },
  });
  try {
    runBundled(["status", "--write"], { cwd: ws.root });
    const before = checksum(ws.root);
    const r = runBundled(["archive", "004"], { cwd: ws.root });
    assert.equal(r.code, 2);
    for (const s of ["ERR-CLI-009", "C004-T-032", "D-002"]) assert.ok(r.stderr.includes(s), r.stderr);
    assert.equal(checksum(ws.root), before);
  } finally {
    ws.cleanup();
  }
});

test("G3 not approved is listed too", () => {
  const ws = archiveWorkspace({ planStatus: "in-review", reqs: [{ cap: "billing", id: "C004-REQ-012", title: "Card payments", delta: "ADDED" }] });
  try {
    const r = runBundled(["archive", "004"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /G3 not approved \(20-plan in-review\)/);
  } finally {
    ws.cleanup();
  }
});

test("a cited requirement missing from _living/ blocks the archive", () => {
  const ws = archiveWorkspace({ reqs: [{ cap: "billing", id: "C004-REQ-012", title: "Card payments", delta: "MODIFIED (was C002-REQ-044)" }] });
  try {
    const r = runBundled(["archive", "004"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /C002-REQ-044 \(cited by C004-REQ-012\) is not in _living\//);
  } finally {
    ws.cleanup();
  }
});
