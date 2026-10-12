// C001-TC-1007 / C001-TS-1007 (C001-AC-1006.1, C001-REQ-1006): Serena is launched read-only — the
// launch arguments and environment of C001-IF-14 §4, and, when Serena is installed, the running
// server lists only the read-only tools.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mcpConfig } from "../plugin-files.ts";
import { serenaInstalled, serenaToolNames } from "./serena-tools.ts";

const ALLOWED = ["find_symbol", "get_symbols_overview", "find_referencing_symbols", "find_declaration", "find_implementations", "get_diagnostics_for_file", "initial_instructions"];

test("the serena server is started with the read-only launch arguments and SERENA_HOME in the plugin data folder", () => {
  const s = mcpConfig()["serena"]!;
  const args = s.args ?? [];
  const pair = (flag: string, value: string) => args.some((a, i) => a === flag && args[i + 1] === value);
  assert.ok(pair("--context", "claude-code"));
  assert.ok(pair("--mode", "planning"));
  assert.ok(pair("--mode", "${CLAUDE_PLUGIN_ROOT}/serena/architect-read-only.yml"));
  assert.ok(pair("--project", "."), "the working directory is the project, git or not (D-008)");
  assert.ok(!args.includes("--project-from-cwd"));
  assert.ok(pair("--enable-web-dashboard", "False"));
  assert.ok(pair("--open-web-dashboard", "False"));
  assert.equal(s.env?.["SERENA_HOME"], "${CLAUDE_PLUGIN_DATA}/serena");
});

for (const git of [true, false]) test(`with the server running in a folder ${git ? "with" : "without"} git, every tool it lists is a read-only tool`, { skip: !serenaInstalled() && "Serena is not installed", timeout: 120000 }, async (t) => {
  const project = mkdtempSync(join(tmpdir(), "sdd-serena-proj-"));
  try {
    writeFileSync(join(project, "a.ts"), "export function f(): number {\n  return 1;\n}\n");
    // D-008: with --project-from-cwd a folder without git had no active project and no mode exclusions.
    if (git) spawnSync("git", ["init", "-q"], { cwd: project });
    const tools = await serenaToolNames(project);
    t.diagnostic(`serena tools: ${tools.join(", ")}`);
    assert.ok(tools.length > 0, "the server lists tools");
    assert.deepEqual(tools.filter((t) => !ALLOWED.includes(t)), [], `tools: ${tools.join(", ")}`);
  } finally {
    try {
      rmSync(project, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // A language server Serena started may still hold the temporary folder; it is left for the OS.
    }
  }
});
