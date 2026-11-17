// C005-TC-018 — verifies C005-TS-118 (C005-AC-106.1, C005-REQ-106): a lite hand-off scaffolded by the
// npm-installed sdd names the version that the installed sdd prints.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanupFxTgz, fxTgz } from "../../fixtures/fx-tgz.ts";
import { makeWorkspace } from "../cli/helpers.ts";
import { createdChange, isInstallLine, PLUGIN_VERSION } from "./handoff-section.ts";

after(cleanupFxTgz);

test("installed sdd: install line version equals sdd --version and plugin.json", () => {
  const fx = fxTgz();
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    const v = fx.runShim("sdd", ["--version"], { cwd: ws.root });
    assert.equal(v.code, 0, v.stderr);
    const version = v.stdout.trim();
    assert.equal(version, PLUGIN_VERSION);
    assert.equal(fx.runEntry("sdd", ["init"], { cwd: ws.root }).code, 0);
    const r = fx.runEntry("sdd", ["change", "new", "Export to CSV", "--profile", "lite", "--kind", "brownfield"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const text = readFileSync(join(createdChange(ws.root), "20-plan", "handoff.md"), "utf8");
    assert.ok(text.split(/\r?\n/).some((l) => isInstallLine(l, version)), text);
  } finally {
    ws.cleanup();
  }
});
