// C002-T-078 (C002-REQ-313, C002-REQ-314, C002-IF-008 §3, defect D-053): the output form of the
// session-start brief per host — plain lines on Claude Code, one JSON object under `--host copilot`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { sessionStartOutput } from "../../../src/hooks/session-start.ts";

const BRIEF = ["SDD workspace: 1 active change(s)", 'CHG-001 10-spec "draft" · tasks 0/0 · 0 open defects'];

test("no --host and --host claude-code: the brief lines unchanged", () => {
  assert.deepEqual(sessionStartOutput(BRIEF, undefined), BRIEF);
  assert.deepEqual(sessionStartOutput(BRIEF, "claude-code"), BRIEF);
});

test("--host copilot: one line, the JSON object with the lines joined by line feeds, quotes escaped", () => {
  const out = sessionStartOutput(BRIEF, "copilot");
  assert.equal(out.length, 1);
  assert.ok(!out[0]!.includes("\n"), "a single physical line");
  assert.deepEqual(JSON.parse(out[0]!), { hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: BRIEF.join("\n") } });
});

test("no workspace (no brief lines): no output in either form", () => {
  for (const host of [undefined, "claude-code", "copilot"]) assert.deepEqual(sessionStartOutput([], host), []);
});
