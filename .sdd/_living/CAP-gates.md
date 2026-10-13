---
capability: gates
inventory_only: true
updated: 2026-10-13
---

# Gates and revisions (`C001-CAP-08`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

Phase gates: presenting a gate summary, recording P-01's decision, the approval content hash,
stale detection, revision of approved phases with downstream impact, and the opt-in commit at
approval.

## Entry points

- `sdd gate show`, `sdd gate approve`, `sdd gate record`, `sdd change revise`, `sdd change stop`,
  `sdd stale check`, `sdd hash` (`gateShow`, `gateApprove`, `gateRecord`, `changeRevise`,
  `changeStop`, `staleCmd`, `hashCmd` in `src/cli/commands.ts`).
- Commands `plugins/architect/commands/gate.md`, `revise.md`.

## Main modules

- `src/gate/` — `gate.ts`, `hash.ts`, `stale.ts`, `revise.ts`, `commit.ts`, `critic-parse.ts`.
- Skill `plugins/architect/skills/gate-protocol/`.

## Owning tests

- `tests/integration/cap08/` (`TS-801`, `TS-805` … `TS-814`, `TS-816`, `TS-818`, `TS-819`,
  fixtures `gate-fixture.ts`, `git-fixture.ts`).
- Evals: `evals/cap08/` (`gate.mjs`, `revise.mjs`, `TS-802` … `TS-817`).

## Evidence

- **E-1** `src/gate/gate.ts:147` › `approve()` — records an approval.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/gate/stale.ts:21` › `staleCheck()` — detects stale phases.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/gate/revise.ts:19` › `impact()` — computes the downstream impact of revising a phase.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
