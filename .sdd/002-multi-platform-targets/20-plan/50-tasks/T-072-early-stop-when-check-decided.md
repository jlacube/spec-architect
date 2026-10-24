---
id: C002-T-072
title: "Fix for revision D-034: the Claude Code eval runner ends a session once the case's check is decided"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-069, C002-T-070]
implements: [C002-REQ-645, C002-NFR-105]
satisfies_ac: [C002-AC-645.1]
verified_by: [C002-TS-706, C002-TC-932]
components: [C002-COMP-009]
risk_refs: [C002-RISK-009, C002-RISK-038, C002-RISK-040]
estimate: M
report: { commit: null, completed_at: null, notes: null }
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
spend cap. Contract: C002-IF-010 §2 `stopWhen` and §2.2 "Early stop when the check is decided",
items 1 … 8; C002-REQ-645.

The task also writes the conditions of the rule-1 rows into their case files (Targets, last rows).
They are CHG-001's files, but each condition sits next to that file's `assert` and only reads what
the assert reads. The `assert` and the scenario stay unchanged, so the task is harness-adjacent and
needs no CHG-001 revision. Every condition is checked offline against the stored full transcripts
of its row (step 4).

Its tests are offline, on the stub and mock timers. It has one **paid check** on the Max plan:
`TS-225` at 3.00 USD with its condition, expected to stop near 250 s at about 1 USD notional (step
6). CHG-001's C001-T-082 (the `TS-213` rerun of its step 4) and C001-T-072 wait for this task
(`../handoff.md`).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the condition | (item 1) the option `stopWhen`, called after each record the runner appends to the transcript (an SDK message or a harness record) with the transcript so far and the `answers` so far, in the names the row reads (§3). A call that throws or returns no boolean writes `{ "event": "stop-when-error", "error": <text> }` once, and the condition is called no more |
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the stop | (items 2, 3) on the first `true` while the query is open and no stop has begun, with the same wait as for the cap after a `result` message: the record `{ "event": "check-decided", "usd": <R> }`, then the stop of the spend cap without the `cap` and `cap-close` records (deny every permission request, `interrupt()` once, at most 30 s for a `result`, close). A cap reached first keeps its stop, and the condition is not called after a stop has begun |
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the result | (item 4) the last `result` message with `subtype` `check_decided`, `is_error` `false` and `total_cost_usd` the highest cost read until the close; a session with no `result` gets one built as for the cap stop. `metrics.result_subtype` `check_decided`, `metrics.cost_usd` the actual cost |
| modify | `evals/harness/run.mjs` › the case-row options passed to `runSession` | pass the row's `stopWhen` to the Claude Code eval runner. The OpenCode and Copilot CLI runners get none and ignore it (item 7). Item 8 (no injection row gives `stopWhen`) is checked by a supporting test over the case files of §5.1, not by the runner |
| modify | `evals/harness/runners/sdk-stub.mjs` | an AskUserQuestion in a chosen model call, whose `answer` record the condition can see; after an interrupt, a permission request and a result at once (`error_during_execution`, a given cost), as C002-TS-706 rows 1 … 4 need |
| modify | `tests/integration/cap06/claude-runner.test.ts`, `tests/integration/cap06/runner-caps.test.ts`, `tests/integration/cap06/copilot-runner.test.ts` | C002-TC-932: the six rows of C002-TS-706, on mock timers |
| modify | `evals/cap02/TS-213.eval.mjs`, `TS-215.eval.mjs`, `TS-221.eval.mjs`, `TS-223.eval.mjs`, `TS-224.eval.mjs`, `TS-225.eval.mjs`; `evals/cap03/TS-318.eval.mjs` (three rows); `evals/cap05/TS-507.eval.mjs`, `TS-508.eval.mjs`; `evals/cap07/TS-711.eval.mjs`; `evals/cap08/TS-802.eval.mjs` | the `stopWhen` of each rule-1 row (list 1 of C002-IF-010 §2.2 "Sessions of CHG-001 tasks", 13 rows). Each condition returns `true` once no later event can change the outcome of that row's `assert`, pass or failure. It reads only the transcript and `answers`, the events the assert reads. Examples: the `answer` record of the conductor's AskUserQuestion with the blocking question (`TS-215`, `TS-225`); the cartographer hand-back's `task_notification` that holds the scope question (`TS-223`). A row whose assert also reads a later event, or the workspace at the session's end, gets a condition at the last such event, or none. A row without a condition runs to its end or its caps (item 6). No other change to these files: the `assert`, the prompt, the answers and the caps stay as they are, and no injection row gets a condition |
| add | `tests/integration/cap06/stop-conditions.test.ts` | the supporting check of the 13 conditions (step 4), offline over the stored transcripts |

## Preconditions

- C002-T-069 and C002-T-070 done (the runner-applied cap and its stop; the 3.00 USD rule-1 cap).
- G2 re-approved after the D-034 revision, and G3 after this plan revision (gate records of
  `../../change.md`).
- **Paid check (step 6):** the `TS-225` session at its rule-1 cap is an allowed use of that row only
  once C002-IF-010 §2.2 names C002-T-072 step 6 in the `TS-225` row, as it names C002-T-069 step 6 in
  the `TS-224` row (plan critic CR-68). The spec owners make that edit; step 6 waits for it.
- E-CC with `--auth subscription` on P-01's Max plan; P-01's week stays at most 95 % used
  (Q-weekly-reset-01), and the session spends from no pool (test plan §4.1 rule 7).

## Step outline (no production code)

1. **Tests first.** Extend sdk-stub and write C002-TC-932, each Examples row its own `test()` whose
   name starts with `C002-TS-706`, on the mock timers of `node:test`. Watch rows 1 and 3 fail: today
   no condition is called and every row runs to its cap. Rows 2, 4, 5 and 6 may pass already; the
   report says which.
2. **Runner.** The condition calls, the `stop-when-error` record, the stop with the `check-decided`
   record, the `check_decided` result, and the `run.mjs` pass-through. Run C002-TC-932, then `npm test -- cap06/claude-runner` (C002-TC-928 … 930
   unchanged), `npm test -- cap06/cap-exceptions` and `npm test -- cap06/runner-caps`.
3. **Conditions.** Write the `stopWhen` of each rule-1 row next to its `assert`, from the event the
   assert reads last. Record each in the task report: row, condition and the assert lines it rests
   on. A row that gets no condition is named with the reason.
4. **Offline check of the conditions** (C002-RISK-040). For each row with a condition, take every
   stored transcript of that row under `evals/results/transcripts/`: the `t082-d019`, `t082-d018` and
   earlier sessions, the passing and the failing ones. Find the first record at which the condition
   returns `true`, and check that the row's `assert`, run on the transcript cut there, gives the same
   pass or fail as on the full transcript. A row whose `assert` reads the workspace is checked on the
   transcript part only, and the report says so. A condition that changes a verdict, or that is never
   `true` on a passing transcript, is wrong and is fixed before step 6. The report gives, per row,
   the transcripts checked, the cut point (record index, time and cost) and the verdicts. This is a
   supporting test of C002-TC-932 and writes no file.
5. Run `npm test` and `npm run check`.
6. **Paid check on the Max plan** (P-01 answer to Q-early-stop-01, "one small paid check"; owning
   step of `../10-strategy.md` §3a). One session of `TS-225` with `--host claude-code --auth
   subscription --cap-exception --tier dev --label t072-check`, at its rule-1 cap of 3.00 USD, with
   its condition. It is no run of any tier and counts toward no pass rule of C001-T-082 or
   C001-T-072. Expected: the session stops near 250 s at about 1 USD notional. The task report
   states:
   - the `check-decided` record (its time and `usd`), the recorded cost and the time to the close;
   - that `metrics.result_subtype` is `check_decided`, that the `assert` passes, and that no `cap`
     record was written;
   - every permission request after the `check-decided` record, each denied;
   - the search of T-069 step 6(d) for budget and turn wording, with no hit;
   - the gap to the expectation: a stop later than 400 s or above 1.50 USD goes to the conductor with
     the transcript before any other session uses the conditions.
7. Report the commit and the check, and tell the conductor so that C001-T-082 can rerun `TS-213` and
   C001-T-072 can run. The commit changes the eval harness and CHG-001 case files only, which ship in
   no package, so it does not move the release-candidate commit of C002-T-071.

## Verification

- `npm test -- cap06/claude-runner`, `npm test -- cap06/stop-conditions`, `npm test -- cap06/cap-exceptions`, `npm test -- cap06/runner-caps`, `npm test -- cap06/copilot-runner`
- `npm test`, `npm run check`
- Step 6: `node evals/harness/run.mjs --host claude-code --auth subscription --cap-exception --tier dev --label t072-check --only TS-225 evals/cap02/TS-225.eval.mjs`

## Done when

- [ ] The Claude Code eval runner calls `stopWhen` after each transcript record, stops at its first `true` while the query is open with the `check-decided` record and no `cap` record, records `check_decided` with the highest cost read, writes `stop-when-error` once for a failing condition, and keeps a cap that comes first; the OpenCode and Copilot CLI runners ignore it; C002-TC-932 (six rows) passes
- [ ] `run.mjs` passes the row's `stopWhen` to the Claude Code eval runner, and a supporting test shows that no row of the injection case sets of C002-IF-010 §5.1 gives one
- [ ] The rule-1 rows carry their conditions, each recorded in the task report, with no other change to their case files; the offline check of step 4 gives the same verdict on the cut and the full transcript for every stored transcript
- [ ] `npm test` and `npm run check` green
- [ ] The paid check ran once (`TS-225`, about 1 USD notional) and the task report gives the items of step 6: `check_decided`, the assert passed, no budget or turn wording, and the stop time and cost against the expectation
- [ ] The task report names C001-T-082 (the `TS-213` rerun) and C001-T-072 as waiting for this task
- [ ] Progress reported: `sdd task set C002-T-072 --status done --commit <sha>`
