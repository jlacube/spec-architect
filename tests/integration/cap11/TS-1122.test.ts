// C001-TC-1122 / C001-TS-1122 (C001-AC-1121.1, C001-REQ-1121): hooks.json commands are shell-agnostic
// and wire the events and matchers of C001-IF-07 §2.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";

interface HookEntry {
  matcher?: string;
  hooks: { type: string; command: string }[];
}
const doc = JSON.parse(readFileSync(join(repoRoot(), "plugins", "architect", "hooks", "hooks.json"), "utf8")) as { hooks: Record<string, HookEntry[]> };
const PREFIX = 'node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"';

test("every hook command starts with the node CLI prefix and has no shell operators", () => {
  const commands = Object.values(doc.hooks).flatMap((entries) => entries.flatMap((e) => e.hooks.map((h) => h.command)));
  assert.equal(commands.length, 5);
  for (const c of commands) {
    assert.ok(c.startsWith(PREFIX), c);
    for (const op of ["&&", "||", ";", "|", ">", "$(", "`"]) assert.ok(!c.includes(op), `${op} in ${c}`);
  }
});

test("events, matchers and arguments follow C001-IF-07 §2", () => {
  const rows = Object.entries(doc.hooks).flatMap(([event, entries]) => entries.map((e) => [event, e.matcher ?? "", e.hooks.map((h) => h.command.slice(PREFIX.length + 1)).join(", ")]));
  assert.deepEqual(rows, [
    ["PreToolUse", "Write|Edit|NotebookEdit", "guard-path"],
    ["PreToolUse", "Bash|PowerShell", "guard-bash"],
    ["PostToolUse", "Write|Edit", "hook post-write"],
    ["SubagentStop", "^architect:sdd-(spec-writer|architect|planner|test-designer)$", "trace --quiet --write --active"],
    ["SessionStart", "", "hook session-start"],
  ]);
});
