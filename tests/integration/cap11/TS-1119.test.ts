// C001-TC-1119 / C001-TS-1119 (C001-AC-1118.1, C001-REQ-1118): a Claude Code tool name in a skill outside
// a "Claude Code wiring" section is PLG-PORT-001; inside that section it is not.
import { test } from "node:test";
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { pluginCopy } from "./structure.ts";

test("tool names in skills", () => {
  const p = pluginCopy();
  try {
    assert.deepEqual(p.findings("PLG-PORT-001"), [], "the shipped plugin is clean");
    const skill = join(p.plugin, "skills", "ears-requirements", "SKILL.md");
    appendFileSync(skill, "\n## Examples\n\nAsk with AskUserQuestion.\n\n## Claude Code wiring\n\nAskUserQuestion is the conductor's tool.\n");
    const f = p.findings("PLG-PORT-001");
    assert.equal(f.length, 1, JSON.stringify(f));
    assert.equal(f[0].path, "plugins/architect/skills/ears-requirements/SKILL.md");
    assert.match(f[0].message, /AskUserQuestion/);
    assert.equal(f[0].severity, "error");
  } finally {
    p.cleanup();
  }
});
