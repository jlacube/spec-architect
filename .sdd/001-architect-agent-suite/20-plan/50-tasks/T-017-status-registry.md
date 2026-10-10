---
id: C001-T-017
title: "status: registry rebuild, SDD.md block, implementation derivation"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: in-progress
depends_on: [C001-T-013]
implements: [C001-REQ-104, C001-REQ-105, C001-REQ-106, C001-REQ-905]
satisfies_ac: [C001-AC-104.1, C001-AC-104.2, C001-AC-105.1, C001-AC-105.2, C001-AC-106.1, C001-AC-905.1]
verified_by: [C001-TS-105, C001-TS-106, C001-TS-107, C001-TS-108, C001-TS-109, C001-TS-906, C001-TC-105, C001-TC-106, C001-TC-107, C001-TC-108, C001-TC-109, C001-TC-906]
components: [C001-COMP-03]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-017 — status: registry rebuild, SDD.md block, implementation derivation

## Intent

Rebuild registry.json from frontmatter, render the SDD.md status block, derive implementation status from task statuses, and provide the drift rule LINT-REG-001.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/workspace/status.ts` | rebuild(), render block, derive implementation per state-machines §5 |
| add | `src/lint/rules/reg-001.ts` | registry drift rule |
| add | `tests/integration/workspace/status.test.ts` | registry schema validation (registry.schema.json) |

## Preconditions

- T-013
- Dependencies done: C001-T-013

## Step outline (no production code)

1. Collect change.md, phase artifacts and task frontmatter.
2. Validate output against registry.schema.json in tests.
3. Implement derivation rules 1–5.
4. Implement the drift comparison with JSON paths.

## Verification

- C001-TC-105…109, C001-TC-906 pass
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] `sdd status --write` on this repository produces a schema-valid registry
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-017 --status done --commit <sha>` (or frontmatter fallback before T-026)
