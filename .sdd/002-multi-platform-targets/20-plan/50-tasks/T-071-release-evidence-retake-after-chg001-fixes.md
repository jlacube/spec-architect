---
id: C002-T-071
title: "Release evidence retaken at a release-candidate commit with the CHG-001 fixes"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-049, C002-T-054, C002-T-068, C002-T-069, C002-T-070]
implements: [C002-REQ-606, C002-REQ-609, C002-REQ-612, C002-REQ-617]
satisfies_ac: [C002-AC-606.1, C002-AC-609.1, C002-AC-612.1, C002-AC-617.1]
verified_by: [C002-TS-612, C002-TS-615, C002-TS-620, C002-TC-612, C002-TC-615, C002-TC-620]
components: [C002-COMP-008, C002-COMP-009, C002-COMP-010]
risk_refs: [C002-RISK-015, C002-RISK-026, C002-RISK-036]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-071 — Release evidence retaken at a release-candidate commit with the CHG-001 fixes

## Intent

The CHG-001 fixes of C001-T-082 and C001-T-083 change agent, skill and command files of
`plugins/architect/`, from which both target packages are generated. The release evidence of
C002-T-049 (OpenCode) and C002-T-054 (Copilot) was taken at an older release-candidate commit. A
release made from it would ship packages without those fixes (plan critic CR-71).

P-01 answered Q-release-base-01 with "Retake after fixes (Recommended)" (`../questions-log.md`).
CHG-002 releases from a commit that holds all the CHG-001 fixes. Before P-01 runs C002-T-052, the
conductor re-runs the unpaid release steps and the paid OpenCode rows of C002-T-049 step 4 from the
general pool, about 31 sessions and about 5.40 USD of OpenRouter spend.

C002-T-049 and C002-T-054 are done and are not reopened. This task carries out their step 4 re-runs
at the new commit, owned by the conductor. C002-T-052, C002-T-055, C002-T-050 and C002-T-057 wait for
it.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/opencode/<version>/` replay reports | the replay reports of every OpenCode mechanism in use, regenerated at the new release-candidate commit (C002-T-049 step 2) |
| modify | `docs/releases/opencode/<version>/injection.json` | merged by `run.mjs` from the re-run `INJ-*` sessions (C002-IF-010 §5.2): a passing entry is replaced by the new session's entry; an entry acted upon stays final for the version. At a new version, the summary is a new file |
| add | `docs/releases/copilot/<version>/` replay reports | the replay reports of every Copilot mechanism in use, regenerated at the new commit (C002-T-054 step 2) |
| add | `evals/results/t071-*` result files and their ledger entries | the paid OpenCode sessions of step 4, general pool, and the Copilot CLI sessions of step 5 only under P-01's decision there |

## Preconditions

- **Cross-change:** C001-T-082 and C001-T-083 done (CHG-001), so the release-candidate commit holds
  every CHG-001 fix of D-018 and D-019. The conductor confirms both with `sdd status` before step 1.
  The edge lives on the CHG-002 side only, since the CHG-001 plan is approved (`../handoff.md`).
- C002-T-068 … C002-T-070 done: C001-T-082 step 4 needs them, and the retake follows C001-T-082.
  C002-T-067 is done too, and its commit is part of the new release candidate, but it is no
  dependency of the release chain (P-01 answer to Q-t067-order-01, "No dependency").
- The OpenRouter general pool has room for about 5.40 USD plus its reserve H (test plan §4.1 rules 1
  … 4 and rule 5, re-runs after a fix from the general pool, never from the reserve).
- REF-WIN with the tested hosts (OpenCode 1.18.31; VS Code Insiders 1.142.0-insider and Copilot CLI
  1.0.98), Node.js 22.22.2 or later, PowerShell 7 and Git Bash, and Developer Mode on.

## Step outline (no production code)

1. **Release-candidate commit.** Record the commit that holds the CHG-001 fixes and every CHG-002
   change as the new release-candidate commit, and the package version of
   `plugins/architect/.claude-plugin/plugin.json` there. If P-01 moves to a new version, every
   injection row of both hosts runs again at it (C002-IF-010 §5.2; C002-T-054 step 4).
2. **Shared unpaid steps.** C002-T-048 step 5 at that commit (the regression set), then `npm run
   package` and the target structure check.
3. **OpenCode unpaid steps.** C002-T-049 steps 1 and 2 at that commit: package, tarball check and the
   OpenCode replay under both shells. Release replays are on `win32` only, with 0 differing decisions
   (C002-DOD-008).
4. **OpenCode paid rows** (P-01 answer to Q-release-base-01; C002-T-049 step 4 rule; test plan §4.1
   rule 5; owning step of `../10-strategy.md` §3a). This is the OpenCode case set of C002-IF-010
   §5.1, as C002-T-049 step 3 names it: the eight routing rows `TS-206` … `TS-212` and `TS-222`, and
   `INJ-01` … `INJ-22`. That is 30 sessions, with one rerun after a failure, so about 31 and about
   5.40 USD, from the **general pool**, never the reserve.
   - Check the ledger before every session by the stop rule. At the stop, the runs pause and P-01 is
     asked.
   - Label the result files `t071`. `run.mjs` merges the injection summary (C002-IF-010 §5.2).
   - A row whose session does not pass is a defect of the owning task (reopen it), never fixed in
     the evidence. An injection entry that reads acted upon is final for the version, and a fix
     ships under a new version (test plan §4.1).
5. **Copilot evidence for C002-T-055** (plan critic CR-71).
   - **Unpaid:** C002-T-054 steps 1 and 2 at the new commit: package and the replay of every Copilot
     mechanism in use under both shells, with 0 differing decisions.
   - **Paid:** the Copilot CLI case set of C002-T-054 step 3 is 24 sessions, Copilot pool, about
     3.4 USD, with `--copilot-model claude-opus-5.5=claude-sonnet-5.5`. Q-release-base-01 covers the
     OpenCode rows only, so these sessions run only after P-01 decides it. The conductor asks P-01
     before this step. Until P-01 answers, C002-T-055 does not start; the OpenCode release does not
     wait for it.
   - **Manual:** the VS Code checklist run (C002-T-050) and the Copilot clean-profile run
     (C002-T-057) have not run yet. They wait for this task, so P-01 takes them on the fixed package.
6. **Report.** The task report gives the new release-candidate commit and the package version, the
   regression-set result, the replay reports of both targets, the paid sessions with their ledger
   entries and pool totals, and the merged OpenCode injection summary: entry count, acted upon, and
   the entries this run replaced. For Copilot it gives P-01's decision on the paid rows and, when
   they ran, the same for the Copilot summary. C002-T-052 and C002-T-055 then run their release
   checks at this commit.

## Verification

- `npm run package`, `npm run check`, `npm run replay -- suite` (both shells), C002-T-048 step 5
- `node evals/harness/run.mjs --host opencode --tier dev --label t071 <the OpenCode case set>` under the stop rule
- `node scripts/release-check.mjs --target opencode --dry-run` and `--target copilot --dry-run` at the new commit

## Done when

- [ ] The new release-candidate commit holds the fixes of C001-T-082 and C001-T-083 and every CHG-002 change; the report names it and the package version
- [ ] C002-T-048 step 5, C002-T-049 steps 1 and 2 and C002-T-054 steps 1 and 2 re-ran at that commit, with 0 differing decisions in the release replays
- [ ] The OpenCode case set ran from the general pool under the stop rule (about 31 sessions, about 5.40 USD), every session in the ledger, and the OpenCode injection summary merged with every row `INJ-01` … `INJ-22` present
- [ ] P-01 decided on the paid Copilot CLI rows, and they ran when P-01 said so
- [ ] The OpenCode release-check dry run gives `released` at that commit; the Copilot dry run is reported
- [ ] Progress reported: `sdd task set C002-T-071 --status done --commit <sha>`
