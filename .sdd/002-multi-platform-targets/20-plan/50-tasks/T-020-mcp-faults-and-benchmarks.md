---
id: C002-T-020
title: "sdd MCP server: fault injection and benchmarks"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-03
status: done
depends_on: [C002-T-018, C002-T-019]
implements: [C002-NFR-101, C002-NFR-102, C002-NFR-204]
satisfies_ac: [C002-AC-402.1]
verified_by: [C002-TS-402, C002-TS-405, C002-TC-402, C002-TC-405]
components: [C002-COMP-005]
risk_refs: []
estimate: M
report: { commit: 284f9e0, completed_at: 2026-10-18, notes: "Faults 10/10 refused; NFR-101 p95 ~1 ms, NFR-102 p95 65 ms (bench results committed); TC-402 covered, TC-405 in files.test.ts; fault seams: SDD_TEST_FAULT switches ship in the production bundle as in CHG-001 (no separate test bundle exists) — spawn-failure seam is a test-only preload" }
---

# C002-T-020 — sdd MCP server: fault injection and benchmarks

## Intent

Prove that the server fails closed under every fault class (C002-NFR-204, C002-DOD-013). Measure its
refusal time and its write-with-findings time (C002-NFR-101, C002-NFR-102, C002-DOD-010).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `tests/integration/mcp/faults.test.ts` | malformed input, unknown tool name, exception in a guard core, I/O error, injected into each write and command tool: 0 allowed calls |
| add | `bench/mcp-refusals.mjs` | one server, 50 refused path and command calls from the corpora, p95 ≤ 300 ms |
| add | `bench/mcp-writes.mjs` | 20 writes of `fx-large` artifacts with findings, p95 ≤ 800 ms |
| modify | `package.json` | `bench` script runs the new benchmarks after `bench/guards.mjs` |

## Preconditions

- C002-T-018 and C002-T-019 done.

## Step outline (no production code)

1. Inject each fault through a test seam that exists only in the test bundle.
2. Load the rules once per process, as architecture §6.1 requires, before the benchmarks start.

## Verification

- `npm test -- integration/mcp`
- `npm run bench`

## Done when

- [ ] 0 allowed calls under injected faults; benchmark results recorded in `bench/results/`
- [ ] Progress reported: `sdd task set C002-T-020 --status done --commit <sha>`
