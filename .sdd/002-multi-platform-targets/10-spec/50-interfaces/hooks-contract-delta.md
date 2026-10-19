---
id: C002-IF-008
artifact: spec/interface
kind: hook protocol
change: CHG-002
phase: 10-spec
status: draft
---

# C002-IF-008 — Hooks contract delta (delta to C001-IF-07)

C001-IF-07 stays in force for Claude Code. This delta changes two allowlist rows, confines the two
Serena subcommands of the sdd CLI entry and confines the option `--cwd` of its writing subcommands
(the only Claude Code behaviours CHG-002 changes, C002-REQ-503, C002-REQ-517 and C002-REQ-521,
C002-GOAL-05 as widened by Q-guards-04 and Q-guards-05), denies the new subcommand `install` (no
existing decision changes, C002-REQ-325), and adds the Copilot hook input used by the Copilot
subagent guard hook in both Copilot enforcement modes, by the Copilot hooks fallback and by the
Copilot session hooks, revised for defect D-003 after spike S-08 (`docs/spikes/S-08-copilot-vscode.md
§2.2`, §2.3, §3, §3.1, §5) and after the critic's D-003 review (Q-safety-06, Q-safety-07; CR-37,
CR-38). Revised for defect D-010 (items 2 and 5: the tool shown for option-parser faults, and
`--read-only` optional for `serena-launch`) and defect D-014 (item 4: the literal
`${CLAUDE_PLUGIN_DATA}` is not expanded where the command runs without a shell). Owner:
C002-COMP-012.

## §1 Allowlist rows changed (C001-IF-07 §3)

| Entry | Allowed form (CHG-002) | Notes |
|---|---|---|
| sdd CLI | `node <path>/sdd.mjs <any subcommand>` or `sdd <any subcommand>`, except `install`, which is denied in every form (§1.2), `serena-config` and `serena-launch`, which §1.1 confines, and the option `--cwd` of a writing subcommand, which §1.2 confines | `sdd` must be the whole first word: `npx sdd …` and `sddx …` stay denied with GUARD-BASH-001 (C002-TS-504). A bare `sdd` runs the `sdd` that PATH resolves, the same trust as the `git` and `ripwire` entries. The script form keeps its rule (no `sdd.mjs` inside `.sdd/`) |
| tool versions | `node -v`, `node --version`, `git --version`, `claude --version`, `serena --version`, `ast-grep --version`, `uv --version` | exact word count: `node --version --eval 1` stays denied |

PowerShell commands from Architect agents: `node <path>/sdd.mjs …`, `sdd …` and the version probes,
written identically. Compound-command rules (C001-REQ-1107) are unchanged, so `sdd status > out.txt`
stays GUARD-BASH-002.

Deny message summary (`Allowed:` part of C001-IF-07 §4), CHG-002 text:

```text
sdd … or node <path>/sdd.mjs … (not install; serena-config and serena-launch only with --user-data or a data folder outside the repository; --cwd of a writing subcommand only with a folder inside the repository), ripwire read verbs, ast-grep run --pattern, git log|show|diff|blame|ls-files|rev-parse|status|grep, version probes (node -v, node --version, git --version, claude --version, serena --version, ast-grep --version, uv --version); head -n N, tail -n N, wc -l, sort, uniq only after |
```

The same allowlist is the source of the OpenCode `bash` rules under native permission enforcement
(C002-IF-001 §6.3, which lists the parts a glob cannot express) and the decision of the sdd MCP
server command tool (C002-IF-002 §5.2) and of the Copilot guard hooks (§2): one bash guard core
decides on every host (C002-CON-06).

### §1.1 Serena subcommands (C002-REQ-517)

A command of the sdd CLI entry is a **Serena command** when one of its words before the first `--`
is `serena-config` or `serena-launch`. The bash guard core allows a Serena command only when all of
the following hold, and otherwise denies it with GUARD-BASH-001 and the reason `sdd <subcommand> with
a data folder inside the repository (<resolved folder>)` or `sdd <subcommand> with an argument the
guard cannot resolve (<word>)`:

1. **Shape.** Before the first `--`, the words after the CLI prefix (`sdd`, or `node <path>/sdd.mjs`
   as the script form allows) are exactly the subcommand, one data-folder argument and, for
   `serena-launch` only, at most one `--read-only`, in any order. `--read-only` is optional: a
   launch without it is allowed (BG-381, `sdd serena-launch --user-data -- start-mcp-server`), since
   the data folder alone decides where the command writes; the target packages always pass it
   (TGT-SERENA-001), while the Claude Code plugin's `.mcp.json` names the read-only mode file
   itself (revised for defect D-010 item 5: the code and BG-381 allow a launch without it). Any other word there (another option such as
   `--cwd` or `--cwd=<dir>`, a second folder, a second `--read-only`, `--read-only` with
   `serena-config`) denies the command, so a Serena command never takes
   the `--cwd` that §1.2 allows inside the repository root. The words after `--` are Serena's arguments and are
   not checked: Serena keeps its project data in the data folder (C001-REQ-1013), so the data folder
   decides where the command writes.
2. **Data-folder argument.** One of:
   - `--user-data`: allowed. The CLI itself refuses a per-user data folder that cannot be determined,
     is relative or resolves inside the repository (C002-REQ-516, ERR-CLI-020, C002-IF-007).
   - the literal `${CLAUDE_PLUGIN_DATA}`, alone or in double quotes, in the Bash dialect only, and
     only where the command runs through a shell that expands it (the Claude Code Bash tool, and
     the terminal tool that the Copilot guard hook decides): the guard replaces it by the value of
     the environment variable `CLAUDE_PLUGIN_DATA` of its own process and decides that folder as
     below; an unset or empty variable denies the command. This is the spelling of step 1 of
     `commands/doctor.md` and of `commands/init.md:9` when Claude Code has not substituted the
     variable in the command text (current-state E-22). The sdd MCP server runs a command without a
     shell (C002-IF-002 §5.2), so the CLI would receive the literal text as a folder name relative
     to the repository root; the server therefore calls the core with expansion off, the literal
     is a word that holds `$` and is denied by the next item, whatever the server's environment
     holds (revised for defect D-014 item 4: before, the server's guard call expanded the literal
     from the server's environment, and the CLI then created a folder named `${CLAUDE_PLUGIN_DATA}`
     inside the repository).
     [ASSUMPTION: C002-TS-537 — Claude Code at its tested version substitutes CLAUDE_PLUGIN_DATA in the command text before the PreToolUse hook runs, or sets it in the environment of the hook process]
     The only host evidence so far is the variable's expansion in `.mcp.json`
     (`docs/spikes/S-06-skills-mcp.md:138`). C002-TS-528 stubs the variable; C002-TS-537 checks it
     on the real host under C002-DOD-022. If C002-TS-537 finds
     neither, the guard still does not allow the unresolved literal: the Serena step of
     the Claude Code doctor and init commands would be denied, against C002-REQ-623, so the
     implementing task stops and raises a spec defect against C002-REQ-517 for a revision with P-01.
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
(C002-REQ-116), and their hosts set no `CLAUDE_PLUGIN_DATA`, so the literal is denied there; on the
sdd MCP server it is denied whatever the environment holds (rule 2, expansion off).

### §1.2 Writing sdd subcommands

The subcommands of the sdd CLI that write files (C001-IF-01 and C002-IF-007, `src/cli/commands.ts:481-508`).
Every other subcommand writes no file. The guard corpora hold, for every row (the Serena rows,
`hook subagent-stop` and `install copilot` included), one case and one case with a `--cwd` folder
outside the repository root, and one writing command with a `--cwd` folder inside the root
(C002-REQ-607, C002-TS-636). The case without `--cwd` expects `allow`, except for the Serena rows,
which §1.1 decides, and the `install copilot` row, which expects `deny` with GUARD-BASH-001 in every
case, `--cwd` inside the root included, in the bare and the script form (C002-REQ-325); a case with
a `--cwd` outside the root expects `deny` with GUARD-BASH-001, by the `--cwd` rule below and, for the
Serena rows, by §1.1 rule 1 (any `--cwd` word denies a Serena command); the case inside the root
expects `allow` for the other rows.

| Subcommand | Writes | Bash guard decision |
|---|---|---|
| `init` | `.sdd/` in the nearest folder, the starting folder included, that holds `.sdd/`, else in the nearest that holds `.git/`, else in the starting folder (`src/workspace/init.ts:22-33`) | allow; `--cwd` as below |
| `change new`, `change profile`, `change revise`, `change stop` | the change folder, `.sdd/registry.json`, `.sdd/SDD.md` | allow; `--cwd` as below |
| `id next`, `id tombstone` | `ids.json` of the change | allow; `--cwd` as below |
| `status --write` | `.sdd/registry.json`, the status block of `.sdd/SDD.md` | allow; `--cwd` as below |
| `trace --write` | `trace.json`, `80-traceability.md`, `85-open-items.md` of the change | allow; `--cwd` as below |
| `hook subagent-stop` | as `trace --write`, for the active changes, when the input's agent is in its `--agents` list (it runs `trace --quiet --write --active`, C002-IF-007, C002-REQ-315) | allow; `--cwd` as below |
| `gate approve`, `gate record` | `change.md`, `approvals.json`; with `--commit`, also a git commit of the change folder, `.sdd/SDD.md` and `.sdd/registry.json` only (`src/gate/commit.ts:26`) | allow; `--cwd` as below |
| `stale check` | `change.md` of the changes it marks | allow; `--cwd` as below |
| `task set` | the task file | allow; `--cwd` as below |
| `defect add`, `defect close`, `defect reopen` | `change.md` of the change | allow; `--cwd` as below |
| `archive` (without `--dry-run`) | `.sdd/_living/`, `.sdd/_archive/` | allow; `--cwd` as below |
| `extract-features` | `.feature` files from the change's gherkin blocks (C001-IF-01, Could). Not implemented at baseline (no handler at `src/cli/commands.ts:507`), so it writes nothing today; the change that implements it fixes its output folder, and a folder outside `.sdd/` then needs a guard rule like §1.1 | allow; `--cwd` as below |
| `serena-config` | `<data folder>/serena/serena_config.yml` | §1.1 (no `--cwd`) |
| `serena-launch` | as `serena-config`, then Serena's own data under `<data folder>/serena/` | §1.1 (no `--cwd`) |
| `install copilot` | outside `.sdd/`: `.github/agents/<agent name>.agent.md`, `.github/hooks/architect-guard.json`, `.vscode/mcp.json` and `.github/architect-install.json` of the repository, and `plugin.json` and `hooks.json` of the Copilot package (C002-IF-007 §Install) | deny GUARD-BASH-001, reason `sdd install writes outside .sdd/; P-03 runs it in their own terminal`, whatever words follow `install` (C002-REQ-325) |

**Writing command.** A command of the sdd CLI entry is a writing command when the first word after
the CLI prefix (`sdd`, or `node <path>/sdd.mjs` as the script form allows), together with the second
word for the groups `change`, `id`, `gate`, `stale`, `task`, `defect` and `hook`, names a row of the
table above; a first word `install` makes it the `install copilot` row whatever the second word is,
so `sdd install`, `sdd install opencode` and `sdd install --help` are denied too. `status` and
`trace` are writing commands only when one of their words before the first `--` is `--write`;
`archive` is one unless one of those words is `--dry-run`. The CLI takes its subcommand from these
first words only (`src/cli/run.ts:33-45`).

**`--cwd` rule (C002-REQ-521).** `--cwd` is a global option of every subcommand, and the CLI resolves
it against its own working folder (`src/cli/run.ts:133`). The bash guard core allows a writing
command that carries `--cwd` only when every `--cwd` folder among its words before the first `--`,
written `--cwd <dir>` (the next word) or `--cwd=<dir>`, resolves to the repository root of §1.1
rule 3 or to a folder under it:

1. The folder is resolved against the hook input's `cwd` as §1.1 rule 2 resolves a data folder (`..`
   segments, letter case, drive letters, 8.3 short names, links through the real path of the longest
   existing prefix; C001-REQ-1104). It must lie inside the root both as written and after link
   resolution; the comparison is per path segment, so `C:/repo-data` lies outside `C:/repo`.
2. A `--cwd` with no folder word after it, or a folder word that starts with `~` or holds `$`, `%`,
   `` ` ``, `*`, `?`, `[` or `]`, cannot be resolved and denies the command.
3. Otherwise the command is denied with GUARD-BASH-001 and the reason `sdd <subcommand> with --cwd
   outside the repository (<resolved folder>)` or `sdd <subcommand> with a --cwd the guard cannot
   resolve (<word>)`.

On Claude Code and under the Copilot hooks fallback the hook input's `cwd` is the folder the command
runs in; on the sdd MCP server it is the server's root, which is also the working folder of the
command (C002-IF-002 §5.2), so the guard decides the folder the CLI will use. A command that writes
no file (for example `lint`, `status` without `--write`, `gate show`) keeps `--cwd` unrestricted
(BG-019). A folder under the root may hold a nested workspace (`<root>/pkg/.sdd/`), which the rule
allows (Q-guards-05).

**Workspace reached (critic CR-36).** With this rule a writing command other than the Serena rows
starts from a folder at or under the repository root of §1.1 rule 3, and writes only inside the
`.sdd/` of the workspace that the CLI finds upward from there: the nearest folder that holds `.sdd/`
(C001-IF-01, `src/workspace/find.ts:5-15`); for `init`, that folder, else the nearest that holds
`.git/`, which lies at or under the repository root, else the starting folder (`init` row above).
`gate approve --commit` adds a git commit of those `.sdd/` files only. When the repository holds no
`.sdd/`, the nearest `.sdd/` upward can lie above the repository root (for example `C:/Users/me/.sdd/`
above the repository `C:/Users/me/proj/`). The path guard takes the same workspace
(`src/hooks/guard-path.ts:52-53`) and so does the sdd MCP server (C002-IF-002 §3), so Claude Code,
the server and the Copilot guard hooks agree, as in CHG-001. C002-REQ-521 therefore confines
the folder the CLI starts from, not the workspace it finds. Stopping workspace discovery at the git
root would change C001-IF-01 and C001-REQ-1103 on every host, beyond C002-GOAL-05; it is an idea for
a later change.

## §2 Copilot PreToolUse input (Copilot subagent guard hook, both modes; Copilot hooks fallback)

**One command in both modes.** The Copilot target package has one PreToolUse hook command,
`sdd hook guard --host copilot --mode <mode> --agents <list> [--classes <file>]` (C002-IF-007),
`<mode>` being the enforcement mode of the Copilot mapping table (`sdd-mcp-server` or
`copilot-hooks`), written into the command by the generator. In both modes it is the Copilot
subagent guard hook (C002-REQ-327 … C002-REQ-330; Q-safety-06, Q-safety-07); under the hooks
fallback it is also the Copilot guard hook of the Architect agents (C002-REQ-308, C002-REQ-309,
C002-REQ-319, C002-REQ-320). The need: the local agent host offers its host built-in agents to a
parent beside the agents of its `agents` list, and such an agent runs with the host's tools, not
with a `tools` list of the package (S-08 §3, §3.2; C002-IF-005 §3).

**Where the hook is declared.** The same PreToolUse entry in two hooks files, both written by the
install command from `install/hooks.template.json` (C002-IF-005 §3, C002-IF-007 §Install); never in
agent frontmatter, because agent-scoped hooks do not run for a subagent's tool calls in the local
agent host (`docs/spikes/S-08-copilot-vscode.md §3.1`, fact F-4).

| Hooks file | Loaded by | Why this file |
|---|---|---|
| `<package>/hooks.json` (plugin level) | VS Code from its copy of the plugin part; Copilot CLI with `--plugin-dir` | plugin-level hooks run for every tool call of every agent and carry `agent_type` on subagent calls, in VS Code and in Copilot CLI (S-08 §2.2, §2.3, §3, §3.1) |
| `<repo>/.github/hooks/architect-guard.json` (workspace level) | the host that opens the repository | the guard is loaded wherever the workspace agents of `.github/agents/` are, also when the plugin part is not loaded, is disabled, or is a copy that VS Code took before the latest install (critic CR-38); assumptions: C002-IF-005 §3 |

When both files are loaded, the command runs twice on the same input and reaches the same
decision; a deny of either denies the call (the most restrictive decision wins, C002-R-001 A-02).
Both commands name the CLI copy by its absolute path (§4). Where that path does not exist (the
package moved or deleted, a clone on another machine), the hook errors before the CLI runs and the
host denies every tool call of the session (S-08 §3): the guard fails closed (C002-CON-08,
C002-CON-14). A plugin-level hook runs for every tool call in every repository the adopter opens
(S-08 §2.2, §3), so the command sees P-03's own chats too: it passes the session agent's calls
(rule 3) and, outside repositories with `.sdd/`, every subagent's calls (rule 6).

**Input** (S-08 §2.3, §3.1; VS Code-compatible format on both hosts). Standard input carries
`hook_event_name`, `session_id`, `timestamp`, `cwd`, `tool_name`, `tool_input`; a call made inside a
subagent also carries `agent_id`, `agent_type` and `parent_agent_id`. The session agent's own calls
carry no `agent_type` (S-08 §2.3, §3). `agent_type` is the workspace agent's name in VS Code
(`sdd-spec-writer`) and `<plugin>:<agent>` in Copilot CLI (`architect:sdd-spec-writer`). Tool names
seen in hook input: `Write` (create tool; `tool_input.path`, `tool_input.file_text`), `Bash`
(terminal tool; `tool_input.command`, `tool_input.description`), `Glob`, `Agent` (subagent start;
`tool_input.agent_type`, `description`, `name`), MCP tools as `<server>-<tool>`
(`probe-stub-stub_read`), and the host-added `tool_search_tool`. The hook name of the `edit` tool
and of the read tool is not in the S-08 record; a later spike record supplies them to the table
(C002-REQ-308 open item), and until then such a call is denied by the last row of the class table
(rule 8 for an Architect agent under the fallback, rule 6 for a non-Architect subagent).

**Caller**, read from `agent_type`:

| `agent_type` | Caller |
|---|---|
| absent (the key is missing) | the session agent (S-08 §2.3, §3) |
| a string that, with any `architect:` prefix removed, is a name of `--agents` | an Architect agent (`sdd-spec-writer` in VS Code, `architect:sdd-spec-writer` in Copilot CLI) |
| any other value: a string that names no Architect agent (a host built-in agent such as `general-purpose`, an adopter's agent, `architect:my-reviewer`), the empty string, `null`, a number or another non-string value | a non-Architect subagent (glossary; C002-REQ-327) |

**Decision order** (C002-IF-007 `hook guard`):

1. `--host` missing or other than `copilot`, `--mode` missing or not `sdd-mcp-server` or
   `copilot-hooks`, `--agents` missing or empty, or any other error of the command's options →
   deny GUARD-HOOK-001 (`hook command usage: <option>`), whatever the input, never a usage error
   without a deny decision (revised for defect D-007: `--host`); a generated command always holds
   the three (TGT-HOOK-001). A missing, unknown or empty `--host`, `--mode` or `--agents` value is
   found after standard input is read, so the message names the input's tool; a fault that the
   option parser finds first (an option without its value, an unknown option, an extra argument)
   and an internal error outside the decision stop the command before standard input is read, so
   their message names `tool call` and `<option>` is the parser's detail (accepted as the fault
   text for defect D-010 item 2; `errors.md` GUARD-HOOK-001).
2. Standard input empty, not JSON, or not a JSON object → deny GUARD-HOOK-001, whoever calls
   (C002-REQ-309, C002-REQ-328: unreadable input; no identity can be read).
3. No `agent_type` → allow, exit 0, in both modes, without reading the classes file or the file
   system (C002-REQ-320, C002-REQ-330). This covers the session agent; the conductor and its prompt
   files hold no generic edit or terminal tool in either mode (C002-REQ-306, C002-REQ-321).
4. An Architect agent's call with `--mode sdd-mcp-server` → allow, exit 0, without reading the
   classes file (C002-REQ-330): the agent is confined by its tool list (C002-REQ-306; S-08 §2.1,
   §3.1), and no guard core runs on its calls (C002-REQ-302).
5. An Architect agent's call with `--mode copilot-hooks` → rules 7 and 8.
6. A non-Architect subagent's call, in both modes (C002-REQ-327, C002-REQ-328, C002-REQ-329):
   - no `cwd`, or an empty `cwd` → deny GUARD-HOOK-001 (the repository cannot be read);
   - the workspace lookup of C001-IF-01 from `cwd` (the nearest `.sdd/` at or above it, as the path
     guard takes it, `src/workspace/find.ts:5-15`) finds none → allow, exit 0, without reading the
     classes file (C002-REQ-329); a `.sdd/` above the repository root counts as found; a lookup that
     fails → deny GUARD-HOOK-001;
   - no `tool_name`, or a classes file that cannot be read or parsed → deny GUARD-HOOK-001
     (C002-REQ-328);
   - by the class of `tool_name` in the classes file, names compared exactly, letter case included:
     `write` or `terminal` → deny GUARD-HOOK-002, whatever path or command the input holds
     (C002-REQ-327); `read_only` → allow, exit 0 (C002-REQ-329); any other tool name → deny
     GUARD-HOOK-001 (C002-REQ-328), so that a host tool the classes file does not name (the `edit`
     tool, a tool of the adopter's own MCP server, the `Agent` tool of a nested start) is never
     allowed by default.
7. An Architect agent's call with `--mode copilot-hooks` without `cwd`, with an empty `cwd` or
   without `tool_name`, or with a classes file that cannot be read or parsed → deny GUARD-HOOK-001
   (C002-REQ-309, C002-CON-08).
8. Otherwise (an Architect agent's call with `--mode copilot-hooks`) the input is mapped to the hook
   input of C001-IF-07 §1 and decided by its class. The guard cores guard only callers named
   `architect:sdd-*` (C001-IF-07 §1) and would pass any other name unchecked, so an `--agents` name
   without the `sdd-` prefix that the caller matched is denied with GUARD-HOOK-001 (`internal error:
   agent <agent> of --agents is not an sdd- agent name`) before a core runs (revised for defect
   D-007; under `--mode sdd-mcp-server` rule 4 decides such a caller):

| Field of the guard core input | Value |
|---|---|
| `agent_type` | `architect:<agent>`, `<agent>` being the input's `agent_type` with any `architect:` prefix removed (identity from the hook input, S-08 §2.3, §3.1) |
| `cwd` | `cwd` of the input |
| `tool_name`, `tool_input` | by the class of `tool_name` in the classes file (`hook_tool_classes` of C002-IF-001, written to `hooks/tool-classes.json`); names compared exactly, letter case included |

| Class | Decision |
|---|---|
| write | Every string found at the class's `paths` pointers (a `*` segment walks an array) is decided as `{ "tool_name": "Write", "tool_input": { "file_path": <path> } }` by the path guard core with the memory folder off (§5); all must be allowed. No path found → deny GUARD-HOOK-001 (`no path in the tool input (<pointers>)`). `always_deny` → deny GUARD-PATH-001 (a tool whose targets cannot be read from its input, such as a patch tool) |
| terminal | The string at `command` is decided as `{ "tool_name": "Bash" or "PowerShell", "tool_input": { "command": <command> } }` by the bash guard core in the class's dialect; `strictest` allows only when both dialects allow. The table takes the dialect of the shell that the spike record names for the terminal tool (`terminal_dialect: powershell` in the S-08 record; C002-IF-009 §3), and `strictest` when a record names none |
| read_only | allow |
| any other tool name | deny GUARD-HOOK-001 (C002-REQ-309) |

A tool name that the classes file assigns to more than one class takes the most restrictive of them,
in the order `write`, `terminal`, `read_only`, in rule 6 and in rule 8 alike, so a duplicate entry
never turns a write or terminal tool into a read-only one (revised for defect D-007). TGT-CLASS-001
keeps a generated classes file free of such duplicates (C002-IF-005 §6).

Initial classes from the S-08 record and C002-IF-002 §2 (informative; the table is the source; one
file in both modes, C002-REQ-318): `write` `{ "tool": "Write", "paths": ["/path"] }`, `{ "tool":
"sdd-files-write_file", "paths": ["/path"] }`, `{ "tool": "sdd-files-replace_text", "paths":
["/path"] }`; `terminal` `{ "tool": "Bash", "command": "/command", "dialect": "powershell" }`,
`{ "tool": "sdd-shell-run_command", "command": "/command", "dialect": "strictest" }`; `read_only`
`Glob`, `tool_search_tool` and the `<server>-<tool>` names of the read MCP servers granted to
specialists (`serena-…`, `context7-…`, `deepwiki-…`). The sdd MCP server tools are classed for rule
6: an agent without a `tools` list of the package gets the host's full tool set (S-08 §3.2), which
may hold the workspace MCP servers' tools; an Architect agent's call to them never reaches the class
table (rules 3 and 4; under the fallback only the conductor holds them, C002-REQ-321).

**Allow and deny.** Allow: exit 0, nothing on standard output or standard error. Deny (a guard
decision, GUARD-HOOK-001 or GUARD-HOOK-002): standard output holds one JSON object with the deny decision in both
forms the S-08 probe wrote (`docs/spikes/s08/hooks/deny.mjs:6`),

```json
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"<message>"},"permissionDecision":"deny","permissionDecisionReason":"<message>"}
```

standard error holds `<message>` (the guard message of C001-IF-07 §4, or the GUARD-HOOK-001 or
GUARD-HOOK-002 message), and the exit code is 2. The deny holds on both hosts without exit code 2 being passed
through: Copilot CLI on Windows reports the exit as code 1, does not use the decision on standard
output and fails closed (`Denied by preToolUse hook … (hook errored)`, S-08 §2.2, fact F-6), and the
local agent host denies a call whose hook errors (§3). The message the model sees may therefore be
the host's hook-error text rather than `<message>`. Exit 0 with a deny decision is never used: a
host that ignores the decision would run the call. The corpus replay runs the command of the
fallback package (`--mode copilot-hooks`) directly and reads exit 2 (C002-IF-009 §2.3); it feeds the
inputs of rule 7 as malformed calls (C002-REQ-630, C002-IF-009 §2.2). Rules 3, 4 and 6 decide by
caller identity and repository, not by the guard cores, so scenarios test them, not the replay
(C002-REQ-626). Hook tool names and input fields are table data, not code.

## §3 Copilot SessionStart and SubagentStop input

| Event | Fields used | Command (C002-IF-007) | Exit |
|---|---|---|---|
| SessionStart | `cwd` (else the process working folder; the SessionStart input shape is not in the S-08 record) | `hook session-start --host copilot` | always 0; brief of C001-IF-07 §4 when `.sdd/` exists, else no output (C002-REQ-313, C002-REQ-314) |
| SubagentStop | `agent_type`, `cwd` (S-08 §2.3: also `agent_id`, `agent_name`, `last_assistant_message`, `stop_reason`, …) | `hook subagent-stop --host copilot --agents …` | always 0; trace refresh for the four author agents only (C002-REQ-315) |

Plugin-level SessionStart and SubagentStop hooks run in the local agent host when their commands
hold no root token, and SubagentStop fires for workspace subagents (S-08 §3, §3.1). `agent_type` is
`sdd-planner` in VS Code and `architect:sdd-planner` in Copilot CLI; the command compares it after
removing an `architect:` prefix.

## §4 Hook command form

Every Copilot hook command is `node "<package>/scripts/sdd.mjs" <arguments>`, `<package>` being the
absolute path of the Copilot package folder with `/` separators, in double quotes, calling the CLI
copy inside the package without shell operators (C002-REQ-316, C002-REQ-326, C002-CON-14). The
generator writes the commands into `install/hooks.template.json` with the token `@CLI_COPY@` in
place of `<package>/scripts/sdd.mjs`; the install command writes the package's `hooks.json` and the
repository's workspace hook file `.github/hooks/architect-guard.json` with the token replaced
(C002-IF-007 §Install, C002-IF-005 §3). The S-08 probe's hook commands of this form ran on both
hosts (`docs/spikes/s08/hooks.json`; S-08 §3). The PreToolUse command is
`node "<package>/scripts/sdd.mjs" hook guard --host copilot --mode <mode> --agents <the ten Architect
agent names, comma-separated>` in both modes (§2).

No command holds `${PLUGIN_ROOT}` or `${CLAUDE_PLUGIN_ROOT}`: VS Code on Windows does not expand
`${PLUGIN_ROOT}` in hook commands, such a hook errors before its script runs and every tool call of
the session is then denied, while Copilot CLI does expand it (S-08 §2.3, §3, fact F-3). The
`PLUGIN_ROOT` environment variable that both hosts set for the hook process is not used: a command
that reads it needs `node -e` with quoted code, which PowerShell, `cmd.exe` and POSIX shells parse
differently (C002-REQ-316).

## §5 Memory folder option of the path guard core

The path guard core takes an option `memoryFolder` (default on). On: the allowed folders are `.sdd/`
and `.claude/agent-memory/<agent>/` as in C001-IF-07 §2 (Claude Code hooks, unchanged). Off: `.sdd/`
only, and the deny summary reads `Allowed: files under .sdd/ (Architect agents write only inside
.sdd/).` The sdd MCP server and `hook guard --host copilot` call the core with the option off
(C002-REQ-401, C002-DEC-009), which is why the memory-category corpus cases expect `deny` on every
mechanism of a generated target (C002-REQ-625, C002-IF-009 §2).
