---
id: C002-T-048
title: "Claude Code regression set run"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-022, C002-T-035, C002-T-037, C002-T-038, C002-T-042, C002-T-044, C002-T-045, C002-T-047, C002-T-060, C002-T-064]
implements: [C002-REQ-623]
satisfies_ac: [C002-AC-623.1, C002-AC-517.1]
verified_by: [C002-TS-626, C002-TS-627, C002-TS-537, C002-TC-626, C002-TC-627, C002-TC-537]
components: [C002-COMP-013, C002-COMP-012]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
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
C002-T-049 and C002-T-054 package.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `tests/integration/contracts/claude-behaviour.test.ts` | C002-TC-627: one test per Examples row of C002-TS-627; each plants the behaviour change into a copy of the source (fx-src), runs the named regression test against it and asserts that it fails, naming the expected case (the path-corpus case, the doctor Serena-step test of C002-T-010, the shell-corpus case) |
| add | `docs/releases/regression-CHG-002.md` | commit under test, commands run, results, eval runs with spend, the classified list of test edits (step 2) |
| modify | `evals/results/spend-chg002.json` | the spend of the paid sessions of step 4 |

## Preconditions

- C002-T-022, C002-T-035, C002-T-037, C002-T-038, C002-T-042, C002-T-044, C002-T-045, C002-T-047
  and C002-T-064 done (the last tasks that change source, harness or root files; C002-T-064 changes
  the sdd MCP server, the generator, the release check and the OpenCode runner).
- C002-T-053 done, so that the approved-phase lint loop of `frontend.test.ts` passes with CHG-002's
  waivers in force.
- C002-T-060 (eval auth switch) done. The 5 sessions of step 4 run with `--auth subscription` (test
  plan §4.1 "Eval auth"); a session runs with `--auth api-key` only when P-01 decides it, and then
  bills the prepaid key outside the OpenRouter budget.

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
4. **Paid runs (5 sessions on E-CC):** the 3 cases of regression-set §5 row 1 and the 2 rows of
   C002-TC-537, one run each, at most one rerun after a failure. Run the other §5 rows only if a
   source agent, command or skill changed (C002-CON-10). Run them with `--auth subscription` and add
   each to the ledger with its `provider` and `auth` after it. A session that has to run with
   `--auth api-key` starts only after P-01's decision and is recorded with `provider`
   `anthropic-key`; it draws on no OpenRouter pool (test plan §4.1).
5. If a later fix changes a source, harness or root file before C002-T-049 or C002-T-054 packages the
   release candidate, re-run steps 1 to 3 at the new commit and update the report.

## Verification

- `npm run check`, `npm run bench`, `npm test -- contracts/claude-behaviour`
- `node evals/harness/run.mjs --host claude-code --tier dev --auth subscription` with the three regression-set §5 row 1 files
  and `evals/targets/doctor/TS-537.eval.mjs` as positional case files (`--host` from C002-T-044 step 2)

## Done when

- [ ] Report written at the recorded commit; every test edit classified as addition or changed
      expectation; every changed expectation traces to C002-REQ-503, C002-REQ-517, C002-REQ-521 or
      C002-REQ-325
- [ ] Every planted change of C002-TS-627 is caught
- [ ] The 5 paid sessions pass and their spend is in the ledger
- [ ] Progress reported: `sdd task set C002-T-048 --status done --commit <sha>`
