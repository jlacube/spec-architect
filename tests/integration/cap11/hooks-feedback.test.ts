// C001-T-052: post-write quick-lint feedback (C001-REQ-705, C001-IF-07 §4) and the SubagentStop trace
// (`trace --active`, C001-IF-07 §2: always exit 0).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, minimalChange, REBUILD, runBundled } from "../cli/helpers.ts";

function postWrite(root: string, file: string) {
  const input = { session_id: "s", cwd: root, hook_event_name: "PostToolUse", agent_type: "architect:sdd-spec-writer", tool_name: "Write", tool_input: { file_path: file, content: "x" } };
  return runBundled(["hook", "post-write"], { cwd: root, stdin: JSON.stringify(input) });
}

test("a written .sdd/ file with findings gets them back as additionalContext, most severe first", () => {
  const ws = makeWorkspace({ ...minimalChange(), ".sdd/registry.json": REBUILD, ".sdd/004-x/10-spec/bad.md": "---\nid: C004-REQ-999\n---\n# TODO\n\nTBD\n" });
  try {
    const r = postWrite(ws.root, join(ws.root, ".sdd", "004-x", "10-spec", "bad.md"));
    assert.equal(r.code, 0, r.stderr);
    const doc = JSON.parse(r.stdout) as { hookSpecificOutput: { hookEventName: string; additionalContext: string } };
    assert.equal(doc.hookSpecificOutput.hookEventName, "PostToolUse");
    const lines = doc.hookSpecificOutput.additionalContext.split("\n");
    assert.match(lines[0]!, /^sdd quick lint of .+bad\.md: \d+ finding\(s\)$/);
    assert.ok(lines.length - 1 <= 16);
    const ranks = lines.slice(1).filter((l) => !l.startsWith("…")).map((l) => ["error", "warn", "info"].indexOf(l.split(" ")[0]!));
    assert.ok(ranks.length > 0 && ranks.every((r) => r >= 0));
    assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
  } finally {
    ws.cleanup();
  }
});

test("a file outside .sdd/ gets no feedback", () => {
  const ws = makeWorkspace({ ...minimalChange(), "src/app.ts": "x\n" });
  try {
    assert.deepEqual(postWrite(ws.root, join(ws.root, "src", "app.ts")), { code: 0, stdout: "", stderr: "" });
  } finally {
    ws.cleanup();
  }
});

test("trace --active writes the trace of every active change and exits 0, quietly with --quiet", () => {
  const ws = makeWorkspace({ ...minimalChange(), ".sdd/registry.json": REBUILD });
  try {
    const r = runBundled(["trace", "--quiet", "--write", "--active"], { cwd: ws.root });
    assert.deepEqual([r.code, r.stdout, r.stderr], [0, "", ""]);
    assert.ok(existsSync(join(ws.root, ".sdd", "004-x", "trace.json")));
    assert.match(runBundled(["trace", "--active"], { cwd: ws.root }).stdout, /^CHG-004: open items \d+/);
    assert.equal(runBundled(["trace"], { cwd: ws.root }).code, 2, "without <NNN> or --active: usage error");
  } finally {
    ws.cleanup();
  }
});
