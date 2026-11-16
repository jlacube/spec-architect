---
id: C002-T-048
title: "Claude Code regression set run"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: done
depends_on: [C002-T-022, C002-T-035, C002-T-037, C002-T-038, C002-T-042, C002-T-044, C002-T-045, C002-T-047, C002-T-060, C002-T-064, C002-T-065]
implements: [C002-REQ-623, C002-REQ-611]
satisfies_ac: [C002-AC-623.1, C002-AC-517.1, C002-AC-611.1]
verified_by: [C002-TS-626, C002-TS-627, C002-TS-537, C002-TS-614, C002-TS-679, C002-TC-626, C002-TC-627, C002-TC-537, C002-TC-614, C002-TC-679]
components: [C002-COMP-013, C002-COMP-012, C002-COMP-009]
risk_refs: [C002-RISK-009, C002-RISK-015, C002-RISK-016]
estimate: M
report: { commit: 0743ed6, completed_at: 2026-10-21, notes: "Regression set §5: 57 rows, 54 pass, 3 waived (TS-213/214/215 stand-in-era cases, CHG-001 D-013). Fixed in passing: CHG-001 D-012 ripwire guard (C001-T-079), INJ-10 grader, INJ-19 and TS-817 fixtures, metrics output split. 71 sessions --auth subscription, 25.80 USD notional, no API key. Open: metrics zero-output for notified subagents (harness, candidate). Report docs/releases/regression-CHG-002.md. This commit is the release candidate for T-049/T-054." }
---

# C002-T-048 — Claude Code regression set run

## Intent

Show that Claude Code behaves as before (C002-GOAL-05, C002-DOD-022). Every test and eval of
`30-impact/regression-set.md` must pass. The only changed expectations allowed are the corpus cases
and deny texts of C002-REQ-503, C002-REQ-517, C002-REQ-521 and C002-REQ-325 (C002-REQ-623). With the real
`CLAUDE_PLUGIN_DATA`, the Serena step of the doctor and init commands must stay allowed
(C002-TS-537). The run takes place after the last task that edits a shared harness or root file
(`evals/harness/session.mjs` and `env.mjs` by C002-T-060, C002-T-044 and C002-T-045, the root devDependency of
C002-T-042, the release check of C002-T-047), and its commit is the release-candidate commit that
C002-T-049 and C002-T-054 package. Revision D-025 adds to step 4 the harness changes of the Claude
Code subscription class of cap exceptions (C002-IF-010 §2.2) and the reruns that class allows
(steps X0 … X5).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `tests/integration/contracts/claude-behaviour.test.ts` | C002-TC-627: one test per Examples row of C002-TS-627; each plants the behaviour change into a copy of the source (fx-src), runs the named regression test against it and asserts that it fails, naming the expected case (the path-corpus case, the doctor Serena-step test of C002-T-010, the shell-corpus case) |
| add | `docs/releases/regression-CHG-002.md` | commit under test, commands run, results, eval runs with spend, the classified list of test edits (step 2); from revision D-025 on also the results of steps X0 … X5 and the session-limit check |
| modify | `evals/results/spend-chg002.json` | the spend of the paid sessions of step 4; step X1: `caps_usd` on every `claude-max` entry, `valid_run: false` on the replaced 0.50 USD sessions |
| add | `evals/results/t048*-*.json` | one result per session of step 4 |
| modify | `evals/harness/caps.mjs` › `CAP_EXCEPTIONS`, `capException`, `capRefusal` | step X0 (C002-IF-010 §2.2): every row of the exception table with its auth mode, its own caps (spend and turns) and its rerun cap; the four-key match; the turn-cap check above 30; the refusal of `--cap-exception` for a row without a rerun cap |
| modify | `evals/harness/run.mjs` › `main`, `parseArgs`, the caps passed to the session | step X0 (C002-IF-010 §1, §2.2, §3): the option `--cap-exception`; the auth mode resolved before the cap-exception check; the rerun cap passed as `maxBudgetUsd` and recorded in `caps` |
| modify | `evals/harness/session.mjs` › harness context | step X0: a test seam that puts the Agent SDK stub (test plan §2, sdk-stub) in place of the SDK's `query`; `runSession`'s signature and defaults unchanged (C002-RISK-009) |
| modify | `evals/harness/metrics.mjs` › `runMetrics` | step X0: per-agent output split, so that a specialist's output never lands under `main` |
| modify | `evals/injection/injection.eval.mjs` (the `INJ-19` row) | step X0 (P-01 answer to Q-inj19-01): the planted text moved from `.sdd/SDD.md` to the lite change's `change.md`; nothing else in the file |
| modify | `tests/integration/cap06/cap-exceptions.test.ts` | step X0: C002-TC-679, 20 rows, and its supporting tests; the fixture fx-evals-caps with the D-025 case files (among them `evals/targets/other/TS-214.eval.mjs`) and `maxTurns` |
| add | `tests/integration/cap06/claude-runner.test.ts` | step X0: the three Claude Code rows of C002-TC-614 on the Agent SDK stub |
| modify | `tests/unit/evals/harness.test.ts` | step X0: the output split of `runMetrics` with a subagent that ended without a `task_notification` |

## Preconditions

- C002-T-022, C002-T-035, C002-T-037, C002-T-038, C002-T-042, C002-T-044, C002-T-045, C002-T-047,
  C002-T-064 and C002-T-065 done (the last tasks that change source, harness or root files; C002-T-064
  changes the sdd MCP server, the generator, the release check and the OpenCode runner; C002-T-065
  changes the mapping tables and wiring variants, the generator's construct detectors, both eval
  runners, the harness caps, the replay suite and the release check).
- C002-T-053 done, so that the approved-phase lint loop of `frontend.test.ts` passes with CHG-002's
  waivers in force.
- C002-T-060 (eval auth switch) done. The sessions of step 4 run with `--auth subscription` (test
  plan §4.1 "Eval auth"); a session runs with `--auth api-key` only when P-01 decides it, and then
  bills the prepaid key outside the OpenRouter budget.
- Steps X0 … X5: the spec and plan revision for defect D-025 approved at G2 and G3 (P-01 answers to
  Q-claude-cap-01, Q-claude-cap-02 and Q-inj19-01).

## Step outline (no production code)

1. Record the commit under test in the report. Run the commands of regression-set §2 and the tests
   of §3 at that commit. Any edit of a §3 test is a regression, not an update.
2. List every change of `git diff 85bee21 -- tests/` and classify it by the reading P-01 gave in
   Q-regression-01 (`questions-log.md` round 4; regression-set §4 "Reading of C002-REQ-623"):
   - **Addition**: new tests, new cases or rows, new harness options or helpers, and edits that extend
     an existing mirror so that it also reads the CHG-002 tables (the `frontend.test.ts` command names
     and ERR-CLI-019/020 rows, the `smoke.test.ts` version source, the `frontend.test.ts` waiver
     filter of C002-T-053). An addition is not a changed expectation.
   - **Changed expectation**: an existing case or assertion that now expects a different decision,
     text or value for the same input. Each must trace to C002-REQ-503, C002-REQ-517, C002-REQ-521
     or C002-REQ-325; any other is a regression (fix it), or a spec defect against C002-REQ-623 raised
     with `sdd defect add --ref C002-REQ-623`.
3. Write `claude-behaviour.test.ts` and run it; each planted change must be caught.
4. **Paid runs on E-CC.** The 3 cases of regression-set §5 row 1 and the 2 rows of C002-TC-537, one
   run each, at most one rerun after a failure (ran: 5 passes). Run the other §5 rows only if a source
   agent, command or skill changed (C002-CON-10); the conductor decided on 2026-10-20 that the two
   skill edits count, so they run in batches of at most 10 sessions with the conductor's go between
   batches (report §5.1; batches 1 … 6 ran). Run them with `--auth subscription` and add each to the
   ledger with its `provider`, `auth` and `caps_usd` after it. A session that has to run with
   `--auth api-key` starts only after P-01's decision and is recorded with `provider`
   `anthropic-key`; it draws on no OpenRouter pool (test plan §4.1). Batches 5 and 6 ended five rows
   at the 0.50 USD notional cap before their checked step and held `TS-213` and `TS-221` (case
   `maxTurns` 40); defect D-025 and the Claude Code subscription class of C002-IF-010 §2.2 decide the
   rest of the step, in this order:

   **Note on the CHG-001 baseline.** The CHG-001 sessions of `TS-214`, `TS-215` and `TS-318`
   (`t032`, `t033`, 0.15 … 0.23 USD) ran Haiku stand-ins for the specialists they dispatch, so they
   give no baseline for the real specialists that CHG-002's sessions run (the options analyst and the
   critic on their own tiers). The "about four times the output" of report §5.2 compares with those
   stand-in runs and is not a regression measure; the rerun estimate of test plan §4.2 therefore
   takes these sessions at their cap.

   - **X0. Harness changes (no paid session; one commit).**
     a. `caps.mjs`: give `CAP_EXCEPTIONS` every row of the C002-IF-010 §2.2 table, each with its row
        ID, case file, host, auth mode (none for `opencode`), its own caps (spend and turns) and its
        rerun cap (none for `TS-634`). An exception matches only when row ID, case file, host and
        the run's auth mode are all equal. A selected row passes the check when its `maxBudgetUsd`
        is at most 0.50 and its `maxTurns` at most 30 (a value it does not set being the default),
        or a matching exception's own caps are at least the row's values; and, when the run gives
        `--cap-exception`, only when a matching exception has a rerun cap. The check returns the
        caps to pass: the row's `maxTurns`, and the rerun cap under `--cap-exception`, else the row's
        `maxBudgetUsd`.
     b. `run.mjs`: add the boolean option `--cap-exception` (no value) to the options and the usage
        text; resolve the auth mode (`--auth`, else `EVAL_AUTH`, else `api-key` on `claude-code`;
        none on another host) before the cap-exception check and pass it to the check; a refusal
        ends the run before any session with exit code 1 and a message naming the row's ID, its case
        file, the host and the auth mode; pass the checked caps to the session and record them in
        the result's `caps` (C002-IF-010 §3). The stop rule and the reserve stay as they are: the
        Claude Code sessions are outside them (test plan §4.1 rule 7), and the paid-class reserve
        takes the exception's own cap as before.
     c. `session.mjs`: add to the harness context a replacement for the Agent SDK's `query`, used
        only by the tests (sdk-stub); the Claude Code path, `runSession`'s signature and its
        defaults stay unchanged (C002-RISK-009).
     d. `metrics.mjs` (finding of the D-025 investigation of the batch 6 transcripts): a specialist
        that was still running when the session ended has no `task_notification`, so its output
        today counts as 0 and the rest of the model's output, its own included, lands under `main`
        (for example `TS-318-10-spec`: 13.5k output tokens under `main`, 0 under
        `architect:sdd-options-analyst`). Fix the split: the output of a model that such a subagent
        shares with the main thread is not given to `main` by subtraction; `main` and the subagent
        each keep the output their own messages show, and the rest of that model's total goes to an
        entry of its own that says it is not attributed. With every subagent notified the split is
        as today. Totals per model and `cost_usd` do not change.
     e. `injection.eval.mjs`, row `INJ-19` (P-01 answer to Q-inj19-01, "Fix case, run once"): plant
        the same text in the lite change's `change.md`, which the gate flow reads (as `INJ-21`
        does), on the `liteReadyWith` base with its critic report; keep the marker, the prompt and
        the grader; adjust the row's title; no other row changes.
     f. Tests: C002-TC-679 with its 20 rows and supporting tests, and fx-evals-caps with the D-025
        case files and `maxTurns` (test plan §2, §8). Among the 20 rows: `TS-213` with
        `--host claude-code --auth subscription --cap-exception` runs one session at 1.50 USD and
        40 turns; `TS-214` of `evals/targets/other/TS-214.eval.mjs` with
        `--host claude-code --auth subscription --cap-exception` is refused before any session (the
        exception's row ID in another case file). The three Claude Code rows of C002-TC-614 in
        `claude-runner.test.ts` on the Agent SDK stub; the `runMetrics` split with a transcript
        whose subagent has no `task_notification`, asserting that the subagent's output is not
        counted under `main`. `npm test` stays green.
     g. X0 changes harness files, so step 5 applies: re-run steps 1 to 3 at the X0 commit and update
        the report before X2.
   - **X1. Ledger (no session).** Write `caps_usd` on every `claude-max` entry, the earlier ones
     included, from its result file's record (`records[].caps.usd`). Give the five 0.50 USD entries
     of batches 5 and 6 for `TS-214`, `TS-215` and `TS-318` ×3 `valid_run: false` by the rule for
     capped sessions (test plan §4.1), keeping their notional `cost_usd`. The two `INJ-19` entries of
     batches 3 and 4 ran the case before the fix; they stay as recorded, with a note saying so, and
     the session limit of the fixed case counts from X5. Recompute the per-agent tokens of the five
     capped sessions from their saved transcripts with the fixed `runMetrics` (no new session) and
     correct report §5.2.
   - **X2. The five reruns at 1.50 USD** (one batch with X3). One session per row, whatever its
     result; no further session of these rows at any cap.

     Command: `node evals/harness/run.mjs --host claude-code --tier dev --auth subscription --cap-exception --label t048x2 --only TS-214,TS-215,TS-318-00-ideation,TS-318-10-spec,TS-318-20-plan evals/cap02/TS-214.eval.mjs evals/cap02/TS-215.eval.mjs evals/cap03/TS-318.eval.mjs`

   - **X3. `TS-213` and `TS-221` at 40 turns** (0.50 USD, 40 turns). After a failure, one rerun of
     that row: with `--cap-exception` (1.50 USD) when its run ended at the spend cap
     (`metrics.result_subtype` `error_max_budget_usd`; the run's entry then gets `valid_run: false`),
     else without it.

     Command: `node evals/harness/run.mjs --host claude-code --tier dev --auth subscription --label t048x3 --only TS-213,TS-221 evals/cap02/TS-213.eval.mjs evals/cap02/TS-221.eval.mjs`

   - **X4. Batch 7** (one batch with X5). After a failure, one rerun of that row by the X3 rule.

     Command: `node evals/harness/run.mjs --host claude-code --tier dev --auth subscription --label t048b7 --only TS-419,TS-420,TS-421-agent,TS-713,TS-715,TS-815,TS-817-stop,TS-817-specify evals/cap04/TS-419.eval.mjs evals/cap04/TS-420.eval.mjs evals/cap04/TS-421.eval.mjs evals/cap07/TS-713.eval.mjs evals/cap07/TS-715.eval.mjs evals/cap08/TS-815.eval.mjs evals/cap08/TS-817.eval.mjs`

   - **X5. `INJ-19`, fixed case, one run.** A rerun only when the run ended at the spend cap, then
     with `--cap-exception`; after a failure of another kind no rerun (Q-inj19-01).

     Command: `node evals/harness/run.mjs --host claude-code --tier dev --auth subscription --label t048x5 --only INJ-19 evals/injection/injection.eval.mjs`

   - A conditional rerun repeats its step's command with `--only <row>`, the row's case file, a
     label ending in `r`, and `--cap-exception` when the rule above gives 1.50 USD.
   - The conditional reruns of X3 … X5 run in last batches of at most 10 sessions each, with the
     conductor's go between them, each rerun started with its own `--only` row.
     Every session is added to the ledger by hand after it (`provider` `claude-max`, `auth`
     `subscription`, `api_key_source`, `caps_usd`, `cost_usd`, `pass`, result file, a note naming
     run or rerun). A failure of a session at 1.50 USD or at 40 turns is a failed row: no waiver is
     approved for it (C002-IF-010 §2.2); report it to the conductor with the transcript's last
     checked step, and raise a product defect with `sdd defect add` when the transcript shows a wrong
     decision. Spend: test plan §4.2 (16 sessions, 12.35 USD notional; at most 11 conditional
     reruns).
   - **Done-check: session limits per row**, from the result records (`records[].caps`,
     `metrics.result_subtype`, `auth`, `api_key_source`) and the ledger, written into the report as
     one line per row:

     | Rows | Sessions allowed after revision D-025 |
     |---|---|
     | `TS-214`, `TS-215`, `TS-318-00-ideation`, `TS-318-10-spec`, `TS-318-20-plan` | exactly one with `caps.usd` 1.50, following the row's batch 5 or 6 session, which ended with `error_max_budget_usd` and carries `valid_run: false` |
     | `TS-213`, `TS-221` | one run with `caps.turns` 40 and `caps.usd` 0.50; at most one rerun with `caps.turns` 40: at 1.50 only after a run that ended with `error_max_budget_usd` (that run `valid_run: false`), else at 0.50 |
     | `TS-419`, `TS-420`, `TS-421-agent`, `TS-713`, `TS-715`, `TS-815`, `TS-817-stop`, `TS-817-specify` | one run at the row's own caps; at most one rerun, by the same rule |
     | `INJ-19` (fixed case) | one run; a rerun only at 1.50 after a run that ended with `error_max_budget_usd` |

     For every session of these rows: `auth` `subscription`, `api_key_source` `none`, the ledger's
     `caps_usd` equal to the record's `caps.usd`; no session at 1.50 USD or 40 turns under
     `--auth api-key` or on another host.
5. If a later fix changes a source, harness or root file before C002-T-049 or C002-T-054 packages the
   release candidate, re-run steps 1 to 3 at the new commit and update the report.

## Verification

- `npm run check`, `npm run bench`, `npm test -- contracts/claude-behaviour`
- `node evals/harness/run.mjs --host claude-code --tier dev --auth subscription` with the three regression-set §5 row 1 files
  and `evals/targets/doctor/TS-537.eval.mjs` as positional case files (`--host` from C002-T-044 step 2)
- Step X0: `npm test -- cap06/cap-exceptions`, `npm test -- cap06/claude-runner`,
  `npm test -- cap06/runner-caps`, `npm test -- unit/evals`, then `npm test`
- Steps X2 … X5: the commands above; the session-limit check of step 4 against the ledger and the
  result files

## Done when

- [ ] Report written at the recorded commit; every test edit classified as addition or changed
      expectation; every changed expectation traces to C002-REQ-503, C002-REQ-517, C002-REQ-521 or
      C002-REQ-325
- [ ] Every planted change of C002-TS-627 is caught
- [ ] The 5 paid sessions of regression-set §5 row 1 and C002-TC-537 pass and their spend is in the ledger
- [ ] Step X0 is done: the four-key cap-exception check with the turn cap and `--cap-exception`, the
      auth mode resolved before it, the rerun cap in `caps`; the Agent SDK test seam; the
      `runMetrics` output split; the `INJ-19` case fix; C002-TC-614 (six rows) and C002-TC-679
      (20 rows) pass; steps 1 to 3 re-run at the X0 commit
- [ ] Step X1 is done: every `claude-max` entry carries `caps_usd`; the five replaced 0.50 USD
      sessions carry `valid_run: false`; report §5.2 has the corrected per-agent tokens
- [ ] Every row of regression-set §5 passes, or its failure after the sessions that step 4 allows is
      reported to the conductor for P-01's decision; the session-limit check of step 4 holds for
      every row, and every session is in the ledger
- [ ] Progress reported: `sdd task set C002-T-048 --status done --commit <sha>`
