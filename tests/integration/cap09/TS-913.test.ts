// C001-TC-913 / C001-TS-913 (C001-AC-912.1, C001-REQ-912): in a repository without .sdd/ every hook of
// hooks.json is silent and exits 0 (the guards also allow non-Architect callers at once).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";

test("session-start in a repository without .sdd/ exits 0 with empty stdout and stderr", () => {
  const repo = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-ts913-")));
  try {
    writeFileSync(join(repo, "README.md"), "x\n");
    const r = runBundled(["hook", "session-start"], { cwd: repo, stdin: JSON.stringify({ session_id: "s", cwd: repo, hook_event_name: "SessionStart", source: "startup" }) });
    assert.deepEqual([r.code, r.stdout, r.stderr], [0, "", ""]);
    const write = { session_id: "s", cwd: repo, tool_name: "Write", tool_input: { file_path: join(repo, "README.md"), content: "y" } };
    for (const [args, input] of [
      [["hook", "post-write"], { ...write, hook_event_name: "PostToolUse" }],
      [["guard-path"], { ...write, hook_event_name: "PreToolUse" }],
      [["guard-bash"], { session_id: "s", cwd: repo, hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "npm test" } }],
      [["trace", "--quiet", "--write", "--active"], { session_id: "s", cwd: repo, hook_event_name: "SubagentStop", agent_type: "architect:sdd-planner" }],
    ] as const) {
      const h = runBundled([...args], { cwd: repo, stdin: JSON.stringify(input) });
      assert.deepEqual([h.code, h.stdout, h.stderr], [0, "", ""], args.join(" "));
    }
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
