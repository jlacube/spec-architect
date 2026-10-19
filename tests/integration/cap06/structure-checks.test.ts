// C002-T-035 — the target structure checks of C002-IF-005 §6 (scripts/check/targets/, C002-COMP-007) and
// PLG-VAR-001 (scripts/check/variants.mjs) on fx-dist (both packages generated into a temporary folder,
// per mode, read back from disk) and fx-dist-bad (fx-dist with one planted defect per Examples row), and
// on fx-src (a copy of the source plugin). Expected values come from the mapping tables and the source
// plugin, never from a change folder (C002-REQ-605).
//   C002-TC-116 (C002-TS-116)  inlining budget limits (TGT-SIZE-001)
//   C002-TC-121 (C002-TS-121)  the plugin structure checks' part: no variant in a Claude Code file (PLG-VAR-001, PLG-SIZE-001)
//   C002-TC-122 (C002-TS-122)  a variant pasted into a Claude Code file (PLG-VAR-001; npm run check fails)
//   C002-TC-126 (C002-TS-126)  Serena declaration without --read-only (TGT-SERENA-001)
//   C002-TC-229 (C002-TS-229)  question rule missing from the conductor or given to a specialist (TGT-PERM-001)
//   C002-TC-340 (C002-TS-340)  generic tool granted to the conductor or a prompt file under the hooks fallback (TGT-GRANT-001)
//   C002-TC-355 (C002-TS-355)  plugin-root token in a generated hook command
//   C002-TC-601 (C002-TS-601)  clean checkout: npm run check runs the target checks for opencode and copilot
//   C002-TC-602 (C002-TS-602)  a target check fails: the output names the target and the file
//   C002-TC-603 (C002-TS-603)  packages of an earlier run are not the ones checked
//   C002-TC-604 (C002-TS-604)  construct placement in a target package (TGT-PORT-001)
//   C002-TC-605 (C002-TS-605)  contract differences (TGT-LAYOUT-001, TGT-TOOLS-001, TGT-MCP-001)
//   C002-TC-606 (C002-TS-606)  generic tool granted, or no tools list, under server enforcement (TGT-GRANT-001)
//   C002-TC-607 (C002-TS-607)  CHG-001 archived: same findings, no read under a change folder
//   C002-TC-640 (C002-TS-640)  OpenCode agent tool map that is not closed (TGT-TOOLS-001)
// Beside them, one planted fault each for TGT-AGENT-001, TGT-MODE-001, TGT-MEM-001, TGT-HOOK-001,
// TGT-CLASS-001 and the top-level permission rule of TGT-PERM-001.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { main } from "../../../scripts/generate/main.ts";
import { TARGET_MODES } from "../../../scripts/generate/model.ts";
import { loadTargetTable, TARGETS, type Mode, type Target } from "../../../scripts/generate/tables.ts";
import { CONDUCTOR, listField } from "../../../scripts/generate/translate/frontmatter.ts";
import { skillHeading } from "../../../scripts/generate/translate/inline.ts";
import { context } from "../../../scripts/check/lib.mjs";
import { runChecks } from "../../../scripts/check/run.mjs";
import variants from "../../../scripts/check/variants.mjs";
import { checkPackage, format, runTargetChecks } from "../../../scripts/check/targets/index.mjs";
import { readTree, sourceContext, targetContext } from "../../../scripts/check/targets/lib.mjs";
import { PER_AGENT, PER_SKILL } from "../../../scripts/check/targets/size.mjs";
import { repoRoot } from "../../helpers.ts";
import { pluginCopy } from "../cap11/structure.ts";

const root = repoRoot();
const PLUGIN = join(root, "plugins", "architect");
const src = sourceContext(PLUGIN);
assert.deepEqual(src.sourceDiagnostics, [], "the source plugin reads without diagnostics");
const tables = Object.fromEntries(TARGETS.map((t) => [t, loadTargetTable(root, t)])) as Record<Target, ReturnType<typeof loadTargetTable>>;

type Files = Map<string, Buffer>;
interface Finding {
  code: string;
  target: string | null;
  path: string | null;
  line: number | null;
  message: string;
}

/** fx-dist: one package generated for `mode` into a temporary folder and read back (built once). */
const dists = new Map<string, Files>();
function fxDist(target: Target, mode: Mode = tables[target].enforcement_mode): Files {
  const key = `${target}\0${mode}`;
  const hit = dists.get(key);
  if (hit) return hit;
  const base = mkdtempSync(join(tmpdir(), "sdd-fx-dist-chk-"));
  try {
    const err: string[] = [];
    const code = main(["--target", target, "--mode", `${target}=${mode}`, "--out", join(base, "dist"), "--quiet"], { cwd: root, stdout: () => {}, stderr: (l) => err.push(l) });
    assert.equal(code, 0, err.join("\n"));
    const files = readTree(join(base, "dist", target)) as Files;
    dists.set(key, files);
    return files;
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

/** Findings of the target checks on `files` (a planted copy of fx-dist). */
const check = (target: Target, files: Files, mode: Mode = tables[target].enforcement_mode): Finding[] => checkPackage(targetContext(src, target, mode, files)) as Finding[];
const withCode = (fs: Finding[], code: string) => fs.filter((f) => f.code === code);
const show = (fs: Finding[]) => fs.map((f) => format(f)).join("\n");

/** fx-dist-bad: a copy of the package with `edit` applied. */
function bad(target: Target, edit: (files: Files) => void, mode?: Mode): Files {
  const files = new Map(fxDist(target, mode));
  edit(files);
  return files;
}
const textOf = (files: Files, p: string) => {
  const b = files.get(p);
  assert.ok(b, `${p} exists`);
  return b.toString("utf8");
};
const setText = (files: Files, p: string, t: string) => files.set(p, Buffer.from(t, "utf8"));
const editJson = (files: Files, p: string, f: (j: any) => void) => {
  const j = JSON.parse(textOf(files, p));
  f(j);
  setText(files, p, JSON.stringify(j, null, 2) + "\n");
};
/** Inserts `line` so that it becomes line `n` of the file. */
const insertLine = (files: Files, p: string, n: number, line: string) => {
  const lines = textOf(files, p).split("\n");
  lines.splice(n - 1, 0, line);
  setText(files, p, lines.join("\n"));
};
/** Last line of a Markdown file's frontmatter (the closing fence). */
const frontmatterEnd = (files: Files, p: string) => textOf(files, p).split("\n").indexOf("---", 1) + 1;

const OC = { agents: tables.opencode.placement["agents_dir"]!, commands: tables.opencode.placement["commands_dir"]!, config: tables.opencode.placement["config_file"]! };
const CP = {
  agents: tables.copilot.placement["agents_dir"]!,
  prompts: tables.copilot.placement["commands_dir"]!,
  config: tables.copilot.placement["config_file"]!,
  hooks: tables.copilot.placement["hooks_file"]!,
};
const cpAgent = (n: string) => `${CP.agents}/${n}.agent.md`;
const cpPrompt = (n: string) => `${CP.prompts}/${n}.prompt.md`;
const ocAgent = (n: string) => `${OC.agents}/${n}.md`;
/** Adds `tool` in front of the flow-form tools list of a Copilot agent or prompt file. */
const grantCp = (files: Files, p: string, tool: string) => {
  const t = textOf(files, p);
  assert.match(t, /^tools: \[/m, `${p} has a flow-form tools list`);
  setText(files, p, t.replace(/^tools: \[/m, `tools: ['${tool}', `));
};

// ---------------------------------------------------------------------------------------------------

test("C002-TC-601 (C002-TS-601): the generated packages of the current source plugin have no finding, in every enforcement mode", () => {
  const r = runTargetChecks({ plugin: PLUGIN });
  assert.equal(r.generated, true);
  assert.deepEqual(r.findings, [], show(r.findings as Finding[]));
  assert.deepEqual(r.packages.map((p: { target: string }) => p.target).sort(), ["copilot", "opencode"]);
  for (const t of TARGETS) for (const m of TARGET_MODES[t]) assert.deepEqual(check(t, fxDist(t, m), m), [], `${t} ${m}`);
});

test("C002-TC-601 (C002-TS-601): npm run check has a target structure step that reports opencode and copilot", { timeout: 120000 }, () => {
  const r = spawnSync(process.execPath, [join(root, "scripts", "check.mjs"), "--steps", "targets"], { cwd: root, encoding: "utf8" });
  const out = r.stdout + r.stderr;
  assert.equal(r.status, 0, out);
  assert.match(out, /PASS {2}target structure checks \(opencode, copilot\)/);
  assert.match(out, /target structure checks: opencode \(mode sdd-mcp-server, \d+ files\): 13 checks, 0 errors/);
  assert.match(out, /target structure checks: copilot \(mode sdd-mcp-server, \d+ files\): 13 checks, 0 errors/);
});

// --- TGT-SIZE-001 -----------------------------------------------------------------------------------

/** fx-plugin-budget: the OpenCode conductor's seven inlined skills rewritten to the given sizes (gate-protocol = `skill`). */
function budget(skill: number, total: number): Files {
  const skills = listField(src.source.agents.find((a: { name: string }) => a.name === CONDUCTOR)!.data?.["skills"]);
  assert.equal(skills.length, 7, "the conductor inlines seven skills");
  assert.ok(skills.includes("gate-protocol"));
  const others = skills.filter((s: string) => s !== "gate-protocol");
  const rest = total - skill;
  const sizes = new Map<string, number>(others.map((s: string, i: number) => [s, Math.floor(rest / others.length) + (i === 0 ? rest % others.length : 0)]));
  sizes.set("gate-protocol", skill);
  return bad("opencode", (files) => {
    const p = ocAgent(CONDUCTOR);
    const t = textOf(files, p);
    const head = t.slice(0, t.indexOf(`\n${skillHeading(skills[0]!)}\n`));
    setText(files, p, `${head}\n${skills.map((s: string) => `${skillHeading(s)}\n\n${"a".repeat(sizes.get(s)!)}`).join("\n\n")}\n`);
  });
}

test("C002-TC-116 (C002-TS-116): a skill of 24,000 characters and 64,000 in total is within the budgets", () => {
  assert.equal(PER_SKILL, 24000);
  assert.equal(PER_AGENT, 64000);
  assert.deepEqual(withCode(check("opencode", budget(24000, 64000)), "TGT-SIZE-001"), []);
});

test("C002-TC-116 (C002-TS-116): a skill of 24,001 characters is one error naming opencode, sdd-conductor, 24,000, 24,001 and gate-protocol only", () => {
  const fs = withCode(check("opencode", budget(24001, 40000)), "TGT-SIZE-001");
  assert.equal(fs.length, 1, show(fs));
  const m = fs[0]!.message;
  for (const s of ["opencode", "sdd-conductor", "24,000", "24,001", "gate-protocol"]) assert.ok(m.includes(s), `${s} in ${m}`);
  for (const s of ["sdd-conventions", "interview-protocol", "options-analysis", "phase-ideation", "phase-spec", "phase-plan"]) assert.ok(!m.includes(s), `${s} not in ${m}`);
  assert.equal(fs[0]!.target, "opencode");
});

test("C002-TC-116 (C002-TS-116): 64,001 characters in total is one error naming the per-agent budget and each of the seven skills with its size", () => {
  const fs = withCode(check("opencode", budget(20000, 64001)), "TGT-SIZE-001");
  assert.equal(fs.length, 1, show(fs));
  const m = fs[0]!.message;
  for (const s of ["opencode", "sdd-conductor", "64,000", "64,001", "gate-protocol 20,000"]) assert.ok(m.includes(s), `${s} in ${m}`);
  for (const s of listField(src.source.agents.find((a: { name: string }) => a.name === CONDUCTOR)!.data?.["skills"])) assert.match(m, new RegExp(`${s} \\d[\\d,]*`), s);
});

// --- PLG-VAR-001 ------------------------------------------------------------------------------------

test("C002-TC-121 (C002-TS-121): the plugin structure checks find no variant and no host-only name in the Claude Code files, and every variant file lies under targets/", () => {
  const fs = runChecks(context({ repo: root })) as { code: string; severity: string }[];
  assert.deepEqual(fs.filter((f) => f.code === "PLG-VAR-001"), []);
  assert.deepEqual(fs.filter((f) => f.code === "PLG-SIZE-001" && f.severity === "error"), []);
  for (const t of TARGETS)
    for (const v of tables[t].variants) assert.ok(existsSync(join(PLUGIN, "targets", t, "wiring", v.text_file)), `${t}: ${v.text_file} under targets/${t}/wiring/`);
});

const PASTES: { label: string; file: string; text: () => string }[] = [
  { label: "the Copilot variant of the gate wiring", file: "skills/gate-protocol/SKILL.md", text: () => readFileSync(join(PLUGIN, "targets", "copilot", "wiring", "gate-protocol.md"), "utf8") },
  { label: "the OpenCode variant of the CLI invocation line", file: "agents/sdd-conductor.md", text: () => readFileSync(join(PLUGIN, "targets", "opencode", "wiring", "cli-conductor.md"), "utf8") },
  { label: 'the line "Confirm in one ask_user round"', file: "commands/archive.md", text: () => "Confirm in one ask_user round\n" },
  { label: 'the line "Load sdd-files-write_file through tool_search_tool first"', file: "agents/sdd-spec-writer.md", text: () => "Load sdd-files-write_file through tool_search_tool first\n" },
];

for (const row of PASTES)
  test(`C002-TC-122 (C002-TS-122): ${row.label} pasted into ${row.file} is a PLG-VAR-001 error naming the file`, () => {
    const copy = pluginCopy();
    try {
      appendFileSync(join(copy.plugin, row.file), `\n${row.text()}`);
      const fs = variants.check(copy.ctx) as { path: string; line: number; message: string }[];
      assert.ok(fs.length > 0, row.label);
      assert.ok(fs.every((f) => f.path.endsWith(`plugins/architect/${row.file}`)), JSON.stringify(fs));
      assert.ok(fs.every((f) => typeof f.line === "number" && f.line > 0));
    } finally {
      copy.cleanup();
    }
  });

// --- npm run check on a broken plugin copy (C002-TS-122, C002-TS-602) --------------------------------

/** fx-src with a second "Claude Code wiring" section in gate-protocol that names AskUserQuestion. */
const WIRING_PASTE = "\n## Claude Code wiring\n\nBefore the gate, confirm once more with AskUserQuestion in a sentence no variant replaces.\n";

test("C002-TC-602 (C002-TS-602): a wiring section the Copilot variant does not replace fails the target checks, naming copilot and the file", () => {
  const copy = pluginCopy();
  try {
    appendFileSync(join(copy.plugin, "skills", "gate-protocol", "SKILL.md"), WIRING_PASTE);
    const r = runTargetChecks({ plugin: copy.plugin });
    assert.ok(r.findings.length > 0);
    const hit = (r.findings as Finding[]).filter((f) => f.target === "copilot" && f.path === "skills/gate-protocol/SKILL.md");
    assert.ok(hit.length > 0, show(r.findings as Finding[]));
    assert.ok(hit.some((f) => /copilot/.test(format(f)) && format(f).includes("skills/gate-protocol/SKILL.md")));
  } finally {
    copy.cleanup();
  }
});

test("C002-TC-602, C002-TC-122: npm run check exits non-zero on a broken plugin copy and names the target and the failing files", { timeout: 180000 }, () => {
  const copy = pluginCopy();
  try {
    appendFileSync(join(copy.plugin, "skills", "gate-protocol", "SKILL.md"), WIRING_PASTE);
    appendFileSync(join(copy.plugin, "commands", "archive.md"), "\nConfirm in one ask_user round\n");
    const r = spawnSync(process.execPath, [join(root, "scripts", "check.mjs"), "--steps", "structure,targets"], { cwd: root, encoding: "utf8", env: { ...process.env, SDD_CHECK_PLUGIN: copy.plugin } });
    const out = r.stdout + r.stderr;
    assert.notEqual(r.status, 0, out);
    assert.match(out, /FAIL {2}plugin structure checks/);
    assert.match(out, /FAIL {2}target structure checks \(opencode, copilot\)/);
    assert.match(out, /error PLG-VAR-001 \S*commands\/archive\.md:\d+/);
    assert.match(out, /error ERR-GEN-\d{3} copilot skills\/gate-protocol\/SKILL\.md/);
  } finally {
    copy.cleanup();
  }
});

// --- TGT-SERENA-001 ---------------------------------------------------------------------------------

test("C002-TC-126 (C002-TS-126): a serena entry of install/mcp.json without --read-only is TGT-SERENA-001 naming install/mcp.json, serena and --read-only", () => {
  const files = bad("copilot", (f) => editJson(f, CP.config, (j) => (j.servers.serena.args = j.servers.serena.args.filter((a: string) => a !== "--read-only"))));
  const fs = withCode(check("copilot", files), "TGT-SERENA-001");
  assert.ok(fs.length >= 1, show(fs));
  assert.ok(fs.some((f) => f.path === "install/mcp.json" && f.message.includes("install/mcp.json") && f.message.includes("serena") && f.message.includes("--read-only")), show(fs));
});

test("C002-TC-126: the OpenCode serena entry with SERENA_HOME and an extra argument is TGT-SERENA-001 naming opencode.json", () => {
  const files = bad("opencode", (f) =>
    editJson(f, OC.config, (j) => {
      j.mcp.serena.command.push("--extra");
      j.mcp.serena.environment = { SERENA_HOME: "x" };
    }),
  );
  const fs = withCode(check("opencode", files), "TGT-SERENA-001");
  assert.ok(fs.some((f) => f.message.includes('extra argument "--extra"')), show(fs));
  assert.ok(fs.some((f) => f.message.includes('"SERENA_HOME"') && f.path === "opencode.json"), show(fs));
});

// --- TGT-PERM-001 -----------------------------------------------------------------------------------

const QUESTION_ROWS: { change: string; agent: string; named: RegExp; edit: (perm: Record<string, unknown>) => void }[] = [
  { change: 'the "question" rule of "sdd-conductor" set to "deny"', agent: "sdd-conductor", named: /value "deny"/, edit: (p) => (p["question"] = "deny") },
  { change: 'the "question" key removed from "sdd-conductor"', agent: "sdd-conductor", named: /key "question"/, edit: (p) => delete p["question"] },
  { change: 'the "question" rule of "sdd-critic" set to "allow"', agent: "sdd-critic", named: /value "allow"/, edit: (p) => (p["question"] = "allow") },
  { change: 'the "question" key removed from "sdd-planner"', agent: "sdd-planner", named: /key "question"/, edit: (p) => delete p["question"] },
];

for (const row of QUESTION_ROWS)
  test(`C002-TC-229 (C002-TS-229): ${row.change} is TGT-PERM-001 naming ${row.agent} and ${row.named.source}`, () => {
    const files = bad("opencode", (f) => editJson(f, OC.config, (j) => row.edit(j.agent[row.agent].permission)));
    const fs = withCode(check("opencode", files), "TGT-PERM-001");
    assert.equal(fs.length, 1, show(fs));
    assert.ok(fs[0]!.message.includes(`"${row.agent}"`), fs[0]!.message);
    assert.match(fs[0]!.message, row.named);
  });

test("TGT-PERM-001: a top-level permission key and native rules under server enforcement are reported", () => {
  const files = bad("opencode", (f) =>
    editJson(f, OC.config, (j) => {
      j.permission = { edit: "allow" };
      j.agent["sdd-critic"].permission.edit = "allow";
    }),
  );
  const fs = withCode(check("opencode", files), "TGT-PERM-001");
  assert.ok(fs.some((f) => f.message.includes("top-level permission")), show(fs));
  assert.ok(fs.some((f) => f.message.includes('"sdd-critic": the edit rule')), show(fs));
});

// --- TGT-GRANT-001 ----------------------------------------------------------------------------------

for (const row of [
  { file: "sdd-conductor.agent.md", path: cpAgent(CONDUCTOR), tool: "edit" },
  { file: "plan.prompt.md", path: cpPrompt("plan"), tool: "execute" },
])
  test(`C002-TC-340 (C002-TS-340): under the Copilot hooks fallback ${row.file} granting "${row.tool}" is TGT-GRANT-001 naming the file and the tool`, () => {
    const files = bad("copilot", (f) => grantCp(f, row.path, row.tool), "copilot-hooks");
    const fs = withCode(check("copilot", files, "copilot-hooks"), "TGT-GRANT-001");
    assert.equal(fs.length, 1, show(fs));
    assert.ok(fs[0]!.message.includes(row.file) && fs[0]!.message.includes(`"${row.tool}"`), fs[0]!.message);
  });

test("C002-TC-340: under the Copilot hooks fallback the specialists' generic tools are no TGT-GRANT-001 finding", () => {
  assert.deepEqual(withCode(check("copilot", fxDist("copilot", "copilot-hooks"), "copilot-hooks"), "TGT-GRANT-001"), []);
});

const SERVER_GRANTS: { file: string; path: string; grant: string; plant: (f: Files) => void; named: RegExp }[] = [
  { file: "sdd-conductor.agent.md", path: cpAgent(CONDUCTOR), grant: 'grants "edit"', plant: (f) => grantCp(f, cpAgent(CONDUCTOR), "edit"), named: /"edit"/ },
  { file: "plan.prompt.md", path: cpPrompt("plan"), grant: 'grants "execute"', plant: (f) => grantCp(f, cpPrompt("plan"), "execute"), named: /"execute"/ },
  { file: "sdd-planner.agent.md", path: cpAgent("sdd-planner"), grant: 'grants a tool set that contains the host tool "create"', plant: (f) => grantCp(f, cpAgent("sdd-planner"), "edit/*"), named: /tool set "edit\/\*".*"create"/ },
  {
    file: "sdd-critic.agent.md",
    path: cpAgent("sdd-critic"),
    grant: 'has no "tools" field in its frontmatter',
    plant: (f) => setText(f, cpAgent("sdd-critic"), textOf(f, cpAgent("sdd-critic")).replace(/^tools: .*\n/m, "")),
    named: /no "tools" list/,
  },
];

for (const row of SERVER_GRANTS)
  test(`C002-TC-606 (C002-TS-606): under sdd MCP server enforcement ${row.file} that ${row.grant} is TGT-GRANT-001 naming the file`, () => {
    const files = bad("copilot", row.plant, "sdd-mcp-server");
    const fs = withCode(check("copilot", files, "sdd-mcp-server"), "TGT-GRANT-001");
    assert.equal(fs.length, 1, show(fs));
    assert.equal(fs[0]!.path, row.path);
    assert.ok(fs[0]!.message.includes(row.file), fs[0]!.message);
    assert.match(fs[0]!.message, row.named);
  });

test("C002-TC-606: under sdd MCP server enforcement an OpenCode agent granted bash is TGT-GRANT-001", () => {
  const files = bad("opencode", (f) => editJson(f, OC.config, (j) => (j.agent["sdd-auditor"].tools.bash = true)));
  const fs = withCode(check("opencode", files), "TGT-GRANT-001");
  assert.equal(fs.length, 1, show(fs));
  assert.ok(fs[0]!.message.includes('"bash"') && fs[0]!.message.includes('"sdd-auditor"'), fs[0]!.message);
});

// --- TGT-HOOK-001 / TGT-PORT-001 on the hook template ----------------------------------------------

for (const token of ["${PLUGIN_ROOT}", "${CLAUDE_PLUGIN_ROOT}"])
  test(`C002-TC-355 (C002-TS-355): ${token} in the SubagentStop command of install/hooks.template.json is an error naming the file and the token`, () => {
    const files = bad("copilot", (f) => editJson(f, CP.hooks, (j) => (j.hooks.SubagentStop[0].command = `node "${token}/scripts/sdd.mjs" hook subagent-stop --host copilot --agents sdd-planner`)));
    const fs = check("copilot", files);
    assert.ok(fs.length > 0);
    assert.ok(withCode(fs, "TGT-HOOK-001").some((f) => f.path === "install/hooks.template.json" && f.message.includes(token)), show(fs));
    assert.ok(withCode(fs, "TGT-PORT-001").some((f) => f.path === "install/hooks.template.json" && f.message.includes(token)), show(fs));
  });

// --- TGT-PORT-001 -----------------------------------------------------------------------------------

/** install/hooks.template.json with the SessionStart command on line 3, holding `token`. */
function hooksWithLine3(files: Files, token: string): void {
  const j = JSON.parse(textOf(files, CP.hooks));
  const session = { command: `node "${token}/scripts/sdd.mjs" hook session-start --host copilot`, type: "command" };
  setText(files, CP.hooks, `{\n  "hooks": {\n    "SessionStart": [${JSON.stringify(session)}],\n    "PreToolUse": ${JSON.stringify(j.hooks.PreToolUse)},\n    "SubagentStop": ${JSON.stringify(j.hooks.SubagentStop)}\n  }\n}\n`);
}

const PLACEMENTS: { target: Target; file: string; construct: string; line: number; place: string; plant: (f: Files) => void; error: boolean }[] = [
  { target: "opencode", file: ocAgent("sdd-auditor"), construct: "${CLAUDE_PLUGIN_ROOT}", line: 13, place: "the agent body", plant: (f) => insertLine(f, ocAgent("sdd-auditor"), 13, "Read ${CLAUDE_PLUGIN_ROOT}/README.md first."), error: true },
  { target: "copilot", file: cpAgent("sdd-critic"), construct: "AskUserQuestion", line: 9, place: "the agent body", plant: (f) => insertLine(f, cpAgent("sdd-critic"), 9, "Ask P-01 with AskUserQuestion."), error: true },
  { target: "copilot", file: cpAgent("sdd-planner"), construct: "architect:sdd-critic", line: 21, place: "the agent body", plant: (f) => insertLine(f, cpAgent("sdd-planner"), 21, "Then hand over to architect:sdd-critic."), error: true },
  {
    target: "copilot",
    file: CP.config,
    construct: "${CLAUDE_PLUGIN_ROOT}",
    line: 4,
    place: "a server command field",
    plant: (f) => {
      const lines = textOf(f, CP.config).split("\n");
      lines[3] = `      "command": "\${CLAUDE_PLUGIN_ROOT}/bin/serve", ${lines[3]!.trim()}`;
      setText(f, CP.config, lines.join("\n"));
      JSON.parse(textOf(f, CP.config));
    },
    error: true,
  },
  { target: "copilot", file: CP.hooks, construct: "${CLAUDE_PLUGIN_ROOT}", line: 3, place: "a hook command", plant: (f) => hooksWithLine3(f, "${CLAUDE_PLUGIN_ROOT}"), error: true },
  { target: "copilot", file: CP.hooks, construct: "${PLUGIN_ROOT}", line: 3, place: "a hook command", plant: (f) => hooksWithLine3(f, "${PLUGIN_ROOT}"), error: true },
  { target: "opencode", file: `${OC.commands}/architect-new.md`, construct: "$ARGUMENTS", line: 9, place: "the command body", plant: (f) => insertLine(f, `${OC.commands}/architect-new.md`, 9, "Use $ARGUMENTS as the change title."), error: false },
];

for (const row of PLACEMENTS)
  test(`C002-TC-604 (C002-TS-604): ${row.construct} on line ${row.line} of ${row.file} in ${row.place} is ${row.error ? "an error naming the file, the line and the construct" : "no error"}`, () => {
    const files = bad(row.target, row.plant);
    if (row.place.endsWith("body")) assert.ok(row.line > frontmatterEnd(files, row.file), `line ${row.line} of ${row.file} is a body line`);
    assert.ok(textOf(files, row.file).split("\n")[row.line - 1]!.includes(row.construct), "planted on the line");
    const fs = withCode(check(row.target, files), "TGT-PORT-001").filter((f) => f.path === row.file);
    if (!row.error) {
      assert.deepEqual(fs, []);
      return;
    }
    assert.ok(fs.length >= 1, `no finding for ${row.file}`);
    assert.ok(fs.some((f) => f.line === row.line && f.message.includes(row.construct)), show(fs));
    assert.ok(fs.every((f) => f.line === row.line), show(fs));
  });

// --- TGT-LAYOUT-001, TGT-TOOLS-001, TGT-MCP-001 -------------------------------------------------------

test("C002-TC-605 (C002-TS-605): an OpenCode package without difference from its contract has no error", () => {
  assert.deepEqual(check("opencode", fxDist("opencode")), []);
});

test('C002-TC-605 (C002-TS-605): the OpenCode agent file "sdd-critic.md" missing is an error naming sdd-critic.md', () => {
  const fs = check("opencode", bad("opencode", (f) => f.delete(ocAgent("sdd-critic"))));
  const layout = withCode(fs, "TGT-LAYOUT-001");
  assert.equal(layout.length, 1, show(fs));
  assert.ok(layout[0]!.message.includes("sdd-critic.md"));
});

test('C002-TC-605 (C002-TS-605): the tool "web/fetch" added to "sdd-auditor.agent.md" is an error naming the file and the tool', () => {
  const fs = check("copilot", bad("copilot", (f) => grantCp(f, cpAgent("sdd-auditor"), "web/fetch")));
  assert.deepEqual(fs.map((f) => f.code), ["TGT-TOOLS-001"], show(fs));
  assert.ok(fs[0]!.message.includes("sdd-auditor.agent.md") && fs[0]!.message.includes('"web/fetch"'), fs[0]!.message);
});

test('C002-TC-605 (C002-TS-605): the server "serena" missing from "servers" of "install/mcp.json" is an error naming the file and serena', () => {
  const fs = check("copilot", bad("copilot", (f) => editJson(f, CP.config, (j) => delete j.servers.serena)));
  const mcp = withCode(fs, "TGT-MCP-001");
  assert.equal(mcp.length, 1, show(fs));
  assert.ok(mcp[0]!.message.includes("install/mcp.json") && mcp[0]!.message.includes('"serena"'), mcp[0]!.message);
});

test('C002-TC-605 (C002-TS-605): a ".mcp.json" at the Copilot package root that declares "sdd-files" is an error naming .mcp.json and sdd-files', () => {
  const fs = check("copilot", bad("copilot", (f) => setText(f, ".mcp.json", JSON.stringify({ mcpServers: { "sdd-files": { command: "sdd-mcp", args: ["--profile", "files"] } } }, null, 2) + "\n")));
  assert.ok(withCode(fs, "TGT-LAYOUT-001").some((f) => f.path === ".mcp.json"), show(fs));
  assert.ok(withCode(fs, "TGT-MCP-001").some((f) => f.path === ".mcp.json" && f.message.includes('"sdd-files"')), show(fs));
});

// --- TGT-TOOLS-001: the closed OpenCode tool map ------------------------------------------------------

const MAP_ROWS: { map: string; edit: (tools: Record<string, boolean>) => Record<string, boolean>; error: boolean }[] = [
  { map: 'starts with the catch-all entry "*": false, followed by the tools the table derives', edit: (t) => t, error: false },
  { map: 'has no catch-all entry "*"', edit: ({ "*": _, ...rest }) => rest, error: true },
  { map: 'starts with the catch-all entry "*": true', edit: ({ "*": _, ...rest }) => ({ "*": true, ...rest }), error: true },
  { map: 'holds the catch-all entry "*": false after the tools the table derives', edit: ({ "*": _, ...rest }) => ({ ...rest, "*": false }), error: true },
];

for (const row of MAP_ROWS)
  test(`C002-TC-640 (C002-TS-640): the tools map of sdd-spec-writer that ${row.map} is ${row.error ? 'TGT-TOOLS-001 naming opencode.json, sdd-spec-writer and "*"' : "no finding"}`, () => {
    const files = bad("opencode", (f) => editJson(f, OC.config, (j) => (j.agent["sdd-spec-writer"].tools = row.edit(j.agent["sdd-spec-writer"].tools))));
    const fs = withCode(check("opencode", files), "TGT-TOOLS-001").filter((f) => f.message.includes('"sdd-spec-writer"'));
    if (!row.error) return assert.deepEqual(fs, []);
    assert.equal(fs.length, 1, show(fs));
    assert.ok(fs[0]!.path === "opencode.json" && fs[0]!.message.includes("opencode.json") && fs[0]!.message.includes('"*"'), fs[0]!.message);
  });

// --- The other codes, one planted fault each -----------------------------------------------------------

const OTHER: { code: string; target: Target; fault: string; plant: (f: Files) => void; named: string }[] = [
  { code: "TGT-AGENT-001", target: "opencode", fault: "sdd-critic allowed to start agents", plant: (f) => editJson(f, OC.config, (j) => (j.agent["sdd-critic"].permission.task = "allow")), named: '"sdd-critic"' },
  { code: "TGT-AGENT-001", target: "copilot", fault: "the conductor's agents list without sdd-auditor", plant: (f) => setText(f, cpAgent(CONDUCTOR), textOf(f, cpAgent(CONDUCTOR)).replace(/^agents: \[(.*)\]$/m, (_m, l: string) => `agents: [${l.split(", ").filter((x) => x !== "'sdd-auditor'").join(", ")}]`)), named: "nine specialists" },
  { code: "TGT-MODE-001", target: "opencode", fault: "sdd-planner as a primary agent", plant: (f) => setText(f, ocAgent("sdd-planner"), textOf(f, ocAgent("sdd-planner")).replace(/^mode: subagent$/m, "mode: primary")), named: "sdd-planner" },
  { code: "TGT-MODE-001", target: "copilot", fault: "plan.prompt.md bound to sdd-planner", plant: (f) => setText(f, cpPrompt("plan"), textOf(f, cpPrompt("plan")).replace(/^agent: sdd-conductor$/m, "agent: sdd-planner")), named: "plan.prompt.md" },
  { code: "TGT-MEM-001", target: "copilot", fault: "a memory field in sdd-architect.agent.md", plant: (f) => insertLine(f, cpAgent("sdd-architect"), 2, "memory: user"), named: "sdd-architect" },
  { code: "TGT-HOOK-001", target: "copilot", fault: "a second PreToolUse entry", plant: (f) => editJson(f, CP.hooks, (j) => j.hooks.PreToolUse.push({ command: 'node "@CLI_COPY@" hook guard --host copilot --mode copilot-hooks --agents sdd-conductor', type: "command" })), named: "PreToolUse" },
  { code: "TGT-CLASS-001", target: "copilot", fault: "Bash removed from the tool classes", plant: (f) => editJson(f, "hooks/tool-classes.json", (j) => (j.terminal = j.terminal.filter((e: { tool: string }) => e.tool !== "Bash"))), named: '"Bash"' },
];

for (const row of OTHER)
  test(`${row.code}: ${row.target} package with ${row.fault} is reported`, () => {
    const fs = check(row.target, bad(row.target, row.plant));
    const hit = withCode(fs, row.code);
    assert.ok(hit.length >= 1, show(fs));
    assert.ok(hit.some((f) => f.message.includes(row.named)), show(hit));
  });

// --- Fresh generation and no change-folder path --------------------------------------------------------

test("C002-TC-603 (C002-TS-603): a dist/ of an earlier run with ${CLAUDE_PLUGIN_ROOT} in sdd-auditor.md is not what the checks read", () => {
  const copy = pluginCopy();
  try {
    const stale = join(copy.repo, "dist", "opencode", ".opencode", "agents");
    mkdirSync(stale, { recursive: true });
    writeFileSync(join(stale, "sdd-auditor.md"), "---\ndescription: old\n---\n\nRun ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs\n");
    const r = runTargetChecks({ plugin: copy.plugin });
    assert.deepEqual((r.findings as Finding[]).filter((f) => (f.path ?? "").includes("sdd-auditor.md")), []);
    assert.deepEqual(r.findings, [], show(r.findings as Finding[]));
    assert.ok(!r.log.some((p: string) => p.startsWith(join(copy.repo, "dist"))), "nothing read from the repository's dist/");
  } finally {
    copy.cleanup();
  }
});

test("C002-TC-607 (C002-TS-607): with CHG-001 moved to .sdd/_archive/ the checks report the same findings and read nothing under .sdd/", () => {
  const repo = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-tgt-archive-")));
  try {
    cpSync(PLUGIN, join(repo, "plugins", "architect"), { recursive: true });
    const archived = join(repo, ".sdd", "_archive", "001-architect-agent-suite", "10-spec", "50-interfaces");
    mkdirSync(archived, { recursive: true });
    cpSync(join(root, ".sdd", "001-architect-agent-suite", "10-spec", "50-interfaces"), archived, { recursive: true });
    const moved = runTargetChecks({ plugin: join(repo, "plugins", "architect") });
    const unmoved = runTargetChecks({ plugin: PLUGIN });
    const norm = (fs: Finding[]) => fs.map((f) => `${f.code} ${f.target} ${f.path}:${f.line} ${f.message}`).sort();
    assert.deepEqual(norm(moved.findings as Finding[]), norm(unmoved.findings as Finding[]));
    assert.ok(moved.log.length > 0, "the file-access log records the reads");
    for (const r of [moved, unmoved]) assert.deepEqual(r.log.filter((p: string) => p.split(sep).includes(".sdd")), [], "no read under .sdd/");
    // No check module names a change folder.
    const dir = join(root, "scripts", "check", "targets");
    for (const n of readdirSync(dir)) assert.ok(!/\.sdd[\\/]|\d{3}-architect-agent-suite/.test(readFileSync(join(dir, n), "utf8")), `${n} names no change folder`);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
