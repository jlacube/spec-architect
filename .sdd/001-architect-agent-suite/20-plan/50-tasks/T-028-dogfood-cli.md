---
id: C001-T-028
title: "Dogfood the CLI core on CHG-001"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: in-progress
depends_on: [C001-T-025, C001-T-026, C001-T-027, C001-T-014]
implements: []
satisfies_ac: [C001-AC-123.1, C001-AC-806.1]
verified_by: [C001-TS-129, C001-TS-806, C001-TC-129, C001-TC-806]
components: [C001-COMP-03, C001-COMP-04, C001-COMP-05]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-028 — Dogfood the CLI core on CHG-001

## Intent

Switch this repository from the hand-made bootstrap to the real CLI: adopt the workspace, lint ideation/spec/plan, regenerate traceability and confirm approval hashes.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `.sdd/**` | only via sdd commands: status --write, trace --write |

## Preconditions

- T-025, T-026, T-027, T-014
- Dependencies done: C001-T-025, C001-T-026, C001-T-027, C001-T-014

## Step outline (no production code)

1. Run `sdd status --write`; check SDD.md and registry diffs are expected.
2. Run `sdd lint`; fix any real findings via spec defects.
3. Run `sdd trace 001 --write`; compare with prototype outputs.
4. Run `sdd stale check`; all approved phases must stay approved.

## Verification

- `sdd lint` exits 0 on this repository
- `sdd stale check` reports no stale phase
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] tools/prototypes/ deleted (scripts retired); results noted in the dogfood log docs/dogfood.md
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-028 --status done --commit <sha>` (or frontmatter fallback before T-026)
