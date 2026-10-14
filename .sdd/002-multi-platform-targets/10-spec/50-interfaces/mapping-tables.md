---
id: C002-IF-001
artifact: spec/interface
kind: conventions
change: CHG-002
phase: 10-spec
status: draft
---

# C002-IF-001 — Target mapping tables and wiring variants

Schema: `mapping-table.schema.json` (JSON Schema 2020-12). This file fixes the semantics the schema
cannot express, the processing order of the generator (C002-COMP-001) and the initial entries the
implementation starts from. The tables and variants are data of C002-COMP-002.

## §1 Files

```text
plugins/architect/targets/
├── opencode.json                 mapping table of the OpenCode target (schema above)
├── copilot.json                  mapping table of the Copilot VS Code target
├── opencode/wiring/*.md          OpenCode wiring variants and install notes
└── copilot/wiring/*.md           Copilot wiring variants and install notes
```

- The folder is part of the source plugin (C002-CON-01; C002-REQ-111 keeps variants in the source
  plugin) and outside every `SKILL.md` body (C002-REQ-113). The Claude Code staging of
  `npm run package` leaves it out, so the Claude Code plugin package stays as before CHG-002
  (C002-CON-10, C002-TS-101).
- A table names exactly one enforcement mode (C002-INV-04). The mode and the tested versions are
  copied from the spike record named in `host.validated_by` (C002-IF-009 §3); changing either
  without a new spike record is a review finding of the release check (ERR-REL-006).
- An S-08 record that gives `deferred` is not copied: no table mode means "deferred". The record
  triggers the spec revision of `../10-context/scope.md` §1.1 (Q-defer-01), which removes the
  Copilot target, its table and its package; until then the Copilot table keeps its previous mode,
  generation and checks run as before, and the release check refuses the Copilot target
  (ERR-REL-005, C002-REQ-620).

## §2 Construct kinds

Every Claude Code construct of the glossary is found by a detector; a detector match is translated by
the rule of its kind or generation stops with ERR-GEN-001 (C002-REQ-104, C002-INV-12).

| Kind | Found in | Translation rule | OpenCode (initial) | Copilot (initial) |
|---|---|---|---|---|
| tool name | agent `tools` field | `tools` entry; an empty list drops the tool on purpose | per §6.1 | per §6.1 |
| MCP tool name | agent `tools`, skill bodies | `mcp_tool_names.target_pattern` | `serena_find_symbol` | `serena/find_symbol` (grant `serena/*` when only per-server grants exist) |
| `Agent(...)` grant | conductor `tools` | `agent_start` | `permission.task`: `"*": deny`, nine `sdd-*` specialists `allow` | `agents:` list of the nine specialists plus the `agent` tool |
| model name | agent `model` | `models` by tier; any other value is ERR-GEN-003 | from spike S-07 (provider/model id per tier) | from spike S-08 (Copilot model name per tier) |
| `effort`, `color` | agent frontmatter | `agent_fields` | `drop` (OpenCode passes unknown agent options to the provider, C002-R-001 C-08) | `drop` (no such field, C002-R-001 A-11) |
| `memory` | agent frontmatter | always dropped | dropped | dropped |
| `skills` | agent frontmatter | always inlined (§3 step 5) | inlined | inlined |
| `${CLAUDE_PLUGIN_ROOT}` | bodies, hooks, MCP | `variables` per context; in bodies only through the CLI-line variants and the template construct | body: not allowed | body: not allowed; hook command and MCP config: kept (accepted, C002-R-001 A-09) |
| `${CLAUDE_PLUGIN_ROOT}/templates/<path>` | agent and command bodies | construct `plugin-root-templates` | `sdd template show <path>` (C002-IF-007) | same |
| `${CLAUDE_PLUGIN_DATA}` | command bodies | `variables` | `--user-data` (C002-IF-007) | same |
| `$ARGUMENTS` | command bodies | `variables` | kept (OpenCode supports it, C002-R-001 C-08) | "the text P-01 typed after the command" (C002-R-001 A-10) |
| `architect:` agent reference | bodies, descriptions | `references.agent` | prefix `architect:` removed (`sdd-critic`) | prefix `architect:` removed |
| `/architect:<name>` command reference | bodies, README excerpts | `references.command` | `/architect:` → `/architect-` (avoids the built-in `/new` and `/init`) | `/architect:` → `/` unless spike S-08 shows a collision, then `/architect-` |
| `claude --agent` guard line | line 6 of every command | construct `guard-line`, `drop_line` (the `agent` field binds the command, C002-REQ-203, C002-REQ-303) | dropped | dropped |
| AskUserQuestion | bodies | construct `ask-user-question` | "the `question` tool" | "the `vscode/askQuestions` tool" |
| TaskCreate, TaskUpdate, TaskList | conductor body | construct `task-tools` | "the `todowrite` tool" | "the `todo` tool" |
| ToolSearch | bodies | construct `tool-search` | "(MCP tools are loaded at start)" | same |
| CLI invocation line | `sdd-conventions` l.13, `sdd-conductor.md` l.19, `sdd-auditor.md` l.13 | `variant_required` (C002-REQ-111) | variant | variant |
| Claude Code host probe `claude --version` | `doctor.md` l.21 and l.33; the other host-row lines (the probe list at l.12, the code-discovery toolchain section) are anchors of the same variants (§3 step 3) | construct `claude-host`, `variant_required` (C002-REQ-111, C002-REQ-112) | variant with the OpenCode host row (C002-IF-006) | variant with the VS Code with GitHub Copilot Chat host row |
| `Bash` in prose | agent bodies | construct `bash-prose`, `replace.by_mode` | native: "the `bash` tool"; server: "the `sdd-shell` command tool" | server: "the `sdd-shell` command tool"; hooks: "the terminal tool" |

Agents and commands take variants by the same mechanism as the skills' wiring sections
(C002-REQ-111, C002-REQ-112): the CLI invocation lines of `sdd-conductor.md` and `sdd-auditor.md`,
the host rows of `doctor.md` and of the code-discovery toolchain section (C002-IF-006). Mentions of
AskUserQuestion outside a wiring section (`sdd-conductor.md` l.61, l.66; `archive.md` l.15) are the
construct `ask-user-question` (C002-REQ-118); template paths the construct `plugin-root-templates`
(C002-REQ-115); the `${CLAUDE_PLUGIN_DATA}` argument of the Serena step the variable rule
(C002-REQ-116).

## §3 Processing order

For each target named on the command line, on the neutral model built once from the source plugin:

1. Validate the table against the schema (ERR-GEN-004) and the semantic rules of §5.
2. Apply the variants: replace each anchor's section or line block by the variant text; an anchor
   that is not found is ERR-GEN-005.
3. Check coverage. The wiring anchors of the source plugin are: every heading "Claude Code wiring",
   every line matched by a `variant_required` detector, and every anchor that a `variants` entry of
   any generated target's table names (so an anchor declared for one target is required for every
   target). Each wiring anchor that no variant of this target replaced is ERR-GEN-002 for this target,
   naming the file, the anchor's first line and the target (C002-REQ-112, C002-TS-119, C002-TS-120).
4. Translate the frontmatter structurally (name, description, model, tools, agent start, effort,
   color, memory, mode flags); an unknown tool or model value is ERR-GEN-001 or ERR-GEN-003.
5. Inline the bodies of the agent's preloaded skills, each after steps 2–3, in the order of the
   source `skills` field, under a heading per skill (C002-REQ-109).
6. Apply the `constructs` in array order and the `references` and `variables` rules to every body.
7. Resolve the tokens of §4 (ERR-GEN-006).
8. Scan the result with every detector; a match outside the construct's `accepted_in` contexts is
   ERR-GEN-001 with the source file and line (no leak, C002-INV-12).
9. Emit the host files of C002-IF-005 and the generation manifest.

Errors are collected over all files and targets of the run and printed sorted by file, line and
target; the exit code is 1 if any error was found (C002-IF-004).

## §4 Tokens in variant files

| Token | Value |
|---|---|
| `{{host_name}}` | `host.name` |
| `{{tested_version:<part>}}` | `host.tested_versions.<part>` (`opencode`, `vscode`, `copilot-chat`) |
| `{{package_version}}` | version of the source plugin, which is also the `architect-sdd` version of the same run (C002-INV-11) |
| `{{enforcement_mode}}` | glossary name of the table's enforcement mode |
| `{{server_files}}`, `{{server_shell}}` | host names of the sdd MCP server tools (for example `sdd-files_write_file` or `sdd-files/*`) |

## §5 Semantic rules (checked in §3 step 1)

- Every tool name of every source agent's `tools` field has a `tools` entry, and every
  `by_mode` entry covers the table's enforcement mode.
- `Write` and `Edit` map to generic edit tools only under `native-permissions` and
  `copilot-hooks`; under `sdd-mcp-server` they map to the `sdd-files` tools, and `Bash` maps to the
  `sdd-shell` tool (C002-REQ-209, C002-REQ-210, C002-REQ-306, C002-REQ-307).
- `sdd-files` and `sdd-shell` are declared only in mode `sdd-mcp-server`.
- With `mcp_tool_names.grant` = `per-server`, the tools of one server are granted together; the two
  server profiles keep the write tools and the command tool separately grantable (C002-IF-002 §2).
- Every variant file exists and every variant `id` is unique.

## §6 Initial entries (informative)

The implementation writes the tables from these entries and from the spike records; values marked
"S-07" or "S-08" are taken from the record of that spike. Tests read the expected values from the
tables, never from this list (C002-CAP-01 acceptance, verification note).

### §6.1 Tools

| Claude Code tool | OpenCode, native | OpenCode, server | Copilot, server | Copilot, hooks |
|---|---|---|---|---|
| Read | `read`, `list` | `read`, `list` | `read/readFile` (S-08) | `read/readFile` (S-08) |
| Glob | `glob` | `glob` | `search/fileSearch` (S-08) | `search/fileSearch` (S-08) |
| Grep | `grep` | `grep` | `search/textSearch` (S-08) | `search/textSearch` (S-08) |
| Write | `write` | `sdd-files_write_file` | `sdd-files/*` | edit tool set (S-08) |
| Edit | `edit` | `sdd-files_replace_text` | `sdd-files/*` | edit tool set (S-08) |
| Bash | `bash` | `sdd-shell_run_command` | `sdd-shell/*` | terminal tool (S-08) |
| WebSearch | `websearch` | `websearch` | dropped unless S-08 finds a web search tool | same |
| WebFetch | `webfetch` | `webfetch` | `web/fetch` | `web/fetch` |
| LSP | `lsp` (S-07) | `lsp` (S-07) | usages tool (S-08) | same |
| ToolSearch | dropped | dropped | dropped | dropped |
| AskUserQuestion | `question` | `question` | `vscode/askQuestions` | `vscode/askQuestions` |
| TaskCreate, TaskUpdate, TaskList | `todowrite`, `todoread` | same | `todo` (S-08) | same |
| Skill | `skill` | `skill` | dropped (skills are inlined) | dropped |

An agent without AskUserQuestion receives no question tool (C002-REQ-108, C002-TS-114).

**Closed tool set.** A grant lists only the tools above; every other tool of the host stays off for
the Architect agents. On Copilot VS Code an agent's or prompt file's `tools` list is an allowlist,
so a tool of an adopter's MCP server is never granted (spike S-08, `subagent_tool_list_confined`).
OpenCode allows most tools by default, including the tools of the adopter's own MCP servers and
plugins, which `permission.edit` does not govern (C002-R-001 C-01). The OpenCode agent entry of each
Architect agent therefore starts its tool map with a catch-all entry that turns every tool off
(`"*": false`) and then turns on only the derived tools (C002-IF-005 §2; C002-REQ-108, C002-TS-133);
TGT-TOOLS-001 checks it.
[ASSUMPTION: S-07 — OpenCode honours the catch-all tool entry for every tool, adopter MCP and plugin tools included, and a named entry overrides it (outcome agent_tools_closed)]
Spike S-07 records the outcome (C002-IF-009 §3). The catch-all decides in both enforcement modes, so a record with
`agent_tools_closed: false` leaves the tool set open whichever mode the replay selects: it triggers
a revision of this spec with P-01, and until that revision the release check refuses the OpenCode
target with ERR-REL-013 (C002-IF-009 §3, §5).

### §6.2 MCP servers

| Server | Transport | Command or URL | Modes |
|---|---|---|---|
| context7 | http | `https://mcp.context7.com/mcp` | all |
| deepwiki | http | `https://mcp.deepwiki.com/mcp` | all |
| serena | stdio | `sdd serena-launch --user-data --read-only -- start-mcp-server --context <S-07 or S-08> --mode planning --project . --enable-web-dashboard False --open-web-dashboard False` | all |
| sdd-files | stdio | `sdd-mcp --profile files` | `sdd-mcp-server` |
| sdd-shell | stdio | `sdd-mcp --profile shell` | `sdd-mcp-server` |

### §6.3 OpenCode permission rules

| Mode | `edit` | `bash` |
|---|---|---|
| native-permissions | `"*": deny`, then `.sdd/*`: allow (the string OpenCode matches is fixed by S-07, C002-R-001 C-02, C-03) | `"*": deny`, then `allow` rules for the forms the generated agents send (`sdd *`, `git <read verb> *` for each read verb, the ripwire read verbs, `ast-grep run *`, the version probes as exact strings, the pipe-only entries as S-07 shows OpenCode evaluates piped parts), then `deny` rules for the forms the guard refuses that a glob can name (below); no rule for the script form `node <path>/sdd.mjs` |
| sdd-mcp-server | `deny` | `deny` |

Other keys in both modes: `external_directory: deny`, `question: allow` for the conductor and
`deny` for the specialists, `skill: deny` (skills are inlined), `webfetch` and `websearch` as the
agent's tools allow.

**What a glob cannot express.** OpenCode matches a `bash` rule as a wildcard pattern against the
command text, `*` crosses `/` and spaces, and the last matching rule wins (C002-R-001 C-01, C-02). The
bash guard core of C002-IF-008 §1 also decides on arguments, which a pattern cannot always follow:

| Guard rule | Glob form in the OpenCode table | Gap |
|---|---|---|
| script form `node <path>/sdd.mjs` (no `sdd.mjs` under `.sdd/`, no expansion characters, no node options before the script) | none: the generated agents call bare `sdd` (C002-GOAL-04) | allowed script-form cases are denied (false denies) |
| Serena data folder outside the repository (C002-REQ-517, C002-IF-008 §1.1) | `sdd serena-config *` and `sdd serena-launch *` denied, then `sdd serena-config --user-data` and `sdd serena-launch --user-data *` allowed | the repository is unknown when the package is generated, so a positional folder outside it is denied (false denies) |
| git output options (`-o`, `--output…`, `-O…`, `--open-files-in-pager`, `--ext-diff`) | `git * -o *`, `git * --output*`, `git * -O*`, `git * --open-files-in-pager*`, `git * --ext-diff*` denied | spellings a pattern misses are false allows that the replay finds |
| `--cwd` of a writing `sdd` subcommand only with a folder at or under the repository root (C002-REQ-521, C002-IF-008 §1.2) | `sdd *--cwd*` denied, written after every `allow` rule of an `sdd` form, the Serena `--user-data` rules included (the last matching rule wins) | the repository root is unknown when the package is generated, so every `sdd` command with `--cwd` is denied, also with a folder inside the root and for subcommands that write no file (false denies; for example the inside-root `--cwd` case of C002-REQ-607); no false allow |
| ripwire: one read verb, bounded flags only (C001-IF-14 §2) | one `allow` rule per read verb (`ripwire *--for=*`, `ripwire *--situ*`, …); any other ripwire command falls to the catch-all deny | a command with two read verbs or another flag still matches an `allow` rule (false allows the replay finds) |
| ast-grep `run --pattern` without rewrite flags | `ast-grep run *` allowed, then `ast-grep * --rewrite*`, `ast-grep * -r *`, `ast-grep * -U*` denied | as for git |
| PowerShell dialect (C001-IF-07 §3 PowerShell rows) | none: OpenCode has one shell tool, and the rules follow the Bash rows | PowerShell-only decisions (for example `git log` denied in PowerShell) are not reproduced |

The generator writes these rules with no `allow` rule wider than the forms the generated agents send
need; a guard rule that a glob cannot follow is a replay difference, whether it shows as a false
allow or as a false deny (C002-NFR-202 allows neither). The S-07 replay of these rules therefore
decides the OpenCode mode: `native-permissions` only with 0 differences, otherwise
`sdd-mcp-server`, under which the guard cores decide exactly (C002-REQ-209, C002-REQ-210). With the
present corpus the script-form allow cases (for example BG-001), the Serena cases with a folder
outside the repository and the inside-root `--cwd` case are expected to differ, so `sdd-mcp-server`
is the expected OpenCode mode. P-01 keeps 0 differences for these forms too (Q-safety-03, spec
round 3): no OpenCode decision stricter than the guard is accepted, and the replay alone selects
the mode.
