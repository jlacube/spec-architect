---
id: C001-ADR-006
artifact: plan/adr
change: CHG-001
phase: 20-plan
status: approved
---

# C001-ADR-006 — `node --test` as the test runner

## Context and problem

See `OA-006-test-runner.md`.

## Considered options

Four candidates in C001-OA-006; presented A (`node --test`) and B (Vitest).

## Decision outcome

A — `node --test` with built-in coverage, tests bundled or transpiled by esbuild. The near tie
with Vitest is resolved by the dependency footprint and by C001-NFR-502 naming this method.
Reviewable at G3.

## Consequences

- `npm test` = build tests + `node --test`; coverage thresholds enforced in `npm run check`.
- Affects: C001-COMP-12; tasks T-001, T-061, T-065.
