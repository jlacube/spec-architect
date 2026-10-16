---
id: C002-T-057
title: "Timed clean-profile run for the Copilot target"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-023, C002-T-034, C002-T-039]
implements: [C002-NFR-601]
satisfies_ac: [C002-AC-304.1]
verified_by: [C002-TS-306, C002-TC-306, C002-TC-903]
components: [C002-COMP-004]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-057 — Timed clean-profile run for the Copilot target

## Intent

**P-01 executes this task.** Measure the time a P-03 adopter needs on a fresh user profile to reach the
first interview question of a new change in VS Code with GitHub Copilot by following only the install
notes. The limit is 15 minutes, download time excluded (C002-NFR-601, C002-DOD-019). The Copilot G1
run is part of C002-T-050. Split from C002-T-051 so that the OpenCode release does not wait for it.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `docs/releases/clean-profile-runs.md` | the Copilot section: date, versions, timings, transcript or screen-recording link |

## Preconditions

- C002-T-023 (tarball installs), C002-T-034 (target zip) and C002-T-039 (README) done; VS Code and
  Copilot Chat at the S-08 tested versions; REF-WIN set up as `handoff.md` "Reference machine" lists.

## Step outline (no production code)

1. **P-01 step:** use a fresh Windows user profile with only Node.js, VS Code and GitHub Copilot Chat
   installed.
2. **P-01 step:** extract `dist/architect-copilot-<version>.zip` and follow its `INSTALL.md`. Time
   each phase from the first install command to the first question.

## Verification

- The record shows ≤ 15 minutes for Copilot

## Done when

- [ ] Copilot section of the record committed
- [ ] Progress reported: `sdd task set C002-T-057 --status done --commit <sha>`
