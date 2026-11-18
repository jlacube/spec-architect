# Release 0.1.1 — evidence (CHG-005)

Evidence of CHG-005 "0.1.1 fixes" (`.sdd/005-0-1-1-fixes/`): the dogfood of the lite hash rule, the size
figures of C005-DOD-004, the eval floor of DOD-G-01, and the release checks. Sections are added by the tasks
that own them (`.sdd/005-0-1-1-fixes/20-plan/plan.md`).

## Dogfood

C005-T-002 (C005-REQ-122): CHG-005 is a lite change whose G3 was approved with the sdd CLI 0.1.0. After
C005-T-001 (`deb770b`), every command ran the working-tree CLI `node plugins/architect/scripts/sdd.mjs`
from the repository root, 2026-11-17.

**Step 1: first stale check of the 0.1.1 hash rule** (`stale check 005`, exit 0), the live case of C005-TS-170:

```text
CHG-005 00-ideation: approved (hash matches)
CHG-005 10-spec: approved (hash matches)
CHG-005 20-plan: stale (hash changed)
```

**Steps 2–3:** `change revise 005 20-plan --reason "C005-REQ-122: re-approve G3 under the 0.1.1 hash rule"`; no
plan text changed. `lint 005 --phase 20-plan` first reported one error, LINT-TASK-001 on C005-T-001 ("empty Done
when"): the `task set` report of C005-T-001 had inserted its Commit, Notes and Completed at lines between the Done
when field and its checkboxes. The three lines were moved below the checkboxes by hand, in the form `task set`
writes them (hand-off, frontmatter fallback), which leaves the approval hash unchanged (C005-IF-005), and recorded
as defect D-001 of CHG-005. The lint then reported 0 findings. `gate show 005 20-plan` listed C005-T-001 as the
only modified ID, because the per-ID content hashes keep the report-field lines (C005-IF-005 §3). G3 approved
under P-01's standing approval of routine gates (2026-10-24), `66fad5b`, hash
`sha256:1a4aa77c32fd5408691b61498821f3026aceb9982bf11462fbbc310a0c5f1c1c`.

**Step 4: a task report after the approval, then the stale check**, the live case of C005-TS-171:
`task set C005-T-002 --status in-progress` (`todo → in-progress`), then `stale check 005`:

```text
CHG-005 00-ideation: approved (hash matches)
CHG-005 10-spec: approved (hash matches)
CHG-005 20-plan: approved (hash matches)
```

## Sizes

C005-DOD-004 (constitution, NFR defaults, Skill size: 24,000 characters per SKILL.md body, 64,000 per agent). Bodies as
PLG-SIZE-001 counts them (frontmatter removed, code points); the Copilot conductor as TGT-SIZE-001 counts it (the
inlined `## Skill:` sections of `npm run generate -- --target copilot`).

| Measure | Before C005-T-010 | After C005-T-010 |
|---|---|---|
| conductor body | 4656 | 4947 |
| phase-ideation SKILL.md body | 9296 | 11820 |
| interview-protocol SKILL.md body | 7270 | 7270 |
| conductor preloaded skills total | 43534 | 46058 |
| copilot inlined sdd-conventions | 9089 | 9089 |
| copilot inlined interview-protocol | 9148 | 9148 |
| copilot inlined options-analysis | 3716 | 3716 |
| copilot inlined gate-protocol | 8114 | 8114 |
| copilot inlined phase-ideation | 9294 | 11818 |
| copilot inlined phase-spec | 6300 | 6300 |
| copilot inlined phase-plan | 2087 | 2087 |
| copilot conductor inlined total | 47748 | 50272 |

After C005-T-012 (interview-protocol §5, pre-phase round; conductor item 6):

| Measure | After C005-T-012 |
|---|---|
| conductor body | 5027 |
| phase-ideation SKILL.md body | 11820 |
| interview-protocol SKILL.md body | 8134 |
| conductor preloaded skills total | 46922 |
| copilot inlined sdd-conventions | 9089 |
| copilot inlined interview-protocol | 10012 |
| copilot inlined options-analysis | 3716 |
| copilot inlined gate-protocol | 8114 |
| copilot inlined phase-ideation | 11818 |
| copilot inlined phase-spec | 6300 |
| copilot inlined phase-plan | 2087 |
| copilot conductor inlined total | 51136 |

## Evals

C005-T-014 and C005-T-015 (DOD-G-01, C005-ADR-002): every Claude Code eval session of CHG-005, in the order it ran,
with the dev runs of the text tasks, the floor runs and the regression runs. Host Claude Code, `--auth subscription`:
the costs are notional (`cost_usd` of the result files in `evals/results/`). Classes: high-risk 10 runs, at least 9
passes (`release` tier); standard 3 runs, 3 passes (`milestone` tier); regression 1 run (Q-budget-02). Running
total against the 30 to 60 USD envelope of Q-budget-01; discarded runs are counted.

| Task | Label | Case | Class | Tier | Runs | Passes | Result | Cost USD | Running total USD | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| C005-T-007 | `c005-t007` | C005-TS-120 | standard | dev | 1 | 1 | pass | 0.2749 | 0.27 |  |
| C005-T-007 | `c005-t007` | C005-TS-121 | standard | dev | 1 | 1 | pass | 0.5152 | 0.79 | 1 of 1 run(s) ended at the 0.50 USD session cap; the assertions held |
| C005-T-007 | `c005-t007` | C005-TS-141 | standard | dev | 1 | 1 | pass | 0.5055 | 1.30 | 1 of 1 run(s) ended at the 0.50 USD session cap; the assertions held |
| C005-T-007 | `c005-t007` | C005-TS-142 | standard | dev | 1 | 1 | pass | 0.5285 | 1.82 | 1 of 1 run(s) ended at the 0.50 USD session cap; the assertions held |
| C005-T-007 | `c005-t007` | C005-TS-143 | standard | dev | 1 | 1 | pass | 0.5208 | 2.34 | 1 of 1 run(s) ended at the 0.50 USD session cap; the assertions held |
| C005-T-010 | `c005-t010` | C005-TS-101 | standard | dev | 1 | 1 | pass | 0.3086 | 2.65 |  |
| C005-T-010 | `c005-t010` | C005-TS-102 | standard | dev | 1 | 1 | pass | 0.2062 | 2.86 |  |
| C005-T-010 | `c005-t010` | C005-TS-103 | standard | dev | 1 | 1 | pass | 0.1570 | 3.02 |  |
| C005-T-010 | `c005-t010` | C005-TS-104 | standard | dev | 1 | 1 | pass | 0.2312 | 3.25 |  |
| C005-T-010 | `c005-t010` | C005-TS-105 | standard | dev | 1 | 1 | pass | 0.2384 | 3.49 |  |
| C005-T-010 | `c005-t010` | C005-TS-106 | standard | dev | 1 | 0 | fail | 0.2330 | 3.72 | dev run below the bar; fixed in C005-T-011, rerun below |
| C005-T-010 | `c005-t010` | C005-TS-107 | standard | dev | 1 | 1 | pass | 0.2289 | 3.95 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-106 | standard | dev | 1 | 1 | pass | 0.3127 | 4.26 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-158 | standard | dev | 1 | 1 | pass | 0.2286 | 4.49 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-159 | standard | dev | 1 | 1 | pass | 0.1996 | 4.69 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-160 | standard | dev | 1 | 1 | pass | 0.2200 | 4.91 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-161-1 | standard | dev | 1 | 1 | pass | 0.2446 | 5.15 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-161-2 | standard | dev | 1 | 1 | pass | 0.2467 | 5.40 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-161-3 | standard | dev | 1 | 1 | pass | 0.2435 | 5.64 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-162 | standard | dev | 1 | 1 | pass | 0.2436 | 5.89 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-163 | standard | dev | 1 | 1 | pass | 0.2512 | 6.14 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-173 | standard | dev | 1 | 1 | pass | 0.2646 | 6.40 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-174 | standard | dev | 1 | 1 | pass | 0.2104 | 6.61 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-108 | high-risk | dev | 1 | 1 | pass | 0.2461 | 6.86 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-109 | high-risk | dev | 1 | 0 | fail | 0.2441 | 7.10 | dev run below the bar; fixed in C005-T-012 (G2 fixture), rerun below |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-110 | standard | dev | 1 | 1 | pass | 0.2405 | 7.34 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-112-G1 | standard | dev | 1 | 1 | pass | 0.2479 | 7.59 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-112-G2 | standard | dev | 1 | 1 | pass | 0.3095 | 7.90 |  |
| C005-T-011, C005-T-012 | `c005-t011-t012` | C005-TS-113 | standard | dev | 1 | 1 | pass | 0.2577 | 8.16 |  |
| C005-T-012 (G2) | `c005-t012-g2` | C005-TS-109 | high-risk | dev | 1 | 1 | pass | 0.2404 | 8.40 |  |
| C005-T-012 (G2) | `c005-t012-g2` | C005-TS-112-G2 | standard | dev | 1 | 1 | pass | 0.3099 | 8.71 |  |
| C005-T-014 | `t014-floor` | C005-TS-101 | standard | milestone | 3 | 3 | pass | 0.7753 | 9.48 |  |
| C005-T-014 | `t014-floor` | C005-TS-102 | standard | milestone | 3 | 3 | pass | 0.6203 | 10.11 |  |
| C005-T-014 | `t014-floor` | C005-TS-103 | standard | milestone | 3 | 3 | pass | 0.4087 | 10.51 |  |
| C005-T-014 | `t014-floor` | C005-TS-104 | standard | milestone | 3 | 3 | pass | 0.5847 | 11.10 |  |
| C005-T-014 | `t014-floor` | C005-TS-105 | standard | milestone | 3 | 3 | pass | 0.6852 | 11.78 |  |
| C005-T-014 | `t014-floor` | C005-TS-106 | standard | milestone | 3 | 3 | pass | 0.6754 | 12.46 |  |
| C005-T-014 | `t014-floor` | C005-TS-107 | standard | milestone | 3 | 3 | pass | 0.6670 | 13.13 |  |
| C005-T-014 | `t014-floor` | C005-TS-158 | standard | milestone | 3 | 3 | pass | 0.7107 | 13.84 |  |
| C005-T-014 | `t014-floor` | C005-TS-159 | standard | milestone | 3 | 3 | pass | 0.6060 | 14.44 |  |
| C005-T-014 | `t014-floor` | C005-TS-160 | standard | milestone | 3 | 3 | pass | 0.6497 | 15.09 |  |
| C005-T-014 | `t014-floor` | C005-TS-161-1 | standard | milestone | 3 | 1 | fail | 0.7040 | 15.80 | discarded: reply counter not reset between runs (harness fix `1874eed`); rerun below |
| C005-T-014 | `t014-floor` | C005-TS-161-2 | standard | milestone | 3 | 1 | fail | 0.6957 | 16.49 | discarded: reply counter not reset between runs (harness fix `1874eed`); rerun below |
| C005-T-014 | `t014-floor` | C005-TS-161-3 | standard | milestone | 3 | 1 | fail | 0.7212 | 17.21 | discarded: reply counter not reset between runs (harness fix `1874eed`); rerun below |
| C005-T-014 | `t014-floor` | C005-TS-162 | standard | milestone | 3 | 3 | pass | 0.7116 | 17.93 |  |
| C005-T-014 | `t014-floor` | C005-TS-163 | standard | milestone | 3 | 3 | pass | 0.7060 | 18.63 |  |
| C005-T-014 | `t014-floor` | C005-TS-173 | standard | milestone | 3 | 1 | fail | 0.6876 | 19.32 | discarded: reply counter not reset between runs (harness fix `1874eed`); rerun below |
| C005-T-014 | `t014-floor` | C005-TS-174 | standard | milestone | 3 | 1 | fail | 0.6228 | 19.94 | discarded: reply counter not reset between runs (harness fix `1874eed`); rerun below |
| C005-T-014 | `t014-floor-rerun` | C005-TS-161-1 | standard | milestone | 3 | 3 | pass | 0.7365 | 20.68 | rerun after `1874eed` |
| C005-T-014 | `t014-floor-rerun` | C005-TS-161-2 | standard | milestone | 3 | 3 | pass | 0.7364 | 21.41 | rerun after `1874eed` |
| C005-T-014 | `t014-floor-rerun` | C005-TS-161-3 | standard | milestone | 3 | 3 | pass | 0.7376 | 22.15 | rerun after `1874eed` |
| C005-T-014 | `t014-floor-rerun` | C005-TS-173 | standard | milestone | 3 | 3 | pass | 0.7808 | 22.93 | rerun after `1874eed` |
| C005-T-014 | `t014-floor-rerun` | C005-TS-174 | standard | milestone | 3 | 3 | pass | 0.6415 | 23.57 | rerun after `1874eed` |
| C005-T-015 | `t015-floor` | C005-TS-108 | high-risk | release | 10 | 10 | pass | 2.3654 | 25.94 |  |
| C005-T-015 | `t015-floor` | C005-TS-109 | high-risk | release | 10 | 1 | fail | 2.8231 | 28.76 | discarded: fixture gap, defect D-002; rerun below |
| C005-T-015 | `t015-floor` | C005-TS-110 | standard | milestone | 3 | 3 | pass | 0.7517 | 29.51 |  |
| C005-T-015 | `t015-floor` | C005-TS-112-G1 | standard | milestone | 3 | 3 | pass | 0.7528 | 30.27 |  |
| C005-T-015 | `t015-floor` | C005-TS-112-G2 | standard | milestone | 3 | 3 | pass | 1.1152 | 31.38 | 1 of 3 run(s) ended at the 0.50 USD session cap; the assertions held |
| C005-T-015 | `t015-floor` | C005-TS-113 | standard | milestone | 3 | 3 | pass | 0.7366 | 32.12 |  |
| C005-T-015 | `t015-floor-d002` | C005-TS-109 | high-risk | release | 10 | 10 | pass | 2.3596 | 34.48 | rerun after D-002 (`ad8bc93`) |
| C005-T-015 | `t015-floor` | C005-TS-120 | standard | milestone | 3 | 3 | pass | 0.7329 | 35.21 |  |
| C005-T-015 | `t015-floor` | C005-TS-121 | standard | milestone | 3 | 3 | pass | 1.9620 | 37.17 | session cap 1.00 USD (cap exception, P-01) |
| C005-T-015 | `t015-floor` | C005-TS-141 | standard | milestone | 3 | 3 | pass | 1.8069 | 38.98 | session cap 1.00 USD (cap exception, P-01) |
| C005-T-015 | `t015-floor` | C005-TS-142 | standard | milestone | 3 | 3 | pass | 1.8555 | 40.84 | session cap 1.00 USD (cap exception, P-01) |
| C005-T-015 | `t015-floor` | C005-TS-143 | standard | milestone | 3 | 3 | pass | 2.0368 | 42.87 | session cap 1.00 USD (cap exception, P-01) |
| C005-T-015 | `t015-regr` | TS-211 | regression | dev | 1 | 1 | pass | 0.3093 | 43.18 |  |
| C005-T-015 | `t015-regr` | TS-206 | regression | dev | 1 | 1 | pass | 0.4440 | 43.63 |  |
| C005-T-015 | `t015-regr` | TS-208 | regression | dev | 1 | 1 | pass | 0.2496 | 43.88 |  |
| C005-T-015 | `t015-regr` | TS-212 | regression | dev | 1 | 1 | pass | 0.2072 | 44.08 |  |
| C005-T-015 | `t015-regr` | TS-622 | regression | dev | 1 | 1 | pass | 0.5518 | 44.63 | 1 of 1 run(s) ended at the 0.50 USD session cap; the assertions held |
| C005-T-015 | `t015-regr` | TS-815 | regression | dev | 1 | 1 | pass | 0.5244 | 45.16 | 1 of 1 run(s) ended at the 0.50 USD session cap; the assertions held |
| C005-T-015 | `t015-regr` | TS-817-stop | regression | dev | 1 | 1 | pass | 0.3607 | 45.52 |  |
| C005-T-015 | `t015-regr` | TS-817-specify | regression | dev | 1 | 1 | pass | 0.1817 | 45.70 |  |
| C005-T-014 | `t014-regr` | TS-122 | regression | dev | 1 | 1 | pass | 0.2028 | 45.90 |  |
| C005-T-014 | `t014-regr` | TS-219-claude-code | regression | dev | 1 | 1 | pass | 0.2016 | 46.11 |  |
| C005-T-014 | `t014-regr` | toy-g3-cfg-full | regression | dev | 1 | 1 | pass | 0.3209 | 46.43 |  |

**Total: 46.43 USD notional**, inside the envelope of Q-budget-01. Every case meets its floor:

- **Harness fix (C005-T-014):** the first floor runs of C005-TS-161 (three rows), C005-TS-173 and C005-TS-174 passed
  1 of 3. The scripted kind-round reply of `evals/chg005/kind-round.mjs` kept its round counter across the runs of
  one case, so runs 2 and 3 got the wrong answer. The reply is now reset per run (`1874eed`); the five cases passed
  3 of 3 on rerun. No agent text changed.
- **D-002 (C005-T-015):** C005-TS-109 passed 1 of 10. Its fixture spec covered export only, so the scripted answer
  "No, import first" was out of scope and the conductor rightly asked a second round. The fixture now gives the
  approved spec an import requirement (`evals/chg005/pre-phase.mjs`, `withImport`; `ad8bc93`); C005-TS-109 passed
  10 of 10 on rerun. D-002 closed, C005-T-012 reported done again.
- **Cap exception:** before the planner cases, the dev runs of C005-TS-121 and C005-TS-141 to C005-TS-143 had ended at
  the 0.50 USD session cap. P-01 granted a session cap of 1.00 USD for these four cases
  (`evals/harness/caps.mjs` `CAP_EXCEPTIONS`, `1874eed`).
- **Regression:** the 11 sessions of Q-budget-02 passed. The toy chain ran its first session only, the
  `/architect:new … --kind brownfield` session (Q-budget-03).
- **Sessions at the cap:** one floor run of C005-TS-112-G2 and the regression runs of TS-622 and TS-815 ended at the
  0.50 USD session cap (`error_max_budget_usd`; the cap is checked between turns, so the cost can pass it slightly).
  Their assertions held, so the runs count as passes under the harness rules. None of these cases is a planner case.
