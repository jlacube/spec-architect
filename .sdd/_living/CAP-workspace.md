---
capability: workspace
inventory_only: true
updated: 2026-10-13
---

# Workspace, registry, identifiers (`C001-CAP-01`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

Creates and maintains the `.sdd/` workspace: layout, change folders, the ID ledger, the registry
and status block, workspace upgrade, and the shared model (markdown blocks, frontmatter, ID
parsing, artifact graph) and file-system helpers that every other capability uses.

## Entry points

- `sdd init`, `sdd change new`, `sdd change profile` (lite to full, via `upgradeToFull` in
  `src/workspace/upgrade.ts`), `sdd id next`, `sdd id tombstone`, `sdd status` in
  `src/cli/commands.ts` (command table `COMMANDS`, line 480).
- Plugin commands `plugins/architect/commands/init.md`, `new.md`, `status.md`.

## Main modules

- `src/workspace/` — `init.ts`, `change.ts`, `change-md.ts`, `ledger.ts`, `status.ts` (registry and
  status block), `sddmd.ts`, `templates.ts`, `layout.ts`, `find.ts`, `adopt.ts`, `upgrade.ts`.
- `src/model/` — `blocks.ts`, `frontmatter.ts`, `ids.ts`, `graph.ts`.
- `src/io/` — `atomic.ts`, `paths.ts`.

## Owning tests

- `tests/integration/cap01/` (`TS-101` … `TS-132`, shared `tests/integration/workspace-fixtures.ts`).
- `tests/unit/model/`, `tests/unit/io/`, `tests/unit/workspace/`.
- Evals: `evals/cap01/`.

## Evidence

- **E-1** `src/workspace/init.ts:35` › `initWorkspace()` — creates the workspace at init.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/workspace/change.ts:59` › `createChange()` — creates a change folder.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/workspace/ledger.ts:125` › `nextId()` — allocates the next ID from the ledger.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-4** `src/workspace/status.ts:140` › `rebuildRegistry()` — rebuilds `registry.json` from frontmatter.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
