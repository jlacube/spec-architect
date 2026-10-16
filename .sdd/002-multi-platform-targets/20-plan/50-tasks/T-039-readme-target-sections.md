---
id: C002-T-039
title: "README sections for OpenCode and Copilot VS Code"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-05
status: todo
depends_on: [C002-T-030, C002-T-033]
implements: [C002-REQ-205, C002-REQ-305, C002-REQ-310]
satisfies_ac: [C002-AC-205.1, C002-AC-305.1, C002-AC-310.1]
verified_by: [C002-TS-206, C002-TS-307, C002-TS-315, C002-TC-206, C002-TC-307, C002-TC-315]
components: [C002-COMP-017]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-039 — README sections for OpenCode and Copilot VS Code

## Intent

Add one README section per generated target. Each links the package's install notes and names its
enforcement mode (C002-REQ-205, C002-REQ-305). Under the hooks fallback the Copilot section warns
that the write/shell boundary is off whenever hooks are disabled (C002-REQ-310).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/README.md` | "OpenCode" and "Copilot VS Code" sections; mode and warning taken from the mapping tables |
| add | `tests/integration/cap02/readme-targets.test.ts` | sections present; the mode named equals the table's mode; warning present under `copilot-hooks` only |

## Preconditions

- C002-T-030 and C002-T-033 done (modes final in the tables).

## Step outline (no production code)

1. Write the sections. The README's existing Claude Code text and troubleshooting rows stay as they
   are (`TS-1116`, `readme.check`).
2. Add a test that fails when a table's mode changes and the README does not.

## Verification

- `npm test -- cap02` and `npm test -- cap11`

## Done when

- [ ] Listed scenarios pass
- [ ] Progress reported: `sdd task set C002-T-039 --status done --commit <sha>`
