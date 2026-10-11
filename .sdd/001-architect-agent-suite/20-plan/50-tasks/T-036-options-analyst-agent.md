---
id: C001-T-036
title: "Options-analyst agent"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-3
status: in-progress
depends_on: [C001-T-030, C001-T-021]
implements: [C001-REQ-309, C001-REQ-311, C001-REQ-312]
satisfies_ac: [C001-AC-309.1, C001-AC-311.1, C001-AC-312.1]
verified_by: [C001-TS-309, C001-TS-312, C001-TS-313, C001-TC-309, C001-TC-312, C001-TC-313]
components: [C001-COMP-02]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-036 — Options-analyst agent

## Intent

Author sdd-options-analyst producing OA files with correct arithmetic and DEC records.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/agents/sdd-options-analyst.md` | frontmatter per IF-09 A3; OA and DEC output contract |

## Preconditions

- T-030, T-021
- Dependencies done: C001-T-030, C001-T-021

## Step outline (no production code)

1. Write the agent.
2. Run evals; lint OA outputs (LINT-OA-001 must be clean).

## Verification

- C001-TC-309, 312, 313 pass (dev tier)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] OA outputs lint clean in 3 consecutive runs
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-036 --status done --commit <sha>` (or frontmatter fallback before T-026)
