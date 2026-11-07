---
id: C002-T-076
title: "Fix for revision D-041: Copilot release evidence retaken at version 0.1.0"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-054, C002-T-066, C002-T-071]
implements: [C002-REQ-606, C002-REQ-609, C002-REQ-612, C002-REQ-617]
satisfies_ac: [C002-AC-606.1, C002-AC-609.1, C002-AC-612.1, C002-AC-617.1]
verified_by: [C002-TS-615, C002-TS-620, C002-TC-615, C002-TC-620]
components: [C002-COMP-008, C002-COMP-009, C002-COMP-010]
risk_refs: [C002-RISK-026, C002-RISK-036]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-076 — Fix for revision D-041: Copilot release evidence retaken at version 0.1.0

## Intent

C002-T-071 retook the Copilot evidence at 0.0.3, at the release-candidate commit 4ef1d61 (e5a6440:
24 of 24 Copilot CLI sessions passed, 2.32 USD, no injection entry acted upon). Since then the CHG-001
release gate (C001-T-072) fixed the skill and agent files that both packages are generated from
(CHG-001 D-022 … D-027), and it moved the version to **0.1.0** (commit ab0cfc7, packages rebuilt in
`dist/`). The Copilot release-check dry run therefore refuses the 0.0.3 candidate with ERR-REL-007:
32 generated files of `dist/copilot/` and `dist/architect-copilot-0.0.3.zip` differ from a
regeneration from the current source (defect D-041; `docs/release-0.1.0-evidence.md` §7).

P-01 answered Q-copilot-010-01 with "Ship 0.1.0 on both hosts (Recommended)" (`../questions-log.md`,
round 2026-11-07). Copilot ships at 0.1.0, the version of the Claude Code release, with every
release-gate fix in it. This task retakes the Copilot evidence at 0.1.0, as C002-T-071 step 5 did for
0.0.3. C002-T-071 stays done, and its 0.0.3 evidence stays as a record: done tasks are not reopened.
No version task is needed, because C001-T-072 already moved the version.

C002-T-050, C002-T-057, C002-T-075 and C002-T-055 wait for this task. P-01 then takes the checklist
and the clean-profile run on the 0.1.0 packages.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/copilot/0.1.0/` replay reports and `injection.json` | the replay reports of every Copilot mechanism in use at the 0.1.0 release-candidate commit (C002-T-054 step 2), and the Copilot injection summary of the 0.1.0 Copilot CLI sessions, `TS-359` included, a new file (C002-IF-010 §5.2) |
| add | `evals/results/t076-*` result files and their ledger entries | the 24 Copilot CLI sessions of step 4, Copilot pool |
| keep | `docs/releases/copilot/0.0.1/`, `0.0.2/`, `0.0.3/` and `docs/releases/opencode/` | unchanged: the evidence of earlier versions, never moved or edited |

## Preconditions

- **The G3 approval of revision D-041.** Until it, no session of this task runs.
- **Cross-change:** C001-T-072's version commit ab0cfc7 (0.1.0) is in the history, and `dist/`
  holds the 0.1.0 packages. This edge lives on the CHG-002 side only (`../handoff.md`).
- C002-T-054, C002-T-066 and C002-T-071 done.
- **Pools:** the 24 Copilot CLI sessions from the Copilot pool under rule 8 of test plan §4.1. The
  pool stays 30 USD, with 7.70 USD spent after C002-T-071. **Stop at 15.00 USD** (P-01's instruction
  of 2026-11-07, relayed by the conductor): no further Copilot CLI session starts once the
  `copilot` ledger total reaches 15.00 USD, and the conductor asks P-01. The 0.0.3 run cost
  2.32 USD, so about 2.40 USD is expected. The option presented to P-01 gave about 8 USD as a
  conservative figure.
- No OpenRouter pool is used, and no OpenCode session runs (OpenCode moved to CHG-003).
- REF-WIN with the tested Copilot hosts (VS Code Insiders 1.142.0-insider, Copilot CLI 1.0.98).
  The conductor checks `copilot --version` before step 4: a host that updated itself is not the
  tested version, so its sessions are not release evidence. Node.js 22.22.3, PowerShell 7 and Git
  Bash, and Developer Mode on.
- The Copilot CLI uses its credential store. No token is written to any file, record, transcript or
  command line.

## Step outline (no production code)

1. **Release-candidate commit.** Record the commit of this round. It holds C001-T-072's 0.1.0 fixes,
   the version commit ab0cfc7, and every CHG-002 change. Check that `plugin.json` there gives
   **0.1.0**. Any later commit that changes a file the packages are generated from moves the
   release-candidate commit (ERR-REL-007 again). Before C002-T-055, such a commit goes to P-01, who
   decides whether the evidence is retaken again.
2. **Shared unpaid steps.** At that commit: C002-T-048 step 5 (the regression set, as
   `npm run check`), then `npm run package` and the target structure check. The 0.1.0 packages in
   `dist/` must equal a regeneration at that commit.
3. **Copilot unpaid steps.** C002-T-054 steps 1 and 2 at that commit: the package, and the replay of
   every Copilot mechanism in use under both shells, with 0 differing decisions. Release replays run
   on `win32` only (C002-DOD-008). The reports go to `docs/releases/copilot/0.1.0/`.
4. **Copilot paid rows at 0.1.0.**
   - **Rows:** the Copilot CLI case set of C002-T-054 step 3, the same 24 sessions as C002-T-071
     step 5: `ROUTE-auditor-copilot-cli`, `INJ-01` … `INJ-22` and `TS-359` (`TS-336` is not
     applicable under `sdd-mcp-server`). They run with
     `--copilot-model claude-opus-5.5=claude-sonnet-5.5`, under rule 8 and the 15.00 USD stop above.
   - **Results:** label the result files `t076`. `docs/releases/copilot/0.1.0/injection.json` is
     written from them. `INJ-21` keeps 0.50 USD on Copilot CLI (C002-IF-010 §2.2, Caps of injection
     rows).
   - **Text fallback:** `INJ-19` and `INJ-21` must pass at 0.1.0 and show the conductor's text
     fallback, as at 0.0.3 (CHG-001 D-020). The release-gate fixes changed the conductor's skills,
     so the task report quotes the fallback reply for each again.
   - **Failures:** a row whose session does not pass is a defect of the owning task (reopen it). It
     is never fixed in the evidence. An injection entry that reads acted upon is final for 0.1.0, and
     0.1.0 of Copilot is then refused (C002-IF-010 §5.2 rule 3). An injection row that ends at a cap
     goes to P-01, and 0.1.0 of Copilot is refused (plan critic CR-80).
5. **Dry run.** Run `node scripts/release-check.mjs --target copilot --dry-run` at that commit. It
   must refuse on nothing other than the records P-01 still owes: ERR-REL-003 for the checklist
   record of C002-T-050, and the Copilot clean-profile run of C002-T-057 if the check reads it. Any
   other refusal, ERR-REL-007 included, stops the release chain and goes to the conductor.
6. **Report.** The task report gives:
   - the release-candidate commit and the version 0.1.0;
   - the regression-set result and the Copilot replay reports;
   - every paid session with its ledger entry, and the Copilot pool total after it;
   - the 0.1.0 Copilot injection summary: entry count and acted upon;
   - the **near-cap list** (plan critic CR-80; spec CR-122): every Copilot CLI injection row whose
     0.1.0 session ended at a cap or came within 0.09 USD of its spend cap, with its recorded cost,
     its cap and its end, or "none";
   - the dry-run output of step 5.

   C002-T-050 and C002-T-057 then run on the package of this commit.

## Verification

- `npm run package`, `npm run check`, `npm run replay -- suite` (both shells), C002-T-048 step 5
- `node evals/harness/run.mjs --host copilot-cli --tier dev --label t076 --copilot-model claude-opus-5.5=claude-sonnet-5.5 --task C002-T-076 --step 4 <the Copilot CLI case set>`
- `node scripts/release-check.mjs --target copilot --dry-run` at the release-candidate commit

## Done when

- [ ] The release-candidate commit holds the CHG-001 release-gate fixes and every CHG-002 change, at package version 0.1.0; the report names both
- [ ] C002-T-048 step 5 and C002-T-054 steps 1 and 2 re-ran at that commit, with 0 differing decisions in the Copilot release replays, reports under `docs/releases/copilot/0.1.0/`
- [ ] The 24 Copilot CLI sessions ran at 0.1.0 from the Copilot pool, `TS-359` included, every session in the ledger, the pool total at most 15.00 USD; `docs/releases/copilot/0.1.0/injection.json` holds the Copilot CLI injection case set, no entry acted upon; `INJ-19` and `INJ-21` pass, and the report quotes the text fallback in both
- [ ] The task report lists the Copilot CLI injection rows at or within 0.09 USD of their cap at 0.1.0, or "none" (CR-80, spec CR-122)
- [ ] The Copilot release-check dry run at that commit refuses on nothing other than the records of C002-T-050 and C002-T-057 (D-041 closes on it)
- [ ] Progress reported: `sdd task set C002-T-076 --status done --commit <sha>`
