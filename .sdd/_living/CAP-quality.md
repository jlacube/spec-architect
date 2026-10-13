---
capability: quality
inventory_only: true
updated: 2026-10-13
---

# Quality: lint and traceability (`C001-CAP-07`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

The deterministic checks (lint engine and its rules) and the traceability graph, coverage matrices
and open-items list, plus the critic and auditor agents that run or interpret them.

## Entry points

- `sdd lint`, `sdd trace` (`lint`, `traceCmd`, `traceActive` in `src/cli/commands.ts`).
- Command `plugins/architect/commands/lint.md`.
- Agents `plugins/architect/agents/sdd-critic.md`, `sdd-auditor.md`.
- Hook `SubagentStop` runs `trace --quiet --write --active` (`plugins/architect/hooks/hooks.json`).

## Main modules

- `src/lint/` — `engine.ts`, `types.ts`, `ears.ts`, `spec.ts`, `spec-facts.ts`, and
  `rules/` (52 rule files, registry in `rules/index.ts`).
- `src/trace/` — `model.ts`, `matrix.ts`, `open-items.ts`, `write.ts`.
- Skill `plugins/architect/skills/critique-rubrics/`.
- Critic parsing for gates: `src/gate/critic-parse.ts`.

## Owning tests

- `tests/integration/cap07/` (`TS-701` … `TS-719`, `trace-fixture.ts`).
- `tests/unit/lint/`, `tests/lint-fixtures/` (run by `tests/unit/lint/fixtures.test.ts`).
- Evals and benchmarks: `evals/cap07/`, `bench/lint.mjs`, `bench/lint-quick.mjs`.

## Evidence

- **E-1** `src/lint/engine.ts:106` › `lintWorkspace()` — lint entry over a workspace.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/lint/rules/index.ts:58` › `RULES` — the rule registry.
  - layer: grep (matched, checked by reading) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/trace/write.ts:32` › `trace()` — builds the trace graph and writes `trace.json` and the generated matrices.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-4** `src/trace/matrix.ts:50` › `specCoverage()` — spec coverage computation.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
