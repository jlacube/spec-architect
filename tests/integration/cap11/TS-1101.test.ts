// C001-TC-1101 / C001-TS-1101 (C001-AC-1101.1, C001-REQ-1101): every path of the C001-IF-08 §1 tree
// exists, and plugin.json has name "architect", a semver version and a description. Paths written by
// later tasks (the READMEs by C001-T-062, the CI workflow by C001-T-064) are `todo` until then.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { PLUGIN } from "../plugin-files.ts";

const ROOT = repoRoot();
const PRESENT = [
  ".claude-plugin/marketplace.json",
  "plugins/architect/.claude-plugin/plugin.json",
  "plugins/architect/hooks/hooks.json",
  "plugins/architect/.mcp.json",
  "plugins/architect/serena/architect-read-only.yml",
  "plugins/architect/scripts/sdd.mjs",
  "plugins/architect/templates/full",
  "plugins/architect/templates/lite",
  "plugins/architect/LICENSE",
  "plugins/architect/THIRD_PARTY_NOTICES.md",
  "src",
  "tests",
  "evals",
  "bench",
  "package.json",
  "LICENSE",
  ".sdd",
];
const LATER: [string, string][] = [
  ["plugins/architect/README.md", "C001-T-062"],
  ["README.md", "C001-T-062"],
  [".github/workflows/check.yml", "C001-T-064"],
];

for (const p of PRESENT) test(`${p} exists`, () => assert.ok(existsSync(join(ROOT, p)), p));
for (const [p, task] of LATER) test(`${p} exists`, { todo: existsSync(join(ROOT, p)) ? false : `written by ${task}` }, () => assert.ok(existsSync(join(ROOT, p)), p));

test("agents, skills and commands are in place", () => {
  assert.equal(readdirSync(join(PLUGIN, "agents")).filter((n) => /^sdd-.+\.md$/.test(n)).length, 10);
  const skills = readdirSync(join(PLUGIN, "skills"));
  assert.ok(skills.length > 0);
  for (const s of skills) assert.ok(existsSync(join(PLUGIN, "skills", s, "SKILL.md")), `${s}/SKILL.md`);
  assert.ok(readdirSync(join(PLUGIN, "commands")).some((n) => n.endsWith(".md")));
});

test('plugin.json has name "architect", a semver version and a description', () => {
  const m = JSON.parse(readFileSync(join(PLUGIN, ".claude-plugin", "plugin.json"), "utf8")) as Record<string, unknown>;
  assert.equal(m["name"], "architect");
  assert.match(String(m["version"]), /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/);
  assert.ok(typeof m["description"] === "string" && m["description"].length > 0);
});

test("the marketplace lists architect by relative path (C001-REQ-1102)", () => {
  const m = JSON.parse(readFileSync(join(ROOT, ".claude-plugin", "marketplace.json"), "utf8")) as { plugins: { name: string; source: string }[] };
  const entry = m.plugins.find((p) => p.name === "architect");
  assert.equal(entry?.source, "./plugins/architect");
});
