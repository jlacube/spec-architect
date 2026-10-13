---
capability: specification
inventory_only: true
updated: 2026-10-13
---

# Specification authoring (`C001-CAP-04`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

The specification phase: context, user stories, EARS requirements, acceptance criteria and
scenarios, non-functional requirements, domain model and definition of done. Prompt content writes
the artifacts; the EARS parser and lint rules check them deterministically.

## Entry points

- Command `plugins/architect/commands/specify.md`.
- `sdd extract-features <NNN>` ("Write .feature files from gherkin blocks"), registered at
  `src/cli/commands.ts:507` without a `run` handler in the table entry.
- Agents `plugins/architect/agents/sdd-spec-writer.md`, `sdd-test-designer.md`.

## Main modules

- Skills `plugins/architect/skills/phase-spec/`, `ears-requirements/`, `user-stories/`,
  `acceptance-scenarios/`, `nfr-catalogue/`, `dod-catalogue/`.
- `src/lint/ears.ts`, `src/lint/spec.ts`, `src/lint/spec-facts.ts`.
- Lint rules `src/lint/rules/ears-001.ts` … `ears-003.ts`, `req-001.ts`, `us-001.ts`, `us-002.ts`,
  `ts-001.ts`, `cov-001.ts`, `cov-002.ts`, `nfr-001.ts`, `dod-001.ts`, `word-001.ts`.

## Owning tests

- `tests/integration/cap04/` (`TS-402` … `TS-422`, `spec-fixture.ts`).
- `tests/unit/lint/spec-facts.test.ts`, `tests/unit/lint/fixtures.test.ts` (lint fixtures under `tests/lint-fixtures/`).
- Evals: `evals/cap04/`.

## Evidence

- **E-1** `src/lint/ears.ts:1` › - — EARS statement parser (77 non-empty lines).
  - layer: grep (git ls-files, size count) · confidence: low
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127; purpose inferred from the file name
- **E-2** `src/lint/spec.ts:1` › - — spec-folder reading for lint (285 non-empty lines, one of the larger files).
  - layer: grep (git ls-files, size count) · confidence: low
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127; purpose inferred from the file name
- **E-3** `plugins/architect/agents/sdd-spec-writer.md:1` › - — specification author agent.
  - layer: grep (description read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
