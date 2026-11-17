// C005-TC-032 — verifies C005-TS-132 (C005-AC-111.1, C005-REQ-111): a planted plugin-path form is reported
// with its file and line.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { scanPluginPaths } from "./plugin-text.ts";

const ROWS: [string, string][] = [
  ["templates/full/20-plan/handoff.md", "node <plugin-root>/scripts/sdd.mjs task set T-001 --status done"],
  ["README.md", "node <plugin>/scripts/sdd.mjs task set T-001 --status done"],
  ["scripts/sdd.mjs", "report progress with node <plugin-root>/scripts/sdd.mjs"],
];

for (const [file, text] of ROWS) {
  test(`${file} holding "${text}" at line 5: reported with the file and line 5`, () => {
    const dir = mkdtempSync(join(tmpdir(), "sdd-c005-scan-"));
    try {
      cpSync(join(repoRoot(), "plugins", "architect"), dir, { recursive: true });
      const p = join(dir, ...file.split("/"));
      const lines = readFileSync(p, "utf8").split("\n");
      lines.splice(4, 0, text);
      writeFileSync(p, lines.join("\n"));
      const found = scanPluginPaths(dir);
      assert.ok(found.length > 0);
      assert.ok(found.every((f) => f.startsWith(`${file}:5:`)), found.join("\n"));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}
