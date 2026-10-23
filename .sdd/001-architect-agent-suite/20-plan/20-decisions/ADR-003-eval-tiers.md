---
id: C001-ADR-003
artifact: plan/adr
change: CHG-001
phase: 20-plan
status: approved
---

# C001-ADR-003 — Tiered runs for agent-behaviour evals

## Context and problem

79 test cases were at level `eval` at G3; the test plan now has 78 (agent behaviour, non-deterministic). DOD-G-01 requires
≥ 9 of 10 passing runs. Running 10 × 79 sessions at every iteration is expensive.

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
| release | T-072 | 10 (replaced by the reduced release tier, revision 2026-10-23 below) | ≥ 9 / 10 (DOD-G-01) |

## Revision 2026-10-23 — reduced release tier

P-01 chose a reduced release tier (Q-release-tier-01, `../questions-log.md` round 2026-10-23:
"reduced tier looks good", "target 1 reset maybe 2 maximum"). The full tier would be 780 scenario
runs plus 420 routing runs, about 450–1,100 USD notional. The dev and milestone tiers are unchanged.

| Tier at release | Applies to | Runs per scenario | Pass rule |
|---|---|---|---|
| release-high | high-risk eval scenarios (rule below) | 10 | ≥ 9 / 10 |
| release-standard | every other eval scenario | 3 | 3 / 3 (a 2 / 3 result triggers a 10-run check, which then needs ≥ 9 / 10) |
| routing suite | the 42 `claude plugin eval` cases of C001-TS-1117 (`plugins/architect/evals/`) | 10 per case (420 runs) | ≥ 90% of runs pass all their checks (C001-SC-05) |
| injection suite | the 22 cases of `evals/injection/` (C001-NFR-205) | 10 per case (220 runs) | 0 runs act on an injected instruction (C001-NFR-205 threshold, stricter than ≥ 9 / 10) |

**Classification rule.** An eval scenario is high-risk when at least one of these holds:

- **G, gates:** it checks that a gate is presented, refused or enforced, or that unattended mode
  never approves and stops when it must (CAP-08 gate scenarios, G0 enforcement, unattended-mode
  limits).
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

**Release run count per eval test case** (78 eval rows in `../60-test-plan.md` §8):

| Runs at release | Test cases | Class |
|---|---|---|
| 10 | C001-TC-133, C001-TC-214, C001-TC-215, C001-TC-802, C001-TC-803, C001-TC-804, C001-TC-815, C001-TC-817 | G |
| 10 | C001-TC-713, C001-TC-1015, C001-TC-1124 | S |
| 10 | C001-TC-212 (C001-TC-804 also holds the injection row) | I |
| 3 | C001-TC-119, 120, 121, 122, 127, 201, 202, 203, 206, 207, 208, 209, 210, 211, 213, 216, 217, 218, 221, 222, 301, 303, 304, 305, 306, 307, 309, 312, 313, 315, 316, 317, 318, 319, 320, 401, 418, 419, 420, 423, 424, 507, 508, 511, 515, 609, 612, 613, 622, 710, 711, 712, 714, 715, 910, 1001, 1002, 1004, 1005, 1010, 1011, 1012, 1013, 1014, 1111, 1112 | standard |

That is 12 test cases at 10 runs and 66 at 3. A scenario with variants (Scenario Outline rows,
configurations such as C001-TC-1002's three configurations) runs all its variants in each run.
C001-TC-1117 itself is an integration test; the routing runs belong to the routing suite.

**Expected notional cost** (subscription list-price estimates from `evals/results/`, latest Claude
Code run per scenario; 8 scenarios without a result are taken at 0.15–0.55 USD by agent):

| Part | Runs | Measured basis | With uplift |
|---|---|---|---|
| release-high, 12 scenarios × 10 | 120 | 51 USD (5.06 per round) | 69 USD |
| release-standard, 66 scenarios × 3 | 198 | 66 USD (21.90 per round) | 96 USD |
| routing suite, 42 × 10 | 420 | 50 USD (0.119 per run, `delegation-m6final`) | 105 USD (0.25 per run) |
| injection suite, 22 × 10 | 220 | 42 USD (4.24 per round, 2026-10-11) | 85 USD |
| 10-run checks after 2 / 3 results (about 7 standard scenarios) | about 50 | 15 USD | 25 USD |
| **Total** | **about 1,010** | **about 225 USD** | **about 380 USD** |

The uplift doubles the figures measured on 2026-10-11, when some specialists still ran as
Haiku stand-ins (D-013). For example, C001-TS-201 cost 0.11 USD then and 0.48 USD on 2026-10-21.
It also takes the routing suite at the top of its measured range. The expected cost is about
300 USD, inside the 200–350 USD target, which is about one weekly reset. The uplifted case can pass
350 USD. If so, cut in this order:

1. The routing suite drops to 5 runs per case (210 runs; C001-SC-05 is a ratio over runs, so 210
   runs still measure it). This saves 25–50 USD.
2. The injection suite drops to 5 runs per case and keeps its 0-tolerance rule. This saves 20–40 USD.
3. Release-standard scenarios that passed 3 / 3 at their milestone exit on the current models
   reuse that result. Only the others rerun. This saves up to 60 USD.

## Consequences

- The release evidence (`docs/release-0.1.0-evidence.md`) records each scenario's class, runs and
  result, and the notional cost per part. Pacing follows P-01's rule: stay at or below 90% of the
  5-hour window, and tell P-01 when weekly usage nears 90%.

- The harness (T-029) records detailed metrics per run in `evals/results/`: input, output and cache tokens per agent and model, cost estimate, and wall-clock timings per session, subagent and tool call. `docs/metrics/eval-metrics.md` aggregates them (mean, p50, p95, max) and projects the release-tier cost and duration.
- **Budget decision (G3, 2026-10-10):** the release eval budget is set by P-01 at the M-3 exit from that metrics report; the release tier may be reduced for low-risk scenarios by revising this ADR.
- Flakiness surfaces at milestone exit at the latest.
- Affects: C001-COMP-12; test plan §4; RISK-005.
