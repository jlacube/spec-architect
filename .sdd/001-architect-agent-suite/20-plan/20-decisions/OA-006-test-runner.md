---
id: C001-OA-006
artifact: plan/option-analysis
change: CHG-001
phase: 20-plan
status: draft
---

# C001-OA-006 — Test runner for the CLI

## Problem

Unit and integration tests for the TypeScript CLI need coverage reporting (C001-NFR-502),
Windows support and minimal dependencies.

## Criteria

| Criterion | Weight |
|---|---|
| Dependency footprint | 30% |
| Coverage support | 25% |
| Windows reliability | 25% |
| Developer ergonomics | 20% |

## Candidates

A. `node --test` with `--experimental-test-coverage`, tests compiled by esbuild
B. Vitest
C. Jest + ts-jest
D. Mocha + c8

## Scores

| Candidate | Footprint | Coverage | Windows | Ergonomics | Weighted |
|---|---|---|---|---|---|
| A | 5 | 4 | 4 | 3 | 4.10 |
| B | 3 | 5 | 4 | 5 | 4.15 |
| C | 2 | 4 | 3 | 4 | 3.15 |
| D | 3 | 4 | 4 | 3 | 3.50 |

## Sensitivity

B leads A by 0.05, which is within scoring noise. A wins if footprint weighs ≥ 35%.

## Presented

A, B.

## Recommendation

A, with an explicit tie-breaker: C001-NFR-502's method names `node --test
--experimental-test-coverage`, and A keeps the dev toolchain to esbuild + TypeScript + yaml,
consistent with "single-file, minimal dependencies". Vitest is the fallback if coverage
reporting proves insufficient.

## Rejected

- C: heavy, slow on Windows.
- D: two tools where one suffices.
