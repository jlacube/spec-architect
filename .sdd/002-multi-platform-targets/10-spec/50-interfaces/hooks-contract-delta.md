---
id: C002-IF-008
artifact: spec/interface
kind: hook protocol
change: CHG-002
phase: 10-spec
status: draft
---

# C002-IF-008 — Hooks contract delta (delta to C001-IF-07)

C001-IF-07 stays in force for Claude Code. This delta changes two allowlist rows (the only Claude
Code behaviour CHG-002 changes, C002-REQ-503) and adds the Copilot hook input used by the Copilot
hooks fallback and the Copilot session hooks. Owner: C002-COMP-012.

## §1 Allowlist rows changed (C001-IF-07 §3)

| Entry | Allowed form (CHG-002) | Notes |
|---|---|---|
| sdd CLI | `node <path>/sdd.mjs <any subcommand>` or `sdd <any subcommand>` | `sdd` must be the whole first word: `npx sdd …` and `sddx …` stay denied with GUARD-BASH-001 (C002-TS-504). A bare `sdd` runs the `sdd` that PATH resolves, the same trust as the `git` and `ripwire` entries. The script form keeps its rule (no `sdd.mjs` inside `.sdd/`) |
| tool versions | `node -v`, `node --version`, `git --version`, `claude --version`, `serena --version`, `ast-grep --version`, `uv --version` | exact word count: `node --version --eval 1` stays denied |

PowerShell commands from Architect agents: `node <path>/sdd.mjs …`, `sdd …` and the version probes,
written identically. Compound-command rules (C001-REQ-1107) are unchanged, so `sdd status > out.txt`
stays GUARD-BASH-002.

Deny message summary (`Allowed:` part of C001-IF-07 §4), CHG-002 text:

```text
sdd … or node <path>/sdd.mjs …, ripwire read verbs, ast-grep run --pattern, git log|show|diff|blame|ls-files|rev-parse|status|grep, version probes (node -v, node --version, git --version, claude --version, serena --version, ast-grep --version, uv --version); head -n N, tail -n N, wc -l, sort, uniq only after |
```

The same allowlist is the source of the OpenCode `bash` rules under native permission enforcement
(C002-IF-001 §6.3) and the decision of the sdd MCP server command tool (C002-IF-002 §5.2).

## §2 Copilot PreToolUse input (Copilot hooks fallback)

VS Code passes on standard input `hook_event_name`, `tool_name`, `tool_input`, `tool_use_id`, `cwd`,
`session_id`, `transcript_path`, `timestamp`, and no agent identity (C002-R-001 A-02, A-03). The
agent-scoped command `sdd hook guard --host copilot --agent <agent> --classes <file>` (C002-IF-007)
maps it to the hook input of C001-IF-07 §1:

| Field of the guard core input | Value |
|---|---|
| `agent_type` | `architect:<agent>` from `--agent`: the hook is declared on that agent only, so the identity comes from where it is declared (identity by scoping) |
| `cwd` | `cwd` of the input |
| `tool_name`, `tool_input` | by the class of `tool_name` in the classes file (`hook_tool_classes` of C002-IF-001, written to `hooks/tool-classes.json`) |

| Class | Decision |
|---|---|
| write | Every string found at the class's `paths` pointers (a `*` segment walks an array) is decided as `{ "tool_name": "Write", "tool_input": { "file_path": <path> } }` by the path guard core with the memory folder off (§5); all must be allowed. No path found → deny GUARD-HOOK-001. `always_deny` → deny GUARD-PATH-001 (a tool whose targets cannot be read from its input, such as a patch tool) |
| terminal | The string at `command` is decided as `{ "tool_name": "Bash" or "PowerShell", "tool_input": { "command": <command> } }` by the bash guard core in the class's dialect; `strictest` allows only when both dialects allow |
| read_only | allow |
| any other tool name | deny GUARD-HOOK-001 (C002-REQ-309) |

Exit code 0 allows; exit 2 denies, with the guard message on standard error, which VS Code returns
to the model (C002-R-001 A-02). Empty or non-JSON input, an unreadable classes file and every
exception also exit 2 with GUARD-HOOK-001 (C002-REQ-309, C002-CON-08). The tool names and input
fields of the VS Code edit and terminal tools are captured by spike S-08 (C002-R-001 A-05) and
written to the table, not to the code.

## §3 Copilot SessionStart and SubagentStop input

| Event | Fields used | Command (C002-IF-007) | Exit |
|---|---|---|---|
| SessionStart | `cwd` | `hook session-start --host copilot` | always 0; brief of C001-IF-07 §4 when `.sdd/` exists, else no output (C002-REQ-313, C002-REQ-314) |
| SubagentStop | `agent_type`, `cwd` | `hook subagent-stop --host copilot --agents …` | always 0; trace refresh for the four author agents only (C002-REQ-315) |

The `agent_type` values VS Code reports for the generated agents are captured by spike S-08; the
command compares them after removing an `architect:` prefix.

## §4 Hook command form

Every Copilot hook command is `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" <arguments>`, calling the
CLI copy inside the Copilot package, without shell operators (C002-REQ-316, C002-CON-14). VS Code
expands `${CLAUDE_PLUGIN_ROOT}` in hook commands, including agent frontmatter (C002-R-001 A-09).

## §5 Memory folder option of the path guard core

The path guard core takes an option `memoryFolder` (default on). On: the allowed folders are `.sdd/`
and `.claude/agent-memory/<agent>/` as in C001-IF-07 §2 (Claude Code hooks, unchanged). Off: `.sdd/`
only, and the deny summary reads `Allowed: files under .sdd/ (Architect agents write only inside
.sdd/).` The sdd MCP server and `hook guard --host copilot` call the core with the option off
(C002-REQ-401, C002-DEC-009).
