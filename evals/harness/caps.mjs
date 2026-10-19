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
