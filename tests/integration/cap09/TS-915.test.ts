// C001-TC-915 / C001-TS-915 (C001-AC-914.1, C001-REQ-914): an ADDED requirement is appended to an
// inventory stub, which keeps its inventory sections and becomes `inventory_only: false`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";
import { archiveWorkspace, inventoryStub, requirementHeadings } from "./archive-fixture.ts";

test("archive into an inventory stub", () => {
  const ws = archiveWorkspace({ reqs: [{ cap: "billing", id: "C004-REQ-012", title: "Card payments", delta: "ADDED" }], living: { "CAP-billing.md": inventoryStub("billing") } });
  try {
    const r = runBundled(["archive", "004"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const text = readFileSync(join(ws.root, ".sdd", "_living", "CAP-billing.md"), "utf8");
    assert.match(text, /^inventory_only: false$/m);
    assert.match(text, /^## Purpose$/m);
    assert.match(text, /^## Entry points$/m);
    assert.match(text, /src\/billing\/index\.ts/);
    assert.deepEqual(requirementHeadings(text), ["### C004-REQ-012 — Card payments"]);
    assert.doesNotMatch(text, /\*\*Delta:\*\*/, "the Delta field is not carried into the living spec");
    assert.equal(runBundled(["lint"], { cwd: ws.root }).stdout.match(/LINT-LIV-001/), null);
  } finally {
    ws.cleanup();
  }
});

test("an ADDED requirement of a capability without a living file creates CAP-<slug>.md", () => {
  const ws = archiveWorkspace({ reqs: [{ cap: "payments", id: "C004-REQ-020", title: "Refunds", delta: "ADDED" }] });
  try {
    assert.equal(runBundled(["archive", "004"], { cwd: ws.root }).code, 0);
    const text = readFileSync(join(ws.root, ".sdd", "_living", "CAP-payments.md"), "utf8");
    assert.match(text, /^capability: payments$/m);
    assert.deepEqual(requirementHeadings(text), ["### C004-REQ-020 — Refunds"]);
  } finally {
    ws.cleanup();
  }
});
