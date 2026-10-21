// C002-TC-614 (Copilot CLI rows) — verifies C002-TS-614 (C002-AC-611.1, C002-REQ-611, C002-NFR-105) and
// the preparation, arguments and names of the Copilot CLI eval runner (evals/harness/runners/copilot-cli.mjs,
// C002-T-045; C002-IF-010 §2 … §4) with the stub host of evals/harness/runners/stub.mjs: the caps end a
// session that never ends by itself at 30 turns and at the 0.50 USD spend cap (50 AI Credits); every
// session starts non-interactively with `--agent architect:<agent>`, `--plugin-dir <package copy>` and
// the servers file; its workspace is prepared by `sdd install copilot` (with
// `.github/hooks/architect-guard.json`); a hook deny is reported as a call that did not run; each call
// names its agent; the result records `api_key_source` "copilot-credential-store" and no credential text
// occurs in a result, transcript, host environment or log line. Also run.mjs: the Copilot stop rule, the
// ledger entry and a not-applicable row (C002-TC-336). C002-T-066 (revision D-026/D-027): C002-TC-680,
// thirteen rows through run.mjs main (the model rule, `--copilot-model` and `SDD_EVAL_COPILOT_MODEL`,
// `session_model`), and its supporting tests (no model field, `agent_models`, the refused `--model`).
// No paid session, no network, no Copilot CLI.
import { test, after, mock } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { allowToolArgs, API_KEY_SOURCE, copilotPackage, hostAgent, loginIdentity, mapCall, maxAiCredits, runCopilotCliSession, serversConfig, SESSION_TIMEOUT_MS, sessionStart, tokenFiles, usageOf } from "../../../evals/harness/runners/copilot-cli.mjs";
import { copilotStubHost } from "../../../evals/harness/runners/stub.mjs";
import { copilotLedgerEntry, copilotStopRule, runScenario, selectScenarios } from "../../../evals/harness/run.mjs";
import { namesOf, setHarnessContext } from "../../../evals/harness/session.mjs";
import { repoRoot } from "../../helpers.ts";

const ROOT = repoRoot();
const SCRIPTS = join(ROOT, "plugins", "architect", "scripts");
const FAKE_TOKEN = "ghu_" + "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8";
const IDENTITY = { loggedInUsers: [{ host: "https://github.com", login: "p01-test", kind: "githubDotCom" }], lastLoggedInUser: { host: "https://github.com", login: "p01-test" } };

// One generated package for the file (sdd-mcp-server, the S-08 mode).
let PKG: string | null = null;
const pkg = (): string => (PKG ??= copilotPackage({ target: "copilot", mode: "sdd-mcp-server" }) as string);
const temps: string[] = [];
after(() => {
  for (const d of temps) rmSync(d, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
});
const tmp = (p: string) => {
  const d = mkdtempSync(join(tmpdir(), p));
  temps.push(d);
  return d;
};

type Session = Awaited<ReturnType<typeof runCopilotCliSession>>;
type Stub = ReturnType<typeof copilotStubHost>;

async function session(stub: Parameters<typeof copilotStubHost>[0], options: Record<string, unknown> = {}, deps: Record<string, unknown> = {}): Promise<{ s: Session; host: Stub; cwd: string }> {
  const cwd = tmp("sdd-cp-caps-");
  const host = copilotStubHost(stub);
  const s = await runCopilotCliSession({ cwd, prompt: "hi", agent: "architect:sdd-conductor", allowTools: [], ...options }, { host, pkg: pkg(), scripts: SCRIPTS, identity: IDENTITY, ...deps });
  return { s, host, cwd };
}

const toolUses = (s: Session) => s.transcript.filter((r: any) => r.type === "sdk" && r.message.type === "assistant").flatMap((r: any) => r.message.message.content.filter((b: any) => b.type === "tool_use"));
const toolResults = (s: Session) => s.transcript.filter((r: any) => r.type === "sdk" && r.message.type === "user").flatMap((r: any) => r.message.message.content);

// --- C002-TS-614: caps with a stub host (Copilot CLI eval runner rows) ------------------------------

test("C002-TS-614 Copilot CLI runner, 0.01 USD (1 AI Credit) per turn: the session ends after 30 turns with the reason turn cap", async () => {
  const { s } = await session({ creditsPerTurn: 1 });
  assert.equal(s.end_reason, "turn cap");
  assert.equal(s.usage.turns, 30);
  assert.ok(Math.abs((s.usage.usd ?? 0) - 0.3) < 1e-9, `usd ${s.usage.usd}`);
  assert.equal(s.result.subtype, "error_max_turns");
  assert.equal(s.target, "copilot");
  assert.equal(s.copilot_usage?.ai_credits, 30, "AI Credits measured from the usage file");
});

test("C002-TS-614 Copilot CLI runner, 0.10 USD (10 AI Credits) per turn: the session ends after 5 turns with the reason spend cap", async () => {
  const { s, host } = await session({ creditsPerTurn: 10 });
  const args = host.calls[0]!.args as string[];
  assert.equal(args[args.indexOf("--max-ai-credits") + 1], "50", "the 0.50 USD cap is passed as 50 AI Credits");
  assert.equal(s.end_reason, "spend cap");
  assert.equal(s.usage.turns, 5);
  assert.ok(Math.abs((s.usage.usd ?? 0) - 0.5) < 1e-9, `usd ${s.usage.usd}`);
  assert.equal(s.result.subtype, "error_max_budget_usd");
  assert.equal(s.spend, "reported");
});

test("the caps default to 30 turns and 0.50 USD; a case's lower caps apply; the host's minimum of 30 AI Credits holds", async () => {
  assert.equal(maxAiCredits(0.5), 50);
  assert.equal(maxAiCredits(0.1), 30, "Copilot CLI refuses less than 30 AI Credits");
  const a = await session({ creditsPerTurn: 0 }, { maxTurns: 7 });
  assert.deepEqual([a.s.end_reason, a.s.usage.turns], ["turn cap", 7]);
  const b = await session({ creditsPerTurn: 10 }, { maxBudgetUsd: 0.4 });
  assert.deepEqual([b.s.end_reason, b.s.usage.turns], ["spend cap", 4]);
});

test("a host that reports no AI Credits: the turn cap alone applies and the result says spend unreported", async () => {
  const { s } = await session({ reportsSpend: false });
  assert.equal(s.end_reason, "turn cap");
  assert.equal(s.usage.turns, 30);
  assert.equal(s.usage.usd, null);
  assert.equal(s.spend, "unreported");
});

test("a session that ends by itself ends with completed and its host version recorded as read", async () => {
  const { s } = await session({ endAfter: 3, version: "1.0.99" });
  assert.equal(s.end_reason, "completed");
  assert.equal(s.usage.turns, 3);
  assert.deepEqual(s.host_versions, { "copilot-cli": "1.0.99" });
  const host = s.transcript.find((r: any) => r.type === "harness" && r.event === "host") as any;
  assert.equal(host.tested, "1.0.98");
  assert.match(String(host.note), /1\.0\.99 is not the tested 1\.0\.98/);
});

test("a session error of the host ends the session with the reason error and its text", async () => {
  const { s } = await session({ endAfter: 1, script: [[{ session: true, error: "Failed to get response from the AI model" }]] });
  assert.equal(s.end_reason, "error");
  assert.match(String(s.error), /Failed to get response/);
});

// --- Arguments and preparation ----------------------------------------------------------------------

test("every session starts non-interactively with --agent architect:<agent>, --plugin-dir <package copy> and the servers file (C002-IF-010 §4, S-08 F-6)", async () => {
  const seen: Record<string, unknown> = {};
  const { host, cwd } = await session(
    {
      endAfter: 1,
      onRun({ args, cwd: wd }: { args: string[]; cwd: string }) {
        const copy = args[args.indexOf("--plugin-dir") + 1]!;
        seen["hooksJson"] = existsSync(join(copy, "hooks.json"));
        seen["pluginJson"] = existsSync(join(copy, "plugin.json"));
        seen["guard"] = existsSync(join(wd, ".github", "hooks", "architect-guard.json")) ? readFileSync(join(wd, ".github", "hooks", "architect-guard.json"), "utf8") : null;
        seen["agents"] = existsSync(join(wd, ".github", "agents")) ? readdirSync(join(wd, ".github", "agents")).sort() : [];
        seen["vscodeMcp"] = existsSync(join(wd, ".vscode", "mcp.json"));
        seen["servers"] = JSON.parse(readFileSync(args[args.indexOf("--additional-mcp-config") + 1]!.slice(1), "utf8"));
        seen["copy"] = copy;
      },
    },
    { allowTools: ["Write", "Edit", "Bash", "mcp__plugin_architect_serena__find_symbol"] },
  );
  const args = host.calls[0]!.args as string[];
  assert.equal(args[0], "-p");
  assert.equal(args[1], "hi");
  assert.equal(args[args.indexOf("--agent") + 1], "architect:sdd-conductor");
  for (const flag of ["--no-ask-user", "--no-auto-update", "--disable-builtin-mcps"]) assert.ok(args.includes(flag), flag);
  assert.equal(args[args.indexOf("--output-format") + 1], "json");
  assert.ok(args[args.indexOf("--additional-mcp-config") + 1]!.startsWith("@"));
  assert.deepEqual(args.filter((a) => a.startsWith("--allow-tool")), ["--allow-tool=sdd-files", "--allow-tool=sdd-shell", "--allow-tool=serena(find_symbol)"]);
  assert.ok(!args.includes("--allow-all-tools") && !args.includes("--yolo"), "no blanket permission");
  assert.equal(host.calls[0]!.cwd, cwd);
  assert.notEqual(seen["copy"], pkg(), "the session loads a copy, not the package itself");
  assert.equal(seen["hooksJson"], true, "the install wrote hooks.json into the copy");
  assert.equal(seen["pluginJson"], true, "the install wrote plugin.json into the copy");
  assert.match(String(seen["guard"]), /hook guard --host copilot --mode sdd-mcp-server --agents sdd-conductor,/, "the workspace hook file names the copy's CLI");
  assert.ok(String(seen["guard"]).includes(String(seen["copy"]).split("\\").join("/")), "the workspace hook names the package copy");
  assert.equal((seen["agents"] as string[]).length, 10);
  assert.equal(seen["vscodeMcp"], true);
  const servers = (seen["servers"] as { mcpServers: Record<string, any> }).mcpServers;
  assert.deepEqual(Object.keys(servers).sort(), ["context7", "deepwiki", "sdd-files", "sdd-shell", "serena"]);
  assert.equal(servers["sdd-files"].type, "local");
  assert.equal(servers["sdd-files"].command, process.execPath);
  assert.match(servers["sdd-files"].args[0], /sdd-mcp\.mjs$/);
  assert.deepEqual(servers["sdd-files"].args.slice(1), ["--profile", "files"]);
  assert.deepEqual(servers["sdd-files"].tools, ["*"]);
  assert.deepEqual(servers["context7"], { type: "http", url: "https://mcp.context7.com/mcp", tools: ["*"] });
  assert.match(servers["serena"].args[0], /sdd\.mjs$/);
});

test("the agent: a case's architect: name unchanged, the eval relay direct, a prompt-file prompt expanded (Copilot CLI -p sends slash text unexpanded)", () => {
  assert.equal(hostAgent("architect:sdd-critic"), "architect:sdd-critic");
  assert.equal(hostAgent("sdd-critic"), "architect:sdd-critic");
  assert.deepEqual(sessionStart("architect:eval-dispatcher", "Dispatch: sdd-critic\nBrief — review the spec", pkg()), { agent: "architect:sdd-critic", text: "Brief — review the spec", relay: "direct" });
  const doctor = sessionStart("architect:sdd-conductor", "/doctor", pkg());
  assert.equal(doctor.agent, "architect:sdd-conductor");
  assert.equal(doctor.promptFile, "prompts/doctor.prompt.md");
  assert.match(doctor.text, /Serena data folder/);
  assert.ok(!doctor.text.startsWith("---"), "frontmatter removed");
  const neu = sessionStart("architect:sdd-conductor", '/architect:new "Coupon codes"', pkg());
  assert.match(String(neu.text), /\n\nArguments: "Coupon codes"$/);
  assert.deepEqual(sessionStart("architect:sdd-conductor", "/no-such-prompt", pkg()), { agent: "architect:sdd-conductor", text: "/no-such-prompt" });
});

test("allowTools maps through the Copilot table: Write/Edit → sdd-files or write, Bash → sdd-shell or shell, MCP source names → server(tool)", () => {
  assert.deepEqual(allowToolArgs(["Write", "Bash", "Read", "Agent"], { mode: "sdd-mcp-server" }), ["--allow-tool=sdd-files", "--allow-tool=sdd-shell"]);
  assert.deepEqual(allowToolArgs(["Edit", "Bash"], { mode: "copilot-hooks" }), ["--allow-tool=shell", "--allow-tool=write"]);
  assert.deepEqual(allowToolArgs([], { mode: "sdd-mcp-server" }), []);
});

// --- Names, hook denies and agents -----------------------------------------------------------------

const SCRIPT = [
  [
    { tool: "sdd-files-write_file", input: { path: ".sdd/x.md", content: "x" } },
    { subagent: "general-purpose", calls: [{ tool: "create", input: { path: "src/app.ts", file_text: "x" }, deny: "hook" }, { tool: "view", input: { path: "src/app.ts" } }] },
    { subagent: "sdd-auditor", calls: [{ tool: "sdd-shell-run_command", input: { command: "sdd lint 001" } }] },
    { tool: "powershell", input: { command: "Remove-Item x" }, deny: "permission" },
  ],
];

test("names (source rows): sdd-files-write_file → Write with file_path, task → Agent with architect:<agent>; each call names its agent; host_tool kept", async () => {
  const { s } = await session({ endAfter: 1, script: SCRIPT }, { names: namesOf({}) });
  const uses = toolUses(s);
  const w = uses.find((b: any) => b.host_tool === "sdd-files-write_file");
  assert.equal(w.name, "Write");
  assert.equal(w.input.file_path, ".sdd/x.md");
  assert.equal(w.input.path, ".sdd/x.md", "the host's keys beside the source keys");
  assert.equal(w.agent, "architect:sdd-conductor");
  const create = uses.find((b: any) => b.host_tool === "create");
  assert.deepEqual([create.name, create.agent, create.input.file_path], ["Write", "general-purpose", "src/app.ts"]);
  const lint = uses.find((b: any) => b.host_tool === "sdd-shell-run_command");
  assert.deepEqual([lint.name, lint.agent], ["Bash", "architect:sdd-auditor"]);
  const starts = s.transcript.filter((r: any) => r.type === "sdk" && r.message.subtype === "task_started").map((r: any) => r.message.subagent_type);
  assert.deepEqual(starts, ["general-purpose", "architect:sdd-auditor"], "an Architect agent as architect:<agent>, a host built-in agent by its own name");
  const agentCalls = uses.filter((b: any) => b.host_tool === "task");
  assert.deepEqual(agentCalls.map((b: any) => [b.name, b.input.subagent_type]), [["Agent", "general-purpose"], ["Agent", "architect:sdd-auditor"]]);
  assert.deepEqual(mapCall("serena-find_symbol", { name_path: "x" }).name, "mcp__plugin_architect_serena__find_symbol");
  assert.equal(mapCall("sql", {}).name, "sql", "a host tool the runner does not map keeps its host name");
});

test("names (Copilot CLI rows): the host's tool names and inputs; agent starts still as architect:<agent>", async () => {
  assert.equal(namesOf({ host: "copilot-cli" }), "host");
  const { s } = await session({ endAfter: 1, script: SCRIPT }, { names: namesOf({ host: "copilot-cli" }) });
  const uses = toolUses(s);
  assert.deepEqual(uses.map((b: any) => b.name), ["sdd-files-write_file", "task", "task", "powershell", "create", "view", "sdd-shell-run_command"]);
  assert.deepEqual(uses[0].input, { path: ".sdd/x.md", content: "x" });
  const starts = s.transcript.filter((r: any) => r.type === "sdk" && r.message.subtype === "task_started").map((r: any) => [r.message.subagent_type, r.message.host_agent]);
  assert.deepEqual(starts, [["general-purpose", "general-purpose"], ["architect:sdd-auditor", "sdd-auditor"]]);
});

test("a fail-closed hook deny is reported as a tool call that did not run, with the agent that made it; a permission refusal as denied by permission", async () => {
  const { s } = await session({ endAfter: 1, script: SCRIPT, hookSource: ".github_hooks_architect-guard.json" });
  const results = toolResults(s);
  const create = toolUses(s).find((b: any) => b.host_tool === "create");
  const r = results.find((b: any) => b.tool_use_id === create.id);
  assert.equal(r.not_run, true);
  assert.equal(r.denied_by, "hook");
  assert.equal(r.hook_source, ".github_hooks_architect-guard.json");
  const view = results.find((b: any) => b.tool_use_id === toolUses(s).find((b2: any) => b2.host_tool === "view").id);
  assert.equal(view.not_run, undefined, "a call that ran is not marked");
  const denied = s.transcript.filter((x: any) => x.type === "harness" && x.event === "denied") as any[];
  assert.equal(denied.length, 2);
  assert.ok(denied.some((d) => d.by === "hook" && d.host_tool === "create" && d.agent === "general-purpose"));
  assert.ok(denied.some((d) => d.by === "permission" && d.host_tool === "powershell" && d.agent === "architect:sdd-conductor"));
});

// --- Credentials -------------------------------------------------------------------------------------

test("credentials: the result records api_key_source copilot-credential-store; the temporary home holds the login identity only; no token reaches the host, a result, a transcript or a log line", async () => {
  const saved = { GH_TOKEN: process.env["GH_TOKEN"], COPILOT_GITHUB_TOKEN: process.env["COPILOT_GITHUB_TOKEN"], GITHUB_TOKEN: process.env["GITHUB_TOKEN"], COPILOT_PROVIDER_API_KEY: process.env["COPILOT_PROVIDER_API_KEY"] };
  const seen: { home?: Record<string, unknown>; env?: Record<string, string> } = {};
  try {
    process.env["GH_TOKEN"] = FAKE_TOKEN;
    process.env["COPILOT_GITHUB_TOKEN"] = FAKE_TOKEN;
    process.env["GITHUB_TOKEN"] = FAKE_TOKEN;
    process.env["COPILOT_PROVIDER_API_KEY"] = "byok-secret";
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...a: unknown[]) => logs.push(a.join(" "));
    let res: Awaited<ReturnType<typeof session>>;
    try {
      res = await session({
        endAfter: 1,
        credential: true,
        script: [[{ session: true, error: `upstream said ${FAKE_TOKEN}` }, { text: `echo ${FAKE_TOKEN}` }]],
        onRun({ env }: { env: Record<string, string> }) {
          seen.env = env;
          seen.home = JSON.parse(readFileSync(join(env["COPILOT_HOME"]!, "config.json"), "utf8"));
        },
      });
    } finally {
      console.log = origLog;
    }
    const { s } = res;
    assert.equal(s.apiKeySource, API_KEY_SOURCE);
    assert.equal(API_KEY_SOURCE, "copilot-credential-store");
    assert.deepEqual(seen.home, IDENTITY, "config.json of the temporary home: the identity fields only");
    const env = seen.env!;
    for (const k of ["GH_TOKEN", "COPILOT_GITHUB_TOKEN", "GITHUB_TOKEN", "COPILOT_PROVIDER_API_KEY"]) assert.equal(env[k], undefined, `${k} reached the host`);
    assert.ok(/sdd-eval-cp-run-/.test(env["COPILOT_HOME"]!), "COPILOT_HOME under the run folder");
    assert.equal(env["GITHUB_COPILOT_PROMPT_MODE_REPO_HOOKS"], "true", "workspace hooks in prompt mode");
    assert.equal(env["COPILOT_AUTO_UPDATE"], "false");
    const text = JSON.stringify(s);
    assert.ok(!text.includes(FAKE_TOKEN), "token text in the result or transcript");
    assert.ok(text.includes("<redacted>"), "token text redacted");
    assert.ok(!logs.join("\n").includes(FAKE_TOKEN), "token text in a log line");
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

test("a token found in the temporary home after the session makes it an error; a paid host without a login is refused before it starts", async () => {
  const { s } = await session({ endAfter: 1, onRun({ env }: { env: Record<string, string> }) { writeFileSync(join(env["COPILOT_HOME"]!, "leak.json"), JSON.stringify({ token: FAKE_TOKEN })); } });
  assert.equal(s.end_reason, "error");
  assert.match(String(s.error), /credential text found in the temporary Copilot home/);
  assert.ok(!JSON.stringify(s).includes(FAKE_TOKEN));
  const cwd = tmp("sdd-cp-nologin-");
  const host = { ...copilotStubHost({ endAfter: 1 }), paid: true };
  await assert.rejects(runCopilotCliSession({ cwd, prompt: "hi", agent: "architect:sdd-conductor" }, { host, pkg: pkg(), scripts: SCRIPTS, identity: null }), /no Copilot CLI login: run `copilot login`/);
  assert.equal(host.calls.length, 0, "the host did not start");
});

test("loginIdentity copies host, login and kind only; tokenFiles finds token text; usageOf converts nano AI units to AI Credits and the USD estimate", () => {
  const dir = tmp("sdd-cp-id-");
  const cfg = join(dir, "config.json");
  writeFileSync(cfg, `// User settings belong in settings.json.\n// This file is managed automatically.\n${JSON.stringify({ firstLaunchAt: "x", loggedInUsers: [{ host: "https://github.com", login: "p01-test", kind: "githubDotCom", token: FAKE_TOKEN }], lastLoggedInUser: { host: "https://github.com", login: "p01-test" }, trustedFolders: ["C:/x"] })}`);
  assert.deepEqual(loginIdentity(cfg), IDENTITY);
  assert.equal(loginIdentity(join(dir, "none.json")), null);
  assert.deepEqual(tokenFiles(dir), ["config.json"]);
  const u = join(dir, "usage.json");
  writeFileSync(u, JSON.stringify({ totalNanoAiu: 9_030_000_000, totalPremiumRequestCost: 0, modelMetrics: { "claude-sonnet-5.5": { requests: { count: 3 }, usage: { inputTokens: 26_900, outputTokens: 1_900, cacheReadTokens: 42_400, cacheWriteTokens: 26_800 }, totalNanoAiu: 9_030_000_000 } } }));
  const usage = usageOf(u)!;
  assert.equal(usage.ai_credits, 9.03);
  assert.equal(usage.usd_estimate, 0.0903);
  assert.equal((usage.models as Record<string, { cache_read_tokens: number }>)["claude-sonnet-5.5"]!.cache_read_tokens, 42_400);
  assert.deepEqual((serversConfig(pkg(), SCRIPTS, { deepwiki: "https://deepwiki-unreachable.invalid/mcp" }).mcpServers as Record<string, unknown>)["deepwiki"], { type: "http", url: "https://deepwiki-unreachable.invalid/mcp", tools: ["*"] });
});

// --- C002-TC-919 (C002-TS-690; C002-T-056 step X0): the 20-minute session timeout, Copilot CLI row -----
test("C002-TS-690 — Copilot CLI eval runner: a host process that starts and then writes nothing ends at 20 minutes from its start with error \"session exceeded 20 minutes\", the process ended, no cap record", async () => {
  assert.equal(SESSION_TIMEOUT_MS, 1_200_000, "the default session timeout");
  const cwd = tmp("sdd-cp-919-");
  const host = copilotStubHost({ hang: true });
  mock.timers.enable({ apis: ["setTimeout", "Date"], now: 1_000_000 });
  try {
    const pending = runCopilotCliSession({ cwd, prompt: "hi", agent: "architect:sdd-conductor", allowTools: [] }, { host, pkg: pkg(), scripts: SCRIPTS, identity: IDENTITY });
    for (let i = 0; i < 1000 && host.calls.length === 0; i++) await new Promise((r) => setImmediate(r));
    const call = host.calls[0] as unknown as { startedAt: number; endedAt: number | null };
    assert.ok(call, "the host process started");
    mock.timers.tick(1_199_999);
    for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r));
    assert.equal(call.endedAt, null, "still running before 20 minutes");
    mock.timers.tick(1);
    const s = await pending;
    assert.equal(s.end_reason, "error");
    assert.equal(s.error, "session exceeded 20 minutes");
    assert.notEqual(call.endedAt, null, "the host process has ended");
    assert.equal(call.endedAt! - call.startedAt, 1_200_000, "the timer started when the host process started");
    assert.deepEqual(s.transcript.filter((r: any) => r.type === "harness" && r.event === "cap"), [], "no cap record");
  } finally {
    mock.timers.reset();
  }
});

test("the Copilot CLI runner writes one cap record per session: the turn cap, not again for later turns or a limit text", async () => {
  const { s } = await session({ creditsPerTurn: 1 }, { maxTurns: 3 });
  assert.equal(s.end_reason, "turn cap");
  assert.equal(s.transcript.filter((r: any) => r.type === "harness" && r.event === "cap").length, 1);
});

// --- run.mjs: Copilot stop rule, ledger entry, not-applicable rows -----------------------------------

test("run.mjs Copilot stop rule: T of the copilot entries + H ≤ 30 USD; the ledger entry names the measured AI Credits and the USD estimate", () => {
  const ledger = { entries: [{ provider: "openrouter", pool: "general", cost_usd: 29 }, { provider: "copilot", pool: "copilot", cost_usd: 0.2 }] };
  const r = copilotStopRule(ledger);
  assert.deepEqual(r, { ok: true, T: 0.2, H: 29, L: 30 }, "openrouter spend is not counted, but its highest session cost sets H");
  assert.equal(copilotStopRule({ entries: [{ provider: "copilot", cost_usd: 29.5 }] }).ok, false);
  const record = { pass: true, api_key_source: API_KEY_SOURCE, models: ["claude-opus-5.5"], host_versions: { "copilot-cli": "1.0.98" }, end_reason: "completed", usage: { turns: 3, usd: 0.12 }, metrics: { cost_usd: 0.12 }, copilot_usage: { ai_credits: 12, premium_requests: 0, models: { "claude-opus-5.5": { input_tokens: 1, output_tokens: 2, cache_read_tokens: 3, cache_write_tokens: 4, ai_credits: 12 } } } };
  const e = copilotLedgerEntry({ scenario: { id: "ROUTE-auditor-copilot-cli" }, record, resultFile: join(ROOT, "evals", "results", "x.json"), task: "C002-T-045", step: "4" });
  assert.equal(e.provider, "copilot");
  assert.equal(e.pool, "copilot");
  assert.equal(e.host, "copilot-cli");
  assert.equal(e.api_key_source, "copilot-credential-store");
  assert.equal(e.ai_credits, 12);
  assert.equal(e.cost_usd, 0.12);
  assert.match(e.cost_source, /^estimate: AI Credits measured by Copilot CLI/);
  assert.equal(e.step, 4);
  assert.ok(String(e.result).endsWith("evals/results/x.json"), String(e.result));
});

test("C002-TC-336 under the signed-off S-08 record: the row is not applicable and runs no session", async () => {
  const file = join(ROOT, "evals", "targets", "copilot-guard", "TS-336.eval.mjs");
  const picked = await selectScenarios([file], { host: "copilot-cli" });
  assert.equal(picked.scenarios.length, 0);
  assert.equal(picked.notApplicable.length, 1);
  assert.match(picked.notApplicable[0]!.reason, /@mode-hooks: the signed-off S-08 record .* gives enforcement_mode sdd-mcp-server/);
  // run.mjs reports it and starts no session (exit 0), here through a replaced runner that would fail.
  const dir = tmp("sdd-run-336-");
  const driver = join(dir, "driver.mjs");
  const url = (p: string) => pathToFileURL(join(ROOT, "evals", "harness", p)).href;
  writeFileSync(driver, [`import { main } from ${JSON.stringify(url("run.mjs"))};`, "const never = () => { throw new Error('session started'); };", "process.exitCode = await main(JSON.parse(process.argv[2]), { runners: { 'copilot-cli': never }, ledger: 'unused' });"].join("\n"));
  const r = spawnSync(process.execPath, [driver, JSON.stringify([file, "--host", "copilot-cli", "--tier", "dev", "--results-dir", join(dir, "res")])], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /TS-336: not applicable, no session \(@mode-hooks/);
});

test("run.mjs records api_key_source copilot-credential-store and the measured units in each result record of a Copilot CLI row (replaced runner, no ledger)", () => {
  const dir = tmp("sdd-run-cp-");
  const caseFile = join(dir, "case.eval.mjs");
  writeFileSync(caseFile, "export default { id: 'STUB-CP', title: 'stub', host: 'copilot-cli', agent: 'architect:sdd-conductor', fixture: null, prompt: 'hi', assert: () => [] };\n");
  const driver = join(dir, "driver.mjs");
  const url = (p: string) => pathToFileURL(join(ROOT, "evals", "harness", p)).href;
  writeFileSync(
    driver,
    [
      `import { main } from ${JSON.stringify(url("run.mjs"))};`,
      `import { runCopilotCliSession } from ${JSON.stringify(url("runners/copilot-cli.mjs"))};`,
      `import { copilotStubHost } from ${JSON.stringify(url("runners/stub.mjs"))};`,
      `const stub = (o) => runCopilotCliSession({ ...o, names: 'host' }, { host: copilotStubHost({ endAfter: 2, credential: true, creditsPerTurn: 2 }), scripts: ${JSON.stringify(SCRIPTS)}, identity: ${JSON.stringify(IDENTITY)} });`,
      "process.exitCode = await main(JSON.parse(process.argv[2]), { runners: { 'copilot-cli': stub }, ledger: 'unused' });",
    ].join("\n"),
  );
  const res = join(dir, "results");
  const r = spawnSync(process.execPath, [driver, JSON.stringify([caseFile, "--host", "copilot-cli", "--tier", "dev", "--results-dir", res])], { encoding: "utf8", env: { ...process.env, SDD_EVAL_COPILOT_GENERATE: "" } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const doc = JSON.parse(readFileSync(join(res, readdirSync(res).find((f) => f.endsWith(".json"))!), "utf8"));
  assert.equal(doc.target, "copilot");
  assert.equal(doc.api_key_source, "copilot-credential-store");
  assert.equal(doc.records[0].api_key_source, "copilot-credential-store");
  assert.equal(doc.records[0].copilot_usage.ai_credits, 4);
  assert.equal(doc.records[0].metrics.cost_usd, 0.04);
  assert.equal(doc.records[0].end_reason, "completed");
});

// --- C002-T-065: C002-TC-614 (Copilot CLI row, caps), C002-TC-678, C002-TC-680, C002-TC-912 … 916 ---------

const once = (args: string[], flag: string) => args.filter((a) => a === flag).length;
const valueOf = (args: string[], flag: string) => args[args.indexOf(flag) + 1];

test("C002-TS-614 Copilot CLI eval runner, 1 AI Credit per turn below the limit of 50, a row without maxTurns and maxBudgetUsd: 30 turns, turn cap, caps { turns: 30, usd: 0.50 } in the result record", async () => {
  const dir = tmp("sdd-cp-caps-record-");
  const host = copilotStubHost({ creditsPerTurn: 1 });
  const prev = setHarnessContext({ host: "copilot-cli", runners: { "copilot-cli": (o: Record<string, unknown>) => runCopilotCliSession(o, { host, pkg: pkg(), scripts: SCRIPTS, identity: IDENTITY }) } });
  try {
    const scenario = { id: "STUB-CP-CAPS", title: "caps", agent: "architect:sdd-conductor", fixture: null, prompt: "hi", assert: () => [] };
    const doc = (await runScenario(scenario, { host: "copilot-cli", resultsDir: dir, log: () => undefined })) as Record<string, any>;
    const record = doc["records"][0];
    assert.equal(record["end_reason"], "turn cap");
    assert.equal(record["usage"].turns, 30);
    assert.deepEqual(record["caps"], { turns: 30, usd: 0.5 });
    assert.equal(valueOf(host.calls[0]!.args as string[], "--max-ai-credits"), "50");
  } finally {
    setHarnessContext(prev);
  }
});

for (const row of [
  { cap: undefined, credits: 53, limit: 50, reason: "spend cap", usd: 0.53 },
  { cap: undefined, credits: 12, limit: 50, reason: "completed", usd: 0.12 },
  { cap: 0.2, credits: 30, limit: 30, reason: "spend cap", usd: 0.3 },
  { cap: 0.2, credits: 25, limit: 30, reason: "completed", usd: 0.25 },
]) {
  test(`C002-TS-678 — ${row.cap === undefined ? "a row without maxBudgetUsd" : `maxBudgetUsd ${row.cap}`}, ${row.credits} AI Credits in the usage file, no limit text: --max-ai-credits ${row.limit}, ${row.reason}, usage.usd ${row.usd}`, async () => {
    const { s, host } = await session({ endAfter: 1, sessionCredits: row.credits, limitText: false }, row.cap === undefined ? {} : { maxBudgetUsd: row.cap });
    const args = host.calls[0]!.args as string[];
    assert.equal(once(args, "--max-ai-credits"), 1);
    assert.equal(valueOf(args, "--max-ai-credits"), String(row.limit));
    assert.equal(s.end_reason, row.reason);
    assert.ok(Math.abs((s.usage.usd ?? -1) - row.usd) < 1e-9, `usd ${s.usage.usd}`);
    assert.equal(s.copilot_usage?.ai_credits, row.credits);
  });
}

/** The `model` field of a generated agent file of the package (read, never written into the test). */
const packageModel = (agent: string) => {
  const m = /^model:\s*(\S+)\s*$/m.exec(readFileSync(join(pkg(), "agents", `${agent}.agent.md`), "utf8"));
  assert.ok(m, `${agent}: a model field`);
  return m[1]!;
};

// --- C002-TC-680 (C002-TS-680; C002-T-066, revision D-026/D-027): the model rule and the run's model
// substitution, thirteen rows through main of run.mjs in a child process, with the stub Copilot CLI host
// (recording its command line) and the stub OpenCode host for the two --host opencode rows.
interface MainRun { status: number | null; stdout: string; stderr: string; started: number; args: string[] | null; records: Record<string, any>[] }

function runMain(args: string[], { agent, model, variable }: { agent: string; model?: string; variable?: string }): MainRun {
  const dir = tmp("sdd-tc680-");
  const caseFile = join(dir, "case.eval.mjs");
  writeFileSync(caseFile, `export default { id: "TC-680-ROW", title: "TC-680", agent: ${JSON.stringify(agent)}, ${model ? `model: ${JSON.stringify(model)}, ` : ""}fixture: null, prompt: "hi", assert: () => [] };\n`);
  const startLog = join(dir, "started.log");
  const argsFile = join(dir, "args.json");
  const url = (p: string) => pathToFileURL(join(ROOT, "evals", "harness", p)).href;
  const driver = join(dir, "driver.mjs");
  writeFileSync(
    driver,
    [
      `import { appendFileSync, writeFileSync } from "node:fs";`,
      `import { main } from ${JSON.stringify(url("run.mjs"))};`,
      `import { runCopilotCliSession } from ${JSON.stringify(url("runners/copilot-cli.mjs"))};`,
      `import { runOpenCodeSession } from ${JSON.stringify(url("runners/opencode.mjs"))};`,
      `import { copilotStubHost, stubHost } from ${JSON.stringify(url("runners/stub.mjs"))};`,
      `const started = () => appendFileSync(${JSON.stringify(startLog)}, "started\\n");`,
      `const copilot = (o) => runCopilotCliSession(o, { host: copilotStubHost({ endAfter: 1, onRun: ({ args }) => { started(); writeFileSync(${JSON.stringify(argsFile)}, JSON.stringify(args)); } }), pkg: ${JSON.stringify(pkg())}, scripts: ${JSON.stringify(SCRIPTS)}, identity: ${JSON.stringify(IDENTITY)} });`,
      `const opencode = (o) => { started(); return runOpenCodeSession(o, { host: stubHost({ endAfter: 1 }) }); };`,
      `process.exitCode = await main(JSON.parse(process.argv[2]), { runners: { "copilot-cli": copilot, opencode }, ledger: "unused" });`,
    ].join("\n"),
  );
  const env: Record<string, string | undefined> = { ...process.env };
  delete env["SDD_EVAL_COPILOT_MODEL"];
  if (variable !== undefined) env["SDD_EVAL_COPILOT_MODEL"] = variable;
  const res = join(dir, "results");
  const r = spawnSync(process.execPath, [driver, JSON.stringify([caseFile, ...args, "--tier", "dev", "--results-dir", res])], { cwd: ROOT, encoding: "utf8", env, windowsHide: true, timeout: 120_000 });
  const records = existsSync(res) ? readdirSync(res).filter((f) => f.endsWith(".json")).flatMap((f) => (JSON.parse(readFileSync(join(res, f), "utf8")) as { records: Record<string, any>[] }).records) : [];
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, started: existsSync(startLog) ? readFileSync(startLog, "utf8").split("\n").filter(Boolean).length : 0, args: existsSync(argsFile) ? (JSON.parse(readFileSync(argsFile, "utf8")) as string[]) : null, records };
}

const SUB = "claude-opus-5.5=claude-sonnet-5.5";
const FORM = "is not <from>=<to>[,<from>=<to>…]; no session started";
type Row680 = { n: number; agent: string; model?: string; variable?: string; args: string[]; passed?: string; session?: Record<string, unknown>; error?: string; title: string };
const ROWS_680: Row680[] = [
  { n: 1, agent: "architect:sdd-conductor", args: ["--host", "copilot-cli"], passed: "claude-opus-5.5", session: { chosen: "claude-opus-5.5", source: "agent file", substitution: null, passed: "claude-opus-5.5" }, title: "conductor without model, no substitution: --model claude-opus-5.5 from the agent file" },
  { n: 2, agent: "architect:sdd-auditor", args: ["--host", "copilot-cli"], passed: "claude-haiku-5.5", session: { chosen: "claude-haiku-5.5", source: "agent file", substitution: null, passed: "claude-haiku-5.5" }, title: "auditor without model: --model claude-haiku-5.5 from the agent file" },
  { n: 3, agent: "architect:sdd-conductor", model: "claude-sonnet-5.5", args: ["--host", "copilot-cli"], passed: "claude-sonnet-5.5", session: { chosen: "claude-sonnet-5.5", source: "case", substitution: null, passed: "claude-sonnet-5.5" }, title: "conductor with the case model claude-sonnet-5.5" },
  { n: 4, agent: "architect:sdd-conductor", args: ["--host", "copilot-cli", "--copilot-model", SUB], passed: "claude-sonnet-5.5", session: { chosen: "claude-opus-5.5", source: "agent file", substitution: SUB, passed: "claude-sonnet-5.5" }, title: "conductor under --copilot-model: --model claude-sonnet-5.5, no --model claude-opus-5.5" },
  { n: 5, agent: "architect:sdd-auditor", args: ["--host", "copilot-cli", "--copilot-model", SUB], passed: "claude-haiku-5.5", session: { chosen: "claude-haiku-5.5", substitution: null, passed: "claude-haiku-5.5" }, title: "auditor under --copilot-model keeps claude-haiku-5.5" },
  { n: 6, agent: "architect:sdd-conductor", model: "claude-opus-5.5", args: ["--host", "copilot-cli", "--copilot-model", SUB], passed: "claude-sonnet-5.5", session: { chosen: "claude-opus-5.5", source: "case", substitution: SUB, passed: "claude-sonnet-5.5" }, title: "case model claude-opus-5.5 substituted" },
  { n: 7, agent: "architect:sdd-conductor", variable: SUB, args: ["--host", "copilot-cli"], passed: "claude-sonnet-5.5", session: { substitution: SUB, passed: "claude-sonnet-5.5" }, title: "the variable SDD_EVAL_COPILOT_MODEL substitutes" },
  { n: 8, agent: "architect:sdd-conductor", variable: "claude-opus-5.5=claude-haiku-5.5", args: ["--host", "copilot-cli", "--copilot-model", SUB], passed: "claude-sonnet-5.5", session: { substitution: SUB, passed: "claude-sonnet-5.5" }, title: "the option comes before the variable" },
  { n: 9, agent: "architect:sdd-conductor", args: ["--host", "opencode", "--copilot-model", SUB], error: "eval: --copilot-model applies to --host copilot-cli only; no session started", title: "--copilot-model on --host opencode is refused" },
  { n: 10, agent: "architect:sdd-conductor", args: ["--host", "copilot-cli", "--copilot-model", "claude-opus-5.5"], error: `eval: --copilot-model "claude-opus-5.5" ${FORM}`, title: "a value without =<to> is refused" },
  { n: 11, agent: "architect:sdd-conductor", args: ["--host", "copilot-cli", "--copilot-model", `${SUB},claude-opus-5.5=claude-haiku-5.5`], error: `eval: --copilot-model "${SUB},claude-opus-5.5=claude-haiku-5.5" ${FORM}`, title: "a <from> given twice is refused" },
  { n: 12, agent: "architect:sdd-conductor", variable: "claude opus=claude-sonnet-5.5", args: ["--host", "copilot-cli"], error: `eval: SDD_EVAL_COPILOT_MODEL "claude opus=claude-sonnet-5.5" ${FORM}`, title: "a variable value with a space is refused" },
  { n: 13, agent: "architect:sdd-conductor", variable: "claude opus=claude-sonnet-5.5", args: ["--host", "opencode"], title: "a run on --host opencode does not read the variable" },
];

for (const row of ROWS_680) {
  test(`C002-TS-680 row ${row.n} — ${row.title}`, () => {
    if (row.n === 1) assert.equal(packageModel("sdd-conductor"), "claude-opus-5.5", "the conductor's tier model of the package");
    if (row.n === 2) assert.equal(packageModel("sdd-auditor"), "claude-haiku-5.5");
    const r = runMain(row.args, { agent: row.agent, ...(row.model ? { model: row.model } : {}), ...(row.variable !== undefined ? { variable: row.variable } : {}) });
    if (row.error) {
      assert.equal(r.status, 1, r.stdout + r.stderr);
      assert.ok(r.stderr.split(/\r?\n/).includes(row.error), r.stderr);
      assert.equal(r.started, 0, "the stub host was not started");
      assert.equal(r.records.length, 0, "no result written");
      return;
    }
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(r.started, 1, "one session");
    if (row.n === 13) {
      assert.equal(r.args, null, "no Copilot CLI session");
      assert.equal(r.records[0]!["target"], "opencode");
      return;
    }
    const args = r.args!;
    assert.equal(once(args, "--agent"), 1);
    assert.equal(valueOf(args, "--agent"), row.agent);
    assert.equal(once(args, "--model"), 1);
    assert.equal(valueOf(args, "--model"), row.passed);
    if (row.args.includes("--copilot-model") || row.variable) assert.ok(!args.some((a, i) => a === "--model" && args[i + 1] === "claude-opus-5.5"), "no --model claude-opus-5.5");
    const sm = r.records[0]!["session_model"] as Record<string, unknown>;
    assert.equal(sm["agent"], row.agent);
    for (const [k, v] of Object.entries(row.session!)) assert.deepEqual(sm[k], v, `session_model.${k}`);
    assert.deepEqual(sm["used"], [row.passed], "the stub ran the session agent on the passed model");
    assert.deepEqual(r.records[0]!["agent_models"], { [row.agent]: [row.passed] });
  });
}

test("C002-TS-680 (supporting): a session agent whose agent file has no model field, in a row without one, ends before the host starts with error \"no model field in agents/<agent>.agent.md\"", async () => {
  const copy = tmp("sdd-cp-nomodel-");
  cpSync(pkg(), copy, { recursive: true });
  const file = join(copy, "agents", "sdd-auditor.agent.md");
  writeFileSync(file, readFileSync(file, "utf8").replace(/^model:.*\r?\n/m, ""));
  const cwd = tmp("sdd-cp-nomodel-ws-");
  const host = copilotStubHost({ endAfter: 1 });
  const s = await runCopilotCliSession({ cwd, prompt: "hi", agent: "architect:sdd-auditor", allowTools: [] }, { host, pkg: copy, scripts: SCRIPTS, identity: IDENTITY });
  assert.equal(host.calls.length, 0, "the host did not start");
  assert.equal(s.end_reason, "error");
  assert.equal(s.error, "no model field in agents/sdd-auditor.agent.md");
  assert.equal(s.usage.turns, 0);
  assert.deepEqual(s.session_model, { agent: "architect:sdd-auditor", chosen: null, source: "agent file", substitution: null, passed: null, used: [] });
  assert.deepEqual(s.agent_models, {});
  // With a case model the agent file's missing field does not matter.
  const t = await runCopilotCliSession({ cwd: tmp("sdd-cp-nomodel-ws2-"), prompt: "hi", agent: "architect:sdd-auditor", model: "claude-haiku-5.5", allowTools: [] }, { host: copilotStubHost({ endAfter: 1 }), pkg: copy, scripts: SCRIPTS, identity: IDENTITY });
  assert.equal(t.end_reason, "completed");
});

test("C002-TS-680 (supporting): agent_models holds the session agent and every subagent with assistant messages, each with its distinct models in the order of first use", async () => {
  const script = [[{ subagent: "sdd-auditor", calls: [{ tool: "sdd-shell-run_command", input: { command: "sdd lint 001" } }] }], [{ subagent: "general-purpose", model: "gpt-x", calls: [] }], [{ subagent: "sdd-auditor", model: "claude-sonnet-5.5", calls: [] }]];
  const { s } = await session({ endAfter: 3, script, subagentModels: { "sdd-auditor": "claude-haiku-5.5" } }, { copilotModel: { "claude-opus-5.5": "claude-sonnet-5.5" } });
  assert.deepEqual(s.agent_models, { "architect:sdd-conductor": ["claude-sonnet-5.5"], "architect:sdd-auditor": ["claude-haiku-5.5", "claude-sonnet-5.5"], "general-purpose": ["gpt-x"] });
  assert.deepEqual(s.session_model, { agent: "architect:sdd-conductor", chosen: "claude-opus-5.5", source: "agent file", substitution: "claude-opus-5.5=claude-sonnet-5.5", passed: "claude-sonnet-5.5", used: ["claude-sonnet-5.5"] });
  // The host's refusal of the passed model: no model call, used empty, no key in agent_models.
  const refused = await session({ refuseModel: true });
  assert.equal(refused.s.end_reason, "error");
  assert.match(String(refused.s.error), /Error: Model "claude-opus-5\.5" from --model flag is not available\./);
  assert.deepEqual([refused.s.usage.turns, refused.s.usage.usd, refused.s.spend, refused.s.models, refused.s.session_model.used, refused.s.agent_models, refused.s.copilot_usage?.ai_credits], [0, 0, "reported", [], [], {}, 0]);
});

test("C002-TS-680 (supporting): a relayed session agent gets its own model once", async () => {
  const { host } = await session({ endAfter: 1 }, { agent: "architect:eval-dispatcher", prompt: "Dispatch: sdd-auditor\nBrief — lint 001" });
  const args = host.calls[0]!.args as string[];
  assert.equal(valueOf(args, "--agent"), "architect:sdd-auditor");
  assert.equal(once(args, "--model"), 1);
  assert.equal(valueOf(args, "--model"), packageModel("sdd-auditor"));
});

test("C002-TC-912: a prompt-file prompt runs the file's body with its arguments and the transcript holds one prompt-file record; any other prompt is passed as it is", async () => {
  for (const [prompt, file, args] of [["/doctor", "prompts/doctor.prompt.md", null], ['/architect:new "Coupon codes"', "prompts/new.prompt.md", '"Coupon codes"'], ["/architect-doctor", "prompts/doctor.prompt.md", null]] as const) {
    const { s, host } = await session({ endAfter: 1 }, { prompt });
    const text = valueOf(host.calls[0]!.args as string[], "-p")!;
    const body = readFileSync(join(pkg(), ...file.split("/")), "utf8").replace(/\r\n/g, "\n").replace(/^---\n[\s\S]*?\n---\n/, "").trim();
    assert.ok(text.startsWith(body.slice(0, 40)), `${prompt}: the prompt file's body without its frontmatter`);
    assert.ok(!text.startsWith("---"));
    if (args) assert.ok(text.endsWith(`\n\nArguments: ${args}`), text.slice(-80));
    else assert.ok(!text.includes("Arguments:"), prompt);
    const records = s.transcript.filter((r: any) => r.type === "harness" && r.event === "prompt-file");
    assert.equal(records.length, 1, prompt);
    assert.equal((records[0] as any).file, file);
  }
  const { s, host } = await session({ endAfter: 1 }, { prompt: "/no-such-prompt" });
  assert.equal(valueOf(host.calls[0]!.args as string[], "-p"), "/no-such-prompt");
  assert.equal(s.transcript.filter((r: any) => r.type === "harness" && r.event === "prompt-file").length, 0);
});

test("C002-TC-913: --no-auto-update with COPILOT_AUTO_UPDATE=false, --disable-builtin-mcps, --max-ai-credits, --usage-output-file and --log-dir in the run folder, each once; sorted --allow-tool per permission, both modes; usage from the usage file", async () => {
  const { s, host } = await session({ endAfter: 2, creditsPerTurn: 3 }, { allowTools: ["Write", "Edit", "Bash", "Read", "mcp__plugin_architect_serena__find_symbol"] });
  const args = host.calls[0]!.args as string[];
  for (const flag of ["--no-auto-update", "--disable-builtin-mcps", "--max-ai-credits", "--usage-output-file", "--log-dir"]) assert.equal(once(args, flag), 1, flag);
  assert.equal((host.calls[0]!.env as Record<string, string>)["COPILOT_AUTO_UPDATE"], "false");
  for (const flag of ["--usage-output-file", "--log-dir"]) assert.match(valueOf(args, flag)!, /sdd-eval-cp-run-/, `${flag} inside the run folder`);
  const allow = args.filter((a) => a.startsWith("--allow-tool"));
  assert.deepEqual(allow, [...allow].sort(), "sorted");
  assert.equal(new Set(allow).size, allow.length, "each once");
  assert.deepEqual(allow, ["--allow-tool=sdd-files", "--allow-tool=sdd-shell", "--allow-tool=serena(find_symbol)"]);
  assert.ok(!args.includes("--allow-all-tools") && !args.includes("--yolo"));
  assert.deepEqual(allowToolArgs(["Write", "Edit", "Bash", "Read", "mcp__plugin_architect_serena__find_symbol"], { mode: "copilot-hooks" }), ["--allow-tool=serena(find_symbol)", "--allow-tool=shell", "--allow-tool=write"]);
  assert.equal(s.copilot_usage?.ai_credits, 6);
  assert.ok(Math.abs((s.usage.usd ?? 0) - 0.06) < 1e-9);
});

test("C002-TC-914: Architect subagents are reported as architect:<agent> with host_agent, host built-in agents by their own name, in a host row and a row without host", async () => {
  const script = [[{ subagent: "sdd-auditor", calls: [{ tool: "sdd-shell-run_command", input: { command: "sdd lint 001" } }] }, { subagent: "general-purpose", calls: [{ tool: "view", input: { path: "a" } }] }]];
  for (const names of [namesOf({ host: "copilot-cli" }), namesOf({})]) {
    const { s } = await session({ endAfter: 1, script }, { names });
    const starts = s.transcript.filter((r: any) => r.type === "sdk" && r.message.subtype === "task_started").map((r: any) => [r.message.subagent_type, r.message.host_agent]);
    assert.deepEqual(starts, [["architect:sdd-auditor", "sdd-auditor"], ["general-purpose", "general-purpose"]], names);
    const lint = toolUses(s).find((b: any) => b.host_tool === "sdd-shell-run_command");
    assert.equal(lint.agent, "architect:sdd-auditor", names);
    assert.equal(toolUses(s).find((b: any) => b.host_tool === "view").agent, "general-purpose", names);
  }
});

for (const loaded of [true, false]) {
  test(`C002-TC-915: the hooks event gives workspace_hooks_loaded ${loaded} as the host log gives it, with the deny's hook source; the variable is set`, async () => {
    const hostLog = `${loaded ? "2026-10-20T10:00:00Z [INFO] Loading repo hooks in prompt mode\n" : ""}2026-10-20T10:00:01Z [INFO] session started\n`;
    const { s, host } = await session({ endAfter: 1, hostLog, script: [[{ tool: "create", input: { path: "src/app.ts", file_text: "x" }, deny: "hook" }]] });
    assert.equal((host.calls[0]!.env as Record<string, string>)["GITHUB_COPILOT_PROMPT_MODE_REPO_HOOKS"], "true");
    const hooks = s.transcript.filter((r: any) => r.type === "harness" && r.event === "hooks") as any[];
    assert.equal(hooks.length, 1);
    assert.equal(hooks[0].workspace_hooks_loaded, loaded);
    assert.deepEqual(hooks[0].hook_deny_sources, [".github_hooks_architect-guard.json"]);
  });
}
