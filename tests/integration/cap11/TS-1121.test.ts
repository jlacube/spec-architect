// C001-TC-1121 / C001-TS-1121 (C001-AC-1120.1, C001-REQ-1120): an absolute machine path in a skill is
// PLG-PATH-001 with file and line; URLs and marked documentation examples are not.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pluginCopy } from "./structure.ts";

test("machine path in a skill", () => {
  const p = pluginCopy();
  try {
    assert.deepEqual(p.findings("PLG-PATH-001"), [], "the shipped plugin is clean");
    const skill = join(p.plugin, "skills", "code-discovery", "SKILL.md");
    const before = readFileSync(skill, "utf8");
    const line = before.split("\n").length + 1; // `before` ends with a newline, then one blank line
    writeFileSync(skill, `${before}\nRun C:\\Users\\jerom\\tools\\ripwire.exe first.\n\n\`\`\`text example\nC:\\Users\\you\\repo\n\`\`\`\n\nSee https://example.org/a/b and /home/user/repo.\n`);
    const f = p.findings("PLG-PATH-001");
    assert.deepEqual(f.map((x: { path: string; line: number }) => `${x.path}:${x.line}`), [`plugins/architect/skills/code-discovery/SKILL.md:${line}`, `plugins/architect/skills/code-discovery/SKILL.md:${line + 6}`]);
  } finally {
    p.cleanup();
  }
});
