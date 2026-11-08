// Runs the session chain of the toy change to G3 on one configuration (evals/toy/toy-g3.eval.mjs): one run.mjs
// session of the row `toy-g3-<cfg>` after the other, until G3 is approved, a session fails, or a limit is
// reached. Usage:
//   node evals/toy/chain.mjs --cfg cfg-full [--fresh] [--after-fix] [--max-sessions N] [--max-usd X] [--label NAME]
//                            [-- <further run.mjs options>]
// Each session: `run.mjs --host claude-code --auth subscription --cap-exception --tier dev --runs 1
// --only toy-g3-<cfg> --label <label> evals/toy/toy-g3.eval.mjs` (the rerun cap of the row's cap exception,
// 6.00 USD, C002-IF-010 §2.2, defect D-043). --fresh removes the chain's saved state first; it is refused for a
// configuration whose chain must resume (cfg-full, defect D-044, critic CR-140).
// Exit codes (C002-IF-010 §2.2, critic CR-139):
//   0  G3 approved and the end state holds;
//   1  a session failed (or run.mjs refused it);
//   2  a limit reached (sessions or notional USD), G3 not approved;
//   3  a resume (no --fresh) found no saved chain: chain.json missing, unreadable or without a session (critic
//      CR-109), so a lost state never restarts a chain from zero;
//   4  the configuration is deferred (cfg-bare, defect D-044): nothing runs;
//   5  an option refused: an unknown option or configuration, --max-sessions or --max-usd not positive or above
//      the configuration's limit, --fresh for a configuration that must resume, or --after-fix when the last saved
//      session did not fail. Nothing runs;
//   6  a resume whose last saved session failed, without --after-fix (defect D-045): nothing runs. The conductor
//      gives --after-fix only once the cause of that failure is fixed; the chain then resumes where it stopped.
// The limits are per configuration (`CHAIN_LIMITS`, defects D-044, D-045): cfg-full 18 sessions and 75 USD notional
// in total, the saved sessions included; --max-sessions and --max-usd may only lower them. The USD limit is checked
// before each session with the session's cap, read from the
// row's cap exception (C002-IF-010 §2.2, defect D-042, critic CR-134): no session starts when the chain total plus
// that cap would pass --max-usd, so a chain ends at or under --max-usd, apart from the overshoot of a capped
// session's last step. A resumed chain counts the sessions of its saved state (chain.json).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { TOY_CHAIN_RERUN_USD, capException } from "../harness/caps.mjs";
import { ROOT } from "../harness/fixtures.mjs";
import { CONFIGS, nextStep, stateDir, statusOf } from "./toy-g3.eval.mjs";

/**
 * The chain limits per configuration (C002-IF-010 §2.2; defect D-044, P-01 Q-toy-g3-limit-01): the session
 * bound and the notional USD total of the chain, its saved sessions included; `resumeOnly`: --fresh refused
 * (critic CR-140). cfg-bare is deferred to the follow-up change "Cost and token efficiency" and runs no chain in CHG-001 or
 * CHG-002; its cap row `toy-g3-cfg-bare` is marked deferred too, so capCheck refuses it (critic CR-141).
 */
export const CHAIN_LIMITS = Object.freeze({
  "cfg-full": Object.freeze({ maxSessions: 18, maxUsd: 75, resumeOnly: true }),
  "cfg-bare": Object.freeze({ deferred: "deferred to the follow-up change 'Cost and token efficiency' (defect D-044); no chain runs in CHG-001 or CHG-002" }),
});

/** The session cap of the row `toy-g3-<cfg>`: the rerun cap of its cap exception (C002-IF-010 §2.2), or null. */
export function rowCapUsd(cfg) {
  const e = capException({ id: `toy-g3-${cfg}`, file: "evals/toy/toy-g3.eval.mjs", host: "claude-code", auth: "subscription" });
  return e && !e.deferred ? (e.rerunUsd ?? null) : null;
}

/**
 * Why a chain cannot resume from `dir` (no --fresh; critic CR-109), or null when its chain.json holds at least
 * one saved session.
 */
export function resumeProblem(dir) {
  const p = join(dir, "chain.json");
  if (!existsSync(p)) return `chain: no saved chain at ${p}; start a new chain with --fresh`;
  let chain;
  try {
    chain = JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return `chain: ${p} is not valid JSON; nothing was run`;
  }
  if (!Array.isArray(chain?.sessions) || chain.sessions.length === 0) return `chain: ${p} holds no saved session; start a new chain with --fresh`;
  return null;
}

/**
 * Why a resume may not go on after its last saved session (defect D-045), as `{ refusal, code }`, or null: a
 * last session with failures needs `afterFix` (code 6), given by the conductor only once the cause is fixed;
 * `afterFix` without such a session is refused (code 5).
 */
export function afterFailureProblem(chain, afterFix = false) {
  const last = chain?.sessions?.at(-1);
  const failed = Boolean(last && last.failures > 0);
  if (failed && !afterFix) return { refusal: `chain: the last saved session (${last.n ?? chain.sessions.length}) failed; resume with --after-fix only once its cause is fixed`, code: 6 };
  if (!failed && afterFix) return { refusal: "chain: --after-fix given, but the last saved session did not fail", code: 5 };
  return null;
}

/** The chain's notional total (USD) from its chain.json document. */
export const chainUsd = (chain) => Math.round((chain?.sessions ?? []).reduce((s, x) => s + (x.cost_usd ?? 0), 0) * 1e6) / 1e6;

/**
 * What the driver does next: `{ go: true }` or `{ go: false, code, why }`. `done` (G3 approved) ends with 0
 * when the last session had no failure; `lastExit` non-zero ends with 1; a limit reached ends with 2. The USD
 * limit counts the next session at its cap `sessionUsd` (the row's rerun cap, 6.00 USD): no session starts when
 * the chain total plus that cap would pass `maxUsd` (critic CR-134).
 */
export function decide({ chain, done, lastExit = 0, maxSessions, maxUsd, sessionUsd = TOY_CHAIN_RERUN_USD }) {
  const n = chain?.sessions?.length ?? 0;
  const last = chain?.sessions?.at(-1);
  if (lastExit !== 0) return { go: false, code: 1, why: `session ${n} failed (run.mjs exit ${lastExit})` };
  if (done) return last && last.failures > 0 ? { go: false, code: 1, why: `G3 approved, but session ${n} has ${last.failures} failure(s)` } : { go: false, code: 0, why: `G3 approved after ${n} session(s)` };
  if (n >= maxSessions) return { go: false, code: 2, why: `${n} sessions, the --max-sessions limit, and G3 not approved` };
  const usd = chainUsd(chain);
  if (usd + sessionUsd > maxUsd) return { go: false, code: 2, why: `${usd} USD notional, and one more session at its ${sessionUsd} USD cap would pass --max-usd ${maxUsd}; G3 not approved` };
  return { go: true };
}

function parse(argv) {
  const o = { cfg: null, fresh: false, afterFix: false, maxSessions: null, maxUsd: null, label: "toy-g3", rest: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      o.rest = argv.slice(i + 1);
      break;
    }
    if (a === "--cfg") o.cfg = argv[++i];
    else if (a === "--fresh") o.fresh = true;
    else if (a === "--after-fix") o.afterFix = true;
    else if (a === "--max-sessions") o.maxSessions = Number(argv[++i]);
    else if (a === "--max-usd") o.maxUsd = Number(argv[++i]);
    else if (a === "--label") o.label = argv[++i];
    else return { refusal: `chain: unknown option ${a}` };
  }
  return o;
}

/**
 * The limits of one chain run: `{ maxSessions, maxUsd }` from `CHAIN_LIMITS`, an option lowering one of them,
 * or `{ refusal, code }`: code 4 for a deferred configuration, 5 for a refused option (an unknown
 * configuration, a limit option not positive or above the limit, --fresh where the chain must resume).
 */
export function chainLimits(cfg, { maxSessions = null, maxUsd = null, fresh = false } = {}) {
  const l = CHAIN_LIMITS[cfg];
  if (!l) return { refusal: `chain: --cfg must be one of ${Object.keys(CHAIN_LIMITS).join(", ")}`, code: 5 };
  if (l.deferred) return { refusal: `chain: ${cfg} is ${l.deferred}`, code: 4 };
  if (fresh && l.resumeOnly) return { refusal: `chain: --fresh is refused for ${cfg}: its chain resumes from its saved sessions (defect D-044)`, code: 5 };
  const pick = (name, given, limit) => {
    if (given === null) return { value: limit };
    if (!(given > 0) || given > limit) return { refusal: `chain: --${name} ${given} must be positive and at most the ${cfg} limit ${limit}` };
    return { value: given };
  };
  const s = pick("max-sessions", maxSessions, l.maxSessions);
  const u = pick("max-usd", maxUsd, l.maxUsd);
  const refusal = s.refusal ?? u.refusal;
  return refusal ? { refusal, code: 5 } : { maxSessions: s.value, maxUsd: u.value };
}

function main() {
  const o = parse(process.argv.slice(2));
  if (o.refusal) {
    console.error(o.refusal);
    process.exit(5);
  }
  const limits = chainLimits(o.cfg, o);
  if (limits.refusal) {
    console.error(limits.refusal);
    process.exit(limits.code);
  }
  const dir = stateDir(o.cfg);
  const sessionUsd = rowCapUsd(o.cfg);
  if (typeof sessionUsd !== "number") throw new Error(`chain: no cap exception with a rerun cap for toy-g3-${o.cfg} (C002-IF-010 §2.2)`);
  if (o.fresh && o.afterFix) {
    console.error("chain: --after-fix is for a resume, not with --fresh");
    process.exit(5);
  }
  if (o.fresh) rmSync(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
  else {
    const problem = resumeProblem(dir);
    if (problem) {
      console.error(problem);
      process.exit(3);
    }
    const after = afterFailureProblem(JSON.parse(readFileSync(join(dir, "chain.json"), "utf8")), o.afterFix);
    if (after) {
      console.error(after.refusal);
      process.exit(after.code);
    }
  }
  const read = () => {
    const chain = existsSync(join(dir, "chain.json")) ? JSON.parse(readFileSync(join(dir, "chain.json"), "utf8")) : { sessions: [] };
    const ws = join(dir, "workspace");
    const done = existsSync(join(ws, ".sdd")) && nextStep(statusOf(ws)).done === true;
    return { chain, done };
  };
  let lastExit = 0;
  for (;;) {
    const d = decide({ ...read(), lastExit, maxSessions: limits.maxSessions, maxUsd: limits.maxUsd, sessionUsd });
    if (!d.go) {
      const { chain } = read();
      console.log(`chain ${o.cfg}: ${d.why}; ${chain.sessions.length} session(s), ${chainUsd(chain)} USD notional (state ${dir})`);
      process.exit(d.code);
    }
    const args = [join(ROOT, "evals", "harness", "run.mjs"), "--host", "claude-code", "--auth", "subscription", "--cap-exception", "--tier", "dev", "--runs", "1", "--only", `toy-g3-${o.cfg}`, "--label", o.label, ...o.rest, join(ROOT, "evals", "toy", "toy-g3.eval.mjs")];
    const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit" });
    lastExit = r.status ?? 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
