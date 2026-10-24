// C001-TC-1132 / C001-TS-1126 (C001-AC-1124.1, C001-REQ-1124; D-019 item 2): a plugin file named in an
// agent, command or skill body is PLG-TMPL-001 with file and line (C001-IF-08 §3 and §4). One plugin copy per
// Examples row of the C001-TS-1126 outline; each copy differs from the shipped plugin only by the row's
// addition, so a row with no findings also shows that the shipped bodies have none.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pluginCopy } from "./structure.ts";

type Finding = { path: string; line: number; severity: string };

/** Appends `line` to `file` of the copy; returns the line number it got. */
function appendLine(plugin: string, file: string, line: string): number {
  const p = join(plugin, ...file.split("/"));
  let before = readFileSync(p, "utf8");
  if (!before.endsWith("\n")) before += "\n";
  writeFileSync(p, `${before}${line}\n`);
  return before.split("\n").length;
}

const ROWS: { construct: string; file: string; line: string; reported: boolean }[] = [
  { construct: "template path under the plugin root", file: "agents/sdd-spec-writer.md", line: "Read `${CLAUDE_PLUGIN_ROOT}/templates/lite/10-spec/spec.md` before drafting.", reported: true },
  { construct: "other plugin-root path", file: "skills/phase-spec/SKILL.md", line: "Read `${CLAUDE_PLUGIN_ROOT}/skills/sdd-conventions/SKILL.md` first.", reported: true },
  { construct: "references/ path", file: "skills/interview-protocol/SKILL.md", line: "Validate the block against `references/questions.schema.json`.", reported: true },
  { construct: "relative link into the plugin", file: "commands/specify.md", line: "See [the conventions](../skills/sdd-conventions/SKILL.md).", reported: true },
  { construct: "the CLI path only", file: "agents/sdd-spec-writer.md", line: "Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs lint 001`.", reported: false },
  { construct: "template through the CLI", file: "agents/sdd-spec-writer.md", line: "Run `sdd template show lite/10-spec/spec.md` before drafting.", reported: false },
];

for (const row of ROWS) {
  test(`C001-TC-1132 (C001-TS-1126): plugin file named in a body: ${row.construct}`, () => {
    const p = pluginCopy();
    try {
      const n = appendLine(p.plugin, row.file, row.line);
      const f = p.findings("PLG-TMPL-001") as Finding[];
      assert.deepEqual(
        f.map((x) => `${x.severity} ${x.path}:${x.line}`),
        row.reported ? [`error plugins/architect/${row.file}:${n}`] : [],
      );
    } finally {
      p.cleanup();
    }
  });
}

test("C001-TC-1132 (C001-TS-1126): plugin file named in a body: hooks.json is not a body", () => {
  const p = pluginCopy();
  try {
    const file = join(p.plugin, "hooks", "hooks.json");
    const hooks = JSON.parse(readFileSync(file, "utf8")) as { hooks: Record<string, unknown[]> };
    hooks.hooks["SessionStart"]!.push({ hooks: [{ type: "command", command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" hook session-start "${CLAUDE_PLUGIN_ROOT}/templates"' }] });
    writeFileSync(file, JSON.stringify(hooks, null, 2) + "\n");
    assert.deepEqual(p.findings("PLG-TMPL-001"), []);
  } finally {
    p.cleanup();
  }
});
