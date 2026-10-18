---
id: C002-T-033
title: "Copilot package: hook template, Copilot guard and subagent guard hook, tool classes"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: done
depends_on: [C002-T-031, C002-T-032]
implements: [C002-REQ-302, C002-REQ-308, C002-REQ-313, C002-REQ-314, C002-REQ-315, C002-REQ-316, C002-REQ-318, C002-REQ-326, C002-REQ-327]
satisfies_ac: [C002-AC-302.1, C002-AC-308.1, C002-AC-316.1, C002-AC-318.1, C002-AC-326.1]
verified_by: [C002-TS-303, C002-TS-304, C002-TS-311, C002-TS-325, C002-TS-326, C002-TS-330, C002-TS-331, C002-TS-332, C002-TS-355, C002-TC-303, C002-TC-304, C002-TC-311, C002-TC-325, C002-TC-326, C002-TC-330, C002-TC-331, C002-TC-332, C002-TC-355]
components: [C002-COMP-001, C002-COMP-004]
risk_refs: [C002-RISK-032]
estimate: M
report: { commit: d02b182, completed_at: 2026-10-18, notes: "Hook template + tool classes; TC-303/304/311 (template part)/325/330/331/332 + T-031 clauses of TC-301/302; TGT-HOOK-001/TGT-CLASS-001 findings implemented (copilotHookFindings) — T-035 wires them into npm run check; TC-311 installed files to T-058; tool classes kept only in targets/copilot.json (hook_tool_classes), no separate targets/copilot/tool-classes.json (single source)" }
---

# C002-T-033 — Copilot package: hook template, Copilot guard and subagent guard hook, tool classes

## Intent

Emit the package side of the Copilot hooks (C002-IF-005 §3, C002-IF-008 §2 and §4, revised after
the critic's D-003 review). `install/hooks.template.json` (`placement.hooks_file`) holds a
SessionStart and a SubagentStop entry whose commands are `node "@CLI_COPY@" hook …` with arguments
only (C002-REQ-313 … C002-REQ-316), and no command holds `${PLUGIN_ROOT}` or `${CLAUDE_PLUGIN_ROOT}`
(C002-REQ-326). **In both modes** the template also holds exactly one PreToolUse entry,
`hook guard --host copilot --mode <the table's enforcement mode> --agents <the ten Architect
agents>`: under `sdd-mcp-server` it is only the Copilot subagent guard hook (C002-REQ-302,
C002-REQ-327), under `copilot-hooks` it is also the Copilot guard hook of the Architect agents
(C002-REQ-308). The install command (C002-T-058) writes the package's `hooks.json` and the workspace
hook file `.github/hooks/architect-guard.json` from it. No agent frontmatter declares a hook.
`hooks/tool-classes.json` is emitted in both modes (C002-REQ-318): it classes every tool the host
offers a specialist, the host-added `tool_search_tool` and the sdd MCP server tools included, and
the recorded generic tools `Write` and `Bash`.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `scripts/generate/emit/copilot.ts` | `install/hooks.template.json` in both modes with the PreToolUse entry carrying `--mode` from the table; `hooks/tool-classes.json` in both modes; no `hooks` key in agent frontmatter |
| add | `plugins/architect/targets/copilot/tool-classes.json` | source of the tool classes (`hook_tool_classes` of the Copilot table); initial values of C002-IF-008 §2: `write` `Write`, `sdd-files-write_file`, `sdd-files-replace_text`; `terminal` `Bash` (dialect `powershell`) and `sdd-shell-run_command` (dialect `strictest`); `read_only` `Glob`, `tool_search_tool` and the read servers' `<server>-<tool>` names |
| add | `tests/integration/cap03/package-hooks.test.ts` | the listed scenarios for both Copilot modes |

## Preconditions

- C002-T-031 and C002-T-032 done.

## Step outline (no production code)

1. Write each hook command as `node "@CLI_COPY@" hook … --host copilot` with arguments only: no shell
   operator, no root token, no backslash (C002-REQ-316, C002-REQ-326).
2. Write the PreToolUse entry once, at plugin level, in both modes, with `--mode` equal to the
   table's `enforcement_mode` (TGT-HOOK-001); never in agent frontmatter (agent-scoped hooks did not
   run for subagent calls, S-08 fact F-4). Under `sdd-mcp-server` no other PreToolUse entry exists
   (C002-TS-303, C002-TS-304).
3. Derive the tools offered to each specialist from its `tools` list by their hook names, add
   `tool_search_tool`, the sdd MCP server tools and the generic `Write` and `Bash`, and check that
   each has a class; a conductor-only tool (`ask_user`) needs none (C002-TS-332).
4. The hook names of the `edit` and read tools are not in the S-08 record: leave them out of the
   classes, so a call of them is denied as unclassed (C002-IF-008 §2: rule 8 for an Architect agent
   under the fallback, rule 6 for a non-Architect subagent).

## Verification

- `npm test -- cap03/package-hooks`

## Done when

- [ ] Listed scenarios pass in both modes
- [ ] Carried case listed in the task report: the TGT-PORT-001, TGT-HOOK-001 and TGT-CLASS-001
      findings of C002-TC-326 and C002-TC-355 to C002-T-035
- [ ] Progress reported: `sdd task set C002-T-033 --status done --commit <sha>`
