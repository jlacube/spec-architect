# Milestone log (CHG-001)

Decisions about milestone exit criteria (`.sdd/001-architect-agent-suite/20-plan/10-strategy.md`)
taken during implementation. The release gate (C001-T-072) checks that every deferred item is
closed.

| Date | Milestone | Exit criterion | Decision (P-01, verbatim) | Status |
|---|---|---|---|---|
| 2026-10-11 | C001-M-3 | All M-3 eval test cases pass at milestone tier (3 runs); a toy change reaches G2; P-01 decides the release eval budget from the metrics report | "Defer to release (Recommended)" — continue M-4 at dev tier; run the milestone tier for M-3 and M-4 together when P-01 decides the eval budget | **closed** (2026-11-07): eval test cases by the release runs (`docs/release-0.1.0-evidence.md` §4.7); toy change to G2 by CHG-002 (G2 2026-10-15, current); budget by Q-release-tier-01 (C001-ADR-003 revision 2026-10-23). Evidence §5 |
| 2026-10-11 | C001-M-4 | All M-4 test cases pass at milestone tier; a toy change reaches G3 on cfg-full and cfg-bare | "defer M-4 exit too, do T-077 then M-5" — run the milestone tier for M-3 and M-4 together before release | **closed** (2026-11-08): test cases closed by the release runs (evidence §4.7); the toy change "Warn on zero-total invoices" reached G3 (plan approved) on **cfg-full** in 16 chained sessions, 58.17 USD notional (`evals/toy/toy-g3.eval.mjs`, `evals/toy/chain.mjs`; ripwire 41 and Serena 26 calls). **cfg-bare deferred** to the follow-up change "Cost and token efficiency" (P-01 Q-toy-g3-limit-01, D-028). The chain found the lint bug **D-029** (LINT-ARCH-001 blocked G2 of every lite spec with a component catalogue; fixed in 7fc66b5). Evidence §5 |
| 2026-10-12 | C001-M-5 | Injection evals (C001-NFR-205) at milestone tier, 3 runs per case | "Defer to release (Recommended)" — dev tier passed (0 of 21 valid cases acted upon, $4.24); run the milestone tier (≈ $12) and the re-planted INJ-19 before release | **closed** (2026-10-30): the release injection suite, 5 runs per case, 110 valid runs, 0 acted upon, INJ-19 5 / 5 (evidence §4.4, §5) |

State at the decision: 52 M-3 scenarios pass at dev tier (one run each, ≈ $14.70 per full pass);
the metrics report is `docs/metrics/eval-metrics.md`. Evals are billed to a prepaid API key.

## CHG-002 milestones (`.sdd/002-multi-platform-targets/20-plan/10-strategy.md`)

| Date | Milestone | Exit criterion | Decision (P-01, verbatim) | Status |
|---|---|---|---|---|
| 2026-10-18 | C002-M-02 | npm test green incl. regression set §3 and the waiver-aware lint loop (C002-T-053); bench guard p95 ≤ 300 ms; CHG-001 D-011 closed; npm run package without targets/; the 5 E-CC sessions of C002-T-010 step 5 pass; sdd install deny cases pass (C002-T-059) | met: npm run check green at cd5c2dc; bench guard p95 132 ms (lint-quick 314 ms, session-start 291 ms, faults pass); D-011 closed with C002-T-008 (3997daf); plugin zip has 0 targets/ entries; T-010 evals on Claude Max all pass (TS-537-init on the one allowed rerun); BG-420…435 pass | passed |
