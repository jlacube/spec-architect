---
id: C002-T-056
title: "OpenCode dev-tier runs of the carried eval rows"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: in-progress
depends_on: [C002-T-038, C002-T-044, C002-T-063, C002-T-064, C002-T-065]
implements: [C002-REQ-608, C002-REQ-610, C002-REQ-611, C002-REQ-112]
satisfies_ac: [C002-AC-608.1, C002-AC-610.1, C002-AC-611.1, C002-AC-112.1]
verified_by: [C002-TS-673, C002-TC-673, C002-TS-677, C002-TC-677, C002-TS-679, C002-TC-679, C002-TS-113, C002-TS-132, C002-TS-133, C002-TS-211, C002-TS-215, C002-TS-217, C002-TS-219, C002-TS-221, C002-TS-222, C002-TS-223, C002-TS-230, C002-TS-316, C002-TS-506, C002-TS-507, C002-TS-509, C002-TS-510, C002-TS-511, C002-TS-512, C002-TS-513, C002-TS-514, C002-TS-515, C002-TS-613, C002-TS-634, C002-TS-635, C002-TS-639, C002-TC-113, C002-TC-132, C002-TC-133, C002-TC-211, C002-TC-215, C002-TC-217, C002-TC-219, C002-TC-221, C002-TC-222, C002-TC-223, C002-TC-230, C002-TC-316, C002-TC-506, C002-TC-507, C002-TC-509, C002-TC-510, C002-TC-511, C002-TC-512, C002-TC-513, C002-TC-514, C002-TC-515, C002-TC-613, C002-TC-634, C002-TC-635, C002-TC-639]
components: [C002-COMP-009]
risk_refs: [C002-RISK-015]
estimate: L
report: { commit: null, completed_at: null, notes: "Partial edd5fa9: 12 pass, TS-507 fail (run_command error results rejected by OpenCode MCP client, -32602, defect D-017), 18 sessions 402 (OpenRouter account credit out; valid_run false). T-056 spend 3.92 USD, OpenRouter total 4.22 of 40. Remaining ~31 sessions after top-up and the D-017 fix." }
---

# C002-T-056 — OpenCode dev-tier runs of the carried eval rows

## Intent

Run, on the OpenCode target at its tested version (E-OCE), every OpenCode eval row that earlier tasks
wrote and carried to the OpenCode runner: the generator cases, the question-tool cases, the doctor
cases and the gate cases with the C001-CAP-02 interview and gate cases (test plan §4.2, verification
tooling row). These rows are the evidence of C002-DOD-001, C002-DOD-002 and C002-DOD-006 for OpenCode.
They bill P-01's OpenRouter account from the OpenRouter general pool, outside the reserve for the
release evidence (Q-evalbudget-03, Q-opencode-01).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `evals/results/t056-*.json` | one result per session (host, host version, model IDs, tokens, spend, transcript path) |
| modify | `evals/results/spend-chg002.json` | the spend of every session |
| modify | `evals/targets/**/*.eval.mjs` | only to fix a case defect found here, never to weaken an assertion (case files of C002-T-026, C002-T-027, C002-T-037, C002-T-038, C002-T-044); a product defect reopens the owning task instead |
| modify | `evals/harness/caps.mjs` › `CAP_EXCEPTIONS` | rerun plan step X0 (defect D-022 item 1): the `TS-634` exception of `evals/targets/gate/TS-634.eval.mjs` on `opencode` at 2.00 USD, the cap of C002-IF-010 §2.2 after P-01's answer to Q-ts634-budget-02 |
| modify | `evals/targets/gate/TS-634.eval.mjs` | rerun plan step X0: the OpenCode row's `maxBudgetUsd` 2.00, nothing else |
| modify | `evals/harness/run.mjs` › `stopRule` | rerun plan step X0 (defect D-022 item 3; C002-IF-010 §2.2 "Reserve of a cap-exception session"): for a selected cap-exception row, H = the row's exception cap + max(0.65 USD, highest recorded session cost) |
| modify | `evals/harness/runners/opencode.mjs` (the `cap` record, about line 510) | rerun plan step X0 (defect D-022 item 2; C002-IF-010 §2.2 overshoot rule): the `cap` record carries the capping step's `step_usd`; one `step-after-cap` record per step that finishes after it, with `step_usd`, its agent and `started_before_cap` |
| modify | `tests/integration/cap06/cap-exceptions.test.ts`, `tests/integration/cap06/runner-caps.test.ts` | rerun plan step X0: C002-TC-679 at the 2.00 USD exception (rows of the revised C002-TS-679); C002-TC-677 asserts the `cap` and `step-after-cap` records; the stop-rule test gains a case for an exception row's H |
| modify | `tests/integration/cap01/wiring.test.ts` (the planted critic line, about line 325) | rerun plan step X0 (defect D-021 item 1): C002-TC-673 plants on line 26 of `agents/sdd-critic.md` and keeps its 26 lines, no padding (revised C002-TS-673) |

The infeasible-driver branch of `10-strategy.md` §4 is not taken (S-07 §4: the stub-model driver is
feasible), so C002-TC-133, 211, 222 and 223 stay replay cases of C002-T-042 and none of their branch
case files (test plan §8.1) is written.

## Preconditions

- C002-T-038 (doctor case files) and C002-T-044 (runner, gate case files) done; C002-T-026,
  C002-T-027 and C002-T-037 done through them.
- C002-T-063 done: the case files of C002-TC-509 and C002-TC-515 follow the revised scenarios (the
  OpenCode rows that need a PATH `sdd` use the package generated for native permission enforcement),
  so no paid session runs an outdated row.
- C002-T-064 done (defects D-015 … D-017): the server's error results carry no `structuredContent`,
  so OpenCode accepts refused and failed `run_command` probes (C002-TC-666 passes); `TS-507.eval.mjs`
  asserts no `-32602`; the Claude Code doctor rows carry `host: "claude-code"`, so `--host opencode`
  selects only OpenCode rows; the runner writes `targetPackage.version` into the source copy's
  `plugin.json` (C002-TC-515).
- P-01 has topped up the OpenRouter account (Q-openrouter-02, `../../10-spec/questions-log.md` round
  2026-10-20: "Topped up / will top up"); the 40 USD stop rule stays. Before the first resumed session
  the person who starts it reads the account balance and confirms it covers the next session.
- OpenCode at its tested version (1.18.31, started as the pinned host binary with its own
  `OPENCODE_DB`, C002-ADR-005) with the Claude model tiers of the S-07 record, through P-01's
  OpenRouter account (C002-T-001 step 1); REF-WIN on Node.js 22.22.2 or later.
- The conductor's re-estimate of the checkpoints of test plan §4.1 (S-07 probes, C002-T-044 smoke),
  when one was triggered, has been shown to P-01.
- The general pool's stop rule of test plan §4.1 allows the next session (general-pool total plus H
  within 30 USD; reserve spend does not count against it).

## Step outline (no production code)

1. List the carried rows from the task reports of C002-T-026, C002-T-027, C002-T-037, C002-T-038 and
   C002-T-044 and check the list against the session count of test plan §4.2 (verification tooling
   row, about 48 sessions besides the C002-T-044 smoke).
2. Run the generator, question-tool and doctor rows (C002-TC-113, 132, the OpenCode rows of 215, 217,
   219, 221, C002-TC-230, 316, 506, 507, 509 … 515, 639), one run per Examples row, at most one rerun
   after a failure.
3. Run C002-TC-613 with the C001-CAP-02 interview and gate cases, C002-TC-634 and C002-TC-635, with
   scripted `question` answers (S-07 recorded `question_answerable_by_script: true`).
4. Not used: the infeasible-driver branch of `10-strategy.md` §4 is not taken.
5. Before every session check the ledger by the general pool's stop rule of test plan §4.1 and add the
   session's spend after it, with `provider` `openrouter` and pool `general`. At the stop, pause and
   ask P-01; never spend the reserve here.

### Resume plan (after the partial run of commit edd5fa9)

**State.** 30 sessions ran on 2026-10-19 (T-056 spend 3.92 USD; OpenRouter total 4.22 USD, all in the
general pool). 13 were valid runs: 12 passed (C002-TC-113, 132, the two OpenCode rows of 215, 217,
219, 221, 230, the two rows of 316, 506 and the TS-509 row `deepwiki-down`) and C002-TC-507 failed on
defect D-017. The other sessions were refused by OpenRouter with HTTP 402 (account credit) and are
recorded with `valid_run: false`. The task report and commit edd5fa9 say 18; the ledger and the
result files hold 17 such sessions on 16 doctor Examples rows (the TS-509 row `bare` twice, its
diagnostic rerun after the runner's provider-error fix included). The ledger is the count used here.

**Rule for refused sessions.** A session that the provider refused (`end_reason` `error` with the
provider's HTTP 402 text, `valid_run: false`) exercised no product behaviour: it counts neither as
its row's run nor as that row's one rerun (test plan §4.1). The row runs again as its first run,
with one rerun after a failure still allowed. The refused sessions stay in the ledger with their
`cost_usd` (counted in the general-pool total) and their `valid_run: false`. The 12 passed rows are
not run again.

**Order** (each session after the stop-rule check of step 5; about 30 sessions):

- R1. C002-TC-507, its one rerun after the failure, first: it shows on the real host that D-017 is
  fixed (the ripwire row `missing`, no `-32602`). If it fails again, stop the resume and report it:
  a second failure reopens the owning task (test plan §4.3), here C002-T-064.
- R2. The two rows that D-017 also blocks, C002-TC-639 and the TS-509 row `bare`, then the other 14
  refused rows: the TS-509 rows `node18` and `no-sdd`; the TS-510 row `2.0.76`; C002-TC-511, 512 and
  514; the TS-513 rows `1.4.1`, `1.4.2` and `1.5.0`; the five TS-515 rows `0.2.0`, `0.3.0`, `0.3.1`,
  `0.4.0`, `1.3.0` (run with the runner's version stamp of C002-T-064). 16 sessions at the doctor
  rate.
- R3. Step 3: C002-TC-613, 634 and 635, and the C001-CAP-02 interview and gate cases that
  `evals/targets/gate/TS-613.eval.mjs` names (`evals/cap02/TS-206`, `TS-208` … `TS-212`, `TS-222` and
  `evals/cap08/TS-802` … `TS-804`). The routing case `evals/cap02/TS-207.eval.mjs` is not paid again:
  its OpenCode run is the C002-T-044 smoke, `evals/results/t044-smoke-TS-207-2026-10-19T19-59-31-449Z.json`
  (pass, 7 turns, 0.2262 USD, OpenCode 1.18.31, the same OpenRouter model), cited in the C002-TC-613
  results with its result path. 13 sessions.

**Spend.** At the test plan §4.2 rates: 17 doctor sessions (R1, R2) × 0.25 USD + 13 sessions (R3) ×
0.35 USD = 8.80 USD, so the general pool reaches about 13.0 of 30 USD (upper bound 30 × 0.65 USD =
19.50 USD, about 23.7 USD). The measured mean of the 13 valid T-056 sessions, about 0.23 USD, is below the
planning rates.

### Rerun plan (after the resumed run of commit 5777115 and C002-T-065)

**State.** The resumed run (36 sessions, 10.57 USD; commit 5777115) passed every carried row except
two, which raised defect D-020: C002-TC-511 (OpenCode 1.18.31's `glob` lists no file inside `.sdd/`,
so the doctor decided there was no `.sdd/` and wrote no `toolchain.md`) and C002-TC-634 (the gate
rework reached the 0.50 USD spend cap in its run and its rerun). The ledger's general pool held
14.79 USD of 30 on 2026-10-20. The rows that passed are not run again, also after the variant
`file-inspection` changes the generated OpenCode texts: P-01 limited the reruns to C002-TC-511 and
C002-TC-634 (Q-rerun-scope-01, "TS-511 and TS-634 (Recommended)"); C002-T-049 replays routing and
injection on the release candidate.

**Precondition.** C002-T-065 done: the generated OpenCode package carries the variant
`file-inspection` and the OpenCode `doctor-probe` test for `.sdd/` without `glob` (C002-TC-674), the
runner puts the pinned binary first on the host's PATH (C002-TC-676), and `run.mjs` runs the
`TS-634` OpenCode row at its cap exception of 1.00 USD (C002-TC-679; C002-IF-010 §2.2), which step
X0 raises to 2.00 USD for X3 (defect D-022, Q-ts634-budget-02).

**Order** (each session after the stop-rule check of step 5; for a TS-634 session H is at least its
exception cap plus its overshoot bound, test plan §4.1 rule 1):

- X1 (ran, commit f87d885). C002-TC-511, one run: the rerun its failure allows. It passed on the
  variant `file-inspection` (the doctor read `.sdd/` without `glob`; 0.24 USD,
  `evals/results/t056-TS-511-opencode-2026-10-20T17-38-42-574Z.json`).
- X2 (ran, commit f87d885). C002-TC-634 at the cap exception of 1.00 USD (P-01, Q-ts634-budget-01);
  before it, the two 0.50 USD capped sessions of the resumed run got `valid_run: false` by the rule
  for capped sessions of test plan §4.1 (P-01 answer to Q-capped-runs-01). Its run ended with
  `end_reason` `error` after 308 s at 0.99 USD, before the second gate question: Node fetch's 300 s
  headers timeout cut the SDK's prompt request, a harness defect fixed in
  `evals/harness/opencode/driver.mjs` (untimed fetch for the SDK client, real error text) in the same
  commit (defect D-022 item 4); the ledger counts it as the row's run. Its rerun failed: it ended with
  `spend cap` at 1.11 USD during the critic re-review, before the second gate G2 question, 0.11 USD
  above its cap (defect D-022 items 1 and 2).
- X0. Before X3, the harness follows the revised contract (defect D-022; P-01 answer to
  Q-ts634-budget-02, "One run at $2 (Recommended)"): set the `TS-634` exception of `caps.mjs` and the
  OpenCode row of `TS-634.eval.mjs` to 2.00 USD; make `stopRule` of `run.mjs` take, for a selected
  cap-exception row, H = the row's exception cap + max(0.65 USD, highest recorded session cost) (test
  plan §4.1 rule 1); make the OpenCode runner write the capping step's `step_usd` into its `cap`
  record and a `step-after-cap` record per step that finishes after it (C002-IF-010 §2.2 overshoot
  rule); bring C002-TC-679 to the revised C002-TS-679 rows, C002-TC-677 to the records and
  C002-TC-673 to line 26 of the revised C002-TS-673 (defect D-021 item 1), and add a stop-rule test of
  an exception row's H. No paid session; `npm test` stays green. Then the X2 rerun's ledger entry
  gets `valid_run: false` by the rule for capped sessions (ended by the 1.00 USD cap that the
  exception raised to 2.00), keeping its `cost_usd` in the general-pool total; the X2 run's entry
  stays as recorded. Neither is a session at the 2.00 USD cap.
- X3. C002-TC-634 at the cap exception of 2.00 USD, **one run, no further rerun** (P-01,
  Q-ts634-budget-02). Before it, `run.mjs` checks the general pool's stop rule with H = 3.11 USD
  (2.00 + 1.11; 17.14 + 3.11 ≤ 30 USD on 2026-10-20). After it, check the overshoot bound of a
  session ended with `spend cap` from its `cap` and `step-after-cap` records. A pass closes the row.
  A failure is recorded in the ledger, the result file and the task report, with the transcript's
  last gate step and the spend at the cap, and the row is waived for the OpenCode release (test plan
  §6 "Exit (release, per target)"); it neither reopens a task nor buys another session.

**Spend.** Measured for X1 and X2: 0.24 + 0.99 + 1.11 = 2.35 USD; the general pool held 17.14 of
30 USD after them. Estimate for X3 at its cap: 2.00 USD, so the general pool reaches about 19.1 of
30 USD. Upper bound, the one of test plan §4.2: X3 at 3.11 USD (its 2.00 USD cap plus the overshoot
bound of §4.1 rule 1); the general pool then reaches about 20.3 of 30 USD (17.14 + 3.11).

## Verification

- `node evals/harness/run.mjs --host opencode --tier dev` with the case files of steps 2 and 3
- `node evals/harness/run.mjs --host opencode --tier dev --filter evals/targets/doctor/TS-511.eval.mjs` and
  `--filter evals/targets/gate/TS-634.eval.mjs` (rerun plan X1, X2, X3)
- `npm test -- cap06/cap-exceptions`, `npm test -- cap06/runner-caps` and `npm test -- cap01/wiring` (rerun plan X0), then `npm test`
- The general-pool total of the ledger stays within 30 USD

## Done when

- [ ] Every carried OpenCode row passes, or is reported not applicable with its record cited (C002-TC-634: passes, or is waived after its one X3 run failed)
- [ ] Every session is in the ledger; the sessions refused with HTTP 402 keep `valid_run: false` and none of them is counted as a run or a rerun of its row
- [ ] The C002-TC-613 results cite the C002-T-044 smoke result for `evals/cap02/TS-207.eval.mjs` instead of a new session
- [x] C002-TC-511 passes in the rerun plan after C002-T-065 (X1)
- [ ] Step X0 is done: the `TS-634` exception and case file at 2.00 USD, the stop rule's H for an exception row and the runner's `cap` and `step-after-cap` records; C002-TC-673, 677, 679 and the stop-rule test pass
- [ ] C002-TC-634 has exactly one session at 2.00 USD (X3), with `caps.usd` 2.00 in its result record, counted by the rule for capped sessions of test plan §4.1; it passes, or its failure is recorded in the ledger and the task report and the row is reported waived for the OpenCode release (Q-ts634-budget-02)
- [ ] The two 0.50 USD capped sessions of the resumed run and the X2 rerun ended at 1.00 USD carry `valid_run: false` in the ledger
- [ ] Progress reported: `sdd task set C002-T-056 --status done --commit <sha>`
