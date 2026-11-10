---
id: C002-T-057
title: "Timed clean-profile run for the Copilot target"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-023, C002-T-034, C002-T-039, C002-T-058, C002-T-071, C002-T-076]
implements: [C002-NFR-601]
satisfies_ac: [C002-AC-304.1]
verified_by: [C002-TS-306, C002-TC-306, C002-TC-903]
components: [C002-COMP-004]
risk_refs: [C002-RISK-031]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-057 — Timed clean-profile run for the Copilot target

## Intent

**P-01 executes this task.** Measure the time a P-03 adopter needs in an isolated VS Code profile
(C002-SPEC-NFR; defect D-048, P-01's instruction of 2026-11-10 "go ahead with the T-057 revision"), not a
fresh Windows user profile, which REF-WIN cannot provide, to reach the first interview question of a new change in VS Code at the tested version of scope §3.1 (VS Code
1.145.2 with Copilot Chat 0.73.0 since revision D-047; S-08 ran on Insiders 1.142) with GitHub
Copilot by following only the install notes, which now include `sdd install copilot` in the
repository, the Local session type with `sdd-conductor` selected, and a first plain message before
the workspace MCP servers start (C002-REQ-304). The limit is 15 minutes, download time excluded
(C002-NFR-601, C002-DOD-019). The Copilot G1 run is part of C002-T-050. Split from C002-T-051 so that
the OpenCode release does not wait for it.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `docs/releases/clean-profile-runs.md` | the Copilot section: date, versions, timings, transcript or screen-recording link |
| add | `scripts/manual/isolated-vscode-profile.ps1` | the set-up of the isolated VS Code profile (C002-SPEC-NFR, D-048); written and checked by the conductor before P-01's run |
| modify | `docs/runsheets/T-057-copilot-clean-profile.md` | prerequisites and set-up in the isolated VS Code profile instead of a fresh Windows user profile (D-048) |

## Preconditions

- C002-T-071 done (P-01 answer to Q-release-base-01; plan critic CR-71): the run uses
  `dist/architect-copilot-<version>.zip` built at the release-candidate commit with the CHG-001
  fixes, at **package version 0.1.0** (defect D-041; P-01 answer to Q-copilot-010-01, "Ship 0.1.0
  on both hosts (Recommended)"). The release-candidate commit is **9eb56c0** (revision D-047 moved
  it from b481e82, the one **C002-T-076** records, which replaces C002-T-071's); C002-T-076 done first. The files are
  `dist/architect-copilot-0.1.0.zip` and `dist/architect-sdd-0.1.0.tgz`, as the runsheet
  `docs/runsheets/T-057-copilot-clean-profile.md` names them. The 0.0.3 packages of revision D-036
  (C002-T-074) are not released.
- C002-T-023 (tarball installs), C002-T-034 (target zip), C002-T-039 (README) and C002-T-058 (install
  command) done; VS Code and Copilot Chat at the tested versions of scope §3.1 (VS Code 1.145.2, Copilot Chat
  0.73.0 built in; revision D-047); REF-WIN set up as
  `handoff.md` "Reference machine" lists.
- The Copilot subscription named in C002-T-002 has allowance for the 1 VS Code session of step 2
  (test plan §4.2, C002-RISK-026); it is not billed to the prepaid API key.

## Step outline (no production code)

1. **P-01 step:** in a new PowerShell 7 window, dot-source `scripts/manual/isolated-vscode-profile.ps1`
   on a new empty folder (the isolated VS Code profile of C002-SPEC-NFR; defect D-048), start VS Code
   with that window's `code`, sign in to GitHub in it and set the git identity, all before the timer,
   and make a fresh git repository inside the profile folder. The script's caveat (machine-wide Node,
   VS Code build, an `architect-sdd` installed globally before) is stated in the record.
2. **P-01 step:** extract `dist/architect-copilot-<version>.zip` and follow its `INSTALL.md`. Time
   each phase from the first install command to the first question, the `sdd install copilot` step
   timed on its own.

## Verification

- The record shows ≤ 15 minutes for Copilot, run in an isolated VS Code profile
- Before P-01's run, the conductor checks the set-up script on a throwaway folder: the instance it
  starts lists no Marketplace extension, has no GitHub sign-in, and `sdd host-version vscode` in its
  window prints the tested versions (D-048 close rule)

## Done when

- [ ] Copilot section of the record committed
- [ ] Progress reported: `sdd task set C002-T-057 --status done --commit <sha>`
