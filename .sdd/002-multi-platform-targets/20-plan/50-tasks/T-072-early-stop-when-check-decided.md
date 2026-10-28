---
id: C002-T-072
title: "Fix for revision D-034: the Claude Code eval runner ends a session once the case's check is decided"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: done
depends_on: [C002-T-069, C002-T-070]
implements: [C002-REQ-645, C002-REQ-646, C002-NFR-105]
satisfies_ac: [C002-AC-645.1, C002-AC-646.1]
verified_by: [C002-TS-706, C002-TS-707, C002-TC-932, C002-TC-933]
components: [C002-COMP-009]
risk_refs: [C002-RISK-009, C002-RISK-038, C002-RISK-040]
estimate: M
report: { commit: f53b355, completed_at: 2026-10-28, notes: "Mechanism verified in the paid check (check-decided at 575.8 s, 1.02 USD, assert pass; lateness from the cartographer, not the runner). Conductor decisions: TS-224 has no condition (a pass is only settled at the end; a condition could pass a failing session) and TS-507 none (assert reads the workspace, IF-010 §2.2 item 1) — 5 of the 7 named rows. Step 4: all verdicts unchanged. C001-T-072 can start." }
---

# C002-T-072 — Fix for revision D-034: the Claude Code eval runner ends a session once the case's check is decided

## Intent

In the `t082-d019` run of C001-T-082, every rule-1 Claude Code session ran to the 3.00 USD cap long
after the step its case checks. The release gate's rule-1 sessions would then need several
five-hour windows of P-01's plan, and the week has no free reset (defect D-034; P-01 answers to
Q-early-stop-01, "Stop when checked (Recommended)", and Q-weekly-reset-01, `../questions-log.md`).

A case row may now give `stopWhen(transcript, answers)`. The Claude Code eval runner calls it after
each transcript record and ends the session at its first `true`, as at the spend cap but without the
`cap` records. It records the distinct end `check_decided`, which is a run and not an end at the
spend cap. A faulty condition, one that throws or returns no boolean, is written once as
`stop-when-error`, dropped, and the session runs on to its end or its caps (C002-REQ-646). Contract:
C002-IF-010 §2 `stopWhen` and §2.2 "Early stop when the check is decided", items 1 … 8;
C002-REQ-645, C002-REQ-646.

The task also writes the conditions of the rule-1 rows that can carry one into their case files
(Targets, last rows). These are CHG-001's files, but each condition sits next to that file's `assert`
and reads only what the assert reads. The `assert` and the scenario stay unchanged, so the task is
harness-adjacent and needs no CHG-001 revision. By the conductor's decisions on plan critics CR-74
and CR-76, **six rule-1 rows get no condition** and run to their end or their caps as before:
- `TS-213`, `TS-318-00-ideation`, `TS-318-10-spec`, `TS-318-20-plan` and `TS-711`, because their
  asserts read the workspace;
- `TS-508`, because it has no passing stored transcript, and neither has `TS-711`.

The seven others get a condition: `TS-215`, `TS-221`, `TS-223`, `TS-224`, `TS-225`, `TS-507` and
`TS-802`. Each is checked offline against the stored transcripts of its row (step 4).

Its tests are offline, on the stub and mock timers. It has one **paid check** on the Max plan:
`TS-225` at 3.00 USD with its condition, expected to stop near 250 s at about 1 USD notional (step
6). **Only C001-T-072 waits for this task** (plan critic CR-77): C001-T-082 is done, and its `TS-213`
row gets no condition.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the condition | (item 1) the option `stopWhen`, called after each record the runner appends to the transcript (an SDK message or a harness record) with the transcript so far and the `answers` so far, in the names the row reads (§3). A call that throws or returns no boolean writes `{ "event": "stop-when-error", "error": <text> }` once, and the condition is called no more |
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the stop | (items 2, 3) on the first `true` while the query is open and no stop has begun, with the same wait as for the cap after a `result` message: the record `{ "event": "check-decided", "usd": <R> }`, then the stop of the spend cap without the `cap` and `cap-close` records (deny every permission request, `interrupt()` once, at most 30 s for a `result`, close). A cap reached first keeps its stop, and the condition is not called after a stop has begun |
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the result | (item 4) the last `result` message with `subtype` `check_decided`, `is_error` `false` and `total_cost_usd` the highest cost read until the close; a session with no `result` gets one built as for the cap stop. `metrics.result_subtype` `check_decided`, `metrics.cost_usd` the actual cost |
| modify | `evals/harness/run.mjs` › the case-row options passed to `runSession` | pass the row's `stopWhen` to the Claude Code eval runner. The OpenCode and Copilot CLI runners get none and ignore it (item 7). Item 8 (no injection row gives `stopWhen`) is checked by a supporting test over the case files of §5.1, not by the runner |
| modify | `evals/harness/runners/sdk-stub.mjs` | an AskUserQuestion in a chosen model call, whose `answer` record the condition can see; after an interrupt, a permission request and a result at once (`error_during_execution`, a given cost), as C002-TS-706 rows 1 … 4 need |
| modify | `tests/integration/cap06/claude-runner.test.ts`, `tests/integration/cap06/runner-caps.test.ts`, `tests/integration/cap06/copilot-runner.test.ts` | C002-TC-932: the six rows of C002-TS-706, on mock timers. C002-TC-933 (`claude-runner.test.ts`): the four rows of C002-TS-707, a faulty condition dropped |
| modify | `evals/cap02/TS-215.eval.mjs`, `TS-221.eval.mjs`, `TS-223.eval.mjs`, `TS-224.eval.mjs`, `TS-225.eval.mjs`; `evals/cap05/TS-507.eval.mjs`; `evals/cap08/TS-802.eval.mjs` | the `stopWhen` of these seven rule-1 rows. Each condition returns `true` once no later event can change the outcome of that row's `assert`, pass or failure. It reads only the transcript and `answers`, the events the assert reads. Examples: the `answer` record of the conductor's AskUserQuestion with the blocking question (`TS-215`, `TS-225`); the cartographer hand-back's `task_notification` that holds the scope question (`TS-223`). A row whose step-4 check finds no passing stored transcript, or a verdict that changes, gets no condition either, and the report names it. No other change to these files: the `assert`, the prompt, the answers and the caps stay as they are. `TS-213`, the three `TS-318` rows, `TS-508`, `TS-711` and every injection row get no condition (CR-74, CR-76; C002-IF-010 §2.2 item 8) |
| add | `evals/harness/check-stop-conditions.mjs` (a script beside `regrade.mjs`, not a test) | the report-only check of step 4 over the stored transcripts, outside `npm test`, since those transcripts are not committed (plan critic CR-76) |

## Preconditions

- C002-T-069 and C002-T-070 done (the runner-applied cap and its stop; the 3.00 USD rule-1 cap).
- G2 re-approved after the D-034 revision, and G3 after this plan revision (gate records of
  `../../change.md`).
- **Paid check (step 6): met** (plan critic CR-79). C002-IF-010 §2.2 names C002-T-072 step 6 in the
  `TS-225` row (spec commit f3581e8), as it names C002-T-069 step 6 in the `TS-224` row.
- E-CC with `--auth subscription` on P-01's Max plan; P-01's week stays at most 95 % used
  (Q-weekly-reset-01), and the session spends from no pool (test plan §4.1 rule 7).

## Step outline (no production code)

1. **Tests first.** Extend sdk-stub and write C002-TC-932 and C002-TC-933, each Examples row its own
   `test()` whose name starts with its TS ID, on the mock timers of `node:test`. Watch C002-TC-932
   rows 1 and 3 and every C002-TC-933 row fail: today no condition is called, no `stop-when-error`
   record is written, and every row runs to its cap. C002-TC-932 rows 2, 4, 5 and 6 may pass already;
   the report says which.
2. **Runner.** The condition calls, the `stop-when-error` record, the stop with the `check-decided`
   record, the `check_decided` result, and the `run.mjs` pass-through. Run C002-TC-932 and
   C002-TC-933, then
   `npm test -- cap06/claude-runner` (C002-TC-928 … 930 unchanged), `npm test -- cap06/cap-exceptions`
   and `npm test -- cap06/runner-caps`.
3. **Conditions.** Write the `stopWhen` of the seven rows next to their `assert`, from the event the
   assert reads last. Record each in the task report: row, condition and the assert lines it rests
   on. The six rows without a condition are named with their reason (CR-74, CR-76).
4. **Offline check of the conditions** (C002-RISK-040; plan critics CR-75, CR-76). Run
   `node evals/harness/check-stop-conditions.mjs` on REF-WIN. It is a report-only check outside
   `npm test`, since the stored transcripts under `evals/results/transcripts/` are git-ignored, and it
   writes no file. For each of the seven rows, it takes every stored transcript of that row (the
   `t082-d019`, `t082-d018` and earlier sessions, passing and failing):
   - find the first record at which the condition returns `true`;
   - cut the transcript there, and **append a synthetic stop tail**: one `{ "event":
     "check-decided", "usd": <the cost read by then> }` record and one `result` message with
     `subtype` `check_decided`, as a stopped session ends (CR-75);
   - run the row's `assert` on that transcript, and check that it gives the same pass or fail as on
     the full transcript.

   A condition that changes a verdict, or that is never `true` on a passing transcript, is wrong and
   is fixed before step 6. A row with no passing stored transcript gets no condition (CR-76). The task
   report gives, per row, the transcripts checked, the cut point (record index, time and cost) and
   the verdicts.
5. Run `npm test` and `npm run check`.
6. **Paid check on the Max plan** (P-01 answer to Q-early-stop-01, "one small paid check"; owning
   step of `../10-strategy.md` §3a). One session of `TS-225` with `--host claude-code --auth
   subscription --cap-exception --tier dev --label t072-check`, at its rule-1 cap of 3.00 USD, with
   its condition. It is no run of any tier and counts toward no pass rule of C001-T-072. Expected:
   the session stops near 250 s at about 1 USD notional.
   - **Done-check: the mechanism** (plan critic CR-78). The transcript holds one `check-decided`
     record. `metrics.result_subtype` is `check_decided`, no `cap` record was written, and every
     permission request after the `check-decided` record was denied.
   - **Reported, not required:** the `assert` result; the time and `usd` of the `check-decided`
     record; the recorded cost and the time to the close; the search of T-069 step 6(d) for budget
     and turn wording; and the gap to the expectation. A stop later than 400 s or above 1.50 USD goes
     to the conductor with the transcript.
   - **Fallback: one session, with the conductor's approval** (CR-78). If the session ends without a
     `check-decided` record, for example because the model did not ask the blocking question or a cap
     came first, the conductor may approve one further `TS-225` session, under the same command and
     label. No other session runs. If that one also shows no `check-decided` record, the mechanism
     stays shown by C002-TC-932 only, and the task report says so.
7. Report the commit and the check, and tell the conductor so that C001-T-072 can run. The commit
   changes the eval harness and CHG-001 case files only, which ship in no package, so it does not
   move the release-candidate commit of C002-T-071.

## Verification

- `npm test -- cap06/claude-runner`, `npm test -- cap06/cap-exceptions`, `npm test -- cap06/runner-caps`, `npm test -- cap06/copilot-runner`
- `npm test`, `npm run check`
- Step 4 (report-only): `node evals/harness/check-stop-conditions.mjs`
- Step 6: `node evals/harness/run.mjs --host claude-code --auth subscription --cap-exception --tier dev --label t072-check --only TS-225 evals/cap02/TS-225.eval.mjs`

## Done when

- [ ] The Claude Code eval runner calls `stopWhen` after each transcript record, stops at its first `true` while the query is open with the `check-decided` record and no `cap` record, records `check_decided` with the highest cost read, writes `stop-when-error` once for a failing condition, and keeps a cap that comes first; the OpenCode and Copilot CLI runners ignore it; C002-TC-932 (six rows) passes
- [ ] A condition that throws or returns no boolean, at its first or a later call, is written once as `stop-when-error`, called no more, and the session runs on to its cap or its own end; C002-TC-933 (four rows) passes
- [ ] `run.mjs` passes the row's `stopWhen` to the Claude Code eval runner, and a supporting test shows that no row of the injection case sets of C002-IF-010 §5.1 gives one
- [ ] `TS-215`, `TS-221`, `TS-223`, `TS-224`, `TS-225`, `TS-507` and `TS-802` carry their conditions, each recorded in the task report, with no other change to their case files; `TS-213`, `TS-318-00-ideation`, `TS-318-10-spec`, `TS-318-20-plan`, `TS-508` and `TS-711` carry none
- [ ] The report-only check of step 4 gives, for every stored transcript of the seven rows, the same verdict on the cut transcript with its synthetic stop tail as on the full one, and the report lists them
- [ ] `npm test` and `npm run check` green
- [ ] The paid check ran (one `TS-225` session, a second only with the conductor's approval, about 1 USD notional each) and showed the mechanism: a `check-decided` record, `check_decided`, no `cap` record, the denials. The report gives the assert result, the stop time and cost against the expectation, and the wording search
- [ ] The task report names C001-T-072 as waiting for this task
- [ ] Progress reported: `sdd task set C002-T-072 --status done --commit <sha>`
