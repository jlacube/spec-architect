---
id: C002-T-018
title: "sdd MCP server: quick-lint findings with each write"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-03
status: todo
depends_on: [C002-T-017]
implements: [C002-REQ-408, C002-REQ-409]
satisfies_ac: [C002-AC-408.1, C002-AC-409.1]
verified_by: [C002-TS-410, C002-TS-411, C002-TS-412, C002-TS-413, C002-TC-410, C002-TC-411, C002-TC-412, C002-TC-413]
components: [C002-COMP-005]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-018 — sdd MCP server: quick-lint findings with each write

## Intent

Return the quick-lint findings of a written `.sdd/` file with the write result (C002-REQ-408). When the
lint cannot run, return the write result with WARN-MCP-001 (C002-REQ-409). This gives agents
without hooks the post-write feedback that Claude Code agents get.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/mcp/tools/files.ts` | in-process quick lint after a successful rename; at most 15 findings (C002-IF-002 §5) |
| add | `tests/integration/mcp/quick-lint.test.ts` | findings returned, cap applied, lint fault gives WARN-MCP-001 and the file stays written |

## Preconditions

- C002-T-017 done.

## Step outline (no production code)

1. Call the quick-lint engine in process with the C001-IF-07 finding format.
2. Catch any lint fault and attach WARN-MCP-001. The write is not undone.

## Verification

- `npm test -- integration/mcp`

## Done when

- [ ] C002-TS-410 … C002-TS-413 pass
- [ ] Progress reported: `sdd task set C002-T-018 --status done --commit <sha>`
