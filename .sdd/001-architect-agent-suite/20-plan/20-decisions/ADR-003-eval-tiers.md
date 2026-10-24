---
id: C001-ADR-003
artifact: plan/adr
change: CHG-001
phase: 20-plan
status: approved
---

# C001-ADR-003 — Tiered runs for agent-behaviour evals

## Context and problem

History (G3, 2026-10-10): 79 test cases were at level `eval` (agent behaviour,
non-deterministic). DOD-G-01 then required ≥ 9 of 10 passing runs, and running 10 × 79 sessions
at every iteration was expensive. The test plan has 81 eval test cases after C001-TC-223,
C001-TC-224 (D-017) and C001-TC-225 (D-019). The current DOD-G-01 refers to the release classes below, with the floor set in the
constitution (v2, Q-dodg01-amend-01).

## Considered options

Options analysis: `../questions-log.md` Round 1, Q-plan-03 (4 candidates, 3 presented).

1. Tiered: 1 run per task during development, 3 runs at milestone exit, 10 runs at release (recommended)
2. 10 runs at every milestone
3. Release-only evals
4. Manual review only (rejected: C001-SC-05 needs measurement)

## Decision outcome

Option 1, chosen by P-01 ("Tiered: 1 run in dev, 10 at release (Recommended)").

| Tier | When | Runs per scenario | Pass rule |
|---|---|---|---|
| dev | task completion | 1 | pass |
| milestone | milestone exit (M-3 … M-6) | 3 | 3 / 3 (a 2 / 3 result triggers a 10-run check) |
| release | T-072 | history: 10; replaced by the release classes of the revision 2026-10-23 below | history: ≥ 9 / 10 |

## Revision 2026-10-23 — reduced release tier

P-01 chose a reduced release tier (Q-release-tier-01, `../questions-log.md` round 2026-10-23:
"reduced tier looks good", "target 1 reset maybe 2 maximum"). The floor of each class is in the
constitution's DOD-G-01 (v2, Q-dodg01-amend-01); this ADR classifies CHG-001's scenarios against it.
The full tier would be 810 scenario runs (81 × 10; 790 before C001-TC-224 and C001-TC-225) plus 220 injection runs. Q-release-tier-01's
context also counted the 420 routing runs, for about 450–1,100 USD notional. The dev and milestone
tiers are unchanged.

| Release class | Applies to | Runs | Pass rule |
|---|---|---|---|
| release-high | high-risk eval scenarios (rule below) | 10 per scenario | ≥ 9 / 10 |
| release-standard | every other eval scenario | 3 per scenario | 3 / 3; a 2 / 3 result triggers a 10-run check that needs ≥ 9 / 10 |
| routing suite | the 42 `claude plugin eval` cases of C001-TS-1117 (`plugins/architect/evals/`) | 10 per case | ≥ 90% of runs pass all their checks (C001-SC-05) |
| injection suite | the 22 cases of `evals/injection/` (C001-NFR-205) | 10 per case | 0 runs act on an injected instruction (C001-NFR-205) |

A 3 / 3 pass is weaker evidence than ≥ 9 / 10. A scenario that passes 90% of its runs passes 3 / 3
with p ≈ 0.73 (0.9³), so release-standard accepts that weaker assurance (C001-RISK-005).

**Classification rule.** An eval scenario is high-risk when at least one of these holds:

- **G, gates:** it checks that a gate is presented, refused or enforced. It also counts when it
  checks that unattended mode never approves and stops when it must, or the blocking flag of
  C001-IF-05 §1 that makes it stop (CAP-08 gate scenarios, G0 enforcement, unattended-mode
  stops, specialist blocking flags).
- **S, safety and guards:** it checks that an agent stays inside its write scope, keeps tool data
  outside the user's repository, or refuses to run where the guards cannot work.
- **I, injection:** it checks that content addressed to the agent is treated as data
  (C001-NFR-205 and the embedded-instruction scenarios).
- **R, delegation routing:** the C001-TS-1117 routing suite.
- **D, tied to a DOD-G item:** it is the evidence of DOD-G-02 … 07, or it measures an NFR
  threshold (DOD-G-05). DOD-G-01 itself covers every eval scenario, so it does not make a
  scenario high-risk. Today this class adds only the injection suite.

A scenario that meets none of them is release-standard. A new eval scenario is classified by the
same rule when it is added to `../60-test-plan.md`.

C001-TC-213 (unattended drafting) stays release-standard. It checks that unattended drafting goes
on without asking non-blocking questions and marks its assumptions. A failure there means an
unneeded question or an unmarked assumption in a draft. Both stay inside the draft and are caught
at the gate review, which C001-TC-802 … 804 hold at 10 runs. No approval and no write outside scope
can follow. C001-TC-209 (a specialist returns a blocking question it cannot decide) carries the same
blocking flag as C001-TC-223, so it is class G.

**Release run count per eval test case** (81 eval rows in `../60-test-plan.md` §8):

| Runs at release | Test cases | Class |
|---|---|---|
| 10 | C001-TC-133, C001-TC-209, C001-TC-214, C001-TC-215, C001-TC-223, C001-TC-224, C001-TC-225, C001-TC-802, C001-TC-803, C001-TC-804, C001-TC-815, C001-TC-817 | G (C001-TC-209, 215, 223 and 224: blocking flag, D-017; C001-TC-225: blocking question asked on arrival, D-019) |
| 10 | C001-TC-713, C001-TC-1015, C001-TC-1124 | S |
| 10 | C001-TC-212 (C001-TC-804 also holds the injection row) | I |
| 3 | C001-TC-119, 120, 121, 122, 127, 201, 202, 203, 206, 207, 208, 210, 211, 213, 216, 217, 218, 221, 222, 301, 303, 304, 305, 306, 307, 309, 312, 313, 315, 316, 317, 318, 319, 320, 401, 418, 419, 420, 423, 424, 507, 508, 511, 515, 609, 612, 613, 622, 710, 711, 712, 714, 715, 910, 1001, 1002, 1004, 1005, 1010, 1011, 1012, 1013, 1014, 1111, 1112 | standard |

That is 16 test cases at 10 runs and 65 at 3. A scenario with variants (Scenario Outline rows,
configurations such as C001-TC-1002's three configurations) runs all its variants in each run.
C001-TC-1117 itself is an integration test; the routing runs belong to the routing suite.

**Deferred milestone runs.** The milestone-tier runs that P-01 deferred from M-3 … M-5 to the
release are recorded in `docs/milestone-log.md`:

- the M-3 and M-4 eval test cases at milestone tier;
- the M-5 injection suite at milestone tier, with the re-planted INJ-19.

The release runs close them, because every release class runs at least the milestone count (3) with
at least the milestone pass rule. The other items of those rows are not eval runs, so C001-T-072
closes them with named evidence: a toy change reaching G2, a toy change reaching G3 on cfg-full and
cfg-bare, and the eval budget decision (Q-release-tier-01).

**Reuse of earlier results.** An earlier result counts for the release only when all of these hold:

- it has at least the release-class run count and meets its pass rule;
- it ran on the current models of C001-IF-09;
- the agent files and preloaded skills it exercised are unchanged since that run (same git blobs).

C001-T-082 and C001-T-083 change `sdd-conventions`, which every agent preloads. So no result from before it
qualifies for a scenario that spawns an agent.

**Expected notional cost.**

- **Source:** the latest Claude Code run of each scenario in `evals/results/*.json` (top-level
  `cost_usd` ÷ `runs`) as of 2026-10-23, and the `delegation-m6final` routing results.
- **Missing results:** eight scenarios without a result are taken at 0.15–0.55 USD by agent.
  C001-TC-223, C001-TC-224 and C001-TC-225 are taken at 1.40 USD each, like C001-TC-215.
- **Formula:** per part, runs × the per-run cost of each scenario.
  - Uplift column: the figures measured on 2026-10-11 doubled, because some specialists then still
    ran as Haiku stand-ins (D-013); for example, C001-TS-201 cost 0.11 USD then and 0.48 USD on
    2026-10-21. Routing is taken at 0.25 USD per run.
  - Expected cost: the mean of the two columns.

| Part | Runs | Measured basis | With uplift |
|---|---|---|---|
| release-high, 16 scenarios × 10 | 160 | 95 USD (9.46 per round) | 115 USD |
| release-standard, 65 scenarios × 3 | 195 | 65 USD (21.70 per round) | 94 USD |
| routing suite, 42 × 10 | 420 | 50 USD (0.119 per run) | 105 USD |
| injection suite, 22 × 10 | 220 | 42 USD (4.24 per round, 2026-10-11) | 85 USD |
| 10-run checks after 2 / 3 results (about 7 standard scenarios) | about 50 | 15 USD | 25 USD |
| **Total** | **about 1,045** | **about 270 USD** | **about 425 USD** |

The mean of the two columns is about 345 USD. Those figures come from runs in which the model saw
its budget (before C002-T-069, D-031), and full-flow cases then rationed or stopped their work.
With the budget hidden and the rule-1 rerun cap at 3.00 USD (C002-T-070; P-01 Q-cap-level-01
"Raise to $3 (Recommended)", whose option gave about 420 USD), the expected cost is **about 420 USD
notional**. The full-flow figures are measured again after the fixes, as Q-cap-level-01 says. The
target was 200–350 USD, the conductor's figure for one weekly reset of P-01's subscription. 420 USD
is past one reset and inside the maximum of two (Q-release-tier-01: "target 1 reset maybe 2
maximum").

**At 350 USD notional**, C001-T-072 stops and asks P-01 to choose. Either a second weekly reset,
which Q-release-tier-01 allows as the maximum and the 420 USD estimate expects, or the cuts below,
in this order:

1. The routing suite drops to 5 runs per case (210 runs; C001-SC-05 is a ratio over runs, so 210
   runs still measure it). This saves 25–50 USD.
2. The injection suite drops to 5 runs per case and keeps its 0-tolerance rule. This saves 20–40 USD.
3. Results that meet the reuse conditions above are reused. Few exist today, because the milestone
   runs were deferred and C001-T-082 and C001-T-083 change skills every agent preloads, so the saving is small.

## Consequences

- The release evidence (`docs/release-0.1.0-evidence.md`) records each scenario's class, runs and
  result, the deferred milestone items and what closed them, and the notional cost per part.
  Pacing follows P-01's rule: stay at or below 90% of the 5-hour window, and tell P-01 when weekly
  usage nears 90%.
- The harness (T-029) records detailed metrics per run in `evals/results/`: input, output and cache tokens per agent and model, cost estimate, and wall-clock timings per session, subagent and tool call. `docs/metrics/eval-metrics.md` aggregates them (mean, p50, p95, max) and projects the release-tier cost and duration.
- History (G3, 2026-10-10): the release eval budget was to be set by P-01 at the M-3 exit from that metrics report, and the release tier could be reduced for low-risk scenarios by revising this ADR. Q-release-tier-01 set it on 2026-10-23.
- Flakiness surfaces at milestone exit at the latest; at release, the release-standard class keeps the 3 / 3 weakness above.
- Affects: C001-COMP-12 (eval harness); C001-T-072 (release runs and evidence); C001-T-082 (D-017 checks); `../60-test-plan.md` §4; C001-RISK-005; `evals/README.md` (release table, through C001-T-072); DOD-G-01 (`../../10-spec/70-dod.md`) and the constitution's DOD-G-01 floor, which link to the release classes.
