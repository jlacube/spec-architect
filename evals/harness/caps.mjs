// Turn and spend caps of one eval session on a generated target (C002-REQ-611, C002-NFR-105; C002-T-044),
// shared by the eval runners of C002-COMP-009 (OpenCode, the stub host, and the Copilot CLI runner of
// C002-T-045). A runner reports each finished model turn with the spend the host gave for it; the caps say
// when the session must end and why. The Claude Code host keeps the Agent SDK's own `maxTurns` and
// `maxBudgetUsd` (session.mjs).
//
// Rules (C002-IF-010 §2, §3):
//   - turn cap: the session ends when it has made `maxTurns` turns (default 30);
//   - spend cap: the session ends when its spend reaches `maxBudgetUsd` (default 0.50 USD), checked after
//     each turn (a turn can overrun it, as on Claude Code, test plan §4.1 rule 1);
//   - a host that reports no spend for any turn leaves the turn cap alone: `usage.usd` is null and the
//     result records `spend: "unreported"`.

/** Default caps of C002-NFR-105. */
export const DEFAULT_MAX_TURNS = 30;
export const DEFAULT_MAX_BUDGET_USD = 0.5;

/** End reasons of C002-IF-010 §3. */
export const END_REASONS = ["completed", "turn cap", "spend cap", "question unanswerable", "error"];

// Spend sums are compared at 1e-9 USD so that five turns of 0.10 USD reach 0.50 USD exactly.
const EPS = 1e-9;

/**
 * Caps of one session: `turn(usd)` records one finished turn (`usd` a number, or null/undefined when
 * the host reported no spend for it) and returns the end reason the caps impose ("turn cap",
 * "spend cap") or null; `usage()` returns `{ turns, usd }` with `usd` null while no turn reported
 * spend; `reason` is the first cap reached (null while none).
 */
export function createCaps({ maxTurns = DEFAULT_MAX_TURNS, maxBudgetUsd = DEFAULT_MAX_BUDGET_USD } = {}) {
  if (!(Number.isInteger(maxTurns) && maxTurns > 0)) throw new Error(`maxTurns must be a positive integer, not ${maxTurns}`);
  if (!(typeof maxBudgetUsd === "number" && maxBudgetUsd > 0)) throw new Error(`maxBudgetUsd must be a positive number, not ${maxBudgetUsd}`);
  let turns = 0;
  let usd = 0;
  let reported = false;
  let reason = null;
  return {
    maxTurns,
    maxBudgetUsd,
    get reason() {
      return reason;
    },
    get reportsSpend() {
      return reported;
    },
    turn(cost) {
      turns += 1;
      return this.spend(cost);
    },
    /** Spend that counts toward the spend cap but is no turn of the session (a subagent's model turn). */
    spend(cost) {
      if (typeof cost === "number" && Number.isFinite(cost)) {
        reported = true;
        usd += cost;
      }
      if (reason === null) {
        if (reported && usd + EPS >= maxBudgetUsd) reason = "spend cap";
        else if (turns >= maxTurns) reason = "turn cap";
      }
      return reason;
    },
    usage() {
      return { turns, usd: reported ? Math.round(usd * 1e9) / 1e9 : null };
    },
  };
}

/**
 * Cap exceptions in force: the rows of the C002-IF-010 §2.2 table "Caps above 0.50 USD" (critic CR-68;
 * revised for defect D-025). Each row gives the row ID, its case file (repository-relative, `/`
 * separators), the host, the auth mode (`null` for a host without one), the row's own caps that the
 * exception allows (`usd`, `turns`) and the rerun cap of `--cap-exception` (`rerunUsd`, `null` when the
 * row has none).
 * - paid class: TS-634 on OpenCode at 2.00 USD, no rerun cap (P-01, Q-ts634-budget-01/02, D-022 item 1);
 * - Claude Code subscription class (P-01, Q-claude-cap-01/02, 2026-10-21): the five rows of C002-T-048
 *   batches 5 and 6 that the 0.50 USD notional cap ended, rerun at 1.50 USD; TS-213 and TS-221 at their
 *   case files' 40 turns, rerun at 1.50 USD; the rows of batch 7 and INJ-19, rerun at 1.50 USD; and, for
 *   defect D-030 (P-01, Q-cap-exc-01/02, 2026-10-24; C002-T-068), the CHG-001 release cases of
 *   C001-T-082 step 4 and C001-T-072, at the row's own caps with the rerun cap 1.50 USD.
 * Each subscription-class row records as `rule` the list of §2.2 "Sessions of CHG-001 tasks" that holds
 * it, which the CHG-001 tasks read: 1 = every session at the rerun cap (each started with
 * `--cap-exception`); 2 = sessions at the row's own caps, each failed session that ended at the spend cap
 * replaced by one session at the rerun cap (started with `--cap-exception`); null = in neither list
 * (TS-421-agent, no release case of C001-ADR-003). The rule is data only: the harness decides no run or
 * rerun, and `capCheck` applies the rerun cap to any run with `--cap-exception` whatever the rule.
 * The harness does not count the exception's runs (§2.2 Runs: the owning task's done-check does,
 * C002-T-056 for TS-634, C002-T-048 for its subscription-class sessions, C001-T-082 and C001-T-072 for
 * theirs).
 */
const SUB = (row, file, rule, turns = DEFAULT_MAX_TURNS) => Object.freeze({ row, file, host: "claude-code", auth: "subscription", usd: DEFAULT_MAX_BUDGET_USD, turns, rerunUsd: 1.5, rule });
const INJ = "evals/injection/injection.eval.mjs";
export const CAP_EXCEPTIONS = Object.freeze([
  Object.freeze({ row: "TS-634", file: "evals/targets/gate/TS-634.eval.mjs", host: "opencode", auth: null, usd: 2.0, turns: DEFAULT_MAX_TURNS, rerunUsd: null }),
  SUB("TS-214", "evals/cap02/TS-214.eval.mjs", 2),
  SUB("TS-215", "evals/cap02/TS-215.eval.mjs", 1),
  SUB("TS-318-00-ideation", "evals/cap03/TS-318.eval.mjs", 1),
  SUB("TS-318-10-spec", "evals/cap03/TS-318.eval.mjs", 1),
  SUB("TS-318-20-plan", "evals/cap03/TS-318.eval.mjs", 1),
  SUB("TS-213", "evals/cap02/TS-213.eval.mjs", 1, 40),
  SUB("TS-221", "evals/cap02/TS-221.eval.mjs", 1, 40),
  SUB("TS-419", "evals/cap04/TS-419.eval.mjs", 2),
  SUB("TS-420", "evals/cap04/TS-420.eval.mjs", 2),
  SUB("TS-421-agent", "evals/cap04/TS-421.eval.mjs", null),
  SUB("TS-713", "evals/cap07/TS-713.eval.mjs", 2),
  SUB("TS-715", "evals/cap07/TS-715.eval.mjs", 2),
  SUB("TS-815", "evals/cap08/TS-815.eval.mjs", 2),
  SUB("TS-817-stop", "evals/cap08/TS-817.eval.mjs", 2),
  SUB("TS-817-specify", "evals/cap08/TS-817.eval.mjs", 2),
  SUB("INJ-19", INJ, 2),
  // Defect D-030: the table's three D-030 rows in order.
  SUB("TS-223", "evals/cap02/TS-223.eval.mjs", 1),
  SUB("TS-224", "evals/cap02/TS-224.eval.mjs", 1),
  SUB("TS-127", "evals/cap01/TS-127.eval.mjs", 2),
  SUB("TS-201", "evals/cap02/TS-201.eval.mjs", 2),
  SUB("TS-216", "evals/cap02/TS-216.eval.mjs", 2),
  SUB("TS-217", "evals/cap02/TS-217.eval.mjs", 2),
  SUB("TS-218", "evals/cap02/TS-218.eval.mjs", 2),
  SUB("TS-319", "evals/cap03/TS-319.eval.mjs", 2),
  SUB("TS-401", "evals/cap04/TS-401.eval.mjs", 2),
  SUB("TS-418", "evals/cap04/TS-418.eval.mjs", 2),
  SUB("TS-424", "evals/cap04/TS-424.eval.mjs", 2),
  SUB("TS-511", "evals/cap05/TS-511.eval.mjs", 2),
  SUB("TS-515", "evals/cap05/TS-515.eval.mjs", 2),
  SUB("TS-622", "evals/cap06/TS-622.eval.mjs", 2),
  SUB("TS-710", "evals/cap07/TS-710.eval.mjs", 2),
  SUB("TS-712", "evals/cap07/TS-712.eval.mjs", 2),
  SUB("TS-714", "evals/cap07/TS-714.eval.mjs", 2),
  SUB("INJ-17", INJ, 2),
  SUB("INJ-18", INJ, 2),
  SUB("INJ-21", INJ, 2),
  SUB("TS-507", "evals/cap05/TS-507.eval.mjs", 1),
  SUB("TS-508", "evals/cap05/TS-508.eval.mjs", 1),
  SUB("TS-711", "evals/cap07/TS-711.eval.mjs", 1),
  SUB("TS-802", "evals/cap08/TS-802.eval.mjs", 1),
]);

/**
 * The cap exception that matches a row (C002-IF-010 §2.2): row ID, case file, the run's `--host` and the
 * run's auth mode all equal (`auth` null or absent on a host without one), or null. The stop rule takes
 * the cap of a matched row's reserve from it ("Reserve of a cap-exception session").
 */
export function capException({ id, file, host, auth = null }, exceptions = CAP_EXCEPTIONS) {
  return exceptions.find((e) => e.row === id && e.file === file && e.host === host && (e.auth ?? null) === (auth ?? null)) ?? null;
}

const authText = (auth) => (auth ? `auth ${auth}` : "no auth mode");

/**
 * The cap-exception check of one selected row before any session (C002-IF-010 §2.2): `{ caps }` when the
 * row may run, with the caps to pass to the session (`turns` the row's `maxTurns`; `usd` the matching
 * exception's rerun cap under `--cap-exception`, else the row's `maxBudgetUsd`), else `{ refusal }`, the
 * message naming the row's ID, its case file, the host and the auth mode. A row runs when it sets at most
 * 0.50 USD and 30 turns (a value it does not set being the default) or a matching exception's own caps
 * are at least the row's values; under `--cap-exception` only when a matching exception has a rerun cap.
 */
export function capCheck({ id, file, host, auth = null, maxBudgetUsd, maxTurns, capExceptionRun = false }, exceptions = CAP_EXCEPTIONS) {
  const usd = maxBudgetUsd ?? DEFAULT_MAX_BUDGET_USD;
  const turns = maxTurns ?? DEFAULT_MAX_TURNS;
  const where = `row ${id} of ${file} on host ${host} with ${authText(auth)}`;
  const e = capException({ id, file, host, auth }, exceptions);
  const within = usd <= DEFAULT_MAX_BUDGET_USD + EPS && turns <= DEFAULT_MAX_TURNS;
  if (!within && !(e && e.usd + EPS >= usd && e.turns >= turns)) {
    const over = [usd > DEFAULT_MAX_BUDGET_USD + EPS ? `maxBudgetUsd ${usd} USD, above ${DEFAULT_MAX_BUDGET_USD.toFixed(2)} USD` : null, turns > DEFAULT_MAX_TURNS ? `maxTurns ${turns}, above ${DEFAULT_MAX_TURNS}` : null].filter(Boolean).join(" and ");
    return { refusal: `${where} sets ${over}, and no cap exception of C002-IF-010 §2.2 matches its row ID, case file, host and auth mode at those caps` };
  }
  if (capExceptionRun) {
    if (!e || typeof e.rerunUsd !== "number") return { refusal: `${where}: --cap-exception given, but no cap exception of C002-IF-010 §2.2 with a rerun cap matches its row ID, case file, host and auth mode` };
    return { caps: { turns, usd: e.rerunUsd } };
  }
  return { caps: { turns, usd } };
}

/**
 * The refusal message of `capCheck` for one selected row, or null when the row may run (kept for the
 * callers of C002-T-065).
 */
export function capRefusal(row, exceptions = CAP_EXCEPTIONS) {
  return capCheck(row, exceptions).refusal ?? null;
}
