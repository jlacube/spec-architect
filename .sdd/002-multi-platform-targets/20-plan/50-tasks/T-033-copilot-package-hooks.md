---
id: C002-T-033
title: "Copilot package: hooks.json, agent-scoped guard hooks and tool classes"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-031, C002-T-032]
implements: [C002-REQ-308, C002-REQ-313, C002-REQ-314, C002-REQ-315, C002-REQ-316, C002-REQ-318]
satisfies_ac: [C002-AC-308.1, C002-AC-316.1, C002-AC-318.1]
verified_by: [C002-TS-311, C002-TS-325, C002-TS-326, C002-TS-330, C002-TS-331, C002-TS-332, C002-TC-311, C002-TC-325, C002-TC-326, C002-TC-330, C002-TC-331, C002-TC-332]
components: [C002-COMP-001, C002-COMP-004]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-033 — Copilot package: hooks.json, agent-scoped guard hooks and tool classes

## Intent

Emit the package side of the Copilot hooks. `hooks/hooks.json` holds SessionStart and SubagentStop,
with args-only commands on the package's CLI copy (C002-REQ-313 … C002-REQ-316). Under the hooks
fallback the emitter also writes agent-scoped PreToolUse hooks in every Architect agent
(C002-REQ-308) and `hooks/tool-classes.json`, which classes every granted tool (C002-REQ-318).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `scripts/generate/emit/copilot.ts` | `hooks/hooks.json`; under `copilot-hooks` mode the agent frontmatter hooks and `hooks/tool-classes.json` |
| add | `plugins/architect/targets/copilot/tool-classes.json` | source of the tool classes, values from the S-08 record |
| add | `tests/integration/cap03/package-hooks.test.ts` | the listed scenarios for both Copilot modes |

## Preconditions

- C002-T-031 and C002-T-032 done.

## Step outline (no production code)

1. Write each hook command as `node <plugin>/scripts/sdd.mjs hook … --host copilot` with arguments
   only. No shell operators (C002-REQ-316).
2. Write PreToolUse only inside agent frontmatter, never at plugin level (C002-REQ-302).
3. Check that every tool granted to an agent or a prompt file has a class.

## Verification

- `npm test -- cap03`

## Done when

- [ ] Listed scenarios pass in both modes
- [ ] Progress reported: `sdd task set C002-T-033 --status done --commit <sha>`
