---
capability: conductor
inventory_only: true
updated: 2026-10-13
---

# Conductor and interview (`C001-CAP-02`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

The main-session agent that drives a change through ideation, specification and planning, runs the
batched option-based interview with P-01, and delegates to the specialist agents. The capability is
prompt content (Markdown), not TypeScript.

## Entry points

- Agent `plugins/architect/agents/sdd-conductor.md`, started as the main session
  (`claude --agent architect:sdd-conductor`).
- Commands `plugins/architect/commands/new.md`, `status.md`.

## Main modules

- `plugins/architect/agents/sdd-conductor.md`.
- Skills `plugins/architect/skills/interview-protocol/` (with
  `references/questions.schema.json`), `sdd-conventions/`, `gate-protocol/`.
- Questions schema contract `C001-IF-05`, mirrored in `tests/unit/evals/questions.test.ts`.

## Owning tests

- `tests/integration/cap02/` (`TS-204`, `TS-205`, `TS-219`, `TS-220`, `agents-if09.test.ts`,
  `skills-portability.test.ts`).
- Evals (model-in-the-loop): `evals/cap02/` (`TS-201` … `TS-222`, `interview.mjs`, `drafting.mjs`).

## Evidence

- **E-1** `plugins/architect/agents/sdd-conductor.md:1` › - — the conductor agent definition (main entry point).
  - layer: grep (git ls-files, description read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `plugins/architect/skills/interview-protocol/SKILL.md:1` › - — interview protocol skill with the questions schema as a reference.
  - layer: grep (git ls-files) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `tests/integration/cap02/agents-if09.test.ts:1` › - — checks agent frontmatter against the `C001-IF-09` contract.
  - layer: grep (git ls-files) · confidence: low
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127; purpose inferred from the file name
