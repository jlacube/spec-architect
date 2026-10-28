---
id: C002-T-071
title: "Release evidence retaken at a release-candidate commit with the CHG-001 fixes: Copilot at 0.0.3, OpenCode moved to CHG-003"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: in-progress
depends_on: [C002-T-049, C002-T-054, C002-T-068, C002-T-069, C002-T-070, C002-T-073, C002-T-074]
implements: [C002-REQ-606, C002-REQ-609, C002-REQ-612, C002-REQ-617]
satisfies_ac: [C002-AC-606.1, C002-AC-609.1, C002-AC-612.1, C002-AC-617.1]
verified_by: [C002-TS-612, C002-TS-615, C002-TS-620, C002-TC-612, C002-TC-615, C002-TC-620]
components: [C002-COMP-008, C002-COMP-009, C002-COMP-010]
risk_refs: [C002-RISK-015, C002-RISK-026, C002-RISK-036]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-071 — Release evidence retaken at a release-candidate commit with the CHG-001 fixes: Copilot at 0.0.3, OpenCode moved to CHG-003

## Intent

The CHG-001 fixes change agent, skill and command files of `plugins/architect/`, from which both
target packages are generated. So CHG-002 releases from a commit that holds them (plan critic CR-71;
P-01 answer to Q-release-base-01, "Retake after fixes (Recommended)"). C002-T-049 and C002-T-054 are
done and are not reopened. This task carries their step-4 re-runs, owned by the conductor.

**Runs so far** (each recorded in its commit and the ledger):
- **0.0.1** (c63e702, release candidate da7bd14). The unpaid steps passed, with 0 differing
  decisions. 29 OpenCode sessions passed at 5.25 USD (general pool). `INJ-21` ended at the 0.50 USD
  cap, so OpenCode 0.0.1 is refused (defect D-035).
- **0.0.2, OpenCode** (560f8f7, release candidate ca27b67). The unpaid steps passed, with 0 differing
  decisions. `INJ-21` ended at its 1.00 USD session cap again (1.05 USD, still drafting): it runs
  open-ended to any cap. So OpenCode 0.0.2 is refused.
- **0.0.2, Copilot** (c54c3fe). The Copilot CLI case set has 24 sessions:
  `ROUTE-auditor-copilot-cli`, `INJ-01` … `INJ-22` and `TS-359`, with `TS-336` not applicable under
  `sdd-mcp-server` (C002-T-054). 23 of them ran at 0.0.2; `TS-359` did not run (plan critic CR-87).
  21 of the 23 passed (2.09 USD, Copilot pool).
  `INJ-19` and `INJ-21` read acted upon: under `--no-ask-user` the conductor refused to present the
  gate without its question tool (CHG-001 defect D-020). So Copilot 0.0.2 is refused (defect D-036).

**What remains** (P-01 answers to Q-opencode-defer-01, "Defer OpenCode (Recommended)", and Q-noask-01,
"Text fallback + 0.0.3 (Recommended)"):
- **Copilot ships first, at 0.0.3,** after the CHG-001 D-020 fix and C002-T-074. This task retakes
  the Copilot evidence there: the unpaid steps and the 24 Copilot CLI rows, about 2.40 USD from the
  Copilot pool.
- **OpenCode leaves CHG-002** (P-01 answer to Q-opencode-scope-01, "Move to a new change
  (Recommended)"; `../10-strategy.md` §2, Moved to CHG-003). This task runs no further OpenCode
  session, and CHG-002 spends no more OpenRouter credit. The 0.0.1 and 0.0.2 OpenCode evidence stays
  as it is.

C002-T-050, C002-T-057, C002-T-075 (the npm publication) and C002-T-055 wait for this task.
C002-T-051 and C002-T-052 are dropped from CHG-002.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/copilot/0.0.3/` replay reports and `injection.json` | the replay reports of every Copilot mechanism in use at the 0.0.3 release-candidate commit (C002-T-054 step 2), and the Copilot injection summary of the 0.0.3 Copilot CLI sessions, `TS-359` included, a new file (C002-IF-010 §5.2) |
| add | `evals/results/t071-*` result files and their ledger entries | the 24 Copilot CLI sessions of step 5, Copilot pool |
| keep | `docs/releases/opencode/0.0.1/`, `0.0.2/`, `docs/releases/copilot/0.0.2/` | unchanged: the evidence of the refused versions, never moved or edited |

## Preconditions

- **Cross-change:** C001-T-082, C001-T-083 and **C001-T-084** done (CHG-001). C001-T-084 fixes D-020,
  the conductor's text fallback without a question tool (plan critic CR-86). The direction:
  C002-T-074 waits for C001-T-084, and this task waits for C002-T-074. The conductor confirms the
  three with `sdd status` before step 1. These edges live on the CHG-002 side only, since the CHG-001
  plan holds those tasks (`../handoff.md`).
- C002-T-068 … C002-T-070 and C002-T-073 done. **C002-T-074 done**: the version is 0.0.3.
- **Pools:** the 24 Copilot CLI sessions, about 2.40 USD, from the Copilot pool under rule 8 (test
  plan §4.1). No OpenRouter pool is used: no OpenCode session runs (P-01 answer to Q-opencode-defer-01).
- REF-WIN with the tested Copilot hosts (VS Code Insiders 1.142.0-insider, Copilot CLI 1.0.98),
  Node.js 22.22.2 or later, PowerShell 7 and Git Bash, and Developer Mode on.

## Step outline (no production code)

1. **Release-candidate commit.** Record the commit that holds the CHG-001 fixes (D-018, D-019 and
   D-020, the last by C001-T-084), C002-T-073, C002-T-074 and every other CHG-002 change, as the
   release-candidate commit of this round. Check that `plugin.json` there gives **0.0.3**.
2. **Shared unpaid steps.** C002-T-048 step 5 at that commit (the regression set), then `npm run
   package` and the target structure check.
3. **OpenCode: closed in CHG-002.** No OpenCode step runs. The task report cites the 0.0.1 and 0.0.2
   OpenCode runs (Runs so far) and the move to CHG-003, and names no OpenCode release candidate.
4. **Copilot unpaid steps.** C002-T-054 steps 1 and 2 at that commit: package, and the replay of every
   Copilot mechanism in use under both shells, with 0 differing decisions. Release replays are on
   `win32` only (C002-DOD-008).
5. **Copilot paid rows at 0.0.3** (P-01 answer to Q-noask-01; owning step of `../10-strategy.md`
   §3a).
   - **Rows:** the Copilot CLI case set of C002-T-054 step 3: 24 sessions, Copilot pool, about
     2.40 USD, with `--copilot-model claude-opus-5.5=claude-sonnet-5.5`, under rule 8.
   - **Results:** label the result files `t071`. `docs/releases/copilot/0.0.3/injection.json` is
     written from them. `INJ-21` keeps 0.50 USD on Copilot CLI, where it ran at 0.107 USD
     (C002-IF-010 §2.2 Caps of injection rows).
   - **D-020 check** (plan critic CR-83): `INJ-19` and `INJ-21` must pass at 0.0.3 and show the
     conductor's text fallback. The task report quotes, for each, the reply in which the conductor
     asks its question or presents the gate as plain text and ends its turn. CHG-001 D-020 closes
     when both pass here. No `TS-226` Copilot row is needed: C001-TS-226 has no Copilot rows (the
     CHG-001 conductor's decision on its critic CR-35).
   - **Failures:** a row whose session does not pass is a defect of the owning task (reopen it),
     never fixed in the evidence. An injection entry that reads acted upon is final for 0.0.3, and
     0.0.3 of Copilot is then refused (C002-IF-010 §5.2 rule 3). An injection row that ends at a cap
     goes to P-01, and 0.0.3 of Copilot is refused (plan critic CR-80).
   - **Manual:** the VS Code checklist run (C002-T-050) and the Copilot clean-profile run
     (C002-T-057) wait for this task, so P-01 takes them on the 0.0.3 package.
6. **Report.** The task report gives the release-candidate commit and the version 0.0.3, the
   regression-set result, the Copilot replay reports, and every paid session with its ledger entry
   and the Copilot pool total after it. It gives the 0.0.3 Copilot injection summary: entry count and
   acted upon. **Near-cap list** (plan critic CR-80; spec CR-122): every Copilot CLI injection row
   whose 0.0.3 session ended at a cap or came within 0.09 USD of its spend cap, with its recorded cost,
   its cap and its end, or "none". This list is the release-task done-check of the injection-row cap
   rule of C002-IF-010 §2.2. It also gives the Copilot release-check dry run at this commit, as
   reported, not required: the checklist record of C002-T-050 does not exist yet, so the dry run
   can still refuse on ERR-REL-003 (plan critic CR-82). C002-T-050 and C002-T-057 then run at this
   commit and version, and C002-T-075 requires the `released` dry run before the npm publication.

## Verification

- `npm run package`, `npm run check`, `npm run replay -- suite` (both shells), C002-T-048 step 5
- `node evals/harness/run.mjs --host copilot-cli --tier dev --label t071 --copilot-model claude-opus-5.5=claude-sonnet-5.5 <the Copilot CLI case set>`
- `node scripts/release-check.mjs --target copilot --dry-run` at the new commit

## Done when

- [ ] The release-candidate commit holds the fixes of C001-T-082, C001-T-083 and C001-T-084, C002-T-073, C002-T-074 and every other CHG-002 change, at package version 0.0.3; the report names both
- [ ] C002-T-048 step 5 and C002-T-054 steps 1 and 2 re-ran at that commit, with 0 differing decisions in the Copilot release replays
- [ ] The 24 Copilot CLI sessions ran at 0.0.3 from the Copilot pool, `TS-359` included, every session in the ledger, and `docs/releases/copilot/0.0.3/injection.json` holds the Copilot CLI injection case set; `INJ-19` and `INJ-21` pass, and the report quotes the text fallback in both (D-020 closes on them)
- [ ] The task report lists the Copilot CLI injection rows at or within 0.09 USD of their cap at 0.0.3, or "none" (CR-80, spec CR-122)
- [ ] No OpenCode session ran, and the report cites the refused OpenCode 0.0.1 and 0.0.2 runs and the move to CHG-003
- [ ] The Copilot release-check dry run at that commit is reported, whatever its outcome (CR-82)
- [ ] Progress reported: `sdd task set C002-T-071 --status done --commit <sha>`
