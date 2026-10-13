---
id: C001-T-073
title: "Dogfood: greenfield change CHG-003 through G1–G3"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-7
status: todo
depends_on: [C001-T-072]
implements: []
satisfies_ac: [C001-AC-805.1, C001-AC-202.1]
verified_by: [C001-TS-805, C001-TS-202, C001-TC-805, C001-TC-202]
components: [C001-COMP-01, C001-COMP-02]
risk_refs: [C001-RISK-013]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-073 — Dogfood: greenfield change CHG-003 through G1–G3

## Intent

Use the released suite on a real greenfield change in this repository (proposed: “lint auto-fix suggestions”, to be confirmed by P-01), recording time, tokens per phase and critic validity.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `.sdd/002-*/**` | via the suite only |
| modify | `docs/dogfood.md` | log: time to G2, tokens, critic validity tally |

## Preconditions

- T-072
- Dependencies done: C001-T-072

## Step outline (no production code)

1. Run the conductor end to end.
2. Tally critic findings valid/invalid at each gate.

## Verification

- G1–G3 approved; usage recorded in the gate log (C001-NFR-701)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] C001-SC-01 (greenfield half), SC-03, SC-08 data recorded
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-073 --status done --commit <sha>` (or frontmatter fallback before T-026)
