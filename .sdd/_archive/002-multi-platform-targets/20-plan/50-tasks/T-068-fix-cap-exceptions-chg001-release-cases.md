---
id: C002-T-068
title: "Fix for revision D-030: cap exceptions for the CHG-001 release eval cases and the rules for sessions of CHG-001 tasks"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: done
depends_on: [C002-T-048]
implements: [C002-REQ-611, C002-NFR-105]
satisfies_ac: [C002-AC-611.1]
verified_by: [C002-TS-679, C002-TC-679]
components: [C002-COMP-009]
risk_refs: [C002-RISK-015, C002-RISK-038]
estimate: S
report: { commit: a677f6b, completed_at: 2026-10-24, notes: "41 rows in table order with rules (12 rule-1, 27 rule-2, TS-421-agent none); TC-679 20 rows + 6 supporting pass; npm test 1700/0/1; check exit 0 (Node 22, 1023 s); no paid session; C001-T-082 step 4 and C001-T-072 unblocked" }
---

# C002-T-068 — Fix for revision D-030: cap exceptions for the CHG-001 release eval cases and the rules for sessions of CHG-001 tasks

## Intent

The spec revision for defect D-030 extends the cap-exception table of C002-IF-010 §2.2. The defect
was found in C001-T-082. P-01 answered Q-cap-exc-01, "Add cap exceptions (Recommended)", and
Q-cap-exc-02, "Measure now (Recommended)" (`../questions-log.md` round 2026-10-24).

The revision adds rows of the Claude Code subscription class for CHG-001 release cases, and the two
rules of "Sessions of CHG-001 tasks". **Rule 1:** every session at the 1.50 USD rerun cap. **Rule 2:**
the row's own caps, with one 1.50 USD session that replaces a failed session ended at the spend cap.
This task brings `evals/harness/caps.mjs` and its tests to that table, after the critic fixes of
the revision (6426c36). The table holds **41 rows**: `TS-634` of the paid class and 40 rows of the
Claude Code subscription class. 24 of them were added for D-030. Of the 40, **12 are rule-1 rows**,
**27 are rule-2 rows**, and `TS-421-agent` is in neither list (plan critic CR-62). The members of
each rule are those of the two lists of §2.2 (plan critic CR-63). If G2 re-approves another table,
the task pins that one and the task report states its counts.

CHG-001's C001-T-082 step 4 and C001-T-072 run these rows and wait for this task (`../handoff.md`,
Cross-change dependency). C001-T-082 is marked blocked through the CLI until then. The harness still
counts no runs: the CHG-001 task that runs the sessions applies the rule from the result records'
`caps`. The task runs **no paid session**; the tests use the Agent SDK stub (sdk-stub).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `evals/harness/caps.mjs` › `CAP_EXCEPTIONS` | the 41 rows of the C002-IF-010 §2.2 table "Caps above 0.50 USD", in the table's order. The 17 rows already in force (`TS-634` … `INJ-19`) keep their place and values. The 24 rows added for D-030 follow `INJ-19` in the order of the table's three D-030 rows, each row's IDs in their order within it: `TS-223`, `TS-224`; then `TS-127`, `TS-201`, `TS-216`, `TS-217`, `TS-218`, `TS-319`, `TS-401`, `TS-418`, `TS-424`, `TS-511`, `TS-515`, `TS-622`, `TS-710`, `TS-712`, `TS-714`, `INJ-17`, `INJ-18`, `INJ-21`; then `TS-507`, `TS-508`, `TS-711`, `TS-802`. Each new row has its case file of the table, host `claude-code`, auth `subscription`, the row's own caps of the table (0.50 USD, 30 turns) and the rerun cap 1.50 USD |
| modify | `evals/harness/caps.mjs` › the subscription-class rows and their doc comment | each subscription-class row records its rule as data, which the CHG-001 tasks read. The rule comes from the two lists of §2.2 "Sessions of CHG-001 tasks": rule 1 for the 12 rows of list 1 (`TS-802` among them since spec critic CR-98), rule 2 for the 27 rows of list 2 (with `TS-127`, `TS-201`, `TS-418`, `TS-424` and `INJ-18` since spec critic CR-101), and none for `TS-421-agent`, which is in neither list because it is no release case of C001-ADR-003. The lists are read as they stand, with no range written into code or tests (plan critic CR-63). The doc comment names the two rules and states that the harness decides no run or rerun. `capCheck` is unchanged: a rule-1 session and a rule-2 replacement both start with `--cap-exception`, which applies the rerun cap. `TS-634` and its paid class do not change |
| modify | `tests/integration/cap06/cap-exceptions.test.ts` | the pinning test "CAP_EXCEPTIONS holds exactly the rows of the C002-IF-010 §2.2 table" lists the 41 rows of the table in its order, each subscription-class row with the rule of its §2.2 list. It also asserts 12 rule-1 rows, 27 rule-2 rows and one row in neither list. Every case file of the table exists, the five near-cap rows' files included. Session supporting tests of C002-TC-679 (test plan §8): `TS-223` at 1.50 USD with `--auth subscription --cap-exception`; `TS-216` at its own 0.50 USD under `--auth subscription` without the option; `TS-216` with `--cap-exception` under `--auth api-key`, refused before any session |

## Preconditions

- C002-T-048 done (the Claude Code subscription class, `--cap-exception` and sdk-stub, from its step
  X0).
- G2 re-approved after the D-030 revision and its critic fixes (spec CR-98 … CR-102), and G3 after
  this plan revision (gate records of `../../change.md`). The rows and lists that the task pins are
  those of the re-approved §2.2.
- No case file under `evals/` changes: the rows raise no case file's `maxBudgetUsd` or `maxTurns`,
  so the case-file supporting tests of C002-TC-679 stay as they are.

## Step outline (no production code)

1. Read the §2.2 table and the two rule lists of "Sessions of CHG-001 tasks". Extend the pinning
   test and the session supporting tests first, and watch them fail: the D-030 rows are missing, and
   `TS-223` with `--cap-exception` is refused today.
2. Add the D-030 rows to `CAP_EXCEPTIONS` in table order, record each subscription-class row's rule,
   and update the doc comment. The task report lists the rows added and the rule of each, quoted
   from §2.2.
3. Run `npm test -- cap06/cap-exceptions`, then `npm test -- cap06/runner-caps` and
   `npm test -- cap06/claude-runner`. C002-TC-614, 677, 678 and 917 … 919 stay unchanged: an exception
   row raises no cap without `--cap-exception`.
4. Run `npm test` and `npm run check`. Report the commit, and tell the conductor so that it unblocks
   C001-T-082. Then C001-T-082 step 4 and C001-T-072 may start their sessions of these rows, in the
   command forms of `../handoff.md`. The commit changes the eval harness only, which ships in no
   package, so it does not move the release-candidate commit of C002-T-048 for C002-T-052 or
   C002-T-055.

## Verification

- `npm test -- cap06/cap-exceptions`, `npm test -- cap06/runner-caps`, `npm test -- cap06/claude-runner`
- `npm test`, `npm run check`

## Done when

- [ ] `CAP_EXCEPTIONS` holds exactly the 41 rows of the C002-IF-010 §2.2 table in its order, the 24 D-030 rows included, each subscription-class row with the rule of its §2.2 list (12 rule 1, 27 rule 2, `TS-421-agent` neither). The pinning test passes, and every case file of the table exists
- [ ] `TS-223` runs at 1.50 USD with `--auth subscription --cap-exception`, `TS-216` at 0.50 USD without the option, and `--cap-exception` under `--auth api-key` is refused before any session. C002-TC-679 (twenty rows) and its supporting tests pass
- [ ] No case file under `evals/` changed, and no paid session ran
- [ ] `npm test` and `npm run check` green
- [ ] The task report lists the rows added with their rules, and names the CHG-001 tasks that wait for this task (C001-T-082 step 4, C001-T-072)
- [ ] Progress reported: `sdd task set C002-T-068 --status done --commit <sha>`
