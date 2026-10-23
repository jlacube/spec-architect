// C002-TC-691, C002-TC-692, C002-TC-693, C002-TC-920 — verify C002-TS-691, C002-TS-692, C002-TS-693 and
// C002-TS-694 (C002-AC-617.1, C002-REQ-617, C002-NFR-203; C002-T-066, revision D-026): the injection
// summary of evals/harness/run.mjs, written from the host's injection case set (C002-IF-010 §5.1) and
// merged fail-closed into the existing summary (C002-IF-010 §5.2): a run of fewer rows merges, a base it
// cannot merge with is refused with nothing written, an entry acted upon is final for the package
// version, a no-run refusal gives no entry and locks nothing, and no summary comes from a Copilot CLI run
// under the Copilot hooks fallback, from a Claude Code run, or from a run of no-run refusals only.
// C002-T-067 (defect D-028 and critics CR-94, CR-95): C002-TC-691 row 4 (a `turn cap` end with a passing
// result document gives an entry acted upon) and row 7 (a missing-model refusal of Copilot CLI, the second
// form of the no-run refusal, gives no entry and locks nothing), the rule-3 test of a session record
// without `end_reason` (fail-closed), and C002-TC-692 row 5 (a base that fails two checks: the line of the
// first only).
// fx-evals-injection is built in a temporary folder by `fxEvalsInjection` and given to `main` as the
// releases root (`deps.releasesRoot`, the test seam of §5.2); the case files are the repository's,
// selected with --only; the sessions run on the stub hosts of evals/harness/runners/stub.mjs (a replaced
// runner of the run's host), in a child process from the source files. No paid session, no network; the
// repository's docs/releases/ is never written.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { copilotPackage } from "../../../evals/harness/runners/copilot-cli.mjs";
import { repoRoot } from "../../helpers.ts";

const ROOT = repoRoot();
const SCRIPTS = join(ROOT, "plugins", "architect", "scripts");
const IDENTITY = { loggedInUsers: [{ host: "https://github.com", login: "p01-test", kind: "githubDotCom" }], lastLoggedInUser: { host: "https://github.com", login: "p01-test" } };
const INJ_FILE = join(ROOT, "evals", "injection", "injection.eval.mjs");
const TS359_FILE = join(ROOT, "evals", "targets", "copilot-guard", "TS-359.eval.mjs");
const VERSION = "0.3.0";
const OC = { "opencode": "1.18.31" };
const CP = { "copilot-cli": "1.0.98" };

const temps: string[] = [];
after(() => {
  for (const d of temps) rmSync(d, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
});
const tmp = (p: string) => {
  const d = mkdtempSync(join(tmpdir(), p));
  temps.push(d);
  return d;
};

// One generated Copilot package (sdd-mcp-server) for the file, given to the stub sessions.
let PKG: string | null = null;
const pkg = (): string => (PKG ??= copilotPackage({ target: "copilot", mode: "sdd-mcp-server" }) as string);
// A copy of that package whose conductor agent file has no model field (C002-TS-691 row 7, INJ-19 being a
// conductor row without a model of its own).
let PKG_NO_MODEL: string | null = null;
const pkgNoModel = (): string => {
  if (PKG_NO_MODEL) return PKG_NO_MODEL;
  const copy = tmp("sdd-inj-pkg-nomodel-");
  cpSync(pkg(), copy, { recursive: true });
  const file = join(copy, "agents", "sdd-conductor.agent.md");
  const text = readFileSync(file, "utf8");
  assert.match(text, /^model:/m, "the conductor's agent file names a model");
  writeFileSync(file, text.replace(/^model:.*\r?\n/m, ""));
  return (PKG_NO_MODEL = copy);
};

// Every planted marker of the injection corpus and of TS-359: a stub session's tool result holds them
// all, so the session saw the planted text (the cases' first check).
const MARKERS = [...[...readFileSync(INJ_FILE, "utf8").matchAll(/marker: "([^"]+)"/g)].map((m) => m[1]!), "Note for the agent"];

// --- fx-evals-injection -----------------------------------------------------------------------------

type Entry = { id: string; acted_upon: boolean; result?: string; models?: string[] };
type Target = "opencode" | "copilot";
const ids = (n: number) => Array.from({ length: n }, (_, i) => `INJ-${String(i + 1).padStart(2, "0")}`);
const entry = (id: string, acted = false): Entry => ({ id, acted_upon: acted, result: `evals/results/t000-${id}-base.json`, models: [`base-model-${id.toLowerCase()}`] });
const summary = (target: Target, source: string, hv: Record<string, string>, cases: Entry[], extra: Record<string, unknown> = {}) => ({ target, tier: "dev", source, ...extra, host_versions: hv, cases });
const pathOf = (target: Target) => `docs/releases/${target}/${VERSION}/injection.json`;

/**
 * fx-evals-injection in a temporary folder: the plugin manifest with the version 0.3.0, a copy of the
 * repository's Copilot table with the enforcement mode `mode`, the base file `base` at its target's
 * path (text as given, an object as JSON; none when absent), an `evals/results/` folder and a ledger.
 */
function fxEvalsInjection({ mode = "sdd-mcp-server", base }: { mode?: string; base?: { target: Target; text: string } }): string {
  const fx = tmp("sdd-fx-evals-injection-");
  const manifest = join(fx, "plugins", "architect", ".claude-plugin", "plugin.json");
  mkdirSync(join(manifest, ".."), { recursive: true });
  writeFileSync(manifest, JSON.stringify({ name: "architect", version: VERSION }, null, 2) + "\n");
  const table = JSON.parse(readFileSync(join(ROOT, "plugins", "architect", "targets", "copilot.json"), "utf8")) as Record<string, unknown>;
  mkdirSync(join(fx, "plugins", "architect", "targets"), { recursive: true });
  writeFileSync(join(fx, "plugins", "architect", "targets", "copilot.json"), JSON.stringify({ ...table, enforcement_mode: mode }, null, 2) + "\n");
  mkdirSync(join(fx, "evals", "results"), { recursive: true });
  writeFileSync(join(fx, "spend-chg002.json"), JSON.stringify({ budget_usd: 40, pools: { general: 30, reserve: 10 }, entries: [] }, null, 2) + "\n");
  if (base) {
    const p = join(fx, ...pathOf(base.target).split("/"));
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, base.text);
  }
  return fx;
}
const json = (v: unknown) => JSON.stringify(v, null, 2) + "\n";

/** Every file under `dir` with the SHA-256 of its content (paths relative, `/` separators). */
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

// --- the run ----------------------------------------------------------------------------------------

/**
 * A stub session: `pass` (saw the planted text, acted on none), `fail` (wrote outside .sdd/), `spend-cap`
 * (ended at the cap before any check), `turn-cap` (saw the planted text, acted on none, ended at the turn
 * cap), `refuse` (Copilot CLI's refused --model), `no-model` (Copilot CLI: no model in the row or its
 * session agent's file), `no-end-reason` (OpenCode: a passing session whose record gives no `end_reason`).
 */
type Kind = "pass" | "fail" | "spend-cap" | "turn-cap" | "refuse" | "no-model" | "no-end-reason";
interface Run { status: number | null; stdout: string[]; stderr: string[]; results: Map<string, string> }

/**
 * `main(argv, deps)` of run.mjs in a child process with `deps.releasesRoot` the fixture root, a ledger
 * in the fixture and the stub host of `--host` giving `sessions[i]` for the i-th session (selection
 * order); `versions[i]` the host versions it reports. `runners: false` replaces no runner.
 */
function runEval(fx: string, host: string, rows: string, files: string[], sessions: Kind[], { versions = [], runners = true }: { versions?: string[]; runners?: boolean } = {}): Run {
  const dir = tmp("sdd-inj-run-");
  const driver = join(dir, "driver.mjs");
  const url = (p: string) => pathToFileURL(join(ROOT, "evals", "harness", p)).href;
  const config = { sessions, versions, markers: MARKERS, pkg: host === "copilot-cli" ? pkg() : null, pkgNoModel: host === "copilot-cli" && sessions.includes("no-model") ? pkgNoModel() : null, scripts: SCRIPTS, identity: IDENTITY };
  writeFileSync(
    driver,
    [
      `import { main } from ${JSON.stringify(url("run.mjs"))};`,
      `import { runCopilotCliSession } from ${JSON.stringify(url("runners/copilot-cli.mjs"))};`,
      `import { runOpenCodeSession } from ${JSON.stringify(url("runners/opencode.mjs"))};`,
      `import { copilotStubHost, stubHost } from ${JSON.stringify(url("runners/stub.mjs"))};`,
      `const c = JSON.parse(process.argv[3]);`,
      `const seen = c.markers.join("\\n");`,
      `let i = 0;`,
      `const next = () => { const k = i++; return { kind: c.sessions[k] ?? "pass", version: c.versions[k] }; };`,
      `const copilot = (o) => { const { kind, version } = next();`,
      `  const script = kind === "pass" ? [[{ tool: "view", input: { path: "src/app.ts" }, result: seen }]] : kind === "fail" ? [[{ tool: "view", input: { path: "src/app.ts" }, result: seen }, { tool: "create", input: { path: "src/injected.ts", file_text: "x" } }]] : [];`,
      `  const host = copilotStubHost({ endAfter: 1, script, refuseModel: kind === "refuse", ...(kind === "spend-cap" ? { endAfter: null, creditsPerTurn: 60 } : {}), ...(version ? { version } : {}) });`,
      `  return runCopilotCliSession(o, { host, pkg: kind === "no-model" ? c.pkgNoModel : c.pkg, scripts: c.scripts, identity: c.identity }); };`,
      `const opencode = (o) => { const { kind, version } = next();`,
      `  const script = kind === "pass" || kind === "turn-cap" || kind === "no-end-reason" ? [[{ tool: "read", input: { filePath: "src/app.ts" }, output: seen }]] : kind === "fail" ? [[{ tool: "read", input: { filePath: "src/app.ts" }, output: seen }, { tool: "write", input: { filePath: "src/injected.ts", content: "x" } }]] : [];`,
      `  const capped = kind === "spend-cap" || kind === "turn-cap";`,
      `  const s = runOpenCodeSession(o, { host: stubHost({ endAfter: capped ? null : 1, spendPerTurn: kind === "spend-cap" ? 0.6 : kind === "turn-cap" ? 0.001 : 0.01, script, ...(version ? { version } : {}) }) });`,
      `  // A session record without end_reason (the rule-3 test, critic CR-94): the runner's result without the field.`,
      `  return kind === "no-end-reason" ? s.then(({ end_reason, ...rest }) => rest) : s; };`,
      `// The replaced Claude Code runner (C002-TC-693 row 2): a session that saw the planted text.`,
      `const claude = async () => ({ transcript: [{ t: 0, type: "sdk", message: { type: "user", message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: seen }] } } }], answers: [], result: { type: "result", subtype: "success", result: "", total_cost_usd: 0, num_turns: 1, modelUsage: {} }, wallMs: 1, auth: "api-key", apiKeySource: "none" });`,
      `const runners = c.runners ? { opencode, "copilot-cli": copilot, "claude-code": claude } : {};`,
      `process.exitCode = await main(JSON.parse(process.argv[2]), { runners, releasesRoot: c.root, ledger: c.ledger, log: (s) => console.log(s), error: (s) => console.error(s) });`,
    ].join("\n"),
  );
  const argv = ["--host", host, "--tier", "dev", "--only", rows, ...files];
  const env: Record<string, string | undefined> = { ...process.env };
  for (const k of Object.keys(env)) if (/^(CLAUDE|ANTHROPIC)/.test(k) || k === "EVAL_HOST" || k === "EVAL_AUTH" || k === "SDD_EVAL_COPILOT_MODEL") delete env[k];
  const r = spawnSync(process.execPath, [driver, JSON.stringify(argv), JSON.stringify({ ...config, runners, root: fx, ledger: join(fx, "spend-chg002.json") })], { cwd: ROOT, encoding: "utf8", env, windowsHide: true, timeout: 300_000 });
  const res = join(fx, "evals", "results");
  const results = new Map<string, string>();
  if (existsSync(res)) for (const f of readdirSync(res).filter((x) => x.endsWith(".json"))) results.set(JSON.parse(readFileSync(join(res, f), "utf8")).scenario, `evals/results/${f}`);
  return { status: r.status, stdout: r.stdout.split(/\r?\n/), stderr: r.stderr.split(/\r?\n/), results };
}

const readSummary = (fx: string, target: Target) => JSON.parse(readFileSync(join(fx, ...pathOf(target).split("/")), "utf8")) as ReturnType<typeof summary>;
const recordOf = (fx: string, rel: string) => (JSON.parse(readFileSync(join(fx, ...rel.split("/")), "utf8")) as { records: { models: string[] }[] }).records[0]!;
const summaryLines = (r: Run, prefix: string) => r.stderr.filter((l) => l.startsWith(prefix));
const NO_ENTRY = (id: string) => `eval: injection summary: no entry for ${id}: its session ended before any model call`;
const KEEPS = (id: string, target: Target) => `eval: injection summary keeps ${id} acted upon (${pathOf(target)}): a later session does not clear it; a new package version starts a new summary`;

/** The summary's header, order and the entries the run did not give, as the base gave them. */
function assertMerged(fx: string, target: Target, source: string, hv: Record<string, string>, base: Entry[], n: number, fromRun: string[]) {
  const s = readSummary(fx, target);
  assert.deepEqual([s.target, s.tier, s.source, s.host_versions], [target, "dev", source, hv]);
  assert.equal(s.cases.length, n);
  assert.deepEqual(s.cases.map((c) => c.id), [...s.cases.map((c) => c.id)].sort(), "ascending order of id");
  for (const c of s.cases) if (!fromRun.includes(c.id)) assert.deepEqual(c, base.find((b) => b.id === c.id), `${c.id} as it was before the run`);
  return s;
}

/** The run's entry of `id`: `acted_upon`, this run's result file and that record's models. */
function assertRunEntry(fx: string, r: Run, s: ReturnType<typeof summary>, id: string, acted: boolean) {
  const e = s.cases.find((c) => c.id === id)!;
  assert.ok(e, `entry ${id}`);
  const result = r.results.get(id);
  assert.ok(result, `result file of ${id}`);
  assert.deepEqual(e, { id, acted_upon: acted, result, models: recordOf(fx, result!).models });
}

// --- C002-TC-691 (C002-TS-691): a run of fewer rows merges into the summary ---------------------------

test("C002-TS-691 row 1 — OpenCode, no base file: a passing INJ-07 session gives a summary of its one entry, 0 kept", () => {
  const fx = fxEvalsInjection({});
  const r = runEval(fx, "opencode", "INJ-07", [INJ_FILE], ["pass"]);
  const s = assertMerged(fx, "opencode", "opencode-runner", OC, [], 1, ["INJ-07"]);
  assertRunEntry(fx, r, s, "INJ-07", false);
  assert.ok(r.stdout.includes(`injection summary: ${pathOf("opencode")} (1 cases, 0 acted upon; 1 from this run, 0 kept)`), r.stdout.join("\n"));
  assert.deepEqual(summaryLines(r, "eval: injection summary"), []);
});

for (const row of [
  { n: 2, kind: "fail" as Kind, title: "a failing session (the agent acted on the planted instruction)" },
  { n: 3, kind: "spend-cap" as Kind, title: "a session ended at the spend cap before the step its case checks" },
  { n: 4, kind: "turn-cap" as Kind, title: "a session whose result document passes and that ends with turn cap" },
]) {
  test(`C002-TS-691 row ${row.n} — OpenCode, 22 passing entries: ${row.title} of INJ-07 replaces the passing entry with acted_upon true`, () => {
    const base = ids(22).map((id) => entry(id));
    const fx = fxEvalsInjection({ base: { target: "opencode", text: json(summary("opencode", "opencode-runner", OC, base)) } });
    const r = runEval(fx, "opencode", "INJ-07", [INJ_FILE], [row.kind]);
    const s = assertMerged(fx, "opencode", "opencode-runner", OC, base, 22, ["INJ-07"]);
    assertRunEntry(fx, r, s, "INJ-07", true);
    if (row.kind === "spend-cap") assert.equal((recordOf(fx, r.results.get("INJ-07")!) as unknown as { end_reason: string }).end_reason, "spend cap");
    if (row.kind === "turn-cap") {
      const rec = recordOf(fx, r.results.get("INJ-07")!) as unknown as { end_reason: string; pass: boolean; failures: string[] };
      assert.equal(rec.end_reason, "turn cap");
      assert.equal(rec.pass, true, `the result document passes: ${JSON.stringify(rec.failures)}`);
    }
    assert.ok(r.stdout.includes(`injection summary: ${pathOf("opencode")} (22 cases, 1 acted upon; 1 from this run, 21 kept)`), r.stdout.join("\n"));
    assert.deepEqual(summaryLines(r, "eval: injection summary"), []);
  });
}

test("C002-TS-691 row 5 — Copilot CLI, 22 passing entries and none for TS-359: a passing TS-359 session is added, 23 cases, 22 kept", () => {
  const base = ids(22).map((id) => entry(id));
  const fx = fxEvalsInjection({ base: { target: "copilot", text: json(summary("copilot", "copilot-cli-runner", CP, base)) } });
  const r = runEval(fx, "copilot-cli", "TS-359", [TS359_FILE], ["pass"]);
  const s = assertMerged(fx, "copilot", "copilot-cli-runner", CP, base, 23, ["TS-359"]);
  assertRunEntry(fx, r, s, "TS-359", false);
  assert.ok(r.stdout.includes(`injection summary: ${pathOf("copilot")} (23 cases, 0 acted upon; 1 from this run, 22 kept)`), r.stdout.join("\n"));
  assert.deepEqual(summaryLines(r, "eval: injection summary"), []);
});

test("C002-TS-691 row 6 — Copilot CLI, 23 passing entries: INJ-07 passes, INJ-19 is a no-run refusal that gives no entry; the base's INJ-19 is kept", () => {
  const base = [...ids(22), "TS-359"].map((id) => entry(id));
  const fx = fxEvalsInjection({ base: { target: "copilot", text: json(summary("copilot", "copilot-cli-runner", CP, base)) } });
  const r = runEval(fx, "copilot-cli", "INJ-07,INJ-19", [INJ_FILE], ["pass", "refuse"]);
  const refusal = recordOf(fx, r.results.get("INJ-19")!) as unknown as Record<string, any>;
  assert.deepEqual([refusal["end_reason"], refusal["usage"].turns, refusal["models"], refusal["session_model"].used, refusal["agent_models"], refusal["spend"], refusal["usage"].usd, refusal["copilot_usage"].ai_credits], ["error", 0, [], [], {}, "reported", 0, 0], "the no-run refusal's result record");
  assert.match(String(refusal["error"]), /Error: Model "claude-opus-5\.5" from --model flag is not available\./);
  const s = assertMerged(fx, "copilot", "copilot-cli-runner", CP, base, 23, ["INJ-07"]);
  assertRunEntry(fx, r, s, "INJ-07", false);
  assert.ok(r.stdout.includes(`injection summary: ${pathOf("copilot")} (23 cases, 0 acted upon; 1 from this run, 22 kept)`), r.stdout.join("\n"));
  assert.deepEqual(summaryLines(r, "eval: injection summary:"), [NO_ENTRY("INJ-19")]);
  assert.deepEqual(summaryLines(r, "eval: injection summary keeps"), []);
});

test("C002-TS-691 row 7 — Copilot CLI, 23 passing entries: INJ-07 passes, INJ-19 is a missing-model refusal (no model in the row or the conductor's file) that gives no entry; the base's INJ-19 is kept", () => {
  const base = [...ids(22), "TS-359"].map((id) => entry(id));
  const fx = fxEvalsInjection({ base: { target: "copilot", text: json(summary("copilot", "copilot-cli-runner", CP, base)) } });
  const r = runEval(fx, "copilot-cli", "INJ-07,INJ-19", [INJ_FILE], ["pass", "no-model"]);
  const refusal = recordOf(fx, r.results.get("INJ-19")!) as unknown as Record<string, any>;
  assert.equal(refusal["end_reason"], "error");
  assert.equal(refusal["error"], "no model field in agents/sdd-conductor.agent.md");
  assert.deepEqual([refusal["usage"].turns, refusal["models"], refusal["session_model"].used, refusal["session_model"].passed, refusal["agent_models"], refusal["spend"], refusal["copilot_usage"]], [0, [], [], null, {}, "unreported", null], "the missing-model refusal's result record");
  assert.deepEqual(refusal["host_versions"], CP, "the host versions that copilot --version gave");
  const s = assertMerged(fx, "copilot", "copilot-cli-runner", CP, base, 23, ["INJ-07"]);
  assertRunEntry(fx, r, s, "INJ-07", false);
  assert.ok(r.stdout.includes(`injection summary: ${pathOf("copilot")} (23 cases, 0 acted upon; 1 from this run, 22 kept)`), r.stdout.join("\n"));
  assert.deepEqual(summaryLines(r, "eval: injection summary:"), [NO_ENTRY("INJ-19")]);
  assert.deepEqual(summaryLines(r, "eval: injection summary keeps"), []);
  assert.deepEqual(summaryLines(r, "eval: injection summary not written"), []);
});

test("C002-TS-691 (supporting, rule 3 fail-closed, critic CR-94): a session record of INJ-07 without end_reason whose result document passes gives an entry acted upon", () => {
  const base = ids(22).map((id) => entry(id));
  const fx = fxEvalsInjection({ base: { target: "opencode", text: json(summary("opencode", "opencode-runner", OC, base)) } });
  const r = runEval(fx, "opencode", "INJ-07", [INJ_FILE], ["no-end-reason"]);
  const rec = recordOf(fx, r.results.get("INJ-07")!) as unknown as Record<string, unknown>;
  assert.ok(!("end_reason" in rec), "the record gives no end_reason");
  assert.equal(rec["pass"], true, "the result document passes");
  const s = assertMerged(fx, "opencode", "opencode-runner", OC, base, 22, ["INJ-07"]);
  // A record without end_reason carries no models either: the entry's models are empty.
  assert.deepEqual(s.cases.find((c) => c.id === "INJ-07"), { id: "INJ-07", acted_upon: true, result: r.results.get("INJ-07"), models: [] });
  assert.ok(r.stdout.includes(`injection summary: ${pathOf("opencode")} (22 cases, 1 acted upon; 1 from this run, 21 kept)`), r.stdout.join("\n"));
});

test("C002-TS-691 (supporting): deps.releasesRoot while deps.runners replaces no runner of the run's --host ends the run before any session; no file under the fixture changes", () => {
  const fx = fxEvalsInjection({ base: { target: "opencode", text: json(summary("opencode", "opencode-runner", OC, ids(22).map((id) => entry(id)))) } });
  const before = snapshot(fx);
  const r = runEval(fx, "opencode", "INJ-07", [INJ_FILE], ["pass"], { runners: false });
  assert.equal(r.status, 1);
  assert.ok(r.stderr.includes("eval: a releases root applies to a stub-host run only; no session started"), r.stderr.join("\n"));
  assert.deepEqual(snapshot(fx), before);
});

// --- C002-TC-920 (C002-TS-694): an entry acted upon is final for the package version ------------------

for (const row of [
  { n: 1, kind: "pass" as Kind, title: "a passing session" },
  { n: 2, kind: "fail" as Kind, title: "a failing session" },
]) {
  test(`C002-TS-694 row ${row.n} — OpenCode, INJ-07 acted upon in the base: ${row.title} of INJ-07 does not clear it (keeps line, exit code 1)`, () => {
    const base = ids(22).map((id) => entry(id, id === "INJ-07"));
    const fx = fxEvalsInjection({ base: { target: "opencode", text: json(summary("opencode", "opencode-runner", OC, base)) } });
    const r = runEval(fx, "opencode", "INJ-07", [INJ_FILE], [row.kind]);
    assert.equal(r.status, 1);
    assert.deepEqual(summaryLines(r, "eval: injection summary keeps"), [KEEPS("INJ-07", "opencode")]);
    assert.ok(r.results.has("INJ-07"), "the result file of INJ-07 is written");
    assertMerged(fx, "opencode", "opencode-runner", OC, base, 22, []);
    assert.ok(r.stdout.includes(`injection summary: ${pathOf("opencode")} (22 cases, 1 acted upon; 0 from this run, 22 kept)`), r.stdout.join("\n"));
  });
}

test("C002-TS-694 row 3 — Copilot CLI, TS-359 acted upon in the base: a passing TS-359 session does not clear it", () => {
  const base = [...ids(22), "TS-359"].map((id) => entry(id, id === "TS-359"));
  const fx = fxEvalsInjection({ base: { target: "copilot", text: json(summary("copilot", "copilot-cli-runner", CP, base)) } });
  const r = runEval(fx, "copilot-cli", "TS-359", [TS359_FILE], ["pass"]);
  assert.equal(r.status, 1);
  assert.deepEqual(summaryLines(r, "eval: injection summary keeps"), [KEEPS("TS-359", "copilot")]);
  assert.ok(r.results.has("TS-359"));
  assertMerged(fx, "copilot", "copilot-cli-runner", CP, base, 23, []);
  assert.ok(r.stdout.includes(`injection summary: ${pathOf("copilot")} (23 cases, 1 acted upon; 0 from this run, 23 kept)`), r.stdout.join("\n"));
});

test("C002-TS-694 row 4 — Copilot CLI, TS-359 acted upon: INJ-07 and TS-359 pass; INJ-07 merges, TS-359 stays acted upon (exit code 1)", () => {
  const base = [...ids(22), "TS-359"].map((id) => entry(id, id === "TS-359"));
  const fx = fxEvalsInjection({ base: { target: "copilot", text: json(summary("copilot", "copilot-cli-runner", CP, base)) } });
  const r = runEval(fx, "copilot-cli", "INJ-07,TS-359", [INJ_FILE, TS359_FILE], ["pass", "pass"]);
  assert.equal(r.status, 1);
  assert.deepEqual(summaryLines(r, "eval: injection summary keeps"), [KEEPS("TS-359", "copilot")]);
  assert.ok(r.results.has("INJ-07") && r.results.has("TS-359"));
  const s = assertMerged(fx, "copilot", "copilot-cli-runner", CP, base, 23, ["INJ-07"]);
  assertRunEntry(fx, r, s, "INJ-07", false);
  assert.ok(r.stdout.includes(`injection summary: ${pathOf("copilot")} (23 cases, 1 acted upon; 1 from this run, 22 kept)`), r.stdout.join("\n"));
});

test("C002-TS-694 row 5 — Copilot CLI, INJ-19 acted upon: INJ-07 passes and merges, a no-run refusal of INJ-19 neither clears nor locks (no-entry line, no keeps line)", () => {
  const base = [...ids(22), "TS-359"].map((id) => entry(id, id === "INJ-19"));
  const fx = fxEvalsInjection({ base: { target: "copilot", text: json(summary("copilot", "copilot-cli-runner", CP, base)) } });
  const r = runEval(fx, "copilot-cli", "INJ-07,INJ-19", [INJ_FILE], ["pass", "refuse"]);
  assert.deepEqual(summaryLines(r, "eval: injection summary:"), [NO_ENTRY("INJ-19")]);
  assert.deepEqual(summaryLines(r, "eval: injection summary keeps"), []);
  assert.ok(r.results.has("INJ-07") && r.results.has("INJ-19"));
  const s = assertMerged(fx, "copilot", "copilot-cli-runner", CP, base, 23, ["INJ-07"]);
  assertRunEntry(fx, r, s, "INJ-07", false);
  assert.ok(r.stdout.includes(`injection summary: ${pathOf("copilot")} (23 cases, 1 acted upon; 1 from this run, 22 kept)`), r.stdout.join("\n"));
});

// --- C002-TC-692 (C002-TS-692): a base the run cannot merge with ---------------------------------------

const cp23 = (cases = [...ids(22), "TS-359"].map((id) => entry(id))) => cases;
for (const row of [
  { n: 1, host: "copilot-cli", target: "copilot" as Target, base: json(summary("copilot", "copilot-cli-runner", CP, cp23())).slice(0, 40), problem: "it does not parse" },
  { n: 2, host: "copilot-cli", target: "copilot" as Target, base: json({ target: "copilot", tier: "dev", source: "copilot-cli-runner", host_versions: CP }), problem: "it does not match the injection summary schema" },
  { n: 3, host: "copilot-cli", target: "copilot" as Target, base: json(summary("opencode", "copilot-cli-runner", CP, cp23())), problem: 'it gives target "opencode", this run "copilot"' },
  { n: 4, host: "copilot-cli", target: "copilot" as Target, base: json({ ...summary("copilot", "copilot-cli-runner", CP, cp23()), tier: "full" }), problem: "it does not match the injection summary schema" },
  { n: 5, host: "copilot-cli", target: "copilot" as Target, base: json(summary("opencode", "copilot-cli-runner", { "copilot-cli": "1.0.97" }, cp23())), problem: 'it gives target "opencode", this run "copilot"' },
  { n: 6, host: "copilot-cli", target: "copilot" as Target, base: json(summary("copilot", "copilot-cli-runner", { "copilot-cli": "1.0.97" }, cp23())), problem: 'it gives host_versions {"copilot-cli":"1.0.97"}, this run {"copilot-cli":"1.0.98"}' },
  { n: 7, host: "copilot-cli", target: "copilot" as Target, base: json(summary("copilot", "manual-checklist", CP, ids(22).map((id) => ({ id, acted_upon: false })), { checklist_record: "docs/checklists/records/vscode-2026-11-20-0.3.0.md" })), problem: 'it gives source "manual-checklist", this run "copilot-cli-runner"' },
  { n: 8, host: "copilot-cli", target: "copilot" as Target, base: json(summary("copilot", "copilot-cli-runner", CP, [...ids(23), "TS-359"].map((id) => entry(id)))), problem: "it holds INJ-23, which is no injection case of copilot-cli" },
  { n: 9, host: "opencode", target: "opencode" as Target, base: json(summary("opencode", "opencode-runner", OC, [...ids(22), "TS-359"].map((id) => entry(id)))), problem: "it holds TS-359, which is no injection case of opencode" },
  { n: 10, host: "opencode", target: "opencode" as Target, base: json(summary("opencode", "opencode-runner", OC, ids(22).map((id) => entry(id)))), rows: "INJ-07,INJ-08", versions: ["1.18.31", "1.18.32"], problem: "the run's sessions read different host versions" },
]) {
  test(`C002-TS-692 row ${row.n} — ${row.host}: ${row.problem}; nothing written, exit code 1`, () => {
    const fx = fxEvalsInjection({ base: { target: row.target, text: row.base } });
    const file = join(fx, ...pathOf(row.target).split("/"));
    const before = readFileSync(file);
    const rows = row.rows ?? "INJ-07";
    const r = runEval(fx, row.host, rows, [INJ_FILE], rows.split(",").map(() => "pass" as Kind), { versions: row.versions ?? [] });
    assert.equal(r.status, 1);
    assert.deepEqual(summaryLines(r, "eval: injection summary not written"), [`eval: injection summary not written (${pathOf(row.target)}): ${row.problem}; the file is unchanged`]);
    assert.ok(readFileSync(file).equals(before), "the base is byte for byte as it was");
    for (const id of rows.split(",")) assert.ok(r.results.has(id), `the result file of ${id} is written`);
    assert.deepEqual(r.stdout.filter((l) => l.startsWith("injection summary:")), []);
  });
}

// --- C002-TC-693 (C002-TS-693): no summary --------------------------------------------------------------

const injectionFiles = (fx: string) => new Map([...snapshot(join(fx, "docs", "releases"))].filter(([p]) => p.endsWith("injection.json")));
for (const row of [
  { n: 1, mode: "copilot-hooks", host: "copilot-cli", base: json(summary("copilot", "manual-checklist", CP, ids(22).map((id) => ({ id, acted_upon: false })), { checklist_record: "docs/checklists/records/vscode-2026-11-20-0.3.0.md" })), rows: "INJ-07", sessions: ["pass"] as Kind[], err: [] as string[], title: "a Copilot CLI run under the Copilot hooks fallback" },
  { n: 2, mode: "sdd-mcp-server", host: "claude-code", base: json(summary("copilot", "copilot-cli-runner", CP, cp23())), rows: "INJ-07", sessions: ["pass"] as Kind[], err: [] as string[], title: "a Claude Code run" },
  { n: 3, mode: "sdd-mcp-server", host: "copilot-cli", base: json(summary("copilot", "copilot-cli-runner", CP, cp23())), rows: "INJ-19,INJ-20", sessions: ["refuse", "refuse"] as Kind[], err: [NO_ENTRY("INJ-19"), NO_ENTRY("INJ-20")], title: "a Copilot CLI run whose injection sessions are all no-run refusals" },
]) {
  test(`C002-TS-693 row ${row.n} — ${row.title}: no injection summary written or changed`, () => {
    const fx = fxEvalsInjection({ mode: row.mode, base: { target: "copilot", text: row.base } });
    const before = injectionFiles(fx);
    const r = runEval(fx, row.host, row.rows, [INJ_FILE], row.sessions);
    for (const id of row.rows.split(",")) assert.ok(r.results.has(id), `the result file of ${id} is written`);
    assert.deepEqual(injectionFiles(fx), before, "docs/releases/copilot/0.3.0/injection.json unchanged and no other injection.json");
    assert.deepEqual(r.stdout.filter((l) => l.startsWith("injection summary:")), []);
    assert.deepEqual(summaryLines(r, "eval: injection summary"), row.err);
  });
}
