---
id: C001-T-039
title: "Critic and auditor agents"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-3
status: in-progress
depends_on: [C001-T-030, C001-T-023]
implements: [C001-REQ-317, C001-REQ-318, C001-REQ-710, C001-REQ-711, C001-REQ-712, C001-REQ-713, C001-REQ-714, C001-REQ-715]
satisfies_ac: [C001-AC-317.1, C001-AC-318.1, C001-AC-710.1, C001-AC-711.1, C001-AC-712.1, C001-AC-713.1, C001-AC-714.1, C001-AC-715.1]
verified_by: [C001-TS-319, C001-TS-320, C001-TS-710, C001-TS-711, C001-TS-712, C001-TS-713, C001-TS-714, C001-TS-715, C001-TC-319, C001-TC-320, C001-TC-710, C001-TC-711, C001-TC-712, C001-TC-713, C001-TC-714, C001-TC-715]
components: [C001-COMP-02, C001-COMP-10]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-039 — Critic and auditor agents

## Intent

Author sdd-critic with critique-rubrics (incl. ideation readiness checklist and singularity outcome check) and sdd-auditor (Haiku) running the audit sequence.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/agents/sdd-critic.md, sdd-auditor.md` | IF-09 A8, A9 |
| add | `plugins/architect/skills/critique-rubrics/SKILL.md` | per-artifact rubrics; report format IF-11 §2 |

## Preconditions

- T-030, T-023
- Dependencies done: C001-T-030, C001-T-023

## Step outline (no production code)

1. Write rubrics; seed with CHG-001 critic findings as calibration examples.
2. Run evals incl. a seeded-defect spec.

## Verification

- C001-TC-319, 320, 710…715 pass (dev tier)
- Critic finds ≥ 80% of seeded defects in the calibration spec
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Critic writes only its report (guard-checked once T-050 exists)
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-039 --status done --commit <sha>` (or frontmatter fallback before T-026)
