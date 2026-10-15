---
id: C002-T-051
title: "Timed clean-profile runs and the OpenCode toy change to G1"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-023, C002-T-039, C002-T-043]
implements: [C002-NFR-601]
satisfies_ac: [C002-AC-204.1, C002-AC-304.1]
verified_by: [C002-TS-205, C002-TS-306]
components: [C002-COMP-003, C002-COMP-004]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-051 — Timed clean-profile runs and the OpenCode toy change to G1

## Intent

Measure, per generated target, the time a P-03 adopter needs on a fresh user profile to reach the first
interview question of a new change by following only the install notes. The limit is 15 minutes,
download time excluded (C002-NFR-601, C002-DOD-019). On OpenCode, the run continues to gate G1 of a
toy change (C002-SC-01, C002-DOD-021). The Copilot G1 run is part of C002-T-050.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/clean-profile-runs.md` | per target: date, versions, timings, transcript link, the toy change's Gate log row |

## Preconditions

- C002-T-023 (tarball installs), C002-T-039 (README) and C002-T-043 (final OpenCode mode) done.

## Step outline (no production code)

1. **P-01 step:** use a fresh Windows user profile with only Node.js and the host installed.
2. Follow `INSTALL.md`. Time each phase from the first install command to the first question.
3. On OpenCode, continue the toy change to G1 and link the transcript.

## Verification

- The record shows ≤ 15 minutes per target and the G1 Gate log row for OpenCode

## Done when

- [ ] Record committed for both targets (OpenCode only if Copilot is deferred)
- [ ] Progress reported: `sdd task set C002-T-051 --status done --commit <sha>`
