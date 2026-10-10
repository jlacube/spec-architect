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

Claude Code passes hook input as JSON on standard input. Fields used (names per the Claude
Code hooks documentation; verified in spike S-04 [VERIFY]):

| Field | Used by | Purpose |
|---|---|---|
| `hook_event_name` | all | `PreToolUse`, `PostToolUse`, `SessionStart`, `SubagentStop` |
| `tool_name` | guards, post-write | `Write`, `Edit`, `NotebookEdit`, `Bash`, `PowerShell` |
| `tool_input.file_path` / `tool_input.notebook_path` | path guard, post-write | write target |
| `tool_input.command` | bash guard | shell command |
| `cwd` | all | repository root resolution |
| `agent_type` (or equivalent agent identity) | guards | caller identity; absent → fallback (C001-REQ-1105) |
| `session_id`, `transcript_path` | fallback | detect main agent of the session |

## §2 `hooks/hooks.json`

| Event | Matcher | Command (args after `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"`) | Decision semantics |
|---|---|---|---|
| PreToolUse | `Write\|Edit\|NotebookEdit` | `guard-path` | exit 0 allow; exit 2 deny with stderr message |
| PreToolUse | `Bash\|PowerShell` | `guard-bash` | exit 0 allow; exit 2 deny |
| PostToolUse | `Write\|Edit` | `hook post-write` | always exit 0; findings for `.sdd/` files returned as feedback on stdout (JSON `additionalContext` or plain text per Claude Code contract) |
| SubagentStop | `^architect:sdd-(spec-writer\|architect\|planner\|test-designer)$` | `trace --quiet --write --active` | always exit 0 |
| SessionStart | (none) | `hook session-start` | always exit 0; brief on stdout |

Guards apply only when the caller is an Architect agent (`architect:sdd-*`) or, in fallback
mode, when the session's main agent is `architect:sdd-conductor`. For all other callers the
guards exit 0 immediately (C001-TS-1103 row 4).

## §3 Bash allowlist (Architect agents)

A command is allowed when, after splitting on pipes, every segment matches one entry below
and the command contains no `;`, `&&`, `||`, `>`, `>>`, `<` (except here-strings are also
denied), backticks or `$(`. Pipe targets are limited to the "pipe-only" entries.

| Entry | Allowed form | Notes |
|---|---|---|
| sdd CLI | `node <path>/sdd.mjs <any subcommand>` | the CLI enforces its own write discipline |
| ripwire read verbs | `ripwire [<path>] (--for=… \| --pack-task=… \| --callers=… \| --uses=… \| --impact=… \| --expand=… \| --test-gate \| --situ \| --hotspots \| --quality-panel \| --quality-delta \| --pack-signatures \| --doctor \| --help-task \| --version) [--token-budget=N] [--top-k=N] [--json]` | span-edit verbs excluded |
| ast-grep search | `ast-grep run --pattern <p> [--lang <l>] [<paths>] [--json]` | `--rewrite`, `-U`, `--update-all`, `-i` excluded |
| git read-only | `git (log\|show\|diff\|blame\|ls-files\|rev-parse\|status\|grep) …` | no `-o`/`--output`; `git diff --output` excluded |
| Archify | `node <path>/archify.mjs (doctor\|guide\|validate\|deliver\|compare) …` with `ARCHIFY_UPDATE_CHECK_DISABLED=1` prefix allowed | `deliver`/`compare` outputs must be under `.sdd/` (checked) |
| tool versions | `node -v`, `git --version`, `ast-grep --version`, `uv --version` | doctor |
| pipe-only | `head -n N`, `tail -n N`, `wc -l`, `sort`, `uniq` | only after `\|` |

PowerShell commands from Architect agents are denied except `node <path>/sdd.mjs …` and the
version probes, written identically.

## §4 Outputs

- Deny message (stderr): `<RULE>: <tool> on <target> denied — <reason>. Allowed: <summary>.`
- Session-start brief (stdout): ≤ 10 lines, first line `SDD workspace: <n> active change(s)`.
- Post-write feedback: ≤ 15 findings, most severe first, each in the CLI human format.
