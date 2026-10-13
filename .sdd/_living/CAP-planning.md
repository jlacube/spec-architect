---
capability: planning
inventory_only: true
updated: 2026-10-13
---

# Planning and hand-off (`C001-CAP-06`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

The planning phase: strategy and milestones, task files and their dependency graph, impact
analysis for brownfield changes, test plan, risks, rollout, observability and the implementer
hand-off. Mostly prompt content; task and plan lint rules check the outputs.

## Entry points

- Command `plugins/architect/commands/plan.md`.
- Agents `plugins/architect/agents/sdd-planner.md`, `sdd-test-designer.md` (plan-phase test plan).

## Main modules

- Skills `plugins/architect/skills/phase-plan/`, `planning/`.
- Lint rules `src/lint/rules/plan-001.ts`, `task-001.ts` … `task-003.ts`, `obs-001.ts`, `sec-001.ts`.
- Plan coverage in `src/trace/matrix.ts` (`planCoverage`, `planFacts`, `renderPlanMatrix`).

## Owning tests

- `tests/integration/cap06/` (`TS-601` … `TS-618`, `plan-fixture.ts`).
- Evals: `evals/cap06/` (`impact.eval.mjs`, `planner.mjs`, `TS-609`, `TS-622`).

## Evidence

- **E-1** `plugins/architect/agents/sdd-planner.md:1` › - — planning specialist agent.
  - layer: grep (description read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/lint/rules/task-001.ts:1` › - — task-file lint rule (purpose inferred from the file name).
  - layer: grep (git ls-files) · confidence: low
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127; purpose inferred from the file name
- **E-3** `src/trace/matrix.ts` › `planCoverage` — plan coverage computation (symbol listed by the overview; line not captured).
  - layer: serena · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
