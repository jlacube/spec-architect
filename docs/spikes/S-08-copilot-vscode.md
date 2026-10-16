---
spike: S-08
target: copilot
date: 2026-10-16
host_versions: { vscode: "1.108.0", copilot: "1.388.0", copilot-chat: "0.35.3", copilot-cli: "1.0.98" }
outcomes:
  subagent_tool_list_confined: pending      # VS Code run pending; Copilot CLI: true (§2.1)
  agent_hooks_block_subagent_calls: pending # VS Code run pending; Copilot CLI: true, fail-closed (§2.2)
  copilot_cli_loads_package: true
  terminal_dialect: pending                 # VS Code terminal tool; Copilot CLI uses PowerShell
cmd_shims: []
enforcement_mode: pending                   # set by the S-08 rule once the VS Code run is in
---

# S-08 — GitHub Copilot in VS Code and Copilot CLI (C002-T-002)

**Status:** draft. The Copilot CLI part ran on 2026-10-16. The VS Code part (P-01 at the keyboard,
`docs/spikes/s08/README.md` steps 1–7) is pending; the frontmatter outcomes that concern VS Code stay
`pending` until then, and P-01 signs off the record after it.

## 1. Method

- Probe plugin `docs/spikes/s08/` (Copilot legacy format): `probe-parent` starts two subagents —
  `probe-confined` (tools `read`, `search`, `probe-stub/stub_read`; no edit or terminal tools) and
  `probe-hooked` (tools `read`, `search`, `edit`, `execute`, `probe-stub/*`; agent-scoped `PreToolUse`
  hook `hooks/deny.mjs` that prints a deny decision and exits 2). A plugin-level audit hook logs every
  `PreToolUse`, `SubagentStart` and `SubagentStop` input; the stub MCP server logs every call.
- Copilot CLI run, in a throwaway git workspace holding a copy of the probe plugin (not this
  repository), so that `--allow-all-tools` cannot touch the repository:
  `copilot -p "run the probes" --agent architect-s08-probe:probe-parent --plugin-dir docs/spikes/s08 --allow-all-tools --no-ask-user`.
  `--allow-all-tools` removes permission prompts, so a refused action shows confinement or a hook,
  never a prompt.
- Host: REF-WIN (Windows 11), Node 22.13.0. Copilot plan of P-01: 1,500 included AI Credits per
  month, additional usage enabled with a 50 USD budget; Claude Opus, Sonnet and Haiku enabled (P-01,
  2026-10-16).

## 2. Results — Copilot CLI 1.0.98 (2026-10-16)

### 2.1 Tool-list confinement — confined

| Action of `probe-confined` | Tool available | Outcome |
|---|---|---|
| Create `sandbox/confined-edit.txt` | no | no tool |
| Run the `node -e …` command | no | no tool |
| MCP `stub_read` | yes (`probe-stub-stub_read`) | ran (logged by the stub server) |
| MCP `stub_write` | no | no tool |

The subagent listed exactly two tools: `view` and `probe-stub-stub_read`. No sandbox file exists after
the run. A **per-tool MCP grant** (`probe-stub/stub_read`) works: the other tool of the same server was
not offered (architecture §6.2 alternative to whole-server grants).

### 2.2 Agent-scoped hooks — block, fail-closed

| Action of `probe-hooked` | Tool (hook `tool_name`) | Outcome |
|---|---|---|
| Create `sandbox/hooked-edit.txt` | `create` (`Write`) | blocked: `Denied by preToolUse hook from "architect-s08-probe@" (hook errored)` |
| Run the `node -e …` command | `powershell` (`Bash`) | blocked: same message |

- The agent-scoped hook ran for both calls (two `agent-scoped:probe-hooked` log lines) and only for
  this subagent; the plugin-level audit hook ran for every call of every agent.
- The CLI log says `Error in preToolUse hook … (fail-closed): Hook command failed with code 1`, with
  the script's stderr: the script exits 2, but the CLI saw exit code 1 (the command runs through the
  Windows shell) and **failed closed**. The deny JSON on stdout was not used as a decision. A guard
  hook on Copilot CLI must therefore not rely on exit 2 being passed through; a deny is still a deny.
- `probe-hooked` listed its tools as `view`, `create`, `edit`, `powershell`, `read_powershell`,
  `stop_powershell`, `list_powershell`, `probe-stub-stub_read`, `probe-stub-stub_write`.

### 2.3 Hook input shape (Copilot CLI, VS Code-compatible PascalCase format)

| Event | Fields |
|---|---|
| `PreToolUse` (parent agent) | `hook_event_name`, `session_id`, `timestamp`, `cwd`, `tool_name`, `tool_input` |
| `PreToolUse` (inside a subagent) | the above plus **`agent_id`, `agent_type`, `parent_agent_id`** |
| `SubagentStart` | camelCase: `sessionId`, `timestamp`, `cwd`, `transcriptPath`, `agentName`, `agentDisplayName`, `agentDescription`, `agent_id`, `agent_type`, `parent_agent_id` |
| `SubagentStop` | `hook_event_name`, `session_id`, `timestamp`, `cwd`, `agent_id`, `agent_type`, `parent_agent_id`, `transcript_path`, `agent_name`, `agent_display_name`, `last_assistant_message`, `stop_reason`, `stop_hook_active` |

- Tool names in hook input: `Write` (`tool_input` `path`, `file_text`), `Bash` (`command`,
  `description`), MCP tools as `<server>-<tool>` (`probe-stub-stub_read`), subagent start as `Agent`
  (`tool_input.agent_type`, `description`, `name`).
- **Agent identity is present on tool events inside a subagent** (`agent_type:
  "architect-s08-probe:probe-hooked"`). This contradicts C002-R-001 A-03/B-01 ("no agent identity on
  tool events") for Copilot CLI; whether VS Code does the same is a VS Code probe question.
- Agent IDs are namespaced by plugin: `--agent probe-parent` fails, `architect-s08-probe:probe-parent`
  works.
- `${PLUGIN_ROOT}` is expanded in hook commands and set in the hook environment; it is not set in the
  MCP server process environment (the stub server's log shows none), though it is expanded in `args`.

### 2.4 Other facts

- `copilot_cli_loads_package: true` — `--plugin-dir` loads agents, hooks and `.mcp.json`.
- Models: both subagents ran on `claude-sonnet-5.5` (the default; the probe agents set no model).
- `cmd_shims: []` — on REF-WIN, `ast-grep`/`sg`, `serena`, `uvx`, `git` and `node` resolve to `.exe`
  files (`where.exe`, 2026-10-16); `rg` and `ripwire` are not installed.
- **AI Credits:** the whole CLI run (parent + two subagents + folder listing) used **9.03 credits
  (0.09 USD)**, 69.3k input tokens (42.4k cached, 26.8k written) and 1.9k output tokens — well below
  the 0.21 … 0.29 USD planning rate per session of test plan §4.4.

## 3. Results — VS Code (pending)

To be filled from P-01's run (README steps 1–7): confinement and hook results in the Local harness,
hook input fields (agent identity or not), `vscode/askQuestions` raw results (answered, skipped,
setting off), terminal dialect, model names per tier, AI Credits used.

## 4. Enforcement mode (pending)

S-08 rule (C002-IF-009 §3): `sdd-mcp-server` when subagents are confined; else `copilot-hooks` when
agent-scoped hooks block; else `deferred`. On Copilot CLI both hold, which would give
`sdd-mcp-server`; the record's mode is set from the VS Code result, since VS Code is the target.
