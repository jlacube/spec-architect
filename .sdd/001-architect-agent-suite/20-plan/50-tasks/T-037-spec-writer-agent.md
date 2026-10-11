---
id: C001-T-037
title: "Spec-writer agent and authoring skills"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-3
status: in-progress
depends_on: [C001-T-032, C001-T-019, C001-T-020]
implements: [C001-REQ-401, C001-REQ-402, C001-REQ-404, C001-REQ-409, C001-REQ-414, C001-REQ-416, C001-REQ-417, C001-REQ-418, C001-REQ-421, C001-REQ-422]
satisfies_ac: [C001-AC-401.1, C001-AC-402.1, C001-AC-404.1, C001-AC-409.1, C001-AC-414.1, C001-AC-416.1, C001-AC-417.1, C001-AC-418.1, C001-AC-421.1, C001-AC-422.1]
verified_by: [C001-TS-401, C001-TS-402, C001-TS-404, C001-TS-411, C001-TS-416, C001-TS-418, C001-TS-419, C001-TS-420, C001-TS-423, C001-TS-424, C001-TC-401, C001-TC-402, C001-TC-404, C001-TC-411, C001-TC-416, C001-TC-418, C001-TC-419, C001-TC-420, C001-TC-423, C001-TC-424]
components: [C001-COMP-02, C001-COMP-10]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-037 — Spec-writer agent and authoring skills

## Intent

Author sdd-spec-writer plus ears-requirements, user-stories and nfr-catalogue skills so spec drafts pass the lint on the first or second iteration.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/agents/sdd-spec-writer.md` | IF-09 A4 |
| add | `plugins/architect/skills/ears-requirements/SKILL.md` | patterns, singularity rule (IF-04 §3.1), anti-patterns |
| add | `plugins/architect/skills/user-stories/SKILL.md, nfr-catalogue/SKILL.md` | templates, INVEST, ISO 25010 |

## Preconditions

- T-032, T-019, T-020
- Dependencies done: C001-T-032, C001-T-019, C001-T-020

## Step outline (no production code)

1. Write agent and skills using CHG-001 spec as the worked example.
2. Run evals on a toy greenfield and a brownfield fixture.

## Verification

- C001-TC-401, 402, 404, 411, 416, 418, 419, 420, 423, 424 pass (dev tier)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Toy spec reaches lint-clean within 2 author iterations
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-037 --status done --commit <sha>` (or frontmatter fallback before T-026)
