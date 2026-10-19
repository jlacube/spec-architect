// OpenCode-host replay scenarios (C002-COMP-008): cases that need OpenCode itself at its tested version,
// driven through the replay adapter of the mechanism `opencode-permissions` (C002-T-042, scripted-model
// driver of C002-ADR-005). The file uses the adapter interface of C002-T-040 (../adapter.ts) and selects
// the adapter by its mechanism name at run time from the registry of ../main.ts, with the package mode a
// scenario needs: the S-07 record's mode (fx-oc as released), or the native rules that the replay of the
// mechanism decides. Run by `npm run replay -- opencode-host`, never by `npm test` (scripts/test.mjs
// leaves tests/replay/ out).
//   C002-TC-133 (C002-T-026)  adopter MCP server tool not available to an Architect agent
//   C002-TC-226 (C002-T-029)  built-in commands kept beside the 13 architect-<name> commands
//   C002-TC-207 (C002-T-030)  @mode-native: edit decisions of the OpenCode permission engine on fx-oc
//   C002-TC-209 (C002-T-030)  @mode-native: bash decisions of the OpenCode permission engine
//   C002-TC-211 (C002-T-030)  the adopter's own agent my-build keeps its edit right
//   C002-TC-213 (C002-T-030)  @mode-server: the built-in edit tool refused even inside .sdd/
//   C002-TC-222 (C002-T-030)  @mode-native: the quick-lint plugin returns LINT-EARS-002 after a write
//   C002-TC-223 (C002-T-030)  @mode-native: a clean file gives no finding line
//   C002-TC-655 (C002-T-042)  Edit cases fed with the fixture file's first line (native rules)
//   C002-TC-630 (C002-T-042)  @mode-native: the identity case BG-258 played by the adopter agent
//   C002-TC-646 (C002-T-042)  @mode-native: unknown architect:sdd-* callers expect allow
//   C002-TC-647 (C002-T-042)  @mode-native: rules that also bind adopter agents are a difference
//   C002-TC-652 (C002-T-042)  @mode-native: the identity case BG-265 played by sdd-conductor
// A `@mode-*` scenario runs only when the OpenCode table's enforcement mode (copied from the S-07
// record) is its mode; otherwise it is skipped as not applicable, citing the record (test plan §1).
import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadTargetTable, type Mode } from "../../../scripts/generate/tables.ts";
import type { BashCase, Corpus, CorpusCase } from "../../guards/fixture.ts";
import { repoRoot } from "../../helpers.ts";
import type { ReplayAdapter, ReplayFixture, ReplayInput } from "../adapter.ts";
import type { Mechanism } from "../expect.ts";
import type { SentCall } from "../adapters/opencode-permissions.ts";
import { ADAPTERS, type AdapterOptions, main } from "../main.ts";
import type { ReplayReport, ReportCase } from "../report.ts";
import { buildReplayFixture, DEFAULT_PATH_CORPUS, DEFAULT_SHELL_CORPUS, loadCorpora, runReplay } from "../suite.ts";

/** The mechanism whose adapter drives OpenCode (C002-IF-009 §2.2). */
const MECHANISM: Mechanism = "opencode-permissions";

/**
 * The OpenCode-host adapter, or null (scenario skipped) while no adapter is registered. Default: the
 * package of the enforcement mode that the S-07 record fixes (fx-oc as released).
 */
async function openCodeHost(t: TestContext, options?: AdapterOptions): Promise<ReplayAdapter | null> {
  const make = ADAPTERS[MECHANISM];
  if (!make) {
    t.skip(`no ${MECHANISM} replay adapter registered yet (C002-T-042)`);
    return null;
  }
  return make(options ?? { mode: RECORD_MODE });
}

/**
 * fx-oc with `fx-fs` (C002-TS-133): the replay fixture plus the adopter's own `opencode.json`, which
 * declares, outside the Architect agents' entries, the local MCP server `fx-fs` whose tool `write_file`
 * writes any path and logs every call to `<base>/fx-fs/calls.log`.
 */
function plantFxFs(fx: ReplayFixture): { log: string } {
  const dir = `${fx.base}/fx-fs`;
  mkdirSync(dir, { recursive: true });
  const log = `${dir}/calls.log`;
  writeFileSync(
    `${dir}/server.mjs`,
    [
      'import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";',
      'import { dirname, resolve } from "node:path";',
      'import { createInterface } from "node:readline";',
      `const LOG = ${JSON.stringify(log)};`,
      "const send = (m) => process.stdout.write(JSON.stringify({ jsonrpc: \"2.0\", ...m }) + \"\\n\");",
      "createInterface({ input: process.stdin }).on(\"line\", (line) => {",
      "  let msg; try { msg = JSON.parse(line); } catch { return; }",
      "  if (msg.id === undefined) return;",
      "  if (msg.method === \"initialize\") send({ id: msg.id, result: { protocolVersion: msg.params?.protocolVersion ?? \"2025-06-18\", capabilities: { tools: {} }, serverInfo: { name: \"fx-fs\", version: \"1.0.0\" } } });",
      "  else if (msg.method === \"tools/list\") send({ id: msg.id, result: { tools: [{ name: \"write_file\", description: \"Writes any file.\", inputSchema: { type: \"object\", properties: { path: { type: \"string\" }, content: { type: \"string\" } }, required: [\"path\", \"content\"] } }] } });",
      "  else if (msg.method === \"tools/call\") {",
      "    appendFileSync(LOG, JSON.stringify(msg.params) + \"\\n\");",
      "    const p = resolve(String(msg.params?.arguments?.path ?? \"\")); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, String(msg.params?.arguments?.content ?? \"\"));",
      "    send({ id: msg.id, result: { content: [{ type: \"text\", text: \"written\" }] } });",
      "  } else send({ id: msg.id, result: {} });",
      "});",
      "",
    ].join("\n"),
  );
  const config = { $schema: "https://opencode.ai/config.json", mcp: { "fx-fs": { type: "local", command: ["node", `${dir}/server.mjs`] } } };
  writeFileSync(`${fx.repo}/opencode.json`, JSON.stringify(config, null, 2) + "\n");
  return { log };
}

test("C002-TC-133 (C002-TS-133): the adopter's MCP tool fx-fs write_file is not available to sdd-spec-writer on OpenCode", async (t) => {
  const adapter = await openCodeHost(t);
  if (!adapter) return;
  const fx = buildReplayFixture(loadCorpora().path.corpus.fixture);
  try {
    const { log } = plantFxFs(fx);
    const target = `${fx.repo}/src/app.ts`;
    const before = readFileSync(target, "utf8");
    await adapter.setup(fx);
    try {
      const tool = "fx-fs_write_file";
      if (adapter.grants) assert.equal(adapter.grants("sdd-spec-writer", tool), false, "the package grants sdd-spec-writer no fx-fs tool");
      const c: CorpusCase = { id: "TS-133", category: "outside", tool, agent: "architect:sdd-spec-writer", path: "{repo}/src/app.ts", expect: "deny" };
      const input: ReplayInput = {
        id: c.id,
        corpus: "path",
        category: c.category,
        case: c,
        tool,
        caller: "sdd-spec-writer",
        cwd: fx.repo,
        path: target,
        field: "path",
        dialect: "bash",
        malformed: false,
        resolve: fx.resolvePath,
      };
      const d = await adapter.decide(input);
      assert.equal(d.actual, "deny", `the call is not carried out (${d.tool}${d.detail ? `: ${d.detail}` : ""})`);
    } finally {
      await adapter.teardown();
    }
    const calls = existsSync(log) ? readFileSync(log, "utf8").split("\n").filter((l) => l.includes("write_file")) : [];
    assert.deepEqual(calls, [], "fx-fs received no write_file call from the session");
    assert.equal(readFileSync(target, "utf8"), before, "src/app.ts is unchanged");
  } finally {
    fx.cleanup();
  }
});

/** One entry of the command list of the OpenCode server API (`GET /command`). */
interface HostCommand {
  name: string;
  description?: string;
  agent?: string;
}

/**
 * The command list of a running OpenCode session, read through the session driver without a model call
 * (C002-T-042 step 1). Not part of the adapter interface of C002-T-040: an adapter that offers it has a
 * `commands()` method; until then the scenario is skipped.
 */
type CommandLister = ReplayAdapter & { commands?: () => Promise<HostCommand[]> };

test("C002-TC-226 (C002-TS-226): the session lists the 13 architect-<name> commands bound to sdd-conductor beside OpenCode's built-in init and new", async (t) => {
  const adapter = (await openCodeHost(t)) as CommandLister | null;
  if (!adapter) return;
  if (typeof adapter.commands !== "function") {
    t.skip(`the ${MECHANISM} adapter does not read the command list yet (C002-T-042 step 1)`);
    return;
  }
  const names = readdirSync(join(repoRoot(), "plugins", "architect", "commands"))
    .filter((n) => n.endsWith(".md"))
    .map((n) => n.slice(0, -".md".length))
    .sort();
  assert.equal(names.length, 13);
  const fx = buildReplayFixture(loadCorpora().path.corpus.fixture);
  try {
    await adapter.setup(fx);
    let list: HostCommand[];
    try {
      list = await adapter.commands();
    } finally {
      await adapter.teardown();
    }
    const byName = new Map(list.map((c) => [c.name, c]));
    for (const n of names) {
      const c = byName.get(`architect-${n}`);
      assert.ok(c, `architect-${n} is listed`);
      assert.equal(c.agent, "sdd-conductor", `architect-${n} is bound to sdd-conductor`);
    }
    assert.deepEqual(list.filter((c) => c.name.startsWith("architect-")).map((c) => c.name).sort(), names.map((n) => `architect-${n}`), "exactly the 13 Architect commands");
    const architect = new Set(list.filter((c) => c.name.startsWith("architect-")).map((c) => c.description));
    for (const builtIn of ["init", "new"]) {
      const c = byName.get(builtIn);
      assert.ok(c, `the built-in command ${builtIn} is listed`);
      assert.notEqual(c.agent, "sdd-conductor", `${builtIn} is OpenCode's own, not bound to the conductor`);
      assert.ok(!architect.has(c.description), `${builtIn} keeps OpenCode's own description`);
    }
  } finally {
    fx.cleanup();
  }
});

// --- C002-T-030: permission rules and the quick-lint plugin -------------------------------------------

/** The enforcement mode the S-07 record fixes, as the OpenCode table carries it (C002-T-043 copies it). */
const RECORD_MODE: Mode = loadTargetTable(repoRoot(), "opencode").enforcement_mode;

/** False (scenario skipped as not applicable) when the scenario's `@mode-*` tag is not the record's mode. */
function inMode(t: TestContext, mode: Mode): boolean {
  if (RECORD_MODE === mode) return true;
  t.skip(`not applicable: a ${mode} scenario, and the S-07 record fixes ${RECORD_MODE} (docs/spikes/S-07-opencode.md)`);
  return false;
}

const WIN = process.platform === "win32";
const REQ_FILE = ".sdd/002-x/10-spec/20-capabilities/CAP-01-x/requirements.md";

/**
 * fx-oc (CAP-02 acceptance, fixture paths): the replay fixture with change `002-x` in phase `10-spec`,
 * `src/app.ts`, `README.md`, `.sdd/002-x/10-spec/a.md` holding `x`, and the link `.sdd/link-to-src` to
 * `src/` (a junction on Windows, as S-07 probed it).
 */
function plantFxOc(fx: ReplayFixture): void {
  const at = (p: string) => `${fx.repo}/${p}`;
  mkdirSync(at(".sdd/002-x/10-spec/20-capabilities/CAP-01-x"), { recursive: true });
  mkdirSync(at("src"), { recursive: true });
  if (!existsSync(at("src/app.ts"))) writeFileSync(at("src/app.ts"), "export const app = 1;\n");
  if (!existsSync(at("README.md"))) writeFileSync(at("README.md"), "# fx-oc\n");
  if (!existsSync(at(".sdd/002-x/10-spec/a.md"))) writeFileSync(at(".sdd/002-x/10-spec/a.md"), "x");
  if (!existsSync(at(".sdd/link-to-src"))) symlinkSync(at("src"), at(".sdd/link-to-src"), WIN ? "junction" : "dir");
}

/** A path case for an agent: `Write` (OpenCode `write`, decided by the `edit` rules) on `<repo>/<rel>` as written. */
function pathInput(fx: ReplayFixture, id: string, caller: string, rel: string, expect: "allow" | "deny", tool = "Write"): ReplayInput {
  const c: CorpusCase = { id, category: "scenario", tool, agent: caller.startsWith("sdd-") ? `architect:${caller}` : caller, path: `{repo}/${rel}`, expect };
  return { id, corpus: "path", category: c.category, case: c, tool, caller, cwd: fx.repo, path: `${fx.repo}/${rel}`, field: "file_path", dialect: "bash", malformed: false, resolve: fx.resolvePath };
}

/** A shell case of an agent on OpenCode's one shell tool. */
function shellInput(fx: ReplayFixture, id: string, caller: string, command: string, expect: "allow" | "deny"): ReplayInput {
  const c: BashCase = { id, category: "scenario", tool: "Bash", agent: `architect:${caller}`, command, expect };
  return { id, corpus: "shell", category: c.category, case: c, tool: "Bash", caller, cwd: fx.repo, command, dialect: "bash", malformed: false, resolve: fx.resolveShell };
}

/** Sets the fixture up, runs `body` with the adapter, tears down and removes the fixture. */
async function withFxOc(adapter: ReplayAdapter, body: (fx: ReplayFixture) => Promise<void>, plant?: (fx: ReplayFixture) => void): Promise<void> {
  const fx = buildReplayFixture(loadCorpora().path.corpus.fixture);
  try {
    plantFxOc(fx);
    plant?.(fx);
    await adapter.setup(fx);
    try {
      await body(fx);
    } finally {
      await adapter.teardown();
    }
  } finally {
    fx.cleanup();
  }
}

const TS_207: [string, string, "allow" | "deny"][] = [
  ["sdd-spec-writer", ".sdd/002-x/10-spec/a.md", "allow"],
  ["sdd-spec-writer", "src/app.ts", "deny"],
  ["sdd-conductor", "README.md", "deny"],
  ["sdd-planner", ".sdd/../src/app.ts", "deny"],
  ["sdd-architect", ".sdd/link-to-src/app.ts", "deny"],
  ["sdd-cartographer", ".claude/agent-memory/architect-sdd-cartographer/MEMORY.md", "deny"],
];

test("C002-TC-207 (C002-TS-207) @mode-native: OpenCode allows edits inside .sdd/ only (.., the link to src/, the memory folder denied)", async (t) => {
  if (!inMode(t, "native-permissions")) return;
  const adapter = await openCodeHost(t);
  if (!adapter) return;
  await withFxOc(adapter, async (fx) => {
    const before = readFileSync(`${fx.repo}/src/app.ts`, "utf8");
    for (const [i, [agent, rel, expected]] of TS_207.entries()) {
      const d = await adapter.decide(pathInput(fx, `TS-207-${i + 1}`, agent, rel, expected));
      assert.equal(d.actual, expected, `${agent} on ${rel} (${d.tool}${d.detail ? `: ${d.detail}` : ""})`);
    }
    assert.equal(readFileSync(`${fx.repo}/src/app.ts`, "utf8"), before, "src/app.ts is unchanged");
    assert.ok(!existsSync(`${fx.repo}/.claude/agent-memory/architect-sdd-cartographer/MEMORY.md`), "nothing written into the memory folder");
  });
});

const TS_209: [string, "allow" | "deny"][] = [
  ["sdd lint 002", "allow"],
  ["git log --oneline -5", "allow"],
  ["node --version", "allow"],
  ["npm install", "deny"],
  ["git status && rm -rf src", "deny"],
  ["sdd status > out.txt", "deny"],
  ["Remove-Item -Recurse src", "deny"],
];

test("C002-TC-209 (C002-TS-209) @mode-native: OpenCode allows the allowlisted commands of sdd-planner only (chain, redirection, PowerShell denied)", async (t) => {
  if (!inMode(t, "native-permissions")) return;
  const adapter = await openCodeHost(t);
  if (!adapter) return;
  await withFxOc(adapter, async (fx) => {
    for (const [i, [command, expected]] of TS_209.entries()) {
      const d = await adapter.decide(shellInput(fx, `TS-209-${i + 1}`, "sdd-planner", command, expected));
      assert.equal(d.actual, expected, `${command} (${d.tool}${d.detail ? `: ${d.detail}` : ""})`);
    }
    assert.ok(existsSync(`${fx.repo}/src/app.ts`), "src/ is still there");
    assert.ok(!existsSync(`${fx.repo}/out.txt`), "no redirection target written");
  });
});

test("C002-TC-211 (C002-TS-211): the adopter's own agent my-build keeps its edit right on src/app.ts", async (t) => {
  const adapter = await openCodeHost(t);
  if (!adapter) return;
  let before = "";
  await withFxOc(
    adapter,
    async (fx) => {
      const d = await adapter.decide(pathInput(fx, "TS-211", "my-build", "src/app.ts", "allow"));
      assert.equal(d.actual, "allow", `${d.tool}${d.detail ? `: ${d.detail}` : ""}`);
      assert.notEqual(readFileSync(`${fx.repo}/src/app.ts`, "utf8"), before, "src/app.ts holds the new content");
    },
    (fx) => {
      // The adopter's own opencode.json, beside the package's: my-build with edit set to allow (C002-REQ-208).
      const config = { $schema: "https://opencode.ai/config.json", agent: { "my-build": { mode: "primary", description: "Adopter build agent", permission: { edit: "allow" } } } };
      writeFileSync(`${fx.repo}/opencode.json`, JSON.stringify(config, null, 2) + "\n");
      before = readFileSync(`${fx.repo}/src/app.ts`, "utf8");
    },
  );
});

test("C002-TC-213 (C002-TS-213) @mode-server: the built-in edit tool is refused to sdd-spec-writer even inside .sdd/", async (t) => {
  if (!inMode(t, "sdd-mcp-server")) return;
  const adapter = await openCodeHost(t);
  if (!adapter) return;
  await withFxOc(adapter, async (fx) => {
    const file = `${fx.repo}/.sdd/002-x/10-spec/a.md`;
    const before = readFileSync(file, "utf8");
    const d = await adapter.decide(pathInput(fx, "TS-213", "sdd-spec-writer", ".sdd/002-x/10-spec/a.md", "deny", "Edit"));
    assert.equal(d.actual, "deny", `${d.tool}${d.detail ? `: ${d.detail}` : ""}`);
    assert.equal(readFileSync(file, "utf8"), before, ".sdd/002-x/10-spec/a.md is unchanged");
  });
});

/**
 * A write of given content by an agent and the tool result the agent sees (C002-TS-222, C002-TS-223).
 * Not part of the adapter interface of C002-T-040: an adapter that offers it has `writeFile()`; until
 * then the scenarios are skipped.
 */
type ResultReader = ReplayAdapter & { writeFile?: (agent: string, path: string, content: string) => Promise<{ actual: "allow" | "deny" | "error"; output: string }> };

function requirementsFile(statement: string): string {
  return (
    "---\nid: C002-CAP-01\nartifact: spec/requirements\n---\n\n" +
    `### C002-REQ-001 — Thing 1\n- **Pattern:** ubiquitous\n- **Statement:** ${statement}\n- **Rationale:** r\n` +
    "- **Stories:** C002-US-001\n- **Priority:** Must\n- **Acceptance:** C002-AC-001.1\n\n"
  );
}

async function quickLintCase(t: TestContext, statement: string, check: (output: string) => void): Promise<void> {
  if (!inMode(t, "native-permissions")) return;
  const adapter = (await openCodeHost(t)) as ResultReader | null;
  if (!adapter) return;
  if (typeof adapter.writeFile !== "function") {
    t.skip(`the ${MECHANISM} adapter does not return tool results yet (C002-T-042)`);
    return;
  }
  const writeFile = adapter.writeFile.bind(adapter);
  await withFxOc(adapter, async (fx) => {
    const r = await writeFile("sdd-spec-writer", `${fx.repo}/${REQ_FILE}`, requirementsFile(statement));
    assert.equal(r.actual, "allow", r.output);
    check(r.output);
  });
}

test("C002-TC-222 (C002-TS-222) @mode-native: after a write with two SHALL the result returned to sdd-spec-writer holds LINT-EARS-002 and the file's path", async (t) => {
  await quickLintCase(t, "THE sdd CLI SHALL write the file and SHALL print its path.", (output) => {
    const line = output.split("\n").find((l) => l.includes("LINT-EARS-002"));
    assert.ok(line, output);
    assert.ok(line.includes(REQ_FILE) || output.includes(REQ_FILE), `the finding names ${REQ_FILE}: ${output}`);
  });
});

test("C002-TC-223 (C002-TS-223) @mode-native: a clean requirements file gives no finding line", async (t) => {
  await quickLintCase(t, "THE sdd CLI SHALL write the file.", (output) => {
    assert.ok(!/^(error|warn|info) [A-Z]+-[A-Z0-9-]+ /m.test(output), output);
    assert.ok(!output.includes("sdd quick lint of"), output);
  });
});

// --- C002-T-042: the replay of the OpenCode permission rules ------------------------------------------

const NATIVE: AdapterOptions = { mode: "native-permissions" };

/** Corpus files holding only the named cases (each corpus keeps at least one case, as the report schema needs). */
function plantCorpora(dir: string, pathIds: string[], shellIds: string[]): { path: string; shell: string } {
  const path = JSON.parse(readFileSync(DEFAULT_PATH_CORPUS, "utf8")) as Corpus;
  path.cases = path.cases.filter((c) => pathIds.includes(c.id));
  const shell = JSON.parse(readFileSync(DEFAULT_SHELL_CORPUS, "utf8")) as { cases: BashCase[] };
  shell.cases = shell.cases.filter((c) => shellIds.includes(c.id));
  assert.equal(path.cases.length + shell.cases.length, pathIds.length + shellIds.length, "every named case is in the corpora");
  writeFileSync(join(dir, "path-corpus.json"), JSON.stringify(path));
  writeFileSync(join(dir, "bash-corpus.json"), JSON.stringify(shell));
  return { path: join(dir, "path-corpus.json"), shell: join(dir, "bash-corpus.json") };
}

interface NamedReplay {
  report: ReplayReport;
  repo: string;
  srcAfter: boolean;
  calls: SentCall[];
}

/** Replays the named corpus cases through the adapter (a replay report as `npm run replay` writes it). */
async function replayNamed(adapter: ReplayAdapter, pathIds: string[], shellIds: string[]): Promise<NamedReplay> {
  const dir = mkdtempSync(join(tmpdir(), "sdd-oc-scenario-"));
  try {
    const files = plantCorpora(dir, pathIds, shellIds);
    let repo = "";
    let srcAfter = false;
    const { report, problems } = await runReplay(adapter, {
      pathCorpus: files.path,
      shellCorpus: files.shell,
      afterRun: (fx) => {
        repo = fx.repo;
        srcAfter = existsSync(`${fx.repo}/src`);
      },
    });
    assert.deepEqual(problems, [], "the report validates and lists every case once");
    return { report, repo, srcAfter, calls: [...((adapter as ReplayAdapter & { calls?: SentCall[] }).calls ?? [])] };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const caseOf = (report: ReplayReport, id: string): ReportCase => {
  const e = report.cases.find((c) => c.id === id);
  assert.ok(e, `${id} is a replayed case`);
  return e;
};

const TS_655: [string, string, string, "allow" | "deny"][] = [
  ["PG-004", "sdd-conductor", ".sdd/004-x/existing.md", "allow"],
  ["PG-003", "sdd-conductor", ".sdd/004-x/a.md", "allow"],
  ["PG-050", "sdd-researcher", "README.md", "deny"],
];

test("C002-TC-655 (C002-TS-655): Edit cases are fed to OpenCode with the fixture file's first line as oldString", async (t) => {
  const adapter = await openCodeHost(t, NATIVE);
  if (!adapter) return;
  const { report, repo, calls } = await replayNamed(adapter, TS_655.map(([id]) => id), ["BG-265"]);
  for (const [id, agent, rel, expected] of TS_655) {
    const call = calls.find((c) => c.id === id);
    assert.ok(call, `${id} was sent`);
    assert.equal(call.tool, "edit", id);
    const args = call.args as { filePath: string; oldString: string; newString: string };
    assert.equal(args.filePath, `${repo}/${rel}`, `${id} carries the path`);
    assert.equal(typeof call.before, "string", `the replay fixture holds ${rel} before the call`);
    assert.equal(args.oldString, (call.before as string).split(/\r?\n/)[0], `${id}: oldString is the file's first line`);
    assert.ok(args.newString !== args.oldString && !/[\r\n]/.test(args.newString), `${id}: newString is another one-line text`);
    const e = caseOf(report, id);
    // Played by its own agent, or by the conductor where the package does not grant that agent edit (§2.2).
    assert.ok([agent, "sdd-conductor"].includes(e.fed_as.caller), `${id} caller ${e.fed_as.caller}`);
    assert.deepEqual([e.expected, e.actual], [expected, expected], `${id}: ${e.detail ?? ""}`);
    assert.ok(!(e.detail ?? "").includes("Could not find oldString"), `${id}: ${e.detail}`);
  }
  assert.deepEqual(report.host_versions, { opencode: loadTargetTable(repoRoot(), "opencode").host.tested_versions["opencode"] });
});

test("C002-TC-630 (C002-TS-630) @mode-native: the identity case BG-258 runs as a call of the adopter agent and is allowed", async (t) => {
  if (!inMode(t, "native-permissions")) return;
  const adapter = await openCodeHost(t, NATIVE);
  if (!adapter) return;
  const { report } = await replayNamed(adapter, ["PG-225"], ["BG-258"]);
  const e = caseOf(report, "BG-258");
  assert.equal(e.fed_as.caller, "adopter-agent");
  assert.deepEqual([e.expected, e.expected_source, e.actual], ["allow", "corpus", "allow"], e.detail);
  assert.deepEqual(report.not_applicable, []);
});

test("C002-TC-646 (C002-TS-646) @mode-native: unknown architect:sdd-* callers run as the adopter agent and expect allow", async (t) => {
  if (!inMode(t, "native-permissions")) return;
  const adapter = await openCodeHost(t, NATIVE);
  if (!adapter) return;
  const { report } = await replayNamed(adapter, ["PG-237", "PG-238"], ["BG-265"]);
  for (const id of ["PG-237", "PG-238"]) {
    const e = caseOf(report, id);
    assert.equal(e.fed_as.caller, "adopter-agent", id);
    assert.deepEqual([e.expected, e.expected_source, e.actual], ["allow", "C002-REQ-632", "allow"], `${id}: ${e.detail ?? ""}`);
  }
  const corpus = loadCorpora().path.corpus.cases;
  for (const id of ["PG-237", "PG-238"]) assert.equal(corpus.find((c) => c.id === id)!.expect, "deny", `the corpus still records deny for ${id}`);
});

test("C002-TC-647 (C002-TS-647) @mode-native: rules that also bind adopter agents make PG-237 a differing decision", async (t) => {
  if (!inMode(t, "native-permissions")) return;
  if (!ADAPTERS[MECHANISM]) {
    t.skip(`no ${MECHANISM} replay adapter registered yet (C002-T-042)`);
    return;
  }
  const dir = mkdtempSync(join(tmpdir(), "sdd-oc-ts647-"));
  try {
    const files = plantCorpora(dir, ["PG-237"], ["BG-265"]);
    const log: string[] = [];
    const code = await main(["--mechanism", MECHANISM, "--seed", "bind-adopters", "--path-corpus", files.path, "--shell-corpus", files.shell, "--out", dir], (l) => log.push(l));
    const report = JSON.parse(readFileSync(join(dir, `replay-${MECHANISM}.json`), "utf8")) as ReplayReport;
    const e = caseOf(report, "PG-237");
    assert.deepEqual([e.expected, e.actual], ["allow", "deny"], e.detail);
    assert.ok(report.differing >= 1);
    assert.ok(log.some((l) => l.includes("differing PG-237")), log.join("\n"));
    assert.notEqual(code, 0, "the suite exits non-zero");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("C002-TC-652 (C002-TS-652) @mode-native: the identity case BG-265 runs as sdd-conductor and is denied", async (t) => {
  if (!inMode(t, "native-permissions")) return;
  const adapter = await openCodeHost(t, NATIVE);
  if (!adapter) return;
  const { report, srcAfter } = await replayNamed(adapter, ["PG-225"], ["BG-265"]);
  const e = caseOf(report, "BG-265");
  assert.equal(e.fed_as.caller, "sdd-conductor", "played by the generated agent, not the adopter agent");
  assert.deepEqual([e.expected, e.expected_source, e.actual], ["deny", "corpus", "deny"], e.detail);
  assert.ok(srcAfter, "{repo}/src still exists");
});
