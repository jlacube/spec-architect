---
id: C002-CAP-03
artifact: spec/stories
change: CHG-002
phase: 10-spec
status: draft
capability: "Copilot VS Code target"
id_block: { US: 301-399, REQ: 301-399, TS: 301-399 }
---
# C002-CAP-03 — Copilot VS Code target: user stories

Revised for defect D-003: the facts F-1 … F-7 of `docs/spikes/S-08-copilot-vscode.md §5` replace the
platform assumptions they contradict; tested hosts: `../../10-context/scope.md` §3.1. Revised for
defects D-051, D-052 and D-053: the T-050 findings pass of 2026-11-11 on VS Code 1.145.2 refuted
facts F-5 and the plugin-level half of F-4 on that build (`../../10-context/scope.md` §3.1).

### C002-US-301 — Install Architect in VS Code with Copilot and reach gate G1
- **As a** P-03 adopter on Copilot VS Code
- **I want** a Copilot-format target package (custom agents, prompt files, skills and workspace MCP configuration), with install notes in the package and a README section
- **So that** I can start the conductor in Copilot Chat and take a change through ideation to gate G1
- **Value / outcome:** C002-SC-02; C002-GOAL-01, C002-GOAL-03
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-03
- **Context & notes:** Agents are `*.agent.md` files with `tools` and `agents` lists; commands become prompt files; skills keep the Agent Skills format (ideation §8; C002-R-001 A-10, A-11). VS Code needs `chat.plugins.enabled` and registers local plugins through `chat.pluginLocations` (C002-R-001 A-08); it copies the plugin into its own folder and loads its hooks from the copy (`docs/spikes/S-08-copilot-vscode.md §3`). The package's agents and MCP servers reach the chat only as workspace files of the adopter's repository, written by the Copilot install command (C002-US-306; facts F-1, F-2). The Local session type runs the chat in the local agent host; the Copilot CLI session type does not offer the package's agents (§3). `${PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_ROOT}` are used in no generated field (fact F-3; C002-R-001 A-09 for bodies). The package must not carry the Claude Code `hooks/hooks.json` unchanged: VS Code ignores its matchers (C002-R-001 A-04) and a plugin-level hook runs for every chat (§2.2). Only the conductor may start other agents (`agents` list); the host still offers its host built-in agents beside that list (C002-US-307). The package carries its own copy of the sdd CLI for its hook commands, because a hook that errors denies every tool call of the session (§3). Prompt file names follow the source command names; VS Code offers them under the plugin's name as `/architect:<name>`, and a bare `/init` runs VS Code's own built-in `/init` (defect D-053). A new VS Code window sets the model picker to Auto, which routes to another model, so the install notes tell P-03 to pick a Claude model (defect D-053; C002-REQ-304).
- **Requirements:** C002-REQ-301, C002-REQ-303, C002-REQ-304, C002-REQ-305, C002-REQ-317
- **Traces to:** ideation §5, §8; C002-DEC-004, C002-DEC-006

### C002-US-302 — Write/shell boundary through the sdd MCP server
- **As a** P-01 spec owner
- **I want** the generated Copilot agents to have no generic edit or terminal tool, and to write `.sdd/` files and run allowlisted commands only through the sdd MCP server
- **So that** the boundary holds for the Architect agents in VS Code through their tool lists, without depending on the agent identity in the hook input
- **Value / outcome:** C002-GOAL-02; C002-SC-03
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-03
- **Context & notes:** C002-DEC-001 (C002-OA-001, option B: fails closed). C002-AS-03 is confirmed for tool lists: subagents are confined in the local agent host and in Copilot CLI (`docs/spikes/S-08-copilot-vscode.md §2.1`, §3.1, §3.2), and the S-08 record gives sdd MCP server enforcement (§4). Read and search tools stay available to the agents. MCP tools are granted as `<server>/*` (or `<server>/<tool>` on Copilot CLI), named `<server>-<tool>` and deferred: an agent loads them through the host's `tool_search_tool` (§3.2, fact F-7). An agent without a `tools` list gets every tool of the host (§3.2). The server's tools are designed for the agents' actual write operations, because agents without generic Edit and Bash may work less well (ideation §9). Whether VS Code asks P-01 to approve each sdd MCP server call is not in the S-08 record (ideation §11). The Copilot install command writes outside `.sdd/`, so the agents may not run it. The tool lists confine the Architect agents only: the host built-in agents that the conductor can start run with the host's tools (§3, §3.2) and are covered by C002-US-307.
- **Requirements:** C002-REQ-302, C002-REQ-306, C002-REQ-307, C002-REQ-325, C002-REQ-604, C002-REQ-117
- **Traces to:** C002-DEC-001; Q-guards-01; ideation §8 (Enforcement per target)

### C002-US-303 — Visible Copilot guard hooks fallback
- **As a** P-01 spec owner
- **I want**, if a later spike record shows that Copilot subagents are not confined to their tool list, the Copilot target package to carry plugin-level or workspace-level PreToolUse hooks that run the guard cores for the calls of Architect agents identified by `agent_type`, the conductor to write only through the sdd MCP server, and the exception to be visible: a README warning, a doctor line that reports hooks disabled, and an entry in the manual VS Code checklist
- **So that** Copilot still ships with an enforced boundary while hooks are on, and nobody mistakes a disabled-hooks setup for a protected one
- **Value / outcome:** C002-GOAL-02
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-03
- **Context & notes:** Conditional: the S-08 record at the tested versions gives sdd MCP server enforcement (`docs/spikes/S-08-copilot-vscode.md §4`), so this fallback is not used there. C002-DEC-005 exception: with hooks enabled, the guard corpora still pass 100% and the injection evals show 0 instructions acted upon; the boundary is off whenever hooks are disabled (`chat.useHooks`, Workspace Trust, organisation policy). Agent-scoped hooks are not used: they did not run for a subagent's calls in the local agent host (§3.1, fact F-4). Plugin-level hooks run for every call of every agent and carry `agent_type` on subagent calls in Copilot CLI and, as S-08 found, in VS Code Insiders 1.142; the session agent's calls carry none (§2.3, §3, §3.1), so the guard decides Architect subagent calls only and the conductor gets no generic edit or terminal tool; VS Code 1.145.2 sends no `agent_type` in PreToolUse input, subagent calls included, so there these guard hooks pass every call and the fallback is not offered for VS Code (defect D-052; C002-REQ-308); the calls of non-Architect subagents are decided by the Copilot subagent guard hook in both modes (C002-US-307). A hook that errors denies the call on both hosts; Copilot CLI reports exit code 2 as code 1 and fails closed (§2.2, §3, fact F-6). The doctor reads the VS Code settings instead of relying on a hook, which could not report its own absence (C002-DEC-005, Consequences); how it detects each disabling source is not in the S-08 record (ideation §11). Hook tool names: `Write`, `Bash`, `Glob`, `Agent`, `<server>-<tool>` and the host-added `tool_search_tool` (§2.3, §3.1, §3.2). If the guard hooks do not block a subagent's tool calls either, the Copilot target is deferred (C002-US-606).
- **Requirements:** C002-REQ-308, C002-REQ-309, C002-REQ-310, C002-REQ-316, C002-REQ-318, C002-REQ-319, C002-REQ-320, C002-REQ-321, C002-REQ-326, C002-REQ-510, C002-REQ-616, C002-REQ-622, C002-REQ-628, C002-REQ-629
- **Traces to:** C002-DEC-001 (Fallback), C002-DEC-005; Q-guards-02, Q-guards-03

### C002-US-304 — Interviews and gates through `askQuestions`
- **As a** P-01 spec owner
- **I want** the conductor in VS Code to run interview rounds and gates through VS Code's question tool `askQuestions`, with the same round rules as on Claude Code, and a skipped answer or the host's auto-reply never to count as an approval or an answer
- **So that** gates in VS Code record my own words, as on Claude Code
- **Value / outcome:** C002-GOAL-03; C002-SC-02
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-03
- **Context & notes:** The question tool of VS Code's Local session type is `askQuestions` (tool `vscode_askQuestions`, legacy name `vscode/askQuestions` in VS Code's tool metadata as read in the T-050 findings pass, yet the only tools entry that grants the tool on VS Code 1.145.2, rechecked by every checklist run, C002-TS-216); `ask_user` is the Copilot CLI tool (defect D-051, T-050 findings pass of 2026-11-11 on VS Code 1.145.2, which refuted fact F-5 of `docs/spikes/S-08-copilot-vscode.md §3.2`), so the package lists `ask_user`, `askQuestions` and `vscode/askQuestions` (defect D-054, C002-T-050 binding run of 2026-11-11, VSC-14: `askQuestions` alone did not grant the tool; `vscode/askQuestions` does; C002-REQ-211). With `ask_user` alone, and with `ask_user` and `askQuestions`, every round fell back to plain text; with `askQuestions` and `vscode/askQuestions` the dialogs worked, a request of five questions included (calls of four and one). Its result gives per question header the selected labels, a free text and a skipped flag; a dismissed dialog gives no choice; with `chat.autoReply` on, the host answers with no selected label and its auto-reply text, while global tool auto-approve no longer skips questions on 1.145.2. The conductor treats each of these as no answer (C002-REQ-311); the manual VS Code checklist records the input shape and these results (C002-REQ-614); Architect's round rules apply unchanged. On an earlier build, auto-approve made `vscode/askQuestions` return `{"skipped": true}` without showing anything (C002-R-001 A-07). Interviews and gates stay in the conductor as the session agent (C001-CON-04). What the conductor does when the tool is unavailable is settled in C002-REQ-312: the plain-text fallback of C001-REQ-222, with no tool-enabling detour (C001-REQ-223; defect D-037).
- **Requirements:** C002-REQ-211, C002-REQ-212, C002-REQ-213, C002-REQ-311, C002-REQ-312
- **Traces to:** ideation §8 (Interviews and gates); C002-R-001 A-06, A-07; D-003; D-051; D-054

### C002-US-305 — Session-start brief and SubagentStop trace in VS Code
- **As a** P-01 spec owner
- **I want** the Copilot target to give the conductor the session-start status brief through Copilot's `SessionStart` hook, and to refresh the trace through `SubagentStop` after an author agent finishes
- **So that** orientation and traceability work in VS Code as they do on Claude Code
- **Value / outcome:** C002-GOAL-03
- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-03
- **Context & notes:** Ideation §5 hook table marks both "in" for Copilot VS Code. Plugin-level `SessionStart` and `SubagentStop` hooks run in the local agent host; `SubagentStop` input carries `agent_type`, the workspace agent's name in VS Code (`docs/spikes/S-08-copilot-vscode.md §2.3`, §3, §3.1). These hooks do not guard anything: with hooks disabled, the brief and the automatic trace are absent, and the trace is left to the auditor at gates, as on OpenCode (ideation §5). Hook commands use no `${PLUGIN_ROOT}` token, which VS Code leaves unexpanded on Windows (§3, fact F-3). GitHub Copilot Chat 0.73.0 adds a SessionStart hook's output to the session context only when it is a JSON object with `hookSpecificOutput.additionalContext`, and ignores plain text, so the Copilot brief is that JSON object (defect D-053; C002-REQ-313); SubagentStop input carries `agent_type` on VS Code 1.145.2 too (defect D-052).
- **Requirements:** C002-REQ-313, C002-REQ-314, C002-REQ-315, C002-REQ-316, C002-REQ-326
- **Traces to:** ideation §5 (Hooks per target)

### C002-US-306 — Install the Copilot workspace files with one command
- **As a** P-03 adopter on Copilot VS Code
- **I want** one sdd CLI command that writes the Architect agents and MCP servers of the Copilot target package into my repository, without replacing agents or servers of my own
- **So that** the conductor can start the specialists and reach the sdd MCP server in VS Code
- **Value / outcome:** C002-SC-02; C002-GOAL-01
- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-03
- **Context & notes:** The local agent host starts workspace agents (`.github/agents/`) as subagents but not plugin agents, and starts workspace MCP servers (`.vscode/mcp.json`) but not the servers of a plugin (`docs/spikes/S-08-copilot-vscode.md §3`, §3.1, §3.2; facts F-1, F-2). The command runs in P-03's terminal; Architect agents may not run it (C002-REQ-325). Command name and options: C002-IF-007.
- **Requirements:** C002-REQ-322, C002-REQ-323, C002-REQ-324, C002-REQ-304
- **Traces to:** D-003; ideation §8 (One source, generated targets)

### C002-US-307 — Host built-in agents kept from edits and commands in Architect repositories
- **As a** P-01 spec owner
- **I want** the Copilot target package, in both enforcement modes, to deny the write and terminal tool calls of every subagent that is not an Architect agent, the host built-in agents such as `general-purpose`, `task` and `explore` included, in a repository that contains `.sdd/`
- **So that** an instruction planted in an artifact that asks the conductor to delegate an edit or a command to a host built-in agent cannot write outside `.sdd/` or run a command outside the allowlist, as on Claude Code, where the conductor can start only the nine specialists
- **Value / outcome:** C002-GOAL-02; C002-SC-03
- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-03
- **Context & notes:** The local agent host offered its built-in agents to a parent whose `agents` list named two other agents (`docs/spikes/S-08-copilot-vscode.md §3`), so the conductor's `agents` list (C002-REQ-107) does not limit its starts to the specialists, and an agent without a `tools` list of the package runs with the host's tools (§3.2). Plugin-level PreToolUse hooks run for subagent tool calls and carry `agent_type` in Copilot CLI (§2.3) and, as S-08 found, in VS Code Insiders 1.142 (§3.1); whether a built-in agent's calls carry it in Copilot CLI is not in the record (C002-REQ-327 open item). VS Code 1.145.2 sends no `agent_type` in PreToolUse input, subagent calls included, so there the hook denies nothing and a subagent of the adopter's default agent could edit a product-code file in the T-050 findings pass of 2026-11-11 (defect D-052). P-01 decided on 2026-11-11 to rely on confinement on VS Code and state the gap: the Architect agents' tool lists hold no generic edit or terminal tool (C002-REQ-306), the sdd MCP server guards their writes, the conductor's instructions limit its delegations to the nine specialists, a restriction that VS Code does not enforce, so a planted delegation that the model follows is not stopped there (critic CR-156), and the install notes and the README name the known limitation, with no hold of the release (C002-REQ-304, C002-REQ-305). The session agent's calls carry no `agent_type` and stay outside this guard (C002-REQ-306, C002-REQ-321). Where the hook acts, P-01 accepted the cost (Q-safety-06, `../../questions-log.md` round 6): in a repository with `.sdd/`, the adopter's own subagents, built-in agents and adopter agents started as subagents, call only read-only tools; the install notes state it (C002-REQ-304). Repositories without `.sdd/` are not affected. The guard runs only while hooks are enabled.
- **Out of scope:** the Architect agents' own boundary (C002-US-302, C002-US-303); the session agent's calls (C002-REQ-306, C002-REQ-321).
- **Requirements:** C002-REQ-327, C002-REQ-328, C002-REQ-329, C002-REQ-330, C002-REQ-318, C002-REQ-510, C002-REQ-304, C002-REQ-305
- **Traces to:** Q-safety-06; C002-DEC-005; critic finding CR-37 (`../../90-critic-report.md`, D-003 review); defect D-052 (P-01 2026-11-11, "1, go ahead with the revision")
