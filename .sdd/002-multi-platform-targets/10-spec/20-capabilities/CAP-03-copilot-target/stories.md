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

### C002-US-301 — Install Architect in VS Code with Copilot and reach gate G1
- **As a** P-03 adopter on Copilot VS Code
- **I want** a Copilot-format target package (custom agents, prompt files, skills and an MCP configuration), with install notes in the package and a README section
- **So that** I can start the conductor in Copilot Chat and take a change through ideation to gate G1
- **Value / outcome:** C002-SC-02; C002-GOAL-01, C002-GOAL-03
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-03
- **Context & notes:** Agents are `*.agent.md` files with `tools` and `agents` lists; commands become prompt files; skills keep the Agent Skills format (ideation §8; C002-R-001 A-10, A-11). VS Code needs `chat.plugins.enabled` and registers local plugins through `chat.pluginLocations` (C002-R-001 A-08); the install notes name every setting the package needs. `${CLAUDE_PLUGIN_ROOT}` is expanded in hook and MCP fields but must be treated as not expanded in agent, prompt and skill bodies (C002-R-001 A-09). The package must not carry the Claude Code `hooks/hooks.json` unchanged: VS Code ignores its matchers and its guards would see no agent identity (C002-R-001 A-03, A-04, Implications). Only the conductor may start other agents (`agents` list). The package carries its own copy of the sdd CLI for its hook commands, because a hook command that is not found blocks nothing (C002-R-001 A-03). Prompt file names follow the source command names, as spike S-08 confirms.
- **Requirements:** C002-REQ-301, C002-REQ-302, C002-REQ-303, C002-REQ-304, C002-REQ-305, C002-REQ-317
- **Traces to:** ideation §5, §8; C002-DEC-004, C002-DEC-006

### C002-US-302 — Write/shell boundary through the sdd MCP server
- **As a** P-01 spec owner
- **I want** the generated Copilot agents to have no generic edit or terminal tool, and to write `.sdd/` files and run allowlisted commands only through the sdd MCP server
- **So that** the boundary holds in VS Code although Copilot hook input does not say which agent is calling
- **Value / outcome:** C002-GOAL-02; C002-SC-03
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-03
- **Context & notes:** C002-DEC-001 (C002-OA-001, option B: fails closed). Relies on C002-AS-03 (subagents confined to their tool list), which spike S-08 checks. Read and search tools stay available to the agents; MCP tools are granted as `<server>/*` or by name (C002-R-001 A-11). The server's tools are designed for the agents' actual write operations, because agents without generic Edit and Bash may work less well (ideation §9). Whether VS Code asks P-01 to approve each sdd MCP server call, and whether the package can pre-approve its own server, is open for spike S-08 (ideation §11).
- **Requirements:** C002-REQ-302, C002-REQ-306, C002-REQ-307, C002-REQ-604, C002-REQ-117
- **Traces to:** C002-DEC-001; Q-guards-01; ideation §8 (Enforcement per target)

### C002-US-303 — Visible agent-scoped hooks fallback
- **As a** P-01 spec owner
- **I want**, if spike S-08 shows that Copilot subagents are not confined to their tool list, each generated Copilot agent to carry agent-scoped PreToolUse hooks that run the guard cores, and the exception to be visible: a README warning, a doctor line that reports hooks disabled, and an entry in the manual VS Code checklist
- **So that** Copilot still ships with an enforced boundary while hooks are on, and nobody mistakes a disabled-hooks setup for a protected one
- **Value / outcome:** C002-GOAL-02
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-03
- **Context & notes:** Conditional on spike S-08 (C002-AS-03 wrong). C002-DEC-005 exception: with hooks enabled, the guard corpora still pass 100% and the injection evals show 0 instructions acted upon; the boundary is off whenever hooks are disabled (`chat.useHooks`, Workspace Trust, organisation policy). The doctor reads the VS Code settings instead of relying on a hook, which could not report its own absence (C002-DEC-005, Consequences); how it detects each disabling source is an open research item for spike S-08 (ideation §11). A guard script must deny on its own internal errors, because a hook exit code other than 2 does not block (C002-R-001 A-03). The hook `tool_name` values for the VS Code edit and terminal tools are not documented and are captured by spike S-08 (C002-R-001 A-05). VS Code ignores hook matchers (C002-R-001 A-04), so the guard hooks see every tool call of their agent and need the read tools listed too. If agent-scoped hooks do not block a subagent's tool calls either, the Copilot target is deferred (C002-US-606).
- **Requirements:** C002-REQ-308, C002-REQ-309, C002-REQ-310, C002-REQ-316, C002-REQ-318, C002-REQ-319, C002-REQ-510, C002-REQ-616, C002-REQ-622, C002-REQ-628, C002-REQ-629
- **Traces to:** C002-DEC-001 (Fallback), C002-DEC-005; Q-guards-02, Q-guards-03

### C002-US-304 — Interviews and gates through `vscode/askQuestions`
- **As a** P-01 spec owner
- **I want** the conductor in VS Code to run interview rounds and gates through `vscode/askQuestions`, with the same round rules as on Claude Code, and a skipped answer never to count as an approval or an answer
- **So that** gates in VS Code record my own words, as on Claude Code
- **Value / outcome:** C002-GOAL-03; C002-SC-02
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-03
- **Context & notes:** The tool is Experimental, behind `chat.askQuestions.enabled` (C002-R-001 A-06). Shape: `questions` with `header`, `question`, optional `multiSelect`, `options` with `recommended`, and `allowFreeformInput`; no documented limit, so Architect's round rules apply unchanged. With auto-approve enabled the tool may return `{"skipped": true}` without showing anything (C002-R-001 A-07): the conductor treats it as no answer. Interviews and gates stay in the conductor as the primary agent (C001-CON-04). What the conductor does when the tool is unavailable is settled in C002-REQ-312.
- **Requirements:** C002-REQ-211, C002-REQ-212, C002-REQ-213, C002-REQ-311, C002-REQ-312
- **Traces to:** ideation §8 (Interviews and gates); C002-R-001 A-06, A-07

### C002-US-305 — Session-start brief and SubagentStop trace in VS Code
- **As a** P-01 spec owner
- **I want** the Copilot target to give the conductor the session-start status brief through Copilot's `SessionStart` hook, and to refresh the trace through `SubagentStop` after an author agent finishes
- **So that** orientation and traceability work in VS Code as they do on Claude Code
- **Value / outcome:** C002-GOAL-03
- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-03
- **Context & notes:** Ideation §5 hook table marks both "in" for Copilot VS Code. `SubagentStop` input carries `agent_type`, so the hook can select the author agents (C002-R-001 A-03). These hooks do not guard anything: with hooks disabled, the brief and the automatic trace are absent, and the trace is left to the auditor at gates, as on OpenCode (ideation §5). Hook commands may use `${CLAUDE_PLUGIN_ROOT}`, which VS Code expands in hook commands (C002-R-001 A-09).
- **Requirements:** C002-REQ-313, C002-REQ-314, C002-REQ-315, C002-REQ-316
- **Traces to:** ideation §5 (Hooks per target)
