// The Claude Code eval runner (`runSession` with `--host claude-code`, through `evals/harness/run.mjs`, EVAL_HOST
// and EVAL_AUTH unset) on the Agent SDK stub (sdk-stub) on the mock timers of `node:test` (./eval-driver.ts):
// - C002-TC-614, the three Claude Code rows (C002-TS-614, C002-REQ-611, C002-NFR-105; revision D-025, revised
//   for defect D-031): the SDK gets `maxTurns` 30 and no `maxBudgetUsd`; at a notional 0.01 USD per model
//   call the session ends by the SDK's turn cap (`error_max_turns` after 30 turns), at 0.10 USD the runner
//   stops it at the 0.50 USD reading (`error_max_budget_usd` after 5 turns), under both auth modes;
// - C002-TC-928 (C002-TS-702, C002-REQ-643): the spend cap applied by the runner, six rows, and the supporting
//   test of the four bound conditions of C002-IF-010 §2.2 item 7 (`capBoundConditions`);
// - C002-TC-929 (C002-TS-703, C002-REQ-642): no budget in the options, the prompt or the system prompt that
//   the Agent SDK receives, four rows;
// - C002-TC-930 (C002-TS-704, C002-REQ-644): a failed reading stops the session and the run while the query
//   is open (with its ledger entry), and is ignored once it closes, six rows through `main` with a temporary
//   ledger; and the supporting test of the pinned Agent SDK (C002-RISK-039).
// - C002-TC-932 (C002-TS-706 rows 1 … 4, C002-REQ-645) and C002-TC-933 (C002-TS-707, C002-REQ-646): the early
//   stop when the row's check is decided (`stopWhen`), and its supporting tests (no injection row gives one;
//   the rule-1 rows with and without a condition). C002-T-072.
// No Claude Code process starts and nothing is billed. C002-T-069.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { INJECTION_CASE_SETS } from "../../../evals/harness/run.mjs";
import { capBoundConditions } from "../../../evals/harness/session.mjs";
import { repoRoot } from "../../helpers.ts";
import { type DriverRun, runDriver, writeCase } from "./eval-driver.ts";

const ROOT = repoRoot();
const near = (a: unknown, b: number, eps = 1e-9) => typeof a === "number" && Math.abs(a - b) < eps;
const harness = (tr: any[], event: string) => tr.filter((r) => r.type === "harness" && r.event === event);
const usageOf = (tr: any[], source?: string) => harness(tr, "usage").filter((r) => source === undefined || r.source === source);
const stubEv = (r: DriverRun, ev: string) => r.stub.filter((e) => e["ev"] === ev);
const optionsOf = (r: DriverRun) => stubEv(r, "options")[0]!;

/** Runs one case row through `main` in a fresh fixture folder. */
function run(args: string[], stub: Record<string, unknown>, row: { file?: string; id?: string; maxTurns?: number; prompt?: string } = {}, ledger?: string): DriverRun {
  const fx = mkdtempSync(join(tmpdir(), "sdd-claude-runner-"));
  try {
    const file = writeCase(fx, row.file ?? "evals/cap06/TS-702.eval.mjs", { id: row.id ?? "TS-702", prompt: row.prompt ?? "Start change 001", ...(row.maxTurns !== undefined ? { maxTurns: row.maxTurns } : {}) });
    return runDriver([file, "--host", "claude-code", "--tier", "dev", ...args], { root: fx, stub, ...(ledger ? { ledger } : {}) });
  } finally {
    rmSync(fx, { recursive: true, force: true });
  }
}

/** The assertions of every C002-TS-702 row: the queue rule and one `usage` record per reading. */
function queueRule(r: DriverRun, tr: any[]) {
  const req = usageOf(tr, "request");
  const ids = req.map((u) => u.message_id);
  assert.equal(new Set(ids).size, ids.length, `no usage request for a message ID already seen: ${ids.join(", ")}`);
  const opens = stubEv(r, "request").map((e) => e["open"] as number);
  assert.ok(opens.every((n) => n <= 1), `at most one usage request open at any time: ${opens.join(", ")}`);
  assert.equal(req.length, stubEv(r, "request").length, "one usage record per usage request");
  const results = tr.filter((x) => x.type === "sdk" && x.message.type === "result").length;
  assert.equal(usageOf(tr, "result").length, results, "one usage record per result message");
  const distinct = new Set(tr.filter((x) => x.type === "sdk" && x.message.type === "assistant").map((x) => x.message.message.id));
  assert.ok(req.length <= distinct.size, "at most as many requests as distinct message IDs");
}

/** Options the SDK got: `maxTurns`, neither `maxBudgetUsd` nor `taskBudget`, no cap in extra arguments. */
function noBudgetOptions(r: DriverRun, turns: number) {
  const o = optionsOf(r);
  assert.equal(o["maxTurns"], turns, "the SDK got maxTurns");
  assert.equal(o["maxBudgetUsd"], "absent", "the SDK got no maxBudgetUsd");
  assert.equal(o["taskBudget"], "absent", "the SDK got no taskBudget");
  assert.ok(!/budget|max-turns|turn/i.test(JSON.stringify(o["extraArgs"] ?? {})), `no extra argument names a cap: ${JSON.stringify(o["extraArgs"])}`);
}

const capRecord = (usd: number, cap: number) => ({ event: "cap", reason: "spend cap", usd, cap_usd: cap });
const capOf = (tr: any[]) => harness(tr, "cap").map(({ t, type, ...rest }) => rest);

// --- C002-TC-614: the three Claude Code rows -----------------------------------------------------------

const ROWS614: { auth: "subscription" | "api-key"; usdPerCall: number; turns: number; subtype: string; keySource: string }[] = [
  { auth: "subscription", usdPerCall: 0.01, turns: 30, subtype: "error_max_turns", keySource: "none" },
  { auth: "subscription", usdPerCall: 0.1, turns: 5, subtype: "error_max_budget_usd", keySource: "none" },
  { auth: "api-key", usdPerCall: 0.1, turns: 5, subtype: "error_max_budget_usd", keySource: "/login managed key" },
];

ROWS614.forEach((row, i) => {
  test(`C002-TS-614 Claude Code row ${i + 1} — --auth ${row.auth} at ${row.usdPerCall.toFixed(2)} USD per model call: ${row.subtype} after ${row.turns} turns, maxTurns 30 and no maxBudgetUsd to the SDK, caps { turns: 30, usd: 0.50 }`, () => {
    const fx = mkdtempSync(join(tmpdir(), "sdd-claude-runner-"));
    try {
      const file = writeCase(fx, "evals/cap06/TS-614-claude.eval.mjs", { id: "TS-614-claude" });
      const r = runDriver([file, "--host", "claude-code", "--auth", row.auth, "--tier", "dev"], { root: fx, stub: { usdPerCall: row.usdPerCall, afterInterrupt: [{ result: {} }] } });
      assert.equal(r.status, 0, r.out);
      assert.deepEqual(r.given, [{ turns: 30, usd: null }], "the stub received maxTurns 30 and no maxBudgetUsd");
      noBudgetOptions(r, 30);
      assert.equal(r.records.length, 1, r.out);
      const rec = r.records[0]!;
      assert.equal(rec["metrics"].turns, row.turns);
      assert.equal(rec["metrics"].result_subtype, row.subtype);
      assert.deepEqual(rec["caps"], { turns: 30, usd: 0.5 });
      assert.equal(rec["auth"], row.auth);
      assert.equal(rec["api_key_source"], row.keySource);
      assert.equal(rec["claude_code_version"], "2.1.299", "the version of the init message is recorded");
      const tr = r.transcripts[0]!;
      if (row.subtype === "error_max_budget_usd") {
        assert.deepEqual(capOf(tr), [capRecord(0.5, 0.5)], "the runner stopped the session at the 0.50 USD reading");
        assert.equal(stubEv(r, "interrupt").length, 1);
      } else {
        assert.deepEqual(capOf(tr), [], "no cap record: the SDK ended the session at maxTurns");
        assert.equal(stubEv(r, "interrupt").length, 0);
      }
    } finally {
      rmSync(fx, { recursive: true, force: true });
    }
  });
});

// --- C002-TC-928: the Claude Code spend cap applied by the runner (C002-TS-702) ---------------------------

const AFTER_WRITE = [{ endCall: 0.1 }, { permission: "Write" }, { result: { subtype: "error_during_execution" } }];
/** Transcripts of rows 1, 2, 4 and 5, for the supporting test of the bound conditions. */
const stopped = new Map<number, any[]>();

function stoppedAtCap(r: DriverRun, tr: any[]) {
  assert.deepEqual(capOf(tr), [capRecord(0.5, 0.5)], "one cap record at the 0.50 USD reading");
  const interrupts = stubEv(r, "interrupt");
  assert.equal(interrupts.length, 1, "interrupt() sent once");
  const close = stubEv(r, "close");
  assert.equal(close.length, 1);
  assert.ok((close[0]!["t"] as number) >= (interrupts[0]!["t"] as number), "the query closed after the interrupt");
  assert.equal(close[0]!["why"], "abort", "the runner closed the query");
  assert.equal(harness(tr, "cap-close").length, 1, "one cap-close record");
}

function denied(r: DriverRun, tr: any[], tool: string) {
  const p = stubEv(r, "permission");
  assert.deepEqual(p.map((e) => [e["tool"], e["behavior"], e["message"]]), [[tool, "deny", `${tool} is not available in this evaluation`]]);
  assert.ok(!/budget|USD|cap/i.test(String(p[0]!["message"])), "the denial carries no text about a budget");
  assert.ok(harness(tr, "denied").some((d) => d.tool === tool), "a denied record");
}

test("C002-TS-702 row 1 — --auth subscription, answers after 100 ms: stopped at the 0.50 USD answer of the fifth call; Write denied; cap-close 0.60 / 0.50 / overshoot 0.10 / result; error_max_budget_usd at 0.60", () => {
  const r = run(["--auth", "subscription"], { usdPerCall: 0.1, usageDelayMs: 100, afterInterrupt: AFTER_WRITE });
  assert.equal(r.status, 0, r.out);
  const tr = r.transcripts[0]!;
  queueRule(r, tr);
  stoppedAtCap(r, tr);
  const capT = harness(tr, "cap")[0]!.t as number;
  assert.ok(capT >= 4100 && capT < 4200, `the cap at the fifth call's answer (4.1 s): ${capT}`);
  denied(r, tr, "Write");
  const { t, type, ...close } = harness(tr, "cap-close")[0]!;
  assert.deepEqual(close, { event: "cap-close", usd: 0.6, usd_at_cap: 0.5, after_cap_usd: 0.1, overshoot_usd: 0.1, closed_by: "result" });
  const rec = r.records[0]!;
  assert.equal(rec["metrics"].result_subtype, "error_max_budget_usd");
  assert.ok(near(rec["metrics"].cost_usd, 0.6), "the stub's cost after the interrupt, not cut to the cap");
  assert.equal(rec["caps"].usd, 0.5);
  assert.match(r.stdout, / · overshoot 0\.10 USD/);
  stopped.set(1, tr);
});

test("C002-TS-702 row 2 — --auth api-key, answers after 100 ms: the same stop; cap-close overshoot 0.10; error_max_budget_usd at 0.60", () => {
  const r = run(["--auth", "api-key"], { usdPerCall: 0.1, usageDelayMs: 100, afterInterrupt: AFTER_WRITE });
  assert.equal(r.status, 0, r.out);
  const tr = r.transcripts[0]!;
  queueRule(r, tr);
  stoppedAtCap(r, tr);
  denied(r, tr, "Write");
  assert.equal(harness(tr, "cap-close")[0]!.overshoot_usd, 0.1);
  const rec = r.records[0]!;
  assert.equal(rec["auth"], "api-key");
  assert.equal(rec["metrics"].result_subtype, "error_max_budget_usd");
  assert.ok(near(rec["metrics"].cost_usd, 0.6));
  assert.equal(rec["caps"].usd, 0.5);
  assert.match(r.stdout, / · overshoot 0\.10 USD/);
  stopped.set(2, tr);
});

test("C002-TS-702 row 3 — --auth subscription, answers after 2.4 s: the open first request coalesces the next triggers into one follow-up, answered at 4.8 s with 0.50 USD, which stops the session; 2 requests for 5 message IDs", () => {
  const r = run(["--auth", "subscription"], { usdPerCall: 0.1, usageDelayMs: 2400, afterInterrupt: [{ result: { total_cost_usd: 0.5 } }] });
  assert.equal(r.status, 0, r.out);
  const tr = r.transcripts[0]!;
  queueRule(r, tr);
  const req = usageOf(tr, "request");
  const ids = new Set(tr.filter((x) => x.type === "sdk" && x.message.type === "assistant").map((x) => x.message.message.id));
  assert.equal(req.length, 2, `2 usage requests: ${JSON.stringify(req)}`);
  assert.equal(ids.size, 5, "5 distinct message IDs");
  assert.equal(req[0]!.message_id, "msg_001");
  assert.ok(req[0]!.sent_t < 50 && Math.abs(req[0]!.t - 2400) < 50 && near(req[0]!.usd, 0.3), `first: ${JSON.stringify(req[0])}`);
  assert.equal(req[1]!.message_id, "msg_003", "the follow-up covers the second and third calls");
  assert.ok(Math.abs(req[1]!.sent_t - 2400) < 50 && Math.abs(req[1]!.t - 4800) < 50 && near(req[1]!.usd, 0.5), `follow-up: ${JSON.stringify(req[1])}`);
  assert.deepEqual(capOf(tr), [capRecord(0.5, 0.5)]);
  const rec = r.records[0]!;
  assert.equal(rec["metrics"].result_subtype, "error_max_budget_usd");
  assert.ok(near(rec["metrics"].cost_usd, 0.5));
});

test("C002-TS-702 row 4 — a subagent's call in parallel with the fifth ends after the 0.50 USD reading: Agent denied; cap-close after_cap_usd 0.20; error_max_budget_usd at 0.70, the subagent's call counted in full", () => {
  const r = run(["--auth", "subscription"], { usdPerCall: 0.1, usageDelayMs: 100, subagent: { atCall: 5 }, afterInterrupt: [{ endCall: 0.2 }, { permission: "Agent" }, { result: {} }] });
  assert.equal(r.status, 0, r.out);
  const tr = r.transcripts[0]!;
  queueRule(r, tr);
  stoppedAtCap(r, tr);
  assert.ok(tr.some((x) => x.type === "sdk" && x.message.type === "assistant" && x.message.parent_tool_use_id), "the subagent's message was streamed");
  denied(r, tr, "Agent");
  assert.equal(harness(tr, "cap-close")[0]!.after_cap_usd, 0.2);
  const rec = r.records[0]!;
  assert.equal(rec["metrics"].result_subtype, "error_max_budget_usd");
  assert.ok(near(rec["metrics"].cost_usd, 0.7));
  stopped.set(4, tr);
});

test("C002-TS-702 row 5 — nothing after the interrupt: the query closed 30 s after the interrupt (closed_by timeout); a result with is_error true, total_cost_usd 0.50, num_turns null and modelUsage {}", () => {
  const r = run(["--auth", "subscription"], { usdPerCall: 0.1, usageDelayMs: 100, afterInterrupt: [] });
  assert.equal(r.status, 0, r.out);
  const tr = r.transcripts[0]!;
  queueRule(r, tr);
  stoppedAtCap(r, tr);
  const interruptT = stubEv(r, "interrupt")[0]!["t"] as number;
  const closeT = stubEv(r, "close")[0]!["t"] as number;
  assert.ok(Math.abs(closeT - interruptT - 30_000) < 50, `closed 30 s after the interrupt: ${closeT - interruptT} ms`);
  const close = harness(tr, "cap-close")[0]!;
  assert.equal(close.closed_by, "timeout");
  assert.equal(close.usd, 0.5);
  const rec = r.records[0]!;
  assert.equal(rec["metrics"].result_subtype, "error_max_budget_usd");
  assert.ok(near(rec["metrics"].cost_usd, 0.5));
  assert.equal(rec["metrics"].turns, null, "num_turns null");
  assert.match(r.stdout, / · overshoot 0\.00 USD/);
  stopped.set(5, tr);
});

test("C002-TS-702 row 6 — the fifth call ends and the stub at once ends the session with success at 0.55 USD: no interrupt, no cap records, the open request ignored; the result keeps success at 0.55", () => {
  const r = run(["--auth", "subscription"], { usdPerCall: 0.1, usageDelayMs: 100, selfEnd: { afterCall: 5, result: { subtype: "success", total_cost_usd: 0.55 } } });
  assert.equal(r.status, 0, r.out);
  const tr = r.transcripts[0]!;
  queueRule(r, tr);
  assert.equal(stubEv(r, "interrupt").length, 0, "no interrupt()");
  assert.deepEqual(harness(tr, "cap"), []);
  assert.deepEqual(harness(tr, "cap-close"), []);
  const last = usageOf(tr, "request").at(-1)!;
  assert.equal(last.message_id, "msg_005");
  assert.equal(last.ignored, true, `the request refused at the close is ignored: ${JSON.stringify(last)}`);
  assert.match(String(last.error), /Query closed before response received/);
  const rec = r.records[0]!;
  assert.equal(rec["metrics"].result_subtype, "success");
  assert.ok(near(rec["metrics"].cost_usd, 0.55));
  assert.doesNotMatch(r.stdout, /overshoot/);
});

test("C002-TS-702 (supporting, critic CR-106) — the four bound conditions hold on the transcripts of rows 1, 2, 4 and 5, and a planted breach of each is reported by its number", () => {
  for (const n of [1, 2, 4, 5]) {
    const tr = stopped.get(n);
    assert.ok(tr, `row ${n} ran`);
    const b = capBoundConditions(tr);
    assert.equal(b.applies, true);
    assert.deepEqual(b.conditions.map((c: any) => [c.n, c.holds]), [[1, true], [2, true], [3, true], [4, true]], `row ${n}: ${JSON.stringify(b.conditions)}`);
  }
  const a = (t: number, id: string) => ({ t, type: "sdk", message: { type: "assistant", message: { id, content: [] }, parent_tool_use_id: null } });
  const u = (t: number, usd: number | null, source = "request") => ({ t, type: "harness", event: "usage", source, usd, message_id: source === "request" ? "m" : null, sent_t: source === "request" ? t - 100 : null });
  const base = () => [
    a(0, "m1"),
    u(100, 0.25),
    a(1000, "m2"),
    u(1100, 0.5),
    { t: 1100, type: "harness", event: "cap", reason: "spend cap", usd: 0.5, cap_usd: 0.5 },
    { t: 1150, type: "harness", event: "denied", tool: "Write", input: {} },
    { t: 1200, type: "sdk", message: { type: "result", subtype: "error_during_execution", total_cost_usd: 0.6 } },
    u(1200, 0.6, "result"),
    { t: 1200, type: "harness", event: "cap-close", usd: 0.6, usd_at_cap: 0.5, after_cap_usd: 0.1, overshoot_usd: 0.1, closed_by: "result" },
  ];
  const holds = (tr: any[]) => capBoundConditions(tr).conditions.filter((c: any) => !c.holds).map((c: any) => c.n);
  assert.deepEqual(holds(base()), [], "the planted base holds");
  const b1 = base();
  b1.splice(2, 0, u(500, 0.55)); // a reading at or above the cap before the one the cap record gives
  assert.deepEqual(holds(b1), [1]);
  const b2 = base();
  b2.splice(5, 0, { t: 1120, type: "harness", event: "allowed", tool: "Bash" } as any);
  assert.deepEqual(holds(b2), [2]);
  const b3 = base();
  b3.splice(8, 0, a(1250, "m3"));
  assert.deepEqual(holds(b3), [3]);
  const b4 = base();
  (b4[8] as any).t = 1100 + 30_000 + 5_001;
  assert.deepEqual(holds(b4), [4]);
  assert.deepEqual(capBoundConditions(base().filter((r: any) => r.event !== "cap")), { applies: false, conditions: [] });
});

// --- C002-TC-929: no budget in the options, the prompt or the system prompt (C002-TS-703) ------------------

const ROWS929: { name: string; args: string[]; file?: string; id?: string; maxTurns?: number; turns: number; usd: number }[] = [
  { name: "--auth subscription, a row without caps", args: ["--auth", "subscription"], turns: 30, usd: 0.5 },
  { name: "--auth api-key, a row without caps", args: ["--auth", "api-key"], turns: 30, usd: 0.5 },
  { name: "--auth subscription --cap-exception, TS-214 of evals/cap02/TS-214.eval.mjs", args: ["--auth", "subscription", "--cap-exception", "--only", "TS-214"], file: "evals/cap02/TS-214.eval.mjs", id: "TS-214", turns: 30, usd: 1.5 },
  { name: "--auth subscription, TS-213 of evals/cap02/TS-213.eval.mjs at 40 turns", args: ["--auth", "subscription", "--only", "TS-213"], file: "evals/cap02/TS-213.eval.mjs", id: "TS-213", maxTurns: 40, turns: 40, usd: 0.5 },
];

ROWS929.forEach((row, i) => {
  test(`C002-TS-703 row ${i + 1} — ${row.name}: maxTurns ${row.turns}, no maxBudgetUsd or taskBudget, the prompt unchanged, no budget text; caps.usd ${row.usd.toFixed(2)}`, () => {
    const r = run(row.args, { usdPerCall: 0.01, selfEnd: { afterCall: 1, result: { subtype: "success" } } }, { ...(row.file ? { file: row.file, id: row.id! } : {}), ...(row.maxTurns ? { maxTurns: row.maxTurns } : {}) });
    assert.equal(r.status, 0, r.out);
    noBudgetOptions(r, row.turns);
    const o = optionsOf(r);
    assert.equal(o["prompt"], "Start change 001", "the prompt it received");
    const texts = JSON.stringify([o["prompt"], o["systemPrompt"], o["appendSystemPrompt"]]);
    for (const bad of [row.usd.toFixed(2), String(row.usd), "USD", "budget", `${row.turns} turns`]) assert.ok(!texts.toLowerCase().includes(bad.toLowerCase()), `the prompt or the system prompt holds ${bad}: ${texts}`);
    const rec = r.records[0]!;
    assert.deepEqual(rec["caps"], { turns: row.turns, usd: row.usd });
    assert.equal(rec["metrics"].result_subtype, "success");
  });
});

// --- C002-TC-930: a failed reading (C002-TS-704) ------------------------------------------------------------

function ledgerFile(dir: string): string {
  const f = join(dir, "spend.json");
  writeFileSync(f, JSON.stringify({ description: "test ledger", pools: { general: 5 }, entries: [{ case: "old", host: "opencode", cost_usd: 0.1 }] }, null, 2) + "\n");
  return f;
}
const REC01 = { file: "evals/targets/caps/reconcile.eval.mjs", id: "REC-01" };
const ARGS930 = ["--auth", "subscription", "--only", "REC-01"];

function rejected(r: DriverRun, ledger: string, failAt: number) {
  assert.notEqual(r.status, 0, "the run ends with the error");
  assert.match(r.out, /claude-code spend check failed: [^\n]*; notional cost read 0\.20 USD/);
  assert.equal(r.records.length, 0, "no result record of REC-01");
  const tr = r.transcripts[0]!;
  const errs = usageOf(tr, "request").filter((u) => u.error && !u.ignored);
  assert.equal(errs.length, 1, `one failed reading that counts: ${JSON.stringify(usageOf(tr))}`);
  assert.ok(Math.abs(errs[0]!.t - failAt) < 50, `the failure at ${failAt} ms: ${errs[0]!.t}`);
  const interrupts = stubEv(r, "interrupt");
  assert.equal(interrupts.length, 1, "interrupt() once");
  assert.ok(Math.abs((interrupts[0]!["t"] as number) - failAt - 5000) < 50, `interrupt 5 s after the failure: ${interrupts[0]!["t"]}`);
  assert.equal(stubEv(r, "close")[0]!["why"], "abort", "the runner closed the query");
  assert.deepEqual(harness(tr, "cap"), []);
  assert.deepEqual(harness(tr, "cap-close"), []);
  const l = JSON.parse(readFileSync(ledger, "utf8")) as { entries: Record<string, unknown>[] };
  assert.equal(l.entries.length, 2, "one new ledger entry");
  const e = l.entries[1]!;
  assert.equal(e["case"], "REC-01");
  assert.equal(e["host"], "claude-code");
  assert.equal(e["provider"], "claude-max");
  assert.equal(e["auth"], "subscription");
  assert.ok(near(e["cost_usd"], 0.2));
  assert.equal(e["caps_usd"], 0.5);
  assert.equal(e["cost_source"], "claude-code spend check failed");
  assert.equal(e["valid_run"], false);
  assert.equal(e["pass"], false);
  assert.equal(e["end_reason"], null);
  assert.equal(e["result"], null);
  assert.ok(typeof e["ended_at"] === "string" && Number.isFinite(Date.parse(e["ended_at"] as string)), "an ended_at");
  for (const k of ["date", "task", "step", "row"]) assert.ok(k in e, `the entry gives ${k}`);
  return e;
}

const FAIL_ROWS: { name: string; then: string; schedule?: number[]; failAt: number }[] = [
  { name: "refuses the usage request of the third model call", then: "refuse", failAt: 2100 },
  { name: "answers the third request with session.total_cost_usd -1", then: "negative", failAt: 2100 },
  { name: "answers the third request without session.total_cost_usd", then: "nocost", failAt: 2100 },
  { name: "never answers the third request, a call every 10 s from then on", then: "hang", schedule: [0, 1000, 2000, 12_000, 22_000, 32_000, 42_000, 52_000, 62_000, 72_000], failAt: 32_000 },
];

FAIL_ROWS.forEach((row, i) => {
  test(`C002-TS-704 row ${i + 1} — the stub ${row.name}: 5 s later interrupt() and the close, no cap records; runSession rejects with costUsd 0.20; one ledger entry "claude-code spend check failed"; no result record`, () => {
    const dir = mkdtempSync(join(tmpdir(), "sdd-tc930-"));
    try {
      const ledger = ledgerFile(dir);
      const r = run(ARGS930, { usdPerCall: 0.1, usageDelayMs: 100, answers: ["ok", "ok"], then: row.then, afterInterrupt: [], ...(row.schedule ? { schedule: row.schedule } : {}) }, REC01, ledger);
      rejected(r, ledger, row.failAt);
      assert.match(r.out, /costUsd: 0\.2\b/, "the error's costUsd is 0.20");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

test("C002-TS-704 row 5 — the session ends by itself with success at 0.40 USD after the fourth call, then the open request is refused with Query closed before response received: ignored; runSession resolves; no spend-check entry", () => {
  const dir = mkdtempSync(join(tmpdir(), "sdd-tc930-"));
  try {
    const ledger = ledgerFile(dir);
    const r = run(ARGS930, { usdPerCall: 0.1, usageDelayMs: 100, selfEnd: { afterCall: 4, result: { subtype: "success", total_cost_usd: 0.4 } } }, REC01, ledger);
    assert.equal(r.status, 0, r.out);
    const tr = r.transcripts[0]!;
    const err = usageOf(tr, "request").filter((u) => u.error);
    assert.equal(err.length, 1);
    assert.equal(err[0]!.ignored, true);
    assert.match(String(err[0]!.error), /Query closed before response received/);
    const rec = r.records[0]!;
    assert.equal(rec["metrics"].result_subtype, "success");
    assert.ok(near(rec["metrics"].cost_usd, 0.4));
    const l = JSON.parse(readFileSync(ledger, "utf8")) as { entries: Record<string, unknown>[] };
    assert.ok(!l.entries.some((e) => e["cost_source"] === "claude-code spend check failed"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("C002-TS-704 row 6 — stopped at the 0.50 USD reading; after the interrupt a new call's message gets a follow-up request, a result at 0.60 USD follows, and the request refused at the close is ignored: error_max_budget_usd at 0.60; no spend-check entry", () => {
  const dir = mkdtempSync(join(tmpdir(), "sdd-tc930-"));
  try {
    const ledger = ledgerFile(dir);
    const r = run(ARGS930, { usdPerCall: 0.1, usageDelayMs: 100, afterInterrupt: [{ newCall: true }, { result: {} }] }, REC01, ledger);
    assert.equal(r.status, 0, r.out);
    const tr = r.transcripts[0]!;
    const capT = harness(tr, "cap")[0]!.t as number;
    const err = usageOf(tr, "request").filter((u) => u.error);
    assert.equal(err.length, 1, JSON.stringify(usageOf(tr)));
    assert.equal(err[0]!.ignored, true);
    assert.equal(err[0]!.message_id, "msg_after_001", "the follow-up request for the new message ID");
    assert.ok(err[0]!.sent_t >= capT, "sent after the stop began");
    const rec = r.records[0]!;
    assert.equal(rec["metrics"].result_subtype, "error_max_budget_usd");
    assert.ok(near(rec["metrics"].cost_usd, 0.6));
    const l = JSON.parse(readFileSync(ledger, "utf8")) as { entries: Record<string, unknown>[] };
    assert.ok(!l.entries.some((e) => e["cost_source"] === "claude-code spend check failed"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("C002-TS-704 (supporting, C002-RISK-039) — the installed Agent SDK is the pinned 0.3.296 and its types still name the usage request, interrupt and total_cost_usd", () => {
  const pin = (JSON.parse(readFileSync(join(ROOT, "evals", "package.json"), "utf8")) as { dependencies: Record<string, string> }).dependencies["@anthropic-ai/claude-agent-sdk"];
  assert.equal(pin, "0.3.296");
  const dir = join(ROOT, "evals", "node_modules", "@anthropic-ai", "claude-agent-sdk");
  assert.ok(existsSync(join(dir, "package.json")), "the Agent SDK is installed under evals/node_modules");
  assert.equal((JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { version: string }).version, pin);
  const dts = readFileSync(join(dir, "sdk.d.ts"), "utf8");
  assert.match(dts, /usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET\(opts\?: \{\s*skipBehaviors\?: boolean;/);
  assert.match(dts, /interrupt\(\): Promise</);
  assert.match(dts, /total_cost_usd: number;/);
});

// --- C002-TC-932 (C002-TS-706 rows 1 … 4, C002-REQ-645) and C002-TC-933 (C002-TS-707, C002-REQ-646): early stop
// when the row's check is decided (C002-IF-010 §2 `stopWhen`, §2.2 Early stop when the check is decided; defect
// D-034, C002-T-072). Each row's condition logs every call (its transcript length and last record) to a file.

interface StopRun extends DriverRun {
  /** The condition's calls, in order: the transcript length and the last record's event or message type. */
  calls: { n: number; last: string | null }[];
}

/** The assert of the early-stop rows: it fails unless the session result's `result` has `is_error` false for `success` and `check_decided`, true otherwise. */
const RESULT_ASSERT = `({ result }) => (result && result.is_error === !["success", "check_decided"].includes(result.subtype) ? [] : ["result " + JSON.stringify(result && { subtype: result.subtype, is_error: result.is_error })])`;

/** Runs one row with the condition `source` (a function expression) through `main` on the stub. */
function runStop(stub: Record<string, unknown>, source: string): StopRun {
  const fx = mkdtempSync(join(tmpdir(), "sdd-stop-when-"));
  try {
    const log = join(fx, "calls.log");
    const file = writeCase(fx, "evals/cap06/TS-706.eval.mjs", { id: "TS-706", prompt: "Draft the spec of CHG-001.", stopWhen: { source, log }, assert: RESULT_ASSERT });
    const r = runDriver([file, "--host", "claude-code", "--auth", "subscription", "--tier", "dev"], { root: fx, stub });
    const calls = existsSync(log) ? readFileSync(log, "utf8").split("\n").filter((l) => l !== "").map((l) => JSON.parse(l) as { n: number; last: string | null }) : [];
    return { ...r, calls };
  } finally {
    rmSync(fx, { recursive: true, force: true });
  }
}

const isAnswer = `(tr) => tr.some((r) => r.type === "harness" && r.event === "answer")`;
const isResult = `(tr) => tr.some((r) => r.type === "sdk" && r.message.type === "result")`;
const STUB706 = { usdPerCall: 0.1, usageDelayMs: 100 };
const AT_ONCE_060 = [{ result: { total_cost_usd: 0.6 } }];
const SELF_END_030 = { afterCall: 3, result: { subtype: "success", total_cost_usd: 0.3 } };
const indexOf = (tr: any[], event: string) => tr.findIndex((r) => r.type === "harness" && r.event === event);

/** The condition was called after each record, from the first, up to the record at index `upTo`, and not after. */
function calledThrough(r: StopRun, upTo: number) {
  assert.deepEqual(
    r.calls.map((c) => c.n),
    Array.from({ length: upTo + 1 }, (_, i) => i + 1),
    "one call after each record with the transcript so far, none after",
  );
}

function endedAtCap(r: StopRun, tr: any[]) {
  assert.deepEqual(capOf(tr), [capRecord(0.5, 0.5)], "one cap record at the 0.50 USD reading");
  assert.equal(harness(tr, "check-decided").length, 0, "no check-decided record");
  assert.equal(r.records[0]!["metrics"].result_subtype, "error_max_budget_usd");
  const capAt = indexOf(tr, "cap");
  assert.ok(r.calls.every((c) => c.n <= capAt), `the condition is not called after the cap record (last call at length ${r.calls.at(-1)?.n ?? 0}, cap at ${capAt})`);
}

function endedByItself(r: StopRun, tr: any[]) {
  assert.equal(harness(tr, "check-decided").length, 0, "no check-decided record");
  assert.deepEqual(capOf(tr), [], "no cap record");
  assert.equal(stubEv(r, "interrupt").length, 0, "no interrupt()");
  const rec = r.records[0]!;
  assert.equal(rec["metrics"].result_subtype, "success");
  assert.ok(near(rec["metrics"].cost_usd, 0.3), `cost ${rec["metrics"].cost_usd}`);
  assert.equal(rec["pass"], true, JSON.stringify(rec["failures"]));
}

test("C002-TS-706 row 1 — AskUserQuestion in the third call, the condition true from its answer record: one check-decided record at the highest cost read, no cap records; interrupt() once and the close; Write denied; check_decided at 0.35 USD from a result with is_error false", () => {
  const r = runStop({ ...STUB706, ask: { atCall: 3 }, afterInterrupt: [{ permission: "Write" }, { result: { subtype: "error_during_execution", total_cost_usd: 0.35 } }] }, isAnswer);
  assert.equal(r.status, 0, r.out);
  const tr = r.transcripts[0]!;
  const at = indexOf(tr, "answer");
  assert.ok(at > 0, "the answer record of the AskUserQuestion");
  calledThrough(r, at);
  const decided = harness(tr, "check-decided");
  assert.equal(decided.length, 1, "one check-decided record");
  const di = tr.indexOf(decided[0]);
  assert.equal(di, at + 1, "the check-decided record follows the record of the first true");
  const read = Math.max(...tr.slice(0, di).filter((x) => x.type === "harness" && x.event === "usage" && typeof x.usd === "number").map((x) => x.usd as number));
  assert.deepEqual(Object.keys(decided[0]).sort(), ["event", "t", "type", "usd"]);
  assert.ok(near(decided[0].usd, read) && read > 0, `usd ${decided[0].usd}, the highest cost read by then ${read}`);
  assert.deepEqual(capOf(tr), [], "no cap record");
  assert.equal(harness(tr, "cap-close").length, 0, "no cap-close record");
  const interrupts = stubEv(r, "interrupt");
  assert.equal(interrupts.length, 1, "interrupt() sent once");
  const close = stubEv(r, "close");
  assert.equal(close.length, 1);
  assert.equal(close[0]!["why"], "abort", "the runner closed the query");
  assert.ok((close[0]!["t"] as number) >= (interrupts[0]!["t"] as number), "the close after the interrupt");
  denied(r, tr, "Write");
  const rec = r.records[0]!;
  assert.equal(rec["metrics"].result_subtype, "check_decided");
  assert.ok(near(rec["metrics"].cost_usd, 0.35), `cost ${rec["metrics"].cost_usd}`);
  assert.equal(rec["pass"], true, `the assert read a result with is_error false: ${JSON.stringify(rec["failures"])}`);
});

test("C002-TS-706 row 2 — AskUserQuestion in the third call, the condition false at every call: the session runs to the 0.50 USD cap, no check-decided record, error_max_budget_usd", () => {
  const r = runStop({ ...STUB706, ask: { atCall: 3 }, afterInterrupt: AT_ONCE_060 }, `() => false`);
  assert.equal(r.status, 0, r.out);
  const tr = r.transcripts[0]!;
  assert.ok(indexOf(tr, "answer") > 0, "the AskUserQuestion was answered");
  endedAtCap(r, tr);
  // The reading at the cap begins the stop before the condition would be called after its record (item 2).
  calledThrough(r, indexOf(tr, "cap") - 2);
});

test("C002-TS-706 row 3 — AskUserQuestion in the seventh call, the condition true from its answer record: the 0.50 USD reading of the fifth call stops the session first; no check-decided record, no call after the cap record, error_max_budget_usd", () => {
  const r = runStop({ ...STUB706, ask: { atCall: 7 }, afterInterrupt: AT_ONCE_060 }, isAnswer);
  assert.equal(r.status, 0, r.out);
  const tr = r.transcripts[0]!;
  endedAtCap(r, tr);
  const capT = harness(tr, "cap")[0]!.t as number;
  assert.ok(capT >= 4100 && capT < 4200, `the cap at the fifth call's answer (4.1 s): ${capT}`);
  assert.equal(indexOf(tr, "answer"), -1, "the seventh call never ran");
  // The reading at the cap begins the stop before the condition would be called after its record (item 2).
  calledThrough(r, indexOf(tr, "cap") - 2);
});

test("C002-TS-706 row 4 — a result after the third call that ends the stream, the condition true from that result: the session ended by itself; no check-decided or cap record, no interrupt(), success at 0.30 USD", () => {
  const r = runStop({ ...STUB706, selfEnd: SELF_END_030 }, isResult);
  assert.equal(r.status, 0, r.out);
  const tr = r.transcripts[0]!;
  endedByItself(r, tr);
  calledThrough(r, tr.findIndex((x) => x.type === "sdk" && x.message.type === "result"));
});

/** The one `stop-when-error` record right after the faulty call, `calls` calls and none after, no check-decided record. */
function dropped(r: StopRun, tr: any[], calls: number, text: RegExp) {
  const errs = harness(tr, "stop-when-error");
  assert.equal(errs.length, 1, `exactly one stop-when-error record: ${JSON.stringify(errs)}`);
  assert.deepEqual(Object.keys(errs[0]).sort(), ["error", "event", "t", "type"]);
  assert.match(String(errs[0].error), text);
  assert.equal(r.calls.length, calls, `${calls} call(s), none after the faulty one`);
  assert.equal(tr.indexOf(errs[0]), r.calls.at(-1)!.n, "the record follows the record of the faulty call");
  assert.equal(harness(tr, "check-decided").length, 0, "no check-decided record");
}

test("C002-TS-707 row 1 — a condition that throws at its first call: one stop-when-error record with the error's text, no call after it; the session runs to the 0.50 USD cap", () => {
  const r = runStop({ ...STUB706, afterInterrupt: AT_ONCE_060 }, `() => { throw new Error("condition broke at call 1"); }`);
  assert.equal(r.status, 0, r.out);
  const tr = r.transcripts[0]!;
  dropped(r, tr, 1, /^condition broke at call 1$/);
  endedAtCap(r, tr);
});

test("C002-TS-707 row 2 — a condition that returns the string yes at its first call: one stop-when-error record naming the value, no call after it; the session runs to the 0.50 USD cap", () => {
  const r = runStop({ ...STUB706, afterInterrupt: AT_ONCE_060 }, `() => "yes"`);
  assert.equal(r.status, 0, r.out);
  const tr = r.transcripts[0]!;
  dropped(r, tr, 1, /"yes".*no boolean/);
  endedAtCap(r, tr);
});

test("C002-TS-707 row 3 — a condition false at its first three calls that throws at the fourth: one stop-when-error record with the error's text, no call after it; the session runs to the 0.50 USD cap", () => {
  const r = runStop({ ...STUB706, afterInterrupt: AT_ONCE_060 }, `(() => { let k = 0; return () => { k += 1; if (k === 4) throw new Error("condition broke at call 4"); return false; }; })()`);
  assert.equal(r.status, 0, r.out);
  const tr = r.transcripts[0]!;
  dropped(r, tr, 4, /^condition broke at call 4$/);
  endedAtCap(r, tr);
});

test("C002-TS-707 row 4 — a condition that throws at its first call in a session that ends by itself after the third call: one stop-when-error record, no call after it; no cap record, no interrupt(), success at 0.30 USD", () => {
  const r = runStop({ ...STUB706, selfEnd: SELF_END_030 }, `() => { throw new Error("condition broke at call 1"); }`);
  assert.equal(r.status, 0, r.out);
  const tr = r.transcripts[0]!;
  dropped(r, tr, 1, /^condition broke at call 1$/);
  endedByItself(r, tr);
});

// Supporting tests of C002-TC-932: no injection row gives `stopWhen` (C002-IF-010 §2.2 item 8), and the rule-1
// rows with a condition and those without one (C002-T-072; plan critics CR-74, CR-76; the step-4 report).

const rowsOf = async (file: string) => {
  const d = (await import(pathToFileURL(join(ROOT, ...file.split("/"))).href)).default;
  return (Array.isArray(d) ? d : [d]) as { id: string; stopWhen?: unknown }[];
};

test("C002-TS-706 (supporting, item 8) — no row of the injection case sets of C002-IF-010 §5.1 gives stopWhen", async () => {
  const sets = Object.values(INJECTION_CASE_SETS).flat() as { id: string; file: string }[];
  assert.ok(sets.length >= 23);
  for (const file of new Set(sets.map((r) => r.file))) {
    const rows = await rowsOf(file);
    for (const want of sets.filter((r) => r.file === file)) {
      const row = rows.find((x) => x.id === want.id);
      assert.ok(row, `${want.id} in ${file}`);
      assert.equal(row.stopWhen, undefined, `${want.id} (${file}) gives no stopWhen`);
    }
  }
});

const WITH_CONDITION: [string, string][] = [
  ["TS-215", "evals/cap02/TS-215.eval.mjs"],
  ["TS-221", "evals/cap02/TS-221.eval.mjs"],
  ["TS-223", "evals/cap02/TS-223.eval.mjs"],
  ["TS-225", "evals/cap02/TS-225.eval.mjs"],
  ["TS-802", "evals/cap08/TS-802.eval.mjs"],
];
const WITHOUT_CONDITION: [string, string][] = [
  ["TS-213", "evals/cap02/TS-213.eval.mjs"],
  ["TS-224", "evals/cap02/TS-224.eval.mjs"],
  ["TS-507", "evals/cap05/TS-507.eval.mjs"],
  ["TS-508", "evals/cap05/TS-508.eval.mjs"],
  ["TS-711", "evals/cap07/TS-711.eval.mjs"],
];

test("C002-TS-706 (supporting) — the rule-1 rows with a stop condition give a function; TS-213, the three TS-318 rows, TS-508, TS-711 and the rows the step-4 check leaves out give none", async () => {
  for (const [id, file] of WITH_CONDITION) {
    const row = (await rowsOf(file)).find((x) => x.id === id);
    assert.equal(typeof row?.stopWhen, "function", `${id} gives stopWhen`);
  }
  for (const [id, file] of WITHOUT_CONDITION) {
    const row = (await rowsOf(file)).find((x) => x.id === id);
    assert.ok(row, `${id} in ${file}`);
    assert.equal(row.stopWhen, undefined, `${id} gives no stopWhen`);
  }
  const ts318 = (await rowsOf("evals/cap03/TS-318.eval.mjs")).filter((x) => /^TS-318-/.test(x.id));
  assert.deepEqual(ts318.map((x) => x.id).sort(), ["TS-318-00-ideation", "TS-318-10-spec", "TS-318-20-plan"]);
  for (const row of ts318) assert.equal(row.stopWhen, undefined, `${row.id} gives no stopWhen`);
});
