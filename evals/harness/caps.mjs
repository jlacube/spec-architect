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
 * Cap exceptions in force (C002-IF-010 §2.2 "Caps above 0.50 USD"; P-01 answer to Q-ts634-budget-01,
 * 2026-10-20, 1.00 USD, raised to 2.00 USD for one run by Q-ts634-budget-02, defect D-022 item 1): a row sets `maxBudgetUsd` above DEFAULT_MAX_BUDGET_USD only where an exception matches its
 * row ID, its case file (repository-relative, `/` separators) and the run's `--host` together, at a cap
 * of at least the row's value (critic CR-68). The harness does not count the exception's runs (§2.2 Runs:
 * the owning task's done-check does, C002-T-056 for TS-634).
 */
export const CAP_EXCEPTIONS = Object.freeze([Object.freeze({ row: "TS-634", file: "evals/targets/gate/TS-634.eval.mjs", host: "opencode", usd: 2.0 })]);

/**
 * The cap exception that matches a row's ID, its case file and the run's host (C002-IF-010 §2.2), or
 * null. The stop rule takes the cap of a matched row's reserve from it ("Reserve of a cap-exception
 * session").
 */
export function capException({ id, file, host }, exceptions = CAP_EXCEPTIONS) {
  return exceptions.find((e) => e.row === id && e.file === file && e.host === host) ?? null;
}

/**
 * The cap-exception check of one selected row before any session: null when the row may run (its cap is
 * at most the default, or an exception matches), else the refusal message naming the row and its case file.
 */
export function capRefusal({ id, file, host, maxBudgetUsd }, exceptions = CAP_EXCEPTIONS) {
  const usd = maxBudgetUsd ?? DEFAULT_MAX_BUDGET_USD;
  if (!(typeof usd === "number" && usd > DEFAULT_MAX_BUDGET_USD + EPS)) return null;
  if (exceptions.some((e) => e.row === id && e.file === file && e.host === host && e.usd + EPS >= usd)) return null;
  return `row ${id} of ${file} sets maxBudgetUsd ${usd} USD, above ${DEFAULT_MAX_BUDGET_USD.toFixed(2)} USD, and no cap exception of C002-IF-010 §2.2 matches its row ID, case file and host ${host}`;
}
