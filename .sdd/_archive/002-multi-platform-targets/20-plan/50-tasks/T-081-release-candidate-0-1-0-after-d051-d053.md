---
id: C002-T-081
title: "Fix for revisions D-051 … D-053: new 0.1.0 release candidate, unpaid release steps and the Copilot CLI evidence retaken"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: done
depends_on: [C002-T-076, C002-T-077, C002-T-078, C002-T-079, C002-T-080]
implements: [C002-REQ-606, C002-REQ-612, C002-REQ-617]
satisfies_ac: [C002-AC-606.1, C002-AC-612.1, C002-AC-617.1]
verified_by: [C002-TS-615, C002-TS-620, C002-TC-615, C002-TC-620]
components: [C002-COMP-008, C002-COMP-009, C002-COMP-010]
risk_refs: [C002-RISK-026, C002-RISK-036, C002-RISK-042]
estimate: M
report: { commit: 8f2cca4, completed_at: 2026-11-11, notes: "candidate 54b83ff (local annotated tag v0.1.0 moved from 9eb56c0); check green, replays 683/26/0 both shells; Copilot CLI t081 24/24 pass, 2.29 USD, pool 12.62/30; injection 23 cases 0 acted upon; near-cap none; search 3 domain hits; dry run ERR-REL-003 only; report docs/releases/copilot/0.1.0/T-081-candidate-report.md" }
---

# C002-T-081 — Fix for revisions D-051 … D-053: new 0.1.0 release candidate, unpaid release steps and the Copilot CLI evidence retaken

## Intent

C002-T-077 … C002-T-080 change files that the packages are generated from
(`plugins/architect/targets/copilot.json`, the Copilot wiring and install notes, the bundled
`plugins/architect/scripts/sdd.mjs`, `plugins/architect/README.md`), so the 0.1.0 candidate 9eb56c0
no longer equals a regeneration (ERR-REL-007). The **conductor** runs this task: it records the new
release candidate at version 0.1.0 (not tagged on the remote, not published), rebuilds `dist/`, re-runs
the unpaid release steps and retakes the Copilot CLI evidence there. C002-T-050 then runs on the
packages of this commit.

**Retake decision** (the rule of C002-T-076 step 1: a commit that changes a package source goes to
P-01, who decides whether the evidence is retaken). **Answered:** Q-d051-retake-01
(`../questions-log.md`, round 2026-11-11), the conductor under P-01's waiver of 2026-10-19 for paid
batches within approved limits: option 1, retake all 24 rows. The D-047 argument, "no checked eval row depends on the changed lines", does not hold here:
the conductor is the session agent of `ROUTE-auditor-copilot-cli`, of most injection rows and of
`TS-359`, and its `tools` list and its inlined interview and gate wiring change; `INJ-19` and
`INJ-21` check exactly the conductor's behaviour without a question tool. The release check reads
the injection summary per version, not per commit (C002-IF-009 §5), so it would accept the t076
summary; the retake keeps the evidence tied to the shipped text. So the **24 rows of the Copilot CLI
case set run again** at this commit, about 2.4 … 3.4 USD (C002-T-076: 26 sessions, 2.63 USD).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `dist/` | the 0.1.0 packages rebuilt at the candidate: `dist/copilot/`, `dist/architect-copilot-0.1.0.zip`, `dist/architect-sdd-0.1.0.tgz`, `dist/architect-0.1.0.zip`, `dist/architect-0.1.0-plugin.zip` |
| modify | `docs/releases/copilot/0.1.0/` replay reports and `injection.json` | the replay reports of `sdd-mcp-server` and `copilot-hooks` at the candidate; the injection summary merged from the t081 results (passing t076 entries replaced, C002-IF-010 §5.2); the earlier files stay in the history |
| add | `evals/results/t081-*` result files and their ledger entries | the 24 Copilot CLI sessions of step 5, Copilot pool |
| add | `docs/releases/copilot/0.1.0/D051-D053-candidate.md` | the task report's record: candidate commit, the `plugins/architect/` diff against 9eb56c0, the unpaid results, the dry-run output, the local tag move |
| keep | `docs/releases/copilot/0.0.1/`, `0.0.2/`, `0.0.3/` | unchanged |

## Preconditions

- C002-T-076 done (b481e82; candidate 9eb56c0 after D-047); C002-T-077 … C002-T-080 done and
  committed.
- Q-d051-retake-01 answered (conductor, option 1, retake all 24 rows; `../questions-log.md`).
- REF-WIN with the tested hosts: Copilot CLI 1.0.98 (`copilot --version` checked before step 5), VS
  Code 1.145.2 with Copilot Chat 0.73.0 for `sdd host-version vscode`; Node.js 22.22.3, PowerShell 7,
  Git Bash, Developer Mode on.
- **Pool:** rule 8 of test plan §4.1 (Copilot pool 30 USD; 10.33 USD after C002-T-076, plus the
  session of C002-T-077 step 6), with the **15.00 USD stop** of C002-T-076 kept (P-01's instruction
  of 2026-11-07): a batch holds at most n sessions with T + n × 0.55 USD ≤ 15.00 USD, T the ledger
  total of the `copilot` entries read before the batch. From about 10.5 USD that is 8 sessions first,
  then fewer per batch; at the measured rate (about 0.11 USD per session) the 24 rows fit in about
  five batches and end near 13.2 USD. When no session fits, nothing more runs and P-01 is asked.
- The Copilot CLI uses its credential store; no token is written anywhere.

## Step outline (no production code)

1. **Release-candidate commit.** Record the commit holding C002-T-077 … C002-T-080; `plugin.json`
   gives 0.1.0. Report `git diff --stat 9eb56c0 <candidate> -- plugins/architect/` and name each
   file. **Shared source with Claude Code 0.1.0** (CR-103): the Claude Code zips change only in
   `scripts/sdd.mjs` (the `--host copilot` output form of C002-T-078; `targets/` is not staged,
   C002-T-015) and `README.md` (one sentence of the Copilot section). The Claude Code evidence of
   C001-T-072 stands: no Claude Code eval row calls `hook session-start --host copilot`, the
   plain-text brief is unchanged (C002-TS-708 and the CHG-001 session-start tests), and no eval row
   reads the README. Any other file of the Claude Code zips in the diff stops the task and goes to
   P-01.
2. **Local tag.** The local tag `v0.1.0` of C001-T-072 (at 9eb56c0, never pushed) moves to the
   candidate (`git tag -f v0.1.0 <candidate>`, local only), so that CR-103 holds with an empty
   `plugins/architect/` diff; the record names both commits. Pushing the tag and every publication
   stay P-01's (C002-T-075, C002-T-055).
3. **Unpaid steps.** At the candidate: C002-T-048 step 5 (`npm run check`, the CHG-001 approval tests
   excepted as in the D-047 rerun list while CHG-001 D-030 is open); `npm run package` and the target
   structure check, `dist/` equal to a regeneration; C002-T-054 steps 1 and 2: the `sdd-mcp-server` and
   `copilot-hooks` replays under Git Bash and PowerShell 7 on `win32`, 0 differing decisions, reports
   under `docs/releases/copilot/0.1.0/`; `sdd host-version vscode` prints `vscode 1.145.2` and
   `copilot-chat 0.73.0`.
4. **Tools-list check first.** Batch 1 starts with `ROUTE-auditor-copilot-cli`; a refused agent file
   or a dropped tools list stops the task (defect of C002-T-077, C002-RISK-042).
5. **Paid rows.** The Copilot CLI case set of C002-T-054 step 3 (`ROUTE-auditor-copilot-cli`,
   `INJ-01` … `INJ-22`, `TS-359`; `TS-336` not applicable), label `t081`,
   `--copilot-model claude-opus-5.5=claude-sonnet-5.5`, in batches sized by the pool rule above with a
   ledger check after each. The failure rules of C002-T-076 step 4 apply unchanged: a failing row is a
   defect of its owning task; an entry acted upon is final for 0.1.0 and refuses Copilot 0.1.0, which
   goes to P-01 (a new version); a not-exposed no run (D-046) runs once more, a second goes to P-01;
   an injection row at a cap goes to P-01. `INJ-19` and `INJ-21` pass and the report quotes their text
   fallback.
6. **Dry run.** `node scripts/release-check.mjs --target copilot --dry-run` at the commit holding the
   final injection merge: it refuses on nothing but ERR-REL-003 (the checklist record of C002-T-050).
   Any other refusal stops the release chain and goes to the conductor.
7. **Report:** the candidate and both tag commits; the `plugins/architect/` diff and the Claude Code
   argument of step 1; the unpaid results; every paid session with its ledger entry and the pool total;
   the injection summary (entries, acted upon, entries replaced); the near-cap list (CR-80) or "none";
   the Copilot CLI transcript search of C002-T-076 step 6, every hit quoted or "no hit"; the dry-run
   output.

## Verification

- `npm run check`, `npm run package`, `npm run replay -- suite` (Git Bash and PowerShell 7)
- `node evals/harness/run.mjs --host copilot-cli --tier dev --label t081 --copilot-model claude-opus-5.5=claude-sonnet-5.5 --task C002-T-081 --step 5 --only <the rows of one batch> <the Copilot CLI case files>`, one call per batch
- `node scripts/release-check.mjs --target copilot --dry-run` at the candidate

## Done when

- [ ] The candidate holds C002-T-077 … C002-T-080 at 0.1.0; the report gives the `plugins/architect/` diff against 9eb56c0 and the Claude Code argument, and the local tag `v0.1.0` points at the candidate (not pushed)
- [ ] `dist/` equals a regeneration; `npm run check` green; both replays 0 differing in both shells
- [ ] Every row of the 24-row Copilot CLI case set has a t081 session that is no no run, within the 15.00 USD stop by the batch rule; `injection.json` at 0.1.0 holds no entry acted upon; `INJ-19` and `INJ-21` pass with the fallback quoted
- [ ] Near-cap list and transcript search reported
- [ ] The dry run refuses on ERR-REL-003 only
- [ ] Progress reported: `sdd task set C002-T-081 --status done --commit <sha>`
