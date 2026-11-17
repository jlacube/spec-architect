// C005-TC-030 — verifies C005-TS-130 (C005-AC-110.1, C005-REQ-110): a README version that differs from
// plugin.json fails the test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { readmeVersionProblem } from "./plugin-text.ts";

test("plugin.json 0.1.2 with a README step naming architect-sdd@0.1.1: the message names README.md, 0.1.1 and 0.1.2", () => {
  const dir = mkdtempSync(join(tmpdir(), "sdd-c005-readme-"));
  try {
    const src = join(repoRoot(), "plugins", "architect");
    mkdirSync(join(dir, ".claude-plugin"));
    const manifest = JSON.parse(readFileSync(join(src, ".claude-plugin", "plugin.json"), "utf8")) as Record<string, unknown>;
    writeFileSync(join(dir, ".claude-plugin", "plugin.json"), JSON.stringify({ ...manifest, version: "0.1.2" }));
    const readme = readFileSync(join(src, "README.md"), "utf8").replace(/architect-sdd@\d+\.\d+\.\d+/, "architect-sdd@0.1.1");
    writeFileSync(join(dir, "README.md"), readme);
    const problem = readmeVersionProblem(dir);
    assert.ok(problem !== null);
    for (const s of ["README.md", "0.1.1", "0.1.2"]) assert.ok(problem.includes(s), problem);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
