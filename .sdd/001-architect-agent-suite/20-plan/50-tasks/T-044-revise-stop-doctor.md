---
id: C001-T-044
title: "Revise, stop and doctor commands"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-4
status: todo
depends_on: [C001-T-034, C001-T-041]
implements: [C001-REQ-812, C001-REQ-813, C001-REQ-815, C001-REQ-1110, C001-REQ-1111]
satisfies_ac: [C001-AC-812.1, C001-AC-813.1, C001-AC-815.1, C001-AC-1110.1, C001-AC-1111.1]
verified_by: [C001-TS-814, C001-TS-815, C001-TS-817, C001-TS-1111, C001-TS-1112, C001-TC-814, C001-TC-815, C001-TC-817, C001-TC-1111, C001-TC-1112]
components: [C001-COMP-01, C001-COMP-05, C001-COMP-09]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-044 — Revise, stop and doctor commands

## Intent

Author /architect:revise (CLI revise + impact list), stop handling and /architect:doctor (tool table with remedies of C001-IF-10 §3).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/commands/revise.md, doctor.md` | commands |
| add | `src/gate/revise.ts, stop.ts` | `sdd change revise`, `sdd change stop`, impact computation from approvals.json |

## Preconditions

- T-034, T-041
- Dependencies done: C001-T-034, C001-T-041

## Step outline (no production code)

1. Implement CLI revise/stop transitions.
2. Implement impact list from per-ID hashes.
3. Write doctor command using the cartographer.

## Verification

- C001-TC-814, 815, 817, 1111, 1112 pass
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Revision of a toy spec shows only changed IDs and dependents
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-044 --status done --commit <sha>` (or frontmatter fallback before T-026)
