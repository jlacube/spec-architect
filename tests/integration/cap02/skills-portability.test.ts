// C001-T-031 done-when: the interview skills name Claude Code tools only inside a "Claude Code
// wiring" section (C001-REQ-1118, checked in full by PLG-PORT-001) and stay within the per-skill
// budget of C001-NFR-105.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";

const SKILLS = ["interview-protocol", "options-analysis", "sdd-conventions", "phase-ideation", "phase-spec", "gate-protocol"];
const TOOL = /AskUserQuestion|Agent\(|TodoWrite|mcp__/;

for (const name of SKILLS) {
  test(`${name}: tool names only in "Claude Code wiring", ≤ 24,000 characters`, () => {
    const text = readFileSync(join(repoRoot(), "plugins", "architect", "skills", name, "SKILL.md"), "utf8");
    assert.ok(text.length <= 24000, `${text.length} characters`);
    const sections = text.split(/^(?=## )/m);
    for (const s of sections) {
      if (/^## Claude Code wiring\s*$/m.test(s.split("\n")[0]!)) continue;
      assert.equal(TOOL.exec(s)?.[0], undefined, s.split("\n")[0]);
    }
  });
}
