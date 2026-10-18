---
id: C002-IF-006
artifact: spec/interface
kind: commands
change: CHG-002
phase: 10-spec
status: draft
---

# C002-IF-006 — Doctor host rows

Extends the doctor remedies table of C001-IF-10 §3 and the doctor and toolchain-record procedure
(`commands/doctor.md`, `skills/code-discovery/SKILL.md`, current-state E-14 … E-21). On Claude Code
every row, probe and outcome stays as today (C002-GOAL-05); the generated targets receive the host
rows below through wiring variants of `doctor.md` and of the code-discovery toolchain section
(C002-IF-001 §2). The doctor table and `toolchain.md` have the same rows (C002-REQ-507).

## §1 Rows and order

| # | Row | Claude Code | OpenCode | VS Code with GitHub Copilot Chat |
|---|---|---|---|---|
| 1 | node | yes | yes | yes |
| 2 | git | yes | yes | yes |
| 3 | host | Claude Code | OpenCode | VS Code with GitHub Copilot Chat |
| 4–8 | ripwire, Serena, ast-grep, Context7, DeepWiki | yes | yes | yes |
| 9 | sdd CLI | no | yes | yes |
| 10 | Copilot hooks | no | no | both Copilot enforcement modes: the subagent guard hook needs hooks enabled (C002-REQ-510, C002-REQ-327) |

Columns: Tool, Status, Version, Fallback, Fix (C001-IF-10 §3). Status values: `ok`, `missing`,
`unreachable`, `error`, `untested` (C002-REQ-504).

## §2 Detection and status

All probes run through allowlisted commands (C002-IF-008 §1): a bare `sdd …` or a version probe. No
probe of `opencode`, `code` or a VS Code setting is added to the allowlist; the CLI runs those reads
(C002-IF-007 `host-version`), which settles the open item of C002-REQ-508.

| Row | Detection | `ok` | Other statuses | Fix column |
|---|---|---|---|---|
| node | Claude Code: `node -v`; generated targets: `node --version` | version ≥ 20 | `missing`; `error` below 20 | `winget install OpenJS.NodeJS.LTS` |
| Claude Code | `claude --version` | ≥ 2.1.295 | `error` below 2.1.295, on Claude Code only (C002-REQ-506) | `claude update`, or update the Claude desktop app |
| OpenCode | `sdd host-version opencode` | equals `{{tested_version:opencode}}` | `untested` when it differs (C002-REQ-508); `missing` when OpenCode is not found | `tested version: <tested>` |
| VS Code with GitHub Copilot Chat | `sdd host-version vscode` | both parts equal `{{tested_version:vscode}}` and `{{tested_version:copilot-chat}}` | `untested` when either differs; `missing` when VS Code is not found | `tested versions: VS Code <v>, GitHub Copilot Chat <c>` |
| sdd CLI | `sdd --version` (C002-IF-007, C002-REQ-511) | its major, minor and patch numbers equal those of `{{package_version}}` (exact match, Q-cli-03) | `missing` when not reachable; `error` when any of the three numbers differs, older or newer (C002-REQ-509) | `npm install -g architect-sdd@{{package_version}}` |
| Copilot hooks | the `hooks` line of `sdd host-version vscode` | `enabled` | `error` when `disabled (<source>)` with the source `chat.useHooks`, Workspace Trust or organisation policy, and `error` when `hooks unknown` (C002-REQ-510) | `disabled`: `enable chat.useHooks and trust the workspace`; `unknown`: `check chat.useHooks and Workspace Trust by hand` |

The `untested` and `error` statuses of the host and sdd CLI rows are warnings, except as §3 states.
How each disabling source of the Copilot hooks row is read is open for spike S-08 (C002-REQ-510).
A hooks state that the doctor cannot read (`hooks unknown`) is never shown as `ok` (C002-REQ-510,
C002-TS-526).

**Tools started through the sdd MCP server.** Under sdd MCP server enforcement the probes of the
command-line tools run through the `sdd-shell` command tool, which does not start a `.cmd` or `.bat`
shim (ERR-MCP-006, C002-IF-002 §5.2). A probe refused for that reason shows the tool with status
`error`, version `—`, its fallback, and the fix `install a native executable of <tool>` followed by
the remedies-table command of the server-mode variant, which names an installer that provides a
native executable (for ast-grep, whose npm install gives only a `.cmd` shim). A probe refused
because the executable is not found shows `missing`, as today.

## §3 Outcome line

The last line of the doctor reply is exactly one of:

| Line | When | Hosts |
|---|---|---|
| `Doctor: failed: node ≥ 20 required` | node missing or older than 20 | all (C001-REQ-1111, C002-REQ-505) |
| `Doctor: failed: sdd CLI not reachable` | the sdd CLI row is `missing` | generated targets (C002-REQ-505) |
| `Doctor: completed with warnings` | any other row not `ok` | all |
| `Doctor: completed` | every row `ok` | all |

When both failure conditions hold, the node line is printed.

## §4 Serena data folder

Step 1 of the doctor (`sdd serena-config "${CLAUDE_PLUGIN_DATA}"`) becomes `sdd serena-config
--user-data` on the generated targets (C002-REQ-116, C002-IF-001 §2, C002-IF-007): the per-user
data folder of `architect-sdd`, never `.serena/` in the repository. On Claude Code the step keeps its
text and passes the bash guard by C002-IF-008 §1.1 (C002-REQ-517, C002-TS-528).
