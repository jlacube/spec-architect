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
fixed by spike S-08 (glossary: enforcement mode); if neither mode holds, the target is refused by
C002-REQ-620 and P-01 revises this spec to remove this capability (`../../10-context/scope.md` §1.1,
Q-defer-01).

### C002-REQ-301 — Copilot target package contents
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE Copilot target package SHALL contain the ten agents as `*.agent.md` files, the commands as prompt files, the skills in the Agent Skills format, an MCP configuration that declares the MCP servers of the source plugin, and a copy of the sdd CLI that its hook commands run.
- **Rationale:** ideation §8; C002-R-001 A-08, A-10, A-11; servers of the source plugin per C001-REQ-1108; the hook commands run the CLI copy inside the package, not a PATH `sdd`, because a hook command that is not found exits with a code other than 2 and blocks nothing (C002-R-001 A-03; C002-NFR-204; C002-CON-14; architecture §6.2); the copy is the plugin's bundled `scripts/sdd.mjs` of the same packaging run (C002-IF-005 §3, C002-IF-008 §4)
- **Stories:** C002-US-301
- **Priority:** Must
- **Acceptance:** C002-AC-301.1
- **Open items:** Serena's context on Copilot VS Code is fixed by spike S-08 (baseline survey §4 note 6; C002-IF-001 §6.2); its data folder and read-only launch: C002-REQ-114.

### C002-REQ-302 — No plugin-level guard hook
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE Copilot target package SHALL declare no PreToolUse hook outside the frontmatter of an agent.
- **Rationale:** VS Code ignores the matchers of Claude-format hooks and its tool-event hook input names no agent, so a plugin-level guard would act on every chat, the adopter's own included (C002-R-001 A-03, A-04, Implications)
- **Stories:** C002-US-301, C002-US-302
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
- **Statement:** THE Copilot target package SHALL contain install notes that state the prerequisites (Node.js 20 or later, VS Code and GitHub Copilot Chat at their tested versions, access to the Claude models of C002-REQ-105), the installation of `architect-sdd`, the VS Code settings the package needs (`chat.plugins.enabled`, `chat.pluginLocations`, `chat.askQuestions.enabled`) and the start of the conductor.
- **Rationale:** C002-R-001 A-06, A-08; C002-SC-02
- **Stories:** C002-US-301
- **Priority:** Must
- **Acceptance:** C002-AC-304.1

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
- **Rationale:** C002-DEC-001 (C002-OA-001 option B: fails closed; the conductor is included, and prompt-file `tools` take precedence over the agent's); relies on C002-AS-03
- **Stories:** C002-US-302
- **Priority:** Must
- **Acceptance:** C002-AC-306.1

### C002-REQ-307 — Server mode: two server profiles declared
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the Copilot target uses sdd MCP server enforcement, THE Copilot target package SHALL declare in its MCP configuration two local MCP servers that run the sdd MCP server of `architect-sdd`: `sdd-files` with the server profile of the write tools and `sdd-shell` with the server profile of the command tool.
- **Rationale:** C002-DEC-001; C002-US-302 (read and search tools stay); Copilot grants MCP tools per server (`<server>/*`, C002-OA-001; C002-R-001 A-11), so the two profiles keep the command tool from agents without Bash (C002-REQ-117, C002-REQ-415; least privilege per C002-REQ-108); contract C002-IF-005 §3
- **Stories:** C002-US-302
- **Priority:** Must
- **Acceptance:** C002-AC-307.1
- **Open items:** whether VS Code asks P-01 to approve each server call or lets the package pre-approve its own servers is open for spike S-08 (ideation §11). Per-tool grants are not needed with two server profiles (architecture §6.2).

### C002-REQ-308 — Hooks fallback: agent-scoped guard hooks
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the Copilot hooks fallback is used, THE Copilot target package SHALL give every Architect agent agent-scoped PreToolUse hooks that run the path guard core on each tool call that can write a file and the bash guard core on each terminal tool call.
- **Rationale:** C002-DEC-001 (Fallback), C002-DEC-005 (exception); C002-R-001 A-01, A-02
- **Stories:** C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-308.1
- **Open items:** the hook `tool_name` values of the VS Code edit and terminal tools are captured by spike S-08 (C002-R-001 A-05).

### C002-REQ-309 — Guard hooks deny on their own faults
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF an agent-scoped guard hook cannot reach a decision (unreadable input, a tool name that the tool classes file does not class, an unreadable tool classes file or an internal error), THEN THE agent-scoped guard hook SHALL deny the call with exit code 2.
- **Rationale:** in VS Code a hook exit code other than 2 does not block (C002-R-001 A-03); fail closed (C002-DEC-005); rule `GUARD-HOOK-001` (C002-IF-008 §2); tool classes file: C002-REQ-318
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
- **Rationale:** C002-R-001 A-07 (`{"skipped": true}` under auto-approve); P-01's authority (`../../10-context/stakeholders-and-personas.md`, P-01)
- **Stories:** C002-US-304, C002-US-204
- **Priority:** Must
- **Acceptance:** C002-AC-311.1

### C002-REQ-312 — Question tool unavailable in VS Code
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF `vscode/askQuestions` is not available to the conductor in VS Code, THEN THE conductor SHALL ask no question and reply with the instruction to enable the setting `chat.askQuestions.enabled`.
- **Rationale:** the tool is Experimental, behind `chat.askQuestions.enabled` (C002-R-001 A-06); interviews and gates rely on its structured answers (C002-REQ-211, C002-REQ-212); a plain-chat fallback would add a second answer path to verify; settled here as C002-US-304 asks
- **Stories:** C002-US-304
- **Priority:** Must
- **Acceptance:** C002-AC-312.1

### C002-REQ-313 — Session-start brief in VS Code
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN a Copilot chat session starts in a repository that contains `.sdd/`, THE Copilot target package's session-start hook SHALL emit the status brief of C001-IF-07 §4.
- **Rationale:** ideation §5 (hook table: in for Copilot VS Code); C001-REQ-911 on Claude Code
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
- **Rationale:** SubagentStop input carries `agent_type` (C002-R-001 A-03); C001-IF-07 §2 (SubagentStop row: always exit 0)
- **Stories:** C002-US-305
- **Priority:** Must
- **Acceptance:** C002-AC-315.1
- **Open items:** the `agent_type` values VS Code reports for the generated agents are captured by spike S-08.

### C002-REQ-316 — Hook commands without shell syntax
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE Copilot target package's hook commands SHALL invoke the sdd CLI with arguments only, without shell-specific operators or syntax.
- **Rationale:** C001-REQ-1121 on Claude Code (PowerShell and Git Bash, C001-CON-06); VS Code expands `${CLAUDE_PLUGIN_ROOT}` in hook commands (C002-R-001 A-09)
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
- **Open items:** [ASSUMPTION: S-08 — spike S-08 confirms these names; if a source command name collides with a VS Code built-in slash command, every prompt file takes the prefix architect- as on OpenCode (C002-REQ-216, C002-IF-001 §2)]

### C002-REQ-318 — Tool classes under the hooks fallback
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the Copilot hooks fallback is used, THE Copilot target package SHALL contain a tool classes file that assigns every tool granted to an Architect agent or a prompt file to one of the classes `write`, `terminal` and `read_only` of C002-IF-008 §2.
- **Rationale:** VS Code ignores hook matchers, so an agent-scoped guard hook runs for every tool call of its agent, reads included (C002-R-001 A-04); a tool the file does not class is denied (C002-REQ-309), so a read tool missing from the file would block the agent; tool names come from spike S-08 (C002-R-001 A-05); file `hooks/tool-classes.json` (C002-IF-005 §3)
- **Stories:** C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-318.1

### C002-REQ-319 — Read-only tool calls pass the guard hook
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN an agent-scoped guard hook receives a call of a tool in the class `read_only` of the tool classes file, THE agent-scoped guard hook SHALL allow the call with exit code 0.
- **Rationale:** every tool call of the agent reaches its hooks (C002-REQ-318); read and search tools stay available inside the boundary (C002-US-302, C002-US-303); class `read_only` of C002-IF-008 §2
- **Stories:** C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-319.1
