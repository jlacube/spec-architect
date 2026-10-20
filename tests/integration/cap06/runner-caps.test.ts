// C002-TC-614 (OpenCode rows) and C002-TC-611 — verify C002-TS-614 (C002-AC-611.1, C002-REQ-611,
// C002-NFR-105) and C002-TS-611 (C002-AC-608.1, C002-REQ-608) with the stub host of
// evals/harness/runners/stub.mjs (C002-T-044): the caps end a session that never ends by itself at 30
// turns and at 0.50 USD; the OpenCode runner answers, dismisses or gives up on `question` calls, maps
// names back to Claude Code's, and answers permission requests by `allowTools`; the run.mjs options of
// step 2 (default host, unknown host, a `--filter` that selects no case). C002-TC-906 … C002-TC-911
// (C002-T-064; C002-IF-010 §1 … §4, revised for defect D-015): rows by host, the provider key with a
// stubbed host start, the direct relay, names per host row, `answer` and `allowTools`; and the
// runner's version stamp of `targetPackage.version` (supports C002-TC-515). No paid session, no network.
// The run.mjs cases run in a child process from the source files (the fixtures resolve paths from their
// own location, which a bundled test would move).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createCaps } from "../../../evals/harness/caps.mjs";
import { hostProcessEnv } from "../../../evals/harness/opencode/driver.mjs";
import { driverHost as runnerDriverHost, generatedPackage, nameMaps, permissionReply, replyFor, runOpenCodeSession, sessionStart } from "../../../evals/harness/runners/opencode.mjs";
import { namesOf, setHarnessContext } from "../../../evals/harness/session.mjs";
import { doctorCase as doctorCaseJs, shims as shimsJs } from "../../../evals/targets/doctor/doctor-cases.mjs";
const doctorCase = doctorCaseJs as unknown as (host: string, cfg: string, o: Record<string, unknown>) => { env: Record<string, string> };
const shims = shimsJs as unknown as (name: string, o: Record<string, unknown>) => string;
import { runBundled } from "../cli/helpers.ts";
import { envWithPath, nodeOnlyDir, plantExe, STUB_EXE_SKIP } from "../stub-exe.ts";
import { stubHost } from "../../../evals/harness/runners/stub.mjs";
import { injectionSummary, ledgerEntry, runScenario, selectScenarios, stopRule } from "../../../evals/harness/run.mjs";
import { repoRoot } from "../../helpers.ts";

const ROOT = repoRoot();
type Session = Awaited<ReturnType<typeof runOpenCodeSession>>;

async function session(stub: Parameters<typeof stubHost>[0], options: Record<string, unknown> = {}): Promise<Session> {
  const cwd = mkdtempSync(join(tmpdir(), "sdd-caps-"));
  try {
    return await runOpenCodeSession({ cwd, prompt: "hi", agent: "architect:sdd-conductor", allowTools: [], ...options }, { host: stubHost(stub) });
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

// --- C002-TS-614: caps with a stub host (OpenCode eval runner rows) ---------------------------------

test("C002-TS-614 OpenCode runner, 0.01 USD per turn: the session ends after 30 turns with the reason turn cap", async () => {
  const s = await session({ spendPerTurn: 0.01 });
  assert.equal(s.end_reason, "turn cap");
  assert.equal(s.usage.turns, 30);
  assert.ok(Math.abs((s.usage.usd ?? 0) - 0.3) < 1e-9, `usd ${s.usage.usd}`);
  assert.equal(s.result.subtype, "error_max_turns");
  assert.equal(s.target, "opencode");
});

test("C002-TS-614 OpenCode runner, 0.10 USD per turn: the session ends after 5 turns with the reason spend cap", async () => {
  const s = await session({ spendPerTurn: 0.1 });
  assert.equal(s.end_reason, "spend cap");
  assert.equal(s.usage.turns, 5);
  assert.ok(Math.abs((s.usage.usd ?? 0) - 0.5) < 1e-9, `usd ${s.usage.usd}`);
  assert.equal(s.result.subtype, "error_max_budget_usd");
});

test("the caps default to 30 turns and 0.50 USD; a case's lower caps apply", async () => {
  const caps = createCaps();
  assert.equal(caps.maxTurns, 30);
  assert.equal(caps.maxBudgetUsd, 0.5);
  const s = await session({ spendPerTurn: 0.01 }, { maxTurns: 7 });
  assert.deepEqual([s.end_reason, s.usage.turns], ["turn cap", 7]);
  const t = await session({ spendPerTurn: 0.1 }, { maxBudgetUsd: 0.35 });
  assert.deepEqual([t.end_reason, t.usage.turns], ["spend cap", 4]);
});

test("a host that reports no spend: the turn cap alone applies and the result says spend unreported", async () => {
  const s = await session({ reportsSpend: false });
  assert.equal(s.end_reason, "turn cap");
  assert.equal(s.usage.turns, 30);
  assert.equal(s.usage.usd, null);
  assert.equal(s.spend, "unreported");
});

test("a session that ends by itself ends with completed and its host version recorded as read", async () => {
  const s = await session({ endAfter: 3, version: "1.18.99" });
  assert.equal(s.end_reason, "completed");
  assert.equal(s.usage.turns, 3);
  assert.deepEqual(s.host_versions, { opencode: "1.18.99" });
});

test("an assistant message that carries a provider error ends the session with the reason error, not completed (C002-T-056)", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "sdd-caps-"));
  const info = (id: string, extra: Record<string, unknown> = {}) => ({ id, sessionID: "ses_1", role: "assistant", time: { created: Date.now() }, modelID: "m", providerID: "p", cost: 0, tokens: { input: 0, output: 0, cache: { read: 0, write: 0 } }, ...extra });
  const host = {
    needsPackage: false,
    async start() {
      return {
        version: "1.18.31",
        async run() {
          const messages = [
            { info: info("msg_1"), parts: [{ type: "text", text: "first" }] },
            { info: info("msg_2", { error: { name: "APIError", data: { message: "Provider returned error", statusCode: 429, isRetryable: true } } }), parts: [] },
          ];
          return { sessionID: "ses_1", messages, parts: [], events: [], children: [], error: null, aborted: false };
        },
        async stop() {},
      };
    },
  };
  try {
    const s = await runOpenCodeSession({ cwd, prompt: "hi", agent: "architect:sdd-conductor", allowTools: [] }, { host });
    assert.equal(s.end_reason, "error");
    assert.equal(s.result.subtype, "error_during_execution");
    assert.match(String(s.error), /APIError \(HTTP 429\): Provider returned error/);
    assert.ok(s.transcript.some((r: any) => r.type === "harness" && r.event === "error" && /HTTP 429/.test(r.message)));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("a subagent's spend counts toward the spend cap but its turns do not count as session turns", () => {
  const caps = createCaps({ maxTurns: 3, maxBudgetUsd: 0.5 });
  assert.equal(caps.spend(0.2), null);
  assert.equal(caps.turn(0.1), null);
  assert.equal(caps.spend(0.2), "spend cap");
  assert.deepEqual(caps.usage(), { turns: 1, usd: 0.5 });
});

// --- question calls (C002-REQ-610, C002-IF-010 §4) -------------------------------------------------

const QUESTION = { question: "Which profile?", header: "Profile", options: [{ label: "lite (Recommended)", description: "small" }, { label: "full", description: "large" }] };
const asks = [[{ tool: "question", input: { questions: [QUESTION] } }]];

test("a question call is answered from the case's script through question.reply and reported by its source name", async () => {
  const s = await session({ endAfter: 2, script: asks }, { answer: (q: { options: { label: string }[] }) => q.options[1]!.label });
  assert.equal(s.end_reason, "completed");
  const answer = s.transcript.find((r: { event?: string }) => r.event === "answer") as { route: string; answers: Record<string, string> };
  assert.equal(answer.route, "question.reply");
  assert.deepEqual(answer.answers, { "Which profile?": "full" });
  const call = s.transcript.flatMap((r: { type: string; message?: { type: string; message?: { content?: { type: string; name?: string; input?: { questions?: { multiSelect?: boolean }[] } }[] } } }) =>
    r.type === "sdk" && r.message?.type === "assistant" ? (r.message.message?.content ?? []).filter((b) => b.type === "tool_use") : [],
  );
  assert.equal(call[0]?.name, "AskUserQuestion");
  assert.equal(call[0]?.input?.questions?.[0]?.multiSelect, false);
});

test("a case written for OpenCode (host field) reads OpenCode's tool names", async () => {
  const s = await session({ endAfter: 2, script: [[{ tool: "question", input: { questions: [QUESTION] } }, { tool: "sdd-files_write_file", input: { path: ".sdd/x.md", content: "x" } }]] }, { names: "host" });
  const names = s.transcript.flatMap((r: { type: string; message?: { type: string; message?: { content?: { type: string; name?: string }[] } } }) =>
    r.type === "sdk" && r.message?.type === "assistant" ? (r.message.message?.content ?? []).filter((b) => b.type === "tool_use").map((b) => b.name) : [],
  );
  assert.deepEqual(names, ["question", "sdd-files_write_file"]);
});

test("a question the script does not cover ends the session with question unanswerable", async () => {
  const s = await session({ script: asks }, { answer: () => "" });
  assert.equal(s.end_reason, "question unanswerable");
  assert.equal(s.usage.turns, 1);
});

test("a scripted dismissal goes through question.reject; an empty list replies with no answers", () => {
  assert.deepEqual(replyFor([QUESTION], () => ({ reject: true }), {}), { kind: "reject" });
  assert.deepEqual(replyFor([QUESTION], () => [], {}), { kind: "reply", answers: [] });
  assert.deepEqual(replyFor([QUESTION, QUESTION], (q: typeof QUESTION) => q.options[0]!.label, {}), { kind: "reply", answers: [["lite (Recommended)"], ["lite (Recommended)"]] });
  assert.equal(replyFor([QUESTION], () => undefined, {}).kind, "unanswerable");
});

// --- names, agents, prompts, permissions (C002-IF-010 §2, §3) ----------------------------------------

test("the OpenCode table maps tool names both ways", () => {
  const m = nameMaps();
  assert.deepEqual(m.toHost("Write"), ["sdd-files_write_file"]);
  assert.deepEqual(m.toHost("Agent"), ["task"]);
  assert.equal(m.toSource("sdd-files_write_file"), "Write");
  assert.equal(m.toSource("sdd-files-write_file"), "Write");
  assert.equal(m.toSource("sdd-shell_run_command"), "Bash");
  assert.equal(m.toSource("bash"), "Bash");
  assert.equal(m.toSource("question"), "AskUserQuestion");
  assert.equal(m.toSource("task"), "Agent");
  assert.equal(m.toSource("context7_resolve-library-id"), "mcp__plugin_architect_context7__resolve-library-id");
});

test("agent names lose the architect: prefix; command prompts run the server command; the eval relay prompts the specialist", () => {
  assert.deepEqual(sessionStart("architect:sdd-conductor", "/architect:gate 004"), { agent: "sdd-conductor", command: { name: "architect-gate", arguments: "004" } });
  assert.deepEqual(sessionStart("sdd-conductor", '/architect-new "Export to CSV"'), { agent: "sdd-conductor", command: { name: "architect-new", arguments: '"Export to CSV"' } });
  assert.deepEqual(sessionStart("architect:eval-dispatcher", "Dispatch: sdd-critic\nBrief — critic"), { agent: "sdd-critic", text: "Brief — critic", relay: "direct" });
  assert.deepEqual(sessionStart("architect:sdd-conductor", "hi"), { agent: "sdd-conductor", text: "hi" });
});

test("permission requests are answered by allowTools; read-only requests allowed, external_directory refused", () => {
  const m = nameMaps();
  assert.equal(permissionReply("edit", ["Write"], m), "once");
  assert.equal(permissionReply("edit", [], m), "reject");
  assert.equal(permissionReply("bash", ["Bash"], m), "once");
  assert.equal(permissionReply("task", ["Agent"], m), "once");
  assert.equal(permissionReply("webfetch", [], m), "reject");
  assert.equal(permissionReply("read", [], m), "once");
  assert.equal(permissionReply("external_directory", ["Write", "Edit", "Bash"], m), "reject");
});

test("a rejected permission request is recorded as a denied call", async () => {
  const s = await session({ endAfter: 1, script: [[{ tool: "bash", input: { command: "rm -rf src" }, permission: "bash" }]] }, { allowTools: ["Write"] });
  assert.ok(s.transcript.some((r: { event?: string; tool?: string }) => r.event === "denied" && r.tool === "Bash"));
});

// --- ledger stop rule and injection summary (test plan §4.1, C002-IF-009 §1) ------------------------

test("the stop rule counts the pool's OpenRouter entries and H of at least 0.65 USD", () => {
  const general = Array.from({ length: 58 }, () => ({ provider: "openrouter", pool: "general", cost_usd: 0.5 }));
  const ledger = { pools: { general: 30, reserve: 10 }, entries: [...general, { provider: "claude-max", cost_usd: 0.4 }] };
  assert.deepEqual(stopRule(ledger, "general"), { ok: true, T: 29, H: 0.65, L: 30 });
  // A reserve entry does not count toward the general total, but its cost raises H.
  ledger.entries.push({ provider: "openrouter", pool: "reserve", cost_usd: 1.2 });
  assert.deepEqual(stopRule(ledger, "general"), { ok: false, T: 29, H: 1.2, L: 30 });
  assert.deepEqual(stopRule(ledger, "reserve"), { ok: true, T: 1.2, H: 1.2, L: 10 });
  const small = { pools: { general: 30 }, entries: [{ provider: "openrouter", pool: "general", cost_usd: 1 }] };
  assert.deepEqual(stopRule(small, "general"), { ok: true, T: 1, H: 1, L: 30 });
  const e = ledgerEntry({ scenario: { id: "TS-207" }, record: { pass: true, metrics: { cost_usd: 0.12 }, usage: { turns: 4, usd: 0.12 }, provider: "openrouter", models: ["openrouter/anthropic/claude-opus-5.5"], host_versions: { opencode: "1.18.31" }, end_reason: "completed", spend: "reported" }, resultFile: join(ROOT, "evals", "results", "x.json"), task: "C002-T-044", step: "6", pool: "general" });
  assert.equal(e.provider, "openrouter");
  assert.equal(e.pool, "general");
  assert.equal(e.step, 6);
  assert.match(e.result, /(^|\/)evals\/results\/x\.json$/);
});

test("the injection summary lists each INJ case with acted_upon from its pass", () => {
  const s = injectionSummary([{ scenario: "INJ-01", runs: 1, pass: true }, { scenario: "INJ-02", runs: 1, pass: false }, { scenario: "TS-207", runs: 1, pass: true }], { hostVersions: { opencode: "1.18.31" } });
  assert.deepEqual(s, { target: "opencode", tier: "dev", source: "opencode-runner", host_versions: { opencode: "1.18.31" }, cases: [{ id: "INJ-01", acted_upon: false }, { id: "INJ-02", acted_upon: true }] });
  assert.equal(injectionSummary([{ scenario: "TS-207", runs: 1, pass: true }], { hostVersions: {} }), null);
});

// --- run.mjs options (step 2) and C002-TS-611, in a child process on the stub host ------------------

const RUN = join(ROOT, "evals", "harness", "run.mjs");

/** Runs run.mjs `main` in a child process with every host's runner replaced by the stub host. */
function runStubbed(argv: string[]): { status: number | null; out: string } {
  const dir = mkdtempSync(join(tmpdir(), "sdd-run-stub-"));
  const script = join(dir, "driver.mjs");
  const url = (p: string) => pathToFileURL(join(ROOT, "evals", "harness", p)).href;
  writeFileSync(
    script,
    [
      `import { main } from ${JSON.stringify(url("run.mjs"))};`,
      `import { runOpenCodeSession } from ${JSON.stringify(url("runners/opencode.mjs"))};`,
      `import { stubHost } from ${JSON.stringify(url("runners/stub.mjs"))};`,
      "const stub = (o) => runOpenCodeSession({ ...o, names: o.host === 'opencode' ? 'host' : 'source' }, { host: stubHost({ endAfter: 2 }) });",
      "const claude = async (o) => ({ ...(await stub(o)), target: 'claude-code', host_versions: undefined });",
      "process.exitCode = await main(JSON.parse(process.argv[2]), { runners: { opencode: stub, 'claude-code': claude, 'copilot-cli': stub }, ledger: 'unused' });",
    ].join("\n"),
  );
  try {
    const r = spawnSync(process.execPath, [script, JSON.stringify(argv)], { cwd: ROOT, encoding: "utf8", windowsHide: true, timeout: 120_000 });
    return { status: r.status, out: `${r.stdout}\n${r.stderr}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function resultDocs(dir: string): Record<string, unknown>[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as Record<string, unknown>);
}

test("run.mjs: without --host the session runs on claude-code (stub runner), and --results-dir keeps the repository clean", () => {
  const dir = mkdtempSync(join(tmpdir(), "sdd-run-default-"));
  try {
    const caseFile = join(dir, "case.eval.mjs");
    writeFileSync(caseFile, "export default { id: 'STUB-1', title: 'stub', agent: 'architect:sdd-conductor', fixture: null, prompt: 'hi', assert: () => [] };\n");
    const res = join(dir, "results");
    const r = runStubbed([caseFile, "--tier", "dev", "--results-dir", res]);
    assert.equal(r.status, 0, r.out);
    const [doc] = resultDocs(res);
    assert.equal(doc?.["host"], "claude-code");
    assert.equal(doc?.["target"], "claude-code");
    assert.equal(doc?.["runs"], 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("run.mjs: an unknown host exits non-zero before any session", () => {
  const r = spawnSync(process.execPath, [RUN, "--host", "vscode", join(ROOT, "evals", "targets", "gate", "TS-613.eval.mjs")], { cwd: ROOT, encoding: "utf8", windowsHide: true });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /unknown host vscode/);
  assert.match(r.stderr, /no session started/);
});

test("run.mjs: a --filter that selects no case exits non-zero before any session", () => {
  const r = spawnSync(process.execPath, [RUN, "--filter", "evals/does-not-exist", "--tier", "dev"], { cwd: ROOT, encoding: "utf8", windowsHide: true });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /no case file/);
  // Files found, but every row left out by --only (the --filter word is not read as a case file).
  const o = spawnSync(process.execPath, [RUN, "--host", "opencode", "--filter", "evals/targets/gate", "--only", "NO-SUCH-ROW"], { cwd: ROOT, encoding: "utf8", windowsHide: true });
  assert.notEqual(o.status, 0);
  assert.match(o.stderr, /holds no case for host opencode \(3 file\(s\); 0 row\(s\) of another host, 3 row\(s\) left out by --only\)/);
});

/** SHA-256 of every case file under evals/ outside evals/harness/. */
function caseHashes(): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) {
        if (!["node_modules", "results", "harness"].includes(e.name)) walk(p);
      } else if (e.name.endsWith(".mjs")) out.set(p, createHash("sha256").update(readFileSync(p)).digest("hex"));
    }
  };
  walk(join(ROOT, "evals"));
  return out;
}

test("C002-TS-611 the routing case of sdd-critic runs through the case API on a stub OpenCode host; case files untouched", () => {
  const before = caseHashes();
  const dir = mkdtempSync(join(tmpdir(), "sdd-run-611-"));
  try {
    const r = runStubbed([join(ROOT, "evals", "cap07", "TS-710.eval.mjs"), "--host", "opencode", "--tier", "dev", "--results-dir", dir]);
    // The stub session writes no critic report, so the case's assertions fail; the run itself happened.
    assert.ok(r.status === 0 || r.status === 1, r.out);
    const [doc] = resultDocs(dir);
    assert.equal(doc?.["scenario"], "TS-710");
    assert.equal(doc?.["target"], "opencode");
    assert.equal(doc?.["runs"], 1);
    const rec = (doc?.["records"] as { target: string; end_reason: string }[])[0];
    assert.equal(rec?.target, "opencode");
    assert.equal(rec?.end_reason, "completed");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  const after = caseHashes();
  assert.equal(after.size, before.size);
  for (const [f, h] of before) assert.equal(after.get(f), h, `${f} changed`);
});

// --- C002-TC-906 … C002-TC-911 (C002-T-064; C002-IF-010 §1 … §4, revised for defect D-015) -----------
// Stub host or a stubbed host start only: no opencode serve, no network, no paid session.

type Block = { type: string; name?: string; input?: Record<string, unknown>; host_tool?: string; id?: string };
const toolUses = (s: Session): Block[] =>
  s.transcript.flatMap((r: { type: string; message?: { type: string; message?: { content?: Block[] } } }) =>
    r.type === "sdk" && r.message?.type === "assistant" ? (r.message.message?.content ?? []).filter((b) => b.type === "tool_use") : [],
  );

test("C002-TC-906 rows by host: --host opencode keeps the opencode row and the row without host, --host claude-code the claude-code row and the row without host", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sdd-run-906-"));
  try {
    const caseFile = join(dir, "rows.eval.mjs");
    writeFileSync(
      caseFile,
      [
        "const row = (id, host) => ({ id, title: id, agent: 'architect:sdd-conductor', fixture: null, prompt: 'hi', assert: () => [], ...(host ? { host } : {}) });",
        "export default [row('ROW-CC', 'claude-code'), row('ROW-OC', 'opencode'), row('ROW-ANY')];",
      ].join("\n"),
    );
    const ids = async (host: string) => (await selectScenarios([caseFile], { host })).scenarios.map((x: { scenario: { id: string } }) => x.scenario.id);
    assert.deepEqual(await ids("opencode"), ["ROW-OC", "ROW-ANY"]);
    assert.deepEqual(await ids("claude-code"), ["ROW-CC", "ROW-ANY"]);
    // A selection that leaves no row for the host exits 1 before any session.
    const only = join(dir, "only-cc.eval.mjs");
    writeFileSync(only, "export default [{ id: 'ROW-CC', title: 'cc', host: 'claude-code', agent: 'architect:sdd-conductor', fixture: null, prompt: 'hi', assert: () => [] }];\n");
    const r = runStubbed([only, "--host", "opencode", "--tier", "dev", "--results-dir", join(dir, "results")]);
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /holds no case for host opencode \(1 file\(s\); 1 row\(s\) of another host, 0 row\(s\) left out by --only\); no session started/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("C002-TC-906 every Claude Code row of the doctor case files carries host claude-code, so --host opencode selects none of them", async () => {
  const dir = join(ROOT, "evals", "targets", "doctor");
  const files = readdirSync(dir).filter((f) => f.endsWith(".eval.mjs")).map((f) => join(dir, f));
  const all: { scenario: { id: string; host?: string; plugins?: unknown } }[] = [];
  for (const f of files) {
    const exported = (await import(pathToFileURL(f).href)).default;
    for (const scenario of Array.isArray(exported) ? exported : [exported]) all.push({ scenario });
  }
  // A Claude Code row loads the plugin folders (`plugins`); every row names its host.
  const claude = all.filter((x) => x.scenario.plugins !== undefined);
  assert.ok(claude.length > 0, "the doctor case files hold Claude Code rows");
  for (const x of all) assert.ok(typeof x.scenario.host === "string", `${x.scenario.id} has no host field`);
  for (const x of claude) assert.equal(x.scenario.host, "claude-code", x.scenario.id);
  const opencode = (await selectScenarios(files, { host: "opencode" })).scenarios.map((x: { scenario: { id: string; host?: string } }) => x.scenario);
  assert.ok(opencode.length > 0);
  for (const s of opencode) assert.equal(s.host, "opencode", `--host opencode selects ${s.id}`);
});

/** A fake driver start: computes the host environment as the real start does, then runs a stub session. */
function fakeStart(seen: { env?: Record<string, string>; started: boolean }) {
  return async (o: Record<string, unknown>) => {
    const env = hostProcessEnv(o) as Record<string, string>;
    seen.env = env;
    seen.started = true;
    const inner = await stubHost({ endAfter: 1 }).start();
    return { version: "1.18.31", run: inner.run, stop: async () => {} };
  };
}

test("C002-TC-907 the provider key: a missing or empty key file refuses the session before the host starts; a key reaches the host as OPENROUTER_API_KEY only, the folders are isolated, api_key_source is openrouter-key-file, the key is written nowhere", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sdd-runner-907-"));
  const saved: Record<string, string | undefined> = {};
  const set = (k: string, v: string | undefined) => {
    if (!(k in saved)) saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  };
  try {
    // Staged scripts for the package's sdd servers (no npm run package needed).
    const scripts = join(dir, "scripts");
    mkdirSync(scripts);
    for (const f of ["sdd.mjs", "sdd-mcp.mjs"]) writeFileSync(join(scripts, f), "process.exit(0);\n");
    set("SDD_EVAL_SDD_SCRIPTS", scripts);
    set("OPENROUTER_API_KEY", "caller-openrouter");
    set("OPENROUTER_BASE_URL", "http://caller.invalid");
    set("ANTHROPIC_API_KEY", "caller-anthropic");
    set("OPENAI_API_KEY", "caller-openai");
    const run = async (keyFile: string) => {
      const seen: { env?: Record<string, string>; started: boolean } = { started: false };
      const cwd = mkdtempSync(join(dir, "ws-"));
      try {
        const s = await runOpenCodeSession({ cwd, prompt: "hi", agent: "architect:sdd-conductor", allowTools: [] }, { host: runnerDriverHost({ keyFile, bin: process.execPath, start: fakeStart(seen) }) });
        return { s, seen };
      } catch (e) {
        return { error: e instanceof Error ? e.message : String(e), seen };
      }
    };
    const missing = await run(join(dir, "no-such-key.txt"));
    assert.match(missing.error ?? "", /paid OpenCode session refused: no OpenRouter key/);
    assert.equal(missing.seen.started, false, "the host did not start");
    writeFileSync(join(dir, "empty.txt"), "\n");
    const empty = await run(join(dir, "empty.txt"));
    assert.match(empty.error ?? "", /paid OpenCode session refused/);
    assert.equal(empty.seen.started, false);
    const KEY = "sk-or-v1-dummy-0123456789";
    writeFileSync(join(dir, "key.txt"), `${KEY}\n`);
    const ok = await run(join(dir, "key.txt"));
    assert.ok(ok.s, ok.error);
    const env = ok.seen.env!;
    assert.equal(env["OPENROUTER_API_KEY"], KEY);
    for (const k of Object.keys(env)) {
      if (k === "OPENROUTER_API_KEY") continue;
      assert.ok(!/^(OPENROUTER|ANTHROPIC|OPENAI)_/i.test(k), `the caller's ${k} reached the host`);
    }
    const runDir = (p: string) => p.toLowerCase().includes("sdd-eval-oc-run-");
    for (const k of ["XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME", "XDG_STATE_HOME", "SERENA_HOME", "OPENCODE_DB"]) assert.ok(runDir(env[k] ?? ""), `${k} = ${env[k]} is not under the run folder`);
    if (process.platform === "win32") assert.ok(runDir(env["LOCALAPPDATA"] ?? ""), "LOCALAPPDATA under the run folder");
    assert.equal(ok.s!.apiKeySource, "openrouter-key-file");
    assert.ok(!JSON.stringify(ok.s).includes(KEY), "the key text occurs in the result or transcript");
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    rmSync(dir, { recursive: true, force: true });
  }
});

test("C002-TC-907 run.mjs records api_key_source in each result record and the result file: null on the stub host", () => {
  const dir = mkdtempSync(join(tmpdir(), "sdd-run-907-"));
  try {
    const caseFile = join(dir, "case.eval.mjs");
    writeFileSync(caseFile, "export default { id: 'STUB-907', title: 'stub', host: 'opencode', agent: 'architect:sdd-conductor', fixture: null, prompt: 'hi', assert: () => [] };\n");
    const res = join(dir, "results");
    const r = runStubbed([caseFile, "--host", "opencode", "--tier", "dev", "--results-dir", res]);
    assert.equal(r.status, 0, r.out);
    const [doc] = resultDocs(res);
    assert.ok(doc && "api_key_source" in doc, JSON.stringify(doc));
    assert.equal(doc["api_key_source"], null);
    for (const rec of doc["records"] as Record<string, unknown>[]) assert.equal(rec["api_key_source"], null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("C002-TC-908 the eval relay runs directly on OpenCode: sdd-critic is the session's agent with the brief as its prompt, one relay record, no eval-dispatcher", async () => {
  const host = stubHost({ endAfter: 1 });
  const cwd = mkdtempSync(join(tmpdir(), "sdd-caps-908-"));
  try {
    const s = await runOpenCodeSession({ cwd, prompt: "Dispatch: sdd-critic\nBrief — review the spec of change 002", agent: "architect:eval-dispatcher", allowTools: [] }, { host });
    assert.deepEqual(host.calls.map((c: { agent: string; text?: string }) => [c.agent, c.text]), [["sdd-critic", "Brief — review the spec of change 002"]]);
    const relays = s.transcript.filter((r: { event?: string }) => r.event === "relay") as { agent: string }[];
    assert.equal(relays.length, 1);
    assert.equal(relays[0]!.agent, "sdd-critic");
    assert.ok(!host.calls.some((c: { agent: string }) => /eval-dispatcher/.test(c.agent)), "no eval-dispatcher agent started");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

const NAMES_SCRIPT = [
  [
    { tool: "sdd-files_write_file", input: { path: ".sdd/x.md", content: "x" } },
    { tool: "question", input: { questions: [QUESTION] } },
    { tool: "codesearch", input: { query: "x" } },
    { tool: "task", input: { subagent_type: "sdd-critic", prompt: "review", description: "review" } },
  ],
];

test("C002-TC-909 names per host row: a row with host opencode reads the host's names, a row without host the source names; every call carries host_tool", async () => {
  assert.equal(nameMaps().toSource("codesearch"), null, "codesearch is a host tool the table does not map");
  assert.equal(namesOf({ host: "opencode" }), "host");
  assert.equal(namesOf({}), "source");
  assert.equal(namesOf({ host: "claude-code" }), "source");
  const host = await session({ endAfter: 1, script: NAMES_SCRIPT }, { names: namesOf({ host: "opencode" }) });
  const h = toolUses(host);
  assert.deepEqual(h.map((b) => b.name), ["sdd-files_write_file", "question", "codesearch", "task"]);
  assert.deepEqual(h[0]!.input, { path: ".sdd/x.md", content: "x" }, "the host's input");
  assert.equal(h[3]!.input?.["subagent_type"], "sdd-critic");
  const src = await session({ endAfter: 1, script: NAMES_SCRIPT }, { names: namesOf({}) });
  const s = toolUses(src);
  assert.deepEqual(s.map((b) => b.name), ["Write", "AskUserQuestion", "codesearch", "Agent"]);
  assert.equal(s[0]!.input?.["file_path"], ".sdd/x.md");
  assert.equal(s[3]!.input?.["subagent_type"], "architect:sdd-critic");
  for (const b of [...h, ...s]) assert.ok(typeof b.host_tool === "string" && b.host_tool !== "", JSON.stringify(b));
  assert.deepEqual(s.map((b) => b.host_tool), ["sdd-files_write_file", "question", "codesearch", "task"]);
});

test("C002-TC-910 answer: without answer the first (Recommended) label through question.reply; { reject: true } dismisses through question.reject, recorded with null for a source row; a throwing answer ends the session with question unanswerable", async () => {
  const first = await session({ endAfter: 1, script: asks });
  assert.deepEqual(first.answers.map((a: { route: string; answers: unknown }) => [a.route, a.answers]), [["question.reply", { "Which profile?": "lite (Recommended)" }]]);
  const dismissed = await session({ endAfter: 1, script: asks }, { answer: () => ({ reject: true }) });
  assert.equal(dismissed.end_reason, "completed");
  assert.equal(dismissed.answers.length, 1);
  assert.equal(dismissed.answers[0].route, "question.reject");
  assert.equal(dismissed.answers[0].answers, null, "a dismissed call has no answer");
  assert.equal(toolUses(dismissed)[0]?.name, "AskUserQuestion", "a row without host reads AskUserQuestion");
  const thrown = await session({ endAfter: 1, script: asks }, {
    answer: () => {
      throw new Error("no rule");
    },
  });
  assert.equal(thrown.end_reason, "question unanswerable");
});

test("C002-TC-911 allowTools answers permission requests only: edit, bash, task by allowTools; read-only and question once; external_directory and doom_loop rejected; a call run without a request is neither answered nor denied", async () => {
  const m = nameMaps();
  for (const [permission, tool] of [["edit", "Write"], ["edit", "Edit"], ["bash", "Bash"], ["task", "Agent"]] as const) {
    assert.equal(permissionReply(permission, [tool], m), "once", `${permission} with ${tool}`);
    assert.equal(permissionReply(permission, [], m), "reject", `${permission} without ${tool}`);
  }
  for (const p of ["read", "glob", "grep", "list", "lsp", "todowrite", "todoread", "codesearch", "question"]) assert.equal(permissionReply(p, [], m), "once", p);
  for (const p of ["external_directory", "doom_loop"]) assert.equal(permissionReply(p, ["Write", "Edit", "Bash", "Agent"], m), "reject", p);
  // The package's own rules let the host run the sdd MCP server tool without asking: the runner neither
  // answers nor records it.
  const asked: string[] = [];
  const base = stubHost({ endAfter: 1, script: [[{ tool: "sdd-files_write_file", input: { path: ".sdd/x.md", content: "x" } }]] });
  const counting = {
    needsPackage: false,
    async start() {
      const h = await base.start();
      return { ...h, run: (o: { permission: (req: { permission: string }) => unknown }) => h.run({ ...o, permission: (req: { permission: string }) => (asked.push(req.permission), o.permission(req)) }) };
    },
  };
  const cwd = mkdtempSync(join(tmpdir(), "sdd-caps-911-"));
  let s: Session;
  try {
    s = await runOpenCodeSession({ cwd, prompt: "hi", agent: "architect:sdd-conductor", allowTools: [] }, { host: counting });
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
  assert.deepEqual(asked, [], "no permission request was answered");
  assert.ok(!s.transcript.some((r: { event?: string }) => r.event === "denied"), "not recorded as denied");
  assert.deepEqual(toolUses(s).map((b) => b.name), ["Write"]);
});

test("the runner's version stamp (supports C002-TC-515): targetPackage.version goes into the source copy's plugin.json, so the manifest and the {{package_version}} token carry it", () => {
  const manifestFile = join(ROOT, "plugins", "architect", ".claude-plugin", "plugin.json");
  const before = readFileSync(manifestFile);
  const dir = generatedPackage({ target: "opencode", version: "0.3.0" });
  const manifest = JSON.parse(readFileSync(join(dir, "architect-target.json"), "utf8")) as { package_version: string };
  assert.equal(manifest.package_version, "0.3.0");
  const install = readFileSync(join(dir, "INSTALL.md"), "utf8");
  assert.ok(install.includes("architect-sdd@0.3.0"), "the {{package_version}} token carries 0.3.0");
  assert.ok(readFileSync(manifestFile).equals(before), "the repository's plugin.json is not touched");
});

// --- C002-TC-614 (OpenCode rows; caps of the result record, critic CR-65; C002-T-065) ----------------
// The harness (run.mjs runScenario) writes the caps it passed to runSession into each result record.
async function harnessRecord(stub: Parameters<typeof stubHost>[0]): Promise<Record<string, any>> {
  const dir = mkdtempSync(join(tmpdir(), "sdd-caps-record-"));
  const prev = setHarnessContext({ host: "opencode", runners: { opencode: (o: Record<string, unknown>) => runOpenCodeSession(o, { host: stubHost(stub) }) } });
  try {
    const scenario = { id: "STUB-CAPS", title: "caps", agent: "architect:sdd-conductor", fixture: null, prompt: "hi", assert: () => [] };
    const doc = (await runScenario(scenario, { host: "opencode", resultsDir: dir, log: () => undefined })) as Record<string, any>;
    return doc["records"][0];
  } finally {
    setHarnessContext(prev);
    rmSync(dir, { recursive: true, force: true });
  }
}
for (const [spend, turns, reason] of [[0.01, 30, "turn cap"], [0.1, 5, "spend cap"]] as const) {
  test(`C002-TS-614 OpenCode eval runner, ${spend} USD per turn, a row without maxTurns and maxBudgetUsd: ${turns} turns, ${reason}, caps { turns: 30, usd: 0.50 } in the result record`, async () => {
    const record = await harnessRecord({ spendPerTurn: spend });
    assert.equal(record["end_reason"], reason);
    assert.equal(record["usage"].turns, turns);
    assert.deepEqual(record["caps"], { turns: 30, usd: 0.5 });
  });
}

// --- C002-TC-677 (C002-TS-677; C002-T-065): the spend cap checked after each step on OpenCode ---------
for (const row of [
  { cost: 0.12, subagent: undefined, steps: 5, spend: 0.6 },
  { cost: 0.25, subagent: undefined, steps: 2, spend: 0.5 },
  { cost: 0.12, subagent: { step: 5, cost: 0.05 }, steps: 5, spend: 0.65 },
]) {
  test(`C002-TS-677 — ${row.cost} USD per step${row.subagent ? ", a 0.05 USD subagent step in parallel with the fifth" : ""}: spend cap after ${row.steps} steps, ${row.spend} USD reported`, async () => {
    const stub = stubHost({ spendPerTurn: row.cost, ...(row.subagent ? { subagent: row.subagent } : {}) });
    const cwd = mkdtempSync(join(tmpdir(), "sdd-caps-"));
    try {
      const s = await runOpenCodeSession({ cwd, prompt: "hi", agent: "architect:sdd-conductor", allowTools: [] }, { host: stub });
      assert.equal(s.end_reason, "spend cap");
      assert.equal(s.usage.turns, row.steps, "steps of the session agent");
      assert.ok(Math.abs((s.usage.usd ?? 0) - row.spend) < 1e-9, `usd ${s.usage.usd}`);
      assert.equal(s.spend, "reported");
      // No step of the session agent or of a subagent starts after the step that brought the spend to 0.50 USD.
      const log = (stub.calls[0] as unknown as { steps: { kind: string; who: string; cost?: number }[] }).steps;
      let sum = 0;
      let reached = -1;
      log.forEach((e, i) => {
        if (e.kind !== "finish" || reached >= 0) return;
        sum += e.cost ?? 0;
        if (sum + 1e-9 >= 0.5) reached = i;
      });
      assert.ok(reached >= 0, JSON.stringify(log));
      assert.deepEqual(log.slice(reached + 1).filter((e) => e.kind === "start"), [], `no step started after the cap: ${JSON.stringify(log)}`);
      assert.equal(log.filter((e) => e.kind === "start" && e.who === "session").length, row.steps);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
}

// --- C002-TC-676 (C002-TS-676; C002-T-065): the pinned OpenCode binary first on the host's PATH --------
// A stubbed host start records the host process's environment (no opencode serve). The runner's PATH
// holds a folder standing for C:/Users/p01/.opencode/bin with an opencode reporting 2.0.32; the pinned
// binary (SDD_OPENCODE_BIN) is a stub-exe opencode.exe reporting 1.18.31 in a folder standing for
// C:/fx/opencode-1.18.31. Then the bundled `sdd host-version opencode` runs with the host's PATH.
{
  const PATH_KEY = Object.keys(process.env).find((k) => k.toUpperCase() === "PATH") ?? "PATH";
  const SEP = process.platform === "win32" ? ";" : ":";
  const norm = (p: string) => p.replace(/[\\/]+$/, "").replace(/\\/g, "/").toLowerCase();
  type Folders = { pinned: string; user: string };
  type Row = { name: string; caseEnv: () => Record<string, string>; order: (f: Folders, entries: string[]) => void; printed: string };
  const rows: Row[] = [
    {
      name: "a doctor row with no PATH in env",
      caseEnv: () => ({}),
      order: (f, e) => {
        assert.ok(norm(e[0]!).includes("sdd-eval-oc-run-") && norm(e[0]!).endsWith("/bin"), `the run's bin folder first: ${e[0]}`);
        assert.deepEqual(e.slice(1, 3).map(norm), [f.pinned, f.user].map(norm), "then the pinned folder, then the runner's own PATH");
      },
      printed: "opencode 1.18.31",
    },
    {
      name: "a doctorCase row whose machine configuration prepends the C002-TS-513 shim reporting 1.5.0",
      caseEnv: () => doctorCase("opencode", "cfg-no-ripwire", { prepend: [shims("tc676-opencode-1.5.0", { opencode: "1.5.0" })] }).env,
      order: (f, e) => {
        assert.ok(norm(e[0]!).endsWith("/tc676-opencode-1.5.0"), `the shim's folder first: ${e[0]}`);
        assert.equal(norm(e[1]!), norm(f.pinned), "then the pinned folder");
        assert.ok(e.slice(2).map(norm).includes(norm(f.user)), "then the configuration's folders");
      },
      printed: "opencode 1.5.0",
    },
    {
      name: "an opencode missing row, whose machine configuration removes OpenCode",
      caseEnv: () => doctorCase("opencode", "cfg-no-ripwire", { without: ["opencode"] }).env,
      order: (_f, e) => {
        for (const d of e.filter((x) => x !== "")) for (const n of ["opencode", "opencode.exe", "opencode.cmd"]) assert.ok(!existsSync(join(d, n)), `${d} holds ${n}`);
      },
      printed: "opencode missing",
    },
  ];
  for (const row of rows)
    test(`C002-TS-676 — ${row.name}: host PATH order, then sdd host-version opencode prints ${row.printed}`, { skip: STUB_EXE_SKIP }, async () => {
      const dir = mkdtempSync(join(tmpdir(), "sdd-runner-676-"));
      const saved: Record<string, string | undefined> = {};
      const set = (k: string, v: string | undefined) => {
        if (!(k in saved)) saved[k] = process.env[k];
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      };
      try {
        const user = join(dir, "Users", "p01", ".opencode", "bin");
        plantExe(user, "opencode", { on: { "--version": "2.0.32" } });
        const pinnedDir = join(dir, "fx", "opencode-1.18.31");
        const pinned = plantExe(pinnedDir, "opencode", { on: { "--version": "1.18.31" } });
        const scripts = join(dir, "scripts");
        mkdirSync(scripts);
        for (const f of ["sdd.mjs", "sdd-mcp.mjs"]) writeFileSync(join(scripts, f), "process.exit(0);\n");
        set("SDD_EVAL_SDD_SCRIPTS", scripts);
        set("SDD_OPENCODE_BIN", pinned);
        set(PATH_KEY, [user, nodeOnlyDir(), join(process.env["SystemRoot"] ?? "C:\\Windows", "System32")].join(SEP));
        const caseEnv = row.caseEnv();
        const cwd = mkdtempSync(join(dir, "ws-"));
        const seen: { env?: Record<string, string>; started: boolean } = { started: false };
        await runOpenCodeSession({ cwd, prompt: "hi", agent: "architect:sdd-conductor", allowTools: [], env: caseEnv }, { host: runnerDriverHost({ bin: pinned, start: fakeStart(seen) }) });
        const hostPath = Object.entries(seen.env!).find(([k]) => k.toUpperCase() === "PATH")?.[1] ?? "";
        row.order({ pinned: pinnedDir, user }, hostPath.split(SEP));
        const r = runBundled(["host-version", "opencode"], { cwd, env: envWithPath(hostPath) });
        assert.equal(r.stdout, `${row.printed}\n`, r.stderr);
      } finally {
        for (const [k, v] of Object.entries(saved)) {
          if (v === undefined) delete process.env[k];
          else process.env[k] = v;
        }
        rmSync(dir, { recursive: true, force: true });
      }
    });
}

// --- C002-T-056 harness fix: the driver's SDK requests carry no 300 s fetch timeout ------------------
// Node's fetch drops a request whose response headers take longer than 300 s (undici headersTimeout),
// and a prompt request answers only when the prompt has ended: a TS-634 session ended with the error
// "{}" at 300 s. The driver's client uses untimedFetch (node:http, no timeout; exercised on loopback by
// the replay, `npm run replay`, since the tests block the network); errorText keeps the error's message.
test("C002-T-056 errorText: an SDK fetch error keeps its message and cause instead of \"{}\"; a provider error object stays JSON", async () => {
  const { errorText, untimedFetch } = await import("../../../evals/harness/opencode/driver.mjs");
  assert.equal(typeof untimedFetch, "function");
  const e = new TypeError("fetch failed", { cause: Object.assign(new Error("Headers Timeout Error"), { name: "HeadersTimeoutError" }) });
  assert.equal(JSON.stringify(e), "{}");
  assert.equal(errorText(e), "fetch failed (cause: HeadersTimeoutError: Headers Timeout Error)");
  assert.equal(errorText({ name: "APIError", data: { message: "402" } }), '{"name":"APIError","data":{"message":"402"}}');
  assert.equal(errorText("session timed out"), "session timed out");
});
