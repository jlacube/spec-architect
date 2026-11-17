// C005-TC-017 — verifies C005-TS-117 (C005-AC-106.1, C005-REQ-106): a lite hand-off scaffolded by the
// plugin's sdd CLI names the CLI's own version (the version of plugin.json the bundle was built from).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";
import { createdChange, isInstallLine, PLUGIN_VERSION } from "./handoff-section.ts";

test("the scaffolded hand-off holds npm install -g architect-sdd@<sdd --version>, no placeholder", () => {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    assert.equal(runBundled(["--version"], { cwd: ws.root }).stdout.trim(), PLUGIN_VERSION);
    assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
    assert.equal(runBundled(["change", "new", "Export to CSV", "--profile", "lite", "--kind", "brownfield"], { cwd: ws.root }).code, 0);
    const text = readFileSync(join(createdChange(ws.root), "20-plan", "handoff.md"), "utf8");
    assert.ok(text.split(/\r?\n/).some((l) => isInstallLine(l, PLUGIN_VERSION)), text);
    assert.ok(!text.includes("{{"), "no placeholder");
    assert.ok(!text.includes("<version>"));
  } finally {
    ws.cleanup();
  }
});
