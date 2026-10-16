---
id: C002-T-051
title: "Timed clean-profile run for OpenCode and the OpenCode toy change to G1"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-023, C002-T-034, C002-T-039, C002-T-043]
implements: [C002-NFR-601]
satisfies_ac: [C002-AC-204.1]
verified_by: [C002-TS-205, C002-TC-205, C002-TC-902]
components: [C002-COMP-003]
risk_refs: [C002-RISK-015]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-051 — Timed clean-profile run for OpenCode and the OpenCode toy change to G1

## Intent

**P-01 executes this task.** Measure the time a P-03 adopter needs on a fresh user profile to reach the
first interview question of a new change on OpenCode by following only the install notes. The limit
is 15 minutes, download time excluded (C002-NFR-601, C002-DOD-019). The run continues to gate G1 of a
toy change (C002-SC-01, C002-DOD-021). The Copilot run is C002-T-057, so the OpenCode release does
not wait for it.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/clean-profile-runs.md` | the OpenCode section: date, versions, timings, transcript link, the toy change's Gate log row (C002-T-057 adds the Copilot section) |
| modify | `evals/results/spend-chg002.json` | the spend of step 3, pool `reserve`, read from the provider's usage view |

## Preconditions

- C002-T-023 (tarball installs), C002-T-034 (target zip), C002-T-039 (README) and C002-T-043 (final
  OpenCode mode) done.
- REF-WIN set up as `handoff.md` "Reference machine" lists.
- **Before step 3:** the reserve's stop rule of test plan §4.1 allows the run. The model calls of the
  run bill the prepaid API key through the provider of the S-07 record and are paid from the
  C002-M-07 reserve (Q-evalbudget-04, `questions-log.md` round 5). While C002-T-048 step 4 or
  C002-T-049 step 3 has not run, its test plan §4.2 estimate counts as already spent in this check, so
  the release evidence keeps its share of the reserve.

## Step outline (no production code)

1. **P-01 step:** use a fresh Windows user profile with only Node.js and OpenCode at its tested
   version installed.
2. **P-01 step:** extract `dist/architect-opencode-<version>.zip` and follow its `INSTALL.md`. Time
   each phase from the first install command to the first question.
3. **P-01 step — paid, reserve (about 4 agent sessions on E-OCE, test plan §4.2):** continue the toy
   change to G1 and link the transcript. The run is driven by hand, outside the harness caps of
   C002-T-044: P-01 reads the provider's usage view at each interview round and at the gate, and
   before each interview round and before the gate checks the reserve condition of the stop rule (test
   plan §4.1): reserve total + the outstanding estimates of C002-T-048 step 4 and C002-T-049 step 3 (a
   step in progress counts its estimate minus its spend so far, not below 0) + the run's spend so far
   + H ≤ 10 USD; otherwise the run pauses and P-01 decides. After the run, its spend goes into the
   ledger (one entry, pool `reserve`, with the usage reading and the session count), before any other
   paid session starts; H for later sessions is that entry's spend divided by its session count. A failed run is repeated only after the stop rule allows it again.

## Verification

- The record shows ≤ 15 minutes for OpenCode and the G1 Gate log row of the toy change
- The ledger holds the step 3 entry in the reserve pool

## Done when

- [ ] OpenCode section of the record committed
- [ ] The spend of step 3 is in the ledger, within the reserve
- [ ] Progress reported: `sdd task set C002-T-051 --status done --commit <sha>`
