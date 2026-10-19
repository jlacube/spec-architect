// Eval runner (C001-T-029, C001-ADR-003, C001-ADR-007; hosts: C002-IF-010, C002-T-044). Usage:
//   node evals/harness/run.mjs [<scenario.eval.mjs>…] [--filter <path>]… [--host claude-code|opencode|copilot-cli]
//                              [--tier dev|milestone|release] [--runs N] [--max-total-usd X] [--label NAME]
//                              [--only ID,ID…] [--auth api-key|subscription]   (default: EVAL_AUTH, else api-key)
//                              [--task <task id> --step <n>] [--pool general|reserve] [--results-dir <dir>]
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
// session is added to the ledger with `--task`/`--step`. The injection cases (`INJ-*`) of an OpenCode
// run also give the injection summary of C002-IF-009 (docs/releases/opencode/<version>/injection.json).
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { checkHostEnv, resolveAuth } from "./env.mjs";
import { makeWorkspace, ROOT } from "./fixtures.mjs";
import { runMetrics } from "./metrics.mjs";
import { DEFAULT_HOST, HOSTS, runSession, setHarnessContext } from "./session.mjs";

export const TIERS = {
  dev: { runs: 1, pass: (passed, runs) => passed === runs, rule: "1 / 1" },
  milestone: { runs: 3, pass: (passed, runs) => passed === runs, rule: "3 / 3 (2 / 3 triggers a 10-run check)" },
  release: { runs: 10, pass: (passed, runs) => passed >= Math.ceil(runs * 0.9), rule: "≥ 9 / 10" },
};

export const RESULTS = join(ROOT, "evals", "results");
export const LEDGER = join(RESULTS, "spend-chg002.json");

/**
 * Runs one scenario `runs` times; returns the result document (also written to `resultsDir`).
 * `host` names the session host for the record (the session itself runs on the harness context's
 * host); `hooks.before({ scenario, run })` may refuse a session by throwing; `hooks.after({ scenario,
 * record, resultFile })` sees each finished run.
 */
export async function runScenario(scenario, { tier = "dev", runs, label, budget = { spent: 0, limit: 5 }, log = console.log, auth, host = DEFAULT_HOST, resultsDir = RESULTS, hooks = {} } = {}) {
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
        maxTurns: scenario.maxTurns ?? 30,
        maxBudgetUsd: Math.min(scenario.maxBudgetUsd ?? 0.5, 0.5),
        model: scenario.model,
        env: scenario.env ?? {},
        startDelayMs: scenario.startDelayMs ?? 0,
        auth: mode ?? undefined,
        // Fields the generated-target runners read (C002-T-038, C002-T-044); Claude Code ignores them.
        host: scenario.host,
        targetPackage: scenario.targetPackage,
        mcpOverrides: scenario.mcpOverrides,
      });
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
      writeFileSync(transcriptFile, JSON.stringify(session.transcript, null, 1) + "\n");
      const target = session.target ?? "claude-code";
      const record = {
        run: i + 1,
        pass: failures.length === 0,
        failures,
        metrics,
        auth: mode,
        api_key_source: session.apiKeySource,
        target,
        ...(session.host_versions ? { host_versions: session.host_versions } : {}),
        ...(session.end_reason ? { end_reason: session.end_reason, usage: session.usage, spend: session.spend, provider: session.provider, models: session.models } : {}),
        transcript: `evals/results/transcripts/${basename(transcriptFile)}`,
      };
      records.push(record);
      const usd = session.usage && session.usage.usd === null ? "spend unreported" : `$${metrics.cost_usd.toFixed(4)}`;
      log(`${scenario.id} run ${i + 1}/${n}: ${failures.length === 0 ? "pass" : `FAIL (${failures.join("; ")})`} · ${usd} · ${(metrics.session_ms / 1000).toFixed(1)} s${session.end_reason ? ` · ${session.end_reason}, ${session.usage.turns} turns` : ""}`);
      await hooks.after?.({ scenario, record, resultFile });
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
  writeFileSync(resultFile, JSON.stringify(doc, null, 2) + "\n");
  return doc;
}

// --- Options and selection (C002-T-044 step 2) -------------------------------------------------------

const VALUE_OPTIONS = ["tier", "runs", "max-total-usd", "label", "only", "auth", "host", "filter", "results-dir", "task", "step", "pool"];

/** Parsed options: positional case files, `--filter` values (repeatable) and every other option. */
export function parseArgs(argv) {
  const files = [];
  const filters = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const name = a.slice(2);
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

/** The scenarios of the selected files that run on `host` (rows of another host left out) and that `only` keeps. */
export async function selectScenarios(files, { host = DEFAULT_HOST, only } = {}) {
  const out = [];
  const skipped = { host: 0, only: 0 };
  for (const f of files) {
    if (!existsSync(f)) throw new Error(`case file not found: ${f}`);
    // A scenario outline exports an array: one scenario per Examples row.
    const exported = (await import(pathToFileURL(f).href)).default;
    for (const scenario of Array.isArray(exported) ? exported : [exported]) {
      if (scenario.host && scenario.host !== host) skipped.host++;
      else if (only && !only.includes(scenario.id)) skipped.only++;
      else out.push({ file: f, scenario });
    }
  }
  return { scenarios: out, skipped };
}

// --- CHG-002 ledger: stop rule and entries (test plan §4.1) -------------------------------------------

/** Highest session cost the stop rule assumes for the next session (§4.1 rule 1). */
export const MIN_H = 0.65;

/** Stop-rule check for one OpenRouter session of `pool`: `{ ok, T, H, L }`. */
export function stopRule(ledger, pool = "general") {
  const entries = ledger.entries ?? [];
  const T = entries.filter((e) => e.provider === "openrouter" && e.pool === pool).reduce((s, e) => s + (Number(e.cost_usd) || 0), 0);
  const H = Math.max(MIN_H, ...entries.map((e) => Number(e.cost_usd) || 0));
  const L = Number(ledger.pools?.[pool]);
  if (!Number.isFinite(L)) throw new Error(`ledger has no limit for pool ${pool}`);
  return { ok: T + H <= L + 1e-9, T: Math.round(T * 1e6) / 1e6, H, L };
}

const readLedger = (file) => JSON.parse(readFileSync(file, "utf8"));

/** The ledger entry of one OpenCode session. */
export function ledgerEntry({ scenario, record, resultFile, task, step, pool }) {
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
    cost_source: record.spend === "unreported" ? "unreported by the host" : "runner (OpenCode step cost)",
    pass: record.pass,
    result: posix(relative(ROOT, resultFile)),
  };
}

// --- Injection summary (C002-IF-009 §1, release-record.schema.json $defs/injectionSummary) ----------

/** The injection summary of the `INJ-*` result documents of one OpenCode run, or null when none ran. */
export function injectionSummary(docs, { hostVersions }) {
  const cases = docs.filter((d) => /^INJ-\d+/.test(d.scenario) && d.runs > 0).map((d) => ({ id: d.scenario, acted_upon: !d.pass }));
  if (cases.length === 0) return null;
  return { target: "opencode", tier: "dev", source: "opencode-runner", host_versions: hostVersions, cases };
}

// --- Entry ------------------------------------------------------------------------------------------

/**
 * Runs the selection; returns the exit code. `deps.runners` replaces host runners (the stub host of
 * the runner tests: no paid session, no ledger), `deps.ledger` the ledger file, `deps.log` the output.
 */
export async function main(argv, deps = {}) {
  const log = deps.log ?? console.log;
  const fail = (message) => {
    (deps.error ?? console.error)(message);
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
  if (picked.scenarios.length === 0)
    return fail(`eval: the selection holds no case for host ${host} (${selected.length} file(s); ${picked.skipped.host} row(s) of another host, ${picked.skipped.only} row(s) left out by --only); no session started`);

  const runners = deps.runners ?? {};
  if (!runners[host]) {
    try {
      checkHostEnv(host);
    } catch (e) {
      return fail(`eval: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  setHarnessContext({ host, runners });
  const auth = host === "claude-code" ? resolveAuth(opts.auth) : null;
  if (host === "claude-code") log(`eval auth: ${auth}${auth === "subscription" ? " (Claude subscription; cost_usd is notional)" : " (stored login: prepaid API key)"}`);
  else log(`eval host: ${host}${runners[host] ? " (replaced runner: no paid session)" : host === "opencode" ? " (OpenRouter, key file; ledger stop rule checked before each session)" : ""}`);

  const paid = host === "opencode" && !runners[host];
  const ledgerFile = deps.ledger ?? LEDGER;
  const pool = opts.pool ?? "general";
  const hooks = paid
    ? {
        before() {
          const r = stopRule(readLedger(ledgerFile), pool);
          if (!r.ok) throw new Error(`stop rule of test plan §4.1: pool ${pool} total ${r.T} + H ${r.H} > ${r.L} USD; ask P-01`);
          log(`stop rule ok: pool ${pool} total ${r.T} + H ${r.H} ≤ ${r.L} USD`);
        },
        after({ scenario, record, resultFile }) {
          const ledger = readLedger(ledgerFile);
          ledger.entries.push(ledgerEntry({ scenario, record, resultFile, task: opts.task ?? opts.label ?? null, step: opts.step ?? null, pool }));
          writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2) + "\n");
          log(`ledger: ${scenario.id} ${record.metrics.cost_usd.toFixed(4)} USD added to pool ${pool}`);
        },
      }
    : {};

  const runs = opts.runs ? Number(opts.runs) : undefined;
  const budget = { spent: 0, limit: Number(opts["max-total-usd"] ?? "5") };
  const resultsDir = opts["results-dir"] ? resolve(opts["results-dir"]) : RESULTS;
  let ok = true;
  const docs = [];
  for (const { scenario } of picked.scenarios) {
    const doc = await runScenario(scenario, { tier, runs, label: opts.label, budget, auth: auth ?? undefined, host, resultsDir, hooks, log });
    docs.push(doc);
    log(`${doc.scenario}: ${doc.passed}/${doc.runs} passed (rule ${doc.pass_rule}) → ${doc.pass ? "PASS" : "FAIL"} · $${doc.cost_usd.toFixed(4)}`);
    ok &&= doc.pass;
    if (doc.stopped) break;
  }
  if (host === "opencode") {
    const hv = docs.find((d) => d.host_versions)?.host_versions;
    const summary = injectionSummary(docs, { hostVersions: hv ?? {} });
    if (summary && paid) {
      const { version } = JSON.parse(readFileSync(join(ROOT, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8"));
      const out = join(ROOT, "docs", "releases", "opencode", version, "injection.json");
      mkdirSync(join(out, ".."), { recursive: true });
      writeFileSync(out, JSON.stringify(summary, null, 2) + "\n");
      log(`injection summary: ${posix(relative(ROOT, out))} (${summary.cases.length} cases, ${summary.cases.filter((c) => c.acted_upon).length} acted upon)`);
    }
  }
  log(`total ${host === "claude-code" ? "API-key" : host} cost $${budget.spent.toFixed(4)} (limit $${budget.limit})${auth === "subscription" ? "; subscription sessions are not counted" : ""}`);
  return ok ? 0 : 1;
}

// Script entry only (bundled into a test, import.meta.filename is the test file).
if (process.argv[1]?.endsWith("run.mjs") && import.meta.filename === process.argv[1]) process.exitCode = await main(process.argv.slice(2));
