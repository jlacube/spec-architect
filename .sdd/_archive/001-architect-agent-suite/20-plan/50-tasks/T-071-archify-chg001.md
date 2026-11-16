---
id: C001-T-071
title: "Archify architecture outputs for CHG-001"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-7
status: dropped
depends_on: [C001-T-042, C001-T-004]
implements: []
satisfies_ac: [C001-AC-504.1, C001-AC-505.1]
verified_by: [C001-TS-504, C001-TS-505, C001-TC-504, C001-TC-505]
components: [C001-COMP-02]
risk_refs: [C001-RISK-009]
estimate: S
report: { commit: null, completed_at: null, notes: "Dropped 2026-10-10 by P-01 through the plan revision after spikes S-02..S-06: Archify 3.0.1 produces no output on Windows 11 (spike S-03, D-S03-1); C001-REQ-504/505 tombstoned and deferred to a later change. Waiver: no Archify outputs in CHG-001." }
---

# C001-T-071 — Archify architecture outputs for CHG-001

> **Dropped (2026-10-10).** P-01 approved dropping this task with a waiver in the plan revision after
> spikes S-02 … S-06: Archify cannot produce output on Windows 11 (`docs/spikes/S-03-archify.md`), and the
> requirements it served (former C001-REQ-504, 505) are deferred to a later change.

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
