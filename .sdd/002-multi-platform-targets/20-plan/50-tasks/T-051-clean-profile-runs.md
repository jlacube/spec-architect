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
risk_refs: []
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

## Preconditions

- C002-T-023 (tarball installs), C002-T-034 (target zip), C002-T-039 (README) and C002-T-043 (final
  OpenCode mode) done.
- REF-WIN set up as `handoff.md` "Reference machine" lists.

## Step outline (no production code)

1. **P-01 step:** use a fresh Windows user profile with only Node.js and OpenCode at its tested
   version installed.
2. **P-01 step:** extract `dist/architect-opencode-<version>.zip` and follow its `INSTALL.md`. Time
   each phase from the first install command to the first question.
3. **P-01 step:** continue the toy change to G1 and link the transcript.

## Verification

- The record shows ≤ 15 minutes for OpenCode and the G1 Gate log row of the toy change

## Done when

- [ ] OpenCode section of the record committed
- [ ] Progress reported: `sdd task set C002-T-051 --status done --commit <sha>`
