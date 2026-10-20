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

The path guard allows an Architect agent two folders: `.sdd/` and its own memory folder
`.claude/agent-memory/architect-<agent>/` (the folder Claude Code uses for `memory: project`; `<agent>`
is the part of `agent_type` after `architect:`), with the same normalisation (C001-REQ-1104). The
SubagentStop command uses `trace --active` (C001-IF-01): it always exits 0, because exit 2 would keep
the subagent from stopping.

## §3 Bash allowlist (Architect agents)

A command is allowed when, after splitting on pipes, every segment matches one entry below
and the command contains no `;`, `&&`, `||`, `>`, `>>`, `<` (except here-strings are also
denied), backticks or `$(`. Pipe targets are limited to the "pipe-only" entries.

| Entry | Allowed form | Notes |
|---|---|---|
| sdd CLI | `node <path>/sdd.mjs <any subcommand>` | the CLI enforces its own write discipline |
| ripwire read verbs and default map | verb form: `ripwire [<path>] (--for=… \| --pack-task=… \| --callers=… \| --uses=… \| --impact=… \| --expand=… \| --test-gate \| --test-gate=… \| --situ \| --hotspots \| --quality-panel \| --quality-delta \| --pack-signatures \| --doctor \| --help-task \| --version) [--token-budget=N] [--max-tokens=N] [--limit=N] [--offset=N] [--top-k=N] [--json]`; default-map form (no verb): `ripwire [<path>] (--max-tokens=N \| --token-budget=N) [--token-budget=N] [--max-tokens=N] [--limit=N] [--offset=N] [--top-k=N] [--json]`, at least one map bound required | words in any order, rules in §3.1; span-edit and write verbs excluded; bounding flags per C001-IF-14 §2 |
| ast-grep search | `ast-grep run --pattern <p> [--lang <l>] [<paths>] [--json]` | `--rewrite`, `-U`, `--update-all`, `-i` excluded |
| git read-only | `git (log\|show\|diff\|blame\|ls-files\|rev-parse\|status\|grep) …` | no `-o`/`--output`; `git diff --output` excluded |
| tool versions | `node -v`, `git --version`, `claude --version`, `serena --version`, `ast-grep --version`, `uv --version` | doctor |
| pipe-only | `head -n N`, `tail -n N`, `wc -l`, `sort`, `uniq` | only after `\|` |

PowerShell commands from Architect agents are denied except `node <path>/sdd.mjs …` and the
version probes, written identically.

### §3.1 ripwire forms

Revised for defect D-012: the bash guard admits the two read-only forms that C001-IF-14 §2 and the
`code-discovery` skill prescribe, a single read verb and the ranked default map (no verb), and
denies every other ripwire command (fail closed). The guard puts each word after the executable
(`ripwire`, matched as the other entries match their executable) into one class below, in any
order. A word that fits no class denies the command with GUARD-BASH-001.

| Class | Words |
|---|---|
| path | a non-empty word that does not start with `-` |
| value verb | `--for=<v>`, `--pack-task=<v>`, `--callers=<v>`, `--uses=<v>`, `--impact=<v>`, `--expand=<v>`, `--test-gate=<v>`; `<v>` is the non-empty rest of the word after the first `=` |
| flag verb | exactly `--test-gate`, `--situ`, `--hotspots`, `--quality-panel`, `--quality-delta`, `--pack-signatures`, `--doctor`, `--help-task`, `--version` (no `=`) |
| map bound | `--max-tokens=N`, `--token-budget=N` |
| other bound | `--limit=N`, `--offset=N`, `--top-k=N` |
| output | `--json` |

`N` is one or more decimal digits (`0`–`9`) and nothing else, so `--limit=-1`, `--limit=x` and a
bound without `=N` fit no class. The command is allowed when it holds at most one path word and one
of:

1. **Verb form:** exactly one verb word (value verb or flag verb), with any number of map-bound,
   other-bound and output words.
2. **Default-map form:** no verb word and at least one map-bound word, with any number of further
   map-bound, other-bound and output words. Both map bounds cap the map: `--max-tokens=N` shapes it to fit N, and
   `--token-budget=N` withholds it when it exceeds N (exit 3, C001-IF-14 §2).

Every other ripwire command is denied with GUARD-BASH-001, in particular:

- no verb and no map bound, the unbounded default map: `ripwire`, `ripwire .`, `ripwire . --json`,
  `ripwire . --limit=50`;
- two verb words (`--for=a --callers=b`, `--hotspots --situ`, `--test-gate=src/a.ts --situ`) or two
  path words (`ripwire a b --situ`; also `ripwire . --test-gate src/a.ts`, whose file is a second
  path word: the file is passed as `--test-gate=<file>`);
- a value verb without its value or written with a space (`--for=`, `--test-gate=`, `--for x`);
- span-edit, write and every other option (`--edit=…`, `--apply-span=…`, `--write`, `--mcp`,
  `--merge-scout`, `--pr-context`, `-o`).

The guard requires a bound only for the default-map form, where the bound is what makes the
command a bounded read. For the verb form the bound stays optional to the guard: passing the flag
that C001-IF-14 §2 assigns to the verb is the cartographer's duty (C001-REQ-1003, checked by
C001-TS-1004), and ripwire itself refuses a flag that does not fit the verb (exit 1, no output).

## §4 Outputs

- Deny message (stderr): `<RULE>: <tool> on <target> denied — <reason>. Allowed: <summary>.`
- Session-start brief (stdout): ≤ 10 lines, first line `SDD workspace: <n> active change(s)`.
- Post-write feedback: ≤ 15 findings, most severe first, each in the CLI human format.
