---
id: C002-T-069
title: "Fix for revision D-031: the Claude Code eval runner applies the spend cap itself and shows the model no budget"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: in-progress
depends_on: [C002-T-048, C002-T-068]
implements: [C002-REQ-611, C002-REQ-642, C002-REQ-643, C002-REQ-644, C002-NFR-105]
satisfies_ac: [C002-AC-611.1, C002-AC-642.1, C002-AC-642.2, C002-AC-643.1, C002-AC-644.1]
verified_by: [C002-TS-614, C002-TS-679, C002-TS-702, C002-TS-703, C002-TS-704, C002-TS-705, C002-TC-614, C002-TC-679, C002-TC-928, C002-TC-929, C002-TC-930, C002-TC-931]
components: [C002-COMP-009]
risk_refs: [C002-RISK-009, C002-RISK-038, C002-RISK-039]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-069 — Fix for revision D-031: the Claude Code eval runner applies the spend cap itself and shows the model no budget

## Intent

Claude Code 2.1.299 shows the model the spend cap that the Agent SDK passes on as `maxBudgetUsd`.
The conductor and its specialists then ration or stop their work, which no real user's session does
(defect D-031, found in C001-T-082). P-01 answered Q-budget-hide-01 with "Hide the budget
(Recommended)" (`../questions-log.md` round 2026-10-24).

The Claude Code eval runner therefore passes the Agent SDK the turn cap only, reads the session's
notional cost itself, and stops the session at the cap. A session that it stopped records
`error_max_budget_usd` as before, so the ledgers, the rules of C002-IF-010 §2.2 "Sessions of CHG-001
tasks" and every pass rule stay as they are. A session that ended by itself keeps its own result.

The contract is C002-IF-010 §2 (`maxTurns`, `maxBudgetUsd`) and §2.2: "Budget hidden from the model"
and "Claude Code spend cap", items 1 … 8, as revised after the critic review (CR-103 … CR-108,
CR-113). The requirements are C002-REQ-642, C002-REQ-643 and C002-REQ-644 (story C002-US-608), and
the measure is C002-NFR-105. The OpenCode and Copilot CLI runners do not change; C002-TS-705
checks what they give their hosts.

The task is the follow-up of C002-T-048, whose step X0 built the Agent SDK stub, and of C002-T-068.
Its tests are offline, on the stub and on mock timers. It has **one paid check** on P-01's Max plan,
about 3 USD notional, which Q-budget-hide-01 allowed (step 6). CHG-001's C001-T-082 (the reruns of
C001-TC-223 and C001-TC-224) and C001-T-072 wait for it (`../handoff.md`, Cross-change dependency).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the query options | (§2.2 item 1) pass `maxTurns` as before. Pass no `maxBudgetUsd` and no `taskBudget`, and no spend or turn cap in the prompt, the system prompt or `extraArgs`. Keep track of whether the **query is open**: from the `query()` call until the runner begins to stop the session or the stream ends. `runSession`'s signature and defaults stay as they are (C002-RISK-009); `maxBudgetUsd` is still accepted and becomes the runner's own cap |
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, readings and the queue rule | (items 2, 3) R, the highest `total_cost_usd` read so far, from each `result` message and from each answer to `usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET({ skipBehaviors: true })` (`session.total_cost_usd`). A **trigger** is an assistant message, of the session agent or a subagent, whose `message.id` is new in the session. The queue rule: no request for an ID already seen; at a trigger, a request when none is open; at most one open; the triggers that arrive while one is open coalesce into exactly one follow-up when it ends (answered or failed), none if no trigger arrived. R is compared with the cap after each usage answer and each `result` message |
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the stop | (item 4) at the first comparison, while the query is open, where R ≥ the cap. When the stream's last message is a `result` message, wait for the next stream message first: stop at it if one arrives, and treat the session as ended by itself if the stream ends. The stop, in order: the `cap` record; every later permission request denied, AskUserQuestion included, with the usual `<tool> is not available in this evaluation`; `interrupt()` once, the stream read until a `result` message after the interrupt or 30 s; `abortController.abort()`; the `cap-close` record |
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the result | (items 5, 6) **stopped by the runner:** the last `result` message, with `subtype` `error_max_budget_usd`, `is_error` `true` and `total_cost_usd` the final R, never cut to the cap, its other fields kept; with no `result` message, one with those three fields, `num_turns` `null` and `modelUsage` `{}`. **Ended by itself:** the last `result` message as it came, `success` or `error_max_turns` keeping its `subtype` and `total_cost_usd`, also at or above the cap. The transcript keeps the SDK's own messages as they came |
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, records | (item 7) one harness record per reading, `{ "event": "usage", "source", "usd", "message_id", "sent_t", "error"?, "ignored"? }`, and at the close after a stop `{ "event": "cap-close", "usd", "usd_at_cap", "after_cap_usd", "overshoot_usd", "closed_by" }`. `evals/harness/run.mjs` adds ` · overshoot <overshoot_usd> USD` to the session's standard-output line |
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the failed reading | (item 8) a reading fails when the request is refused, no answer arrives within **30 s**, or the answer gives no finite `session.total_cost_usd` of at least 0. The failure **counts** only if, 5 s after it (the settle time), the stream has not ended and no stop has begun; otherwise its `usage` record gives `ignored` `true` and R stays the highest cost read. A failure that counts stops the session as at the cap, without the `cap` and `cap-close` records, and `runSession` rejects with `claude-code spend check failed: <reason>; notional cost read <R> USD`, with the property `costUsd` R |
| modify | `evals/harness/run.mjs` › the Claude Code session step and the ledger write | (item 8; critic CR-113) before the rejection reaches the run, append one spend ledger entry and rethrow: date, task and step; `case` and `row`; `host` `claude-code`; `provider` `claude-max` under `--auth subscription`, else `anthropic-key`; `auth`; `cost_usd` R; `caps_usd`; `cost_source` `claude-code spend check failed`; `valid_run` `false`; `pass` `false`; `end_reason` `null`; `result` `null`; `ended_at`. No result record is written |
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, and the result records of `evals/harness/run.mjs` | (plan critic CR-66, conductor decision) each Claude Code result record gives `claude_code_version`, the value that the SDK's `init` message carries, or `null`. The version is recorded, never refused. A version other than the one of the latest C002-T-069 paid check means the check is repeated before release runs (C002-RISK-039) |
| modify | `evals/harness/runners/sdk-stub.mjs` | on the mock timers of `node:test`: model calls started on a schedule (one per second in C002-TS-702 and C002-TS-679), each streaming its assistant message once per content block with one ID and **ending after its last block**; a turn counted per ended call; usage answers after a per-row delay, giving the cost of the calls ended by then, or refusing, giving `-1`, giving no `session.total_cost_usd`, never answering, or refusing with `Query closed before response received` at the close; `interrupt()` and the close recorded; a subagent call in parallel; a self-ended session (`success` result, then the stream ends); and per row after the interrupt: the running call ended, a permission request, a `result` message at once, a new message ID, or nothing. It records `maxBudgetUsd` and `taskBudget` when given, so the tests can show that none is passed, and it ends a session itself only at `maxTurns` or by a row's self-end |
| modify | `tests/integration/cap06/claude-runner.test.ts` | the three Claude Code rows of C002-TC-614 as revised; C002-TC-928 (six rows), C002-TC-929 (four rows), C002-TC-930 (six rows, through `main` of `run.mjs` with a temporary ledger); the supporting tests of C002-TC-928 (the four bound conditions) and of C002-TC-930 (the pinned SDK) |
| modify | `tests/integration/cap06/cap-exceptions.test.ts` | the Claude Code session rows of C002-TC-679: the stub at 0.25 USD per model call, one call per second; a row at its own 0.50 USD cap stopped after the second call, a row at the rerun cap after the sixth, and not at 0.50 USD |
| modify | `tests/integration/cap06/runner-caps.test.ts`, `tests/integration/cap06/copilot-runner.test.ts` | C002-TC-931 (two rows): what the OpenCode and the Copilot CLI runners give their stub hosts holds no budget, other than Copilot CLI's `--max-ai-credits 50` |

## Preconditions

- C002-T-048 done (sdk-stub, `--auth`, the subscription class). C002-T-068 done: the paid check runs
  `TS-224` with `--cap-exception`, which needs its row, and both tasks edit `cap-exceptions.test.ts`.
- G2 re-approved after the D-031 revision and its critic fixes, and G3 after this plan revision
  (gate records of `../../change.md`).
- The Agent SDK stays pinned at 0.3.296 (`evals/package.json`). Claude Code is the desktop-bundled
  binary of `CLAUDE_CODE_EXECPATH`, 2.1.299 when the D-031 evidence and assumption were taken; the
  harness cannot pin it. So every result records `claude_code_version`, and a change of either
  version repeats the paid check of step 6 before any release run of the Claude Code subscription
  class (C001-T-072, C002-T-048 step 5) (plan critic CR-66; C002-RISK-039). The version is recorded,
  never refused.
- For step 6: E-CC with `--auth subscription` on P-01's Max plan. P-01 watches the plan's usage limits
  (test plan §4.1 "Eval auth"). The sessions spend from no pool (rule 7).

## Step outline (no production code)

1. **Tests first.** Extend sdk-stub and write C002-TC-928 … 931 and the revised Claude Code rows of
   C002-TC-614 and C002-TC-679, each Examples row its own `test()` whose name starts with its TS ID.
   All Claude Code rows run on the mock timers of `node:test`, so the request delays, the 30 s read
   timeout, the 5 s settle time and the 30 s wait after `interrupt()` take no real time; no option or
   variable changes them. Watch the Claude Code tests fail against today's runner, which passes
   `maxBudgetUsd` to the SDK and sends no usage request. C002-TC-931 is expected to pass at once (the
   OpenCode and Copilot CLI runners are unchanged); a failure there is a defect against C002-REQ-642.
2. **Options.** Remove `maxBudgetUsd` from the query options, keep `maxTurns`, and track whether the
   query is open. Record `claude_code_version`. Run C002-TC-929.
3. **Readings and queue.** R from `result` messages and usage answers; the trigger and queue rule;
   the `usage` records; the 30 s read timeout. Run the queue assertions of C002-TC-928 (no request for
   a seen ID, at most one open, the coalesced follow-up of row 3).
4. **Stop and result.** The stop with the wait after a `result` message, the cap record, the denial,
   `interrupt()`, the 30 s wait, the close and the `cap-close` record; the result of a stopped
   session and of a self-ended one; the overshoot on the standard-output line. Run C002-TC-928, its
   bound-condition supporting test, and the Claude Code rows of C002-TC-614 and C002-TC-679.
5. **Failed reading.** The three failure cases, the 5 s settle rule, the ignored failure, the
   rejection with `costUsd`, and the ledger entry that `run.mjs` appends before it rethrows. Run
   C002-TC-930 with its supporting test. Then run `npm test -- cap06/claude-runner`, `npm test --
   cap06/cap-exceptions`, `npm test -- cap06/runner-caps`, `npm test -- cap06/copilot-runner`,
   `npm test -- unit/evals` (the auth tests of C002-T-060 unchanged), `npm test` and `npm run check`.
6. **Paid check on the Max plan** (P-01 answer to Q-budget-hide-01; about 3 USD notional; owning step
   of `../10-strategy.md` §3a). Run on E-CC with `--host claude-code --auth subscription` and the
   result-file label `t069-check`:
   - **One session at the cap:** `TS-216` (`evals/cap02/TS-216.eval.mjs`) at its own 0.50 USD and 30
     turns, without `--cap-exception`. Its latest session ended at that cap (C002-IF-010 §2.2
     evidence table).
   - **One session at 1.50 USD:** `TS-224` (`evals/cap02/TS-224.eval.mjs`) with `--cap-exception`, its
     rule-1 cap. This one session is an allowed use of the `TS-224` rule-1 row of C002-IF-010 §2.2,
     beside C001-T-082 step 4 and C001-T-072 (plan critic CR-68, the conductor's decision within
     P-01's approved spend of Q-budget-hide-01; C002-NFR-105 names it). No other session of the row
     runs in this task.
   - **Fallback if `TS-216` does not reach the cap** (plan critic CR-69). If its session ends below
     0.50 USD, item (c) and the stop part of (a) are not shown. Then run **one** further session of a
     cheap case, `TS-1001` (`evals/cap10/TS-1001.eval.mjs`, 0.094 USD in the Q-cap-exc-02
     measurement), through the real Agent SDK at a cap of 0.05 USD. The session is started by a
     one-off script, kept out of the shipped code, that calls `runSession` for that row with
     `maxBudgetUsd` 0.05 and `--auth subscription`. A cap below 0.50 USD needs no exception
     (C002-IF-010 §2.2), and no case file changes. It is not a run of `TS-1001`. If that session also
     ends below its cap, the task report says so and the stop stays shown by C002-TC-928 only. The
     conductor then decides with P-01 whether a third session runs. The task makes at most three
     sessions, within the 3 USD notional.

   None of these sessions is a run of any tier: none counts toward a pass rule of C001-T-082 or
   C001-T-072. A session that ends with `claude-code spend check failed` gets its ledger entry (item
   8) and is a refuted assumption. From the transcripts, their `usage`, `cap`, `cap-close` and
   permission records, and the result records, the task report states:
   - **(a) The D-031 assumption of item 8** (revised for plan critic CR-67): whether every usage
     request was answered during a turn within 30 s, and how the last reading before each `result`
     message compares with that message's `total_cost_usd`. Whether a usage request itself makes a
     model call, told in two ways:
     - **Per model, between readings.** `session.model_usage` of each answer is compared, model by
       model, with the previous answer's. A model whose usage rose with no assistant message of that
       model between the two readings marks a model call that the request caused. The report lists
       each such rise and tells it from the CLI's own side calls (the `claude-haiku-5-5` entry of a
       result) by when it occurs: with each request, or not.
     - **Direct probe.** Once in each session, at a point where no message is pending, two usage
       requests are sent back to back, the second as soon as the first is answered, with no message
       streamed between them. Both answers must give the same `session.total_cost_usd` and the same
       `session.model_usage`. A difference refutes the assumption. The probe is a check-only mode of
       this step, which the shipped runner does not use.
   - **(b) Answer times and frequency:** from the `usage` records (`sent_t` and `t`), the number of
     usage requests sent, answered, failed and ignored; the answer time of each request (median, 95th
     percentile, largest); the readings per distinct message ID; and the coalesced follow-ups. The
     usage request reads the claude.ai usage endpoint, so this is the measured basis of
     C002-RISK-039's bound. An answer time above 30 s is a failed reading and refutes the assumption.
   - **(c) The stop and the overshoot bound:** for each session that the runner stopped, R at the
     `cap` record, the recorded cost, `overshoot_usd` and `closed_by` of the `cap-close` record. Then
     each of the **four bound conditions** of C002-IF-010 §2.2 item 7, decided from the transcript,
     one line each with the records it rests on:
     1. every `usage` record before the `cap` record gives a `usd` below `cap_usd`, and the `cap`
        record's `usd` is that of the first `usage` record at or above it;
     2. no permission request was allowed after the `cap` record;
     3. no assistant message with a message ID not seen before arrives after the first `result`
        message that follows the `cap` record;
     4. the `cap-close` record follows the `cap` record by at most 30 s plus the close.

     A breached condition breaches the Claude Code measure of C002-NFR-105 and is a defect against
     C002-REQ-643.
   - **(d) No budget or turn statement** (revised for plan critic CR-69): the model text of every
     message of the session agent and of each subagent is searched for these terms. Spend: `budget`,
     `USD`, `spending limit`, `remaining`, `$` followed by a figure, and the denial text `Budget limit
     reached`. Turns: `turn`, `turns left`, `turn limit`, `max turns`. Every hit is quoted with its
     context. A hit that refers to a session budget or a turn limit the case did not give fails the
     check.
   - **(e) Versions:** the `claude_code_version` and the SDK version of each session, which later
     sessions compare against (plan critic CR-66).

   A refuted assumption, a breached bound condition, or a budget or turn statement is a spec defect
   against C002-REQ-644, C002-REQ-643 or C002-REQ-642 (`sdd defect add --ref <REQ>`): the task stays
   in progress, and the CHG-001 tasks keep waiting.
7. Report the commit and the check, and tell the conductor so that C001-T-082 and C001-T-072 can run.
   The commit changes the eval harness only, which ships in no package, so it does not move the
   release-candidate commit of C002-T-048 for C002-T-052 or C002-T-055.

## Verification

- `npm test -- cap06/claude-runner`, `npm test -- cap06/cap-exceptions`, `npm test -- cap06/runner-caps`, `npm test -- cap06/copilot-runner`, `npm test -- unit/evals`
- `npm test`, `npm run check`
- Step 6: `node evals/harness/run.mjs --host claude-code --auth subscription --tier dev --label t069-check --only TS-216 evals/cap02/TS-216.eval.mjs`, and `node evals/harness/run.mjs --host claude-code --auth subscription --cap-exception --tier dev --label t069-check --only TS-224 evals/cap02/TS-224.eval.mjs` (result files `evals/results/t069-check-<row>-<time>.json`)

## Done when

- [ ] The Claude Code eval runner passes `maxTurns` and no `maxBudgetUsd` or `taskBudget`, and no cap in the prompt, the system prompt or `extraArgs`; C002-TC-929 (four rows) passes, and C002-TC-931 (two rows) shows the OpenCode and Copilot CLI inputs free of a budget other than `--max-ai-credits`
- [ ] It reads the notional cost by the queue rule, writes a `usage` record per reading, stops at the first reading at or above the cap while the query is open (waiting for the next message after a `result`), writes the `cap` and `cap-close` records, records `error_max_budget_usd` with the highest cost read for a stopped session, and keeps a self-ended session's own result; C002-TC-928 (six rows), its bound-condition supporting test, and the Claude Code rows of C002-TC-614 and C002-TC-679 pass
- [ ] A failed reading that counts (refused, no answer in 30 s, or no valid cost, with the query still open 5 s later) stops the session, books the ledger entry `claude-code spend check failed` and rejects `runSession`, with no result record; a failure at the close is ignored; C002-TC-930 (six rows) and its supporting test pass
- [ ] Every Claude Code result record gives `claude_code_version` (recorded, not refused)
- [ ] `npm test` and `npm run check` green
- [ ] The paid check ran (two sessions, a third only under the fallback of step 6; about 3 USD notional; `--auth subscription`), and the task report gives (a) … (e) of step 6 with the result files: the per-model comparison and the back-to-back probe, the answer times, the stop with the four bound conditions, the search for budget and turn wording, and the versions. The D-031 assumption holds, the four conditions hold, and no transcript shows a budget or turn statement; otherwise a spec defect is raised and the task stays in progress
- [ ] The task report names C001-T-082 and C001-T-072 as waiting for this task
- [ ] Progress reported: `sdd task set C002-T-069 --status done --commit <sha>`
