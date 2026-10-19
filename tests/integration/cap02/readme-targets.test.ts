// C002-T-039 — the README sections of the generated targets (C002-COMP-017). Expected values come from
// the mapping tables and the emitters, never from a copy, so a table whose mode changes while the README
// does not fails here.
//   C002-TC-206 (C002-TS-206)  "OpenCode" section: link to the install notes, the table's enforcement mode
//   C002-TC-307 (C002-TS-307)  "Copilot VS Code" section: link to the install notes, the table's enforcement mode
//   C002-TC-315 (C002-TS-315)  hooks fallback warning: present under `copilot-hooks` only
// The link targets the install-notes source that the emitter turns into the package's INSTALL.md
// (INSTALL_SOURCE of scripts/generate/emit/<target>.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { INSTALL_SOURCE as COPILOT_NOTES } from "../../../scripts/generate/emit/copilot.ts";
import { INSTALL_SOURCE as OPENCODE_NOTES } from "../../../scripts/generate/emit/opencode.ts";
import { loadTargetTable, type Mode, type Target } from "../../../scripts/generate/tables.ts";
import { repoRoot } from "../../helpers.ts";

const PLUGIN = join(repoRoot(), "plugins", "architect");
const README = join(PLUGIN, "README.md");

/** Glossary names of the enforcement modes (glossary delta: "Enforcement mode" and its entries). */
const MODE_NAME: Record<Mode, string> = {
  "native-permissions": "native permission enforcement",
  "sdd-mcp-server": "sdd MCP server enforcement",
  "copilot-hooks": "Copilot hooks fallback",
};

const SECTIONS: { target: Target; heading: string; notes: string; ts: string; tc: string }[] = [
  { target: "opencode", heading: "OpenCode", notes: OPENCODE_NOTES, ts: "C002-TS-206", tc: "C002-TC-206" },
  { target: "copilot", heading: "Copilot VS Code", notes: COPILOT_NOTES, ts: "C002-TS-307", tc: "C002-TC-307" },
];

/** The lines of the README section headed `heading` (any level), up to the next heading of the same or a higher level. */
function section(text: string, heading: string): string | null {
  const lines = text.split(/\r?\n/);
  let fenced = false;
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const m = /^(#{1,6})\s+(.*?)\s*$/.exec(line);
    if (!m) continue;
    if (start < 0) {
      if (m[2] === heading) { start = i; level = m[1]!.length; }
    } else if (m[1]!.length <= level) return lines.slice(start, i).join("\n");
  }
  return start < 0 ? null : lines.slice(start).join("\n");
}

/** The text after "**Enforcement mode:**" up to the end of that list item. */
function modeLine(body: string): string {
  const m = /\*\*Enforcement mode:\*\*\s*([\s\S]*?)(?=\n- |\n\n|$)/.exec(body);
  return m ? m[1]!.replace(/\s+/g, " ").trim() : "";
}

/** C002-REQ-310: the hooks fallback warning and its three disabling sources. */
function warns(body: string): boolean {
  const flat = body.replace(/\s+/g, " ");
  return /write\/shell boundary is off whenever hooks are disabled/i.test(flat);
}

const text = readFileSync(README, "utf8");

for (const s of SECTIONS) {
  const table = loadTargetTable(repoRoot(), s.target);
  const mode = table.enforcement_mode;

  test(`${s.tc} (${s.ts}) [${mode}]: the "${s.heading}" section links the install notes of the ${s.target} target package`, () => {
    const body = section(text, s.heading);
    assert.ok(body, `README has a "${s.heading}" section`);
    const links = [...body.matchAll(/\]\(([^)\s#]+)(?:#[^)]*)?\)/g)].map((m) => m[1]!);
    const notes = links.filter((l) => relative(PLUGIN, resolve(dirname(README), l)).replace(/\\/g, "/") === s.notes);
    assert.equal(notes.length >= 1, true, `a link to ${s.notes} in ${JSON.stringify(links)}`);
    assert.ok(existsSync(join(PLUGIN, s.notes)), `${s.notes} exists`);
    const file = table.placement.install_notes ?? "INSTALL.md";
    assert.ok(body.includes(`\`${file}\``), `names the package's install-notes file ${file}`);
  });

  test(`${s.tc} (${s.ts}) [${mode}]: the "${s.heading}" section names the table's enforcement mode by its glossary name`, () => {
    const body = section(text, s.heading) ?? "";
    const line = modeLine(body);
    assert.ok(line.startsWith(MODE_NAME[mode]), `"Enforcement mode:" names ${MODE_NAME[mode]}: ${line}`);
    assert.ok(line.includes(`\`${mode}\``), `"Enforcement mode:" gives the table value \`${mode}\``);
    for (const other of Object.keys(MODE_NAME) as Mode[]) {
      if (other === mode) continue;
      assert.ok(!line.toLowerCase().includes(MODE_NAME[other].toLowerCase()), `no other mode named: ${MODE_NAME[other]}`);
      assert.ok(!line.includes(`\`${other}\``), `no other mode value: ${other}`);
    }
  });

  test(`${s.tc} (${s.ts}) [${mode}]: the "${s.heading}" section gives the tested host versions of the table`, () => {
    const body = section(text, s.heading) ?? "";
    for (const [host, version] of Object.entries(table.host.tested_versions))
      assert.ok(body.includes(`\`${version}\``), `${host} ${version}`);
  });
}

const copilot = loadTargetTable(repoRoot(), "copilot");

test(`C002-TC-315 (C002-TS-315) [${copilot.enforcement_mode}]: the hooks fallback warning is in the "Copilot VS Code" section under copilot-hooks only`, () => {
  const body = section(text, "Copilot VS Code") ?? "";
  const expected = copilot.enforcement_mode === "copilot-hooks";
  assert.equal(warns(body), expected, expected ? "warning required under copilot-hooks" : "no hooks fallback warning outside copilot-hooks");
  if (expected) {
    const flat = body.replace(/\s+/g, " ");
    assert.match(flat, /`chat\.useHooks`/);
    assert.match(flat, /Workspace Trust/);
    assert.match(flat, /organi[sz]ation policy/i);
  }
  // The OpenCode section never carries it (C002-REQ-310 is the Copilot section's).
  assert.equal(warns(section(text, "OpenCode") ?? ""), false);
});

test("the section and warning detectors", () => {
  const sample = "## A\n\n### OpenCode\n\n- **Enforcement mode:** sdd MCP server enforcement (`sdd-mcp-server`). x\n- y\n\n### Copilot VS Code\n\nThe write/shell boundary is off\nwhenever hooks are disabled.\n\n## B\n";
  assert.equal(modeLine(section(sample, "OpenCode") ?? ""), "sdd MCP server enforcement (`sdd-mcp-server`). x");
  assert.equal(warns(section(sample, "Copilot VS Code") ?? ""), true);
  assert.equal(warns(section(sample, "OpenCode") ?? ""), false);
  assert.equal(section(sample, "B"), "## B\n");
  assert.equal(section(sample, "Missing"), null);
});
