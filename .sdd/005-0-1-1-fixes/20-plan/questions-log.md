---
id: "C005-PLAN-QLOG"
artifact: plan/questions-log
change: "CHG-005"
phase: 20-plan
status: draft
---
# CHG-005 — Questions log (20-plan)

## Round 1 — 2026-11-17

### Q-adr001-01 — Accept C005-ADR-001: the new-change procedure lives in phase-ideation?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 5 (C005-ADR-001 options analysis)
- **Why it matters:** decides where the shared new-change procedure lives (C005-CON-06, C001-CON-15), the conductor's size budget and which tests move.
- **Options:**
  1. Accept phase-ideation (Recommended) — 4.45; already preloaded; no change to C001-IF-09; no pinned lines; +2,500–3,500 characters on the conductor's 64,000 Copilot budget.
  2. interview-protocol instead — 3.65; preloaded, but line 126 is pinned and the procedure is not an interview rule.
- **Rejected:** gate-protocol — 3.25; a new skill — 3.20, changes C001-IF-09 (spec revision); sdd-conventions — 2.65, reaches all ten agents.
- **Sources:** `20-plan/20-decisions/ADR-001-new-change-skill.md`
- **Answer:** Accept phase-ideation (Recommended)
- **Extracted instructions:** none

### Q-budget-01 — What budget do the eval runs of the CHG-005 agent-behaviour scenarios get?
- **Blocking:** no · **Material:** no (spend; P-01's decision)
- **Why it matters:** 25 Claude Code eval scenarios, 28 sessions per run; the eval tasks and the DOD-G-01 release ADR depend on it.
- **Options:**
  1. DOD-G-01 floor (Recommended) — about 112 sessions (one dev run plus 3 runs each), roughly 30–60 USD; no waiver; a release ADR picks high-risk scenarios for 10 runs (+7 sessions each).
  2. Floor on main cases only — 3 runs for the D-032/D-034 main cases, one dev run for the rest; roughly 15–30 USD; DOD-G-01 waiver needed.
  3. Dev runs only, waive floor — about 28 sessions, 7–15 USD; DOD-G-01 waiver needed.
- **Sources:** DOD-G-01, C001-ADR-003, C005-DOD-001, ideation §11; architect hand-back (step 2)
- **Answer:** DOD-G-01 floor (Recommended)
- **Extracted instructions:** none

## Round 2 — 2026-11-17

### Q-budget-02 — Do one-run regression checks of the 11 existing evals near the edited text count against the Q-budget-01 envelope?
- **Blocking:** no · **Material:** no
- **Why it matters:** C005-T-014 and C005-T-015 plan one run each inside the envelope; toy-g3 (G1 to G3) is the most expensive.
- **Options:**
  1. All 11, one run each (Recommended) — catches regressions in the moved procedure and the edited text; the stop-and-ask rule caps spend.
  2. All but toy-g3 — saves the most expensive run.
  3. No regression runs — lowest spend.
- **Sources:** Q-budget-01, C005-T-014, C005-T-015 (planner hand-back)
- **Answer:** All 11, one run each (Recommended)
- **Extracted instructions:** none

### Q-waiver-01 — Where is P-01's DOD-G-01 waiver for C005-TS-156 recorded?
- **Blocking:** no · **Material:** no
- **Why it matters:** the CLI records waivers only with `gate approve --waive`; C005-DOD-001 has P-01 decide at close, when no gate follows.
- **Options:**
  1. Evidence file at close (Recommended) — `docs/release-0.1.1-evidence.md` at close (C005-T-022); not among change.md waivers.
  2. Also --waive at G3 re-approval — CLI record at C005-T-002, earlier than C005-DOD-001's close.
- **Sources:** C005-DOD-001, C005-T-002, C005-T-022
- **Answer:** Evidence file at close (Recommended)
- **Extracted instructions:** none

## Round 3 — 2026-11-17

### Q-riskclass-01 — Accept C005-ADR-002: C005-TS-108 and C005-TS-109 high-risk (10 runs, ≥ 9 passes), the other 23 Claude Code eval scenarios standard (3 of 3)?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 5 (C005-ADR-002 options analysis)
- **Why it matters:** sets the DOD-G-01 run count and pass rule of the 28 cases of C005-T-014 and C005-T-015 (126 planned sessions).
- **Options:**
  1. Accept rule A (Recommended) — 4.45; C001-ADR-003 rule unchanged; about 4.20 USD more than the plain floor.
  2. Rule B: add decline cases — 4.25; also C005-TS-104 and C005-TS-174; about 3.50 USD more.
- **Rejected:** Main cases of D-032 and D-034 — 3.00; Test-designer's four — 2.55; None high-risk — 2.80.
- **Sources:** `20-plan/20-decisions/ADR-002-eval-risk-classes.md`, DOD-G-01, C001-ADR-003, Q-budget-01
- **Answer:** Accept rule A (Recommended)
- **Extracted instructions:** none

### Q-budget-03 — Does the one regression run of `evals/toy/toy-g3.eval.mjs` mean its first session only or the whole chain to G3?
- **Blocking:** no · **Material:** no
- **Why it matters:** the whole chain cost 58.17 USD notional in 0.1.0, putting the expected total at about 106 USD against the 60 USD upper bound of Q-budget-01.
- **Options:**
  1. First session only (Recommended) — the `/architect:new` session (0.27 USD in 0.1.0) exercises the moved procedure; total about 48.50 USD.
  2. Whole chain, raise budget — end-to-end run, about 58 USD more (about 106 USD total).
- **Sources:** Q-budget-01, Q-budget-02, C005-T-014, C005-ADR-002
- **Answer:** First session only (Recommended)
- **Extracted instructions:** none

## Round 4 — 2026-11-17

### Q-injection-01 — How should CHG-005 meet the 0.1.1 Copilot release check's injection summary?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 4 (critic, CR-27)
- **Why it matters:** without `docs/releases/copilot/0.1.1/injection.json` (≥ 20 cases) the release check refuses (ERR-REL-009); C005-T-021 cannot release the Copilot package and C005-REQ-118 fails.
- **Options:**
  1. Run injection suite (Recommended) — the 0.1.0 suite (23 cases, Copilot CLI at the S-08 tested version) in C005-T-018, with a per-run cap and a stop rule.
  2. Drop Copilot from 0.1.1 — spec revision and new G2; Copilot VS Code users keep the 0.1.0 faults.
- **Rejected:** Reuse the 0.1.0 injection summary — evidence not produced for 0.1.1; Switch to copilot-hooks mode — architecture change outside this change.
- **Sources:** C005-REQ-118, C005-T-018, C005-T-021, C005-RISK-012, 90-critic-report.md CR-27
- **Answer:** Run injection suite (Recommended)
- **Extracted instructions:** none

### Q-copilot-cost-01 — What spending limit applies to the injection suite's Copilot CLI usage?
- **Blocking:** no · **Material:** no (spend; P-01's decision)
- **Why it matters:** the run consumes Copilot CLI usage; no CHG-005 budget covered it.
- **Options:**
  1. Monthly credits, then ask (Recommended) — stop and ask before any overage.
  2. Up to the 50€ overage — may continue into P-01's existing 50€ Copilot overage allowance without asking.
- **Sources:** 90-critic-report.md CR-27
- **Answer:** Up to the 50€ overage
- **Extracted instructions:** none

## Round 5 — 2026-11-17

### Q-specnav-01 — How should the two leftovers in the approved spec be handled (F5 lists omit C005-TS-173/174; addendum scope sentence says four topics)?
- **Blocking:** no · **Material:** no
- **Why it matters:** a spec defect would need a 10-spec revision before the C005-T-002 re-approval; accepted, nothing changes.
- **Options:**
  1. Accept as navigation text (Recommended) — behaviour unaffected; the plan maps both scenarios; the hand-off flags the gap.
  2. Record a spec defect — keeps the lists complete; needs a 10-spec revision and G2 first.
- **Sources:** 90-critic-report.md CR-37, C005-T-002 (planner hand-back)
- **Answer:** Accept as navigation text (Recommended)
- **Extracted instructions:** none
