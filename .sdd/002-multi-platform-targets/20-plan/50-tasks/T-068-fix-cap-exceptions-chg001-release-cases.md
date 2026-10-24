---
id: C002-T-068
title: "Fix for revision D-030: cap exceptions for the CHG-001 release eval cases and the rules for sessions of CHG-001 tasks"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-048]
implements: [C002-REQ-611, C002-NFR-105]
satisfies_ac: [C002-AC-611.1]
verified_by: [C002-TS-679, C002-TC-679]
components: [C002-COMP-009]
risk_refs: [C002-RISK-015]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-068 — Fix for revision D-030: cap exceptions for the CHG-001 release eval cases and the rules for sessions of CHG-001 tasks

## Intent

The spec revision for defect D-030 extends the cap-exception table of C002-IF-010 §2.2. The defect
was found in C001-T-082. P-01 answered Q-cap-exc-01, "Add cap exceptions (Recommended)", and
Q-cap-exc-02, "Measure now (Recommended)" (`../questions-log.md` round 2026-10-24).

The revision adds three rows of the Claude Code subscription class, for 19 CHG-001 release cases:
- `TS-223` and `TS-224`;
- 14 rows from `TS-216` to `INJ-21`;
- `TS-507`, `TS-508` and `TS-711`.

It also adds the two rules of "Sessions of CHG-001 tasks". **Rule 1:** every session at the 1.50 USD
rerun cap. **Rule 2:** the row's own caps, with one 1.50 USD session that replaces a failed session
ended at the spend cap.

This task brings `evals/harness/caps.mjs` and its tests to that table. CHG-001's C001-T-082 step 4
and C001-T-072 run these rows and wait for this task (`../handoff.md`). The harness still counts no
runs. The CHG-001 task that runs the sessions applies its rule, from the result records' `caps`
(C002-IF-010 §2.2 Sessions of CHG-001 tasks). The task runs **no paid session**: the tests use the
Agent SDK stub (sdk-stub).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `evals/harness/caps.mjs` › `CAP_EXCEPTIONS` | the 19 rows, in the order of the §2.2 table, after the `INJ-19` row: `TS-223`, `TS-224`; `TS-216`, `TS-217`, `TS-218`, `TS-319`, `TS-401`, `TS-511`, `TS-515`, `TS-622`, `TS-710`, `TS-712`, `TS-714`, `TS-802`, `INJ-17`, `INJ-21`; `TS-507`, `TS-508`, `TS-711`. Each row has its case file of the table, host `claude-code`, auth `subscription`, own caps 0.50 USD and 30 turns, and rerun cap 1.50 USD. Rows that are already in force keep their place and values |
| modify | `evals/harness/caps.mjs` › the subscription-class rows and their doc comment | the two rules recorded per row as data that the CHG-001 tasks read: rule 1 for `TS-213`, `TS-215`, `TS-221`, `TS-223`, `TS-224`, the three `TS-318` rows, `TS-507`, `TS-508` and `TS-711`; rule 2 for every other release case of the class (`TS-214`, `TS-216` … `TS-802`, `TS-815`, both `TS-817` rows, `INJ-17`, `INJ-19`, `INJ-21`); and none for `TS-421-agent`, which is no release case of C001-ADR-003. The doc comment names the rules and states that the harness decides no run or rerun. `capCheck` is unchanged: a rule-1 session and a rule-2 replacement are both started with `--cap-exception`, which applies the rerun cap. `TS-634` and its paid class do not change |
| modify | `tests/integration/cap06/cap-exceptions.test.ts` | the pinning test "CAP_EXCEPTIONS holds exactly the rows of the C002-IF-010 §2.2 table" lists the 37 rows in table order, with each row's rule. Every case file of the new rows exists. Session supporting tests of C002-TC-679 (test plan §8): `TS-223` at 1.50 USD with `--auth subscription --cap-exception`; `TS-216` at its own 0.50 USD under `--auth subscription` without the option; `TS-216` with `--cap-exception` under `--auth api-key`, refused before any session |

## Preconditions

- C002-T-048 done (the Claude Code subscription class, `--cap-exception` and sdk-stub, from its step
  X0).
- G2 re-approved after the D-030 revision, and G3 after this plan revision (gate records of
  `../../change.md`).
- No case file under `evals/` changes: the rows raise no case file's `maxBudgetUsd` or `maxTurns`,
  so the case-file supporting tests of C002-TC-679 stay as they are.

## Step outline (no production code)

1. Extend the pinning test and the session supporting tests first, and watch them fail: the 19 rows
   are missing, and `TS-223` with `--cap-exception` is refused today.
2. Add the 19 rows to `CAP_EXCEPTIONS` in table order, record each subscription-class row's rule of
   "Sessions of CHG-001 tasks", and update the doc comment.
3. Run `npm test -- cap06/cap-exceptions`, then `npm test -- cap06/runner-caps` and
   `npm test -- cap06/claude-runner`. C002-TC-614, 677, 678, 917 … 919 stay unchanged: an exception
   row raises no cap without `--cap-exception`.
4. Run `npm test` and `npm run check`. Report the commit: C001-T-082 step 4 and C001-T-072 may then
   start their sessions of these rows. The commit changes the eval harness only, which ships in no
   package, so it does not move the release-candidate commit of C002-T-048 for C002-T-052 or
   C002-T-055.

## Verification

- `npm test -- cap06/cap-exceptions`, `npm test -- cap06/runner-caps`, `npm test -- cap06/claude-runner`
- `npm test`, `npm run check`

## Done when

- [ ] `CAP_EXCEPTIONS` holds the rows of the C002-IF-010 §2.2 table in its order, the 19 rows of D-030 included, each subscription-class row with its rule of "Sessions of CHG-001 tasks". The pinning test passes, and every case file of the table exists
- [ ] `TS-223` runs at 1.50 USD with `--auth subscription --cap-exception`, `TS-216` at 0.50 USD without the option, and `--cap-exception` under `--auth api-key` is refused before any session. C002-TC-679 (twenty rows) and its supporting tests pass
- [ ] No case file under `evals/` changed, and no paid session ran
- [ ] `npm test` and `npm run check` green
- [ ] The task report names the CHG-001 tasks that wait for this task (C001-T-082 step 4, C001-T-072)
- [ ] Progress reported: `sdd task set C002-T-068 --status done --commit <sha>`
