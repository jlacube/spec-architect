---
id: C001-T-071
title: "Archify architecture outputs for CHG-001"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-7
status: todo
depends_on: [C001-T-042, C001-T-004]
implements: []
satisfies_ac: [C001-AC-504.1, C001-AC-505.1]
verified_by: [C001-TS-504, C001-TS-505, C001-TC-504, C001-TC-505]
components: [C001-COMP-02]
risk_refs: [C001-RISK-009]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-071 — Archify architecture outputs for CHG-001

## Intent

Fulfil the deferred Spec-Q3 item: produce to-be.architecture.json and HTML for the CHG-001 architecture with node IDs equal to COMP IDs, through /architect:revise spec (a revision of 60-architecture).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `.sdd/001-architect-agent-suite/10-spec/60-architecture/to-be.architecture.json, to-be.html` | via the architect agent |

## Preconditions

- T-042, Archify installed
- Dependencies done: C001-T-042, C001-T-004

## Step outline (no production code)

1. Run /architect:revise spec --reason "Archify outputs (Spec-Q3)".
2. Re-approve G2 for the changed IDs only.

## Verification

- LINT-ARCH-001 clean; archify validate zero errors
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Gate log shows the revision and re-approval
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-071 --status done --commit <sha>` (or frontmatter fallback before T-026)
