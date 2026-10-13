---
capability: architecture
inventory_only: true
updated: 2026-10-13
---

# Architecture, interfaces, diagrams (`C001-CAP-05`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

Architecture content of the specification and plan phases: components, interface registry, error
catalogue, constraints, diagrams, the as-is to to-be delta for brownfield changes, and ADRs.
Mostly prompt content; the architecture lint rules check structure and registry consistency.

## Entry points

- Agent `plugins/architect/agents/sdd-architect.md` (invoked by the conductor in the spec and plan phases).

## Main modules

- Skills `plugins/architect/skills/architecture-decisions/`, `diagramming/`.
- Lint rules `src/lint/rules/arch-001.ts` … `arch-005.ts`, `if-001.ts`, `if-002.ts`, `err-001.ts`,
  `delta-001.ts`, `con-001.ts`.

## Owning tests

- `tests/integration/cap05/` (`TS-501` … `TS-516`, `arch-fixture.ts`).
- Evals: `evals/cap05/` (`architecture.eval.mjs`, `TS-507`, `TS-508`, `TS-511`, `TS-515`).

## Evidence

- **E-1** `plugins/architect/agents/sdd-architect.md:1` › - — architecture specialist agent.
  - layer: grep (description read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/lint/rules/if-001.ts:1` › - — interface-registry lint rule (115 non-empty lines, the largest rule file; purpose inferred from the name).
  - layer: grep (git ls-files, size count) · confidence: low
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127; purpose inferred from the file name
