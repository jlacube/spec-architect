// C002-T-033 — the hook side of the Copilot target package (C002-IF-005 §3, C002-IF-008 §2 and §4) on
// fx-dist: `dist/copilot/` generated into a temporary folder in both enforcement modes and read back
// from disk; fx-dist-bad plants one fault in a copy. Expected values come from the mapping table and the
// source plugin (C002-CAP-01 acceptance, verification note).
//   C002-TC-303 (C002-TS-303)  server mode: PreToolUse, SessionStart, SubagentStop only; one PreToolUse, the subagent guard hook; no other PreToolUse; no agent hooks
//   C002-TC-304 (C002-TS-304)  fx-dist-bad: PreToolUse added, changed or removed (TGT-HOOK-001)
//   C002-TC-311 (C002-TS-311)  hooks mode: one PreToolUse entry with --mode copilot-hooks; no agent hooks; the command runs the package's CLI copy with its classes file
//   C002-TC-325 (C002-TS-325)  every hook command is node "@CLI_COPY@" with arguments only
//   C002-TC-326 (C002-TS-326)  fx-dist-bad: "&& echo done" after the session-start command (TGT-HOOK-001)
//   C002-TC-330 (C002-TS-330)  hooks mode: every tool offered to a specialist has one class; Write, Bash, Glob, tool_search_tool, read servers
//   C002-TC-331 (C002-TS-331)  server mode: the same with the sdd-files and sdd-shell tools
//   C002-TC-332 (C002-TS-332)  fx-dist-bad: a tool removed from the classes file (TGT-CLASS-001)
//   C002-TC-355 (C002-TS-355)  fx-dist-bad: ${PLUGIN_ROOT} or ${CLAUDE_PLUGIN_ROOT} in the SubagentStop command (TGT-HOOK-001)
// Also the TC-301 clauses (install/hooks.template.json, hooks/tool-classes.json) and TC-302 rows carried
// from C002-T-031 (in package.test.ts). Carried: the TGT-PORT-001 findings of C002-TC-326 and
// C002-TC-355 and the wiring of TGT-HOOK-001 and TGT-CLASS-001 into `npm run check` to C002-T-035; the
// installed hooks.json and .github/hooks/architect-guard.json of C002-TC-311 to C002-T-058.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stringify } from "yaml";
import { AUTHOR_AGENTS, copilotHookFindings, copilotPackageFindings, emitCopilot, guardCommand, offeredHookTools, TOOL_CLASSES_FILE } from "../../../scripts/generate/emit/copilot.ts";
import { main } from "../../../scripts/generate/main.ts";
import { readSource } from "../../../scripts/generate/reader.ts";
import { loadTargetTable, TARGETS, toolGrants, type MappingTable, type Mode } from "../../../scripts/generate/tables.ts";
import { CONDUCTOR, translateAgents } from "../../../scripts/generate/translate/frontmatter.ts";
import { PROFILE_TOOLS } from "../../../src/mcp/schemas.ts";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { makeWorkspace } from "../cli/helpers.ts";
import { repoRoot } from "../../helpers.ts";

const root = repoRoot();
const PLUGIN = join(root, "plugins", "architect");
const source = readSource(PLUGIN).source;
const table: MappingTable = loadTargetTable(root, "copilot");
const peers = TARGETS.map((t) => loadTargetTable(root, t));
const MODES: Mode[] = ["sdd-mcp-server", "copilot-hooks"];
const HOOKS = table.placement["hooks_file"]!;
const AGENTS_DIR = table.placement["agents_dir"]!;
const CLI_COPY = table.placement["cli_copy"]!;
const emitInput = (mode: Mode) => ({ source, table, target: "copilot" as const, mode, peers });

// The ten Architect agents, the conductor first, then the specialists in the order of its Agent(…) grant.
const conductorSource = source.agents.find((a) => a.name === CONDUCTOR)!;
const startGrant = /Agent\(([^)]*)\)/.exec(String(conductorSource.data!["tools"]))![1]!;
const TEN = [CONDUCTOR, ...startGrant.split(",").map((s) => s.trim().replace(/^architect:/, ""))];
const specialists = TEN.slice(1);

/** Every file under `dir` (relative, `/`-separated) with its bytes. */
function readTree(dir: string): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  const walk = (abs: string, rel: string) => {
    for (const name of readdirSync(abs).sort()) {
      const p = join(abs, name);
      const r = rel === "" ? name : `${rel}/${name}`;
      if (statSync(p).isDirectory()) walk(p, r);
      else out.set(r, readFileSync(p));
    }
  };
  walk(dir, "");
  return out;
}

/** fx-dist: the package generated for `mode`, kept on disk for the command run; read back once. */
const built = new Map<Mode, { dir: string; files: Map<string, Buffer> }>();
const temps: string[] = [];
after(() => {
  for (const t of temps) rmSync(t, { recursive: true, force: true });
});
function fxDist(mode: Mode): { dir: string; files: Map<string, Buffer> } {
  const hit = built.get(mode);
  if (hit) return hit;
  const base = mkdtempSync(join(tmpdir(), "sdd-fx-dist-cph-"));
  temps.push(base);
  const err: string[] = [];
  const code = main(["--target", "copilot", "--mode", `copilot=${mode}`, "--out", join(base, "dist"), "--quiet"], { cwd: root, stdout: () => {}, stderr: (l) => err.push(l) });
  assert.equal(code, 0, err.join("\n"));
  const dir = join(base, "dist", "copilot");
  const r = { dir, files: readTree(dir) };
  built.set(mode, r);
  return r;
}

type Entry = { command: string; type: string };
const template = (files: Map<string, Buffer>) => JSON.parse(files.get(HOOKS)!.toString("utf8")) as { hooks: Record<string, Entry[]> };
const classesOf = (files: Map<string, Buffer>) =>
  JSON.parse(files.get(TOOL_CLASSES_FILE)!.toString("utf8")) as { write: { tool: string }[]; terminal: { tool: string; dialect?: string }[]; read_only: string[] };
const classesNamed = (c: ReturnType<typeof classesOf>, tool: string) =>
  [c.write.some((e) => e.tool === tool) && "write", c.terminal.some((e) => e.tool === tool) && "terminal", c.read_only.includes(tool) && "read_only"].filter(Boolean);
const withFile = (files: Map<string, Buffer>, p: string, text: string) => new Map(files).set(p, Buffer.from(text));
const hookFindings = (files: Map<string, Buffer>, mode: Mode) => copilotHookFindings(files, emitInput(mode));
const mustReport = (found: { code: string; file: string; message: string }[], code: string, file: string, ...named: string[]) =>
  assert.ok(
    found.some((f) => f.code === code && f.file.endsWith(file) && named.every((n) => f.message.includes(n))),
    `${code} naming ${file} and ${named.join(", ")}: ${JSON.stringify(found)}`,
  );
const hooksGrants = (tool: string, mode: Mode) => toolGrants(table.tools[tool]!, mode) ?? [];

for (const mode of MODES) {
  test(`C002-TC-301 clauses carried from C002-T-031 [${mode}]: install/hooks.template.json (every command node "@CLI_COPY@", none a bare sdd) and hooks/tool-classes.json`, () => {
    const { files } = fxDist(mode);
    assert.ok(files.has(HOOKS) && files.has(TOOL_CLASSES_FILE));
    for (const es of Object.values(template(files).hooks))
      for (const e of es) {
        assert.ok(e.command.startsWith('node "@CLI_COPY@" '), e.command);
        assert.ok(!/^sdd\b/.test(e.command));
      }
    assert.deepEqual(classesOf(files), table.hook_tool_classes, "the table's hook_tool_classes, both modes");
    assert.deepEqual(copilotPackageFindings(files, emitInput(mode)), []);
    assert.deepEqual(hookFindings(files, mode), [], "no TGT-HOOK-001 or TGT-CLASS-001 finding on a clean package");
  });

  test(`C002-TC-325 (C002-TS-325) [${mode}]: each hook command is node "@CLI_COPY@" followed by arguments only`, () => {
    for (const es of Object.values(template(fxDist(mode).files).hooks))
      for (const { command, type } of es) {
        assert.equal(type, "command");
        assert.match(command, /^node "@CLI_COPY@"( [A-Za-z0-9_.,:-]+)+$/, command);
        for (const op of ["&&", "||", ";", "|", ">", "<", "$(", "`", "${PLUGIN_ROOT}", "${CLAUDE_PLUGIN_ROOT}", "\\"]) assert.ok(!command.includes(op), `${command}: ${op}`);
      }
  });

  test(`C002-TC-303/C002-TC-311 (C002-TS-303, C002-TS-311) [${mode}]: one PreToolUse entry, the guard hook with --mode ${mode} and the ten agents; SessionStart and SubagentStop; no other PreToolUse; no agent hooks`, () => {
    const { files } = fxDist(mode);
    const hooks = template(files).hooks;
    assert.deepEqual(Object.keys(hooks).sort(), ["PreToolUse", "SessionStart", "SubagentStop"]);
    assert.equal(hooks["PreToolUse"]!.length, 1);
    assert.equal(hooks["PreToolUse"]![0]!.command, `node "@CLI_COPY@" hook guard --host copilot --mode ${mode} --agents ${TEN.join(",")}`);
    assert.equal(hooks["PreToolUse"]![0]!.command, guardCommand(mode, TEN));
    assert.equal(TEN.length, 10);
    assert.deepEqual(hooks["SessionStart"], [{ command: 'node "@CLI_COPY@" hook session-start --host copilot', type: "command" }]);
    assert.deepEqual(hooks["SubagentStop"], [{ command: `node "@CLI_COPY@" hook subagent-stop --host copilot --agents ${AUTHOR_AGENTS.join(",")}`, type: "command" }]);
    for (const [p, b] of files) {
      if (p === HOOKS || !p.endsWith(".json")) continue;
      const doc = JSON.parse(b.toString("utf8")) as Record<string, unknown>;
      assert.ok(!("PreToolUse" in doc) && !JSON.stringify(doc["hooks"] ?? {}).includes("PreToolUse"), `${p} declares no PreToolUse hook`);
    }
    for (const n of TEN) {
      const fm = splitFrontmatter(files.get(`${AGENTS_DIR}/${n}.agent.md`)!.toString("utf8")).data!;
      assert.ok(!("hooks" in fm), `${n}: no hooks key`);
    }
  });

  test(`C002-TC-311 [${mode}]: the PreToolUse command, @CLI_COPY@ replaced by the package's CLI copy, decides with the package's classes file`, () => {
    const { dir } = fxDist(mode);
    const cli = join(dir, CLI_COPY).replace(/\\/g, "/");
    const ws = makeWorkspace({ ".sdd/SDD.md": "# SDD workspace\n", "src/app.ts": "export {};\n" });
    try {
      const args = guardCommand(mode, TEN).slice('node "@CLI_COPY@" '.length).split(" ");
      const run = (tool: string, tool_input: Record<string, unknown>) =>
        spawnSync(process.execPath, [cli, ...args], { input: JSON.stringify({ hook_event_name: "PreToolUse", cwd: ws.root, agent_type: "general-purpose", tool_name: tool, tool_input }), encoding: "utf8" });
      const glob = run("Glob", { pattern: "**/*.ts" });
      assert.equal(glob.status, 0, glob.stderr);
      assert.equal(glob.stdout, "");
      const write = run("Write", { path: "src/app.ts", file_text: "x" });
      assert.equal(write.status, 2);
      assert.match(write.stderr, /GUARD-HOOK-002/);
    } finally {
      ws.cleanup();
    }
  });
}

test("C002-TC-330 (C002-TS-330): hooks fallback — every tool offered to a specialist has exactly one class; Glob, tool_search_tool and the read servers read_only; Write write, Bash terminal with the table's dialect", () => {
  const mode: Mode = "copilot-hooks";
  const { files } = fxDist(mode);
  const c = classesOf(files);
  const derived = translateAgents(emitInput(mode)).agents.filter((a) => a.frontmatter.name !== CONDUCTOR);
  assert.equal(derived.length, 9);
  const offered = new Set(derived.flatMap((a) => offeredHookTools(table, mode, source, a.frontmatter.tools)));
  for (const t of ["tool_search_tool", "Glob", "Write", "Bash"]) assert.ok(offered.has(t), `offered: ${t}`);
  for (const t of offered) assert.equal(classesNamed(c, t).length, 1, `${t}: exactly one class`);
  for (const t of ["Glob", "tool_search_tool"]) assert.deepEqual(classesNamed(c, t), ["read_only"], t);
  for (const t of [...offered].filter((t) => /^(serena|context7|deepwiki)-/.test(t))) assert.deepEqual(classesNamed(c, t), ["read_only"], t);
  assert.deepEqual(classesNamed(c, "Write"), ["write"]);
  assert.deepEqual(classesNamed(c, "Bash"), ["terminal"]);
  assert.equal(c.terminal.find((e) => e.tool === "Bash")!.dialect, table.hook_tool_classes!.terminal.find((e) => e.tool === "Bash")!.dialect);
  assert.ok(hooksGrants("Write", mode).length > 0 && hooksGrants("Bash", mode).length > 0);
  assert.deepEqual(hookFindings(files, mode).filter((f) => f.code === "TGT-CLASS-001"), []);
});

test("C002-TC-331 (C002-TS-331): sdd MCP server enforcement — the sdd-files and sdd-shell tools and tool_search_tool classed; Write and sdd-files write, Bash and sdd-shell terminal; Glob and the read servers read_only", () => {
  const mode: Mode = "sdd-mcp-server";
  const { files } = fxDist(mode);
  const c = classesOf(files);
  const derived = translateAgents(emitInput(mode)).agents.filter((a) => a.frontmatter.name !== CONDUCTOR);
  const offered = new Set(derived.flatMap((a) => offeredHookTools(table, mode, source, a.frontmatter.tools)));
  const filesTools = PROFILE_TOOLS.files.map((t) => `sdd-files-${t}`);
  const shellTools = PROFILE_TOOLS.shell.map((t) => `sdd-shell-${t}`);
  for (const t of [...filesTools, ...shellTools, "tool_search_tool", "Glob"]) assert.ok(offered.has(t), `offered: ${t}`);
  assert.ok(!offered.has("Write") && !offered.has("Bash"), "no generic edit or terminal tool is offered under server enforcement");
  for (const t of offered) assert.equal(classesNamed(c, t).length, 1, `${t}: exactly one class`);
  for (const t of ["Write", ...filesTools]) assert.deepEqual(classesNamed(c, t), ["write"], t);
  for (const t of ["Bash", ...shellTools]) assert.deepEqual(classesNamed(c, t), ["terminal"], t);
  for (const t of ["Glob", "tool_search_tool", ...[...offered].filter((t) => /^(serena|context7|deepwiki)-/.test(t))]) assert.deepEqual(classesNamed(c, t), ["read_only"], t);
  assert.deepEqual(hookFindings(files, mode).filter((f) => f.code === "TGT-CLASS-001"), []);
});

/** The classes file of `mode` with `tool` removed from every class. */
function withoutTool(files: Map<string, Buffer>, tool: string): Map<string, Buffer> {
  const c = classesOf(files);
  const doc = { write: c.write.filter((e) => e.tool !== tool), terminal: c.terminal.filter((e) => e.tool !== tool), read_only: c.read_only.filter((t) => t !== tool) };
  return withFile(files, TOOL_CLASSES_FILE, JSON.stringify(doc, null, 2) + "\n");
}

test("C002-TC-332 (C002-TS-332): a tool removed from the classes file is reported with every specialist offered it, or as the generic tool; ask_user needs no class", () => {
  const hooks = fxDist("copilot-hooks").files;
  let found = hookFindings(withoutTool(hooks, "tool_search_tool"), "copilot-hooks");
  mustReport(found, "TGT-CLASS-001", "tool-classes.json", "tool_search_tool", "sdd-critic.agent.md");
  found = hookFindings(withoutTool(hooks, "Glob"), "copilot-hooks");
  const globOffered = translateAgents(emitInput("copilot-hooks")).agents.filter((a) => a.frontmatter.name !== CONDUCTOR && a.frontmatter.tools.includes(hooksGrants("Glob", "copilot-hooks")[0]!));
  assert.ok(globOffered.length > 0);
  mustReport(found, "TGT-CLASS-001", "tool-classes.json", "Glob", ...globOffered.map((a) => `${a.frontmatter.name}.agent.md`));
  assert.deepEqual(hookFindings(withoutTool(hooks, "ask_user"), "copilot-hooks").filter((f) => f.code === "TGT-CLASS-001"), [], "only the conductor is offered ask_user");

  const server = fxDist("sdd-mcp-server").files;
  mustReport(hookFindings(withoutTool(server, "tool_search_tool"), "sdd-mcp-server"), "TGT-CLASS-001", "tool-classes.json", "tool_search_tool", "sdd-critic.agent.md");
  mustReport(hookFindings(withoutTool(server, "Write"), "sdd-mcp-server"), "TGT-CLASS-001", "tool-classes.json", 'generic tool "Write"');
  mustReport(hookFindings(withoutTool(server, "Bash"), "sdd-mcp-server"), "TGT-CLASS-001", "tool-classes.json", 'generic tool "Bash"');
});

test("C002-TS-332 neighbours: a classes file that classes a tool twice, in the wrong class, or with another dialect is reported (TGT-CLASS-001)", () => {
  const files = fxDist("sdd-mcp-server").files;
  const c = classesOf(files);
  const dup = withFile(files, TOOL_CLASSES_FILE, JSON.stringify({ ...c, write: [...c.write, { tool: "Glob", paths: ["/path"] }] }));
  mustReport(hookFindings(dup, "sdd-mcp-server"), "TGT-CLASS-001", "tool-classes.json", "Glob", "more than once");
  const moved = withFile(files, TOOL_CLASSES_FILE, JSON.stringify({ ...c, write: c.write.filter((e) => e.tool !== "Write"), read_only: [...c.read_only, "Write"] }));
  mustReport(hookFindings(moved, "sdd-mcp-server"), "TGT-CLASS-001", "tool-classes.json", "Write", "not write");
  const dialect = withFile(files, TOOL_CLASSES_FILE, JSON.stringify({ ...c, terminal: c.terminal.map((e) => (e.tool === "Bash" ? { ...e, dialect: "bash" } : e)) }));
  mustReport(hookFindings(dialect, "sdd-mcp-server"), "TGT-CLASS-001", "tool-classes.json", "Bash", "dialect bash");
});

test("C002-TC-304 (C002-TS-304): a PreToolUse hook added, changed or removed is reported (TGT-HOOK-001)", () => {
  const mode: Mode = "sdd-mcp-server";
  const files = fxDist(mode).files;
  const t = template(files);
  const cases: [string, Map<string, Buffer>, string, string][] = [
    ["the source hooks/hooks.json copied to hooks.json", withFile(files, "hooks.json", readFileSync(join(PLUGIN, "hooks", "hooks.json"), "utf8")), "hooks.json", "PreToolUse"],
    [
      "a second PreToolUse entry running hook session-start",
      withFile(files, HOOKS, JSON.stringify({ hooks: { ...t.hooks, PreToolUse: [...t.hooks["PreToolUse"]!, { command: 'node "@CLI_COPY@" hook session-start --host copilot', type: "command" }] } })),
      HOOKS,
      "PreToolUse",
    ],
    [
      "the PreToolUse command holds --mode copilot-hooks",
      withFile(files, HOOKS, JSON.stringify({ hooks: { ...t.hooks, PreToolUse: [{ command: guardCommand("copilot-hooks", TEN), type: "command" }] } })),
      HOOKS,
      "--mode",
    ],
    ["the PreToolUse entry removed", withFile(files, HOOKS, JSON.stringify({ hooks: { SessionStart: t.hooks["SessionStart"], SubagentStop: t.hooks["SubagentStop"] } })), HOOKS, "PreToolUse"],
  ];
  const critic = `${AGENTS_DIR}/sdd-critic.agent.md`;
  const doc = splitFrontmatter(files.get(critic)!.toString("utf8"));
  const body = doc.lines.slice(doc.bodyStartLine - 1).join("\n");
  const hooked = `---\n${stringify({ ...doc.data, hooks: { PreToolUse: [{ type: "command", command: guardCommand(mode, TEN) }] } }, { lineWidth: 0 })}---\n${body}`;
  cases.push(["the frontmatter of sdd-critic.agent.md gains a hooks key", withFile(files, critic, hooked), "sdd-critic.agent.md", "PreToolUse"]);
  for (const [why, bad, file, named] of cases) {
    const found = hookFindings(bad, mode);
    assert.ok(found.some((f) => f.code === "TGT-HOOK-001" && f.file.endsWith(file) && f.message.includes(named)), `${why}: ${JSON.stringify(found)}`);
  }
});

test("C002-TC-326 (C002-TS-326), TGT-HOOK-001 part: a session-start command ending with && echo done is reported naming the command and &&", () => {
  const files = fxDist("sdd-mcp-server").files;
  const t = template(files);
  const cmd = `${t.hooks["SessionStart"]![0]!.command} && echo done`;
  const bad = withFile(files, HOOKS, JSON.stringify({ hooks: { ...t.hooks, SessionStart: [{ command: cmd, type: "command" }] } }));
  mustReport(hookFindings(bad, "sdd-mcp-server"), "TGT-HOOK-001", HOOKS, cmd, '"&&"');
});

for (const token of ["${PLUGIN_ROOT}", "${CLAUDE_PLUGIN_ROOT}"]) {
  test(`C002-TC-355 (C002-TS-355), TGT-HOOK-001 part: ${token} in the SubagentStop command is reported naming install/hooks.template.json and the token`, () => {
    const files = fxDist("sdd-mcp-server").files;
    const t = template(files);
    const bad = withFile(files, HOOKS, JSON.stringify({ hooks: { ...t.hooks, SubagentStop: [{ command: `node "${token}/scripts/sdd.mjs" hook subagent-stop --host copilot --agents sdd-planner`, type: "command" }] } }));
    mustReport(hookFindings(bad, "sdd-mcp-server"), "TGT-HOOK-001", "install/hooks.template.json", token);
  });
}

test("the generator refuses a table whose classes leave a tool offered to a specialist unclassed (ERR-GEN-004)", () => {
  const classes = table.hook_tool_classes!;
  const bad: MappingTable = { ...table, hook_tool_classes: { ...classes, read_only: classes.read_only.filter((t) => t !== "tool_search_tool") } };
  for (const mode of MODES) {
    const r = emitCopilot({ ...emitInput(mode), table: bad });
    assert.equal(r.files.size, 0, mode);
    assert.ok(r.diagnostics.some((d) => d.code === "ERR-GEN-004" && d.message.includes("tool_search_tool") && specialists.every((s) => d.message.includes(s))), JSON.stringify(r.diagnostics));
  }
});
