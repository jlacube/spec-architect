// C002-TC-921 … C002-TC-927 — verify C002-TS-695 … C002-TS-701 (C002-AC-638.1, C002-AC-639.1,
// C002-AC-640.1, C002-AC-641.1; C002-REQ-638 … C002-REQ-641; C002-T-067, revision D-023 item 2): the
// reconciliation of a `partial` OpenCode spend from the OpenRouter key usage (C002-IF-010 §2.3), the key
// check, the key redaction and the run folder of a paid session (C002-IF-010 §4).
//   fx-evals-caps   a temporary repository root with `evals/targets/caps/reconcile.eval.mjs` (rows REC-00,
//                   REC-01, REC-02, no host, no caps), a ledger whose general pool has the limit 30 USD and
//                   OpenRouter entries totalling 17.14 USD, none partial, the latest ended more than an
//                   hour before the test;
//   key-usage-stub  `deps.keyUsage` with `intervalMs` 10 and `limitMs` 200, whose `read` returns or throws
//                   per call in the row's order and logs each call's time;
//   stub-host       the stub OpenCode host (runners/stub.mjs) in `deps.runners`, or, for C002-TC-924 and
//                   C002-TC-925, the OpenCode runner's paid-session entry (`paidOpenCodeRunner`) with its
//                   host start stubbed, so that no `opencode serve` and no network request runs;
//   fx-key-home     a temporary home folder (HOME and USERPROFILE of the child process) for the key file
//                   `.architect-evals/openrouter-key.txt`; P-01's own key file is never read.
// `main(argv, deps)` of evals/harness/run.mjs runs in a child process from the source files with
// `deps.stopRule` true and the temporary ledger. No paid session; no request reaches openrouter.ai.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { driverHost, runOpenCodeSession } from "../../../evals/harness/runners/opencode.mjs";
import { stubHost } from "../../../evals/harness/runners/stub.mjs";
import { repoRoot } from "../../helpers.ts";

const ROOT = repoRoot();
const temps: string[] = [];
after(() => {
  for (const d of temps) rmSync(d, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
});
const tmp = (p: string) => {
  const d = mkdtempSync(join(tmpdir(), p));
  temps.push(d);
  return d;
};

const CASE_FILE = "evals/targets/caps/reconcile.eval.mjs";
const KEY = "sk-or-v1-c002ts698dummykey";
const STAYS = (id: string, ledger: string, reason: string) => `eval: spend of ${id} stays partial (${ledger}): ${reason}; reconcile it by hand (test plan §4.1 Ledger)`;
const RECONCILED = (delta: string, recorded = "0.6000") => `ledger: REC-01 reconciled from the OpenRouter key usage: ${delta} USD (recorded ${recorded} USD)`;
const BEFORE_FAILED = "the key usage could not be read before the session";
const BEFORE_UNSETTLED = "the key usage did not settle before the session";
const AFTER_UNSETTLED = "the key usage did not settle within 20 minutes";
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const near = (a: unknown, b: number) => typeof a === "number" && Math.abs(a - b) < 5e-7;
/** The runner takes a read's time just before it calls `read`, the stub when the call starts: within 3 ms (reads are 10 ms apart). */
const sameMs = (a: number, b: number) => Math.abs(a - b) <= 3;

// --- fx-evals-caps and the run -------------------------------------------------------------------------

/** The fixture root: the reconcile case file and the temporary ledger (OpenRouter entries totalling 17.14 USD). */
function fxEvalsCaps(): { root: string; ledger: string } {
  const root = tmp("sdd-fx-evals-caps-rec-");
  const file = join(root, ...CASE_FILE.split("/"));
  mkdirSync(join(file, ".."), { recursive: true });
  // The rows carry no host and no caps. A row's assert quotes a tool output that names OPENROUTER_API_KEY,
  // so that a line of standard output quotes host text (C002-TS-698 row 4).
  const row = (id: string) =>
    `{ id: ${JSON.stringify(id)}, title: "fx-evals-caps reconcile", agent: "architect:sdd-conductor", fixture: null, prompt: ${JSON.stringify(id)}, assert: (s) => s.transcript.flatMap((r) => r.type === "sdk" && r.message?.type === "user" ? r.message.message.content : []).filter((b) => String(b.content).includes("OPENROUTER_API_KEY")).map((b) => "quoted: " + b.content) }`;
  writeFileSync(file, `export default [${["REC-00", "REC-01", "REC-02"].map(row).join(", ")}];\n`);
  const old = new Date(Date.now() - 2 * 3600_000).toISOString();
  const entry = (i: number, cost: number) => ({ date: old.slice(0, 10), task: "C002-T-056", case: `ORD-${i}`, host: "opencode", provider: "openrouter", pool: "general", cost_usd: cost, caps_usd: 0.5, cost_source: "runner (OpenCode step cost)", ended_at: old });
  const entries = [...Array.from({ length: 27 }, (_, i) => entry(i + 1, 0.62)), entry(28, 0.4)];
  const ledger = join(root, "spend-chg002.json");
  writeFileSync(ledger, JSON.stringify({ budget_usd: 40, pools: { general: 30, reserve: 10 }, entries }, null, 2) + "\n");
  return { root, ledger };
}

/** A read of the key-usage stub: a value, a thrown error, or (as `then`) a value that rises by `step` per call. */
type Read = number | { throw: string } | { rising: [number, number] };
/** A session of the stub host: `completed` (0.01 USD, reported), `completed-0.34`, `partial` (spend cap, 0.60 USD, partial), `leaky` (completed; the key in a command's output, an assistant message and a host error text), `host-error` (the host's run throws). */
type Kind = "completed" | "completed-0.34" | "partial" | "leaky" | "host-error";

interface Run {
  status: number | null;
  stdout: string[];
  stderr: string[];
  reads: { t: number }[];
  starts: { runDir: string; keySha: string | null }[];
  ledger: { entries: Record<string, any>[] };
  records: Map<string, Record<string, any>>;
  resultsDir: string;
  fx: string;
  ledgerFile: string;
  before: Map<string, string>;
}

/** Every file under `dir` with the SHA-256 of its content. */
function snapshot(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out.set(relative(dir, p).split(sep).join("/"), createHash("sha256").update(readFileSync(p)).digest("hex"));
    }
  };
  if (existsSync(dir) && statSync(dir).isDirectory()) walk(dir);
  return out;
}

/**
 * `main` of run.mjs in a child process: `--host opencode --only <rows> <reconcile case file>`, the stub
 * host giving `sessions[id]`, the key-usage stub giving `reads` in call order and then `then`.
 * `paid`: the OpenCode runner's paid-session entry with its host start stubbed; `keyFile`: the content of
 * the key file in the temporary home (none when undefined); `keyUsage: false` gives no `deps.keyUsage`.
 */
function runMain(rows: string, sessions: Partial<Record<string, Kind>>, { reads = [], then = { throw: "no further read expected" }, paid = false, keyFile, keyUsage = true, env: extraEnv = {}, runners = true }: { reads?: Read[]; then?: Read; paid?: boolean; keyFile?: string; keyUsage?: boolean; env?: Record<string, string>; runners?: boolean } = {}): Run {
  const { root: fx, ledger } = fxEvalsCaps();
  const dir = tmp("sdd-rec-run-");
  const home = tmp("sdd-fx-key-home-");
  if (keyFile !== undefined) {
    mkdirSync(join(home, ".architect-evals"));
    writeFileSync(join(home, ".architect-evals", "openrouter-key.txt"), keyFile);
  }
  const scripts = join(dir, "scripts");
  mkdirSync(scripts);
  for (const f of ["sdd.mjs", "sdd-mcp.mjs"]) writeFileSync(join(scripts, f), "process.exit(0);\n");
  const readLog = join(dir, "reads.log");
  const startLog = join(dir, "starts.log");
  const resultsDir = join(fx, "results");
  const url = (p: string) => pathToFileURL(join(ROOT, "evals", "harness", p)).href;
  const driver = join(dir, "driver.mjs");
  writeFileSync(
    driver,
    [
      `import { appendFileSync } from "node:fs";`,
      `import { createHash } from "node:crypto";`,
      `import { main } from ${JSON.stringify(url("run.mjs"))};`,
      `import { hostProcessEnv } from ${JSON.stringify(url("opencode/driver.mjs"))};`,
      `import { paidOpenCodeRunner, runOpenCodeSession } from ${JSON.stringify(url("runners/opencode.mjs"))};`,
      `import { stubHost } from ${JSON.stringify(url("runners/stub.mjs"))};`,
      `const c = JSON.parse(process.argv[3]);`,
      `const stubOf = (kind) => {`,
      `  if (kind === "partial") return stubHost({ spendPerTurn: 0.12, subagent: { step: 5, cost: 0.05, finish: false } });`,
      `  if (kind === "completed-0.34") return stubHost({ endAfter: 1, costs: [0.34] });`,
      `  if (kind === "leaky") return stubHost({ endAfter: 1, script: [[{ tool: "bash", input: { command: "env" }, output: "OPENROUTER_API_KEY=" + c.key }, { text: "the key is " + c.key }]] });`,
      `  return stubHost({ endAfter: 1 });`,
      `};`,
      `// The host's run: the stub's, with a host error text added to a leaky session's first message.`,
      `const runOf = (kind, h) => async (o) => {`,
      `  if (kind === "host-error") throw new Error("host failed: provider rejected key " + c.key);`,
      `  const r = await h.run(o);`,
      `  if (kind === "leaky") r.messages[0].parts.push({ id: "prt_err", sessionID: r.sessionID, messageID: r.messages[0].info.id, type: "tool", callID: "call_err", tool: "webfetch", state: { status: "error", input: {}, error: "provider rejected key " + c.key, time: { start: Date.now(), end: Date.now() } } });`,
      `  return r;`,
      `};`,
      `// The stubbed host start of the paid entry (as in C002-TC-907): the host process environment, no process.`,
      `const start = async (o) => {`,
      `  const kind = c.sessions[c.current] ?? "completed";`,
      `  const env = hostProcessEnv(o);`,
      `  const k = env.OPENROUTER_API_KEY;`,
      `  appendFileSync(c.startLog, JSON.stringify({ runDir: o.runDir, keySha: k ? createHash("sha256").update(k).digest("hex") : null }) + "\\n");`,
      `  const h = await stubOf(kind).start();`,
      `  return { version: "1.18.31", run: runOf(kind, h), stop: async () => {} };`,
      `};`,
      `const paid = paidOpenCodeRunner({ bin: process.execPath, start });`,
      `const stub = (o) => { console.log("stub start " + o.prompt); return runOpenCodeSession(o, { host: { needsPackage: false, start: async () => { const kind = c.sessions[o.prompt] ?? "completed"; const h = await stubOf(kind).start(); return { version: "1.18.31", run: runOf(kind, h), stop: async () => {} }; } } }); };`,
      `// The paid entry's stubbed start reads the row from c.current (the start has no prompt).`,
      `const opencode = c.paid ? Object.assign((o) => { console.log("stub start " + o.prompt); c.current = o.prompt; return paid(o); }, { paid: true }) : stub;`,
      `let n = 0, then = 0;`,
      `const value = (item, j) => { if (typeof item === "number") return item; if (item.throw) throw new Error(item.throw); return item.rising[0] + item.rising[1] * j; };`,
      `const read = async () => { const k = n++; appendFileSync(c.readLog, JSON.stringify({ t: Date.now() }) + "\\n"); return k < c.reads.length ? value(c.reads[k], 0) : value(c.then, then++); };`,
      `const deps = { runners: c.runners ? { opencode } : {}, stopRule: true, ledger: c.ledger, root: c.root, log: (s) => console.log(s), error: (s) => console.error(s), ...(c.keyUsage ? { keyUsage: { read, intervalMs: 10, limitMs: 200 } } : {}) };`,
      `process.exitCode = await main(JSON.parse(process.argv[2]), deps);`,
    ].join("\n"),
  );
  const argv = ["--host", "opencode", "--tier", "dev", "--only", rows, "--results-dir", resultsDir, "--task", "TEST", "--step", "X0", join(fx, ...CASE_FILE.split("/"))];
  const env: Record<string, string | undefined> = { ...process.env, HOME: home, USERPROFILE: home, SDD_EVAL_SDD_SCRIPTS: scripts, ...extraEnv };
  for (const k of Object.keys(env)) if (/^(CLAUDE|ANTHROPIC|OPENROUTER)/i.test(k) || k === "EVAL_HOST" || (k === "SDD_EVAL_KEEP_RUN" && !(k in extraEnv))) delete env[k];
  const before = snapshot(fx);
  const config = { sessions, reads, then, paid, key: KEY, readLog, startLog, ledger, root: fx, keyUsage, runners };
  const r = spawnSync(process.execPath, [driver, JSON.stringify(argv), JSON.stringify(config)], { cwd: ROOT, encoding: "utf8", env, windowsHide: true, timeout: 300_000 });
  const lines = (file: string) => (existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
  const records = new Map<string, Record<string, any>>();
  if (existsSync(resultsDir)) for (const f of readdirSync(resultsDir).filter((x) => x.endsWith(".json"))) {
    const doc = JSON.parse(readFileSync(join(resultsDir, f), "utf8"));
    if (doc.records?.[0]) records.set(doc.scenario, doc.records[0]);
  }
  return { status: r.status, stdout: r.stdout.split(/\r?\n/), stderr: r.stderr.split(/\r?\n/), reads: lines(readLog), starts: lines(startLog), ledger: JSON.parse(readFileSync(ledger, "utf8")), records, resultsDir, fx, ledgerFile: ledger, before };
}

const entryOf = (r: Run, id: string) => r.ledger.entries.find((e) => e["case"] === id);
const count = (lines: string[], line: string) => lines.filter((l) => l === line).length;
const startsWith = (lines: string[], prefix: string) => lines.filter((l) => l.startsWith(prefix));
const out = (r: Run) => [...r.stdout, ...r.stderr].join("\n");

/** The entry of a session left partial: 0.60 USD, `partial`, no reconciled fields. */
function assertLeftPartial(r: Run, id = "REC-01") {
  const e = entryOf(r, id)!;
  assert.ok(e, `ledger entry of ${id}`);
  assert.ok(near(e["cost_usd"], 0.6), `cost_usd ${e["cost_usd"]}`);
  assert.equal(e["cost_source"], "partial");
  assert.ok(!("cost_usd_recorded" in e), "no cost_usd_recorded");
  assert.ok(!("openrouter_usage" in e), "no openrouter_usage");
  assert.match(String(e["ended_at"]), ISO);
  const rec = r.records.get(id)!;
  assert.deepEqual([rec["spend"], rec["usage"].usd !== null && near(rec["usage"].usd, 0.6)], ["partial", true], "the result record keeps spend partial and usage.usd 0.60");
  assert.deepEqual(startsWith(r.stdout, `ledger: ${id} reconciled`), [], "no reconciled line");
}

/** The next row of the pool does not start while the entry stays partial; the stop rule names the pool general. */
function assertNextStopped(r: Run) {
  assert.ok(!r.stdout.includes("stub start REC-02"), "no session of REC-02");
  assert.ok(r.stdout.some((l) => l.startsWith("REC-02: session not started:") && l.includes("pool general")), out(r));
}

// --- C002-TC-921 (C002-TS-695): a partial spend reconciled from the settled key usage -------------------

const ROWS_695: { n: number; reads: Read[]; after: number; delta: number; printed: string; settledAt: number; title: string }[] = [
  { n: 1, reads: [18, 18], after: 18, delta: 0.76, printed: "0.7600", settledAt: 2, title: "settled at the second after-read" },
  { n: 2, reads: [18, 18.2, 18.2], after: 18.2, delta: 0.96, printed: "0.9600", settledAt: 3, title: "the usage still rose at the second after-read; settled at the third" },
  { n: 3, reads: [17.5, 17.5, 18, 18], after: 18, delta: 0.76, printed: "0.7600", settledAt: 4, title: "equal reads below the bound 17.2400 + 0.9 × 0.60 = 17.7800 are passed over; settled at the fourth" },
  { n: 4, reads: [17.84, 17.84], after: 17.84, delta: 0.6, printed: "0.6000", settledAt: 2, title: "the delta is the full recorded 0.60" },
  { n: 5, reads: [17.8, 17.8], after: 17.8, delta: 0.56, printed: "0.5600", settledAt: 2, title: "the delta lies between 0.9 × and 1 × the recorded 0.60" },
  { n: 6, reads: [17.78, 17.78], after: 17.78, delta: 0.54, printed: "0.5400", settledAt: 2, title: "the usage is exactly the bound 17.7800, which settles" },
  { n: 7, reads: [{ throw: "read failed" }, 18, 18], after: 18, delta: 0.76, printed: "0.7600", settledAt: 3, title: "a failed first after-read is passed over; settled at the third" },
  { n: 8, reads: [18, { throw: "read failed" }, 18], after: 18, delta: 0.76, printed: "0.7600", settledAt: 3, title: "a failed read between the two equal reads; settled at the third" },
];

for (const row of ROWS_695) {
  test(`C002-TS-695 row ${row.n} — ${row.title}: REC-01 booked at ${row.printed} USD before REC-02's stop rule`, () => {
    const r = runMain("REC-01,REC-02", { "REC-01": "partial", "REC-02": "completed" }, { reads: [17.24, ...row.reads] });
    const e = entryOf(r, "REC-01")!;
    assert.ok(e, out(r));
    assert.ok(near(e["cost_usd"], row.delta), `cost_usd ${e["cost_usd"]}`);
    assert.equal(Number(e["cost_usd"]).toFixed(4), row.printed);
    assert.equal(e["cost_source"], "openrouter key usage delta");
    assert.ok(near(e["cost_usd_recorded"], 0.6), `cost_usd_recorded ${e["cost_usd_recorded"]}`);
    assert.match(String(e["ended_at"]), ISO);
    const u = e["openrouter_usage"];
    assert.ok(near(u.before, 17.24) && near(u.after, row.after) && near(u.delta, row.delta), JSON.stringify(u));
    assert.equal(u.endpoint, "GET /api/v1/key");
    assert.equal(u.read_at.length, 2);
    for (const t of u.read_at) assert.match(t, ISO);
    // read_at: the before-read's time, then the settling read's time (the stub's call log, in call order).
    assert.ok(sameMs(Date.parse(u.read_at[0]), r.reads[0]!.t), "the time of the before-read");
    assert.ok(sameMs(Date.parse(u.read_at[1]), r.reads[row.settledAt]!.t), "the time of the settling after-read");
    assert.equal(count(r.stdout, RECONCILED(row.printed)), 1, out(r));
    const rec = r.records.get("REC-01")!;
    assert.equal(rec["spend"], "partial");
    assert.ok(near(rec["usage"].usd, 0.6));
    // REC-02 starts after the reconciled line, its stop-rule check counting the delta.
    const lineAt = r.stdout.indexOf(RECONCILED(row.printed));
    const startAt = r.stdout.indexOf("stub start REC-02");
    assert.ok(startAt > lineAt, out(r));
    const T = String(Math.round((17.14 + row.delta) * 1e6) / 1e6);
    const stopLine = r.stdout.slice(lineAt, startAt).find((l) => l.startsWith("stop rule ok:"));
    assert.ok(stopLine?.startsWith(`stop rule ok: pool general total ${T} + H `), `${stopLine} (T ${T})`);
    assert.deepEqual(startsWith(r.stderr, "eval: spend of REC-01 stays partial"), []);
  });
}

// --- C002-TC-922 (C002-TS-696): a failed before-read leaves the entry partial ---------------------------

test("C002-TS-696 — a failed before-read: REC-01 runs and stays partial with the reason of a before-read that could not be read; REC-02 does not start", () => {
  const r = runMain("REC-01,REC-02", { "REC-01": "partial", "REC-02": "completed" }, { reads: [{ throw: "connect ECONNREFUSED" }], then: 18 });
  assert.ok(r.stdout.includes("stub start REC-01"), "the session of REC-01 runs");
  assert.equal(count(r.stderr, STAYS("REC-01", r.ledgerFile, BEFORE_FAILED)), 1, out(r));
  assertLeftPartial(r);
  assertNextStopped(r);
});

// --- C002-TC-923 (C002-TS-697): no settled after-read within 20 minutes -------------------------------

for (const row of [
  { n: 1, then: { rising: [18, 0.01] } as Read, reads: [] as Read[], title: "a new value at each read" },
  { n: 2, then: 17.77 as Read, reads: [] as Read[], title: "17.7700 at every read, 0.0100 below the bound 17.7800" },
  { n: 3, then: { throw: "read failed" } as Read, reads: [] as Read[], title: "a thrown error at every read" },
  { n: 4, then: { throw: "read failed" } as Read, reads: [18] as Read[], title: "one successful after-read, then errors" },
]) {
  test(`C002-TS-697 row ${row.n} — ${row.title}: REC-01 stays partial (did not settle within 20 minutes), at most 21 reads, REC-02 does not start`, () => {
    const r = runMain("REC-01,REC-02", { "REC-01": "partial", "REC-02": "completed" }, { reads: [17.24, ...row.reads], then: row.then });
    assert.equal(count(r.stderr, STAYS("REC-01", r.ledgerFile, AFTER_UNSETTLED)), 1, out(r));
    assert.ok(r.reads.length <= 21 && r.reads.length >= 2, `${r.reads.length} reads`);
    const ended = Date.parse(entryOf(r, "REC-01")!["ended_at"]);
    const afterReads = r.reads.slice(1);
    assert.ok(afterReads[0]!.t >= ended + 10, `the first after-read ${afterReads[0]!.t - ended} ms after the end`);
    for (const a of afterReads) assert.ok(a.t <= ended + 200, `an after-read ${a.t - ended} ms after the end, past the limit`);
    assertLeftPartial(r);
    assertNextStopped(r);
  });
}

// --- C002-TC-924 (C002-TS-698): the OpenRouter key is never written -----------------------------------

/** Every line of the run and every file it created or changed: none holds the key or a request header. */
function assertNoKey(r: Run) {
  for (const l of [...r.stdout, ...r.stderr]) for (const needle of [KEY, "Bearer sk-or-v1-", "Authorization: Bearer"]) assert.ok(!l.includes(needle), `a line holds ${needle}: ${l}`);
  const after = snapshot(r.fx);
  const changed = [...after].filter(([p, h]) => r.before.get(p) !== h).map(([p]) => p);
  assert.ok(changed.includes("spend-chg002.json"), "the ledger was written");
  assert.ok(changed.some((p) => p.startsWith("results/transcripts/")), "a transcript was written");
  for (const p of changed) {
    const text = readFileSync(join(r.fx, ...p.split("/")), "utf8");
    for (const needle of [KEY, "Bearer sk-or-v1-", "Authorization: Bearer"]) assert.ok(!text.includes(needle), `${p} holds ${needle}`);
  }
  // The run folder of the paid session is gone (C002-IF-010 §4 Run folder of a paid session).
  assert.ok(r.starts.length > 0, "the stubbed host start ran");
  for (const s of r.starts) assert.ok(!existsSync(s.runDir), `run folder ${s.runDir} still exists`);
}
const keySha = createHash("sha256").update(KEY).digest("hex");
const transcriptOf = (r: Run, id: string) => readFileSync(join(r.fx, ...String(r.records.get(id)!["transcript"]).replace(/^evals\/results\//, "results/").split("/")), "utf8");

test("C002-TS-698 row 1 — a reconciled session: the key reaches the host as OPENROUTER_API_KEY only and occurs in no line and no file", () => {
  const r = runMain("REC-01", { "REC-01": "partial" }, { paid: true, keyFile: `${KEY}\n`, reads: [17.24, 18, 18] });
  assert.deepEqual(r.starts.map((s) => s.keySha), [keySha], "the stubbed host start received the key as OPENROUTER_API_KEY");
  assert.equal(r.records.get("REC-01")!["api_key_source"], "openrouter-key-file");
  assert.equal(entryOf(r, "REC-01")!["cost_source"], "openrouter key usage delta");
  assert.equal(count(r.stdout, RECONCILED("0.7600")), 1, out(r));
  assertNoKey(r);
});

test("C002-TS-698 row 2 — a failed before-read whose error text holds the key, its header and an echoing body: the stays-partial line and no other text of the error", () => {
  const r = runMain("REC-01", { "REC-01": "partial" }, { paid: true, keyFile: `${KEY}\n`, reads: [{ throw: `request failed: Authorization: Bearer ${KEY}; response {"error":"invalid key ${KEY}"}` }], then: 18 });
  assert.deepEqual(r.starts.map((s) => s.keySha), [keySha]);
  assert.equal(r.records.get("REC-01")!["api_key_source"], "openrouter-key-file");
  assert.equal(count(r.stderr, STAYS("REC-01", r.ledgerFile, BEFORE_FAILED)), 1, out(r));
  assert.ok(!out(r).includes("invalid key") && !out(r).includes("request failed"), "no other text of the error");
  assertNoKey(r);
});

test("C002-TS-698 row 3 — every after-read throws an error holding the key: the stays-partial line of no settled after-read and no other text of the error", () => {
  const r = runMain("REC-01", { "REC-01": "partial" }, { paid: true, keyFile: `${KEY}\n`, reads: [17.24], then: { throw: `request failed: Authorization: Bearer ${KEY}` } });
  assert.deepEqual(r.starts.map((s) => s.keySha), [keySha]);
  assert.equal(count(r.stderr, STAYS("REC-01", r.ledgerFile, AFTER_UNSETTLED)), 1, out(r));
  assert.ok(!out(r).includes("request failed"), "no other text of the error");
  assertNoKey(r);
});

test("C002-TS-698 row 4 — the key in a command's output, an assistant message and a host error text: written as [REDACTED] in the transcript, the result record and every quoting line", () => {
  const r = runMain("REC-01", { "REC-01": "leaky" }, { paid: true, keyFile: `${KEY}\n`, reads: [17.24] });
  assert.deepEqual(r.starts.map((s) => s.keySha), [keySha]);
  const rec = r.records.get("REC-01")!;
  assert.equal(rec["api_key_source"], "openrouter-key-file");
  assert.equal(rec["end_reason"], "completed");
  const transcript = transcriptOf(r, "REC-01");
  for (const t of ["OPENROUTER_API_KEY=[REDACTED]", "the key is [REDACTED]", "provider rejected key [REDACTED]"]) assert.ok(transcript.includes(t), `the transcript holds ${t}`);
  assert.deepEqual(rec["failures"], ["quoted: OPENROUTER_API_KEY=[REDACTED]"], "the result record quotes the command output redacted");
  assert.ok(r.stdout.some((l) => l.startsWith("REC-01 run 1/1: FAIL (quoted: OPENROUTER_API_KEY=[REDACTED])")), out(r));
  assertNoKey(r);
});

// --- C002-TC-925 (C002-TS-699): the key check before a paid OpenCode session ---------------------------

const REFUSED_SHORT = (file: string) => `paid OpenCode session refused: the OpenRouter key in ${file} is shorter than 20 characters or holds a character that JSON escapes`;
for (const row of [
  { n: 1, file: undefined as string | undefined, line: (f: string) => `paid OpenCode session refused: no OpenRouter key in ${f}`, hidden: null as string | null, title: "the key file does not exist" },
  { n: 2, file: "   \n", line: REFUSED_SHORT, hidden: null, title: "the key file holds only white space" },
  { n: 3, file: "sk-or-v1-0123456789\n", line: REFUSED_SHORT, hidden: "sk-or-v1-0123456789", title: "a key of 19 characters" },
  { n: 5, file: "sk-or-v1-0123\\456789abcdef\n", line: REFUSED_SHORT, hidden: "456789abcdef", title: "a key of 26 characters with a backslash" },
  { n: 6, file: "sk-or-v1-c002ts699lineone\nsk-or-v1-c002ts699linetwo\n", line: REFUSED_SHORT, hidden: "c002ts699line", title: "a key file of two lines" },
]) {
  test(`C002-TS-699 row ${row.n} — ${row.title}: the session is refused before any key usage read and before the host starts`, () => {
    const r = runMain("REC-01", { "REC-01": "completed" }, { paid: true, ...(row.file !== undefined ? { keyFile: row.file } : {}), reads: [], then: 17.24 });
    assert.equal(r.reads.length, 0, "the stub read was never called");
    assert.equal(r.starts.length, 0, "the stubbed host start was never called");
    assert.ok(!r.stdout.includes("stub start REC-01"), "no session");
    const keyFile = join(String(r.stderr.join("\n").match(/in (\S+openrouter-key\.txt)/)?.[1] ?? ""));
    assert.ok(keyFile.endsWith(join(".architect-evals", "openrouter-key.txt")), out(r));
    assert.equal(count(r.stderr, row.line(keyFile)), 1, out(r));
    assert.ok(!keyFile.startsWith(process.env["USERPROFILE"] ?? "\u0000") || keyFile.includes("sdd-fx-key-home-"), "the temporary home's key file, never P-01's");
    if (row.hidden) assert.ok(!out(r).includes(row.hidden), `a line holds ${row.hidden}`);
  });
}

test("C002-TS-699 row 4 — a key of 20 characters is accepted: the before-read ran, the host start received it as OPENROUTER_API_KEY, the session ends completed", () => {
  const twenty = "sk-or-v1-01234567890";
  const r = runMain("REC-01", { "REC-01": "completed" }, { paid: true, keyFile: `${twenty}\n`, reads: [], then: 17.24 });
  assert.equal(twenty.length, 20);
  assert.ok(r.reads.length >= 1, "the before-read ran");
  assert.deepEqual(r.starts.map((s) => s.keySha), [createHash("sha256").update(twenty).digest("hex")]);
  assert.equal(r.records.get("REC-01")!["end_reason"], "completed");
  assert.deepEqual(startsWith(r.stderr, "paid OpenCode session refused"), []);
});

// --- C002-TC-926 (C002-TS-700): the before-read after a recent session takes a settled key usage -------

test("C002-TS-700 row 1 — a completed REC-00 whose late charge posts during the wait: REC-01 takes U0 17.2400 from the third read of the wait, 6 reads in all", () => {
  const r = runMain("REC-00,REC-01", { "REC-00": "completed-0.34", "REC-01": "partial" }, { reads: [16.9, 16.9, 17.24, 17.24, 18, 18] });
  assert.match(String(entryOf(r, "REC-00")!["ended_at"]), ISO);
  const e = entryOf(r, "REC-01")!;
  assert.ok(near(e["cost_usd"], 0.76), out(r));
  assert.equal(e["cost_source"], "openrouter key usage delta");
  assert.ok(near(e["openrouter_usage"].before, 17.24) && near(e["openrouter_usage"].after, 18), JSON.stringify(e["openrouter_usage"]));
  assert.ok(sameMs(Date.parse(e["openrouter_usage"].read_at[0]), r.reads[3]!.t), "U0's time is that of the third read of the wait");
  assert.equal(count(r.stdout, RECONCILED("0.7600")), 1, out(r));
  assert.equal(r.reads.length, 6);
  assert.deepEqual(startsWith(r.stderr, "eval: spend of REC-01 stays partial"), []);
});

test("C002-TS-700 row 2 — a partial REC-00 reconciled at 0.74 USD: REC-01 takes U0 17.2400, its settled after-read, with no read of its own, 5 reads in all", () => {
  const r = runMain("REC-00,REC-01", { "REC-00": "partial", "REC-01": "partial" }, { reads: [16.5, 17.24, 17.24, 18, 18] });
  const e0 = entryOf(r, "REC-00")!;
  assert.match(String(e0["ended_at"]), ISO);
  assert.ok(near(e0["cost_usd"], 0.74), `REC-00 ${e0["cost_usd"]}`);
  assert.equal(e0["cost_source"], "openrouter key usage delta");
  const e = entryOf(r, "REC-01")!;
  assert.ok(near(e["cost_usd"], 0.76), out(r));
  assert.equal(e["cost_source"], "openrouter key usage delta");
  assert.ok(near(e["openrouter_usage"].before, 17.24) && near(e["openrouter_usage"].after, 18), JSON.stringify(e["openrouter_usage"]));
  assert.equal(e["openrouter_usage"].read_at[0], e0["openrouter_usage"].read_at[1], "U0 and its time are REC-00's settled after-read");
  assert.equal(count(r.stdout, RECONCILED("0.7600")), 1, out(r));
  assert.equal(r.reads.length, 5);
  assert.deepEqual(startsWith(r.stderr, "eval: spend of REC-01 stays partial"), []);
});

// --- C002-TC-927 (C002-TS-701): a before-read that does not settle after a recent session ------------

for (const row of [
  { n: 1, reads: [16.9] as Read[], then: { rising: [16.9, 0.01] } as Read, reason: BEFORE_UNSETTLED, title: "a new value at each read of the wait" },
  { n: 2, reads: [16.9, 16.9] as Read[], then: { throw: "read failed" } as Read, reason: BEFORE_UNSETTLED, title: "one successful read of the wait, then errors" },
  { n: 3, reads: [16.9] as Read[], then: { throw: "read failed" } as Read, reason: BEFORE_FAILED, title: "every read of the wait failing" },
]) {
  test(`C002-TS-701 row ${row.n} — ${row.title}: REC-01 runs and stays partial (${row.reason})`, () => {
    const r = runMain("REC-00,REC-01", { "REC-00": "completed-0.34", "REC-01": "partial" }, { reads: row.reads, then: row.then });
    const ended0 = Date.parse(entryOf(r, "REC-00")!["ended_at"]);
    const wait = r.reads.slice(1);
    assert.ok(wait.length >= 1 && wait.length <= 21, `${wait.length} reads in the wait`);
    for (const w of wait) assert.ok(w.t <= ended0 + 200, `a wait read ${w.t - ended0} ms after the end of REC-00, past the limit`);
    assert.ok(r.stdout.includes("stub start REC-01"), "the session of REC-01 runs");
    assert.equal(count(r.stderr, STAYS("REC-01", r.ledgerFile, row.reason)), 1, out(r));
    assertLeftPartial(r);
  });
}

// --- supporting tests: SDD_EVAL_KEEP_RUN and the run folder of a paid session (C002-IF-010 §4) ---------

const KEEP = "eval: SDD_EVAL_KEEP_RUN applies to stub-host runs only: the run folder of a paid OpenCode session holds host files that are not redacted; no session started";
for (const real of [true, false]) {
  test(`C002-TC-924 (supporting): SDD_EVAL_KEEP_RUN on --host opencode with ${real ? "the real runner" : "the paid entry with a stubbed host start"} ends the run before any session with exit code 1`, () => {
    const r = runMain("REC-01", { "REC-01": "completed" }, { paid: !real, runners: !real, keyFile: `${KEY}\n`, env: { SDD_EVAL_KEEP_RUN: "1" } });
    assert.equal(r.status, 1, out(r));
    assert.equal(count(r.stderr, KEEP), 1, out(r));
    assert.equal(r.reads.length, 0);
    assert.equal(r.starts.length, 0);
    assert.equal(r.records.size, 0, "no session");
  });
}

test("C002-TC-924 (supporting): a stub-host run keeps SDD_EVAL_KEEP_RUN", () => {
  const r = runMain("REC-02", { "REC-02": "completed" }, { keyUsage: false, env: { SDD_EVAL_KEEP_RUN: "1" } });
  assert.deepEqual(startsWith(r.stderr, "eval: SDD_EVAL_KEEP_RUN"), [], out(r));
  assert.ok(r.records.has("REC-02"), out(r));
});

test("C002-TC-924 (supporting): the run folder of a paid session is deleted when the session ends, after a host error too, with SDD_EVAL_KEEP_RUN set", async () => {
  const dir = tmp("sdd-rec-rundir-");
  const scripts = join(dir, "scripts");
  mkdirSync(scripts);
  for (const f of ["sdd.mjs", "sdd-mcp.mjs"]) writeFileSync(join(scripts, f), "process.exit(0);\n");
  writeFileSync(join(dir, "key.txt"), `${KEY}\n`);
  const saved = { keep: process.env["SDD_EVAL_KEEP_RUN"], scripts: process.env["SDD_EVAL_SDD_SCRIPTS"] };
  process.env["SDD_EVAL_KEEP_RUN"] = "1";
  process.env["SDD_EVAL_SDD_SCRIPTS"] = scripts;
  try {
    for (const failing of [false, true]) {
      const seen: string[] = [];
      const start = async (o: { runDir: string }) => {
        seen.push(o.runDir);
        writeFileSync(join(o.runDir, "host-file.txt"), "a host file that is not redacted\n");
        const h = await stubHost({ endAfter: 1 }).start();
        return { version: "1.18.31", run: failing ? async () => { throw new Error("host failed"); } : h.run, stop: async () => {} };
      };
      const cwd = mkdtempSync(join(dir, "ws-"));
      const s = await runOpenCodeSession({ cwd, prompt: "hi", agent: "architect:sdd-conductor", allowTools: [] }, { host: driverHost({ keyFile: join(dir, "key.txt"), bin: process.execPath, start }) });
      assert.equal(seen.length, 1);
      assert.ok(!existsSync(seen[0]!), `the run folder ${seen[0]} still exists${failing ? " after a host error" : ""}`);
      assert.equal(s.end_reason, failing ? "error" : "completed");
      assert.ok(!JSON.stringify(s).includes(seen[0]!), "no run-dir record names the folder");
    }
  } finally {
    for (const [k, v] of [["SDD_EVAL_KEEP_RUN", saved.keep], ["SDD_EVAL_SDD_SCRIPTS", saved.scripts]] as const) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});
