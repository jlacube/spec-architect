---
id: C002-T-071
title: "Release evidence retaken at a release-candidate commit with the CHG-001 fixes, at package version 0.0.2"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: in-progress
depends_on: [C002-T-049, C002-T-054, C002-T-068, C002-T-069, C002-T-070, C002-T-073]
implements: [C002-REQ-606, C002-REQ-609, C002-REQ-612, C002-REQ-617]
satisfies_ac: [C002-AC-606.1, C002-AC-609.1, C002-AC-612.1, C002-AC-617.1]
verified_by: [C002-TS-612, C002-TS-615, C002-TS-620, C002-TC-612, C002-TC-615, C002-TC-620]
components: [C002-COMP-008, C002-COMP-009, C002-COMP-010]
risk_refs: [C002-RISK-015, C002-RISK-026, C002-RISK-036]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-071 — Release evidence retaken at a release-candidate commit with the CHG-001 fixes, at package version 0.0.2

## Intent

The CHG-001 fixes of C001-T-082 and C001-T-083 change agent, skill and command files of
`plugins/architect/`, from which both target packages are generated. The release evidence of
C002-T-049 (OpenCode) and C002-T-054 (Copilot) was taken at an older release-candidate commit, and a
release made from it would ship packages without those fixes (plan critic CR-71). P-01 answered
Q-release-base-01 with "Retake after fixes (Recommended)" (`../questions-log.md`).

**First run at 0.0.1** (commit c63e702, at release candidate da7bd14). The unpaid steps passed, and
the replays showed 0 differing decisions on the release mechanism. 29 OpenCode sessions passed, at
5.25 USD from the general pool. `INJ-21` ended at the 0.50 USD cap with every assertion passed, so
its entry is acted upon and final for 0.0.1, and the OpenCode 0.0.1 release check refuses
(ERR-REL-002; defect D-035). The Copilot paid rows did not run.

**Revision D-035** (P-01 answer to Q-inj21-01, "0.0.2 + cap for INJ-21 (Recommended)"). C002-T-073
gives `INJ-21` on OpenCode a session cap of 1.00 USD and moves the packages to version **0.0.2**. A
new version starts new injection summaries. So this task now retakes both targets' paid evidence at
0.0.2, after C002-T-073:
- the whole OpenCode case set, 30 rows, `INJ-21` at 1.00 USD and `INJ-22` included;
- the 24 Copilot CLI rows.

The 0.0.1 sessions and their summaries stay as they are, as evidence of 0.0.1.

C002-T-049 and C002-T-054 are done and are not reopened; this task carries their step-4 re-runs,
owned by the conductor. C002-T-052, C002-T-055, C002-T-050 and C002-T-057 wait for it.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/opencode/0.0.2/` replay reports | the replay reports of every OpenCode mechanism in use at the new release-candidate commit (C002-T-049 step 2) |
| add | `docs/releases/opencode/0.0.2/injection.json` | written by `run.mjs` from the 0.0.2 `INJ-*` sessions, a new file (C002-IF-010 §5.2). The 0.0.1 summary is unchanged |
| add | `docs/releases/copilot/0.0.2/` replay reports and `injection.json` | the replay reports of every Copilot mechanism in use (C002-T-054 step 2), and the Copilot injection summary of the 0.0.2 Copilot CLI sessions, `TS-359` included |
| add | `evals/results/t071-*` result files and their ledger entries | the paid OpenCode sessions of step 4 and the Copilot CLI sessions of step 5 |

## Preconditions

- **Cross-change:** C001-T-082 and C001-T-083 done (CHG-001), so the release-candidate commit holds
  every CHG-001 fix of D-018 and D-019. The conductor confirms both with `sdd status` before step 1.
  The edge lives on the CHG-002 side only, since the CHG-001 plan is approved (`../handoff.md`).
- C002-T-068 … C002-T-070 done: C001-T-082 step 4 needs them, and the retake follows C001-T-082.
  C002-T-067 is done too, and its commit is part of the new release candidate, but it is no
  dependency of the release chain (P-01 answer to Q-t067-order-01, "No dependency").
- **C002-T-073 done:** the `INJ-21` session cap and version 0.0.2. Its commit is part of the release
  candidate.
- **Pools** (test plan §4.1 Budget, rules 1 … 5).
  - **Need:** about 5.85 USD for the 30 OpenCode sessions (5.25 USD measured for 29 at 0.0.1, plus
    `INJ-21` at about 0.57 USD and at most 1.00 USD), and 1.40 USD kept for C002-T-051 step 3. That is within the 40 USD
    total, since the two OpenRouter pools have about 5.55 + 4.64 = 10.19 USD left.
  - **General pool:** about 5.55 USD left. The stop rule lets a session start only if T + H ≤ 30,
    with H at least 0.65 USD, or 1.65 USD for `INJ-21`. So the general pool holds about 4.9 USD of
    sessions.
  - **Reserve:** the sessions that the general pool's stop rule refuses run from the OpenCode
    release reserve (about 4.64 USD left), under its own stop rule (L = 10). It keeps C002-T-051
    step 3's estimate of 1.40 USD in T (rule 2), so the reserve holds about 2.6 USD of sessions,
    enough for the remaining 1 … 1.5 USD. The reserve was ring-fenced for exactly this kind of session, the OpenCode
    release evidence of C002-T-049 step 3 and C002-T-051 step 3 (Q-evalbudget-04). This retake is
    the C002-T-049 step 3 evidence of the version that ships, so it may draw on the reserve once the
    general pool stops. [ASSUMPTION: Q-pool-retake-01 — P-01 confirms the reserve for the rows that
    the general pool cannot hold; rule 5 of test plan §4.1 otherwise keeps re-runs out of the reserve]
  - **Copilot pool:** the 24 Copilot CLI sessions, about 3.4 USD, under rule 8.
- REF-WIN with the tested hosts (OpenCode 1.18.31; VS Code Insiders 1.142.0-insider and Copilot CLI
  1.0.98), Node.js 22.22.2 or later, PowerShell 7 and Git Bash, and Developer Mode on.

## Step outline (no production code)

1. **Release-candidate commit.** Record the commit that holds the CHG-001 fixes, C002-T-073 and every
   other CHG-002 change as the new release-candidate commit. Check that `plugin.json` there gives
   **0.0.2**. Every injection row of both hosts runs at this version (C002-IF-010 §5.2; C002-T-054
   step 4).
2. **Shared unpaid steps.** C002-T-048 step 5 at that commit (the regression set), then `npm run
   package` and the target structure check.
3. **OpenCode unpaid steps.** C002-T-049 steps 1 and 2 at that commit: package, tarball check, and the
   OpenCode replay under both shells. Release replays are on `win32` only, with 0 differing decisions
   (C002-DOD-008).
4. **OpenCode paid rows at 0.0.2** (P-01 answers to Q-release-base-01 and Q-inj21-01; C002-T-049
   step 4 rule; owning step of `../10-strategy.md` §3a).
   - **Rows:** the OpenCode case set of C002-IF-010 §5.1, as C002-T-049 step 3 names it: the eight
     routing rows `TS-206` … `TS-212` and `TS-222`, and `INJ-01` … `INJ-22`. That is 30 sessions,
     with one rerun after a failure of a routing row. `INJ-21` runs at its 1.00 USD session cap,
     which the harness applies without `--cap-exception`; its result record gives `caps.usd` 1.00.
   - **Pools and stop rule:** the general pool first, then the reserve for the rows that the general
     pool's stop rule refuses (Preconditions, Pools). Check the ledger before every session by the
     stop rule. At a stop of both pools, the runs pause and P-01 is asked.
   - **Results:** label the result files `t071`. `run.mjs` writes the new
     `docs/releases/opencode/0.0.2/injection.json`.
   - **Failures:** a row whose session does not pass is a defect of the owning task (reopen it),
     never fixed in the evidence. An injection entry that reads acted upon is final for 0.0.2, and a
     fix ships under a new version (test plan §4.1). An injection row that ends at a cap again goes
     to P-01 before any rerun (C002-IF-010 §2.2 Caps of injection rows).
5. **Copilot evidence at 0.0.2** (plan critic CR-71; P-01 answer to Q-inj21-01, "retake both
   targets' paid evidence").
   - **Unpaid:** C002-T-054 steps 1 and 2 at the new commit: package, and the replay of every
     Copilot mechanism in use under both shells, with 0 differing decisions.
   - **Paid:** the Copilot CLI case set of C002-T-054 step 3, 24 sessions, Copilot pool, about
     3.4 USD, with `--copilot-model claude-opus-5.5=claude-sonnet-5.5`, under rule 8.
     `docs/releases/copilot/0.0.2/injection.json` is written from them. `INJ-21` keeps 0.50 USD there
     (it ran at 0.107 USD), so it gets no exception (C002-IF-010 §2.2 Caps of injection rows).
   - **Manual:** the VS Code checklist run (C002-T-050) and the Copilot clean-profile run
     (C002-T-057) wait for this task, so P-01 takes them on the 0.0.2 package.
6. **Report.** The task report gives the release-candidate commit and the version 0.0.2, the
   regression-set result, the replay reports of both targets, and every paid session with its ledger
   entry, pool and the pool totals after it. For each target it gives the 0.0.2 injection summary:
   entry count and acted upon. C002-T-052 and C002-T-055 then run their release checks at this commit
   and version.

## Verification

- `npm run package`, `npm run check`, `npm run replay -- suite` (both shells), C002-T-048 step 5
- `node evals/harness/run.mjs --host opencode --tier dev --label t071 <the OpenCode case set>` under the stop rule, general pool then reserve
- `node evals/harness/run.mjs --host copilot-cli --tier dev --label t071 --copilot-model claude-opus-5.5=claude-sonnet-5.5 <the Copilot CLI case set>`
- `node scripts/release-check.mjs --target opencode --dry-run` and `--target copilot --dry-run` at the new commit

## Done when

- [ ] The release-candidate commit holds the fixes of C001-T-082 and C001-T-083, C002-T-073 and every other CHG-002 change, at package version 0.0.2; the report names both
- [ ] C002-T-048 step 5, C002-T-049 steps 1 and 2 and C002-T-054 steps 1 and 2 re-ran at that commit, with 0 differing decisions in the release replays
- [ ] The 30 OpenCode rows ran at 0.0.2 (`INJ-21` at 1.00 USD) under the stop rule, from the general pool and then the reserve, every session in the ledger, and the OpenRouter total within 40 USD; `docs/releases/opencode/0.0.2/injection.json` holds `INJ-01` … `INJ-22`
- [ ] The 24 Copilot CLI rows ran at 0.0.2 from the Copilot pool, and `docs/releases/copilot/0.0.2/injection.json` holds the Copilot CLI injection case set
- [ ] The release-check dry runs of both targets are reported at that commit, OpenCode giving `released`
- [ ] Progress reported: `sdd task set C002-T-071 --status done --commit <sha>`
