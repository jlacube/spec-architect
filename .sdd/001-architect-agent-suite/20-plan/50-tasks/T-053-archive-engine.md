---
id: C001-T-053
title: "Archive engine and /architect:archive"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-5
status: in-progress
depends_on: [C001-T-025, C001-T-026]
implements: [C001-REQ-913, C001-REQ-914, C001-REQ-915, C001-REQ-916, C001-REQ-917, C001-REQ-918, C001-REQ-919, C001-REQ-920, C001-REQ-921]
satisfies_ac: [C001-AC-913.1, C001-AC-914.1, C001-AC-915.1, C001-AC-916.1, C001-AC-917.1, C001-AC-918.1, C001-AC-919.1, C001-AC-920.1, C001-AC-921.1]
verified_by: [C001-TS-914, C001-TS-915, C001-TS-916, C001-TS-917, C001-TS-918, C001-TS-919, C001-TS-920, C001-TS-921, C001-TS-922, C001-TC-914, C001-TC-915, C001-TC-916, C001-TC-917, C001-TC-918, C001-TC-919, C001-TC-920, C001-TC-921, C001-TC-922]
components: [C001-COMP-06, C001-COMP-09]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-053 — Archive engine and /architect:archive

## Intent

Implement `sdd archive` (preconditions, ADDED/MODIFIED/REMOVED/RENAMED merge with history, criteria carried along, glossary merge, folder move, dry run) and the archive command.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/archive/*.ts` | planner (dry run) and applier |
| add | `plugins/architect/commands/archive.md` | preview → confirm → apply |
| add | `tests/integration/archive/*.test.ts` | fixtures with living specs |

## Preconditions

- T-025, T-026
- Dependencies done: C001-T-025, C001-T-026

## Step outline (no production code)

1. Implement precondition checks.
2. Implement merge operations producing History rows.
3. Implement dry run and move.

## Verification

- C001-TC-914…922 pass
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Dry run leaves a byte-identical workspace
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-053 --status done --commit <sha>` (or frontmatter fallback before T-026)
