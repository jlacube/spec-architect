---
id: C002-T-010
title: "Bash guard: Serena commands confined to a data folder outside the repository"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: [C002-T-005, C002-T-009, C002-T-060]
implements: [C002-REQ-517, C002-REQ-607]
satisfies_ac: [C002-AC-517.1, C002-AC-607.1]
verified_by: [C002-TS-527, C002-TS-528, C002-TS-537, C002-TS-610, C002-TC-527, C002-TC-528, C002-TC-537, C002-TC-610]
components: [C002-COMP-012]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-010 — Bash guard: Serena commands confined to a data folder outside the repository

## Intent

Allow `sdd serena-config` and `sdd serena-launch`, in both CLI forms, only with `--user-data` or with
a data folder that resolves outside the current repository (C002-REQ-517, C002-IF-008 §1.1). The
Claude Code doctor and init steps, which pass `${CLAUDE_PLUGIN_DATA}`, must stay allowed
(C002-REQ-623). This rule makes `decideBash` read its own environment for the first time
(blast-radius §3.1).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `tests/guards/bash-corpus.json` | for each Serena subcommand: `--user-data` (allow), a folder outside (allow), a folder inside (deny), the literal `${CLAUDE_PLUGIN_DATA}` with the env stub (allow), an unresolvable word (deny) |
| modify | `src/hooks/guard-bash.ts` | Serena-command detection; data-folder resolution per C002-IF-008 §1.1 with the C002-T-005 helper; `CLAUDE_PLUGIN_DATA` read from the guard's environment |
| modify | `tests/integration/cli/helpers.ts` | an optional environment stub for `runBundled`, additive only (hotspot rank 3) |
| modify | `bench/guards.mjs` | recorded inputs for a Serena command |
| add | `evals/targets/doctor/TS-537.eval.mjs` | C002-TC-537 (2 Examples rows) on E-CC; C002-T-038 later adds the other doctor cases beside it and C002-T-048 re-runs it |
| modify | `evals/results/spend-chg002.json` | this task's 5 paid sessions (step 5), each with its `auth`; created here if C002-T-001 has not created it yet |

## Preconditions

- C002-T-005 and C002-T-009 done (same file, serialised); C002-T-060 (eval auth switch) done.
- The paid runs of step 5 run with `--auth subscription` on P-01's Claude Max plan (test plan §4.1
  "Eval auth") and draw on no pool of the API-key budget. Only if one of them has to run with
  `--auth api-key`: P-01's top-up of C002-T-001 step 1 is done first, so the prepaid key holds at
  least 40 USD minus the ledger total of `evals/results/spend-chg002.json` (Q-evalbudget-03), and the
  stop rule of test plan §4.1 is checked before it. These runs use the caps that
  `evals/harness/run.mjs` sets for Claude Code today (`maxTurns` 30, `maxBudgetUsd` 0.50) in both
  auth modes; the SDK cap can be overrun (one CHG-001 session cost 0.62 USD), so the stop rule counts
  the highest observed session cost, not the cap.

## Step outline (no production code)

1. Add the corpus cases with their `env` stub and see them fail.
2. Detect the two subcommands after the CLI prefix. Take the data-folder argument and resolve it:
   the literal variable from the environment, else as a path relative to the `cwd`. A word that
   cannot be resolved is denied.
3. Deny when the resolved folder is inside the repository root.
4. Document in the guard header that the function now depends on its environment.
5. **Paid runs at the C002-M-02 exit (5 sessions on E-CC):** the 3 cases of regression-set §5 row 1
   (`evals/cap11/doctor-no-ripwire.eval.mjs`, `evals/cap10/TS-1015.eval.mjs`,
   `evals/cap11/TS-1111.eval.mjs`) and the 2 rows of C002-TC-537, one run each, at most one rerun
   after a failure, with `--auth subscription`. After every session, add it to the ledger with its
   `auth` and its (notional) `cost_usd`; a session run with `--auth api-key` is checked by the stop
   rule of test plan §4.1 before it starts. These runs check the C002-TS-537 assumption on the real
   host.

## Verification

- `npm test -- tests/guards`, `npm test -- cap10` and `npm test -- cap11`
- `npm run bench` (p95 ≤ 300 ms with the new file-system work)
- The milestone eval runs of step 5: `node evals/harness/run.mjs evals/cap11/doctor-no-ripwire.eval.mjs
  evals/cap10/TS-1015.eval.mjs evals/cap11/TS-1111.eval.mjs evals/targets/doctor/TS-537.eval.mjs --tier dev --auth subscription`
  (positional case files, no `--host`: the existing runner runs Claude Code only; `--host` and
  `--filter` arrive with C002-T-044 step 2)

## Done when

- [ ] Claude Code `.mcp.json` Serena launch and the doctor/init steps still allowed (C002-TS-537)
- [ ] The 5 sessions of step 5 pass and their spend is in the ledger
- [ ] Progress reported: `sdd task set C002-T-010 --status done --commit <sha>`
