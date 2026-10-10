// C001-TC-106 — verifies C001-TS-106 (C001-AC-104.2, C001-REQ-104): hand edits are overwritten.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";
import { changeMd, SDD_MD } from "../workspace-fixtures.ts";

test("a registry hand-edited to approved is set back to draft from change.md", () => {
  const ws = makeWorkspace({
    ".sdd/SDD.md": SDD_MD,
    ".sdd/001-alpha/change.md": changeMd({ nnn: "001", phase: "10-spec", phases: { "10-spec": { status: "draft" } } }),
  });
  try {
    const registryPath = join(ws.root, ".sdd", "registry.json");
    assert.equal(runBundled(["status", "--write"], { cwd: ws.root }).code, 0);
    const edited = JSON.parse(readFileSync(registryPath, "utf8")) as { changes: { phases: Record<string, { status: string }> }[] };
    edited.changes[0]!.phases["10-spec"]!.status = "approved";
    writeFileSync(registryPath, JSON.stringify(edited, null, 2));
    assert.equal(runBundled(["status", "--write"], { cwd: ws.root }).code, 0);
    const after = JSON.parse(readFileSync(registryPath, "utf8")) as typeof edited;
    assert.equal(after.changes[0]!.phases["10-spec"]!.status, "draft");
  } finally {
    ws.cleanup();
  }
});
