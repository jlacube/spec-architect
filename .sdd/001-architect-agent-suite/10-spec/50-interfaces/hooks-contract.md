---
id: C001-IF-07
artifact: spec/interface
kind: hook protocol
change: CHG-001
phase: 10-spec
status: approved
---

# C001-IF-07 — Hooks contract and Bash allowlist

## §1 Hook input

Claude Code passes hook input as JSON on standard input. Fields used (verified in spike S-04 with
Claude Code 2.1.295; samples in `docs/spikes/S-04-hooks.md`):

| Field | Used by | Purpose |
|---|---|---|
| `hook_event_name` | all | `PreToolUse`, `PostToolUse`, `SessionStart`, `SubagentStop` |
| `tool_name` | guards, post-write | `Write`, `Edit`, `NotebookEdit`, `Bash`, `PowerShell` |
| `tool_input.file_path` / `tool_input.notebook_path` | path guard, post-write | write target (absolute path) |
| `tool_input.command` | bash guard | shell command |
| `cwd` | all | repository root resolution |
| `agent_type` | guards, SubagentStop matcher | caller identity: `architect:<agent>` for Architect subagents and for a session started with `--agent architect:<agent>`; a bare name for built-in agents (`general-purpose`); absent for a plain main session |
| `session_id`, `transcript_path` | session-start, trace | session correlation |

## §2 `hooks/hooks.json`

| Event | Matcher | Command (args after `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"`) | Decision semantics |
|---|---|---|---|
| PreToolUse | `Write\|Edit\|NotebookEdit` | `guard-path` | exit 0 allow; exit 2 deny with stderr message |
| PreToolUse | `Bash\|PowerShell` | `guard-bash` | exit 0 allow; exit 2 deny |
| PostToolUse | `Write\|Edit` | `hook post-write` | always exit 0; findings for `.sdd/` files returned as feedback on stdout (JSON `additionalContext` or plain text per Claude Code contract) |
| SubagentStop | `^architect:sdd-(spec-writer\|architect\|planner\|test-designer)$` | `trace --quiet --write --active` | always exit 0 |
| SessionStart | (none) | `hook session-start` | always exit 0; brief on stdout |

Guards apply only when `agent_type` names an Architect agent (`architect:sdd-*`). For all other
callers, including a plain main session without `agent_type`, the guards exit 0 immediately
(C001-TS-1103 row 4). Claude Code versions below the minimum of C001-REQ-1123 are unsupported.

## §3 Bash allowlist (Architect agents)

A command is allowed when, after splitting on pipes, every segment matches one entry below
and the command contains no `;`, `&&`, `||`, `>`, `>>`, `<` (except here-strings are also
denied), backticks or `$(`. Pipe targets are limited to the "pipe-only" entries.

| Entry | Allowed form | Notes |
|---|---|---|
| sdd CLI | `node <path>/sdd.mjs <any subcommand>` | the CLI enforces its own write discipline |
| ripwire read verbs | `ripwire [<path>] (--for=… \| --pack-task=… \| --callers=… \| --uses=… \| --impact=… \| --expand=… \| --test-gate \| --situ \| --hotspots \| --quality-panel \| --quality-delta \| --pack-signatures \| --doctor \| --help-task \| --version) [--token-budget=N] [--max-tokens=N] [--limit=N] [--offset=N] [--top-k=N] [--json]` | span-edit verbs excluded; bounding flags per C001-IF-14 §2 |
| ast-grep search | `ast-grep run --pattern <p> [--lang <l>] [<paths>] [--json]` | `--rewrite`, `-U`, `--update-all`, `-i` excluded |
| git read-only | `git (log\|show\|diff\|blame\|ls-files\|rev-parse\|status\|grep) …` | no `-o`/`--output`; `git diff --output` excluded |
| tool versions | `node -v`, `git --version`, `claude --version`, `serena --version`, `ast-grep --version`, `uv --version` | doctor |
| pipe-only | `head -n N`, `tail -n N`, `wc -l`, `sort`, `uniq` | only after `\|` |

PowerShell commands from Architect agents are denied except `node <path>/sdd.mjs …` and the
version probes, written identically.

## §4 Outputs

- Deny message (stderr): `<RULE>: <tool> on <target> denied — <reason>. Allowed: <summary>.`
- Session-start brief (stdout): ≤ 10 lines, first line `SDD workspace: <n> active change(s)`.
- Post-write feedback: ≤ 15 findings, most severe first, each in the CLI human format.
