---
id: C001-CAP-11
artifact: spec/requirements
capability: "Packaging, safety and environment"
change: CHG-001
phase: 10-spec
status: approved
delta_default: ADDED
---

# C001-CAP-11 — Requirements

All `Delta: ADDED`. Interfaces: plugin layout C001-IF-08, hooks and guard contract C001-IF-07,
agent definitions C001-IF-09, commands C001-IF-10.

### C001-REQ-1101 — Plugin layout
- **Pattern:** ubiquitous
- **Statement:** THE plugin SHALL follow the directory layout of C001-IF-08 §1, including `.claude-plugin/plugin.json`, `agents/`, `skills/`, `commands/`, `hooks/hooks.json`, `.mcp.json`, `scripts/sdd.mjs`, `templates/`, `LICENSE`, `README.md` and `THIRD_PARTY_NOTICES.md`.
- **Rationale:** OA-02 option C; C001-CON-03
- **Stories:** C001-US-1101
- **Priority:** Must
- **Acceptance:** C001-AC-1101.1

### C001-REQ-1102 — Local marketplace
- **Pattern:** ubiquitous
- **Statement:** THE repository SHALL contain a marketplace manifest at `.claude-plugin/marketplace.json` that lists the `architect` plugin by relative path, so that adding the repository as a marketplace and installing `architect` from it succeeds.
- **Rationale:** OQ-18 (local marketplace now, public later)
- **Stories:** C001-US-1101
- **Priority:** Must
- **Acceptance:** C001-AC-1102.1

### C001-REQ-1103 — Path guard
- **Pattern:** event-driven
- **Statement:** WHEN an Architect agent requests Write, Edit or NotebookEdit on a path outside both the `.sdd/` folder of the current repository and that agent's own memory folder `.claude/agent-memory/architect-<agent>/`, THE path guard SHALL deny the call (exit code 2) with a message naming the path and the rule `GUARD-PATH-001`.
- **Rationale:** C001-CON-01; D-02; agent memory of C001-IF-09 (`memory: project`), which Claude Code saves with Write in the repository (defect D-007)
- **Stories:** C001-US-1102
- **Priority:** Must
- **Acceptance:** C001-AC-1103.1, C001-AC-1103.2

### C001-REQ-1104 — Path normalisation in the guard
- **Pattern:** unwanted-behaviour
- **Statement:** IF a write target resolves outside `.sdd/` after normalising `..` segments, case (on Windows), drive letters and symbolic links, THEN THE path guard SHALL deny the call even when the unnormalised path starts with `.sdd/`.
- **Rationale:** abuse resistance (path traversal)
- **Stories:** C001-US-1102
- **Priority:** Must
- **Acceptance:** C001-AC-1104.1

### C001-REQ-1106 — Bash allowlist
- **Pattern:** event-driven
- **Statement:** WHEN an Architect agent requests a Bash or PowerShell command, THE bash guard SHALL allow it only if it matches an entry of the allowlist in C001-IF-07 §3, and deny it otherwise with rule `GUARD-BASH-001`.
- **Rationale:** IDEA-§17.2
- **Stories:** C001-US-1103
- **Priority:** Must
- **Acceptance:** C001-AC-1106.1

### C001-REQ-1107 — Compound shell commands
- **Pattern:** unwanted-behaviour
- **Statement:** IF a shell command requested by an Architect agent contains output redirection, command substitution, or a chained or piped segment that is not itself allowlisted, THEN THE bash guard SHALL deny it with rule `GUARD-BASH-002`.
- **Rationale:** abuse resistance (bypass via chaining)
- **Stories:** C001-US-1103
- **Priority:** Must
- **Acceptance:** C001-AC-1107.1

### C001-REQ-1108 — MCP servers declared by the plugin
- **Pattern:** ubiquitous
- **Statement:** THE plugin's `.mcp.json` SHALL declare the servers `context7` (remote, `https://mcp.context7.com/mcp`), `deepwiki` (remote, `https://mcp.deepwiki.com/mcp`) and `serena` (local, launched as specified by C001-REQ-1006).
- **Rationale:** Q11, OQ-04, D-03
- **Stories:** C001-US-1104
- **Priority:** Must
- **Acceptance:** C001-AC-1108.1

### C001-REQ-1109 — Research MCP scoping
- **Pattern:** ubiquitous
- **Statement:** THE definitions of agents other than the researcher SHALL NOT grant tools whose names start with `mcp__plugin_architect_context7__` or `mcp__plugin_architect_deepwiki__`.
- **Rationale:** OQ-04 (researcher only); context cost
- **Stories:** C001-US-1104
- **Priority:** Must
- **Acceptance:** C001-AC-1109.1

### C001-REQ-1110 — Doctor report
- **Pattern:** event-driven
- **Statement:** WHEN `/architect:doctor` runs, THE conductor SHALL print a table with, for each of node, git, Claude Code, ripwire, Serena, ast-grep, Context7 and DeepWiki, its status (ok, missing, unreachable or error), version, fallback and, for non-ok tools, the install or fix command from C001-IF-10 §3.
- **Rationale:** C001-SC-09
- **Stories:** C001-US-1105
- **Priority:** Must
- **Acceptance:** C001-AC-1110.1

### C001-REQ-1111 — Doctor never fails on optional tools
- **Pattern:** unwanted-behaviour
- **Statement:** IF an optional tool is missing or a remote MCP server is unreachable, THEN THE conductor SHALL report it in the doctor table and complete the doctor run, reporting failure only when node is missing or older than version 20.
- **Rationale:** IDEA-P-10
- **Stories:** C001-US-1105
- **Priority:** Must
- **Acceptance:** C001-AC-1111.1

### C001-REQ-1112 — MIT license
- **Pattern:** ubiquitous
- **Statement:** THE repository SHALL contain a `LICENSE` file with the MIT license text, the year 2026 and the copyright holder's name.
- **Rationale:** Spec-Q2
- **Stories:** C001-US-1106
- **Priority:** Must
- **Acceptance:** C001-AC-1112.1

### C001-REQ-1113 — Third-party notices
- **Pattern:** ubiquitous
- **Statement:** THE repository SHALL contain `THIRD_PARTY_NOTICES.md` listing every package bundled into `scripts/sdd.mjs` with its version and license.
- **Rationale:** license compliance of bundled dependencies (OA-12 option B)
- **Stories:** C001-US-1106
- **Priority:** Must
- **Acceptance:** C001-AC-1113.1

### C001-REQ-1114 — Permissive dependencies only
- **Pattern:** unwanted-behaviour
- **Statement:** IF a package bundled into `scripts/sdd.mjs` has a license outside the allowlist MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0 and 0BSD, THEN THE build SHALL fail with a message naming the package and its license.
- **Rationale:** C001-CON-05
- **Stories:** C001-US-1106
- **Priority:** Must
- **Acceptance:** C001-AC-1114.1

### C001-REQ-1115 — README content
- **Pattern:** ubiquitous
- **Statement:** THE README SHALL contain the sections Prerequisites, Install (Windows 11), Optional tools, Quickstart, Commands, Agents, Workspace layout, Troubleshooting and License.
- **Rationale:** C001-SC-09
- **Stories:** C001-US-1106
- **Priority:** Must
- **Acceptance:** C001-AC-1115.1

### C001-REQ-1116 — Delegation eval suite
- **Pattern:** ubiquitous
- **Statement:** THE repository SHALL contain a `claude plugin eval` suite of at least 40 prompts with at least three prompts that must route to each of the ten agents and at least one prompt per agent that must not route to it.
- **Rationale:** C001-SC-05; IDEA-§14.4
- **Note:** The conductor is not meant to be spawned as a subagent (C001-IF-09 A0); it runs as the main session (C001-REQ-201). A prompt therefore counts as routed to the conductor when the last reply contains the literal `claude --agent architect:sdd-conductor` and no Architect subagent starts. A must-route prompt of the conductor fails otherwise; a must-not-route prompt of the conductor fails when the last reply contains that literal. The minimum of three must-route prompts and one must-not-route prompt per agent applies to the conductor unchanged (D-016; Q-conductor-route-01).
- **Stories:** C001-US-1107
- **Priority:** Must
- **Acceptance:** C001-AC-1116.1

### C001-REQ-1117 — Local check command
- **Pattern:** event-driven
- **Statement:** WHEN `npm run check` runs in the repository, THE build SHALL run `claude plugin validate`, the unit tests, the lint fixture suite and the plugin structure checks of C001-IF-08 §3, and exit non-zero if any of them fails.
- **Rationale:** IDEA-RK-12
- **Stories:** C001-US-1107
- **Priority:** Must
- **Acceptance:** C001-AC-1117.1

### C001-REQ-1118 — Portable skills and templates
- **Pattern:** unwanted-behaviour
- **Statement:** IF a skill body or template contains a Claude-Code-specific tool reference (`AskUserQuestion`, `Agent(`, `TodoWrite`, `mcp__`) outside a section titled "Claude Code wiring", THEN THE plugin structure check SHALL report error `PLG-PORT-001`.
- **Rationale:** Q1 portable core; IDEA-P-12
- **Stories:** C001-US-1107, C001-US-1109
- **Priority:** Should
- **Acceptance:** C001-AC-1118.1

### C001-REQ-1119 — Dormant cross-platform CI
- **Pattern:** ubiquitous
- **Statement:** THE repository SHALL contain GitHub Actions workflow files that run `npm run check` on `windows-latest`, `macos-latest` and `ubuntu-latest` and declare `workflow_dispatch` as their only trigger.
- **Rationale:** Spec-Q4; C001-NG-07
- **Stories:** C001-US-1108
- **Priority:** Should
- **Acceptance:** C001-AC-1119.1

### C001-REQ-1120 — No machine-specific paths
- **Pattern:** unwanted-behaviour
- **Statement:** IF a file of the plugin contains an absolute filesystem path (a Windows drive-letter path or a path starting with `/Users/` or `/home/`) outside documentation examples marked as such, THEN THE plugin structure check SHALL report error `PLG-PATH-001`.
- **Rationale:** C001-GOAL-08
- **Stories:** C001-US-1106
- **Priority:** Must
- **Acceptance:** C001-AC-1120.1

### C001-REQ-1121 — Shell-agnostic hook commands
- **Pattern:** ubiquitous
- **Statement:** THE commands in `hooks/hooks.json` SHALL invoke `node` with the script path `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs` and arguments only, without shell-specific operators or syntax.
- **Rationale:** Windows PowerShell and Git Bash compatibility (C001-CON-06)
- **Stories:** C001-US-1101
- **Priority:** Must
- **Acceptance:** C001-AC-1121.1

### C001-REQ-1122 — Duplicate procedure check
- **Pattern:** unwanted-behaviour
- **Statement:** IF a command body and an agent body share more than 10 consecutive identical non-blank lines, THEN THE plugin structure check SHALL report error `PLG-DUP-001`.
- **Rationale:** OA-01 (one procedure in phase skills); referenced by C001-TS-205
- **Stories:** C001-US-1107
- **Priority:** Should
- **Acceptance:** C001-AC-1122.1

### C001-REQ-1123 — Minimum Claude Code version
- **Pattern:** unwanted-behaviour
- **Statement:** IF the Claude Code version reported by `claude --version` is lower than 2.1.295, THEN THE conductor SHALL show Claude Code with status `error` and the update command from C001-IF-10 §3 in the doctor table.
- **Rationale:** C001-AS-09, C001-AS-10; spike S-04 (Claude Code 2.0.76 passes no agent identity to hooks and fails on current models); replaces the guard fallback (former C001-REQ-1105), which hook input cannot support
- **Stories:** C001-US-1105
- **Priority:** Must
- **Acceptance:** C001-AC-1123.1

### C001-REQ-1124 — Plugin files only through the CLI or skill bodies
- **Pattern:** unwanted-behaviour
- **Statement:** IF an agent, command or skill body names a plugin file to read (a `${CLAUDE_PLUGIN_ROOT}/` path other than `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs`, a path containing `references/`, or a relative link target that resolves to a file of the plugin), THEN THE plugin structure check SHALL report error `PLG-TMPL-001`.
- **Rationale:** D-019 item 2; Q-t082-bugs-01; C001-IF-08 §4; critic CR-32
- **Stories:** C001-US-1107
- **Priority:** Must
- **Acceptance:** C001-AC-1124.1
