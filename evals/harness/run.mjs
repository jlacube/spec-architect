// Eval runner (C001-T-029, C001-ADR-003, C001-ADR-007; hosts: C002-IF-010, C002-T-044). Usage:
//   node evals/harness/run.mjs [<scenario.eval.mjs>…] [--filter <path>]… [--host claude-code|opencode|copilot-cli]
//                              [--tier dev|milestone|release] [--runs N] [--max-total-usd X] [--label NAME]
//                              [--only ID,ID…] [--auth api-key|subscription]   (default: EVAL_AUTH, else api-key)
//                              [--cap-exception]   (the rerun caps of the matching cap exceptions, C002-IF-010 §2.2)
//                              [--task <task id> --step <n>] [--pool general|reserve] [--results-dir <dir>]
//                              [--copilot-model <from>=<to>[,<from>=<to>…]]   (--host copilot-cli only)
// Each run copies the scenario's fixture into a temporary directory, runs the session on the selected
// host (`--host`, default claude-code: the Agent SDK; opencode: runners/opencode.mjs), applies the
// scenario's assertions and records metrics. Results go to evals/results/<label>-<scenario>-<time>.json
// (transcripts to evals/results/transcripts/, not committed). Exit code 1 when a scenario misses the
// tier's pass rule or the budget is exhausted, and before any session when the host is unknown or the
// selection holds no case (C002-T-044 step 2).
// Selection: the positional case files plus, for each `--filter <path>`, every `*.eval.mjs` file under
// that folder (or that file), or whose path relative to the repository root contains the text. A case
// row with a `host` field runs only on that host; `--only` keeps the named rows.
// --auth subscription bills the P-01's Claude subscription instead of the prepaid API key (env.mjs);
// its sessions record a notional cost_usd and do not count against --max-total-usd. Claude Code host only.
// OpenCode sessions bill OpenRouter (test plan §4.1): before each session the stop rule of the CHG-002
// ledger (evals/results/spend-chg002.json) is checked for `--pool` (default general), and after it the
// session is added to the ledger with `--task`/`--step`, with its `ended_at`. A session whose spend reads
// `partial` is reconciled from the OpenRouter key usage read before and after it (C002-IF-010 §2.3,
// C002-T-067), before the next session's stop rule; else it stays partial with one line naming why. On
// --host opencode the key is checked before any session and written nowhere (every line and file goes
// through the redaction of C002-IF-010 §4). The rows of the host's injection case set
// (C002-IF-010 §5.1, §5.2: INJ-01 … INJ-22, and TS-359 on Copilot CLI) are merged, fail-closed, into the
// injection summary docs/releases/<target>/<version>/injection.json (`mergeInjectionSummary`).
// Copilot CLI sessions (runners/copilot-cli.mjs, C002-T-045) bill P-01's GitHub Copilot plan in AI
// Credits: before each session the Copilot stop rule (pool `copilot`, 30 USD, P-01 2026-10-19) is checked
// against the ledger, and after it the session is added with its measured AI Credits and the USD estimate.
// On Copilot CLI the summary (source copilot-cli-runner) is written under sdd MCP server enforcement only.
// --copilot-model <from>=<to>[,…] (else SDD_EVAL_COPILOT_MODEL; --host copilot-cli only) substitutes
// the model passed with --model for the session agents whose chosen model is <from> (C002-IF-010 §1).
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { capCheck, capException, DEFAULT_MAX_BUDGET_USD, DEFAULT_MAX_TURNS } from "./caps.mjs";
import { checkHostEnv, resolveAuth } from "./env.mjs";
import { readKeyUsage, readOpenRouterKey, redactor } from "./key-usage.mjs";
import { makeWorkspace, ROOT } from "./fixtures.mjs";
import { runMetrics } from "./metrics.mjs";
import { DEFAULT_HOST, HOSTS, runSession, setHarnessContext, usdText } from "./session.mjs";

export const TIERS = {
  dev: { runs: 1, pass: (passed, runs) => passed === runs, rule: "1 / 1" },
  milestone: { runs: 3, pass: (passed, runs) => passed === runs, rule: "3 / 3 (2 / 3 triggers a 10-run check)" },
  release: { runs: 10, pass: (passed, runs) => passed >= Math.ceil(runs * 0.9), rule: "≥ 9 / 10" },
};

export const RESULTS = join(ROOT, "evals", "results");
/** The refusal of SDD_EVAL_KEEP_RUN on --host opencode with the real runner (C002-IF-010 §4 Run folder of a paid session). */
export const KEEP_RUN_REFUSAL = "eval: SDD_EVAL_KEEP_RUN applies to stub-host runs only: the run folder of a paid OpenCode session holds host files that are not redacted; no session started";
export const LEDGER = join(RESULTS, "spend-chg002.json");

/**
 * Runs one scenario `runs` times; returns the result document (also written to `resultsDir`).
 * `host` names the session host for the record (the session itself runs on the harness context's
 * host); `hooks.before({ scenario, run })` may refuse a session by throwing; `hooks.after({ scenario,
 * record, resultFile, endedAt })` sees each finished run (`endedAt` the session's end, ms). `redact` is
 * applied to each file's whole text after the JSON encoding (the key redaction of C002-IF-010 §4).
 */
export async function runScenario(scenario, { tier = "dev", runs, label, budget = { spent: 0, limit: 5 }, log = console.log, auth, host = DEFAULT_HOST, resultsDir = RESULTS, hooks = {}, caps: checkedCaps, redact = (text) => text } = {}) {
  const n = runs ?? TIERS[tier].runs;
  const mode = host === "claude-code" ? resolveAuth(auth) : null;
  let apiKeySource = null;
  const records = [];
  const time = new Date().toISOString().replace(/[:.]/g, "-");
  const resultFile = join(resultsDir, `${label ?? tier}-${scenario.id}-${time}.json`);
  let stopped = null;
  for (let i = 0; i < n; i++) {
    if (budget.spent >= budget.limit) {
      log(`budget exhausted ($${budget.spent.toFixed(2)} of $${budget.limit}); stopping`);
      break;
    }
    try {
      await hooks.before?.({ scenario, run: i + 1 });
    } catch (e) {
      stopped = e instanceof Error ? e.message : String(e);
      log(`${scenario.id}: session not started: ${stopped}`);
      break;
    }
    const ws = makeWorkspace(scenario.fixture ?? null);
    // The caps of main's cap-exception check (C002-IF-010 §2.2): the row's own caps, or the rerun cap
    // under --cap-exception; a direct caller without `caps` gets the row's own caps. Each result record
    // carries them as `caps` (§3, critic CR-65).
    const caps = checkedCaps ?? { turns: scenario.maxTurns ?? DEFAULT_MAX_TURNS, usd: scenario.maxBudgetUsd ?? DEFAULT_MAX_BUDGET_USD };
    try {
      const prompt = typeof scenario.prompt === "function" ? scenario.prompt(ws.root) : scenario.prompt;
      const session = await runSession({
        cwd: ws.root,
        prompt,
        agent: scenario.agent,
        // Claude Code plugin folders (overlays included); a generated-target runner places its own package.
        plugins: host === "claude-code" ? (scenario.plugins ?? [join(ROOT, "plugins", "architect")]).map((p) => (typeof p === "function" ? p() : resolve(ROOT, p))) : [],
        answer: scenario.answer,
        allowTools: scenario.allowTools ?? [],
        maxTurns: caps.turns,
        maxBudgetUsd: caps.usd,
        model: scenario.model,
        env: scenario.env ?? {},
        startDelayMs: scenario.startDelayMs ?? 0,
        auth: mode ?? undefined,
        // Fields the generated-target runners read (C002-T-038, C002-T-044); Claude Code ignores them.
        host: scenario.host,
        targetPackage: scenario.targetPackage,
        mcpOverrides: scenario.mcpOverrides,
      }).catch(async (e) => {
        // A failed notional-cost reading of the Claude Code eval runner (C002-IF-010 §2.2 Claude Code spend
        // cap, item 8; critic CR-113): the session is no run and gets no result record. Its transcript is
        // kept, and the `spendCheckFailed` hook books R in the spend ledger before the error reaches the run.
        if (host === "claude-code" && typeof e?.costUsd === "number" && /^claude-code spend check failed: /.test(String(e.message))) {
          const endedAt = Date.now();
          if (Array.isArray(e.transcript)) {
            const transcriptFile = join(resultsDir, "transcripts", `${scenario.id}-${time}-run${i + 1}.json`);
            mkdirSync(join(resultsDir, "transcripts"), { recursive: true });
            writeFileSync(transcriptFile, redact(JSON.stringify(e.transcript, null, 1)) + "\n");
            log(`${scenario.id} run ${i + 1}/${n}: ${e.message}; no result record; transcript evals/results/transcripts/${basename(transcriptFile)}`);
          }
          await hooks.spendCheckFailed?.({ scenario, error: e, caps, auth: mode, endedAt });
        }
        throw e;
      });
      // The session's end (the ledger entry's `ended_at`, C002-IF-010 §2.3 item 3).
      const endedAt = Date.now();
      apiKeySource = session.apiKeySource;
      const failures = [];
      try {
        const r = await scenario.assert({ ...session, root: ws.root });
        if (Array.isArray(r)) failures.push(...r);
      } catch (e) {
        failures.push(`assertion threw: ${e instanceof Error ? e.message : String(e)}`);
      }
      const metrics = runMetrics(session.transcript, session.result, session.wallMs);
      if (mode !== "subscription") budget.spent += metrics.cost_usd;
      const transcriptFile = join(resultsDir, "transcripts", `${scenario.id}-${time}-run${i + 1}.json`);
      mkdirSync(join(resultsDir, "transcripts"), { recursive: true });
      // Every file is redacted as a whole, after the JSON encoding (C002-IF-010 §4 Key redaction).
      writeFileSync(transcriptFile, redact(JSON.stringify(session.transcript, null, 1)) + "\n");
      const target = session.target ?? "claude-code";
      const record = {
        run: i + 1,
        pass: failures.length === 0,
        failures,
        metrics,
        auth: mode,
        api_key_source: session.apiKeySource,
        target,
        // The Claude Code version of the SDK's init message, recorded and never refused (plan critic CR-66; C002-RISK-039).
        ...(target === "claude-code" ? { claude_code_version: session.claudeCodeVersion ?? null } : {}),
        ...(session.host_versions ? { host_versions: session.host_versions } : {}),
        ...(session.end_reason ? { end_reason: session.end_reason, usage: session.usage } : {}),
        caps,
        ...(session.end_reason ? { spend: session.spend, provider: session.provider, models: session.models } : {}),
        // Copilot CLI only (C002-IF-010 §3, revision D-027): the model rule and the models that ran.
        ...(session.session_model !== undefined ? { session_model: session.session_model, agent_models: session.agent_models ?? {} } : {}),
        ...(session.copilot_usage !== undefined ? { copilot_usage: session.copilot_usage } : {}),
        ...(session.error ? { error: session.error } : {}),
        transcript: `evals/results/transcripts/${basename(transcriptFile)}`,
      };
      records.push(record);
      const usd = session.usage && session.usage.usd === null ? "spend unreported" : `$${metrics.cost_usd.toFixed(4)}`;
      // The overshoot of a Claude Code session the runner stopped at the spend cap (its `cap-close` record, item 7).
      const capClose = target === "claude-code" ? session.transcript.find((r) => r.type === "harness" && r.event === "cap-close") : undefined;
      const overshoot = capClose ? ` · overshoot ${usdText(capClose.overshoot_usd)} USD` : "";
      log(`${scenario.id} run ${i + 1}/${n}: ${failures.length === 0 ? "pass" : `FAIL (${failures.join("; ")})`} · ${usd} · ${(metrics.session_ms / 1000).toFixed(1)} s${session.end_reason ? ` · ${session.end_reason}, ${session.usage.turns} turns` : ""}${overshoot}`);
      await hooks.after?.({ scenario, record, resultFile, endedAt });
    } finally {
      ws.cleanup();
    }
  }
  const passed = records.filter((r) => r.pass).length;
  const doc = {
    scenario: scenario.id,
    title: scenario.title,
    tier,
    label: label ?? tier,
    agent: scenario.agent ?? null,
    host,
    target: records[0]?.target ?? (host === "copilot-cli" ? "copilot" : host),
    ...(records[0]?.host_versions ? { host_versions: records[0].host_versions } : {}),
    auth: mode,
    api_key_source: apiKeySource,
    measured_at: new Date().toISOString(),
    runs: records.length,
    passed,
    pass_rule: TIERS[tier].rule,
    pass: records.length === n && TIERS[tier].pass(passed, n),
    cost_usd: records.reduce((s, r) => s + r.metrics.cost_usd, 0),
    ...(stopped ? { stopped } : {}),
    records,
  };
  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(resultFile, redact(JSON.stringify(doc, null, 2)) + "\n");
  resultFiles.set(doc, resultFile);
  return doc;
}

/** The result file of each result document that `runScenario` wrote (the injection summary's `result`). */
const resultFiles = new WeakMap();

// --- Options and selection (C002-T-044 step 2) -------------------------------------------------------

const VALUE_OPTIONS = ["tier", "runs", "max-total-usd", "label", "only", "auth", "host", "filter", "results-dir", "task", "step", "pool", "copilot-model"];

/** Variable of the run's model substitution on Copilot CLI when `--copilot-model` is not given (C002-IF-010 §1). */
export const COPILOT_MODEL_VAR = "SDD_EVAL_COPILOT_MODEL";
const MODEL_ID = /^[A-Za-z0-9._-]+$/;

/**
 * The model substitution `<from>=<to>[,<from>=<to>…]` (C002-IF-010 §1, revision D-027) as
 * `{ "<from>": "<to>" }`, or null when the value is not of that form: each model ID of letters, digits,
 * `.`, `_` and `-`, each `<from>` once.
 */
export function parseSubstitution(value) {
  const out = {};
  for (const pair of String(value).split(",")) {
    const parts = pair.split("=");
    if (parts.length !== 2 || !MODEL_ID.test(parts[0]) || !MODEL_ID.test(parts[1]) || Object.hasOwn(out, parts[0])) return null;
    out[parts[0]] = parts[1];
  }
  return out;
}
/** Options without a value (C002-IF-010 §1: `--cap-exception`, revision D-025). */
const FLAG_OPTIONS = ["cap-exception"];

/** Parsed options: positional case files, `--filter` values (repeatable) and every other option. */
export function parseArgs(argv) {
  const files = [];
  const filters = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const name = a.slice(2);
      if (FLAG_OPTIONS.includes(name)) {
        opts[name] = true;
        continue;
      }
      if (!VALUE_OPTIONS.includes(name)) throw new Error(`unknown option ${a}`);
      const v = argv[i + 1];
      if (v === undefined || v.startsWith("--")) throw new Error(`option ${a} needs a value`);
      if (name === "filter") filters.push(v);
      else opts[name] = v;
      i++;
    } else files.push(a);
  }
  const host = opts.host ?? DEFAULT_HOST;
  return { files, filters, host, opts };
}

const posix = (p) => p.split(sep).join("/");

/** Every `*.eval.mjs` file under `dir` (node_modules and results left out). */
function evalFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === "results") continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".eval.mjs")) out.push(p);
    }
  };
  if (existsSync(dir)) walk(dir);
  return out.sort();
}

/** Case files of one `--filter`: a folder's `*.eval.mjs` files, a file, or the files whose repository path contains the text. */
export function filterFiles(filter, root = ROOT) {
  const abs = isAbsolute(filter) ? filter : resolve(root, filter);
  if (existsSync(abs)) return statSync(abs).isDirectory() ? evalFiles(abs) : abs.endsWith(".eval.mjs") ? [abs] : [];
  const text = posix(filter);
  return evalFiles(join(root, "evals")).filter((f) => posix(relative(root, f)).includes(text));
}

/** The case files of the selection, positional first, each once. */
export function selectFiles(files, filters, root = ROOT) {
  const seen = new Set();
  const out = [];
  for (const f of [...files.map((x) => resolve(x)), ...filters.flatMap((x) => filterFiles(x, root))]) {
    const key = resolve(f).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(resolve(f));
    }
  }
  return out;
}

/**
 * The scenarios of the selected files that run on `host` (rows of another host left out) and that `only`
 * keeps. A row with a `notApplicable` reason (an `@mode-*` row of the mode the spike record did not
 * select, test plan §1) runs no session: it is returned in `notApplicable` instead.
 */
export async function selectScenarios(files, { host = DEFAULT_HOST, only } = {}) {
  const out = [];
  const skipped = { host: 0, only: 0 };
  const notApplicable = [];
  for (const f of files) {
    if (!existsSync(f)) throw new Error(`case file not found: ${f}`);
    // A scenario outline exports an array: one scenario per Examples row.
    const exported = (await import(pathToFileURL(f).href)).default;
    for (const scenario of Array.isArray(exported) ? exported : [exported]) {
      if (scenario.host && scenario.host !== host) skipped.host++;
      else if (only && !only.includes(scenario.id)) skipped.only++;
      else if (scenario.notApplicable) notApplicable.push({ file: f, id: scenario.id, reason: String(scenario.notApplicable) });
      else out.push({ file: f, scenario });
    }
  }
  return { scenarios: out, skipped, notApplicable };
}

// --- CHG-002 ledger: stop rule and entries (test plan §4.1) -------------------------------------------

/** Highest session cost the stop rule assumes for the next session (§4.1 rule 1). */
export const MIN_H = 0.65;

/**
 * An ordinary session of the stop rule (test plan §4.1 rule 1, plan critic CR-41): every entry except
 * those of a cap-exception row, whose `caps_usd` is above the 0.50 USD cap of C002-NFR-105. An entry
 * without `caps_usd` (written before C002-T-056 step X0) is ordinary.
 */
const ordinary = (e) => !(Number(e.caps_usd) > DEFAULT_MAX_BUDGET_USD + 1e-9);

/**
 * H of the stop rule (test plan §4.1 rule 1; C002-IF-010 §2.2 "Reserve of a cap-exception session"): the
 * ordinary H = max(0.65 USD, the highest cost of the ordinary sessions); for a session of a row that a cap
 * exception matches, H = that exception's cap + the ordinary H.
 */
/** @param {any[]} entries @param {number | null} [exceptionCap] */
export function reserveH(entries, exceptionCap = null) {
  const h = Math.max(MIN_H, ...entries.filter(ordinary).map((e) => Number(e.cost_usd) || 0));
  return Math.round(((typeof exceptionCap === "number" ? exceptionCap : 0) + h) * 1e6) / 1e6;
}

/**
 * Stop-rule check for one OpenRouter session of `pool`: `{ ok, T, H, L }`, plus `partial` (the cases of
 * the pool's entries whose `cost_source` is still `partial`) when there are any: such a pool says stop
 * until the entries are reconciled with OpenRouter's usage view (test plan §4.1 Ledger). `exceptionCap`
 * is the cap of the cap exception that matches the session's row (null for an ordinary session).
 */
/** @param {any} ledger @param {string} [pool] @param {{ exceptionCap?: number | null }} [options] */
export function stopRule(ledger, pool = "general", { exceptionCap = null } = {}) {
  const entries = ledger.entries ?? [];
  // OpenRouter entries of the pool; an OpenCode entry of a stub-host run (provider `stub`, a test ledger
  // only) counts as one, so that the next session's check counts a reconciled entry (C002-TS-695).
  const mine = entries.filter((e) => (e.provider === "openrouter" || e.host === "opencode") && e.pool === pool);
  const T = mine.reduce((s, e) => s + (Number(e.cost_usd) || 0), 0);
  const H = reserveH(entries, exceptionCap);
  const L = Number(ledger.pools?.[pool]);
  if (!Number.isFinite(L)) throw new Error(`ledger has no limit for pool ${pool}`);
  const partial = mine.filter((e) => e.cost_source === "partial").map((e) => e.case ?? "?");
  return { ok: T + H <= L + 1e-9 && partial.length === 0, T: Math.round(T * 1e6) / 1e6, H, L, ...(partial.length > 0 ? { partial } : {}) };
}

/** The refusal text of a stop rule's result (`stopRule`, `copilotStopRule`). */
function stopText(name, pool, r) {
  if (r.partial) return `${name}: pool ${pool} holds ${r.partial.length} entr${r.partial.length === 1 ? "y" : "ies"} with cost_source partial (${r.partial.join(", ")}); read the session's cost from OpenRouter's usage view and write it as cost_usd with cost_source "provider usage view" first (test plan §4.1 Ledger); ask P-01`;
  return `${name}: pool ${pool} total ${r.T} + H ${r.H} > ${r.L} USD; ask P-01`;
}

const readLedger = (file) => JSON.parse(readFileSync(file, "utf8"));

/**
 * The ledger entry of one OpenCode session. `endedAt` (ms or ISO 8601) is the session's end, written as
 * `ended_at` (ISO 8601 UTC) in every OpenCode entry for the before-read of the next session (C002-IF-010
 * §2.3 item 3); default: now.
 */
export function ledgerEntry({ scenario, record, resultFile, task, step, pool, endedAt = Date.now() }) {
  return {
    date: new Date().toISOString().slice(0, 10),
    task: task ?? null,
    step: step !== undefined && step !== null && /^\d+$/.test(String(step)) ? Number(step) : (step ?? null),
    case: scenario.id,
    row: null,
    host: "opencode",
    provider: record.provider ?? "openrouter",
    pool,
    auth: "api-key",
    api_key_source: record.api_key_source ?? "openrouter-key-file",
    models: record.models ?? [],
    host_versions: record.host_versions ?? null,
    end_reason: record.end_reason ?? null,
    turns: record.usage?.turns ?? null,
    cost_usd: record.metrics.cost_usd,
    // The spend cap the session ran with (its result record's `caps.usd`, test plan §4.1 Ledger); a
    // `partial` spend is a lower bound until it is reconciled with OpenRouter's usage view.
    caps_usd: record.caps?.usd ?? null,
    cost_source: record.spend === "partial" ? "partial" : record.spend === "unreported" ? "unreported by the host" : "runner (OpenCode step cost)",
    pass: record.pass,
    ended_at: new Date(endedAt).toISOString(),
    result: posix(relative(ROOT, resultFile)),
  };
}

/**
 * The ledger entry of a Claude Code session whose notional-cost reading failed (C002-IF-010 §2.2 Claude Code
 * spend cap, item 8; critic CR-113): the highest cost read, R, booked as the session's only record of its
 * cost. The session is no run: no result record, `valid_run` false.
 */
export function spendCheckFailedEntry({ scenario, error, caps, auth, task, step, endedAt = Date.now() }) {
  return {
    date: new Date().toISOString().slice(0, 10),
    task: task ?? null,
    step: step !== undefined && step !== null && /^\d+$/.test(String(step)) ? Number(step) : (step ?? null),
    case: scenario.id,
    row: null,
    host: "claude-code",
    provider: auth === "subscription" ? "claude-max" : "anthropic-key",
    auth,
    cost_usd: error.costUsd,
    caps_usd: caps?.usd ?? null,
    cost_source: "claude-code spend check failed",
    valid_run: false,
    pass: false,
    end_reason: null,
    result: null,
    ended_at: new Date(endedAt).toISOString(),
  };
}

// --- Reconciliation of a partial OpenCode spend from the OpenRouter key usage (C002-IF-010 §2.3) -----

/** The `<reason>` of each case in which a partial spend stays partial (C002-IF-010 §2.3 When it stays partial). */
export const STAYS_PARTIAL = {
  beforeFailed: "the key usage could not be read before the session",
  beforeUnsettled: "the key usage did not settle before the session",
  afterUnsettled: "the key usage did not settle within 20 minutes",
};

/** The 60 s between reads and the 20 minutes of both waits (C002-IF-010 §2.3; `deps.keyUsage` replaces them in the tests). */
export const KEY_USAGE_INTERVAL_MS = 60_000;
export const KEY_USAGE_LIMIT_MS = 20 * 60_000;

/** An amount in whole micro-dollars: every comparison of §2.3 is made on these integers. */
const micro = (usd) => Math.round(Number(usd) * 1e6);
const iso = (ms) => new Date(ms).toISOString();
const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
/** Waits until `Date.now()` is at least `at` (a timer can fire a little early). */
async function sleepUntil(at) {
  while (Date.now() < at) await sleep(at - Date.now());
}

/**
 * The latest `ended_at` (ms) of the ledger's OpenCode entries, or null; an entry without `ended_at`
 * (written before §2.3) is left out.
 */
export function previousSessionEnd(ledger) {
  const ends = (ledger.entries ?? []).filter((e) => (e.host === "opencode" || e.provider === "openrouter") && typeof e.ended_at === "string").map((e) => Date.parse(e.ended_at)).filter(Number.isFinite);
  return ends.length > 0 ? Math.max(...ends) : null;
}

/**
 * The before-read of one paid OpenCode session (C002-IF-010 §2.3 item 1): `{ u0: { micro, at } }` or
 * `{ u0: null, reason }`. `prevEnd` is the previous session's end (ms) or null; `settled` the settled
 * after-read of the latest session of this run (`{ micro, at, endedAt }`) or null; `keyUsage` the reads
 * `{ read, intervalMs, limitMs }`. A previous session that ended `limitMs` or more before (or none): one
 * read. Otherwise the previous session's settled after-read when it is the latest session, else a wait:
 * a read at once and then every `intervalMs`, none later than `limitMs` after the previous end, settled at
 * the first read that equals the latest earlier successful read of the wait (no bound).
 */
export async function beforeRead({ prevEnd, settled, keyUsage }) {
  const { read, intervalMs, limitMs } = keyUsage;
  const start = Date.now();
  if (prevEnd === null || start - prevEnd >= limitMs) {
    const at = Date.now();
    try {
      return { u0: { micro: micro(await read()), at: iso(at) } };
    } catch {
      return { u0: null, reason: STAYS_PARTIAL.beforeFailed };
    }
  }
  if (settled && settled.endedAt === prevEnd) return { u0: { micro: settled.micro, at: settled.at } };
  let latest = null;
  for (let k = 0; ; k++) {
    const slot = start + k * intervalMs;
    if (slot > prevEnd + limitMs) break;
    await sleepUntil(slot);
    const at = Date.now();
    if (at > prevEnd + limitMs) break;
    let v;
    try {
      v = micro(await read());
    } catch {
      continue;
    }
    if (latest !== null && v === latest) return { u0: { micro: v, at: iso(at) } };
    latest = v;
  }
  return { u0: null, reason: latest === null ? STAYS_PARTIAL.beforeFailed : STAYS_PARTIAL.beforeUnsettled };
}

/**
 * The after-reads of a session that ended `partial` (C002-IF-010 §2.3 item 2): a read every `intervalMs`,
 * the first `intervalMs` after the session's end `endedAt` (ms), none later than `limitMs` after it (at
 * most 20 with the 60 s and the 20 minutes). Settled at the first successful read that equals the latest
 * earlier successful after-read (never the before-read), when 10 × read ≥ 10 × U0 + 9 × the recorded
 * spend, all in micro-dollars. Returns `{ micro, at }` or null.
 */
export async function afterReads({ endedAt, u0, usd, keyUsage }) {
  const { read, intervalMs, limitMs } = keyUsage;
  const bound = 10 * u0.micro + 9 * micro(usd);
  let latest = null;
  for (let k = 1; ; k++) {
    const slot = endedAt + k * intervalMs;
    if (slot > endedAt + limitMs) break;
    await sleepUntil(slot);
    const at = Date.now();
    if (at > endedAt + limitMs) break;
    let v;
    try {
      v = micro(await read());
    } catch {
      continue; // a failed read is passed over
    }
    if (latest !== null && v === latest && 10 * v >= bound) return { micro: v, at: iso(at) };
    latest = v;
  }
  return null;
}

/** The reconciled fields of a session's ledger entry (C002-IF-010 §2.3 Reconciled cost). */
export function reconciledFields({ u0, u1, usd }) {
  const delta = (u1.micro - u0.micro) / 1e6;
  return {
    cost_usd: delta,
    cost_source: "openrouter key usage delta",
    cost_usd_recorded: usd,
    openrouter_usage: { before: u0.micro / 1e6, after: u1.micro / 1e6, delta, read_at: [u0.at, u1.at], endpoint: "GET /api/v1/key" },
  };
}

// --- Copilot CLI sessions: stop rule and ledger entries (P-01, 2026-10-19; test plan §4.4) ---------

/** Pool of the Copilot CLI sessions in the ledger, and its stop (P-01, 2026-10-19: 30 USD of Copilot CLI spend for CHG-002). */
export const COPILOT_POOL = "copilot";
export const COPILOT_LIMIT_USD = 30;

/**
 * Stop-rule check for one Copilot CLI session (test plan §4.1 rule 8, H as rule 1 takes it): T = the
 * `copilot` entries' cost (AI Credits × 0.01 USD), H = max(MIN_H, the highest cost of the ordinary
 * sessions of any entry), plus the cap of a cap exception matching the session's row (`exceptionCap`);
 * the session starts only if T + H ≤ L and no `copilot` entry is still `partial`.
 */
/** @param {any} ledger @param {number} [limit] @param {{ exceptionCap?: number | null }} [options] */
export function copilotStopRule(ledger, limit = COPILOT_LIMIT_USD, { exceptionCap = null } = {}) {
  const entries = ledger.entries ?? [];
  const mine = entries.filter((e) => e.provider === "copilot");
  const T = mine.reduce((s, e) => s + (Number(e.cost_usd) || 0), 0);
  const H = reserveH(entries, exceptionCap);
  const partial = mine.filter((e) => e.cost_source === "partial").map((e) => e.case ?? "?");
  return { ok: T + H <= limit + 1e-9 && partial.length === 0, T: Math.round(T * 1e6) / 1e6, H, L: limit, ...(partial.length > 0 ? { partial } : {}) };
}

/** The ledger entry of one Copilot CLI session: measured units and the USD estimate, each named. */
export function copilotLedgerEntry({ scenario, record, resultFile, task, step }) {
  const u = record.copilot_usage ?? null;
  return {
    date: new Date().toISOString().slice(0, 10),
    task: task ?? null,
    step: step !== undefined && step !== null && /^\d+$/.test(String(step)) ? Number(step) : (step ?? null),
    case: scenario.id,
    row: null,
    host: "copilot-cli",
    provider: "copilot",
    pool: COPILOT_POOL,
    auth: "subscription",
    api_key_source: record.api_key_source ?? null,
    models: record.models ?? [],
    host_versions: record.host_versions ?? null,
    end_reason: record.end_reason ?? null,
    turns: record.usage?.turns ?? null,
    ai_credits: u?.ai_credits ?? null,
    premium_requests: u?.premium_requests ?? null,
    tokens: u ? Object.fromEntries(Object.entries(u.models ?? {}).map(([m, x]) => [m, { input: x.input_tokens, output: x.output_tokens, cache_read: x.cache_read_tokens, cache_write: x.cache_write_tokens, ai_credits: x.ai_credits }])) : null,
    cost_usd: record.metrics.cost_usd,
    caps_usd: record.caps?.usd ?? null,
    cost_source: u?.ai_credits === null || u === null ? "unreported by the host" : "estimate: AI Credits measured by Copilot CLI (--usage-output-file totalNanoAiu / 1e9) × 0.01 USD (test plan §4.4); GitHub's billing view is the authority",
    pass: record.pass,
    result: posix(relative(ROOT, resultFile)),
  };
}

// --- Injection summary (C002-IF-009 §1, release-record.schema.json $defs/injectionSummary) ----------

/** Target and `source` of the injection summary per eval host (C002-IF-009 §1, C002-IF-010 §4 "Release evidence by mode"). */
export const INJECTION_SOURCES = { opencode: { target: "opencode", source: "opencode-runner" }, "copilot-cli": { target: "copilot", source: "copilot-cli-runner" } };

const INJECTION_FILE = "evals/injection/injection.eval.mjs";
const INJ_ROWS = Array.from({ length: 22 }, (_, i) => ({ id: `INJ-${String(i + 1).padStart(2, "0")}`, file: INJECTION_FILE }));

/**
 * The injection case set of each host by row ID and case file (C002-IF-010 §5.1, §5.2; defect D-026):
 * `INJ-01` … `INJ-22` on OpenCode, these and `TS-359` on Copilot CLI; none on Claude Code.
 */
export const INJECTION_CASE_SETS = {
  opencode: INJ_ROWS,
  "copilot-cli": [...INJ_ROWS, { id: "TS-359", file: "evals/targets/copilot-guard/TS-359.eval.mjs" }],
};

/** Whether the row `id` of the case file `file` (repository-relative, `/` separators) is in the host's injection case set. */
export const inInjectionSet = (host, id, file) => (INJECTION_CASE_SETS[host] ?? []).some((r) => r.id === id && r.file === file);

/**
 * A no-run refusal (C002-IF-010 §5.2, P-01 answers to Q-acted-final-01 and Q-model-refusal-01), told from
 * the result record alone. The common criteria: `end_reason` `error`, `usage.turns` 0, `models` empty, and
 * on Copilot CLI `session_model.used` empty and no key in `agent_models`. Then one of two forms: (1) the
 * host's refusal, `spend` `reported` with `usage.usd` 0 (on Copilot CLI also 0 AI Credits); (2) on Copilot
 * CLI only, the missing-model refusal: `error` `no model field in agents/<agent>.agent.md`,
 * `session_model.passed` null, `spend` `unreported` and `copilot_usage` null (critic CR-95).
 */
export function noRunRefusal(record, host) {
  const empty = (a) => Array.isArray(a) && a.length === 0;
  if (record?.end_reason !== "error" || record.usage?.turns !== 0 || !empty(record.models)) return false;
  const copilot = host === "copilot-cli";
  if (copilot && !(empty(record.session_model?.used) && record.agent_models !== null && typeof record.agent_models === "object" && Object.keys(record.agent_models).length === 0)) return false;
  const hostRefusal = record.spend === "reported" && record.usage?.usd === 0 && (!copilot || record.copilot_usage?.ai_credits === 0);
  const missingModel =
    copilot && /^no model field in agents\/[^/]+\.agent\.md$/.test(String(record.error ?? "")) && record.session_model?.passed === null && record.spend === "unreported" && record.copilot_usage === null;
  return hostRefusal || missingModel;
}

/** The enforcement mode of the Copilot table under `root` (`plugins/architect/targets/copilot.json`). */
const copilotTableMode = (root) => JSON.parse(readFileSync(join(root, "plugins", "architect", "targets", "copilot.json"), "utf8")).enforcement_mode;

let injectionValidator = null;
/** The validator of `$defs/injectionSummary` of `docs/releases/release-record.schema.json`, built as the release check builds it (Ajv 2020, C002-T-047). */
async function validateInjectionSummary(summary) {
  if (!injectionValidator) {
    const { default: Ajv2020 } = await import("ajv/dist/2020.js");
    const schema = JSON.parse(readFileSync(join(ROOT, "docs", "releases", "release-record.schema.json"), "utf8"));
    const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
    ajv.addSchema(schema);
    injectionValidator = ajv.getSchema(`${schema.$id}#/$defs/injectionSummary`);
    if (!injectionValidator) throw new Error("docs/releases/release-record.schema.json lacks $defs/injectionSummary");
  }
  const ok = injectionValidator(summary);
  return { ok: Boolean(ok), errors: (injectionValidator.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message ?? "invalid"}`).join("; ") };
}

/** Host versions compared key by key (C002-IF-010 §5.2 rule 2). */
const sameVersions = (a, b) => {
  const ka = Object.keys(a ?? {}).sort();
  const kb = Object.keys(b ?? {}).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]);
};

/**
 * The injection summary of one run (C002-IF-010 §5.2), merged fail-closed into `baseText` (the file's
 * text, or null when it does not exist). `runs` are the run's rows of the host's injection case set that
 * started a session: `{ id, doc, result }` (`result` the summary-relative path of the result file);
 * `sessionVersions` the host versions of every session of the run. Returns `{ write, summary?, out?,
 * err: string[], exit }`: `write` true when the summary is to be written (`summary`, `out` the
 * standard-output line), `err` the standard-error lines in order, `exit` 1 or 0.
 */
export async function mergeInjectionSummary({ host, baseText, runs, sessionVersions, path }) {
  const of = INJECTION_SOURCES[host];
  const refused = runs.filter((r) => r.doc.records.length > 0 && r.doc.records.every((x) => noRunRefusal(x, host))).map((r) => r.id).sort();
  const real = runs.filter((r) => r.doc.records.length > 0 && !refused.includes(r.id));
  const noEntry = refused.map((id) => `eval: injection summary: no entry for ${id}: its session ended before any model call`);
  // When: at least one row of the set started a session that is no no-run refusal.
  if (real.length === 0) return { write: false, err: noEntry, exit: 0 };
  const notWritten = (problem) => ({ write: false, err: [...noEntry, `eval: injection summary not written (${path}): ${problem}; the file is unchanged`], exit: 1 });
  let base = null;
  if (baseText !== null) {
    try {
      base = JSON.parse(baseText);
    } catch {
      return notWritten("it does not parse");
    }
    if (!(await validateInjectionSummary(base)).ok) return notWritten("it does not match the injection summary schema");
  }
  const distinct = [...new Map(sessionVersions.filter(Boolean).map((v) => [JSON.stringify(Object.fromEntries(Object.entries(v).sort())), v])).values()];
  if (distinct.length > 1) return notWritten("the run's sessions read different host versions");
  const hostVersions = distinct[0] ?? {};
  const head = { target: of.target, tier: "dev", source: of.source, host_versions: hostVersions };
  if (base) {
    for (const field of ["target", "tier", "source"]) if (base[field] !== head[field]) return notWritten(`it gives ${field} ${JSON.stringify(base[field])}, this run ${JSON.stringify(head[field])}`);
    if (!sameVersions(base.host_versions, hostVersions)) return notWritten(`it gives host_versions ${JSON.stringify(base.host_versions)}, this run ${JSON.stringify(hostVersions)}`);
    const foreign = base.cases.find((c) => !(INJECTION_CASE_SETS[host] ?? []).some((r) => r.id === c.id));
    if (foreign) return notWritten(`it holds ${foreign.id}, which is no injection case of ${host}`);
  }
  // Rules 3 and 4: an entry of the run replaces a passing base entry or is added; a base entry acted
  // upon is final for the package version; every other base entry is kept.
  const entries = new Map((base?.cases ?? []).map((c) => [c.id, { entry: c, fromRun: false }]));
  const kept = [];
  for (const r of real) {
    const held = entries.get(r.id);
    if (held && held.entry.acted_upon === true) {
      kept.push(r.id);
      continue;
    }
    // `acted_upon` false only when the result document passes and every session record of the row gives
    // `end_reason` `completed` (C002-IF-010 §5.2 rule 3, fail-closed: a session at a cap or with an error
    // shows no resistance, and a record without `end_reason` is not `completed`, critic CR-94).
    const clean = r.doc.pass && r.doc.records.every((x) => x.end_reason === "completed");
    const models = [...new Set(r.doc.records.flatMap((x) => x.models ?? []))];
    entries.set(r.id, { entry: { id: r.id, acted_upon: !clean, result: r.result, models }, fromRun: true });
  }
  const cases = [...entries.values()].sort((a, b) => (a.entry.id < b.entry.id ? -1 : a.entry.id > b.entry.id ? 1 : 0));
  const summary = { ...head, cases: cases.map((c) => c.entry) };
  const keeps = kept.sort().map((id) => `eval: injection summary keeps ${id} acted upon (${path}): a later session does not clear it; a new package version starts a new summary`);
  const check = await validateInjectionSummary(summary);
  if (!check.ok) return { write: false, err: [...keeps, ...noEntry, `eval: injection summary not written (${path}): internal error: the merged summary does not match the injection summary schema (${check.errors}); the file is unchanged`], exit: 1 };
  const n = cases.length;
  const r = cases.filter((c) => c.fromRun).length;
  const a = cases.filter((c) => c.entry.acted_upon).length;
  return { write: true, summary, out: `injection summary: ${path} (${n} cases, ${a} acted upon; ${r} from this run, ${n - r} kept)`, err: [...keeps, ...noEntry], exit: keeps.length > 0 ? 1 : 0 };
}

// --- Entry ------------------------------------------------------------------------------------------

/**
 * Runs the selection; returns the exit code. `deps.runners` replaces host runners (the stub host of
 * the runner tests: no paid session, no ledger), `deps.ledger` the ledger file, `deps.log` the output,
 * `deps.root` the repository root that the case files of the cap-exception check are relative to,
 * `deps.env` the environment of `SDD_EVAL_COPILOT_MODEL` and `SDD_EVAL_KEEP_RUN` (default `process.env`),
 * `deps.releasesRoot` the test seam of the injection summary (C002-IF-010 §5.2): a stub-host run merges
 * and writes the summary under that folder (version and Copilot mode read there, result files under its
 * `evals/results/` unless `--results-dir` is given); refused for a run on a real host; and `deps.keyUsage`
 * (`{ read, intervalMs, limitMs }`) the test seam of the reconciliation of a partial OpenCode spend
 * (C002-IF-010 §2.3): `read()` in place of the key usage request, the two times in place of the 60 s and
 * the 20 minutes of both waits; with a replaced runner the reconciliation runs only with it and
 * `deps.stopRule`. No option and no variable sets it.
 * On `--host opencode` with the real runner (or its paid-session entry, `paidOpenCodeRunner`) the run
 * refuses `SDD_EVAL_KEEP_RUN`, checks the OpenRouter key before any session, and writes every line and
 * file with the key replaced by `[REDACTED]` (C002-IF-010 §4).
 */
export async function main(argv, deps = {}) {
  // On --host opencode with the real runner every line goes through the key redaction (C002-IF-010 §4),
  // set once the key is read; before that, no line can hold it.
  let redact = (text) => text;
  const baseLog = deps.log ?? console.log;
  const baseError = deps.error ?? console.error;
  const log = (line) => baseLog(redact(line));
  const errorLine = (line) => baseError(redact(line));
  const fail = (message) => {
    errorLine(message);
    return 1;
  };
  let args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    return fail(`eval: ${e instanceof Error ? e.message : String(e)}`);
  }
  const { files, filters, host, opts } = args;
  if (!HOSTS.includes(host)) return fail(`eval: unknown host ${host}; use --host ${HOSTS.join("|")} (default ${DEFAULT_HOST}); no session started`);
  const runners = deps.runners ?? {};
  const env = deps.env ?? process.env;
  // The real OpenCode runner: no replaced runner of the host, or the runner's paid-session entry
  // (`paidOpenCodeRunner`, marked `paid`) with a stubbed host start in the tests (C002-TC-924, C002-TC-925).
  const realOpenCode = host === "opencode" && (!runners.opencode || runners.opencode.paid === true);
  // The run folder of a paid OpenCode session holds host files that are not redacted: the keep switch
  // applies to stub-host runs only (C002-IF-010 §4 Run folder of a paid session, critic CR-97).
  if (realOpenCode && env.SDD_EVAL_KEEP_RUN) return fail(KEEP_RUN_REFUSAL);
  // The test seam of the injection summary (C002-IF-010 §5.2): a stub-host run only.
  const releasesRoot = deps.releasesRoot ?? null;
  if (releasesRoot !== null && !runners[host]) return fail("eval: a releases root applies to a stub-host run only; no session started");
  // The model substitution on Copilot CLI (C002-IF-010 §1, revision D-027): --copilot-model, else the
  // variable, read on --host copilot-cli only; checked before any session.
  if (opts["copilot-model"] !== undefined && host !== "copilot-cli") return fail("eval: --copilot-model applies to --host copilot-cli only; no session started");
  let copilotModel = null;
  if (host === "copilot-cli") {
    const fromVar = env[COPILOT_MODEL_VAR];
    const [source, value] = opts["copilot-model"] !== undefined ? ["--copilot-model", opts["copilot-model"]] : fromVar !== undefined && fromVar !== "" ? [COPILOT_MODEL_VAR, fromVar] : [null, null];
    if (source !== null) {
      copilotModel = parseSubstitution(value);
      if (copilotModel === null) return fail(`eval: ${source} "${value}" is not <from>=<to>[,<from>=<to>…]; no session started`);
    }
  }
  const tier = opts.tier ?? "dev";
  if (!TIERS[tier]) return fail(`eval: unknown tier ${tier}; use dev, milestone or release`);
  const only = opts.only?.split(",");
  const selected = selectFiles(files, filters);
  if (selected.length === 0) return fail(`eval: the selection holds no case file (${[...files, ...filters.map((f) => `--filter ${f}`)].join(", ") || "no case file and no --filter given"}); no session started`);
  let picked;
  try {
    picked = await selectScenarios(selected, { host, only });
  } catch (e) {
    return fail(`eval: ${e instanceof Error ? e.message : String(e)}`);
  }
  for (const na of picked.notApplicable) log(`${na.id}: not applicable, no session (${na.reason})`);
  if (picked.scenarios.length === 0 && picked.notApplicable.length > 0) return 0;
  if (picked.scenarios.length === 0)
    return fail(`eval: the selection holds no case for host ${host} (${selected.length} file(s); ${picked.skipped.host} row(s) of another host, ${picked.skipped.only} row(s) left out by --only); no session started`);
  // The run's auth mode (C002-IF-010 §1), resolved before the cap-exception check, which matches it:
  // --auth, else EVAL_AUTH, else api-key on claude-code; none on another host.
  let auth;
  try {
    auth = host === "claude-code" ? resolveAuth(opts.auth) : null;
  } catch (e) {
    return fail(`eval: ${e instanceof Error ? e.message : String(e)}; no session started`);
  }
  // Cap exceptions (C002-IF-010 §2.2, critic CR-68, defect D-025): before any session, every selected row
  // above 0.50 USD or 30 turns needs an exception matching its row ID, its case file (relative to the
  // repository root), the host and the auth mode; under --cap-exception every row needs one with a
  // rerun cap. The check gives the caps each session runs with.
  const root = deps.root ?? ROOT;
  const capExceptionRun = opts["cap-exception"] === true;
  const checked = picked.scenarios.map(({ file, scenario }) =>
    capCheck({ id: scenario.id, file: posix(relative(root, file)), host, auth, maxBudgetUsd: scenario.maxBudgetUsd, maxTurns: scenario.maxTurns, capExceptionRun }),
  );
  const refusals = checked.filter((c) => c.refusal).map((c) => c.refusal);
  if (refusals.length > 0) return fail(`eval: ${refusals.join("; ")}; no session started`);
  const capsOf = new Map(picked.scenarios.map(({ scenario }, i) => [scenario, checked[i].caps]));

  if (!runners[host]) {
    try {
      checkHostEnv(host);
    } catch (e) {
      return fail(`eval: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  // The key check of C002-IF-010 §4 before any use of the key: before the first before-read and before
  // any host process starts. A refusal starts no session and reads no key usage; its line names the key
  // file, never the key. The checked key is the one the host process and the key usage reads get.
  let openRouterKey = null;
  if (realOpenCode) {
    try {
      openRouterKey = readOpenRouterKey();
    } catch (e) {
      return fail(e instanceof Error ? e.message : String(e));
    }
    redact = redactor(openRouterKey);
  }
  setHarnessContext({ host, runners, copilotModel, openRouterKey });
  if (copilotModel) log(`model substitution: ${Object.entries(copilotModel).map(([f, t]) => `${f}=${t}`).join(",")} (C002-IF-010 §1)`);
  if (host === "claude-code") log(`eval auth: ${auth}${auth === "subscription" ? " (Claude subscription; cost_usd is notional)" : " (stored login: prepaid API key)"}${capExceptionRun ? "; --cap-exception: rerun caps of C002-IF-010 §2.2" : ""}`);
  else log(`eval host: ${host}${runners[host] ? " (replaced runner: no paid session)" : host === "opencode" ? " (OpenRouter, key file; ledger stop rule checked before each session)" : " (GitHub Copilot plan, AI Credits; Copilot stop rule checked before each session)"}`);

  // `deps.stopRule`: the ledger's stop rule and entries also for a replaced runner (the stop-rule tests
  // of C002-TC-917 with the stub host and a ledger of their own); no paid session either way.
  const ledgerHooks = !runners[host] || deps.stopRule === true;
  const paid = host === "opencode" && ledgerHooks;
  const paidCopilot = host === "copilot-cli" && ledgerHooks;
  const ledgerFile = deps.ledger ?? LEDGER;
  const pool = opts.pool ?? "general";
  // The cap of the exception that matches a selected row (C002-IF-010 §2.2 "Reserve of a cap-exception
  // session"): H = that cap + the ordinary H; null for an ordinary row.
  const fileOf = new Map(picked.scenarios.map(({ file, scenario }) => [scenario, posix(relative(root, file))]));
  const fileOfId = new Map(picked.scenarios.map(({ file, scenario }) => [scenario.id, posix(relative(root, file))]));
  const exceptionCap = (scenario) => capException({ id: scenario.id, file: fileOf.get(scenario) ?? "", host, auth })?.usd ?? null;
  const hText = (cap, r) => (cap === null ? `H ${r.H}` : `H ${r.H} (cap exception ${cap.toFixed(2)} USD + ordinary H ${Math.round((r.H - cap) * 1e6) / 1e6})`);
  const writeLedger = (ledger) => writeFileSync(ledgerFile, redact(JSON.stringify(ledger, null, 2)) + "\n");
  // The key usage reads of the reconciliation (C002-IF-010 §2.3): on the real runner GET /api/v1/key with
  // the checked key every 60 s for at most 20 minutes; the test seam `deps.keyUsage` ({ read, intervalMs,
  // limitMs }) replaces them, and with a replaced runner the reconciliation runs only with that seam (and
  // `deps.stopRule`), so that no test reaches openrouter.ai.
  const keyUsage = paid && (deps.keyUsage !== undefined || !runners[host])
    ? (deps.keyUsage ?? { read: () => readKeyUsage(openRouterKey), intervalMs: KEY_USAGE_INTERVAL_MS, limitMs: KEY_USAGE_LIMIT_MS })
    : null;
  /** The before-read of each session, from its `before` hook to its `after` hook. */
  const before = new Map();
  /** The settled after-read of the latest session of this run (`{ micro, at, endedAt }`), else null. */
  let lastSettled = null;
  const hooks = paidCopilot
    ? {
        before({ scenario }) {
          const cap = exceptionCap(scenario);
          const r = copilotStopRule(readLedger(ledgerFile), COPILOT_LIMIT_USD, { exceptionCap: cap });
          if (!r.ok) throw new Error(stopText("Copilot stop rule (P-01, 2026-10-19)", COPILOT_POOL, r));
          log(`Copilot stop rule ok: pool ${COPILOT_POOL} total ${r.T} + ${hText(cap, r)} ≤ ${r.L} USD`);
        },
        after({ scenario, record, resultFile }) {
          const ledger = readLedger(ledgerFile);
          const entry = copilotLedgerEntry({ scenario, record, resultFile, task: opts.task ?? opts.label ?? null, step: opts.step ?? null });
          ledger.entries.push(entry);
          writeLedger(ledger);
          log(`ledger: ${scenario.id} ${entry.ai_credits ?? "unreported"} AI Credits (measured), ${record.metrics.cost_usd.toFixed(4)} USD (estimate) added to pool ${COPILOT_POOL}`);
        },
      }
    : paid
    ? {
        async before({ scenario }) {
          const cap = exceptionCap(scenario);
          const ledger = readLedger(ledgerFile);
          const r = stopRule(ledger, pool, { exceptionCap: cap });
          if (!r.ok) throw new Error(stopText("stop rule of test plan §4.1", pool, r));
          log(`stop rule ok: pool ${pool} total ${r.T} + ${hText(cap, r)} ≤ ${r.L} USD`);
          // The before-read (C002-IF-010 §2.3 item 1): after the stop rule allowed the session and the key
          // check passed, before the runner starts it. A failed or unsettled before-read is kept with its
          // reason; the session still runs.
          if (keyUsage) before.set(scenario, await beforeRead({ prevEnd: previousSessionEnd(ledger), settled: lastSettled, keyUsage }));
        },
        async after({ scenario, record, resultFile, endedAt }) {
          const ledger = readLedger(ledgerFile);
          const entry = ledgerEntry({ scenario, record, resultFile, task: opts.task ?? opts.label ?? null, step: opts.step ?? null, pool, endedAt });
          ledger.entries.push(entry);
          writeLedger(ledger);
          log(`ledger: ${scenario.id} ${record.metrics.cost_usd.toFixed(4)} USD added to pool ${pool}${entry.cost_source === "partial" ? " (cost_source partial: a lower bound; the stop rule says stop for this pool until it is reconciled with OpenRouter's usage view)" : ""}`);
          // The after-reads of a session that ended `partial` (C002-IF-010 §2.3 item 2), before the stop rule
          // of the next session runs (item 3). The result record is not changed.
          const pre = before.get(scenario);
          before.delete(scenario);
          lastSettled = null;
          if (!keyUsage || entry.cost_source !== "partial") return;
          const stays = (reason) => errorLine(`eval: spend of ${scenario.id} stays partial (${ledgerFile}): ${reason}; reconcile it by hand (test plan §4.1 Ledger)`);
          if (!pre?.u0) return stays(pre?.reason ?? STAYS_PARTIAL.beforeFailed);
          const usd = Number(record.usage?.usd ?? record.metrics.cost_usd);
          const u1 = await afterReads({ endedAt: Date.parse(entry.ended_at), u0: pre.u0, usd, keyUsage });
          if (!u1) return stays(STAYS_PARTIAL.afterUnsettled);
          const fields = reconciledFields({ u0: pre.u0, u1, usd });
          const now = readLedger(ledgerFile);
          const i = now.entries.findIndex((e) => e.case === entry.case && e.ended_at === entry.ended_at && e.result === entry.result && e.cost_source === "partial");
          if (i < 0) return stays(STAYS_PARTIAL.afterUnsettled);
          now.entries[i] = { ...now.entries[i], ...fields };
          writeLedger(now);
          lastSettled = { micro: u1.micro, at: u1.at, endedAt: Date.parse(entry.ended_at) };
          log(`ledger: ${scenario.id} reconciled from the OpenRouter key usage: ${fields.cost_usd.toFixed(4)} USD (recorded ${usd.toFixed(4)} USD)`);
        },
      }
    : host === "claude-code"
    ? {
        // A failed notional-cost reading (C002-IF-010 §2.2 Claude Code spend cap, item 8): one ledger
        // entry before the error reaches the run, which then ends with it.
        spendCheckFailed({ scenario, error, caps, auth: mode, endedAt }) {
          const ledger = existsSync(ledgerFile) ? readLedger(ledgerFile) : { entries: [] };
          ledger.entries ??= [];
          const entry = spendCheckFailedEntry({ scenario, error, caps, auth: mode, task: opts.task ?? opts.label ?? null, step: opts.step ?? null, endedAt });
          ledger.entries.push(entry);
          writeLedger(ledger);
          errorLine(`ledger: ${scenario.id} ${usdText(entry.cost_usd)} USD booked with cost_source "${entry.cost_source}" (${ledgerFile}); the session is no run`);
        },
      }
    : {};

  const runs = opts.runs ? Number(opts.runs) : undefined;
  const budget = { spent: 0, limit: Number(opts["max-total-usd"] ?? "5") };
  const resultsDir = opts["results-dir"] ? resolve(opts["results-dir"]) : releasesRoot !== null ? join(releasesRoot, "evals", "results") : RESULTS;
  let ok = true;
  const docs = [];
  for (const { scenario } of picked.scenarios) {
    const doc = await runScenario(scenario, { tier, runs, label: opts.label, budget, auth: auth ?? undefined, host, resultsDir, hooks, log, caps: capsOf.get(scenario), redact });
    docs.push(doc);
    log(`${doc.scenario}: ${doc.passed}/${doc.runs} passed (rule ${doc.pass_rule}) → ${doc.pass ? "PASS" : "FAIL"} · $${doc.cost_usd.toFixed(4)}`);
    ok &&= doc.pass;
    if (doc.stopped) break;
  }
  // The injection summary of an OpenCode or Copilot CLI run (C002-IF-010 §5.2, defect D-026):
  // docs/releases/<target>/<version>/injection.json, merged fail-closed into the existing file. A paid run
  // writes it, a stub-host run only with the test seam `deps.releasesRoot`; on Copilot CLI only under
  // sdd MCP server enforcement; never on Claude Code.
  let summaryExit = 0;
  const sumRoot = releasesRoot ?? ROOT;
  if (INJECTION_SOURCES[host] && (releasesRoot !== null || !runners[host]) && (host !== "copilot-cli" || copilotTableMode(sumRoot) === "sdd-mcp-server")) {
    const injection = docs.filter((d) => inInjectionSet(host, d.scenario, fileOfId.get(d.scenario) ?? "") && d.runs > 0);
    if (injection.length > 0) {
      const { version } = JSON.parse(readFileSync(join(sumRoot, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8"));
      const out = join(sumRoot, "docs", "releases", INJECTION_SOURCES[host].target, version, "injection.json");
      const path = posix(relative(sumRoot, out));
      const merged = await mergeInjectionSummary({
        host,
        baseText: existsSync(out) ? readFileSync(out, "utf8") : null,
        runs: injection.map((doc) => ({ id: doc.scenario, doc, result: posix(relative(sumRoot, resultFiles.get(doc) ?? "")) })),
        sessionVersions: docs.flatMap((d) => d.records.map((r) => r.host_versions ?? null)),
        path,
      });
      for (const line of merged.err) errorLine(line);
      if (merged.write) {
        mkdirSync(join(out, ".."), { recursive: true });
        writeFileSync(out, redact(JSON.stringify(merged.summary, null, 2)) + "\n");
        log(merged.out);
      }
      summaryExit = merged.exit;
    }
  }
  log(`total ${host === "claude-code" ? "API-key" : host} cost $${budget.spent.toFixed(4)} (limit $${budget.limit})${auth === "subscription" ? "; subscription sessions are not counted" : ""}`);
  return ok && summaryExit === 0 ? 0 : 1;
}

// Script entry only (bundled into a test, import.meta.filename is the test file).
if (process.argv[1]?.endsWith("run.mjs") && import.meta.filename === process.argv[1]) process.exitCode = await main(process.argv.slice(2));
