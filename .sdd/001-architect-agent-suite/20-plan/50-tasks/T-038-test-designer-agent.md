---
id: C001-T-038
title: "Test-designer agent (acceptance and DoD)"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-3
status: done
depends_on: [C001-T-037]
implements: [C001-REQ-411, C001-REQ-412, C001-REQ-419]
satisfies_ac: [C001-AC-411.1, C001-AC-412.1, C001-AC-419.1]
verified_by: [C001-TS-413, C001-TS-414, C001-TS-421, C001-TC-413, C001-TC-414, C001-TC-421]
components: [C001-COMP-02, C001-COMP-10]
risk_refs: []
estimate: M
report: { commit: 63939b8, completed_at: 2026-10-11, notes: "TC-413/414/421 pass (integration); agent eval of acceptance and DoD output passes ($0.46). No lint code exists for DoD covers/DOD-G references (TS-421 names none); checked by the test helper" }
---

# C001-T-038 — Test-designer agent (acceptance and DoD)

## Intent

Author sdd-test-designer and the acceptance-scenarios and dod-catalogue skills covering numbering, coverage tables and DoD evidence types.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/agents/sdd-test-designer.md` | IF-09 A5 |
| add | `plugins/architect/skills/acceptance-scenarios/SKILL.md, dod-catalogue/SKILL.md` | coverage checklist, evidence types |

## Preconditions

- T-037
- Dependencies done: C001-T-037

## Step outline (no production code)

1. Write agent and skills.
2. Run evals; lint outputs.

## Verification

- C001-TC-413, 414, 421 pass (dev tier)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Coverage tables complete on toy spec
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-038 --status done --commit <sha>` (or frontmatter fallback before T-026)
