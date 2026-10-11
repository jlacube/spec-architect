// C001-TC-205 — verifies C001-TS-205 (C001-AC-204.2, C001-REQ-204): phase skill identity. The rule
// PLG-DUP-001 (no more than 10 identical consecutive non-blank lines shared by a command and an agent
// body) is applied here until the plugin structure check (C001-T-061) runs it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { repoRoot } from "../../helpers.ts";

const PLUGIN = join(repoRoot(), "plugins", "architect");
const body = (p: string) => { const d = splitFrontmatter(readFileSync(p, "utf8")); return d.lines.slice(d.bodyStartLine - 1).join("\n"); };

/** Longest run of identical consecutive non-blank (trimmed) lines shared by two texts. */
export function sharedRun(a: string, b: string): number {
  const la = a.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const lb = b.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let best = 0;
  for (let i = 0; i < la.length; i++)
    for (let j = 0; j < lb.length; j++) {
      let k = 0;
      while (i + k < la.length && j + k < lb.length && la[i + k] === lb[j + k]) k++;
      best = Math.max(best, k);
    }
  return best;
}

test("the conductor preloads each phase skill and each phase command loads the same skill", () => {
  const skills = String(splitFrontmatter(readFileSync(join(PLUGIN, "agents", "sdd-conductor.md"), "utf8")).data?.["skills"]).split(",").map((s) => s.trim());
  for (const [cmd, skill] of [["ideate", "phase-ideation"], ["specify", "phase-spec"], ["plan", "phase-plan"]]) {
    assert.ok(skills.includes(skill!), skill);
    assert.match(body(join(PLUGIN, "commands", `${cmd}.md`)), new RegExp(`Load the \`${skill}\` skill`));
  }
});

test("PLG-DUP-001: no command shares more than 10 consecutive lines with an agent body", () => {
  const agents = readdirSync(join(PLUGIN, "agents")).map((f) => body(join(PLUGIN, "agents", f)));
  for (const f of readdirSync(join(PLUGIN, "commands")).filter((x) => x.endsWith(".md"))) {
    const cmd = body(join(PLUGIN, "commands", f));
    for (const a of agents) assert.ok(sharedRun(cmd, a) <= 10, f);
    assert.doesNotMatch(cmd, /^## Step \d+/m, `${f} contains phase procedure steps`);
  }
  assert.equal(sharedRun("a\nb\nc\n", "x\nb\nc\n"), 2);
});
