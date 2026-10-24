---
id: C002-T-069
title: "Fix for revision D-031: the Claude Code eval runner applies the spend cap itself and shows the model no budget"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-048, C002-T-068]
implements: [C002-REQ-611, C002-REQ-642, C002-REQ-643, C002-REQ-644, C002-NFR-105]
satisfies_ac: [C002-AC-611.1, C002-AC-642.1, C002-AC-643.1, C002-AC-644.1]
verified_by: [C002-TS-614, C002-TS-679, C002-TS-702, C002-TS-703, C002-TS-704, C002-TC-614, C002-TC-679, C002-TC-928, C002-TC-929, C002-TC-930]
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
notional cost itself after each new assistant message, and stops the session at the cap. It records
the end as before (`error_max_budget_usd`), so the ledgers, the rules of C002-IF-010 §2.2 "Sessions
of CHG-001 tasks" and every pass rule stay as they are. Contract: C002-IF-010 §2 (`maxTurns`,
`maxBudgetUsd`) and §2.2 "Budget hidden from the model" and "Claude Code spend cap", items 1 … 8.
The OpenCode and Copilot CLI runners do not change.

The task is the follow-up of C002-T-048, whose step X0 built the Agent SDK stub, and of C002-T-068.
Its tests are offline on the stub. It has **one paid check** on P-01's Max plan, about 3 USD
notional, which Q-budget-hide-01 allowed (step 6). CHG-001's C001-T-082 (the reruns of C001-TC-223
and C001-TC-224) and C001-T-072 wait for it (`../handoff.md`, Cross-change dependency).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the query options | (item 1) pass `maxTurns` as before. Pass no `maxBudgetUsd` and no `taskBudget`, and no spend or turn cap in the prompt, the system prompt or an extra argument. `runSession`'s signature and defaults stay as they are (C002-RISK-009); `maxBudgetUsd` is still accepted and becomes the runner's own cap |
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the message loop | (items 2, 3) the running cost R, the highest `total_cost_usd` read so far, from each `result` message and from each answer to `usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET({ skipBehaviors: true })` (`session.total_cost_usd`). One usage request after each assistant message, of the session agent or a subagent, whose `message.id` is new; one request open at a time, with at most one queued behind it. R is compared with the cap after each `result` message and each usage answer |
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the stop | (item 4) at the first comparison where R ≥ the cap, in this order: the harness record `{ "event": "cap", "reason": "spend cap", "usd": <R>, "cap_usd": <cap> }`; every later permission request denied, AskUserQuestion included, with the usual `<tool> is not available in this evaluation`; `interrupt()` once, the stream read until a `result` message after the interrupt or 30 s; then `abortController.abort()`. An `error_max_turns` result keeps its subtype |
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the result | (items 5, 6) the session's `result` is the last `result` message with `subtype` `error_max_budget_usd`, `is_error` `true` and `total_cost_usd` the recorded cost (the final R, never cut to the cap), its other fields kept; with no `result` message, a result with these three fields, `num_turns` `null` and `modelUsage` `{}`. The transcript keeps the SDK's own messages as they came |
| modify | `evals/harness/session.mjs` › `runClaudeCodeSession`, the failed reading | (item 8) a refused usage request, or an answer without a finite `session.total_cost_usd` of at least 0, stops the session as at the cap. `runSession` then rejects with `claude-code spend check failed: <reason>; notional cost read <R> USD`, as it does for a key source that does not match the auth mode (C002-T-060), and no result record is written |
| modify | `evals/harness/runners/sdk-stub.mjs` | the usage request with its per-row answers (cost of the model calls ended so far, refusal, `-1`, no `session.total_cost_usd`), `interrupt()` and the close recorded, assistant messages repeated per content block with one ID per call, a subagent call in parallel, and the per-row behaviour after the interrupt (test plan §2 sdk-stub). It records `maxBudgetUsd` and `taskBudget` when given, so the tests can show that none is passed. It ends a session itself only at `maxTurns` |
| modify | `tests/integration/cap06/claude-runner.test.ts` | the three Claude Code rows of C002-TC-614 as revised (no `maxBudgetUsd` to the stub, the runner's stop at 0.50 USD); C002-TC-928 (four rows), C002-TC-929 (four rows), C002-TC-930 (three rows); the supporting test of C002-TC-930 on the pinned SDK |
| modify | `tests/integration/cap06/cap-exceptions.test.ts` | the Claude Code session rows of C002-TC-679: the cap in force applied by the runner and no `maxBudgetUsd` or `taskBudget` to the stub |

## Preconditions

- C002-T-048 done (sdk-stub, `--auth`, the subscription class). C002-T-068 done: the paid check runs
  `TS-224` with `--cap-exception`, which needs its row, and both tasks edit `cap-exceptions.test.ts`.
- G2 re-approved after the D-031 revision, and G3 after this plan revision (gate records of
  `../../change.md`).
- The Agent SDK stays pinned at 0.3.296 (`evals/package.json`) and Claude Code at 2.1.299 (the
  desktop-bundled binary of `CLAUDE_CODE_EXECPATH`), the versions that the D-031 evidence and
  assumption name (C002-RISK-039).
- For step 6: E-CC with `--auth subscription` on P-01's Max plan. P-01 watches the plan's usage limits
  (test plan §4.1 "Eval auth"). The sessions spend from no pool (rule 7).

## Step outline (no production code)

1. **Tests first.** Extend sdk-stub and write C002-TC-928 … 930 and the revised Claude Code rows of
   C002-TC-614 and C002-TC-679, each Examples row its own `test()` whose name starts with its TS ID.
   Watch them fail against today's runner, which passes `maxBudgetUsd` to the SDK and never sends a
   usage request. The 30 s wait after `interrupt()` runs on the mock timers of `node:test`; no option
   or variable changes it.
2. **Options.** Remove `maxBudgetUsd` from the query options and keep `maxTurns`. Run C002-TC-929.
3. **Readings.** Track R from `result` messages and usage answers, with one request per new message
   ID and one open at a time. Run the usage-request assertions of C002-TC-928.
4. **Stop and result.** Add the cap record, the denial, `interrupt()`, the 30 s wait, the close, and
   the result handling of items 5 and 6. Run C002-TC-928 and the Claude Code rows of C002-TC-614 and
   C002-TC-679.
5. **Failed reading.** Add the rejection of item 8. Run C002-TC-930 with its supporting test. Then
   run `npm test -- cap06/claude-runner`, `npm test -- cap06/cap-exceptions`, `npm test --
   cap06/runner-caps`, `npm test -- unit/evals` (the auth tests of C002-T-060 unchanged), `npm test`
   and `npm run check`.
6. **Paid check on the Max plan** (P-01 answer to Q-budget-hide-01; about 3 USD notional; owning step
   of `../10-strategy.md` §3a). Run on E-CC with `--host claude-code --auth subscription` and the
   result-file label `t069-check`, two sessions:
   - **One session at the cap:** `TS-216` (`evals/cap02/TS-216.eval.mjs`) at its own 0.50 USD and 30
     turns, without `--cap-exception`. Its latest session ended at that cap (C002-IF-010 §2.2
     evidence table).
   - **One session at 1.50 USD:** `TS-224` (`evals/cap02/TS-224.eval.mjs`) with `--cap-exception`, its
     rule-1 cap.

   Neither session is a run of any tier: both count toward no pass rule of C001-T-082 or C001-T-072.
   From the transcripts and result records, the task report states:
   - **(a) The D-031 assumption of item 8:** whether every usage request was answered during a turn,
     whether any answer came with a model call (a cost that rose with no assistant message between
     two readings), and how the last reading before each `result` message compares with that
     message's `total_cost_usd`.
   - **(b) Frequency and latency:** the number of usage requests sent and answered, the time from
     each request to its answer (median and largest), and the readings per model call.
   - **(c) The stop:** for the session that reached the cap, R at the cap record, the recorded cost,
     the overshoot, and whether a `result` message came within 30 s of the interrupt.
   - **(d) No budget statement:** the model text of every message of the session agent and of each
     subagent, searched for `budget`, `USD`, `spending limit`, `remaining`, `$` followed by a figure,
     and the denial text `Budget limit reached`. Every hit is quoted with its context. A hit that
     refers to a session budget the case did not give fails the check.

   A refuted assumption, or a budget statement, is a spec defect against C002-REQ-643 or
   C002-REQ-642 (`sdd defect add --ref <REQ>`): the task stays in progress, and the CHG-001 tasks keep
   waiting. A rejection `claude-code spend check failed` in this step is a refuted assumption too.
7. Report the commit and the check, and tell the conductor so that C001-T-082 and C001-T-072 can run.
   The commit changes the eval harness only, which ships in no package, so it does not move the
   release-candidate commit of C002-T-048 for C002-T-052 or C002-T-055.

## Verification

- `npm test -- cap06/claude-runner`, `npm test -- cap06/cap-exceptions`, `npm test -- cap06/runner-caps`, `npm test -- unit/evals`
- `npm test`, `npm run check`
- Step 6: `node evals/harness/run.mjs --host claude-code --auth subscription --tier dev --label t069-check --only TS-216 evals/cap02/TS-216.eval.mjs`, and `node evals/harness/run.mjs --host claude-code --auth subscription --cap-exception --tier dev --label t069-check --only TS-224 evals/cap02/TS-224.eval.mjs` (result files `evals/results/t069-check-<row>-<time>.json`)

## Done when

- [ ] The Claude Code eval runner passes `maxTurns` and no `maxBudgetUsd` or `taskBudget`, and no cap in the prompt or the system prompt; C002-TC-929 (four rows) passes
- [ ] It reads the notional cost from `result` messages and one usage request per new assistant message ID, stops at the first reading at or above the cap (cap record, denial, `interrupt()`, at most 30 s, close), and records `error_max_budget_usd` with the highest cost read; C002-TC-928 (four rows) and the Claude Code rows of C002-TC-614 and C002-TC-679 pass
- [ ] A failed reading stops the session and rejects `runSession` with `claude-code spend check failed: …`, with no result record; C002-TC-930 (three rows) and its supporting test pass
- [ ] `npm test` and `npm run check` green
- [ ] The paid check ran (two sessions, about 3 USD notional, `--auth subscription`), and the task report gives (a) … (d) of step 6 with the result files; no transcript of it shows a budget statement, and the D-031 assumption holds, or a spec defect is raised and the task stays in progress
- [ ] The task report names C001-T-082 and C001-T-072 as waiting for this task
- [ ] Progress reported: `sdd task set C002-T-069 --status done --commit <sha>`
