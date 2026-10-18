// C002-T-026 — the frontmatter translator (C002-IF-001 §3 step 4; C002-COMP-001) on the real source
// plugin, on fx-src (a copy of it on disk) and on inline fixture agents, with the real mapping tables and
// the fixture tables fx-tables (one per mode of each target). Expected values are read from the tables,
// never from a copy (C002-CAP-01 acceptance, verification note).
//   C002-TC-109 (C002-TS-109)  model tier per generated agent
//   C002-TC-110 (C002-TS-110)  model value outside the three tiers (generator run on fx-src)
//   C002-TC-111 (C002-TS-111)  no memory field on any generated agent
//   C002-TC-112 (C002-TS-112)  agent-start grants per target
//   C002-TC-114 (C002-TS-114)  least-privilege grants per agent
//   C002-TC-129 (C002-TS-129)  server profiles per agent under sdd MCP server enforcement
//   C002-TC-130 (C002-TS-130)  command tool granted to an agent without Bash (the TGT-TOOLS-001 grant
//                              comparison; its check wrapper and C002-TC-640 are C002-T-035's)
// Carried: C002-TC-113 (eval, evals/targets/generator/TS-113.eval.mjs) to C002-T-056; C002-TC-133
// (tests/replay/scenarios/opencode-host.test.ts) to C002-T-042.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { main } from "../../../scripts/generate/main.ts";
import type { SourceDoc, SourcePlugin } from "../../../scripts/generate/model.ts";
import { readSource } from "../../../scripts/generate/reader.ts";
import { loadTable, loadTargetTable, TARGETS, toolGrants, type MappingTable, type Mode, type Target } from "../../../scripts/generate/tables.ts";
import {
  agentFilePath,
  CONDUCTOR,
  grantFindings,
  splitToolsField,
  translateAgent,
  translateAgents,
  type AgentFrontmatter,
} from "../../../scripts/generate/translate/frontmatter.ts";
import { repoRoot } from "../../helpers.ts";

const root = repoRoot();
const PLUGIN = join(root, "plugins", "architect");
const FIXTURES = join(root, "tests", "fixtures", "targets");
const source = readSource(PLUGIN);
assert.deepEqual(source.diagnostics, [], "the source plugin reads without diagnostics");
const tables = Object.fromEntries(TARGETS.map((t) => [t, loadTargetTable(root, t)])) as Record<Target, MappingTable>;
/** fx-tables: one table per mode of each target. */
const MODES: Record<Target, Mode[]> = { opencode: ["native-permissions", "sdd-mcp-server"], copilot: ["sdd-mcp-server", "copilot-hooks"] };
const fxTable = (t: Target, m: Mode) => loadTable(join(FIXTURES, `${t}-${m}.json`), `${t}-${m}.json`);

/** Every agent of `plugin` translated for one target and mode; fails on any diagnostic. */
function agentsOf(t: Target, mode: Mode, table: MappingTable = mode === tables[t].enforcement_mode ? tables[t] : fxTable(t, mode), plugin: SourcePlugin = source.source): Map<string, AgentFrontmatter> {
  const r = translateAgents({ source: plugin, table, target: t, mode });
  assert.deepEqual(r.diagnostics, [], `${t}/${mode}: no diagnostics`);
  assert.equal(r.agents.length, plugin.agents.length);
  return new Map(r.agents.map((a) => [a.frontmatter.name, a.frontmatter]));
}

const sourceAgent = (name: string) => source.source.agents.find((a) => a.name === name)!;
const sourceTools = (name: string) => splitToolsField(sourceAgent(name).data?.["tools"]);
const SPECIALISTS = source.source.agents.map((a) => a.name).filter((n) => n !== CONDUCTOR).sort();

/**
 * The grants the table derives from a source tools field, written independently of the translator:
 * tool entries per mode (the conductor's Write/Edit/Bash by the sdd-mcp-server entry under copilot-hooks,
 * C002-REQ-321), MCP names by grant pattern, Agent(...) by agent_start.tools.
 */
function derive(table: MappingTable, mode: Mode, agent: string): string[] {
  const out = new Set<string>();
  for (const name of sourceTools(agent)) {
    if (name.startsWith("Agent(")) for (const x of table.agent_start.tools ?? []) out.add(x);
    else if (name.startsWith("mcp__plugin_architect_")) {
      const [server, tool] = name.slice("mcp__plugin_architect_".length).split("__") as [string, string];
      const m = table.mcp_tool_names;
      out.add((m.grant_pattern ?? m.target_pattern).replace("{server}", server).replace("{tool}", m.grant === "per-server" ? "*" : tool));
    } else {
      const own = mode === "copilot-hooks" && agent === CONDUCTOR && ["Write", "Edit", "Bash"].includes(name) ? "sdd-mcp-server" : mode;
      for (const x of toolGrants(table.tools[name]!, own)!) out.add(x);
    }
  }
  return [...out].sort();
}

/** An in-memory source agent from its file text (inline fixtures). */
function docOf(name: string, text: string): SourceDoc {
  const s = splitFrontmatter(text);
  return { path: `agents/${name}.md`, text, name, data: s.data, lines: s.lines, bodyStartLine: s.bodyStartLine };
}
const ctx = (t: Target, mode: Mode = tables[t].enforcement_mode) => ({ table: mode === tables[t].enforcement_mode ? tables[t] : fxTable(t, mode), target: t, mode, agentNames: source.source.agents.map((a) => a.name) });

// --- C002-TC-109 ---
for (const [agent, tier, target] of [
  ["sdd-conductor", "opus", "opencode"],
  ["sdd-researcher", "sonnet", "opencode"],
  ["sdd-auditor", "haiku", "opencode"],
  ["sdd-conductor", "opus", "copilot"],
  ["sdd-researcher", "sonnet", "copilot"],
  ["sdd-auditor", "haiku", "copilot"],
] as const) {
  test(`C002-TC-109 (C002-TS-109): ${agent} (model: ${tier}) gets the ${target} model of the tier`, () => {
    assert.equal(sourceAgent(agent).data?.["model"], tier, "source tier");
    for (const mode of MODES[target]) {
      const table = mode === tables[target].enforcement_mode ? tables[target] : fxTable(target, mode);
      const a = agentsOf(target, mode, table).get(agent)!;
      assert.equal(a.tier, tier);
      assert.equal(a.model, table.models[tier], `${target}/${mode}`);
    }
  });
}

// --- C002-TC-110 ---
test('C002-TC-110 (C002-TS-110): "model: inherit" on line 4 of sdd-auditor stops the run, naming file, line, value and each target', () => {
  const base = mkdtempSync(join(tmpdir(), "sdd-fm-"));
  try {
    const src = join(base, "src", "plugins", "architect");
    cpSync(PLUGIN, src, { recursive: true });
    const file = join(src, "agents", "sdd-auditor.md");
    const lines = readFileSync(file, "utf8").replace(/\r\n/g, "\n").split("\n");
    assert.equal(lines[3], "model: haiku", "line 4 holds the model");
    lines[3] = "model: inherit";
    writeFileSync(file, lines.join("\n"));
    const stdout: string[] = [];
    const stderr: string[] = [];
    const code = main(["--source", src, "--out", join(base, "out")], { cwd: root, stdout: (l) => stdout.push(l), stderr: (l) => stderr.push(l) });
    assert.equal(code, 1);
    assert.deepEqual(stderr, [
      'ERR-GEN-003: agents/sdd-auditor.md:4: model "inherit" is not a Claude model tier (opus, sonnet, haiku); targets: copilot, opencode. Fix: Set one of the three tiers in the source agent',
    ]);
    for (const t of TARGETS) assert.ok(stdout.includes(`${t}: not written (0 errors)`), stdout.join("\n"));
    for (const t of TARGETS) assert.ok(!existsSync(join(base, "out", t)), `no ${t} package written`);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

// --- C002-TC-111 ---
test("C002-TC-111 (C002-TS-111): agents with memory in the source have no memory field on either target", () => {
  for (const n of ["sdd-researcher", "sdd-cartographer"]) assert.equal(sourceAgent(n).data?.["memory"], "project", `${n} has memory: project`);
  for (const t of TARGETS)
    for (const mode of MODES[t])
      for (const [name, a] of agentsOf(t, mode)) {
        assert.ok(!("memory" in a) && !("memory" in a.fields), `${t}/${mode}: ${name} has no memory field`);
        for (const v of Object.values(a.fields)) assert.notEqual(v, "project", `${t}/${mode}: ${name}: no field carries the memory value`);
      }
});

// --- C002-TC-112 ---
for (const t of TARGETS) {
  test(`C002-TC-112 (C002-TS-112): on ${t} only the conductor may start agents, exactly the nine specialists`, () => {
    assert.equal(SPECIALISTS.length, 9);
    for (const mode of MODES[t]) {
      const agents = agentsOf(t, mode);
      const startTools = tables[t].agent_start.tools ?? [];
      const conductor = agents.get(CONDUCTOR)!;
      assert.equal(conductor.role, "primary");
      if (t === "opencode") {
        assert.equal(tables[t].agent_start.style, "permission-task");
        assert.equal(conductor.agentStart.style, "permission-task");
        const task = (conductor.agentStart as { task: Record<string, string> }).task;
        assert.equal(Object.keys(task)[0], "*", "the catch-all comes first");
        assert.deepEqual(task, { "*": "deny", ...Object.fromEntries(SPECIALISTS.map((s) => [s, "allow"])) });
      } else {
        assert.equal(conductor.agentStart.style, "agents-list");
        assert.deepEqual([...(conductor.agentStart as { agents: string[] }).agents].sort(), SPECIALISTS);
      }
      for (const x of startTools) assert.ok(conductor.tools.includes(x), `conductor has ${x}`);
      for (const s of SPECIALISTS) {
        const a = agents.get(s)!;
        assert.equal(a.role, "subagent");
        assert.deepEqual(a.agentStart, t === "opencode" ? { style: "permission-task", task: "deny" } : { style: "agents-list", agents: [] }, `${t}/${mode}: ${s}`);
        for (const x of startTools) assert.ok(!a.tools.includes(x), `${t}/${mode}: ${s} has no ${x}`);
        assert.deepEqual(a.fields, { ...(tables[t].agent_fields.subagent_flags ?? {}) }, `${s}: subagent flags only (effort and color dropped)`);
      }
      assert.deepEqual(conductor.fields, { ...(tables[t].agent_fields.primary_flags ?? {}) });
    }
  });
}

test("C002-TS-112: a specialist with an Agent(...) grant, or a start list naming a non-specialist, is ERR-GEN-001", () => {
  const critic = docOf("sdd-critic", "---\nname: sdd-critic\ndescription: x\nmodel: opus\ntools: Read, Agent(architect:sdd-auditor)\n---\nbody\n");
  for (const t of TARGETS) {
    const r = translateAgent(critic, ctx(t));
    assert.equal(r.agent, undefined);
    assert.deepEqual(r.diagnostics.map((d) => [d.code, d.file, d.line, d.target]), [["ERR-GEN-001", "agents/sdd-critic.md", 5, t]]);
    assert.match(r.diagnostics[0]!.message, /agent-start grant "Agent\(architect:sdd-auditor\)" is allowed to sdd-conductor only/);
  }
  const conductor = docOf(CONDUCTOR, "---\nname: sdd-conductor\ndescription: x\nmodel: opus\ntools: Agent(architect:sdd-critic, architect:general-purpose), Read\n---\nbody\n");
  const r = translateAgent(conductor, ctx("opencode"));
  assert.deepEqual(r.diagnostics.map((d) => d.construct), ["general-purpose"]);
});

// --- C002-TC-114 ---
const NO_TOOL: Record<string, { lacks: string; host: Record<Target, (tool: string) => boolean> }> = {
  "sdd-researcher": { lacks: "Bash", host: { opencode: (x) => x === "bash" || x.startsWith("sdd-shell"), copilot: (x) => x === "execute" || x.startsWith("sdd-shell") } },
  "sdd-critic": { lacks: "AskUserQuestion", host: { opencode: (x) => x === "question", copilot: (x) => x === "ask_user" } },
  "sdd-auditor": { lacks: "mcp__plugin_architect_", host: { opencode: (x) => /^(serena|context7|deepwiki)[_/-]/.test(x), copilot: (x) => /^(serena|context7|deepwiki)[_/-]/.test(x) } },
};
for (const [agent, row] of Object.entries(NO_TOOL)) {
  for (const t of TARGETS) {
    test(`C002-TC-114 (C002-TS-114): ${agent} (no ${row.lacks}) on ${t} is granted exactly the derived tools`, () => {
      assert.ok(!sourceTools(agent).some((n) => n.startsWith(row.lacks)), `source ${agent} lacks ${row.lacks}`);
      for (const mode of MODES[t]) {
        const table = mode === tables[t].enforcement_mode ? tables[t] : fxTable(t, mode);
        const a = agentsOf(t, mode, table).get(agent)!;
        assert.deepEqual([...a.tools].sort(), derive(table, mode, agent), `${t}/${mode}: exactly the derived tools`);
        assert.deepEqual(a.tools.filter(row.host[t]), [], `${t}/${mode}: no such host tool`);
        assert.equal(a.asks, false);
      }
    });
  }
}

test("C002-TS-114: every agent of both targets in every mode is granted exactly the derived tools; only the conductor has a question tool", () => {
  for (const t of TARGETS)
    for (const mode of MODES[t]) {
      const table = mode === tables[t].enforcement_mode ? tables[t] : fxTable(t, mode);
      const question = table.tools["AskUserQuestion"] as string[];
      for (const [name, a] of agentsOf(t, mode, table)) {
        assert.deepEqual([...a.tools].sort(), derive(table, mode, name), `${t}/${mode}: ${name}`);
        assert.equal(a.asks, name === CONDUCTOR);
        for (const q of question) assert.equal(a.tools.includes(q), name === CONDUCTOR, `${t}/${mode}: ${name}: ${q}`);
      }
    }
  // Copilot: the cartographer's Serena tools are one per-server grant; OpenCode grants them per tool.
  assert.deepEqual(agentsOf("copilot", "sdd-mcp-server").get("sdd-cartographer")!.tools.filter((x) => x.startsWith("serena")), ["serena/*"]);
  assert.ok(agentsOf("opencode", "sdd-mcp-server").get("sdd-cartographer")!.tools.includes("serena_find_symbol"));
});

test("C002-TS-114: an unmapped tool, MCP server or frontmatter field is ERR-GEN-001 with file, line and target", () => {
  // fx-tables gap fixture: OpenCode without an LSP entry; the cartographer lists LSP on line 8.
  const gap = loadTable(join(FIXTURES, "opencode-gap-no-lsp.json"));
  const r = translateAgents({ source: source.source, table: gap, target: "opencode", mode: "sdd-mcp-server" });
  assert.deepEqual(r.diagnostics.map((d) => [d.code, d.file, d.line, d.target, d.construct]), [["ERR-GEN-001", "agents/sdd-cartographer.md", 8, "opencode", "LSP"]]);
  assert.equal(r.diagnostics[0]!.message, 'agents/sdd-cartographer.md:8: tool name "LSP" has no entry in the opencode mapping table');
  assert.ok(!r.agents.some((a) => a.frontmatter.name === "sdd-cartographer"));

  const planted = docOf("sdd-critic", "---\nname: sdd-critic\ndescription: x\nmodel: opus\ntools:\n  - Read\n  - KillShell\n  - mcp__plugin_architect_fxfs__write_file\nhooks: x\n---\nbody\n");
  for (const t of TARGETS) {
    const d = translateAgent(planted, ctx(t)).diagnostics;
    assert.deepEqual(
      d.map((x) => [x.line, x.construct]),
      [
        [9, "hooks"],
        [7, "KillShell"],
        [8, "mcp__plugin_architect_fxfs__write_file"],
      ],
      t,
    );
    assert.ok(d.every((x) => x.code === "ERR-GEN-001" && x.target === t));
  }
});

// --- C002-TC-129 ---
for (const [agent, sourceSet, target, profiles] of [
  ["sdd-conductor", ["Write", "Edit", "Bash"], "opencode", ["sdd-files", "sdd-shell"]],
  ["sdd-conductor", ["Write", "Edit", "Bash"], "copilot", ["sdd-files", "sdd-shell"]],
  ["sdd-auditor", ["Write", "Bash"], "copilot", ["sdd-files", "sdd-shell"]],
  ["sdd-researcher", ["Write"], "opencode", ["sdd-files"]],
  ["sdd-researcher", ["Write"], "copilot", ["sdd-files"]],
  ["sdd-options-analyst", ["Write"], "copilot", ["sdd-files"]],
] as const) {
  test(`C002-TC-129 (C002-TS-129): ${agent} (${sourceSet.join(", ")}) on ${target} with --mode ${target}=sdd-mcp-server gets exactly ${profiles.join(" and ")}`, () => {
    assert.deepEqual(sourceTools(agent).filter((n) => ["Write", "Edit", "Bash"].includes(n)).sort(), [...sourceSet].sort());
    const table = fxTable(target, "sdd-mcp-server");
    const a = agentsOf(target, "sdd-mcp-server", table).get(agent)!;
    const prefixes = [...new Set(a.tools.filter((x) => x.startsWith("sdd-")).map((x) => /^(sdd-files|sdd-shell)/.exec(x)?.[1] ?? x))].sort();
    assert.deepEqual(prefixes, [...profiles]);
    const expected = sourceSet.flatMap((n) => toolGrants(table.tools[n]!, "sdd-mcp-server")!);
    assert.deepEqual(a.tools.filter((x) => x.startsWith("sdd-")).sort(), [...new Set(expected)].sort(), "the table's server-profile grants");
    const generic = new Set(["Write", "Edit", "Bash"].flatMap((n) => MODES[target].filter((m) => m !== "sdd-mcp-server").flatMap((m) => toolGrants(table.tools[n]!, m) ?? [])));
    assert.ok(generic.size > 0);
    assert.deepEqual(a.tools.filter((x) => generic.has(x)), [], "no generic edit or terminal tool");
  });
}

test("C002-REQ-321: under the Copilot hooks fallback the conductor keeps the server profiles; specialists get the generic tools", () => {
  const table = fxTable("copilot", "copilot-hooks");
  const agents = agentsOf("copilot", "copilot-hooks", table);
  const c = agents.get(CONDUCTOR)!;
  assert.ok(c.tools.includes("sdd-files/*") && c.tools.includes("sdd-shell/*"));
  assert.ok(!c.tools.includes("edit") && !c.tools.includes("execute"));
  const sw = agents.get("sdd-spec-writer")!;
  assert.ok(sw.tools.includes("edit") && sw.tools.includes("execute"));
  assert.ok(!sw.tools.some((x) => x.startsWith("sdd-")));
});

// --- C002-TC-130 ---
test('C002-TC-130 (C002-TS-130): "sdd-shell/*" planted in sdd-researcher.agent.md is a TGT-TOOLS-001 finding naming the file and the tool', () => {
  const table = fxTable("copilot", "sdd-mcp-server");
  const researcher = agentsOf("copilot", "sdd-mcp-server", table).get("sdd-researcher")!;
  assert.ok(!researcher.tools.includes("sdd-shell/*"), "the generator grants no command tool to an agent without Bash");
  const file = agentFilePath(table, "sdd-researcher");
  assert.equal(file, "agents/sdd-researcher.agent.md");
  assert.deepEqual(grantFindings(researcher, researcher.tools, file), [], "the generated grants pass");
  const findings = grantFindings(researcher, [...researcher.tools, "sdd-shell/*"], file);
  assert.equal(findings.length, 1);
  const f = findings[0]!;
  assert.deepEqual([f.code, f.file, f.tool, f.kind], ["TGT-TOOLS-001", "agents/sdd-researcher.agent.md", "sdd-shell/*", "granted"]);
  assert.ok(f.message.includes("sdd-researcher.agent.md") && f.message.includes("sdd-shell/*"));
  // A missing derived tool is a finding too.
  assert.deepEqual(grantFindings(researcher, researcher.tools.filter((x) => x !== "read"), file).map((x) => [x.tool, x.kind]), [["read", "missing"]]);
});

test("effort and color follow agent_fields: dropped, or mapped by a value table (unknown value is ERR-GEN-001)", () => {
  const table = JSON.parse(JSON.stringify(tables.opencode)) as MappingTable;
  table.agent_fields.color = { field: "color", values: { red: "#ff0000" } };
  const c = { table, target: "opencode" as const, mode: "sdd-mcp-server" as const, agentNames: source.source.agents.map((a) => a.name) };
  const critic = translateAgent(sourceAgent("sdd-critic"), c);
  assert.deepEqual(critic.diagnostics, []);
  assert.equal(critic.agent!.frontmatter.fields["color"], "#ff0000");
  assert.ok(!("effort" in critic.agent!.frontmatter.fields));
  const planner = translateAgent(sourceAgent("sdd-planner"), c);
  assert.deepEqual(planner.diagnostics.map((d) => [d.code, d.line, d.construct]), [["ERR-GEN-001", 6, "pink"]]);
});
