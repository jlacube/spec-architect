// C005-TC-026 — verifies C005-TS-126 (C005-AC-109.1, C005-REQ-109): SDD.md of a new workspace.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";
import { PLUGIN_VERSION } from "./handoff-section.ts";
import { implementingSection } from "./sddmd-section.ts";

test("sdd init: install line with the CLI's version, then the bare task set command; no plugin path", () => {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    assert.equal(runBundled(["--version"], { cwd: ws.root }).stdout.trim(), PLUGIN_VERSION);
    assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
    const text = readFileSync(join(ws.root, ".sdd", "SDD.md"), "utf8");
    const section = implementingSection(text);
    const install = section.indexOf(`npm install -g architect-sdd@${PLUGIN_VERSION}`);
    const task = section.indexOf("sdd task set <task-id> --status <status>");
    assert.ok(install >= 0, section);
    assert.ok(task > install, section);
    assert.ok(!text.includes("<plugin-root>"));
    assert.ok(!text.includes("scripts/sdd.mjs task set"));
  } finally {
    ws.cleanup();
  }
});
