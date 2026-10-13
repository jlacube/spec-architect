---
id: C001-T-070
title: "Constitution for this repository via /architect:init"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-7
status: in-progress
depends_on: [C001-T-044, C001-T-060]
implements: []
satisfies_ac: [C001-AC-114.1, C001-AC-127.1]
verified_by: [C001-TS-119, C001-TS-133, C001-TC-119, C001-TC-133]
components: [C001-COMP-01]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-070 — Constitution for this repository via /architect:init

## Intent

Close CR-9: run /architect:init on this repository, carrying DOD-G-01…07 and the profile thresholds into _constitution/, and approve G0.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `.sdd/_constitution/constitution.md, toolchain.md, glossary.md` | through the conductor only |

## Preconditions

- T-044, T-060
- Dependencies done: C001-T-044, C001-T-060

## Step outline (no production code)

1. Run /architect:init; answer interview.
2. Approve G0.

## Verification

- `sdd lint` clean; constitution status approved
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] DOD-G items present with the same IDs
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-070 --status done --commit <sha>` (or frontmatter fallback before T-026)
