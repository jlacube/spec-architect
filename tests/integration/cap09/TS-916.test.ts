// C001-TC-916 / C001-TS-916 (C001-AC-915.1, C001-REQ-915): a MODIFIED requirement replaces the cited
// living entry under its own ID; History records the superseded ID, the change and today's date.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isoDate } from "../../../src/workspace/change.ts";
import { runBundled } from "../cli/helpers.ts";
import { archiveWorkspace, historyRows, livingWith, requirementHeadings } from "./archive-fixture.ts";

test("modified requirement", () => {
  const ws = archiveWorkspace({
    reqs: [{ cap: "billing", id: "C004-REQ-012", title: "Card payments v2", delta: "MODIFIED (was C002-REQ-044)" }],
    living: { "CAP-billing.md": livingWith("billing", [["C002-REQ-043", "Kept"], ["C002-REQ-044", "Card payments"]]) },
  });
  try {
    const r = runBundled(["archive", "004"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const text = readFileSync(join(ws.root, ".sdd", "_living", "CAP-billing.md"), "utf8");
    assert.deepEqual(requirementHeadings(text), ["### C002-REQ-043 — Kept", "### C004-REQ-012 — Card payments v2"]);
    assert.doesNotMatch(text, /C002-AC-044\.1/, "the old entry's criteria go with it");
    assert.deepEqual(historyRows(text), [["C002-REQ-044", "superseded by C004-REQ-012", "CHG-004", isoDate(), ""]]);
  } finally {
    ws.cleanup();
  }
});
