---
id: "C005-ADR-002"
artifact: plan/adr
change: "CHG-005"
phase: 20-plan
status: accepted
---
# C005-ADR-002 — Release-risk classes of the CHG-005 eval scenarios

## Context and problem

DOD-G-01 (constitution, Global DoD) sets the pass floor of every scenario verified at level `eval`: a scenario that the
change's release ADR classes as high-risk passes at least 9 of 10 runs; every other scenario passes 3 of 3, and a 2 of
3 result triggers a 10-run check that needs at least 9 of 10. This ADR is CHG-005's release ADR. Without it, C005-T-014
and C005-T-015 have no run count per case, and the exit criterion of milestone 3 cannot be checked.

Forces:

1. **The scenarios.** C005-DOD-001 names 25 `@eval` scenarios that run on Claude Code. They are 28 cases, since
   C005-TS-112 has two Examples rows and C005-TS-161 three (plan, Test mapping, Level eval). C005-TS-156 is carried to
   CHG-003 and is not classed here (C005-DOD-001; Q-opencode-01).
2. **The inherited rule.** C001-ADR-003 (revision 2026-10-23) classed the scenarios of release 0.1.0 with five
   classes: G (a gate presented, refused or enforced; unattended mode never approving and stopping when it must; the
   blocking flag), S (write scope, tool data outside the repository, guards), I (injection), R (the routing suite) and
   D (evidence of DOD-G-02 to DOD-G-07, or of an NFR threshold). A scenario in none of them is standard. Its argument
   for C001-TC-213 keeps a scenario standard when its failure stays visible and is caught before any approval or any
   write outside scope. CHG-005 has no routing suite and no injection scenario.
3. **The budget.** P-01 chose the DOD-G-01 floor: about 112 sessions (one dev run and three floor runs per case),
   roughly 30 to 60 USD notional (Q-budget-01), and one run of each of 11 existing regression evals inside the same
   envelope (Q-budget-02), of `evals/toy/toy-g3.eval.mjs` its first session only (Q-budget-03). Each high-risk case adds 7 sessions (10 floor runs in place of 3). C005-T-014 step 3 stops
   and has the conductor ask P-01 before the running total passes the upper bound (C005-RISK-007).
4. **The test-designer's candidates.** C005-TS-101 (D-032 main case), C005-TS-104 (a declined change creates nothing),
   C005-TS-108 (D-034 main case; a failure changes an approval hash) and C005-TS-142 (a misplaced marker exempts an
   open task from the archive), marked "Test-designer candidate" in the Classification table below.
5. **Checks outside the evals.** Deterministic checks of this change catch some failures of these scenarios:
   LINT-HAND-003 reports a hand-off without a versioned install line while the plan is open (C005-REQ-108);
   LINT-TASK-005 reports a second marked task (C005-REQ-115); the archive refuses with ERR-CLI-009 while an unmarked
   task is open (C005-REQ-112); and P-01 reviews every plan at G3.
6. **The session cost.** The new cases have no cap exception, so every session runs at the default cap of 0.50 USD,
   which one turn can overrun (`evals/harness/caps.mjs` › `DEFAULT_MAX_BUDGET_USD`, `CAP_EXCEPTIONS`). Measured
   comparables (`docs/metrics/eval-metrics.md`, 2026-10-11, doubled as C001-ADR-003 did for the stand-in models of
   that date): a profile round through `/architect:new` (`evals/cap01/TS-122.eval.mjs`) 0.12 USD, so about 0.25; a
   round logged in an open phase (`evals/cap02/TS-206`, `TS-208`, `TS-211`, `TS-212`) 0.08 to 0.20 USD, so about 0.30;
   a planner writing a lite plan and its hand-off (`evals/cap06/TS-622.eval.mjs`) 0.52 USD, at the cap. The first
   session of the toy chain, `/architect:new … --kind brownfield`, cost 0.27 USD on 2026-11-08
   (`evals/results/toy-g3-cfg-full-chain-2026-11-08T07-30-39-152Z.json`).

## Considered options

Analysis: section "Options analysis" below, five candidate rules. As in C005-ADR-001, the analysis of this lite change
is a section of the ADR file, with the headings of the options-analysis skill.

1. **A — C001-ADR-003 rule as written** (recommended, 4.45): C005-TS-108 and C005-TS-109 are high-risk (class G); the
   other 23 scenarios are standard.
2. **B — A plus a decline class** (4.25): A, plus C005-TS-104 and C005-TS-174, in which P-01 declines the change
   before it exists.

Rejected: C — main cases of D-032 and D-034 (3.00); E — no high-risk scenario (2.80); D — the test-designer's four
candidates (2.55). Reasons: Options analysis, Rejected.

## Decision outcome

Chosen: **A**. CHG-005 classes its eval scenarios by the rule of C001-ADR-003, unchanged. C005-TS-108 and C005-TS-109
meet class G: each checks that the approval of the gate before a pre-phase round stays in force. The approved phase's
questions log stays byte-identical, its hash equals the one in `approvals.json` (C005-TS-108), and `sdd stale check`
reports no stale phase. A failure there is D-034 itself: the approved phase becomes stale and needs a revision and a
new approval, and `sdd archive` refuses until then. No other scenario meets a class (table below). A leads B by 0.20,
no near tie; B differs only in counting a declined change created anyway as grave as a changed approval
(Sensitivity).

Accepted by P-01 on 2026-11-17: Q-riskclass-01, answer "Accept rule A (Recommended)" (`../questions-log.md`, round 3).

### Classification

Floor runs on the final text, in C005-T-014 and C005-T-015. High-risk: 10 runs, at least 9 passes. Standard: 3 runs,
3 passes; a 2 of 3 result triggers a 10-run check that needs at least 9 of 10 (DOD-G-01).

| Case | Scenario | Task | Class | Floor runs | Reason |
|---|---|---|---|---|---|
| C005-TC-001 | C005-TS-101 | C005-T-014 | standard | 3 | Test-designer candidate. A failure creates the change with the CLI defaults; `change.md` and `sdd status` show its profile and kind before any phase work, and no approval or file outside `.sdd/` depends on it. It meets no class. |
| C005-TC-002 | C005-TS-102 | C005-T-014 | standard | 3 | As C005-TS-101, through `/architect:new`. |
| C005-TC-003 | C005-TS-103 | C005-T-014 | standard | 3 | A failure asks one question too many and writes nothing. |
| C005-TC-004 | C005-TS-104 | C005-T-014 | standard | 3 | Test-designer candidate. A failure creates a change folder that P-01 declined: inside `.sdd/`, the conductor's write scope (not class S), shown in its reply, removable before any phase work. Class G covers stops at a gate (C001-TC-817), and this round is no gate. B would class it high-risk. |
| C005-TC-005 | C005-TS-105 | C005-T-014 | standard | 3 | "Do not ask me anything" is P-01's own instruction, not content addressed to the agent (not class I); a failure shows as in C005-TS-101. |
| C005-TC-006 | C005-TS-106 | C005-T-014 | standard | 3 | A wrong option shows in `change.md` before any phase work. |
| C005-TC-007 | C005-TS-107 | C005-T-014 | standard | 3 | As C005-TS-106. |
| C005-TC-056 | C005-TS-158 | C005-T-014 | standard | 3 | Kind round: a failure shows in the round or in `change.md`. |
| C005-TC-057 | C005-TS-159 | C005-T-014 | standard | 3 | As C005-TS-158. |
| C005-TC-058 | C005-TS-160 | C005-T-014 | standard | 3 | As C005-TS-158. |
| C005-TC-059 | C005-TS-161 | C005-T-014 | standard | 3 per row (3 rows) | As C005-TS-158. |
| C005-TC-060 | C005-TS-162 | C005-T-014 | standard | 3 | As C005-TS-158. |
| C005-TC-061 | C005-TS-163 | C005-T-014 | standard | 3 | As C005-TS-158. |
| C005-TC-071 | C005-TS-173 | C005-T-014 | standard | 3 | As C005-TS-158. |
| C005-TC-072 | C005-TS-174 | C005-T-014 | standard | 3 | As C005-TS-104, in the further round. B would class it high-risk. |
| C005-TC-008 | C005-TS-108 | C005-T-015 | **high-risk (G)** | 10 | Test-designer candidate. Checks that the G1 approval stays in force: the `00-ideation` log byte-identical, `sdd hash` equal to `approvals.json`, no stale phase. A failure is D-034. |
| C005-TC-009 | C005-TS-109 | C005-T-015 | **high-risk (G)** | 10 | Checks the same for G2: the `10-spec` log byte-identical, no stale phase. Not among the test-designer's candidates; the rule gives it the class of C005-TS-108, whose failure it shares. |
| C005-TC-010 | C005-TS-110 | C005-T-015 | standard | 3 | Its Then checks only the log of the not-started phase; C005-TS-108 and C005-TS-109 check the approved logs. |
| C005-TC-012 | C005-TS-112 | C005-T-015 | standard | 3 per row (2 rows) | A missing mark stays in the log of a not-started phase, which the gate review of that phase reads. |
| C005-TC-013 | C005-TS-113 | C005-T-015 | standard | 3 | A wrong mark in the log of a draft phase; no approval is involved. |
| C005-TC-020 | C005-TS-120 | C005-T-015 | standard | 3 | A missing or placeholder install line is an error of LINT-HAND-003 while the plan is open (C005-REQ-108). |
| C005-TC-021 | C005-TS-121 | C005-T-015 | standard | 3 | As C005-TS-120. |
| C005-TC-041 | C005-TS-141 | C005-T-015 | standard | 3 | A second marker is an error of LINT-TASK-005; a missing marker gives ERR-CLI-009 naming the archive task, the 0.1.0 behaviour; a marker on another task leaves the archive task unmarked, so the archive refuses while that task is open. P-01 sees the marker at G3. |
| C005-TC-042 | C005-TS-142 | C005-T-015 | standard | 3 | Test-designer candidate. As C005-TS-141, for a lite plan. CHG-005's own archive task carries the marker in this plan (C005-T-023); its archive depends on the CLI (C005-TS-139, an integration test), not on this eval. |
| C005-TC-043 | C005-TS-143 | C005-T-015 | standard | 3 | The misplaced-marker case; caught as in C005-TS-141. |

Result: 2 high-risk cases (20 floor runs) and 26 standard cases (78 floor runs), 98 floor sessions; with the 28 dev
runs, 126 sessions, 14 more than Q-budget-01's 112. C005-T-014 holds 51 floor sessions and C005-T-015 holds 47. The 11
regression evals of Q-budget-02 are no scenarios of this change and get no class: one run each.

### Run rules

- The dev run of a case, in the task that writes it, is not a floor run: floor runs start on the final text (plan,
  Strategy, rule 5).
- "Runs whose Given does not hold" of C001-ADR-003 applies unchanged: such a run is recorded with `valid_run` false,
  does not count, and is replaced once; a second such run in its place counts as a failure. It concerns the cases
  whose Given needs an earlier question of the conductor in the same session (for example C005-TS-162, C005-TS-173,
  C005-TS-174). Replacement sessions are outside the estimate below.
- "Reuse of earlier results" of C001-ADR-003 applies unchanged. No earlier result qualifies: a dev run has one run, and
  CHG-005 changes the conductor and its preloaded skills.

### Expected cost

Notional USD as the harness estimates it. Expected: 0.25 per create-change session, 0.30 per pre-phase session, 0.50
per planner session (force 6). Worst: 0.55 per session, the cap plus one overrunning turn.

| Part | Sessions | Expected USD | Worst USD |
|---|---|---|---|
| Dev runs, 28 cases × 1 (17 create-change, 6 pre-phase, 5 planner) | 28 | 8.55 | 15.40 |
| Floor runs of C005-T-014, 17 standard cases × 3 | 51 | 12.75 | 28.05 |
| Floor runs of C005-T-015: C005-TS-108 and C005-TS-109 × 10; 4 other pre-phase cases × 3; 5 planner cases × 3 | 47 | 17.10 | 25.85 |
| 10-run checks after a 2 of 3 result: about 3 of the 26 standard cases (C001-ADR-003 expected about 7 of 59) × 7 | about 21 | 6.30 | bounded by the stop rule |
| Regression evals other than toy-g3, one run each (Q-budget-02): the Claude Code sessions of the ten files that C005-T-014 step 2 and C005-T-015 step 2 name (below); worst adds the 1.50 USD rule-2 replacements of `TS-622` and `TS-815`, which ended at the cap in 0.1.0 | 10 | 3.24 | 8.50 |
| toy-g3, first session only: `/architect:new … --kind brownfield` (Q-budget-03; rule 1, cap 6.00 USD) | 1 | 0.27 | 6.00 |
| **Total** | **about 158** | **about 48.20** | **about 83.80** |

- The ten regression sessions are the rows that the Claude Code host runs (`evals/harness/run.mjs` › `selectScenarios`
  leaves out rows of another host): `TS-122`, `TS-219-claude-code` (`--only`), `TS-206`, `TS-208`, `TS-211`, `TS-212`,
  `TS-622`, `TS-815`, `TS-817-stop` and `TS-817-specify` (`evals/cap08/TS-817.eval.mjs` holds two scenarios, two rows
  in `evals/harness/caps.mjs`). `evals/targets/question-tool/TS-316.eval.mjs` holds only OpenCode rows
  (`TS-316-dismissed`, `TS-316-empty`, `host: "opencode"`) and so starts no Claude Code session. Expected cost per
  session: the 0.1.0 median of `docs/metrics/eval-metrics.md`, doubled as in force 6 and capped at 0.50 USD (0.23,
  0.25 as a create-change session since `TS-219` has no metric, 0.40, 0.21, 0.28, 0.17, 0.50, 0.50, 0.50, 0.20).
  Worst: 10 × 0.55 plus the two replacements.
- The classification adds 14 sessions, about 4.20 USD expected (7.70 worst), to the floor of Q-budget-01. The expected
  total stays inside 30 to 60 USD, with about 11.80 USD of reserve for reruns after a defect (C005-T-014 step 4).
- The upper bound of Q-budget-01 is about the floor with every session at its cap, so the worst case passes 60 USD
  whatever the classification; the stop-and-ask rule of C005-T-014 step 3 bounds it.
- **toy-g3, first session only.** P-01 answered Q-budget-03 "First session only (Recommended)" on 2026-11-17: the one
  run of toy-g3 is its `/architect:new … --kind brownfield` session, 0.27 USD in 0.1.0. The whole chain to G3, which
  cost 58.17 USD on cfg-full (16 sessions, 2026-11-08), does not run; it would have put the expected total at about
  106 USD. This ADR's classification does not depend on the answer.

## Consequences

Good:

- The rule of release 0.1.0 carries over unchanged, so the DOD-G-01 floor means the same in both releases, and
  `docs/release-0.1.1-evidence.md` records each case's class, runs, passes and cost as the 0.1.0 evidence did.
- 9 of 10 evidence covers the failure that D-034 names, at both gates where it occurs.
- Of the rules that keep every class-G scenario high-risk, this one adds the least: 14 sessions, about 4.20 USD
  expected.

Bad, and how the plan handles it:

- D-032's main case C005-TS-101 and the decline cases C005-TS-104 and C005-TS-174 carry the weaker 3 of 3 evidence: a
  behaviour that passes 90 % of its runs passes 3 of 3 with p ≈ 0.73 (C001-ADR-003). Their failures show in the
  conductor's reply or in `change.md` before any phase work, and the recorded Copilot VS Code runs (C005-TS-155,
  C005-TS-157) exercise the same shared text once more on the second host (C005-CON-07).
- The planner cases (C005-TS-120, C005-TS-121, C005-TS-141 to C005-TS-143) are expected near the 0.50 USD cap, and a
  session that ends at the cap fails its case. If the dev runs of C005-T-007 end at the cap, the conductor asks P-01
  for a cap exception (`evals/harness/caps.mjs`, C002-IF-010 §2.2) before C005-T-015, as P-01 granted for the
  release-standard rows of 0.1.0.
- Runs whose Given does not hold and reruns after a defect are outside the estimate; the reserve and the stop rule of
  C005-T-014 cover them (C005-RISK-007).

Affected components: C005-COMP-001 and C005-COMP-002, whose agent behaviour the 28 cases test. No constraint changes
and no new constraint follows.

Follow-up for the plan:

- C005-T-014 and C005-T-015 take their run counts from the Classification table: the two high-risk cases belong to
  C005-T-015. Of the test-designer's candidates, C005-TS-108 is high-risk and C005-TS-101, C005-TS-104 and
  C005-TS-142 are standard; C005-TS-109 is high-risk as well.
- The session and cost totals of `plan.md` ("Evals and budget", C005-T-014 step 3) follow the Expected cost table:
  about 158 sessions, about 48.20 USD expected.
- C005-T-015 step 2 names `evals/targets/question-tool/TS-316.eval.mjs`, which runs no Claude Code session (Expected
  cost); the plan either drops it from the Claude Code regression runs or names the run that is meant.

## Options analysis

### Problem

Which rule classes the 25 Claude Code eval scenarios of CHG-005 (28 cases) as high-risk (10 runs, at least 9 passes)
or standard (3 runs, 3 passes) under DOD-G-01, and so which cases C005-T-014 and C005-T-015 run 10 times. It is decided
now because the eval tasks and the exit criterion of milestone 3 need a run count per case, and the result must fit the
Q-budget-01 envelope. Binding: DOD-G-01, C001-ADR-003, C005-DOD-001, Q-budget-01, Q-budget-02, C005-RISK-007. Out of
scope: the floor itself (constitution), the budget (P-01), C005-TS-156 (carried to CHG-003) and the extent of the
toy-g3 regression run (Q-budget-03).

### Criteria

| Criterion | Weight (%) | Scores high when |
|---|---|---|
| Fit with the inherited rule | 25 | every scenario that meets a class of C001-ADR-003 is high-risk, and every high-risk scenario names its class |
| Assurance on grave failures | 30 | 9 of 10 evidence covers the scenarios whose failure (a) changes an approval record or (b) acts against P-01's explicit decline: 5 = all of (a) and (b); 4 = all of (a); 3 = part of (a); 2 = only failures visible at once; 1 = none |
| Low spend | 25 | few sessions added to the floor of Q-budget-01, leaving reserve for 10-run checks and reruns: 5 = none; 4 = 14; 3 = 28; 2 = 42; 1 = more |
| Consistent classes | 20 | scenarios with the same failure share a class: C005-TS-108 and C005-TS-109; C005-TS-104 and C005-TS-174; C005-TS-141 and C005-TS-142; C005-TS-101 and C005-TS-102 |

### Candidates

- **A — C001-ADR-003 rule as written**: classes G, S, I, R and D; high-risk C005-TS-108 and C005-TS-109.
- **B — A plus a decline class**: A, plus a class for P-01's decline of a change before it exists, taken from the
  "stops when it must" part of class G; adds C005-TS-104 and C005-TS-174.
- **C — main cases of D-032 and D-034**: C005-TS-101 and C005-TS-108, the two main cases that Q-budget-01 option 2
  named.
- **D — the test-designer's four**: C005-TS-101, C005-TS-104, C005-TS-108 and C005-TS-142, chosen by the consequence
  of a failure.
- **E — none**: every scenario standard; the "do less" candidate.

Searched: every scenario high-risk (28 cases × 10, 196 more sessions, about 60 USD more expected) passes the Q-budget-01
envelope by itself and is no candidate.

### Scores

| Candidate | Fit with the inherited rule | Assurance on grave failures | Low spend | Consistent classes | Weighted |
|---|---|---|---|---|---|
| A — C001-ADR-003 rule as written | 5 | 4 | 4 | 5 | 4.45 |
| B — A plus a decline class | 4 | 5 | 3 | 5 | 4.25 |
| C — main cases of D-032 and D-034 | 2 | 3 | 4 | 3 | 3.00 |
| D — the test-designer's four | 2 | 3 | 3 | 2 | 2.55 |
| E — none | 1 | 1 | 5 | 5 | 2.80 |

- **Fit with the inherited rule.** A 5: the rule unchanged. B 4: the five classes kept and one added, derived from
  class G but applied outside a gate. C 2 and D 2: C005-TS-109 meets class G and stays standard, while C005-TS-101 (C,
  D), C005-TS-104 and C005-TS-142 (D) meet no class. E 1: C005-TS-108 and C005-TS-109 meet class G and stay standard.
- **Assurance on grave failures.** B 5: both kinds. A 4: all of (a), none of (b). C 3: C005-TS-108 of (a), plus
  C005-TS-101, whose failure is visible at once. D 3: C005-TS-108 of (a) and C005-TS-104 of (b), but neither
  C005-TS-109 nor C005-TS-174; its other two cases fail visibly (C005-TS-101) or are caught by LINT-TASK-005,
  ERR-CLI-009 and the G3 review (C005-TS-142). E 1: none.
- **Low spend.** E 5: nothing added. A and C 4: 14 sessions, about 4.20 and 3.85 USD expected. B and D 3: 28
  sessions, about 7.70 and 9.10 USD expected (D's planner case C005-TS-142 near the 0.50 USD cap).
- **Consistent classes.** A, B and E 5: every pair shares a class. C 3: two pairs split (C005-TS-108 and C005-TS-109;
  C005-TS-101 and C005-TS-102). D 2: all four pairs split.

### Sensitivity

A leads B by 0.25 × 1 − 0.30 × 1 + 0.25 × 1 = 0.20. B ranks first when the weight of assurance exceeds the weights of
fit and spend together (weights 15/50/15/20: A 4.35, B 4.55), or when a declined change created anyway counts as grave
as a changed approval, which lowers A's assurance score to 3 (A 4.15, B 4.25). This ADR reads the two failures
differently: the declined folder stays inside `.sdd/`, shows in the conductor's reply and is removed before any phase
work, while a changed approval surfaces only at the next `sdd stale check` and costs a revision and a new approval.
P-01 may weigh them otherwise, which is why B is presented. C and D score at most A's score on every criterion, so no
weighting ranks them above A. E ranks above A only when low spend weighs more than four times fit plus three times
assurance, which contradicts P-01's choice of the floor over a waiver (Q-budget-01).

### Presented

1. A — C001-ADR-003 rule as written (Recommended), 4.45
2. B — A plus a decline class, 4.25

### Recommendation

A, the C001-ADR-003 rule as written: it puts 9 of 10 evidence on D-034's approval failure at both gates for 14 more
sessions and keeps the meaning of the floor of release 0.1.0. No near tie: A leads B by 0.20.

### Rejected

- C — main cases of D-032 and D-034: leaves C005-TS-109, a class-G scenario with the failure of C005-TS-108, at 3
  runs, and spends 7 sessions on C005-TS-101, whose failure is visible before any phase work.
- D — the test-designer's four: the same gap at C005-TS-109 and C005-TS-174, and 14 sessions on C005-TS-101 and
  C005-TS-142, whose failures are visible at once or caught by LINT-TASK-005, ERR-CLI-009 and the G3 review; CHG-005's
  own archive depends on the CLI (C005-TS-139), not on C005-TS-142.
- E — none: leaves D-034's approval failure, a class-G case, at the weaker 3 of 3 evidence (p ≈ 0.73 for a behaviour
  that passes 90 % of its runs).
