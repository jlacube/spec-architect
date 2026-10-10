---
id: C001-T-075
title: "Archive CHG-001 into living specs"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-7
status: todo
depends_on: [C001-T-073, C001-T-074, C001-T-053]
implements: []
satisfies_ac: [C001-AC-920.1, C001-AC-914.1]
verified_by: [C001-TS-921, C001-TS-915, C001-TC-921, C001-TC-915]
components: [C001-COMP-06]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-075 — Archive CHG-001 into living specs

## Intent

Close the loop (DOD-G-06): after all tasks are done and no defects are open, archive CHG-001 so _living/ holds the suite’s current-truth specification.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `.sdd/**` | `sdd archive 001 --dry-run`, then `sdd archive 001` |

## Preconditions

- All tasks done or dropped; no open defects
- Dependencies done: C001-T-073, C001-T-074, C001-T-053

## Step outline (no production code)

1. Dry run and review.
2. Archive.

## Verification

- _living/ contains the 11 capabilities with History rows; CHG-001 in _archive/
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] SDD.md shows no active row for 001
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-075 --status done --commit <sha>` (or frontmatter fallback before T-026)
