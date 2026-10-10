---
id: C001-T-042
title: "Architect agent, diagramming and architecture-decisions skills"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-4
status: todo
depends_on: [C001-T-004, C001-T-041, C001-T-021]
implements: [C001-REQ-501, C001-REQ-502, C001-REQ-507, C001-REQ-508, C001-REQ-510, C001-REQ-511, C001-REQ-513, C001-REQ-514, C001-REQ-515, C001-REQ-516]
satisfies_ac: [C001-AC-501.1, C001-AC-502.1, C001-AC-507.1, C001-AC-508.1, C001-AC-510.1, C001-AC-511.1, C001-AC-513.1, C001-AC-514.1, C001-AC-515.1, C001-AC-516.1]
verified_by: [C001-TS-501, C001-TS-502, C001-TS-507, C001-TS-508, C001-TS-510, C001-TS-511, C001-TS-513, C001-TS-514, C001-TS-515, C001-TS-516, C001-TC-501, C001-TC-502, C001-TC-507, C001-TC-508, C001-TC-510, C001-TC-511, C001-TC-513, C001-TC-514, C001-TC-515, C001-TC-516]
components: [C001-COMP-02, C001-COMP-10]
risk_refs: [C001-RISK-009]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-042 — Architect agent, diagramming and architecture-decisions skills

## Intent

Author sdd-architect covering architecture.md sections, component catalogue, Mermaid component and sequence diagrams (Archify is deferred to a later change, spike S-03), interfaces in standard formats, error catalogue, constraints and ADRs. Serena tools per C001-IF-14 §4 with `ToolSearch`.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/agents/sdd-architect.md` | IF-09 A6 |
| add | `plugins/architect/skills/diagramming/SKILL.md, architecture-decisions/SKILL.md` | Mermaid diagrams and ID mapping, MADR template |

## Preconditions

- S-03 verdict, T-041
- Dependencies done: C001-T-004, C001-T-041, C001-T-021

## Step outline (no production code)

1. Write agent and skills.
2. Run evals.

## Verification

- C001-TC-501, 502, 507, 508, 510, 511, 513…516 pass (dev tier)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Toy architecture lint clean in both modes
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-042 --status done --commit <sha>` (or frontmatter fallback before T-026)
