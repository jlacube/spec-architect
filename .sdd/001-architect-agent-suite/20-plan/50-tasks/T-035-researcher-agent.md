---
id: C001-T-035
title: "Researcher agent and research-protocol skill"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-3
status: todo
depends_on: [C001-T-030, C001-T-021, C001-T-007]
implements: [C001-REQ-301, C001-REQ-302, C001-REQ-303, C001-REQ-304, C001-REQ-305, C001-REQ-306, C001-REQ-307]
satisfies_ac: [C001-AC-301.1, C001-AC-302.1, C001-AC-302.2, C001-AC-303.1, C001-AC-304.1, C001-AC-305.1, C001-AC-306.1, C001-AC-307.1]
verified_by: [C001-TS-301, C001-TS-302, C001-TS-303, C001-TS-304, C001-TS-305, C001-TS-306, C001-TS-307, C001-TS-308, C001-TC-301, C001-TC-302, C001-TC-303, C001-TC-304, C001-TC-305, C001-TC-306, C001-TC-307, C001-TC-308]
components: [C001-COMP-02, C001-COMP-10]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-035 — Researcher agent and research-protocol skill

## Intent

Author sdd-researcher with Context7-first and DeepWiki routing, cited confidence-rated notes, degradation and digest-only returns.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/agents/sdd-researcher.md` | frontmatter per IF-09 A1 (tool names from S-06) |
| add | `plugins/architect/skills/research-protocol/SKILL.md` | source hierarchy, note template, confidence rubric |

## Preconditions

- T-030, T-021, T-007
- Dependencies done: C001-T-030, C001-T-021, C001-T-007

## Step outline (no production code)

1. Write agent and skill.
2. Run eval TCs incl. degraded mode with Context7 disabled.

## Verification

- C001-TC-301…308 pass (dev tier)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Every cited URL in eval notes appears in the session’s tool calls
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-035 --status done --commit <sha>` (or frontmatter fallback before T-026)
