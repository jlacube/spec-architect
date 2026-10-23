---
id: C001-PLAN-INDEX
artifact: plan/index
change: CHG-001
phase: 20-plan
status: approved
---

# CHG-001 — Plan index

## Reading order

1. `handoff.md`: start here if you are implementing
2. `10-strategy.md`: approach, milestones, spike handling
3. `20-decisions/`: ADR-001 … 006 (+ OA-005, OA-006)
4. `40-work-breakdown.md`: task graph and critical path
5. `50-tasks/`: one file per task
6. `60-test-plan.md`: levels, fixtures, environments, eval tiers, TC table
7. `70-risks.md`, `75-rollout.md`, `78-observability.md`
8. `80-traceability.md` (generated), `90-critic-report.md`, `questions-log.md`

## Files

| File | Purpose |
|---|---|
| `questions-log.md` | Plan interview round 1 (Q-plan-01 … 04) |
| `10-strategy.md` | Approach, sequencing rationale, milestones C001-M-1 … 7, ways of working |
| `20-decisions/ADR-001-build-order.md` | Spikes → CLI core → agents → rest |
| `20-decisions/ADR-002-typescript-esbuild.md` | TypeScript sources bundled by esbuild |
| `20-decisions/ADR-003-eval-tiers.md` | 1 / 3 runs for agent evals in dev and at milestones; reduced release tier (10 runs high-risk, 3 runs the rest) |
| `20-decisions/ADR-004-implementer.md` | Plain Claude Code sessions implement |
| `20-decisions/OA-005-…`, `ADR-005-…` | Custom line parser + yaml |
| `20-decisions/OA-006-…`, `ADR-006-…` | `node --test` runner |
| `40-work-breakdown.md` | Mermaid DAG by milestone; task table; critical path (weight 48) |
| `50-tasks/T-*.md` | 64 tasks (one dropped) |
| `60-test-plan.md` | 242 test cases: 161 integration, 78 eval, 3 manual |
| `70-risks.md` | RISK-001 … 015 |
| `75-rollout.md` | Release model, migration, rollback RB-001 … 004 |
| `78-observability.md` | NFR → signal → task |
| `80-traceability.md` | REQ → task → TC → DoD; TR-06/07/08/11 coverage |
| `handoff.md` | Implementer contract and ordered task list |

No `30-impact/` folder: CHG-001 is greenfield (no existing code to analyse).

## Counts

| Milestone | Tasks |
|---|---|
| C001-M-1 Spikes and scaffolding | 7 |
| C001-M-2 CLI core | 19 |
| C001-M-3 Conductor and ideation/spec agents | 11 |
| C001-M-4 Code intelligence, architecture, planning | 4 |
| C001-M-5 Hooks, guards, archive | 5 |
| C001-M-6 Packaging and quality gates | 12 |
| C001-M-7 Release and dogfood | 6 |
| **Total** | **64** |
