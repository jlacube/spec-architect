// C001-TC-917 / C001-TS-917 (C001-AC-916.1, C001-REQ-916): a REMOVED requirement deletes the cited
// living entry and History records the removal by the change.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isoDate } from "../../../src/workspace/change.ts";
import { runBundled } from "../cli/helpers.ts";
import { archiveWorkspace, historyRows, livingWith, requirementHeadings } from "./archive-fixture.ts";

test("removed requirement", () => {
  const ws = archiveWorkspace({
    reqs: [{ cap: "billing", id: "C004-REQ-013", title: "Drop paper invoices", delta: "REMOVED (was C002-REQ-050)" }],
    living: { "CAP-billing.md": livingWith("billing", [["C002-REQ-050", "Paper invoices"], ["C002-REQ-051", "Kept"]]) },
  });
  try {
    const r = runBundled(["archive", "004"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const dir = join(ws.root, ".sdd", "_living");
    for (const n of readdirSync(dir)) assert.ok(!requirementHeadings(readFileSync(join(dir, n), "utf8")).some((h) => h.includes("C002-REQ-050")), n);
    const text = readFileSync(join(dir, "CAP-billing.md"), "utf8");
    assert.deepEqual(requirementHeadings(text), ["### C002-REQ-051 — Kept"]);
    assert.deepEqual(historyRows(text), [["C002-REQ-050", "removed", "CHG-004", isoDate(), "by C004-REQ-013"]]);
  } finally {
    ws.cleanup();
  }
});
