// C005-TC-027 — verifies C005-TS-127 (C005-AC-109.1, C005-REQ-109): sdd init --force replaces the 0.1.0
// sentence and keeps the status block.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";
import { PLUGIN_VERSION } from "./handoff-section.ts";
import { implementingSection, OLD_SENTENCE } from "./sddmd-section.ts";

test("sdd init --force: the section gives the install line and the bare command; status block kept", () => {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
    const p = join(ws.root, ".sdd", "SDD.md");
    const now = readFileSync(p, "utf8");
    const section = implementingSection(now);
    writeFileSync(p, now.split(section).join(`## If you are implementing a change\n${OLD_SENTENCE}\n`));
    assert.ok(readFileSync(p, "utf8").includes("node <plugin-root>/scripts/sdd.mjs"));
    assert.equal(runBundled(["init", "--force"], { cwd: ws.root }).code, 0);
    const after = readFileSync(p, "utf8");
    const s = implementingSection(after);
    assert.ok(s.indexOf(`npm install -g architect-sdd@${PLUGIN_VERSION}`) >= 0, s);
    assert.ok(s.indexOf("sdd task set <task-id> --status <status>") > s.indexOf("npm install -g"), s);
    assert.ok(!s.includes("node <plugin-root>/scripts/sdd.mjs"));
    assert.ok(after.includes("<!-- sdd:status:begin -->") && after.includes("<!-- sdd:status:end -->"));
  } finally {
    ws.cleanup();
  }
});
