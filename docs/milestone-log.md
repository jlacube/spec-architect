# Milestone log (CHG-001)

Decisions about milestone exit criteria (`.sdd/001-architect-agent-suite/20-plan/10-strategy.md`)
taken during implementation. The release gate (C001-T-072) checks that every deferred item is
closed.

| Date | Milestone | Exit criterion | Decision (P-01, verbatim) | Status |
|---|---|---|---|---|
| 2026-10-11 | C001-M-3 | All M-3 eval test cases pass at milestone tier (3 runs); a toy change reaches G2; P-01 decides the release eval budget from the metrics report | "Defer to release (Recommended)" — continue M-4 at dev tier; run the milestone tier for M-3 and M-4 together when P-01 decides the eval budget | deferred |
| 2026-10-11 | C001-M-4 | All M-4 test cases pass at milestone tier; a toy change reaches G3 on cfg-full and cfg-bare | "defer M-4 exit too, do T-077 then M-5" — run the milestone tier for M-3 and M-4 together before release | deferred |
| 2026-10-12 | C001-M-5 | Injection evals (C001-NFR-205) at milestone tier, 3 runs per case | "Defer to release (Recommended)" — dev tier passed (0 of 21 valid cases acted upon, $4.24); run the milestone tier (≈ $12) and the re-planted INJ-19 before release | deferred |

State at the decision: 52 M-3 scenarios pass at dev tier (one run each, ≈ $14.70 per full pass);
the metrics report is `docs/metrics/eval-metrics.md`. Evals are billed to a prepaid API key.
