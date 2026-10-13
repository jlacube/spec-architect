---
capability: ideation
inventory_only: true
updated: 2026-10-13
---

# Ideation (`C001-CAP-03`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

The ideation phase: bootstrap ideation document, research notes, options analyses and decision
records, and the readiness checks that precede gate G1. The capability is mostly prompt content,
with its deterministic checks in lint rules.

## Entry points

- Commands `plugins/architect/commands/ideate.md`, `research.md`, `decide.md`.
- Agents `plugins/architect/agents/sdd-researcher.md`, `sdd-options-analyst.md`.

## Main modules

- Skills `plugins/architect/skills/phase-ideation/` (with `references/brief-template.md`),
  `research-protocol/`, `options-analysis/`.
- Lint rules `src/lint/rules/ide-001.ts`, `oa-001.ts`, `res-001.ts`, `res-002.ts`.

## Owning tests

- `tests/integration/cap03/` (`TS-302`, `TS-308`, `TS-310`, `TS-311`, `TS-314`, `research-fixture.ts`).
- Evals: `evals/cap03/` (`TS-301` … `TS-320`, `research.mjs`, `options.mjs`, `ideation-review.eval.mjs`).

## Evidence

- **E-1** `plugins/architect/agents/sdd-researcher.md:1` › - — research specialist (ideation and ad-hoc research).
  - layer: grep (description read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `plugins/architect/agents/sdd-options-analyst.md:1` › - — options and trade-off specialist.
  - layer: grep (description read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/lint/rules/oa-001.ts:1` › - — lint rule for options-analysis files (purpose inferred from the file name).
  - layer: grep (git ls-files) · confidence: low
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127; purpose inferred from the file name
