---
id: C001-T-072
title: "Release gate v0.1.0"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-7
status: todo
depends_on: [C001-T-061, C001-T-062, C001-T-063, C001-T-064, C001-T-065, C001-T-054, C001-T-053, C001-T-070]
implements: []
satisfies_ac: [C001-AC-1102.1]
verified_by: [C001-TS-1102, C001-TC-1102]
components: [C001-COMP-11, C001-COMP-12]
risk_refs: [C001-RISK-005]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-072 — Release gate v0.1.0

## Intent

Run the release gate: all TCs, eval scenarios at release tier (10 runs, ≥ 9/10), clean-profile install, DoD evidence collected for DOD-G and DOD-001…021, version 0.1.0 tagged locally.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `CHANGELOG.md` | 0.1.0 entry |
| add | `docs/release-0.1.0-evidence.md` | evidence per DoD item |

## Preconditions

- All M-6 tasks
- Dependencies done: C001-T-061, C001-T-062, C001-T-063, C001-T-064, C001-T-065, C001-T-054, C001-T-053, C001-T-070

## Step outline (no production code)

1. Run npm run check; run all eval TCs at release tier.
2. Clean-profile install (C001-TC-1102).
3. Collect evidence; tag v0.1.0 locally (no push).

## Verification

- All TCs pass; release eval report ≥ 9/10 per scenario
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Evidence file complete for every DoD item
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-072 --status done --commit <sha>` (or frontmatter fallback before T-026)
