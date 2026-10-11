// C001-TC-918 / C001-TS-918 (C001-AC-917.1, C001-REQ-917): RENAMED to another capability moves the entry
// with its new title; the source file's History records the move and the old title.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";
import { archiveWorkspace, historyRows, livingWith, requirementHeadings } from "./archive-fixture.ts";

test("renamed to another capability", () => {
  const ws = archiveWorkspace({
    reqs: [{ cap: "reporting", id: "C004-REQ-030", title: "Statement export", delta: "RENAMED (was C002-REQ-060)" }],
    living: { "CAP-billing.md": livingWith("billing", [["C002-REQ-060", "Invoice export"]]) },
  });
  try {
    const r = runBundled(["archive", "004"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const living = join(ws.root, ".sdd", "_living");
    const reporting = readFileSync(join(living, "CAP-reporting.md"), "utf8");
    assert.deepEqual(requirementHeadings(reporting), ["### C002-REQ-060 — Statement export"]);
    assert.match(reporting, /C002-AC-060\.1/, "the entry keeps its criteria");
    const billing = readFileSync(join(living, "CAP-billing.md"), "utf8");
    assert.deepEqual(requirementHeadings(billing), []);
    const [row] = historyRows(billing);
    assert.equal(row![0], "C002-REQ-060");
    assert.match(row![1]!, /"Invoice export"/);
    assert.match(row![1]!, /moved to CAP-reporting/);
    assert.equal(row![2], "CHG-004");
  } finally {
    ws.cleanup();
  }
});

test("renamed within the same capability updates the title in place", () => {
  const ws = archiveWorkspace({
    reqs: [{ cap: "billing", id: "C004-REQ-031", title: "Statement export", delta: "RENAMED (was C002-REQ-060)" }],
    living: { "CAP-billing.md": livingWith("billing", [["C002-REQ-060", "Invoice export"]]) },
  });
  try {
    assert.equal(runBundled(["archive", "004"], { cwd: ws.root }).code, 0);
    const billing = readFileSync(join(ws.root, ".sdd", "_living", "CAP-billing.md"), "utf8");
    assert.deepEqual(requirementHeadings(billing), ["### C002-REQ-060 — Statement export"]);
    assert.match(historyRows(billing)[0]![1]!, /renamed from "Invoice export" to "Statement export"/);
  } finally {
    ws.cleanup();
  }
});
