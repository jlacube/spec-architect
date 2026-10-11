// C001-TC-919 / C001-TS-919 (C001-AC-918.1, C001-REQ-918): acceptance criteria and scenarios travel
// with their requirement into the living file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";
import { archiveWorkspace, requirementHeadings } from "./archive-fixture.ts";

test("acceptance carried along", () => {
  const ws = archiveWorkspace({
    reqs: [
      { cap: "billing", id: "C004-REQ-012", title: "Card payments", delta: "ADDED", acs: ["C004-AC-012.1", "C004-AC-012.2"], scenarios: ["C004-TS-040", "C004-TS-041"] },
      { cap: "billing", id: "C004-REQ-013", title: "Wallets", delta: "ADDED" },
    ],
  });
  try {
    assert.equal(runBundled(["archive", "004"], { cwd: ws.root }).code, 0);
    const text = readFileSync(join(ws.root, ".sdd", "_living", "CAP-billing.md"), "utf8");
    assert.deepEqual(requirementHeadings(text), ["### C004-REQ-012 — Card payments", "### C004-REQ-013 — Wallets"]);
    const entry = text.slice(text.indexOf("### C004-REQ-012"), text.indexOf("### C004-REQ-013"));
    for (const id of ["C004-AC-012.1", "C004-AC-012.2", "C004-TS-040", "C004-TS-041"]) assert.ok(entry.includes(id), id);
    assert.doesNotMatch(entry, /Coverage table|\| REQ \|/);
    assert.match(entry, /# a gherkin comment, not a heading/);
  } finally {
    ws.cleanup();
  }
});
