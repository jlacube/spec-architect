// C001-TC-219 — verifies C001-TS-219 (C001-AC-217.1, C001-REQ-217): conductor spawn allowlist.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { repoRoot } from "../../helpers.ts";

const SPECIALISTS = ["researcher", "cartographer", "options-analyst", "spec-writer", "test-designer", "architect", "planner", "critic", "auditor"].map((n) => `architect:sdd-${n}`);

test('the conductor\'s tools allow "Agent(" with exactly the nine sdd specialists', () => {
  const fm = splitFrontmatter(readFileSync(join(repoRoot(), "plugins", "architect", "agents", "sdd-conductor.md"), "utf8")).data ?? {};
  const tools = String(fm["tools"]);
  const m = /Agent\(([^)]*)\)/.exec(tools);
  assert.ok(m, tools);
  assert.deepEqual(m[1]!.split(",").map((s) => s.trim()).sort(), [...SPECIALISTS].sort());
  assert.equal((tools.match(/Agent\(/g) ?? []).length, 1);
});

test("the conductor's frontmatter matches C001-IF-09 A0", () => {
  const fm = splitFrontmatter(readFileSync(join(repoRoot(), "plugins", "architect", "agents", "sdd-conductor.md"), "utf8")).data ?? {};
  assert.equal(fm["name"], "sdd-conductor");
  assert.equal(fm["model"], "opus");
  assert.equal(fm["effort"], "xhigh");
  const rest = String(fm["tools"]).replace(/Agent\([^)]*\),\s*/, "").split(",").map((s) => s.trim());
  assert.deepEqual(rest, ["AskUserQuestion", "Read", "Glob", "Grep", "Write", "Edit", "Bash", "TaskCreate", "TaskUpdate", "TaskList", "Skill"]);
  assert.deepEqual(String(fm["skills"]).split(",").map((s) => s.trim()), ["sdd-conventions", "interview-protocol", "options-analysis", "gate-protocol", "phase-ideation", "phase-spec", "phase-plan"]);
  for (const k of ["hooks", "mcpServers", "permissionMode", "initialPrompt"]) assert.equal(k in fm, false, k);
});
