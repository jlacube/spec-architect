---
id: C002-IF-008
artifact: spec/interface
kind: hook protocol
change: CHG-002
phase: 10-spec
status: draft
---

# C002-IF-008 — Hooks contract delta (delta to C001-IF-07)

C001-IF-07 stays in force for Claude Code. This delta changes two allowlist rows and confines the
two Serena subcommands of the sdd CLI entry (the only Claude Code behaviours CHG-002 changes,
C002-REQ-503 and C002-REQ-517, C002-GOAL-05 as widened by Q-guards-04), and adds the Copilot hook
input used by the Copilot hooks fallback and the Copilot session hooks. Owner: C002-COMP-012.

## §1 Allowlist rows changed (C001-IF-07 §3)

| Entry | Allowed form (CHG-002) | Notes |
|---|---|---|
| sdd CLI | `node <path>/sdd.mjs <any subcommand>` or `sdd <any subcommand>`, except `serena-config` and `serena-launch`, which §1.1 confines | `sdd` must be the whole first word: `npx sdd …` and `sddx …` stay denied with GUARD-BASH-001 (C002-TS-504). A bare `sdd` runs the `sdd` that PATH resolves, the same trust as the `git` and `ripwire` entries. The script form keeps its rule (no `sdd.mjs` inside `.sdd/`) |
| tool versions | `node -v`, `node --version`, `git --version`, `claude --version`, `serena --version`, `ast-grep --version`, `uv --version` | exact word count: `node --version --eval 1` stays denied |

PowerShell commands from Architect agents: `node <path>/sdd.mjs …`, `sdd …` and the version probes,
written identically. Compound-command rules (C001-REQ-1107) are unchanged, so `sdd status > out.txt`
stays GUARD-BASH-002.

Deny message summary (`Allowed:` part of C001-IF-07 §4), CHG-002 text:

```text
sdd … or node <path>/sdd.mjs … (serena-config and serena-launch only with --user-data or a data folder outside the repository), ripwire read verbs, ast-grep run --pattern, git log|show|diff|blame|ls-files|rev-parse|status|grep, version probes (node -v, node --version, git --version, claude --version, serena --version, ast-grep --version, uv --version); head -n N, tail -n N, wc -l, sort, uniq only after |
```

The same allowlist is the source of the OpenCode `bash` rules under native permission enforcement
(C002-IF-001 §6.3, which lists the parts a glob cannot express) and the decision of the sdd MCP
server command tool (C002-IF-002 §5.2) and of the agent-scoped guard hooks (§2): one bash guard core
decides on every host (C002-CON-06).

### §1.1 Serena subcommands (C002-REQ-517)

A command of the sdd CLI entry is a **Serena command** when one of its words before the first `--`
is `serena-config` or `serena-launch`. The bash guard core allows a Serena command only when all of
the following hold, and otherwise denies it with GUARD-BASH-001 and the reason `sdd <subcommand> with
a data folder inside the repository (<resolved folder>)` or `sdd <subcommand> with an argument the
guard cannot resolve (<word>)`:

1. **Shape.** Before the first `--`, the words after the CLI prefix (`sdd`, or `node <path>/sdd.mjs`
   as the script form allows) are exactly the subcommand, one data-folder argument and, for
   `serena-launch` only, `--read-only`, in any order. Any other word there (another option such as
   `--cwd`, a second folder) denies the command. The words after `--` are Serena's arguments and are
   not checked: Serena keeps its project data in the data folder (C001-REQ-1013), so the data folder
   decides where the command writes.
2. **Data-folder argument.** One of:
   - `--user-data`: allowed. The CLI itself refuses a per-user data folder that cannot be determined,
     is relative or resolves inside the repository (C002-REQ-516, ERR-CLI-020, C002-IF-007).
   - the literal `${CLAUDE_PLUGIN_DATA}`, alone or in double quotes, in the Bash dialect only: the
     guard replaces it by the value of the environment variable `CLAUDE_PLUGIN_DATA` of its own
     process and decides that folder as below; an unset or empty variable denies the command. This
     is the spelling of step 1 of `commands/doctor.md` and of `commands/init.md:9` when Claude Code
     has not substituted the variable in the command text (current-state E-22).
   - any other word that starts with `~` or holds `$`, `%`, `` ` ``, `*`, `?`, `[` or `]`: denied,
     because the guard cannot resolve a shell expansion.
   - a folder: resolved against the hook input's `cwd` as the path guard resolves a write target
     (`..` segments, letter case, drive letters, 8.3 short names, links through the real path of
     the longest existing prefix; C001-REQ-1104). Allowed when the folder lies outside the
     repository root both as written and after link resolution; denied when it equals the root or
     lies under it. The comparison is per path segment, so `C:/repo-data` lies outside `C:/repo`
     (C002-TS-527).
3. **Repository root.** The top folder of the git working tree that contains `cwd` (the nearest
   ancestor, `cwd` included, that holds `.git`); when `cwd` lies in no git working tree, the
   nearest ancestor that holds `.sdd/`; when there is neither, `cwd` itself. The sdd CLI uses the
   same root for ERR-CLI-020 (C002-IF-007).

**Form the conductor sends on Claude Code** (C002-TS-528). The Serena step of the Claude Code doctor
and init commands is `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" serena-config "${CLAUDE_PLUGIN_DATA}"`,
in which Claude Code may already have replaced either variable by its value (the plugin root
literal is accepted as in C001-IF-07 §3, current-state E-5). The plugin data folder lies under the
user's Claude configuration folder (for example `C:/Users/fx/.claude/plugins/data/architect-inline`),
outside every repository, so both spellings pass: the substituted absolute path by rule 2 (folder),
the literal by rule 2 (environment variable). The generated targets pass `--user-data` instead
(C002-REQ-116), and their hosts set no `CLAUDE_PLUGIN_DATA`, so the literal is denied there.

### §1.2 Writing sdd subcommands

The subcommands of the sdd CLI that write files (C001-IF-01 and C002-IF-007, `src/cli/commands.ts:481-508`).
Every other subcommand writes no file. The guard corpora hold one case per row (C002-REQ-607,
C002-TS-636); the expected decision is `allow` except for the Serena rows, which §1.1 decides.

| Subcommand | Writes | Bash guard decision |
|---|---|---|
| `init` | `.sdd/` in the working folder | allow |
| `change new`, `change profile`, `change revise`, `change stop` | the change folder, `.sdd/registry.json`, `.sdd/SDD.md` | allow |
| `id next`, `id tombstone` | `ids.json` of the change | allow |
| `status --write` | `.sdd/registry.json`, the status block of `.sdd/SDD.md` | allow |
| `trace --write` (also run by `hook subagent-stop`) | `trace.json`, `80-traceability.md`, `85-open-items.md` of the change | allow |
| `gate approve`, `gate record` | `change.md`, `approvals.json`; with `--commit`, also a git commit of the change folder, `.sdd/SDD.md` and `.sdd/registry.json` only (`src/gate/commit.ts:26`) | allow |
| `stale check` | `change.md` of the changes it marks | allow |
| `task set` | the task file | allow |
| `defect add`, `defect close`, `defect reopen` | `change.md` of the change | allow |
| `archive` (without `--dry-run`) | `.sdd/_living/`, `.sdd/_archive/` | allow |
| `extract-features` | `.feature` files from the change's gherkin blocks (C001-IF-01, Could). Not implemented at baseline (no handler at `src/cli/commands.ts:507`), so it writes nothing today; the change that implements it fixes its output folder, and a folder outside `.sdd/` then needs a guard rule like §1.1 | allow |
| `serena-config` | `<data folder>/serena/serena_config.yml` | §1.1 |
| `serena-launch` | as `serena-config`, then Serena's own data under `<data folder>/serena/` | §1.1 |

Every other row writes only inside the `.sdd/` folder of the workspace that the CLI finds from its
working folder (C001-IF-01), and `gate approve --commit` adds a git commit of those `.sdd/` files
only, so the allowlist needs no rule for them.

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
| terminal | The string at `command` is decided as `{ "tool_name": "Bash" or "PowerShell", "tool_input": { "command": <command> } }` by the bash guard core in the class's dialect; `strictest` allows only when both dialects allow. The table takes the dialect of the shell that spike S-08 records for the VS Code terminal tool (C002-IF-009 §3), and `strictest` when the record names none |
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
(C002-REQ-401, C002-DEC-009), which is why the memory-category corpus cases expect `deny` on every
mechanism of a generated target (C002-REQ-625, C002-IF-009 §2).
