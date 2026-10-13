---
id: C001-T-074
title: "Dogfood: brownfield change CHG-002 (multi-platform targets) and Superpowers execution"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-7
status: todo
depends_on: [C001-T-072]
implements: []
satisfies_ac: [C001-AC-617.2, C001-AC-314.1, C001-AC-410.1]
verified_by: [C001-TS-621, C001-TS-315, C001-TS-412, C001-TC-621, C001-TC-315, C001-TC-412]
components: [C001-COMP-01, C001-COMP-02]
risk_refs: [C001-RISK-003, C001-RISK-013]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-074 — Dogfood: brownfield change CHG-002 (multi-platform targets) and Superpowers execution

## Intent

Use the suite on an existing repository chosen by P-01, then execute one plan milestone with Superpowers executing-plans to test the second implementer of C001-SC-04.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `<target repo>/.sdd/**` | via the suite |
| modify | `docs/dogfood.md` | brownfield log; Superpowers run notes |

## Preconditions

- T-072; target repository chosen
- Dependencies done: C001-T-072

## Step outline (no production code)

1. Run init (capability inventory), ideation, spec, plan.
2. Execute one milestone with Superpowers; count missing-info questions.

## Verification

- C001-TC-621 passes; TR-09 100% on the brownfield spec
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] C001-SC-01 (brownfield half), SC-04, SC-07 data recorded
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-074 --status done --commit <sha>` (or frontmatter fallback before T-026)
