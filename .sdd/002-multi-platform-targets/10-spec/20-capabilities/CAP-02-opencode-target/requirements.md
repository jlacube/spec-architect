---
id: C002-CAP-02
artifact: spec/requirements
change: CHG-002
phase: 10-spec
status: draft
capability: "OpenCode target"
---
# C002-CAP-02 — Requirements

Brownfield change: every requirement carries a Delta. C002-REQ-211 to C002-REQ-213 change CHG-001
requirements that name AskUserQuestion; they apply to every host, including Copilot VS Code
(C002-US-304), and keep today's behaviour on Claude Code. Their LINT-DELTA-001 findings are expected
until CHG-001 is archived (C002-CON-05, C002-DEC-008). The enforcement mode of the OpenCode target is
fixed by spike S-07 (glossary: enforcement mode).

### C002-REQ-201 — OpenCode target package contents
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode target package SHALL contain the ten agents under `.opencode/agents/`, the commands under `.opencode/commands/`, the skills under `.opencode/skills/` and an `opencode.json` that declares the MCP servers of the source plugin.
- **Rationale:** ideation §8; C002-R-001 C-07, C-08, C-09; servers of the source plugin per C001-REQ-1108
- **Stories:** C002-US-201
- **Priority:** Must
- **Acceptance:** C002-AC-201.1
- **Open items:** Serena's context on OpenCode is fixed by spike S-07 (baseline survey §4 note 6; C002-IF-001 §6.2); its data folder and read-only launch: C002-REQ-114.

### C002-REQ-202 — Conductor as the primary agent
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode target package SHALL declare the conductor as a primary agent and the nine specialists as subagents.
- **Rationale:** C001-REQ-201 (conductor as main session) carried to OpenCode agent modes (C002-R-001 C-08)
- **Stories:** C002-US-201
- **Priority:** Must
- **Acceptance:** C002-AC-202.1

### C002-REQ-203 — Commands run in the conductor
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode target package SHALL bind every command to the conductor agent.
- **Rationale:** the `claude --agent` guard line of the 13 commands (baseline survey §1.3, E-8) becomes the command's `agent` field (C002-R-001 C-08)
- **Stories:** C002-US-201
- **Priority:** Must
- **Acceptance:** C002-AC-203.1

### C002-REQ-204 — Install notes in the OpenCode package
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode target package SHALL contain install notes that state the prerequisites (Node.js 20 or later, OpenCode at its tested version, access to the Claude models of C002-REQ-105), the installation of `architect-sdd`, the placement of the package files and the start of the conductor.
- **Rationale:** today's `INSTALL.md` is Claude-only (current-state E-1); C002-SC-01
- **Stories:** C002-US-201
- **Priority:** Must
- **Acceptance:** C002-AC-204.1

### C002-REQ-205 — README section for OpenCode
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE README SHALL contain an OpenCode section that links the install notes of the OpenCode target package and names the enforcement mode of that package.
- **Rationale:** ideation §5 (per-target README sections); the sections of C001-REQ-1115 stay as they are
- **Stories:** C002-US-201
- **Priority:** Must
- **Acceptance:** C002-AC-205.1

### C002-REQ-206 — Edits confined to `.sdd/` by OpenCode permissions
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the OpenCode target uses native permission enforcement, THE OpenCode target package SHALL give each Architect agent `edit` permission rules that allow only paths inside `.sdd/` and deny every other path.
- **Rationale:** ideation §8 (Enforcement per target); C002-DEC-005; the boundary of C001-REQ-1103 and C001-REQ-1104 without the memory folder (C002-DEC-009); relies on C002-AS-02
- **Stories:** C002-US-202
- **Priority:** Must
- **Acceptance:** C002-AC-206.1
- **Open items:** the path string OpenCode matches `edit` rules against, and its handling of `..` segments and links, are open for spike S-07 (C002-R-001 C-02, C-03; ideation §11).

### C002-REQ-207 — Shell commands confined to the allowlist by OpenCode permissions
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the OpenCode target uses native permission enforcement, THE OpenCode target package SHALL give each Architect agent `bash` permission rules that allow only the commands of the allowlist in C001-IF-07 §3 and deny every other command.
- **Rationale:** the boundary of C001-REQ-1106 (as changed by C002-REQ-503, C002-REQ-517 and C002-REQ-521) and C001-REQ-1107; relies on C002-AS-01; the risks of ideation §9 (redirection inside an allowed command, a command that writes files, PowerShell on Windows) are corpus cases (C002-REQ-607)
- **Stories:** C002-US-202
- **Priority:** Must
- **Acceptance:** C002-AC-207.1

### C002-REQ-208 — The adopter's own agents keep their permissions
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode target package SHALL NOT set permission rules for agents other than the ten Architect agents.
- **Rationale:** C002-US-202 (P-03's own OpenCode agents keep their permissions); agent rules take precedence over global rules (C002-R-001 C-01)
- **Stories:** C002-US-202
- **Priority:** Must
- **Acceptance:** C002-AC-208.1

### C002-REQ-209 — Server fallback: no edit or shell permission
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the OpenCode target uses sdd MCP server enforcement, THE OpenCode target package SHALL deny the `edit` and `bash` permissions to every Architect agent.
- **Rationale:** C002-DEC-001 (Consequences: OpenCode switches to the server if spike S-07 shows its matcher cannot be made safe); C002-AS-02 wrong; not a `tool.execute.before` plugin, whose input has no agent identity (C002-R-001 C-06)
- **Stories:** C002-US-203
- **Priority:** Must
- **Acceptance:** C002-AC-209.1

### C002-REQ-210 — Server fallback: two server profiles declared
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the OpenCode target uses sdd MCP server enforcement, THE OpenCode target package SHALL declare in `opencode.json` two local MCP servers that run the sdd MCP server of `architect-sdd`: `sdd-files` with the server profile of the write tools and `sdd-shell` with the server profile of the command tool.
- **Rationale:** C002-US-203; the server of C002-CAP-04; two server profiles so that the write tools and the command tool are granted apart (C002-IF-002 §2, C002-REQ-415), and an agent without Bash never gets the command tool (C002-REQ-117, least privilege per C002-REQ-108); contract C002-IF-005 §2
- **Stories:** C002-US-203
- **Priority:** Must
- **Acceptance:** C002-AC-210.1

### C002-REQ-211 — Round size on the host's question tool
- **Delta:** MODIFIED C001-REQ-205
- **Pattern:** event-driven
- **Statement:** WHEN the conductor asks P-01 for input, THE conductor SHALL use the question tool of its host (AskUserQuestion on Claude Code, `question` on OpenCode, `ask_user` on Copilot VS Code) with at most four questions per call.
- **Rationale:** C002-GOAL-03; ideation §8 (Interviews and gates); `ask_user` is the question tool of the local agent host that spike S-08 tested, not `vscode/askQuestions` (`docs/spikes/S-08-copilot-vscode.md §3.2`, fact F-5); no host documents a limit, so the four-question round stays Architect's own rule (C002-R-001 C-05, A-06, Implications); every round counts, the archive confirmation of `commands/archive.md:15` included (current-state E-28; tool name in bodies: C002-REQ-118); unchanged on Claude Code
- **Stories:** C002-US-204, C002-US-304
- **Priority:** Must
- **Acceptance:** C002-AC-211.1
- **Evidence:** current-state E-26 — `plugins/architect/skills/interview-protocol/SKILL.md:119` › `Claude Code wiring` (one AskUserQuestion call, 1–4 questions; layer: grep); current-state E-24 — `plugins/architect/agents/sdd-conductor.md:7` › `tools` (AskUserQuestion granted to the conductor; layer: grep); baseline survey E-1 and E-6 (same files, counts)

### C002-REQ-212 — Gate question on the host's question tool
- **Delta:** MODIFIED C001-REQ-802
- **Pattern:** event-driven
- **Statement:** WHEN the conductor presents a gate, THE conductor SHALL show the gate summary and a plain-language statement of what approval commits to, and ask P-01 through the question tool of its host to choose among Approve, Approve with waivers, Revise and Stop.
- **Rationale:** C002-GOAL-03 (gates with P-01's verbatim words on every target); unchanged on Claude Code
- **Stories:** C002-US-204, C002-US-304
- **Priority:** Must
- **Acceptance:** C002-AC-212.1
- **Evidence:** current-state E-27 — `plugins/architect/skills/gate-protocol/SKILL.md:87` › `Claude Code wiring` (gate question with the four choices; layer: grep); current-state E-25 — `plugins/architect/agents/sdd-conductor.md:61` › `Hard rules` (approval only after the AskUserQuestion answer; layer: grep)

### C002-REQ-213 — Profile confirmation on the host's question tool
- **Delta:** MODIFIED C001-REQ-116
- **Pattern:** event-driven
- **Statement:** WHEN the new-change command runs (`/architect:new` on Claude Code), THE conductor SHALL propose a profile (`lite` or `full`) with its size estimate (expected user stories, requirements and touched modules, compared with the constitution's profile thresholds) and obtain P-01's confirmation through the question tool of its host before creating the change.
- **Rationale:** C002-GOAL-03; unchanged on Claude Code
- **Stories:** C002-US-204, C002-US-304
- **Priority:** Must
- **Acceptance:** C002-AC-213.1
- **Evidence:** current-state E-28 — `plugins/architect/commands/new.md:14` › `step 3` (one profile round, recommended profile first, no change folder before the answer; layer: grep); current-state E-24 — `plugins/architect/agents/sdd-conductor.md:7` › `tools` (AskUserQuestion; layer: grep)

### C002-REQ-214 — Question shape on OpenCode
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the conductor asks a question through OpenCode's `question` tool, THE conductor SHALL give the question a header of at most 30 characters and every option a description.
- **Rationale:** C002-R-001 C-05 (30-character header; option description required)
- **Stories:** C002-US-204
- **Priority:** Must
- **Acceptance:** C002-AC-214.1

### C002-REQ-215 — Quick-lint feedback after writes on OpenCode
- **Delta:** ADDED
- **Pattern:** complex
- **Statement:** WHERE the OpenCode target uses native permission enforcement with a post-write feedback channel, WHEN an Architect agent writes a file under `.sdd/`, THE OpenCode target package SHALL return the quick-lint findings for that file to that agent.
- **Rationale:** ideation §5 (hook table: in if spike S-07 finds a feedback channel); C001-IF-07 §2 (PostToolUse) and §4 (format); under sdd MCP server enforcement C002-REQ-408 applies instead
- **Stories:** C002-US-205
- **Priority:** Should
- **Acceptance:** C002-AC-215.1

### C002-REQ-216 — OpenCode command names
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode target package SHALL name each command `architect-<name>`, where `<name>` is the file name of the source command without its extension.
- **Rationale:** OpenCode has built-in `/new` and `/init` commands, with which the source commands `new` and `init` would collide (C002-IF-001 §2, row `/architect:<name>`); the prefix keeps the `architect` namespace of the Claude Code names `/architect:<name>`; references in bodies follow the same mapping (C002-REQ-103); placement `.opencode/commands/architect-<command>.md` (C002-IF-005 §2; command files: C002-R-001 C-08)
- **Stories:** C002-US-201
- **Priority:** Must
- **Acceptance:** C002-AC-216.1
