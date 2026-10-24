---
id: C002-T-070
title: "Fix for revision D-033: rerun cap of 3.00 USD for the rule-1 rows of the Claude Code subscription class"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: in-progress
depends_on: [C002-T-068, C002-T-069]
implements: [C002-REQ-611, C002-NFR-105]
satisfies_ac: [C002-AC-611.1]
verified_by: [C002-TS-679, C002-TC-679]
components: [C002-COMP-009]
risk_refs: [C002-RISK-038]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-070 — Fix for revision D-033: rerun cap of 3.00 USD for the rule-1 rows of the Claude Code subscription class

## Intent

With the budget hidden (defect D-031, C002-T-069), every rule-1 session of C001-T-082 step 4 ran to
the 1.50 USD rerun cap, the passing ones included. The full-flow CHG-001 cases are therefore limited
by the cap (defect D-033). P-01 answered Q-cap-level-01 with "Raise to $3 (Recommended)"
(`../questions-log.md` round 2026-10-24).

The revised C002-IF-010 §2.2 gives the **13 rule-1 rows** of "Sessions of CHG-001 tasks" a rerun
cap of **3.00 USD** notional. The thirteenth is `TS-225`, added on spec critic CR-114 by the
conductor's decision as the attended twin of `TS-215`, whose sessions stop before the arrival at
0.50 USD. The 27 rule-2 rows keep 1.50 USD for their single replacement. The table then holds 42
rows. This task brings
`evals/harness/caps.mjs` and its tests to that table. It runs **no paid session**; the tests use the
Agent SDK stub on mock timers.

CHG-001's C001-T-082 step 4 and C001-T-072 wait for it (`../handoff.md`, Cross-change dependency).
P-01 measures the rule-1 rows again after the CHG-001 D-019 fixes. A cap that this measurement
changes is a further revision of §2.2, not part of this task.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `evals/harness/caps.mjs` › `CAP_EXCEPTIONS` | (spec critic CR-114) the new row `TS-225` of `evals/cap02/TS-225.eval.mjs`, at its place in the §2.2 table, after `TS-224` and before `TS-127`: host `claude-code`, auth `subscription`, own caps 0.50 USD and 30 turns, rule 1, `rerunUsd` 3.0 |
| modify | `evals/harness/caps.mjs` › `CAP_EXCEPTIONS` | `rerunUsd` 3.0 for every row whose rule is rule 1 (list 1 of §2.2 "Sessions of CHG-001 tasks", 13 rows). Every other row keeps its values: the 27 rule-2 rows and `TS-421-agent` at 1.50, and `TS-634` with no rerun cap. Row order, case files, hosts, auth modes, own caps and the recorded rules of the other rows stay unchanged. The doc comment names the two rerun caps and D-033 |
| modify | `tests/integration/cap06/cap-exceptions.test.ts` | the pinning test: 42 rows in table order, `TS-225` included; 13 rule-1 rows with `rerunUsd` 3.0, 27 rule-2 rows and `TS-421-agent` with 1.5, with a count of each; every case file of the table exists, `evals/cap02/TS-225.eval.mjs` included. The Claude Code session rows of C002-TC-679: `TS-213` with `--auth subscription --cap-exception` stops at the 3.00 USD reading after the twelfth call (0.25 USD per call, one per second) and not at 0.50 or 1.50 USD, with `caps.usd` 3.00 and `caps.turns` 40; `TS-214`, a rule-2 row, still stops at 1.50 USD. The D-030 supporting test runs `TS-223` with `--cap-exception` at 3.00 USD |

## Preconditions

- C002-T-068 and C002-T-069 done: the rows and their rules, and the runner-applied spend cap that
  the stub rows rely on.
- G2 re-approved after the D-033 revision, and G3 after this plan revision (gate records of
  `../../change.md`).
- **Cross-change:** the case file `evals/cap02/TS-225.eval.mjs` exists. CHG-001's C001-T-083 adds it,
  so this task starts after C001-T-083 has committed that file. The conductor confirms it; the edge
  lives on the CHG-002 side only (`../handoff.md`).
- This task changes no case file under `evals/`, so the case-file supporting tests of C002-TC-679
  stay as they are. `TS-225`'s case file sets no cap above 0.50 USD or 30 turns.

## Step outline (no production code)

1. Update the pinning test and the session supporting tests first, and watch them fail: today
   `TS-225` has no row, every subscription-class row gives `rerunUsd` 1.5, and `TS-213` with
   `--cap-exception` stops at 1.50 USD.
2. Add the `TS-225` row at its place, and set `rerunUsd` to 3.0 for the rule-1 rows, read from the
   rule recorded per row, not from a second list. Update the doc comment.
3. Run `npm test -- cap06/cap-exceptions`, then `npm test -- cap06/claude-runner` and
   `npm test -- cap06/runner-caps`. C002-TC-614 and C002-TC-928 … 930 stay unchanged: they run at
   the default caps.
4. Run `npm test` and `npm run check`. Report the commit, and tell the conductor so that C001-T-082
   step 4 can rerun its rule-1 rows at 3.00 USD. The commit changes the eval harness only, which ships
   in no package, so it does not move the release-candidate commit for C002-T-052 or C002-T-055.

## Verification

- `npm test -- cap06/cap-exceptions`, `npm test -- cap06/claude-runner`, `npm test -- cap06/runner-caps`
- `npm test`, `npm run check`

## Done when

- [ ] `CAP_EXCEPTIONS` holds the 42 rows of the §2.2 table, `TS-225` added after `TS-224`, and gives `rerunUsd` 3.0 for the 13 rule-1 rows and 1.5 for the 27 rule-2 rows and `TS-421-agent`, everything else unchanged; the pinning test passes
- [ ] `TS-213` with `--auth subscription --cap-exception` stops at the 3.00 USD reading with `caps.usd` 3.00, `TS-214` with the option at 1.50 USD, and `TS-223` runs at 3.00 USD; C002-TC-679 (twenty rows) and its supporting tests pass
- [ ] No case file under `evals/` changed, and no paid session ran
- [ ] `npm test` and `npm run check` green
- [ ] The task report names C001-T-082 step 4 and C001-T-072 as waiting for this task
- [ ] Progress reported: `sdd task set C002-T-070 --status done --commit <sha>`
