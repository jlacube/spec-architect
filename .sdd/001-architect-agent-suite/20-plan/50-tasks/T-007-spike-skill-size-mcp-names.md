---
id: C001-T-007
title: "Spike S-06: preloaded skill cost and MCP tool names"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-1
status: todo
depends_on: [C001-T-001]
implements: []
satisfies_ac: [C001-AC-1008.1, C001-AC-1109.1]
verified_by: [C001-TS-1009, C001-TS-1110, C001-TC-1009, C001-TC-1110]
components: [C001-COMP-10, C001-COMP-11]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-007 — Spike S-06: preloaded skill cost and MCP tool names

## Intent

Measure the context cost of preloading skills into a subagent and record the exact tool names exposed by Context7, DeepWiki and Serena, which C001-IF-09 must use.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/spikes/S-06-skills-mcp.md` | measured token cost per 100 skill lines; tool name list per server |

## Preconditions

- T-003 Serena available
- Dependencies done: C001-T-001

## Step outline (no production code)

1. Create a subagent with 0, 2 and 6 preloaded skills of known size; compare start-of-run context usage.
2. Connect Context7 and DeepWiki remote servers; list tool names; repeat for Serena.
3. Propose PLG-SIZE-001 budget confirmation or change (C001-NFR-105).

## Verification

- Report contains measured numbers and the three tool-name lists
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] C001-IF-09 tool names confirmed or spec defect raised
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-007 --status done --commit <sha>` (or frontmatter fallback before T-026)
