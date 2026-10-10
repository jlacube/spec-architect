---
id: C001-ADR-003
artifact: plan/adr
change: CHG-001
phase: 20-plan
status: approved
---

# C001-ADR-003 — Tiered runs for agent-behaviour evals

## Context and problem

79 test cases are at level `eval` (agent behaviour, non-deterministic). DOD-G-01 requires
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
| release | T-072 | 10 | ≥ 9 / 10 (DOD-G-01) |

## Consequences

- The harness (T-029) records detailed metrics per run in `evals/results/`: input, output and cache tokens per agent and model, cost estimate, and wall-clock timings per session, subagent and tool call. `docs/metrics/eval-metrics.md` aggregates them (mean, p50, p95, max) and projects the release-tier cost and duration.
- **Budget decision (G3, 2026-10-10):** the release eval budget is set by P-01 at the M-3 exit from that metrics report; the release tier may be reduced for low-risk scenarios by revising this ADR.
- Flakiness surfaces at milestone exit at the latest.
- Affects: C001-COMP-12; test plan §4; RISK-005.
