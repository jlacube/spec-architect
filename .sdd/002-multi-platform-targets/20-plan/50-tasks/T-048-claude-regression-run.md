---
id: C002-T-048
title: "Claude Code regression set run"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-022, C002-T-035, C002-T-037, C002-T-038]
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
and deny texts of C002-REQ-503, C002-REQ-517 and C002-REQ-521 (C002-REQ-623). With the real
`CLAUDE_PLUGIN_DATA`, the Serena step of the doctor and init commands must stay allowed
(C002-TS-537).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/regression-CHG-002.md` | commands run, results, eval runs with spend, list of changed expectations each linked to its REQ |

## Preconditions

- C002-T-022, C002-T-035, C002-T-037 and C002-T-038 done (last source-affecting tasks).

## Step outline (no production code)

1. Run the commands of regression-set §2 and the tests of §3. Any edit of a §3 test is a regression,
   not an update.
2. Diff the expectations of §4 against the base commit (`git diff 85bee21 -- tests/`). List each
   change with the REQ it implements.
3. Run the evals of regression-set §5, row 1 once. Run the other rows only if a source agent, command or
   skill changed. Stay within the API-key budget, and stop and discuss with P-01 at the $25 CHG-002 eval budget (Q-evalbudget-01).

## Verification

- `npm run check`, `npm run bench`
- `node evals/harness/run.mjs evals/cap11/doctor-no-ripwire.eval.mjs` (one run)

## Done when

- [ ] Report written; every changed expectation traces to C002-REQ-503, C002-REQ-517 or C002-REQ-521
- [ ] Progress reported: `sdd task set C002-T-048 --status done --commit <sha>`
