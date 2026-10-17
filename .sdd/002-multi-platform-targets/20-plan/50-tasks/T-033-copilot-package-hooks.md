---
id: C002-T-033
title: "Copilot package: hook template, Copilot guard hook and tool classes"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-031, C002-T-032]
implements: [C002-REQ-302, C002-REQ-308, C002-REQ-313, C002-REQ-314, C002-REQ-315, C002-REQ-316, C002-REQ-318, C002-REQ-326]
satisfies_ac: [C002-AC-302.1, C002-AC-308.1, C002-AC-316.1, C002-AC-318.1, C002-AC-326.1]
verified_by: [C002-TS-303, C002-TS-304, C002-TS-311, C002-TS-325, C002-TS-326, C002-TS-330, C002-TS-331, C002-TS-332, C002-TS-355, C002-TC-303, C002-TC-304, C002-TC-311, C002-TC-325, C002-TC-326, C002-TC-330, C002-TC-331, C002-TC-332, C002-TC-355]
components: [C002-COMP-001, C002-COMP-004]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-033 — Copilot package: hook template, Copilot guard hook and tool classes

## Intent

Emit the package side of the Copilot hooks (C002-IF-005 §3, C002-IF-008 §4). `install/hooks.template.json`
(`placement.hooks_file`) holds a SessionStart and a SubagentStop entry whose commands are
`node "@CLI_COPY@" hook …` with arguments only (C002-REQ-313 … C002-REQ-316), and no command holds
`${PLUGIN_ROOT}` or `${CLAUDE_PLUGIN_ROOT}` (C002-REQ-326); the install command (C002-T-058) writes
`hooks.json` from it. Under server mode no file declares a PreToolUse hook (C002-REQ-302). Under the
hooks fallback the template adds exactly one plugin-level PreToolUse entry running
`hook guard --host copilot --agents` with the ten Architect agents (C002-REQ-308), no agent
frontmatter declares a hook, and `hooks/tool-classes.json` classes every tool the host offers a
specialist, the host-added `tool_search_tool` included (C002-REQ-318).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `scripts/generate/emit/copilot.ts` | `install/hooks.template.json` in both modes; under `copilot-hooks` the PreToolUse entry and `hooks/tool-classes.json`; no `hooks` key in agent frontmatter |
| add | `plugins/architect/targets/copilot/tool-classes.json` | source of the tool classes (`hook_tool_classes` of the Copilot table); initial values from the S-08 record (C002-IF-008 §2: `Write` write, `Bash` terminal with dialect `powershell`, `Glob`, `tool_search_tool` and the read servers' `<server>-<tool>` names `read_only`) |
| add | `tests/integration/cap03/package-hooks.test.ts` | the listed scenarios for both Copilot modes |

## Preconditions

- C002-T-031 and C002-T-032 done.

## Step outline (no production code)

1. Write each hook command as `node "@CLI_COPY@" hook … --host copilot` with arguments only: no shell
   operator, no root token, no backslash (C002-REQ-316, C002-REQ-326).
2. Write PreToolUse only under `copilot-hooks`, once, at plugin level; never in agent frontmatter
   (agent-scoped hooks did not run for subagent calls, S-08 fact F-4).
3. Derive the tools offered to each specialist from its `tools` list by their hook names, add
   `tool_search_tool`, and check that each has a class; a conductor-only tool (`ask_user`) needs none
   (C002-TS-332).
4. The hook names of the `edit` and read tools are not in the S-08 record: leave them out of the
   classes, so a call of them by an Architect agent is denied (C002-IF-008 §2 last class row).

## Verification

- `npm test -- cap03/package-hooks`

## Done when

- [ ] Listed scenarios pass in both modes
- [ ] Carried case listed in the task report: the TGT-PORT-001 and TGT-HOOK-001 findings of
      C002-TC-326 and C002-TC-355 to C002-T-035
- [ ] Progress reported: `sdd task set C002-T-033 --status done --commit <sha>`
