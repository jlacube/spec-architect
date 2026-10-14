---
id: C002-CAP-02
artifact: spec/stories
change: CHG-002
phase: 10-spec
status: draft
capability: "OpenCode target"
id_block: { US: 201-299, REQ: 201-299, TS: 201-299 }
---
# C002-CAP-02 — OpenCode target: user stories

### C002-US-201 — Install Architect on OpenCode and reach gate G1
- **As a** P-03 adopter on OpenCode
- **I want** an OpenCode target package (agents, commands, skills and an `opencode.json` with per-agent permissions and MCP servers), with install notes in the package and a README section
- **So that** I can start the conductor in OpenCode and take a change through ideation to gate G1
- **Value / outcome:** C002-SC-01; C002-GOAL-01, C002-GOAL-03
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-02
- **Context & notes:** Agents go to `.opencode/agents/`, commands to `.opencode/commands/`, skills to `.opencode/skills/` (ideation §8; C002-R-001 C-07, C-08). The conductor is the primary agent; the nine specialists are subagents that only the conductor starts (OpenCode `permission.task`, C002-R-001 C-08). OpenCode commands keep `$ARGUMENTS` and are named `architect-<name>`, clear of OpenCode's built-in `/new` and `/init` (C002-IF-001 §2). The MCP servers of the source plugin (Context7, DeepWiki, Serena) are declared in `opencode.json` and their tools are named `<server>_<tool>` (C002-R-001 C-09); Serena's context on OpenCode is an open research item (baseline survey §4 note 6). Agents call the CLI as a bare `sdd` command from `architect-sdd` (C002-US-501). The install notes replace today's Claude-only `INSTALL.md` for this package (current-state E-1).
- **Requirements:** C002-REQ-201, C002-REQ-202, C002-REQ-203, C002-REQ-204, C002-REQ-205, C002-REQ-216
- **Traces to:** ideation §5, §8; C002-DEC-004, C002-DEC-006, C002-DEC-007

### C002-US-202 — Write/shell boundary through OpenCode permissions
- **As a** P-01 spec owner
- **I want** each generated OpenCode agent to carry a permission block that allows edits only under `.sdd/` and shell commands only from the allowlist of C001-IF-07 §3, and denies everything else
- **So that** Architect agents cannot touch product code on OpenCode, while my own OpenCode agents keep their permissions
- **Value / outcome:** C002-GOAL-02; C002-SC-03
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-02
- **Context & notes:** OpenCode's own permission engine is the enforcement mechanism here, not the guard cores (ideation §8), so it must decide every case of the guard corpora as expected (C002-AS-01, C002-AS-02; corpus replay in C002-US-602). Known risks (ideation §9): `edit` patterns matched against a path string that keeps `..` or links (C002-R-001 C-03), redirection inside an allowed command such as `sdd status > file` (C-04), and PowerShell on Windows, whose commands the bash parser does not split. Agent rules take precedence over the user's global rules (C002-R-001 C-01). No memory folder (C002-NG-04).
- **Requirements:** C002-REQ-206, C002-REQ-207, C002-REQ-208
- **Traces to:** ideation §8 (Enforcement per target), §9; C002-DEC-005

### C002-US-203 — sdd MCP server as the OpenCode fallback
- **As a** P-01 spec owner
- **I want** the OpenCode target to give its agents no edit or shell tool and route their `.sdd/` writes and allowlisted commands through the sdd MCP server, if spike S-07 shows that OpenCode's permission engine misdecides a corpus case
- **So that** OpenCode still ships at the Claude Code safety bar when its native permissions cannot hold it
- **Value / outcome:** C002-GOAL-02
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-02
- **Context & notes:** Conditional on the outcome of spike S-07 (C002-AS-02 wrong). The server is the one of C002-CAP-04. The fallback is the server and not an OpenCode plugin on `tool.execute.before`, because that hook carries no agent identity (ideation §9; C002-R-001 C-06). With the fallback, the post-write quick lint comes with each write (C002-US-403).
- **Requirements:** C002-REQ-209, C002-REQ-210, C002-REQ-117
- **Traces to:** ideation §8, §9; C002-DEC-001 (Consequences)

### C002-US-204 — Interviews and gates through OpenCode's question tool
- **As a** P-01 spec owner
- **I want** the conductor on OpenCode to run interview rounds and gates through OpenCode's `question` tool, with the same round rules as on Claude Code and my answers recorded verbatim
- **So that** deciding and approving work the same way on OpenCode as on Claude Code
- **Value / outcome:** C002-GOAL-03; C002-SC-01
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-02
- **Context & notes:** Tool shape (C002-R-001 C-05): a `questions` array; `header` of at most 30 characters; each option needs a description; `multiple` and `custom` (free text). No documented limit on questions or options, so the four-question round and the two or three options remain Architect's own convention (C002-R-001 Implications). Interviews stay in the conductor (C001-CON-04). Whether `opencode run` or the SDK can answer a `question` call (for scripted gate evals) is open for spike S-07 (ideation §11).
- **Requirements:** C002-REQ-211, C002-REQ-212, C002-REQ-213, C002-REQ-214, C002-REQ-311
- **Traces to:** ideation §8 (Interviews and gates); C002-R-001 C-05

### C002-US-205 — Quick-lint feedback after writes on OpenCode
- **As a** P-01 spec owner
- **I want** an Architect agent's write to `.sdd/` on OpenCode to return the quick-lint findings for that file to the agent
- **So that** authors fix format errors at once, as with the PostToolUse hook on Claude Code
- **Value / outcome:** C002-GOAL-03
- **Priority:** Should · **Size hint:** S · **Capability:** C002-CAP-02
- **Context & notes:** In scope only if spike S-07 finds a feedback channel (`tool.execute.after`); otherwise later (ideation §5, hook table; `scope.md` §2). Under the MCP-server fallback the findings come with each write instead (C002-US-403), and this story does not apply.
- **Out of scope:** the session-start brief and the SubagentStop trace on OpenCode (later; the auditor runs the trace at gates).
- **Requirements:** C002-REQ-215
- **Traces to:** ideation §5 (Hooks per target)
