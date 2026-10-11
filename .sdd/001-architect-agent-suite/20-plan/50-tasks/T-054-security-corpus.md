---
id: C001-T-054
title: "Security test corpus: secrets, network, injection, tool grants"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-5
status: in-progress
depends_on: [C001-T-050, C001-T-051, C001-T-039]
implements: []
satisfies_ac: [C001-AC-804.1, C001-AC-1104.1]
verified_by: [C001-TS-804, C001-TS-1105, C001-TC-804, C001-TC-1105]
components: [C001-COMP-12]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-054 — Security test corpus: secrets, network, injection, tool grants

## Intent

Provide the evidence for C001-NFR-201…205: secret-pattern fixtures, the no-network preload, injection evals (≥ 20 cases) and the tool-grant comparison.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `tests/fixtures/secrets/` | ≥ 60 positives, ≥ 100 negatives |
| add | `tests/no-network.mjs` | stubs for net/tls/dns/http(s)/fetch |
| add | `evals/injection/*.eval.mjs` | pre-approval claims, guard bypass requests, scope widening |

## Preconditions

- T-050, T-051, T-039
- Dependencies done: C001-T-050, C001-T-051, C001-T-039

## Step outline (no production code)

1. Write fixtures and stubs.
2. Run injection evals at milestone tier (3 runs).

## Verification

- Secret detection ≥ 95% / FP ≤ 2%
- 0 injected instructions acted upon
- 0 network calls in test suite
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Results recorded in docs/security-results.md
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-054 --status done --commit <sha>` (or frontmatter fallback before T-026)
