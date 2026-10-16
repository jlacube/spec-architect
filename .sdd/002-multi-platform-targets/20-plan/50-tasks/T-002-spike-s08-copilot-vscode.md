---
id: C002-T-002
title: "Spike S-08: GitHub Copilot in VS Code and Copilot CLI"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-01
status: todo
depends_on: []
implements: []
satisfies_ac: [C002-AC-306.1, C002-AC-308.1, C002-AC-620.1]
verified_by: [C002-TS-623, C002-TC-623]
components: [C002-COMP-002, C002-COMP-004]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-002 — Spike S-08: GitHub Copilot in VS Code and Copilot CLI

## Intent

Settle the Copilot facts behind C002-AS-03 and C002-DEC-005: whether subagents are confined to their
tool lists, and whether agent-scoped hooks block a subagent's calls. The spike writes the spike record
of C002-IF-009 §3, which sets the Copilot enforcement mode or triggers the defer branch of
`10-spec/10-context/scope.md` §1.1.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/spikes/S-08-copilot-vscode.md` | spike record: S-08 frontmatter of C002-IF-009 §3; body with method, versions and results |
| add | `docs/spikes/s08/` | throwaway local plugin (two agents, one prompt file, `.mcp.json` with a stub server, agent-scoped hooks); never shipped |

## Preconditions

- REF-WIN with VS Code, GitHub Copilot Chat and Copilot CLI installed; P-01 names the versions.
- Settings `chat.plugins.enabled`, `chat.pluginLocations` and `chat.askQuestions.enabled` on.

## Step outline (no production code)

1. Record `host_versions` (VS Code, Copilot Chat, Copilot CLI).
2. **Tool-list confinement** (`subagent_tool_list_confined`): start a subagent whose `tools` list lacks
   edit and terminal tools, and ask it, through the parent, to edit a file and run a command.
3. **Agent-scoped hooks** (`agent_hooks_block_subagent_calls`): declare a PreToolUse hook in an agent's
   frontmatter that exits 2. Check that it blocks that agent's calls as a subagent. Record the hook
   input shape (tool names, path fields, `agent_type`) and the exit-code semantics, for C002-IF-008 §2
   and the tool classes of C002-REQ-318.
4. **MCP grants**: check whether only whole-server grants (`<server>/*`) work or also per-tool grants
   (architecture §6.2 alternative). Check that the plugin's `.mcp.json` servers start.
5. `copilot_cli_loads_package`: load the probe plugin in Copilot CLI non-interactive mode.
6. Record `terminal_dialect`, `cmd_shims`, the model identifier per tier (C002-REQ-105), Serena's
   context for VS Code (C002-REQ-114), and the `vscode/askQuestions` result for a skipped answer and
   a dismissed call (C002-REQ-311), and its absence when the setting is off (C002-REQ-312).
7. Set `enforcement_mode` by the S-08 rule: `sdd-mcp-server` when subagents are confined, else
   `copilot-hooks` when hooks block, else `deferred`. If the mode is `deferred`, raise a spec defect
   against C002-CAP-03 and stop the Copilot tasks until P-01 has revised the spec (scope §1.1;
   `10-strategy.md` §4). P-01 signs off the record.

## Verification

- The record's frontmatter validates against the S-08 keys of C002-IF-009 §3.
- Run `node plugins/architect/scripts/sdd.mjs lint 002` (no new findings).

## Done when

- [ ] Record committed with P-01's sign-off
- [ ] Defer branch decided: mode recorded, or the spec defect raised and the revision scheduled with P-01
- [ ] Progress reported: `sdd task set C002-T-002 --status done --commit <sha>`
