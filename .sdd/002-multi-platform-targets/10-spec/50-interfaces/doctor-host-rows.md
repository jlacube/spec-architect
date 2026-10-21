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
(C002-IF-001 §2.1), and the doctor command's description names the same rows through the
frontmatter construct `doctor-description` (C002-IF-001 §2). The doctor table and `toolchain.md`
have the same rows (C002-REQ-507).

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

**No model row** (decided for defect D-027). The doctor reports no row for the model that an agent
runs on, on any target. The host chooses that model per session and per subagent, from the agent
file's `model` and what the adopter's plan offers (on a Copilot plan without the named model, the
host's default, C002-IF-005 §5 Models); no allowlisted command and no read of `sdd host-version`
(C002-IF-007) returns it, and an agent's own statement of its model is no reading. Where the model
that ran is recorded instead: the checklist record's `models_used` (C002-IF-009 §4 Models used), the
Copilot CLI eval results (`session_model`, `agent_models`, C002-IF-010 §3), and the place the install
notes name for P-03 (C002-IF-005 §5 Models). The rows of §1, the doctor table and `toolchain.md`
(C002-REQ-507) stay as they are.

## §2 Detection and status

All probes run through allowlisted commands (C002-IF-008 §1): a bare `sdd …` or a version probe. No
probe of `opencode`, `code` or a VS Code setting is added to the allowlist; the CLI runs those reads
(C002-IF-007 `host-version`), which settles the open item of C002-REQ-508.

| Row | Detection | `ok` | Other statuses | Fix column |
|---|---|---|---|---|
| node | Claude Code: `node -v`; generated targets: `node --version` | version ≥ 20 (the floor of `architect-sdd`, C002-NFR-401; the Node.js 22.22.2 floor of the OpenCode JS SDK binds only the machine of the eval runner and the corpus replay, `../10-context/scope.md` §5) | `missing`; `error` below 20 | `winget install OpenJS.NodeJS.LTS` |
| Claude Code | `claude --version` | ≥ 2.1.295 | `error` below 2.1.295, on Claude Code only (C002-REQ-506) | `claude update`, or update the Claude desktop app |
| OpenCode | `sdd host-version opencode`: the `opencode` that PATH resolves for the CLI's process, so with two installs the one first on that PATH is reported (`docs/spikes/S-07-opencode.md §9`, fact F-7) | equals `{{tested_version:opencode}}` | `untested` when it differs (C002-REQ-508); `missing` when OpenCode is not found | `tested version: <tested>` |
| VS Code with GitHub Copilot Chat | `sdd host-version {{host_version_arg}}`: `vscode-insiders` while the tested VS Code version is an Insiders build, as the one S-08 tested is, else `vscode` (C002-IF-001 §4) | both parts equal `{{tested_version:vscode}}` and `{{tested_version:copilot-chat}}` | `untested` when either differs; `missing` when VS Code is not found | `tested versions: VS Code <v>, GitHub Copilot Chat <c>` |
| sdd CLI | `sdd --version` (C002-IF-007, C002-REQ-511) | its major, minor and patch numbers equal those of `{{package_version}}` (exact match, Q-cli-03) | `missing` when not reachable; `error` when any of the three numbers differs, older or newer (C002-REQ-509) | `npm install -g architect-sdd@{{package_version}}` |
| Copilot hooks | the `hooks` line of `sdd host-version {{host_version_arg}}`, which reads `chat.useHooks` only (C002-IF-007 Output) | `hooks enabled`, with the Version text `chat.useHooks on; profile and .code-workspace settings, Workspace Trust and organisation policy not read, confirmed by the manual VS Code checklist` (C002-REQ-510) | `error` when `hooks disabled (chat.useHooks)`, Version `disabled (chat.useHooks)`; `error` when `hooks unknown` or no `hooks` line, Version `cannot be read` (C002-REQ-510) | `disabled`: `enable chat.useHooks and trust the workspace`; `unknown`: `check chat.useHooks and Workspace Trust by hand` |

The `untested` and `error` statuses of the host and sdd CLI rows are warnings, except as §3 states.

**Which OpenCode the row reports** (revised for defect D-020 item 4). The OpenCode row reports the
`opencode` that P-03 would run by that name: the first one that the PATH of the session resolves,
which the sdd CLI inherits from the host process (directly, or through the `sdd-shell` server under
sdd MCP server enforcement). The CLI looks for it in the PATH folders only, never in the working
folder or the repository, and runs it by its absolute path from the folder that holds it (C002-IF-007
`host-version` and §Executable lookup, C002-CON-17; revised for critic CR-63), so an `opencode.cmd` or a
`node.exe` placed in the adopter's repository is neither reported nor started by the doctor. It is not necessarily the binary that runs the session: an OpenCode
started by its absolute path, or from a shortcut, while another install comes first on the PATH,
shows the version of that other install, and the row is `untested` when that version differs from
the tested one, a correct report of what a terminal of P-03 would start. The Fix `tested version:
<tested>` then asks P-03 to install the tested version or to put its folder first on the PATH;
`sdd host-version` has no option that names another executable (C002-IF-007). The VS Code row reads
`code` or `code-insiders` the same way. The eval runner gives its doctor sessions a PATH on which the
pinned host binary comes first (C002-IF-010 §4, PATH lead), so their rows show the tested version.

**Copilot hooks row** (revised for defect D-012; P-01 decision of 2026-10-19, "ok + caveat"; revised
for critic CR-45). The row reads `chat.useHooks` alone: the `hooks` line of `sdd host-version` takes
it from the workspace settings `.vscode/settings.json`, then from the user settings of the default
profile of the VS Code build it probes, and gives `hooks unknown` when the workspace file exists but
cannot be used, without falling back to the user settings (C002-IF-007 Output). Three places can
still set `chat.useHooks` unseen by the CLI: the settings of a VS Code profile other than the
default one, which replace the default profile's user settings while that profile is active, and
the settings of a `.code-workspace` file, which apply when VS Code opens the repository through
such a file (a multi-root workspace).
Workspace Trust and organisation policy, the two other sources that can disable hooks, are read by
neither the CLI nor the doctor. The row is therefore `ok` when `chat.useHooks` is read as on, and
its Version text names what it did not read ("profile and .code-workspace settings" for those two
settings files); the manual VS Code checklist records the setting as VS Code shows it for the
active profile and workspace, and the two other sources, in both Copilot enforcement modes before
each release (C002-REQ-616, C002-IF-009 §4). A hooks state read as disabled, or one the doctor
cannot read (`hooks unknown`), is `error`, never `ok`, so an unread `chat.useHooks` is not reported
as protected (C002-REQ-510, C002-TS-526). The remedies-table row of the Copilot variant states the
same check: `chat.useHooks` on; profile and `.code-workspace` settings, Workspace Trust and
organisation policy not read.

**Tools started through the sdd MCP server.** Under sdd MCP server enforcement the probes of the
command-line tools run through the `sdd-shell` command tool, which does not start a `.cmd` or `.bat`
shim (ERR-MCP-006, C002-IF-002 §5.2). A probe refused for that reason shows the tool with status
`error`, version `—`, its fallback, and the fix `install a native executable of <tool>` followed by
the remedies-table command of the server-mode variant, which names an installer that provides a
native executable (for ast-grep, whose npm install gives only a `.cmd` shim). A probe refused
because the executable is not found shows `missing`, as today. The doctor reads the refusal from
the text of the error result, the only content the server returns for it (C002-IF-002 §6.1; revised
for defect D-017): `ERR-MCP-006: could not start "<executable>": only a .cmd or .bat shim was
found` gives `error`, `ERR-MCP-006: could not start "<executable>": not found on PATH` gives
`missing`; no structured field is read. The `doctor-report` variant prints
this rule in every enforcement mode of its target and names the package's mode through
`{{enforcement_mode}}`, because one variant serves every mode (C002-IF-001 §2.1); under native
permission enforcement and the Copilot hooks fallback the probes run through the host's own shell or
terminal tool, so no probe is refused with ERR-MCP-006 there and the rule has no effect (revised for
defect D-012).

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
