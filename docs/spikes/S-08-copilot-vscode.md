---
spike: S-08
target: copilot
date: 2026-10-17
host_versions: { vscode-insiders: "1.142.0-insider", vscode: "1.108.0", copilot: "1.388.0", copilot-chat: "0.35.3", copilot-cli: "1.0.98" }
outcomes:
  subagent_tool_list_confined: true
  agent_hooks_block_subagent_calls: false
  copilot_cli_loads_package: true
  terminal_dialect: powershell
cmd_shims: []
enforcement_mode: sdd-mcp-server
---

# S-08 — GitHub Copilot in VS Code and Copilot CLI (C002-T-002)

**Status:** complete, signed off by P-01 on 2026-10-17 ("Sign off"). Copilot CLI ran on 2026-10-16; VS Code
Insiders runs on 2026-10-16 and 2026-10-17 (P-01 at the keyboard, probe versions 0.0.1 … 0.0.5).

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

## 3. Results — VS Code Insiders 1.142.0-insider (2026-10-16, partial)

P-01 ran the probes in **VS Code Insiders 1.142.0-insider** (not stable 1.108.0). Model used: Claude
Sonnet 5.5 (P-01).

- **Session types.** The Copilot CLI session type does not offer the plugin's agents in its picker
  (P-01: a local plugin needs a marketplace there). The **Local** session type runs the chat through
  the "Copilot SDK agent running in the local agent host process" (agent host log: session
  `provider: copilotcli`).
- **Plugin copy.** VS Code copies the plugin to `%APPDATA%\Code - Insiders\agentPlugins\<id>\<nonce>\`
  and loads its agents, hooks and MCP server from the copy (log: `load: loaded`, three agent children).
- **`${PLUGIN_ROOT}` in hook commands is not expanded on Windows** (0.0.2 diagnostic): of the two
  `SessionStart` hooks, only the absolute-path one logged; the `${PLUGIN_ROOT}` one never ran. The
  hook process does have the `PLUGIN_ROOT` environment variable. With 0.0.1 every hook used the token,
  every hook "errored" before our script ran, and **every tool call was denied — fail-closed**
  (including the subagent launches and a folder read). Run cost: 36.7 AI Credits.
- **Plugin agents are not available as subagents** (0.0.3 run): the task tool offered only `explore`,
  `task`, `general-purpose`, `rubber-duck`, `code-review`, `research`, `security-review` and the
  selected agent `probe-parent`, and refused `probe-confined` / `probe-hooked` with `Unknown
  agent_type`, although the log lists both as loaded plugin agents. With 0.0.2 the same happened while
  they were `user-invocable: false`. Copilot CLI 1.0.98 standalone does offer them (as
  `architect-s08-probe:probe-confined`).
- **Hooks run** once the commands use absolute paths: plugin-level `PreToolUse` fired for `Agent` and
  `Glob` calls of the parent (no agent identity on the parent's own calls, as on Copilot CLI).
- The plugin agents do appear in the chat's **agent picker** (P-01 screenshot, 2026-10-16) — they can
  be selected as the session agent, but not started as subagents.

### 3.1 Workspace agents as subagents (2026-10-16 22:04 UTC, Local session)

Workspace `docs/spikes/s08/workspace/` with `.github/agents/ws-parent|ws-confined|ws-hooked.agent.md`
(same frontmatter and bodies as the probe agents, absolute sandbox paths); the probe plugin stayed
loaded, so its audit hook logged.

| Subagent | Action | Outcome |
|---|---|---|
| ws-confined | create `confined-edit.txt` | no tool (file absent) |
| ws-confined | `node -e …` command | no tool (file absent) |
| ws-confined | MCP `stub_read` | **not reached**: listed as deferred, `tool_search_tool` found nothing |
| ws-confined | MCP `stub_write` | no tool |
| ws-hooked | create `hooked-edit.txt` | **ran** (file exists) |
| ws-hooked | `node -e …` command | **ran** (file exists) |

- **Tool-list confinement holds:** `ws-confined` had `view`, `grep`, `glob`, `tool_search_tool`;
  `ws-hooked` had those plus `create`, `edit` and four PowerShell tools.
- **The agent-scoped hook of `ws-hooked` never ran** (no `agent-scoped` log line), so its calls were
  not blocked → `agent_hooks_block_subagent_calls: false` in this host.
- **Plugin-level hooks fire for subagent tool calls and carry the agent identity:** `PreToolUse`
  `Write` and `Bash` with `agent_type: ws-hooked`, `tool_search_tool` with `agent_type: ws-confined`;
  `SubagentStart` / `SubagentStop` for both. Same shape as Copilot CLI (§2.3).
- MCP from a subagent: not reached in this run (duplicate server name); settled in §3.2.

### 3.2 MCP from the session agent and from a subagent (2026-10-17, probe 0.0.5)

- **Plugin MCP servers are not started by the Local agent host:** every session logs
  `MCP server 'probe-stub' not_configured (stopped)` with `mcpSource: plugin`. A workspace server
  (`.vscode/mcp.json`, renamed `ws-stub` to avoid the duplicate name) starts with the session — and
  only after the first message ("Cannot start an MCP server before the session runtime has been
  created. Send a message first.").
- MCP tools are named `<server>-<tool>` (`ws-stub-stub_read`) and are **deferred**: an agent loads
  them with `tool_search_tool`, which the host adds even to an agent whose `tools:` list omits it.
- **A tool-restricted subagent reaches MCP tools:** `ws-mcp` (tools `read` + `ws-stub/*`) called
  `ws-stub-stub_read` and `ws-stub-stub_write`; both reached the stub server (`logs/mcp.jsonl`,
  12:54 UTC). Its tools were `view`, `tool_search_tool` and the two stub tools — no edit or terminal
  tool. The session agent `ws-mcp-parent` called `ws-stub-stub_read` too.
- An agent without `tools:` gets the full set (PowerShell, `create`/`edit`, web, GitHub MCP,
  `task`, …); the question tool of this host is **`ask_user`** (not `vscode/askQuestions`).
- The audit hook tagged every subagent call with `agent_type: ws-mcp`.

## 4. Enforcement mode: `sdd-mcp-server`

S-08 rule (C002-IF-009 §3): `sdd-mcp-server` when subagents are confined; else `copilot-hooks` when
agent-scoped hooks block; else `deferred`. VS Code Insiders confines subagents (§3.1) and a confined
subagent reaches the MCP tools (§3.2), so the mode is **`sdd-mcp-server`**. Copilot CLI agrees (§2).

## 5. Facts that contradict the approved spec (to triage with P-01, C002-T-002 step 7)

| # | Fact (host) | Spec assumption affected |
|---|---|---|
| F-1 | Plugin agents cannot be started as subagents; workspace agents (`.github/agents/`) can (VS Code) | the Copilot target ships the specialists inside the plugin package (C002-REQ-301, C002-IF-005) |
| F-2 | Plugin MCP servers are not started; workspace/user servers are (VS Code) | the sdd MCP server ships in the package's MCP config (C002-REQ-210, C002-REQ-307, C002-IF-002) |
| F-3 | `${PLUGIN_ROOT}` is not expanded in hook commands on Windows; the env variable is set (VS Code) | hook commands use the root token (C002-IF-008, C002-REQ-301 CLI copy) |
| F-4 | Agent-scoped hooks do not run (VS Code); plugin-level hooks run and carry `agent_type` on subagent calls (VS Code and Copilot CLI) | the hooks fallback uses agent-scoped hooks without identity (C002-DEC-001, C002-REQ-309, R-001 A-03) |
| F-5 | Question tool is `ask_user` in the Local agent host | C002-REQ-311, C002-REQ-312 name `vscode/askQuestions` |
| F-6 | Copilot CLI reports a hook's exit 2 as code 1 and fails closed; agent IDs are `<plugin>:<agent>` | C002-IF-008 §2 exit-code semantics; agent references in the Copilot CLI eval runner |
| F-7 | MCP tools are deferred and named `<server>-<tool>` | mapping table name form `x/y` (ideation §8) |

## 6. AI Credits

| Run | Credits |
|---|---|
| Copilot CLI probe (2026-10-16) | 9.03 |
| VS Code Insiders, first run (0.0.1) | 36.7 |
| Later VS Code runs (0.0.2 … 0.0.5) | to be read from P-01's billing view |
