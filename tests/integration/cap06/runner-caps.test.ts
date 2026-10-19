// C002-TC-614 (OpenCode rows) and C002-TC-611 — verify C002-TS-614 (C002-AC-611.1, C002-REQ-611,
// C002-NFR-105) and C002-TS-611 (C002-AC-608.1, C002-REQ-608) with the stub host of
// evals/harness/runners/stub.mjs (C002-T-044): the caps end a session that never ends by itself at 30
// turns and at 0.50 USD; the OpenCode runner answers, dismisses or gives up on `question` calls, maps
// names back to Claude Code's, and answers permission requests by `allowTools`; the run.mjs options of
// step 2 (default host, unknown host, a `--filter` that selects no case). No paid session, no network.
// The run.mjs cases run in a child process from the source files (the fixtures resolve paths from their
// own location, which a bundled test would move).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createCaps } from "../../../evals/harness/caps.mjs";
import { nameMaps, permissionReply, replyFor, runOpenCodeSession, sessionStart } from "../../../evals/harness/runners/opencode.mjs";
import { stubHost } from "../../../evals/harness/runners/stub.mjs";
import { injectionSummary, ledgerEntry, stopRule } from "../../../evals/harness/run.mjs";
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
