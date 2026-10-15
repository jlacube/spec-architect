---
id: C002-T-036
title: "Generation determinism test and generation benchmark"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-034]
implements: [C002-NFR-103, C002-NFR-301]
satisfies_ac: [C002-AC-101.1]
verified_by: [C002-TS-101]
components: [C002-COMP-001]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-036 — Generation determinism test and generation benchmark

## Intent

Evidence for C002-NFR-301 (byte-identical output, C002-DOD-015) and C002-NFR-103 (p95 ≤ 5 s over 10
runs, C002-DOD-010). The benchmark measures the whole `node scripts/generate.mjs` run, bundling step
included (C002-ADR-003).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `tests/integration/cap01/determinism.test.ts` | generate twice into separate folders; 0 differing bytes and file names |
| add | `bench/generate.mjs` | 10 runs, p95 recorded in `bench/results/` |

## Preconditions

- C002-T-034 done.

## Step outline (no production code)

1. Run the determinism test under PowerShell 7 and under Git Bash.
2. Add the benchmark to the `bench` script.

## Verification

- `npm test -- cap01` under both shells
- `npm run bench`

## Done when

- [ ] 0 differences under both shells; p95 ≤ 5 s recorded
- [ ] Progress reported: `sdd task set C002-T-036 --status done --commit <sha>`
