---
id: C001-T-043
title: "Planner agent, planning and phase-plan skills, test plan"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-4
status: in-progress
depends_on: [C001-T-042, C001-T-022, C001-T-038]
implements: [C001-REQ-601, C001-REQ-602, C001-REQ-608, C001-REQ-609, C001-REQ-613, C001-REQ-614, C001-REQ-615, C001-REQ-616, C001-REQ-617, C001-REQ-618]
satisfies_ac: [C001-AC-601.1, C001-AC-602.1, C001-AC-608.1, C001-AC-609.1, C001-AC-609.2, C001-AC-613.1, C001-AC-613.2, C001-AC-614.1, C001-AC-615.1, C001-AC-616.1, C001-AC-617.1, C001-AC-617.2, C001-AC-618.1]
verified_by: [C001-TS-601, C001-TS-602, C001-TS-609, C001-TS-610, C001-TS-611, C001-TS-615, C001-TS-616, C001-TS-617, C001-TS-618, C001-TS-619, C001-TS-620, C001-TS-621, C001-TS-622, C001-TC-601, C001-TC-602, C001-TC-609, C001-TC-610, C001-TC-611, C001-TC-615, C001-TC-616, C001-TC-617, C001-TC-618, C001-TC-619, C001-TC-620, C001-TC-621, C001-TC-622]
components: [C001-COMP-02, C001-COMP-10]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-043 — Planner agent, planning and phase-plan skills, test plan

## Intent

Author sdd-planner and the phase-plan and planning skills producing strategy, task files, work breakdown, test plan, risks, rollout, observability and hand-off; this CHG-001 plan is the worked example.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/agents/sdd-planner.md` | IF-09 A7 |
| add | `plugins/architect/skills/planning/SKILL.md, phase-plan/SKILL.md` | task template, DAG rules, hand-off template |

## Preconditions

- T-042, T-022, T-038
- Dependencies done: C001-T-042, C001-T-022, C001-T-038

## Step outline (no production code)

1. Write agent and skills.
2. Run evals planning a toy spec.

## Verification

- C001-TC-602, 609, 611, 613, 617, 619, 620, 622 pass (dev tier)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Toy plan lint clean; handoff ordered list topological
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-043 --status done --commit <sha>` (or frontmatter fallback before T-026)
