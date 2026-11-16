---
id: C001-T-032
title: "Phase skills (ideation, spec), delegation briefs, unattended mode"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-3
status: done
depends_on: [C001-T-031]
implements: [C001-REQ-212, C001-REQ-213, C001-REQ-214, C001-REQ-215, C001-REQ-216, C001-REQ-313, C001-REQ-811, C001-REQ-127]
satisfies_ac: [C001-AC-212.1, C001-AC-213.1, C001-AC-213.2, C001-AC-214.1, C001-AC-215.1, C001-AC-216.1, C001-AC-313.1, C001-AC-811.1, C001-AC-127.1]
verified_by: [C001-TS-213, C001-TS-214, C001-TS-215, C001-TS-216, C001-TS-217, C001-TS-218, C001-TS-314, C001-TS-813, C001-TS-133, C001-TC-213, C001-TC-214, C001-TC-215, C001-TC-216, C001-TC-217, C001-TC-218, C001-TC-314, C001-TC-813, C001-TC-133]
components: [C001-COMP-01, C001-COMP-10]
risk_refs: []
estimate: L
report: { commit: e2fe9f4, completed_at: 2026-10-11, notes: "All 9 TCs pass (7 evals at dev tier, TC-314/813 integration); eval spend ~$5.13 (P-01 approved up to ~$5.70); the ideation document sections are checked by the skill-structure test and LINT-IDE-001, not by a full toy ideation run" }
---

# C001-T-032 — Phase skills (ideation, spec), delegation briefs, unattended mode

## Intent

Author phase-ideation and phase-spec skills: step procedures, parallel fan-out, brief template, unattended drafting, phase-entry checks (G0 and predecessors) and the ideation document structure.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/skills/phase-ideation/SKILL.md` | procedure incl. readiness check and G1 |
| add | `plugins/architect/skills/phase-spec/SKILL.md` | procedure incl. author sequencing and G2 |
| add | `plugins/architect/skills/phase-ideation/references/brief-template.md` | brief fields of C001-REQ-214 |

## Preconditions

- T-031
- Dependencies done: C001-T-031

## Step outline (no production code)

1. Write procedures as numbered steps with entry/exit criteria.
2. Encode unattended-mode rules and stop conditions.
3. Run eval TCs on fx-empty and fx-brownfield-ts.

## Verification

- C001-TC-213…218, 314, 813, 133 pass (dev tier)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Ideation run on a toy change produces all sections of C001-REQ-313
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-032 --status done --commit <sha>` (or frontmatter fallback before T-026)
