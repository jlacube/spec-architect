---
id: C001-ADR-002
artifact: plan/adr
change: CHG-001
phase: 20-plan
status: draft
---

# C001-ADR-002 — CLI sources in TypeScript, bundled with esbuild

## Context and problem

The `sdd` CLI is a 5–8k-line rule engine over a typed graph (IDs, nodes, edges, registry). It
must ship as one file with no runtime install (C001-NFR-501, OA-12 option B).

## Considered options

Options analysis: `../questions-log.md` Round 1, Q-plan-02 (4 candidates, 2 presented).

1. TypeScript + esbuild (recommended)
2. Plain JavaScript ESM + JSDoc types checked by `tsc --checkJs`
3. Python (rejected: Q18 chose Node.js)
4. Deno/Bun single binary (rejected in OA-12)

## Decision outcome

Option 1, chosen by P-01 ("TypeScript + esbuild (Recommended)").

## Consequences

- `src/**/*.ts`, `tsconfig.json` strict; `scripts/build.mjs` bundles to
  `plugins/architect/scripts/sdd.mjs` (T-001).
- Tests use `node --test` on compiled output (C001-ADR-006 in `ADR-006-test-runner.md`).
- Affects: C001-COMP-07, C001-COMP-12; C001-CON-02 satisfied.
