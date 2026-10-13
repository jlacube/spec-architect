---
capability: tracking-archive
inventory_only: true
updated: 2026-10-13
---

# Tracking and archive (`C001-CAP-09`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

Task and defect lifecycle tracking, derived implementation status, and the archive step that merges
an implemented change into `_living/` and moves it to `_archive/`.

## Entry points

- `sdd task set`, `sdd defect add|close|reopen`, `sdd archive` (`taskSet`, `defectAdd`,
  `defectClose`, `defectReopen`, `archiveCmd` in `src/cli/commands.ts`).
- Command `plugins/architect/commands/archive.md`.

## Main modules

- `src/tracking/` — `task.ts` (status transitions), `defect.ts`.
- `src/archive/` — `plan.ts` (preview and blockers), `apply.ts`, `living.ts` (living-file edits).
- Implementation-status derivation: `src/workspace/status.ts` (`deriveImplementation`, `taskStates`).

## Owning tests

- `tests/integration/cap09/` (`TS-901` … `TS-924`, fixtures `archive-fixture.ts`,
  `tracking-fixture.ts`).
- Evals: `evals/cap09/TS-910.eval.mjs`.

## Evidence

- **E-1** `src/tracking/task.ts:102` › `setTask()` — applies a task status transition with the report fields.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/archive/plan.ts:171` › `planArchive()` — builds the archive preview.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/archive/apply.ts:9` › `applyArchive()` — applies the archive plan.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-4** `src/archive/living.ts:9` › `newLivingFile()` — creates a `_living/CAP-<slug>.md` file.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
