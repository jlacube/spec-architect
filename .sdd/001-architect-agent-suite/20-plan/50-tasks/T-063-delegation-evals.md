---
id: C001-T-063
title: "Delegation eval suite (claude plugin eval)"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: todo
depends_on: [C001-T-060, C001-T-029]
implements: [C001-REQ-1116]
satisfies_ac: [C001-AC-1116.1]
verified_by: [C001-TS-1117, C001-TC-1117]
components: [C001-COMP-12]
risk_refs: [C001-RISK-005]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-063 — Delegation eval suite (claude plugin eval)

## Intent

Write ≥ 40 routing prompts (≥ 3 must-route and ≥ 1 must-not-route per agent) and tune agent descriptions until ≥ 90% correct.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `evals/delegation/suite.*` | prompts and expectations |
| modify | `plugins/architect/agents/*.md` | description wording only |

## Preconditions

- T-060, T-029
- Dependencies done: C001-T-060, C001-T-029

## Step outline (no production code)

1. Write prompts from IF-09 trigger-word ownership.
2. Run at milestone tier; tune; rerun.

## Verification

- C001-TC-1117 passes
- Routing accuracy ≥ 90% (C001-SC-05)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Results stored in evals/results/delegation-*.json
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-063 --status done --commit <sha>` (or frontmatter fallback before T-026)
