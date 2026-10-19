// C002-T-027 — the body-construct translator (C002-IF-001 §2, §3 steps 6 and 8; C002-COMP-001) on the real
// source plugin, on fx-src (a copy of it on disk, with planted constructs or table gaps) and with the real
// mapping tables and the fixture tables fx-tables. Expected values are read from the tables, never from a
// copy (C002-CAP-01 acceptance, verification note).
//   C002-TC-106 (C002-TS-106)  construct translation per target (MCP tool name of the cartographer)
//   C002-TC-107 (C002-TS-107)  every construct kind of the source plugin is translated
//   C002-TC-108 (C002-TS-108)  tool without a Copilot mapping entry (generator run on fx-src)
//   C002-TC-127 (C002-TS-127)  template references per target
//   C002-TC-128 (C002-TS-128)  Serena configuration call in generated commands
//   C002-TC-131 (C002-TS-131)  question tool named in generated bodies
//   C002-TC-134 (C002-TS-134)  Copilot MCP tool names in bodies (the source file's clause)
// Carried: C002-TC-132 (eval, evals/targets/generator/TS-132.eval.mjs) to C002-T-056. The CLI invocation
// row of C002-TC-107 (a wiring anchor) is checked here on its variant; the inlined-body clause of
// C002-TC-134 is in wiring.test.ts (C002-T-028).
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "../../../scripts/generate/main.ts";
import { readSource } from "../../../scripts/generate/reader.ts";
import { loadTable, loadTargetTable, TARGETS, toolGrants, type Construct, type MappingTable, type Mode, type Target } from "../../../scripts/generate/tables.ts";
import { scanText, translateBodies, type TranslatedDoc } from "../../../scripts/generate/translate/constructs.ts";
import { mcpGrant, splitToolsField, translateAgents, type AgentFrontmatter } from "../../../scripts/generate/translate/frontmatter.ts";
import { repoRoot } from "../../helpers.ts";

const root = repoRoot();
const PLUGIN = join(root, "plugins", "architect");
const FIXTURES = join(root, "tests", "fixtures", "targets");
const source = readSource(PLUGIN);
assert.deepEqual(source.diagnostics, [], "the source plugin reads without diagnostics");
const tables = Object.fromEntries(TARGETS.map((t) => [t, loadTargetTable(root, t)])) as Record<Target, MappingTable>;
const MODES: Record<Target, Mode[]> = { opencode: ["native-permissions", "sdd-mcp-server"], copilot: ["sdd-mcp-server", "copilot-hooks"] };
/** The table of a mode; a fixture mode table takes the real table's wiring variants (C002-T-028). */
const tableFor = (t: Target, m: Mode): MappingTable =>
  m === tables[t].enforcement_mode ? tables[t] : { ...loadTable(join(FIXTURES, `${t}-${m}.json`), `${t}-${m}.json`), variants: tables[t].variants };
const NAME: Record<Target, string> = { opencode: "OpenCode", copilot: "Copilot" };

/** Every translated doc of the real plugin for one target and mode, by source path; fails on any diagnostic. */
function docsOf(t: Target, mode: Mode = tables[t].enforcement_mode): Map<string, TranslatedDoc> {
  const r = translateBodies({ source: source.source, table: tableFor(t, mode), target: t, mode });
  assert.deepEqual(r.diagnostics, [], `${t}/${mode}: no diagnostics`);
  return new Map(r.docs.map((d) => [d.path, d]));
}
function agentsOf(t: Target, mode: Mode = tables[t].enforcement_mode): Map<string, AgentFrontmatter> {
  const r = translateAgents({ source: source.source, table: tableFor(t, mode), target: t, mode });
  assert.deepEqual(r.diagnostics, [], `${t}/${mode}: no frontmatter diagnostics`);
  return new Map(r.agents.map((a) => [a.frontmatter.name, a.frontmatter]));
}

/** The generated text of one doc: translated frontmatter fields and body. */
const textOf = (d: TranslatedDoc) => [...Object.values(d.fields), d.body].join("\n");
/** The generated line that comes from source line `n`; undefined when the line was dropped. */
function lineFrom(d: TranslatedDoc, n: number): string | undefined {
  const i = d.sourceLines.indexOf(n);
  return i < 0 ? undefined : d.body.split("\n")[i];
}
/** Every generated line that comes from source line `n` (a wiring variant replaces its anchor from the anchor's first line). */
const linesFrom = (d: TranslatedDoc, n: number) => d.body.split("\n").filter((_, i) => d.sourceLines[i] === n).join("\n");
const sourceLine = (path: string, n: number) => source.source.files.find((f) => f.path === path)!.text.split("\n")[n - 1]!;
const construct = (table: MappingTable, id: string): Construct => {
  const c = table.constructs.find((x) => x.id === id);
  assert.ok(c, `${table.target}: construct ${id}`);
  return c;
};
/** The table's replacement text of a construct under a mode. */
function replaceOf(table: MappingTable, id: string, mode: Mode): string {
  const a = construct(table, id).action;
  assert.ok("replace" in a, `${id} is a replace construct`);
  const r = typeof a.replace === "string" ? a.replace : a.replace.by_mode[mode];
  assert.ok(r !== undefined, `${id} covers ${mode}`);
  return r;
}

/** fx-src: a copy of the source plugin with its mapping tables (C002-T-025 fixture). */
function fxSrc(base: string): string {
  const src = join(base, "src", "plugins", "architect");
  cpSync(PLUGIN, src, { recursive: true });
  return src;
}
function run(args: string[]) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = main(args, { cwd: root, stdout: (l) => stdout.push(l), stderr: (l) => stderr.push(l) });
  return { code, stdout, stderr };
}
const editJson = (path: string, f: (data: Record<string, unknown>) => void) => {
  const data = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  f(data);
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
};

// --- C002-TC-106 ---
for (const t of TARGETS) {
  test(`C002-TC-106 (C002-TS-106): the cartographer's mcp__plugin_architect_serena__find_symbol on ${NAME[t]}`, () => {
    const construct = "mcp__plugin_architect_serena__find_symbol";
    assert.ok(splitToolsField(source.source.agents.find((a) => a.name === "sdd-cartographer")!.data?.["tools"]).includes(construct));
    const translation = mcpGrant(tables[t], "serena", "find_symbol");
    assert.equal(translation, t === "opencode" ? "serena_find_symbol" : "serena/*", "the table's grant form (C002-IF-001 §2)");
    const fm = agentsOf(t).get("sdd-cartographer")!;
    assert.ok(fm.tools.includes(translation));
    assert.ok(!fm.tools.some((x) => x.includes(construct)));
    const doc = docsOf(t).get("agents/sdd-cartographer.md")!;
    assert.ok(!textOf(doc).includes(construct), "no source MCP name in the generated description or body");
  });
}

// --- C002-TC-107 ---
for (const t of TARGETS) {
  test(`C002-TC-107 (C002-TS-107): every construct kind of the source plugin is translated on ${NAME[t]}, in every mode`, () => {
    for (const mode of MODES[t]) {
      const table = tableFor(t, mode);
      const docs = docsOf(t, mode);
      const agents = agentsOf(t, mode);
      const at = (path: string, n: number) => {
        const l = lineFrom(docs.get(path)!, n);
        assert.ok(l !== undefined, `${path}:${n} is kept`);
        return l;
      };
      const where = `${t}/${mode}`;

      // tool name in agent tools — agents/sdd-spec-writer.md
      const sw = agents.get("sdd-spec-writer")!;
      for (const name of splitToolsField(source.source.agents.find((a) => a.name === "sdd-spec-writer")!.data?.["tools"]))
        if (!name.startsWith("mcp__")) for (const g of toolGrants(table.tools[name]!, mode)!) assert.ok(sw.tools.includes(g), `${where}: spec-writer ${name} → ${g}`);
      // model name — agents/sdd-auditor.md
      assert.equal(agents.get("sdd-auditor")!.model, table.models.haiku, where);
      // ${CLAUDE_PLUGIN_ROOT} — agents/sdd-spec-writer.md line 19 (template construct)
      assert.ok(sourceLine("agents/sdd-spec-writer.md", 19).includes("${CLAUDE_PLUGIN_ROOT}/templates/"));
      assert.ok(at("agents/sdd-spec-writer.md", 19).includes(`${replaceOf(table, "plugin-root-templates", mode)}<profile>/…`), where);
      // ${CLAUDE_PLUGIN_DATA} — commands/doctor.md line 8
      assert.ok(at("commands/doctor.md", 8).includes(`sdd serena-config ${replaceOf(table, "plugin-data", mode)}`), where);
      // $ARGUMENTS — commands/new.md line 8
      assert.ok(sourceLine("commands/new.md", 8).includes("$ARGUMENTS"));
      assert.ok(at("commands/new.md", 8).includes(replaceOf(table, "arguments", mode)), where);
      // architect: agent reference — agents/sdd-conductor.md line 46
      assert.ok(sourceLine("agents/sdd-conductor.md", 46).includes("`architect:sdd-researcher`"));
      assert.ok(at("agents/sdd-conductor.md", 46).includes(`\`${replaceOf(table, "agent-reference", mode)}sdd-researcher\``), where);
      // claude --agent guard line — commands/specify.md line 6 (drop_line)
      assert.ok("drop_line" in construct(table, "guard-line").action);
      assert.match(sourceLine("commands/specify.md", 6), /claude --agent/);
      assert.equal(lineFrom(docs.get("commands/specify.md")!, 6), undefined, `${where}: guard line dropped`);
      assert.ok(!docs.get("commands/specify.md")!.body.includes("claude --agent"), where);
      // AskUserQuestion — agents/sdd-conductor.md, commands/archive.md (C002-TC-131 holds the line checks)
      for (const p of ["agents/sdd-conductor.md", "commands/archive.md"]) assert.ok(!textOf(docs.get(p)!).includes("AskUserQuestion"), `${where}: ${p}`);
      // ${CLAUDE_PLUGIN_ROOT}/templates/ — commands/decide.md line 18
      assert.ok(at("commands/decide.md", 18).includes(replaceOf(table, "plugin-root-templates", mode)), where);
      // MCP tool name in a body — skills/research-protocol/SKILL.md lines 95–97, inside the wiring section of
      // line 93, which the target's variant replaces (C002-T-028); the variant names the tools in source form.
      const body = construct(table, "mcp-tool-name").action as { replace: string };
      const form = (s: string, tool: string) => body.replace.replace("{server}", s).replace("{tool}", tool);
      const research = linesFrom(docs.get("skills/research-protocol/SKILL.md")!, 93);
      assert.ok(research.includes(form("context7", "resolve-library-id")), where);
      assert.ok(research.includes(form("deepwiki", "ask_wiki_question")), where);
      // CLI invocation line — agents/sdd-auditor.md line 13 (a wiring anchor: the target's variant, C002-T-028)
      assert.ok(sourceLine("agents/sdd-auditor.md", 13).includes("${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"));
      assert.ok(at("agents/sdd-auditor.md", 13).includes("`sdd` is the bare `sdd` command"), where);
      assert.ok(!docs.get("agents/sdd-auditor.md")!.body.includes("scripts/sdd.mjs"), where);
      // ToolSearch in a body — agents/sdd-architect.md line 19
      assert.ok(sourceLine("agents/sdd-architect.md", 19).includes("ToolSearch"));
      assert.ok(at("agents/sdd-architect.md", 19).includes(replaceOf(table, "tool-search", mode)), where);

      // The leak scan of the generated texts reports no untranslated construct (C002-INV-12).
      for (const d of docs.values()) {
        assert.deepEqual(scanText(table, t, mode, d.path, d.body), [], `${where}: ${d.path} body`);
        for (const v of Object.values(d.fields)) assert.deepEqual(scanText(table, t, mode, d.path, v, "frontmatter"), [], `${where}: ${d.path} frontmatter`);
      }
    }
  });
}

test("C002-TS-107: the CLI invocation line is a wiring anchor — replaced by the variant pass, a leak where it is left", () => {
  for (const t of TARGETS) {
    const table = tables[t];
    assert.ok("variant_required" in construct(table, "cli-invocation").action);
    // Without the variant pass (the body-construct pass alone) the anchor is kept and not reported.
    const pending = translateBodies({ source: source.source, table, target: t, mode: table.enforcement_mode }, { variantAnchors: "pending" });
    assert.deepEqual(pending.diagnostics, []);
    const line = lineFrom(pending.docs.find((d) => d.path === "agents/sdd-auditor.md")!, 13)!;
    assert.ok(line.includes("${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"), "pending anchor kept unchanged");
    const leaks = scanText(table, t, table.enforcement_mode, "agents/sdd-auditor.md", line, "body");
    assert.deepEqual(leaks.map((d) => [d.code, d.target, d.construct]), [["ERR-GEN-001", t, "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"]]);
    assert.ok(!lineFrom(docsOf(t).get("agents/sdd-auditor.md")!, 13)!.includes("scripts/sdd.mjs"), "the variant replaces it");
  }
});

// --- C002-TC-108 ---
test('C002-TC-108 (C002-TS-108): "KillShell" on line 7 of sdd-critic, mapped for OpenCode only, stops the run naming copilot alone', () => {
  const base = mkdtempSync(join(tmpdir(), "sdd-cx-"));
  try {
    const src = fxSrc(base);
    const file = join(src, "agents", "sdd-critic.md");
    const lines = readFileSync(file, "utf8").replace(/\r\n/g, "\n").split("\n");
    assert.match(lines[6]!, /^tools: /, "line 7 holds the tools field");
    lines[6] += ", KillShell";
    writeFileSync(file, lines.join("\n"));
    editJson(join(src, "targets", "opencode.json"), (d) => ((d["tools"] as Record<string, unknown>)["KillShell"] = []));
    assert.ok(!("KillShell" in tables.copilot.tools));
    const r = run(["--source", src, "--out", join(base, "out")]);
    assert.equal(r.code, 1);
    assert.deepEqual(r.stderr, [
      'ERR-GEN-001: agents/sdd-critic.md:7: tool name "KillShell" has no entry in the copilot mapping table. Fix: Add the entry to `plugins/architect/targets/copilot.json`, or remove the construct from the source',
    ]);
    assert.ok(!r.stderr.join("\n").includes("opencode"));
    assert.deepEqual(r.stdout, ["copilot: not written (1 errors)", "opencode: not written (0 errors)"]);
    for (const t of TARGETS) assert.ok(!existsSync(join(base, "out", t)));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

// --- C002-TC-127 ---
for (const [file, line, sourcePath, target, command] of [
  ["commands/decide.md", 18, "${CLAUDE_PLUGIN_ROOT}/templates/full/00-ideation/decisions/DEC-{{SEQ}}-{{SLUG}}.md", "opencode", "sdd template show full/00-ideation/decisions/DEC-{{SEQ}}-{{SLUG}}.md"],
  ["commands/init.md", 25, "${CLAUDE_PLUGIN_ROOT}/templates/constitution/constitution.md", "copilot", "sdd template show constitution/constitution.md"],
  ["agents/sdd-spec-writer.md", 19, "${CLAUDE_PLUGIN_ROOT}/templates/<profile>/…", "opencode", "sdd template show <profile>/…"],
  ["agents/sdd-spec-writer.md", 19, "${CLAUDE_PLUGIN_ROOT}/templates/<profile>/…", "copilot", "sdd template show <profile>/…"],
] as const) {
  test(`C002-TC-127 (C002-TS-127): ${file}:${line} on ${NAME[target]} names "${command}"`, () => {
    assert.ok(sourceLine(file, line).includes(sourcePath), "source line names the template");
    assert.equal(replaceOf(tables[target], "plugin-root-templates", tables[target].enforcement_mode), "sdd template show ");
    for (const mode of MODES[target]) {
      const doc = docsOf(target, mode).get(file)!;
      assert.ok(lineFrom(doc, line)!.includes(command), `${target}/${mode}`);
      assert.ok(!textOf(doc).includes("${CLAUDE_PLUGIN_ROOT}"), `${target}/${mode}: no plugin root left`);
    }
  });
}

// --- C002-TC-128 ---
for (const [command, line, target] of [
  ["doctor", 8, "opencode"],
  ["doctor", 8, "copilot"],
  ["init", 9, "opencode"],
  ["init", 9, "copilot"],
] as const) {
  test(`C002-TC-128 (C002-TS-128): ${command} line ${line} on ${NAME[target]} runs "sdd serena-config --user-data"`, () => {
    const file = `commands/${command}.md`;
    assert.ok(sourceLine(file, line).includes('sdd serena-config "${CLAUDE_PLUGIN_DATA}"'));
    for (const mode of MODES[target]) {
      const doc = docsOf(target, mode).get(file)!;
      assert.ok(lineFrom(doc, line)!.includes("sdd serena-config --user-data"), `${target}/${mode}`);
      assert.ok(!textOf(doc).includes("CLAUDE_PLUGIN_DATA"), `${target}/${mode}`);
    }
  });
}

// --- C002-TC-131 ---
for (const [file, lines, target] of [
  ["agents/sdd-conductor.md", [61, 66], "opencode"],
  ["agents/sdd-conductor.md", [61, 66], "copilot"],
  ["commands/archive.md", [15], "opencode"],
  ["commands/archive.md", [15], "copilot"],
] as const) {
  test(`C002-TC-131 (C002-TS-131): ${file} line(s) ${lines.join(", ")} name the ${NAME[target]} question tool`, () => {
    for (const n of lines) assert.ok(sourceLine(file, n).includes("AskUserQuestion"), `${file}:${n}`);
    for (const mode of MODES[target]) {
      const table = tableFor(target, mode);
      const entry = replaceOf(table, "ask-user-question", mode);
      assert.ok(entry.includes(target === "opencode" ? "`question`" : "`ask_user`"), "the host question tool (S-07, S-08 F-5)");
      const doc = docsOf(target, mode).get(file)!;
      for (const n of lines) assert.ok(lineFrom(doc, n)!.includes(entry), `${target}/${mode}: ${file}:${n}`);
      assert.ok(!textOf(doc).includes("AskUserQuestion"), `${target}/${mode}`);
    }
    if (file === "agents/sdd-conductor.md") assert.ok(!agentsOf(target).get("sdd-conductor")!.tools.includes("AskUserQuestion"));
  });
}

// --- C002-TC-134 (the source file's clause; every inlining agent body: wiring.test.ts) ---
// The source line lies in the "Claude Code wiring" section (heading line `section`), which the Copilot
// variant replaces; the variant's MCP names are translated like any body line.
for (const [file, line, section, sourceName, call, grant] of [
  ["skills/research-protocol/SKILL.md", 96, 93, "mcp__plugin_architect_context7__query-docs", "context7-query-docs", "context7/query-docs"],
  ["skills/code-discovery/SKILL.md", 111, 109, "mcp__plugin_architect_serena__find_symbol", "serena-find_symbol", "serena/find_symbol"],
] as const) {
  test(`C002-TC-134 (C002-TS-134): ${file}:${line} names "${call}" on Copilot`, () => {
    assert.ok(sourceLine(file, line).includes(sourceName));
    for (const mode of MODES.copilot) {
      const table = tableFor("copilot", mode);
      assert.equal(table.mcp_tool_names.target_pattern, "{server}-{tool}");
      const l = linesFrom(docsOf("copilot", mode).get(file)!, section);
      assert.ok(l.includes(call), `copilot/${mode}: call form`);
      assert.ok(!l.includes(sourceName) && !l.includes(grant), `copilot/${mode}: neither the source nor the grant form`);
    }
  });
}

// --- Unmapped constructs (C002-REQ-104, step outline 2) ---
test("a planted unmapped body construct stops generation; every place is reported, sorted, and no package is written", () => {
  const base = mkdtempSync(join(tmpdir(), "sdd-cx-"));
  try {
    const src = fxSrc(base);
    // Copilot table without the ask-user-question construct: the glossary detector still finds each mention.
    editJson(join(src, "targets", "copilot.json"), (d) => {
      d["constructs"] = (d["constructs"] as { id: string }[]).filter((c) => c.id !== "ask-user-question");
    });
    // A body line naming an MCP server neither table declares (both targets).
    const critic = join(src, "agents", "sdd-critic.md");
    const text = readFileSync(critic, "utf8").replace(/\r\n/g, "\n");
    const lines = text.split("\n");
    lines.push("Write through `mcp__plugin_architect_fxfs__write_file`.");
    writeFileSync(critic, lines.join("\n"));
    const plantedLine = lines.length;
    const out = join(base, "out");
    const r = run(["--source", src, "--out", out]);
    assert.equal(r.code, 1);
    const expected = [
      ["agents/sdd-conductor.md", 61, "copilot"],
      ["agents/sdd-conductor.md", 66, "copilot"],
      ["agents/sdd-critic.md", plantedLine, "copilot"],
      ["agents/sdd-critic.md", plantedLine, "opencode"],
      ["commands/archive.md", 15, "copilot"],
      // interview-protocol lines 121 and 127 lie in its wiring section, which the Copilot variant replaces.
    ];
    assert.equal(r.stderr.length, expected.length, r.stderr.join("\n"));
    r.stderr.forEach((l, i) => {
      const [file, line, target] = expected[i]!;
      assert.ok(l.startsWith(`ERR-GEN-001: ${file}:${line}: `), l);
      assert.ok(l.includes(`Fix: Add the entry to \`plugins/architect/targets/${target}.json\``), l);
      assert.ok(l.includes(file === "agents/sdd-critic.md" ? 'MCP tool name "mcp__plugin_architect_fxfs__write_file"' : 'question tool name "AskUserQuestion" has no entry in the copilot mapping table'), l);
    });
    assert.deepEqual(r.stdout, ["copilot: not written (4 errors)", "opencode: not written (1 errors)"]);
    for (const t of TARGETS) assert.ok(!existsSync(join(out, t)), `no ${t} package`);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a replace entry without the run's mode, or a construct in a context it is not translated in, is ERR-GEN-001", () => {
  const table = JSON.parse(JSON.stringify(tables.opencode)) as MappingTable;
  const bash = table.constructs.find((c) => c.id === "bash-prose")!;
  bash.action = { replace: { by_mode: { "native-permissions": "the `bash` tool" } } };
  const r = translateBodies({ source: source.source, table, target: "opencode", mode: "sdd-mcp-server" });
  assert.ok(r.diagnostics.length > 0);
  assert.ok(r.diagnostics.every((d) => d.code === "ERR-GEN-001" && d.construct === "Bash" && d.message.endsWith("has no entry for mode sdd-mcp-server in the opencode mapping table")));
  assert.ok(r.diagnostics.some((d) => d.file === "agents/sdd-conductor.md" && d.line === 60));
  // AskUserQuestion is translated in bodies only: in a description it is a leak.
  const d = scanText(tables.copilot, "copilot", "sdd-mcp-server", "agents/x.md", "Asks through AskUserQuestion.", "frontmatter");
  assert.deepEqual(d.map((x) => [x.code, x.line, x.construct]), [["ERR-GEN-001", 1, "AskUserQuestion"]]);
});

test("descriptions are translated: agent and command references take the target's form", () => {
  for (const t of TARGETS) {
    const docs = docsOf(t);
    const conductor = docs.get("agents/sdd-conductor.md")!.fields["description"]!;
    // The way to start the conductor is the target's own (construct conductor-start, C002-T-037).
    assert.ok(conductor.includes(replaceOf(tables[t], "conductor-start", tables[t].enforcement_mode)), t);
    assert.ok(!conductor.includes("architect:") && !conductor.includes("claude --agent"), t);
    const researcher = docs.get("agents/sdd-researcher.md")!.fields["description"]!;
    assert.ok(researcher.includes(`${replaceOf(tables[t], "command-reference", tables[t].enforcement_mode)}research`), t);
  }
});

// --- C002-TC-657, C002-TC-658 (C002-T-063; the construct doctor-description, C002-IF-001 §2 "Frontmatter text") ---
const DOCTOR = "commands/doctor.md";
const CLAUDE_HOST_LIST = "(node, git, Claude Code, ripwire, Serena, ast-grep, Context7, DeepWiki)";

for (const t of TARGETS) {
  test(`C002-TS-657 (C002-TC-657): the generated doctor description names the ${NAME[t]} rows, read from the table, and not Claude Code`, () => {
    const src = source.source.commands.find((c) => c.path === DOCTOR)!;
    const before = (src.data as Record<string, string>)["description"]!;
    assert.ok(before.includes(CLAUDE_HOST_LIST), "the source description holds the Claude Code host list");
    for (const mode of MODES[t]) {
      const list = replaceOf(tableFor(t, mode), "doctor-description", mode);
      const generated = docsOf(t, mode).get(DOCTOR)!.fields["description"]!;
      assert.equal(generated, before.replace(CLAUDE_HOST_LIST, list), `${t}/${mode}: the host list replaced, the rest unchanged`);
      assert.ok(!generated.includes("Claude Code"), `${t}/${mode}: ${generated}`);
    }
  });
}

test("the source commands/doctor.md is byte-unchanged by C002-T-063 (C002-CON-10): its description still holds the Claude Code host list on line 2", () => {
  const lines = readFileSync(join(PLUGIN, DOCTOR), "utf8").replace(/\r\n/g, "\n").split("\n");
  assert.ok(lines[1]!.startsWith("description: ") && lines[1]!.includes(CLAUDE_HOST_LIST), lines[1]);
});

test("C002-TS-658 (C002-TC-658): fx-plugin-nodesc — a Copilot table without doctor-description stops generation with ERR-GEN-001 on commands/doctor.md line 2, copilot only", () => {
  const base = mkdtempSync(join(tmpdir(), "sdd-cx-"));
  try {
    const src = fxSrc(base);
    editJson(join(src, "targets", "copilot.json"), (d) => {
      d["constructs"] = (d["constructs"] as { id: string }[]).filter((c) => c.id !== "doctor-description");
    });
    assert.ok(tables.opencode.constructs.some((c) => c.id === "doctor-description"), "the OpenCode table keeps its entry");
    const out = join(base, "out");
    const r = run(["--source", src, "--out", out]);
    assert.notEqual(r.code, 0);
    const errs = r.stderr.filter((l) => l.startsWith("ERR-GEN-001"));
    assert.equal(errs.length, 1, r.stderr.join("\n"));
    assert.ok(errs[0]!.startsWith(`ERR-GEN-001: ${DOCTOR}:2: construct doctor-description "${CLAUDE_HOST_LIST}" has no entry in the copilot mapping table`), errs[0]);
    assert.ok(!r.stderr.some((l) => l.includes("opencode")), r.stderr.join("\n"));
    assert.ok(!existsSync(join(out, "copilot")), "no Copilot package, so no doctor prompt that names Claude Code");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
