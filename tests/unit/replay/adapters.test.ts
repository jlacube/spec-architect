// C002-T-041: the replay adapters of `sdd-mcp-server` and `copilot-hooks` on a sample of the corpora
// (C002-IF-009 §2.2 input per mechanism, §2.3 decision reading). The sample holds cases of every row of
// the §2.2 table (Write, Edit, NotebookEdit, Read, Bash of the path corpus, Bash and PowerShell of the
// shell corpus, raw stdin, the C002-REQ-630 cases), a case with its own cwd, memory cases, environment
// stubs and identity cases (not applicable). The server is the built bundle with the CLI beside it
// (tests/integration/mcp/client.ts) instead of an install of the tarball; the Copilot hooks adapter
// generates and installs the hooks-fallback package as in the release run. C002-TC-667 (C002-T-064): the
// server decision read from the text of a text-only error result, against a stub server per Examples row.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BashCase, Corpus } from "../../guards/fixture.ts";
import { serverBundle } from "../../integration/mcp/client.ts";
import { type CopilotHooksAdapter, createCopilotHooksAdapter, readHookDecision } from "../../replay/adapters/copilot-hooks.ts";
import { createMcpServerAdapter, type McpServerAdapter, readServerDecision } from "../../replay/adapters/sdd-mcp-server.ts";
import type { ReplayReport, ReportCase } from "../../replay/report.ts";
import { DEFAULT_PATH_CORPUS, DEFAULT_SHELL_CORPUS, type ReplayResult, runReplay } from "../../replay/suite.ts";

const PATH_IDS = ["PG-003", "PG-004", "PG-050", "PG-042", "PG-083", "PG-129", "PG-134", "PG-205", "PG-224", "PG-237", "PG-241", "PG-243", "PG-245", "PG-249", "PG-252", "PG-253", "PG-254", "PG-256"];
const SHELL_IDS = ["BG-115", "BG-243", "BG-279", "BG-280", "BG-286", "BG-265", "BG-269", "BG-271", "BG-276", "BG-277", "BG-374", "BG-405"];

let dir: string;
let pathCorpus: string;
let shellCorpus: string;

before(() => {
  dir = mkdtempSync(join(tmpdir(), "sdd-replay-adapters-"));
  const p = JSON.parse(readFileSync(DEFAULT_PATH_CORPUS, "utf8")) as Corpus;
  p.cases = p.cases.filter((c) => PATH_IDS.includes(c.id));
  const s = JSON.parse(readFileSync(DEFAULT_SHELL_CORPUS, "utf8")) as { cases: BashCase[] };
  s.cases = s.cases.filter((c) => SHELL_IDS.includes(c.id));
  assert.equal(p.cases.length + s.cases.length, PATH_IDS.length + SHELL_IDS.length, "every sample case is in the corpora");
  pathCorpus = join(dir, "path-corpus.json");
  shellCorpus = join(dir, "bash-corpus.json");
  writeFileSync(pathCorpus, JSON.stringify(p));
  writeFileSync(shellCorpus, JSON.stringify(s));
});

after(() => rmSync(dir, { recursive: true, force: true }));

const entry = (report: ReplayReport, id: string): ReportCase => {
  const e = report.cases.find((c) => c.id === id);
  assert.ok(e, `${id} is a replayed case`);
  return e;
};

function assertReport(result: ReplayResult, mechanism: string): void {
  const { report } = result;
  assert.equal(report.mechanism, mechanism);
  assert.deepEqual(result.problems, [], "schema-valid, every case once");
  assert.deepEqual(report.not_applicable.map((n) => n.id).sort(), ["BG-265", "PG-237"], "identity cases only (C002-REQ-626)");
  assert.deepEqual(
    report.cases.filter((c) => c.actual !== c.expected).map((c) => `${c.id}: expected ${c.expected}, got ${c.actual} (${c.detail ?? ""})`),
    [],
    "0 differing decisions",
  );
  for (const id of ["PG-253", "PG-254", "PG-256", "BG-277"]) assert.deepEqual([entry(report, id).expected_source, entry(report, id).fed_as.malformed], ["C002-REQ-630", true], id);
  for (const id of ["PG-205", "PG-224"]) assert.equal(entry(report, id).expected_source, "C002-REQ-625", id);
  assert.equal(entry(report, "PG-224").fed_as.caller, "sdd-conductor", "a memory case of a non-Architect caller is played by the conductor");
  assert.equal(entry(report, "BG-243").fed_as.dialect, "powershell");
  assert.equal(entry(report, "BG-115").fed_as.dialect, "bash");
}

test("C002-T-041 — sdd-mcp-server adapter: each case fed as its server tool call, decided by the server", async () => {
  const { file } = await serverBundle();
  const adapter: McpServerAdapter = createMcpServerAdapter({ serverEntry: file });
  let repo = "";
  const result = await runReplay(adapter, { pathCorpus, shellCorpus, afterRun: (fx) => (repo = fx.repo) });
  assertReport(result, "sdd-mcp-server");
  const { report } = result;
  // The server runs a command without a shell, so its guard call does not expand ${CLAUDE_PLUGIN_DATA}
  // and denies the literal: the Serena-literal row of C002-IF-009 §2.1 (D-014 item 4).
  assert.deepEqual([entry(report, "BG-374").expected, entry(report, "BG-374").expected_source, entry(report, "BG-374").actual], ["deny", "C002-REQ-517", "deny"]);
  const tools = Object.fromEntries(report.cases.map((c) => [c.id, c.fed_as.tool]));
  assert.deepEqual(
    [tools["PG-003"], tools["PG-042"], tools["PG-241"], tools["PG-243"], tools["BG-115"], tools["BG-269"], tools["PG-245"], tools["PG-256"], tools["BG-277"]],
    ["replace_text", "write_file", "read", "run_command", "run_command", "read", "write_file", "write_file", "run_command"],
  );
  const call = (id: string) => adapter.calls.find((c) => c.id === id)!;
  // §2.2: the server takes no working folder per call: the path joined to the case's cwd, unnormalised.
  assert.deepEqual(call("PG-134").args, { path: `${repo}/src/.sdd/a.md`, content: "replay PG-134\n" });
  assert.equal((call("PG-129").args as { path: string }).path, `${repo}/src/../.sdd/a.md`);
  // Edit: the first line of the fixture file as old_text.
  const existing = (JSON.parse(readFileSync(DEFAULT_PATH_CORPUS, "utf8")) as Corpus).fixture.files[".sdd/004-x/existing.md"]!;
  assert.deepEqual(call("PG-004").args, { path: `${repo}/.sdd/004-x/existing.md`, old_text: existing.split("\n")[0], new_text: "replay PG-004" });
  assert.deepEqual(call("BG-243").args, { command: "git log --oneline -5", dialect: "powershell" });
  assert.deepEqual(call("PG-243").args, { command: `git status -- ${repo}/src/app.ts`, dialect: "bash" });
  assert.deepEqual([call("PG-245").args, call("BG-271").args, call("PG-253").args], [{}, {}, {}], "malformed calls carry {} as arguments");
  assert.equal(call("PG-241").profile, null, "Read is not sent to the server");
  assert.match(entry(report, "BG-286").detail ?? "", /^GUARD-BASH-002/);
  assert.match(entry(report, "PG-050").detail ?? "", /^GUARD-PATH-001/);
  assert.match(entry(report, "PG-245").detail ?? "", /invalid arguments for write_file/, "ERR-MCP-001 is a deny");
});

test("C002-T-041 — copilot-hooks adapter: Copilot-shaped hook input run through the installed PreToolUse command", async () => {
  const adapter: CopilotHooksAdapter = createCopilotHooksAdapter();
  let repo = "";
  let command: { script: string; args: string[] } | undefined;
  const result = await runReplay(adapter, {
    pathCorpus,
    shellCorpus,
    afterRun: (fx) => {
      repo = fx.repo;
      command = adapter.command();
    },
  });
  assertReport(result, "copilot-hooks");
  assert.equal(result.report.target, "copilot");
  // The Copilot guard hooks keep the corpus expectation of the Serena-literal case (§2.1).
  assert.deepEqual([entry(result.report, "BG-374").expected, entry(result.report, "BG-374").expected_source, entry(result.report, "BG-374").actual], ["allow", "corpus", "allow"]);
  assert.ok(command, "the installed command was read");
  assert.match(command.script, /pkg-cp-hooks\/scripts\/sdd\.mjs$/);
  assert.deepEqual(command.args.slice(0, 6), ["hook", "guard", "--host", "copilot", "--mode", "copilot-hooks"]);
  const sent = (id: string) => {
    const c = adapter.calls.find((x) => x.id === id)!;
    return { ...c, input: c.stdin.startsWith("{") ? (JSON.parse(c.stdin) as Record<string, unknown>) : null };
  };
  // §2.2: the case's cwd in the input's cwd, the path as written, agent_type as VS Code reports it.
  const pg134 = sent("PG-134").input!;
  assert.deepEqual([pg134["cwd"], pg134["tool_name"], (pg134["tool_input"] as { path: string }).path, pg134["agent_type"]], [`${repo}/src`, "Write", ".sdd/a.md", "sdd-spec-writer"]);
  assert.equal(sent("PG-003").input!["tool_name"], "Write", "Edit maps to the write class");
  assert.equal(sent("PG-241").input!["tool_name"], "Glob", "Read maps to the read_only class");
  assert.deepEqual([sent("BG-243").input!["tool_name"], (sent("BG-243").input!["tool_input"] as { command: string }).command, sent("BG-243").dialect], ["Bash", "git log --oneline -5", "powershell"]);
  assert.equal(sent("BG-115").dialect, "bash");
  assert.equal(sent("PG-245").stdin, "", "raw stdin unchanged");
  assert.ok(!("cwd" in sent("PG-253").input!), "no cwd");
  assert.equal(sent("PG-254").input!["cwd"], "", "empty cwd");
  assert.ok(!("tool_name" in sent("PG-256").input!), "no tool name");
  assert.match(entry(result.report, "PG-050").detail ?? "", /^GUARD-PATH-001/);
});

test("C002-T-041 — decision reading of the server (C002-IF-009 §2.3, text-only error results of D-017)", () => {
  const err = (code: string) => ({ id: 1, result: { isError: true, content: [{ type: "text", text: `${code}: a message` }] } });
  for (const code of ["GUARD-PATH-001", "GUARD-BASH-001", "GUARD-BASH-002", "ERR-MCP-001"]) assert.equal(readServerDecision(err(code)).actual, "deny", code);
  for (const code of ["ERR-MCP-003", "ERR-MCP-004", "ERR-MCP-005", "ERR-MCP-006"]) assert.equal(readServerDecision(err(code)).actual, "allow", code);
  assert.equal(readServerDecision(err("ERR-MCP-003")).detail, "ERR-MCP-003: a message", "detail holds the result's text");
  for (const code of ["ERR-MCP-002", "ERR-MCP-007", "GUARD-HOOK-001"]) assert.equal(readServerDecision(err(code)).actual, "error", code);
  // A former structured error result: its structuredContent code is not read (§2.3: the code is in the text).
  assert.equal(readServerDecision({ id: 1, result: { isError: true, content: [{ type: "text", text: "denied" }], structuredContent: { code: "GUARD-PATH-001" } } }).actual, "error");
  assert.equal(readServerDecision({ id: 1, result: { content: [{ type: "text", text: "exit 0" }], structuredContent: { status: "timed_out" } } }).actual, "allow");
  assert.equal(readServerDecision({ id: 1, result: { content: [{ type: "text", text: "exit 0" }], structuredContent: { status: "completed" } } }).actual, "allow");
  assert.equal(readServerDecision({ id: 1, error: { code: -32602, message: "unknown tool" } }).actual, "error");
  assert.equal(readServerDecision({ id: 1 }).actual, "error", "no result");
});

// C002-TC-667 (C002-T-064; revised for defect D-018 item 1 by C002-T-065): a stub sdd MCP server answers
// the replace_text call of PG-050, an Edit case that C002-IF-009 §2.2 feeds as replace_text, with each
// answer of the Examples; the replay report records the decision and the result's text as its detail, and
// the stub records the tools it was called with (one replace_text call, no write_file call). `{repo}` is
// the stub's working folder, the replay fixture's repository.
const TS667: { answer: string; result: Record<string, unknown>; decision: "deny" | "allow" | "error" }[] = [
  { answer: "GUARD-PATH-001 text", result: { isError: true, content: [{ type: "text", text: "GUARD-PATH-001: Write on {repo}/README.md denied — outside .sdd/. Allowed: .sdd/." }] }, decision: "deny" },
  { answer: "ERR-MCP-001 text", result: { isError: true, content: [{ type: "text", text: "ERR-MCP-001: invalid arguments for write_file: content is required" }] }, decision: "deny" },
  { answer: "ERR-MCP-003 text", result: { isError: true, content: [{ type: "text", text: "ERR-MCP-003: could not write {repo}/README.md: EACCES; previous content kept" }] }, decision: "allow" },
  { answer: "ERR-MCP-002 text", result: { isError: true, content: [{ type: "text", text: "ERR-MCP-002: internal fault in write_file: boom; the call was refused" }] }, decision: "error" },
  { answer: "a text without a code", result: { isError: true, content: [{ type: "text", text: "write refused" }] }, decision: "error" },
  { answer: "a success with status written", result: { content: [{ type: "text", text: "wrote {repo}/README.md (2 bytes)" }], structuredContent: { status: "written", tool: "write_file", path: "{repo}/README.md", bytes: 2 } }, decision: "allow" },
  { answer: "ERR-MCP-007 text", result: { isError: true, content: [{ type: "text", text: "ERR-MCP-007: usage: sdd-mcp --profile files|shell [--root <dir>]: unknown profile" }] }, decision: "error" },
  { answer: "GUARD-HOOK-002 text", result: { isError: true, content: [{ type: "text", text: "GUARD-HOOK-002: Write denied — subagent general-purpose is not an Architect agent, and this repository contains .sdd/. Allowed: read-only tools." }] }, decision: "error" },
  { answer: "no isError and no structuredContent", result: { content: [{ type: "text", text: "wrote {repo}/README.md (2 bytes)" }] }, decision: "error" },
  { answer: 'a structuredContent whose status is "pending"', result: { content: [{ type: "text", text: "wrote {repo}/README.md (2 bytes)" }], structuredContent: { status: "pending" } }, decision: "error" },
  { answer: "a structuredContent without a status", result: { content: [{ type: "text", text: "wrote {repo}/README.md (2 bytes)" }], structuredContent: { tool: "write_file" } }, decision: "error" },
];

/** A stub server: answers initialize, and every tools/call with `result` ({repo} = its working folder); appends each called tool name to `log`. */
function stubServer(result: Record<string, unknown>, log: string): string {
  const file = join(dir, `stub-${Math.random().toString(36).slice(2)}.mjs`);
  writeFileSync(
    file,
    `import { appendFileSync } from "node:fs";
const LOG = ${JSON.stringify(log)};
const RESULT = ${JSON.stringify(JSON.stringify(result))};
const repo = process.cwd().split(String.fromCharCode(92)).join("/");
const NL = String.fromCharCode(10);
let buf = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (s) => {
  buf += s;
  for (let i = buf.indexOf(NL); i >= 0; i = buf.indexOf(NL)) {
    const line = buf.slice(0, i);
    buf = buf.slice(i + 1);
    let m;
    try { m = JSON.parse(line); } catch { continue; }
    if (m.id === undefined) continue;
    if (m.method === "tools/call") appendFileSync(LOG, String(m.params && m.params.name) + NL);
    const reply = m.method === "initialize"
      ? { protocolVersion: "2025-06-18", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "sdd-mcp", version: "0.0.0" } }
      : JSON.parse(RESULT.split("{repo}").join(repo));
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: m.id, result: reply }) + NL);
  }
});
process.stdin.on("end", () => process.exit(0));
`,
  );
  return file;
}

for (const row of TS667) {
  test(`C002-TS-667: the stub answers the replace_text call of PG-050 with ${row.answer} → ${row.decision}, detail holds the text`, async () => {
    const p = JSON.parse(readFileSync(DEFAULT_PATH_CORPUS, "utf8")) as Corpus;
    p.cases = p.cases.filter((c) => c.id === "PG-050");
    const one = join(dir, "pg050-corpus.json");
    const noShell = join(dir, "no-shell-corpus.json");
    writeFileSync(one, JSON.stringify(p));
    const s = JSON.parse(readFileSync(DEFAULT_SHELL_CORPUS, "utf8")) as { cases: BashCase[] };
    s.cases = [];
    writeFileSync(noShell, JSON.stringify(s));
    const log = join(dir, `stub-calls-${Math.random().toString(36).slice(2)}.log`);
    const adapter: McpServerAdapter = createMcpServerAdapter({ serverEntry: stubServer(row.result, log) });
    let repo = "";
    const { report } = await runReplay(adapter, { pathCorpus: one, shellCorpus: noShell, afterRun: (fx) => (repo = fx.repo) });
    const e = entry(report, "PG-050");
    // PG-050 is an Edit case, which §2.2 feeds as replace_text (D-018 item 1).
    assert.equal(adapter.calls.find((c) => c.id === "PG-050")?.tool, "replace_text");
    const received = existsSync(log) ? readFileSync(log, "utf8").split(/\r?\n/).filter((l) => l !== "") : [];
    assert.deepEqual(received, ["replace_text"], "the stub received one replace_text call and no write_file call");
    assert.equal(e.actual, row.decision, JSON.stringify(e));
    const text = ((row.result["content"] as { text: string }[])[0]!.text).split("{repo}").join(repo);
    assert.equal(e.detail, text, "detail holds the result's text");
  });
}

test("C002-T-041 — decision reading of the Copilot hook (C002-IF-009 §2.3)", () => {
  const deny = JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "m" }, permissionDecision: "deny", permissionDecisionReason: "m" });
  assert.equal(readHookDecision({ status: 2, stdout: deny, stderr: "m" }).actual, "deny");
  assert.equal(readHookDecision({ status: 0, stdout: "", stderr: "" }).actual, "allow");
  assert.equal(readHookDecision({ status: 2, stdout: "", stderr: "m" }).actual, "error", "exit 2 without the deny decision");
  assert.equal(readHookDecision({ status: 0, stdout: deny, stderr: "" }).actual, "error", "exit 0 with output");
  assert.equal(readHookDecision({ status: 1, stdout: "", stderr: "boom" }).actual, "error");
});
