---
id: C002-CAP-03
artifact: spec/requirements
change: CHG-002
phase: 10-spec
status: draft
capability: "Copilot VS Code target"
---
# C002-CAP-03 — Requirements

Brownfield change: every requirement carries a Delta. The question-tool requirements shared with
OpenCode are C002-REQ-211 to C002-REQ-213 (CAP-02). The enforcement mode of the Copilot target is
sdd MCP server enforcement, fixed by the signed-off spike record
(`docs/spikes/S-08-copilot-vscode.md §4`; tested hosts: `../../10-context/scope.md` §3.1). The
requirements of the Copilot hooks fallback stay as the conditional fallback of C002-DEC-005 for a
later tested version whose spike record shows subagents not confined; if neither mode holds, the
target is refused by C002-REQ-620 and P-01 revises this spec to remove this capability
(`../../10-context/scope.md` §1.1, Q-defer-01). Revised for defect D-003 (spike facts F-1 … F-7,
`docs/spikes/S-08-copilot-vscode.md §5`), and after the critic's D-003 review for the host built-in
agents that the conductor can start, in both enforcement modes (Q-safety-06; C002-REQ-327 …
C002-REQ-330).

### C002-REQ-301 — Copilot target package contents
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE Copilot target package SHALL contain the ten agents as `*.agent.md` files, the commands as prompt files, the skills in the Agent Skills format, a workspace MCP configuration that declares the MCP servers of the source plugin, and a copy of the sdd CLI that its hook commands run.
- **Rationale:** ideation §8; C002-R-001 A-08, A-10, A-11; servers of the source plugin per C001-REQ-1108; the local agent host starts workspace agents as subagents but not plugin agents (`docs/spikes/S-08-copilot-vscode.md §3`, §3.1, fact F-1), so the agent files are the source of the workspace agents that the Copilot install command writes (C002-REQ-322); it starts workspace MCP servers but not the MCP servers of a plugin (§3.2, fact F-2), so the servers are declared as workspace MCP configuration entries (C002-REQ-323); the hook commands run the CLI copy inside the package, not a PATH `sdd`, because a hook that errors fails closed and then denies every tool call of the session (§2.2, §3), so a hook that does not find the CLI would block the whole chat (C002-NFR-204; C002-CON-14; architecture §6.2); the copy is the plugin's bundled `scripts/sdd.mjs` of the same packaging run (C002-IF-005 §3, C002-IF-008 §4)
- **Stories:** C002-US-301
- **Priority:** Must
- **Acceptance:** C002-AC-301.1
- **Open items:** Serena's context on Copilot VS Code is not in the S-08 record (baseline survey §4 note 6; C002-IF-001 §6.2); its data folder and read-only launch: C002-REQ-114.

### C002-REQ-302 — Only the subagent guard hook under server enforcement
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the Copilot target uses sdd MCP server enforcement, THE Copilot target package SHALL declare no PreToolUse hook other than the Copilot subagent guard hook.
- **Rationale:** the Architect agents' boundary is their tool lists, which the local agent host and Copilot CLI confine (`docs/spikes/S-08-copilot-vscode.md §2.1`, §3.1, §3.2); these lists do not confine the host built-in agents that the local agent host offers to a parent beside the agents of its `agents` list (§3), so the Copilot subagent guard hook denies their write and terminal calls (C002-REQ-327; Q-safety-06, `../../questions-log.md` round 6); a plugin-level PreToolUse hook runs for every tool call of every agent, the adopter's own chats included (§2.2, §3), and a hook that errors denies every call (§3), so in this mode no PreToolUse hook runs a guard core on the Architect agents' calls, which would add no protection and would add a way to block P-03's chats, and the subagent guard hook passes those calls and the session agent's calls (C002-REQ-330); agent-scoped hooks do not run for subagent calls (§3.1, fact F-4); the guard hooks of the hooks fallback: C002-REQ-308
- **Stories:** C002-US-302
- **Priority:** Must
- **Acceptance:** C002-AC-302.1

### C002-REQ-303 — Prompt files run in the conductor
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE Copilot target package SHALL name the conductor as the agent of every prompt file.
- **Rationale:** the `claude --agent` guard line of the 13 commands (baseline survey §1.3, E-8) becomes the prompt file's `agent` field (C002-R-001 A-10)
- **Stories:** C002-US-301
- **Priority:** Must
- **Acceptance:** C002-AC-303.1

### C002-REQ-304 — Install notes in the Copilot package
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE Copilot target package SHALL contain install notes that state the prerequisites (Node.js 20 or later, VS Code and GitHub Copilot Chat at their tested versions, access to the Claude models of C002-REQ-105), the installation of `architect-sdd`, the run of the Copilot install command in the adopter's repository, the VS Code settings the package needs (`chat.plugins.enabled`, `chat.pluginLocations`, `chat.askQuestions.enabled`), the Local session type, the selection of the conductor as the session agent, that the workspace MCP servers start only after the first message of a session, and that in a repository that contains `.sdd/` every subagent that is not an Architect agent, the host built-in agents and the adopter's own agents included, can call only the read-only tools of the tool classes file while hooks are enabled.
- **Rationale:** C002-R-001 A-06, A-08; C002-SC-02; the Copilot CLI session type of VS Code does not offer the package's agents, the Local session type does (`docs/spikes/S-08-copilot-vscode.md §3`); a workspace MCP server cannot start before the session's first message (§3.2, fact F-2); install command: C002-REQ-322, C002-REQ-323; the restriction on non-Architect subagents is the cost that P-01 accepted for the Copilot subagent guard hook (Q-safety-06, `../../questions-log.md` round 6; C002-REQ-327, C002-REQ-328, C002-REQ-329), and the guard does not run while hooks are disabled by `chat.useHooks`, Workspace Trust or an organisation policy (C002-REQ-310 for the hooks fallback)
- **Stories:** C002-US-301, C002-US-306
- **Priority:** Must
- **Acceptance:** C002-AC-304.1
- **Open items:** [ASSUMPTION: S-08 — the record names the question tool `ask_user` (§3.2) but not whether it depends on `chat.askQuestions.enabled`; the notes keep the setting until the manual VS Code checklist shows that `ask_user` works without it]

### C002-REQ-305 — README section for Copilot VS Code
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE README SHALL contain a Copilot VS Code section that links the install notes of the Copilot target package and names the enforcement mode of that package.
- **Rationale:** ideation §5 (per-target README sections); the sections of C001-REQ-1115 stay as they are
- **Stories:** C002-US-301
- **Priority:** Must
- **Acceptance:** C002-AC-305.1

### C002-REQ-306 — No generic edit or terminal tool
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the Copilot target uses sdd MCP server enforcement, THE Copilot target package SHALL grant no generic edit or terminal tool to any Architect agent or prompt file.
- **Rationale:** C002-DEC-001 (C002-OA-001 option B: fails closed; the conductor is included, and prompt-file `tools` take precedence over the agent's); C002-AS-03 confirmed: a subagent gets only its listed tools plus `tool_search_tool` (`docs/spikes/S-08-copilot-vscode.md §3.1`, §3.2); an agent without a `tools` list gets every tool of the host (§3.2), which C002-REQ-604 reports
- **Stories:** C002-US-302
- **Priority:** Must
- **Acceptance:** C002-AC-306.1

### C002-REQ-307 — Two server profiles declared as workspace MCP servers
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the Copilot target uses sdd MCP server enforcement or the Copilot hooks fallback, THE Copilot target package SHALL declare the two local MCP servers that run the sdd MCP server of `architect-sdd` — `sdd-files` with the server profile of the write tools and `sdd-shell` with the server profile of the command tool — in its workspace MCP configuration and in no plugin MCP configuration.
- **Rationale:** C002-DEC-001; C002-US-302 (read and search tools stay); the local agent host reports plugin MCP servers `not_configured` and starts workspace servers (`docs/spikes/S-08-copilot-vscode.md §3.2`, fact F-2); a tool-restricted subagent granted `<server>/*` reached both tools of a workspace server (§3.2); the two profiles keep the command tool from agents without Bash (C002-REQ-117, C002-REQ-415; least privilege per C002-REQ-108); under the hooks fallback the conductor writes through these servers (C002-REQ-321); written into `.vscode/mcp.json` by C002-REQ-323; contract C002-IF-005 §3
- **Stories:** C002-US-302
- **Priority:** Must
- **Acceptance:** C002-AC-307.1
- **Open items:** whether VS Code asks P-01 to approve each server call or lets the package pre-approve its own servers is not in the S-08 record (ideation §11). Per-tool grants (`<server>/<tool>`) work on Copilot CLI (§2.1) and are not needed with two server profiles (architecture §6.2).

### C002-REQ-308 — Hooks fallback: Copilot guard hooks
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the Copilot hooks fallback is used, THE Copilot target package SHALL declare plugin-level or workspace-level PreToolUse hooks that, for each tool call whose hook input names an Architect agent in `agent_type`, run the path guard core on a call that can write a file and the bash guard core on a terminal call.
- **Rationale:** C002-DEC-001 (Fallback), C002-DEC-005 (exception); agent-scoped hooks of a subagent never ran in the local agent host (`docs/spikes/S-08-copilot-vscode.md §3.1`, `agent_hooks_block_subagent_calls: false`, fact F-4); plugin-level hooks run for subagent tool calls and carry `agent_type`, `agent_id` and `parent_agent_id` in VS Code and in Copilot CLI (§2.3, §3.1); placement of the hooks: C002-IF-005 §3; calls without an Architect `agent_type`: C002-REQ-320
- **Stories:** C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-308.1
- **Open items:** the hook `tool_name` values `Write` (create tool), `Bash` (terminal tool), `Glob`, `Agent` and `<server>-<tool>` are recorded (§2.3, §3, §3.1); the hook name of the `edit` tool is not in the S-08 record.

### C002-REQ-309 — Copilot guard hooks deny on their own faults
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF a Copilot guard hook cannot reach a decision on a call (unreadable input; for a call whose `agent_type` names an Architect agent, a tool name that the tool classes file does not class or an unreadable tool classes file; or an internal error), THEN THE Copilot guard hook SHALL deny the call with a deny decision on standard output and a non-zero exit code.
- **Rationale:** fail closed (C002-DEC-005); a hook that errors denies the call in the local agent host (`docs/spikes/S-08-copilot-vscode.md §3`); Copilot CLI reports a hook's exit code 2 as code 1, ignores the deny decision on standard output and fails closed (§2.2, fact F-6), so the deny holds without exit code 2 being passed through; rule `GUARD-HOOK-001` and the exit code: C002-IF-008 §2; tool classes file: C002-REQ-318
- **Stories:** C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-309.1

### C002-REQ-310 — README warning for the hooks fallback
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the Copilot hooks fallback is used, THE README SHALL warn in its Copilot VS Code section that the write/shell boundary is off whenever hooks are disabled by `chat.useHooks`, Workspace Trust or an organisation policy.
- **Rationale:** C002-DEC-005 (Consequences: the exception must be visible)
- **Stories:** C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-310.1

### C002-REQ-311 — No choice is neither answer nor approval
- **Delta:** ADDED
- **Pattern:** complex
- **Statement:** WHILE the conductor runs on a generated target, IF the question tool returns no choice of P-01 (a skipped answer, a dismissed call or an empty result), THEN THE conductor SHALL record neither an answer nor an approval for the questions of that call.
- **Rationale:** C002-R-001 A-07 (`{"skipped": true}` under auto-approve); P-01's authority (`../../10-context/stakeholders-and-personas.md`, P-01); the result of `ask_user` without a choice is not in the S-08 record, so the manual VS Code checklist exercises it (C002-REQ-614)
- **Stories:** C002-US-304, C002-US-204
- **Priority:** Must
- **Acceptance:** C002-AC-311.1

### C002-REQ-312 — Question tool unavailable in VS Code
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF `ask_user` is not available to the conductor in VS Code, THEN THE conductor SHALL ask its interview round or present its gate as plain text in its reply, with the content of C001-IF-05 `questions.md` §3 and without an instruction to enable, install or switch on `ask_user`, and end its turn.
- **Rationale:** defect D-037 (found in C001-T-084; the conductor's decision under P-01's answer to Q-noask-01): the earlier statement (ask nothing, name the missing tool and the step of the install notes) contradicted C001-REQ-222 (plain-text fallback when the session offers no question tool) and C001-REQ-223 (no tool-enabling detour), which the shipped Copilot wiring follows; this requirement applies them to `ask_user`, the question tool of the local agent host (`docs/spikes/S-08-copilot-vscode.md §3.2`, fact F-5). With the tool, interviews and gates keep their structured answers (C002-REQ-211, C002-REQ-212, C002-REQ-311); the install notes still say how the tool is made available (C002-REQ-304)
- **Stories:** C002-US-304
- **Priority:** Must
- **Acceptance:** C002-AC-312.1

### C002-REQ-313 — Session-start brief in VS Code
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN a Copilot chat session starts in a repository that contains `.sdd/`, THE Copilot target package's session-start hook SHALL emit the status brief of C001-IF-07 §4.
- **Rationale:** ideation §5 (hook table: in for Copilot VS Code); C001-REQ-911 on Claude Code; a plugin-level `SessionStart` hook runs in the local agent host when its command holds no root token (`docs/spikes/S-08-copilot-vscode.md §3`; C002-REQ-326)
- **Stories:** C002-US-305
- **Priority:** Must
- **Acceptance:** C002-AC-313.1

### C002-REQ-314 — Silent session start without a workspace
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF a Copilot chat session starts in a repository without `.sdd/`, THEN THE Copilot target package's session-start hook SHALL exit with code 0 and empty output.
- **Rationale:** C001-REQ-912 on Claude Code
- **Stories:** C002-US-305
- **Priority:** Must
- **Acceptance:** C002-AC-314.1

### C002-REQ-315 — Trace refresh after an author agent in VS Code
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the spec-writer, test-designer, architect or planner stops in VS Code, THE Copilot target package's SubagentStop hook SHALL run the trace refresh of C001-IF-07 §2 for the active changes and exit with code 0.
- **Rationale:** a plugin-level `SubagentStop` hook fires for workspace subagents and its input carries `agent_type` (`docs/spikes/S-08-copilot-vscode.md §2.3`, §3.1); C001-IF-07 §2 (SubagentStop row: always exit 0)
- **Stories:** C002-US-305
- **Priority:** Must
- **Acceptance:** C002-AC-315.1
- **Open items:** settled by S-08: VS Code reports a workspace agent's name as `agent_type` (`ws-hooked`, §3.1); Copilot CLI reports `<plugin>:<agent>` (§2.3).

### C002-REQ-316 — Hook commands without shell syntax
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE Copilot target package's hook commands SHALL invoke the sdd CLI with arguments only, without shell-specific operators or syntax.
- **Rationale:** C001-REQ-1121 on Claude Code (PowerShell and Git Bash, C001-CON-06); hook commands run through the Windows shell (`docs/spikes/S-08-copilot-vscode.md §2.2`; `terminal_dialect: powershell`); root token: C002-REQ-326
- **Stories:** C002-US-305, C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-316.1

### C002-REQ-317 — Copilot prompt file names
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE Copilot target package SHALL name each prompt file `<name>.prompt.md`, where `<name>` is the file name of the source command without its extension.
- **Rationale:** VS Code invokes a prompt file as `/<name>` (C002-R-001 A-10); `/architect:<name>` references become `/<name>` (C002-IF-001 §2); placement `prompts/<command>.prompt.md` (C002-IF-005 §3)
- **Stories:** C002-US-301
- **Priority:** Must
- **Acceptance:** C002-AC-317.1
- **Open items:** [ASSUMPTION: S-08 — the S-08 record does not cover prompt files; the manual VS Code checklist confirms these names; if a source command name collides with a VS Code built-in slash command, every prompt file takes the prefix architect- as on OpenCode (C002-REQ-216, C002-IF-001 §2)]

### C002-REQ-318 — Tool classes file of the Copilot package
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE Copilot target package SHALL contain a tool classes file that assigns to one of the classes `write`, `terminal` and `read_only` of C002-IF-008 §2 every tool the host offers to an Architect agent other than the conductor (its granted tools and the tools the host adds, such as `tool_search_tool`) and every generic edit or terminal tool of the host whose hook tool name the spike record gives.
- **Rationale:** a plugin-level hook runs for every tool call of every agent, reads included (`docs/spikes/S-08-copilot-vscode.md §2.2`); the host adds `tool_search_tool` to an agent whose `tools` list omits it (§3.2); a tool the file does not class is denied (C002-REQ-309, C002-REQ-328), so a read tool missing from the file would block the agent; the Copilot subagent guard hook classes the calls of non-Architect subagents with this file in both enforcement modes (C002-REQ-327, C002-REQ-329), so the file is present in both; the recorded hook names of generic tools are `Write` (create tool) and `Bash` (terminal tool), and the hook name of the `edit` tool is not in the record (§2.3, §3.1; C002-REQ-308 open item); the conductor's calls carry no `agent_type` and pass the hooks (C002-REQ-320, C002-REQ-321, C002-REQ-330); hook tool names: §2.3, §3.1; file `hooks/tool-classes.json` (C002-IF-005 §3)
- **Stories:** C002-US-303, C002-US-307
- **Priority:** Must
- **Acceptance:** C002-AC-318.1

### C002-REQ-319 — Read-only tool calls pass the guard hook
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN a Copilot guard hook receives a call of an Architect agent to a tool in the class `read_only` of the tool classes file, THE Copilot guard hook SHALL allow the call with exit code 0.
- **Rationale:** every tool call reaches the hooks (C002-REQ-318); read and search tools stay available inside the boundary (C002-US-302, C002-US-303); class `read_only` of C002-IF-008 §2
- **Stories:** C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-319.1

### C002-REQ-320 — Session agent's calls pass the guard hook
- **Delta:** ADDED
- **Pattern:** complex
- **Statement:** WHERE the Copilot hooks fallback is used, WHEN a Copilot guard hook receives readable hook input whose `agent_type` is absent, THE Copilot guard hook SHALL allow the call with exit code 0.
- **Rationale:** a plugin-level hook runs for every tool call of every agent (`docs/spikes/S-08-copilot-vscode.md §2.2`, §3), and the session agent's own calls carry no `agent_type` (§2.3, §3, fact F-4), so a guard that decided these calls would act on P-03's own chats (the reason of C002-REQ-302); the Architect calls without `agent_type` are those of the conductor and its prompt files, which hold no generic edit or terminal tool (C002-REQ-321); a call whose `agent_type` is present and names no Architect agent, a host built-in agent's or an adopter agent's started as a subagent, is decided by the Copilot subagent guard hook (C002-REQ-327, C002-REQ-328, C002-REQ-329; Q-safety-06), not passed; the identity property is tested here, not by the corpus replay (C002-REQ-626)
- **Stories:** C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-320.1

### C002-REQ-321 — Conductor through the sdd MCP server under the hooks fallback
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the Copilot hooks fallback is used, THE Copilot target package SHALL grant the conductor and every prompt file the server profiles of C002-REQ-117 in place of generic edit and terminal tools.
- **Rationale:** the conductor runs as the session agent, whose tool calls carry no `agent_type` (`docs/spikes/S-08-copilot-vscode.md §2.3`, §3, fact F-4), so no Copilot guard hook can tell its calls from P-03's (C002-REQ-320); its writes and commands then go through the sdd MCP server, which decides without agent identity (C002-DEC-001; C002-REQ-307); prompt files run in the conductor (C002-REQ-303)
- **Stories:** C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-321.1

### C002-REQ-322 — Copilot install command writes the workspace agents
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN P-03 runs the Copilot install command in a repository, THE sdd CLI SHALL write the ten agents of the Copilot target package as `.github/agents/<agent name>.agent.md` files of that repository, where `<agent name>` is the name of the source agent, such as `sdd-conductor`.
- **Rationale:** an agent name is `sdd-` followed by the agent's role (`sdd-critic`), the file name form of C002-IF-005 §3 and `ERR-CLI-021` (C002-TS-341: `sdd-conductor.agent.md`); the local agent host does not start plugin agents as subagents (`Unknown agent_type`) and starts workspace agents as subagents with their tool lists confined (`docs/spikes/S-08-copilot-vscode.md §3`, §3.1, fact F-1); the conductor starts the specialists (C002-REQ-107), so all ten are workspace agents; command name, options and how it finds the package: C002-IF-007; stated cost: the same install writes the Copilot subagent guard hook beside these agents, into `.github/hooks/architect-guard.json`, with the absolute path of the package on this machine (C002-IF-005 §3, C002-IF-008 §2), so in a clone where that package path does not exist every tool call in that repository is denied until the Copilot install command runs there (fail-closed, C002-CON-08); the install notes therefore say to keep the files the command writes (`.github/agents/`, `.github/hooks/`, `.github/architect-install.json`) and `.vscode/mcp.json` together, all in version control or none (C002-IF-005 §5 step 2)
- **Stories:** C002-US-306
- **Priority:** Must
- **Acceptance:** C002-AC-322.1

### C002-REQ-323 — Copilot install command writes the workspace MCP servers
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN P-03 runs the Copilot install command in a repository, THE sdd CLI SHALL write the server entries of the Copilot target package's workspace MCP configuration into `.vscode/mcp.json` of that repository and keep every other server entry of that file.
- **Rationale:** the local agent host starts workspace MCP servers and not the MCP servers of a plugin (`docs/spikes/S-08-copilot-vscode.md §3.2`, fact F-2); an adopter's `.vscode/mcp.json` may already declare servers of their own; entries: C002-REQ-301, C002-REQ-307; `.vscode/mcp.json` is kept in version control together with the agents and the guard hook file, or not at all (the cost of a clone without the package path: C002-REQ-322)
- **Stories:** C002-US-306
- **Priority:** Must
- **Acceptance:** C002-AC-323.1

### C002-REQ-324 — Copilot install command keeps the adopter's files
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF a file that the Copilot install command would write under `.github/agents/` already exists without having been written by that command, or `.vscode/mcp.json` cannot be parsed or declares a server of the same name that the command did not write, THEN THE sdd CLI SHALL write no file and exit non-zero with a message that names each such file or server.
- **Rationale:** the command writes into the adopter's repository, outside `.sdd/`; an adopter agent or server of the same name must not be replaced without notice (C002-REQ-208 keeps adopter agents untouched on OpenCode); how a file written by the command is recognised and the exit code: C002-IF-007
- **Stories:** C002-US-306
- **Priority:** Must
- **Acceptance:** C002-AC-324.1

### C002-REQ-325 — Copilot install command denied to Architect agents
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF an Architect agent requests the Copilot install command, as a bare `sdd` command or through `node <path>/sdd.mjs`, THEN THE bash guard SHALL deny the command with rule `GUARD-BASH-001`.
- **Rationale:** the command writes outside `.sdd/` (write/shell boundary, C001-NFR-201), and the command tool of `sdd-shell` runs the bash guard core (C002-REQ-415; C002-IF-002 §5.2); P-03 runs it in their own terminal (C002-REQ-304); the subcommand is new, so no decision of the bash guard on Claude Code changes for an existing command (C002-GOAL-05); writing subcommands: C002-IF-008 §1.2
- **Stories:** C002-US-302
- **Priority:** Must
- **Acceptance:** C002-AC-325.1

### C002-REQ-326 — Hook commands without a plugin-root token
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE Copilot target package's hook commands SHALL contain neither `${PLUGIN_ROOT}` nor `${CLAUDE_PLUGIN_ROOT}`.
- **Rationale:** VS Code does not expand `${PLUGIN_ROOT}` in hook commands on Windows; a hook whose command holds it errors before the script runs, and every tool call of the session is denied (`docs/spikes/S-08-copilot-vscode.md §3`, fact F-3); Copilot CLI does expand it (§2.3), so a package valid for both hosts cannot use it; the hook process has the `PLUGIN_ROOT` environment variable on both hosts (§2.3, §3); the command reaches the CLI copy (C002-REQ-301) through an absolute path that the Copilot install command writes or through a program that reads `PLUGIN_ROOT` from its environment, as C002-IF-008 §4 fixes
- **Stories:** C002-US-305, C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-326.1

### C002-REQ-327 — Write and terminal calls of non-Architect subagents denied
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF a non-Architect subagent calls a tool of the class `write` or `terminal` of the tool classes file in a repository with `.sdd/` (the call's working folder or a folder above it holds `.sdd/`), THEN THE Copilot subagent guard hook SHALL deny the call with a deny decision on standard output and a non-zero exit code.
- **Rationale:** the local agent host offered its host built-in agents (`explore`, `task`, `general-purpose`, `rubber-duck`, `code-review`, `research`, `security-review`) to a parent whose `agents` list named two other agents (`docs/spikes/S-08-copilot-vscode.md §3`), and an agent without a `tools` list of the package runs with the host's tools (§3.2), so neither the conductor's grant (C002-REQ-107) nor the tool lists (C002-REQ-306) keep an instruction planted in an artifact from delegating an edit or a command to such an agent (C002-NFR-203); on Claude Code the conductor can start only the nine specialists (C001-REQ-217, C001-REQ-218), so without this guard the bar of C002-DEC-005 does not hold in either Copilot mode; plugin-level PreToolUse hooks run for subagent tool calls and carry `agent_type` in Copilot CLI and in VS Code (§2.3, §3.1); P-01 chose a plugin-level deny hook in both enforcement modes, limited to repositories that contain `.sdd/` (Q-safety-06, `../../questions-log.md` round 6); the hook is plugin- and workspace-level: the Copilot install command writes the same PreToolUse entry into the package's `hooks.json` and into `.github/hooks/architect-guard.json` beside the workspace agents, so the guard is loaded wherever the agents are, also where the plugin part is not loaded (critic CR-38; C002-IF-005 §3, C002-IF-008 §2; the assumption on workspace hook files: C002-IF-005 §3); an `agent_type` that is present but is not the name of an Architect agent, a non-string value included, names no Architect agent (name forms `sdd-critic` in VS Code and `architect:sdd-critic` on Copilot CLI: C002-IF-008 §2); the session agent's calls carry no `agent_type` and are outside this guard, and the conductor holds no generic edit or terminal tool (C002-REQ-306, C002-REQ-321); deny output and exit code as C002-REQ-309, because Copilot CLI reports exit code 2 as code 1 and fails closed (§2.2, fact F-6); cost accepted by P-01: in such a repository the adopter's own subagents cannot edit files or run commands, which the install notes state (C002-REQ-304)
- **Stories:** C002-US-307
- **Priority:** Must
- **Acceptance:** C002-AC-327.1
- **Open items:** [ASSUMPTION: S-08 — the record shows `agent_type` on the PreToolUse input of workspace agents started as subagents in VS Code (§3.1) and of plugin agents started as subagents in Copilot CLI (§2.3), not of a host built-in agent; the manual VS Code checklist and the Copilot CLI eval runner confirm that a host built-in agent's tool calls carry it; if they carry none, Q-safety-06 returns to P-01]

### C002-REQ-328 — Copilot subagent guard hook denies on its own faults
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF the Copilot subagent guard hook cannot reach a decision on a call (unreadable hook input; for a call of a non-Architect subagent in a repository that contains `.sdd/`, a tool name that the tool classes file does not class or an unreadable tool classes file; or an internal error), THEN THE Copilot subagent guard hook SHALL deny the call with a deny decision on standard output and a non-zero exit code.
- **Rationale:** fail closed (C002-DEC-005, C002-CON-08), as C002-REQ-309 and C002-NFR-204 require of the Copilot guard hook; a host built-in agent holds tools that no Architect agent holds, such as the PowerShell, `create` and `edit` tools (`docs/spikes/S-08-copilot-vscode.md §3.2`), and the hook name of the `edit` tool is not in the record (C002-REQ-308 open item), so a tool that the file does not class is denied rather than allowed; the resulting cost, a non-Architect subagent in a repository with `.sdd/` calls only tools of the class `read_only` (C002-REQ-329), is stated in the install notes (C002-REQ-304); a hook that errors denies every call of the session (§3), which the CLI copy, the shell-free hook commands and the absence of a root token guard against (C002-REQ-301, C002-REQ-316, C002-REQ-326)
- **Stories:** C002-US-307
- **Priority:** Must
- **Acceptance:** C002-AC-328.1

### C002-REQ-329 — Read-only calls and calls outside Architect repositories pass
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the Copilot subagent guard hook receives readable hook input of a non-Architect subagent's call in a repository without `.sdd/`, or of its call to a tool of the class `read_only` of the tool classes file, THE Copilot subagent guard hook SHALL allow the call with exit code 0.
- **Rationale:** the guard is limited to repositories that contain `.sdd/` (Q-safety-06), and a plugin-level hook runs for every tool call in every repository that the adopter opens while the plugin is enabled (`docs/spikes/S-08-copilot-vscode.md §2.2`, §3); read and search tools stay available to every subagent, as to the Architect agents (C002-REQ-319)
- **Stories:** C002-US-307
- **Priority:** Must
- **Acceptance:** C002-AC-329.1

### C002-REQ-330 — Session agent and Architect agent calls pass under server enforcement
- **Delta:** ADDED
- **Pattern:** complex
- **Statement:** WHERE the Copilot target uses sdd MCP server enforcement, WHEN the Copilot subagent guard hook receives readable hook input whose `agent_type` is absent or names an Architect agent, THE Copilot subagent guard hook SHALL allow the call with exit code 0.
- **Rationale:** in this mode the Architect agents are confined by their tool lists (C002-REQ-306; `docs/spikes/S-08-copilot-vscode.md §2.1`, §3.1) and the session agent's calls carry no `agent_type` (§2.3, §3), so deciding these calls would add no protection and would act on P-03's own chats (C002-REQ-302); under the Copilot hooks fallback these calls are decided by the Copilot guard hook (C002-REQ-308, C002-REQ-319, C002-REQ-320)
- **Stories:** C002-US-307
- **Priority:** Must
- **Acceptance:** C002-AC-330.1
