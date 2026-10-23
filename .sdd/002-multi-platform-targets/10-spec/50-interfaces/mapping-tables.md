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
├── mapping-table.schema.json     copy of the schema above
├── opencode.json                 mapping table of the OpenCode target (schema above)
├── copilot.json                  mapping table of the Copilot VS Code target
├── opencode/wiring/*.md          OpenCode wiring variants (§2.1)
├── opencode/install.md           OpenCode install-notes source
├── copilot/wiring/*.md           Copilot wiring variants (§2.1)
└── copilot/install.md            Copilot install-notes source
```

- The install-notes source `targets/<target>/install.md` becomes `INSTALL.md` at the root of the
  target package (`placement.install_notes`), with the tokens of §4 resolved (C002-IF-005 §5;
  revised for defect D-010 item 6: the notes are no wiring variant and have no anchor).
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
| MCP tool name | agent `tools`, skill bodies | `mcp_tool_names.target_pattern` (bodies) and `grant_pattern` (`tools` lists) | `serena_find_symbol` | body: `serena-find_symbol`, a deferred tool loaded through `tool_search_tool` (S-08 §3.2, fact F-7); grant: `serena/*` (per-server; `serena/find_symbol` per-tool works on Copilot CLI only, S-08 §2.1) |
| `Agent(...)` grant | conductor `tools` | `agent_start` | `permission.task`: `"*": deny`, nine `sdd-*` specialists `allow`; and the tool `task` turned on in the conductor's tool map (`agent_start.tools`), because the catch-all `"*": false` of §6.1 would otherwise switch off the tool that starts the specialists (revised for defect D-010 item 1) | `agents:` list of the nine specialists by bare name plus the `agent` tool (on both Copilot hosts, `docs/spikes/s08/agents/probe-parent.agent.md:5`). Unlike `Agent(...)` and `permission.task`, the list does not bound the starts: the local agent host also offered its host built-in agents (`explore`, `task`, `general-purpose`, …) to such a parent (S-08 §3), and they run with the host's tools (§3.2); their write and terminal calls are denied by the Copilot subagent guard hook in repositories with `.sdd/` (C002-IF-008 §2 rule 6; C002-REQ-327; assumptions: C002-IF-005 §3) |
| model name | agent `model` | `models` by tier; any other value is ERR-GEN-003 | opus `openrouter/anthropic/claude-opus-5.5`, sonnet `openrouter/anthropic/claude-sonnet-5.5`, haiku `openrouter/anthropic/claude-haiku-5.5` (S-07 record `host_versions.models`, §7: listed by `opencode models openrouter` on 1.18.31, accepted in a paid session on 1.15.10; the floating `~anthropic/…-latest` aliases are not used) | opus `claude-opus-5.5`, sonnet `claude-sonnet-5.5`, haiku `claude-haiku-5.5` (S-08 record, addendum of 2026-10-18: the Copilot CLI model list; §2.4 shows the default `claude-sonnet-5.5` of agents without `model`); the opus tier keeps `claude-opus-5.5` also for a plan that does not offer it, on which the host runs such an agent on its default model (P-01 answer to Q-copilot-map-01, "Keep opus, note fallback (Recommended)"; C002-IF-005 §5 Models; defect D-027) |
| `effort`, `color` | agent frontmatter | `agent_fields` | `drop` (OpenCode passes unknown agent options to the provider, C002-R-001 C-08) | `drop` (no such field, C002-R-001 A-11) |
| `memory` | agent frontmatter | always dropped | dropped | dropped |
| `skills` | agent frontmatter | always inlined (§3 step 5) | inlined | inlined |
| `${CLAUDE_PLUGIN_ROOT}` | bodies, hooks, MCP | `variables` per context; in bodies only through the CLI-line variants and the template construct | body: not allowed | not allowed in any context (`body`, `hook-command`, `mcp-config` all `null`; C002-REQ-326, C002-REQ-602): hook commands use the install token `@CLI_COPY@` (C002-IF-008 §4), and the MCP servers are workspace entries that run `sdd` and `sdd-mcp` from PATH. The construct `plugin-root` also detects `${PLUGIN_ROOT}`, accepted nowhere (S-08 §3, fact F-3), whatever follows it, `/templates/` and `/scripts/sdd.mjs` included: the construct leaves out those two spellings only for `${CLAUDE_PLUGIN_ROOT}`, whose spellings the constructs `plugin-root-templates` and `cli-invocation` own, and no construct owns a `${PLUGIN_ROOT}` spelling, so `${PLUGIN_ROOT}/scripts/sdd.mjs` is a leak in every context (revised for defect D-013 item 1) |
| `${CLAUDE_PLUGIN_ROOT}/templates/<path>` | agent and command bodies | construct `plugin-root-templates` | `sdd template show <path>` (C002-IF-007) | same |
| `${CLAUDE_PLUGIN_DATA}` | command bodies | `variables` | `--user-data` (C002-IF-007) | same |
| `$ARGUMENTS` | command bodies | `variables` | kept (OpenCode supports it, C002-R-001 C-08) | "the text P-01 typed after the command" (C002-R-001 A-10) |
| `architect:` agent reference | bodies, descriptions | `references.agent` | prefix `architect:` removed (`sdd-critic`) | prefix `architect:` removed. Copilot CLI names a plugin agent `<plugin>:<agent>` on its command line and in hook input (`architect:sdd-critic`, the package's plugin name being `architect`; S-08 §2.3, fact F-6); only the eval runner (C002-IF-010 §2) and the hook commands (C002-IF-007) use that form |
| `/architect:<name>` command reference | bodies, README excerpts | `references.command` | `/architect:` → `/architect-` (avoids the built-in `/init`: OpenCode 1.18.31 has the built-in commands `init`, `review` and `customize-opencode`, no `new`, and only `init` shares a name with a source command; C002-TS-226, revised for defect D-011 item 1) | `/architect:` → `/` unless the manual VS Code checklist shows a collision (the S-08 record does not cover prompt files; C002-REQ-317), then `/architect-` |
| `claude --agent` guard line | line 6 of every command | construct `guard-line`, `drop_line` (the `agent` field binds the command, C002-REQ-203, C002-REQ-303) | dropped | dropped |
| conductor start `(claude --agent architect:sdd-conductor)` | conductor `description` | construct `conductor-start`, context `frontmatter`, `replace` | "(select the `sdd-conductor` primary agent: press Tab until it is selected, or start `opencode --agent sdd-conductor`)" | "(select `sdd-conductor` as the session agent in the Chat agent picker of a Local session)" |
| host list of the doctor `(node, git, Claude Code, ripwire, Serena, ast-grep, Context7, DeepWiki)` | `doctor.md` `description` | construct `doctor-description`, context `frontmatter`, `replace` (decided for defect D-010 item 4, below) | "(node, git, OpenCode, ripwire, Serena, ast-grep, Context7, DeepWiki, sdd CLI)" | "(node, git, VS Code with GitHub Copilot Chat, ripwire, Serena, ast-grep, Context7, DeepWiki, sdd CLI, Copilot hooks)" |
| AskUserQuestion | bodies | construct `ask-user-question` | "the `question` tool" | "the `ask_user` tool" (S-08 §3.2, fact F-5) |
| TaskCreate, TaskUpdate, TaskList | conductor body | construct `task-tools` | "the `todowrite` tool" | "the `todo` tool" |
| ToolSearch | bodies | construct `tool-search` | "(MCP tools are loaded at start)" | "the `tool_search_tool` tool (MCP tools are deferred: load a `<server>-<tool>` tool through it before its first call)" (S-08 §3.2) |
| CLI invocation line | `sdd-conventions` l.13, `sdd-conductor.md` l.19, `sdd-auditor.md` l.13 | `variant_required` (C002-REQ-111) | variant | variant |
| Claude Code host probe `claude --version` | `doctor.md` l.21 and l.33; the other host-row lines (the probe list at l.12, the code-discovery toolchain section) are anchors of the same variants (§2.1, §3 step 3) | construct `claude-host`, `variant_required` (C002-REQ-111, C002-REQ-112) | variant with the OpenCode host row (C002-IF-006) | variant with the VS Code with GitHub Copilot Chat host row |
| `Bash` in prose | agent bodies | construct `bash-prose`, `replace.by_mode` | native: "the `bash` tool"; server: "the `sdd-shell` command tool" | server: "the `sdd-shell` command tool"; hooks: "the terminal tool" |
| `Glob` in prose (the Glob tool named in a body; today `sdd-conventions` l.16) | agent, command and skill bodies | construct `glob-prose`, kind `tool-name`, `detect` `\bGlob\b`, `variant_required` (decided for defect D-020 item 1). The detector matches the whole, case-sensitive word `Glob` only, as `bash-prose` matches `Bash` (revised for critic CR-67): `Global` (`commands/init.md:26`, the `## Global items` heading of the dod-catalogue skill) and the host tool name `glob` do not match. Every matched line is a wiring anchor (§3 step 3), so a text that tells agents to glob gets a variant on every target or stops generation with ERR-GEN-002 | variant `file-inspection` (§2.1): `.sdd/` files are found with `sdd status` and `read`, never with `glob` (§6.1 Dot folders) | variant `file-inspection` with the same finding rule, as a precaution (§6.1 Dot folders) |

Agents and commands take variants by the same mechanism as the skills' wiring sections
(C002-REQ-111, C002-REQ-112): the CLI invocation lines of `sdd-conductor.md` and `sdd-auditor.md`,
the host rows of `doctor.md` and of the code-discovery toolchain section (C002-IF-006). Mentions of
AskUserQuestion outside a wiring section (`sdd-conductor.md` l.61, l.66; `archive.md` l.15) are the
construct `ask-user-question` (C002-REQ-118); template paths the construct `plugin-root-templates`
(C002-REQ-115); the `${CLAUDE_PLUGIN_DATA}` argument of the Serena step the variable rule
(C002-REQ-116).

**Frontmatter text** (decided for defect D-010 item 4). Variants replace body text only (§3 step 2).
A Claude Code mention in a text field of the frontmatter (`description`, `argument-hint`) is
therefore a construct of context `frontmatter` with a `replace` action, the mechanism the table
already uses for the conductor start (`conductor-start`): each table writes its own replacement
text, and the tokens of §4 are not resolved there. The doctor description gets the construct
`doctor-description` on both targets, so its host list names the target's host and the generated
rows (C002-IF-006 §1). Both constructs have a stand-in detector in the generator, as every
construct of the glossary has, so a table without the entry stops generation with ERR-GEN-001 on
the description instead of leaving the Claude Code text (C002-REQ-104). No other frontmatter text of
the source plugin names Claude Code; model names are translated by `models` (step 4).

### §2.1 Wiring anchors

The anchors of the `variants` entries. Both tables name the same fourteen variants; by §3 step 3
each anchor is required for every generated target. A `lines` anchor is matched exactly against
the source text; tests take the anchors from the tables, never from this list (revised for defect
D-010 item 4: the gate-protocol reference line, the task-tools remedies row and the doctor probe
and report blocks were used by the tables but not listed here; revised for defect D-020 item 1:
the variant `file-inspection` added).

| Variant `id` | Source file | Anchor | The variant holds |
|---|---|---|---|
| `cli-conductor` | `agents/sdd-conductor.md` | line: the CLI invocation line (`The CLI is …`) | the target's CLI line (construct `cli-invocation`, C002-REQ-111) |
| `cli-auditor` | `agents/sdd-auditor.md` | line: the end of the command-form sentence that names `sdd` | the same |
| `cli-conventions` | `skills/sdd-conventions/SKILL.md` | line: `` `sdd` means … `` | the same |
| `file-inspection` | `skills/sdd-conventions/SKILL.md` | lines: the three lines of the file-inspection rule, from `Inspect files with the Grep, Glob and Read tools, not Bash (…` to `` no `;`, `&&` or redirection. `` (the lines that the construct `glob-prose` matches, l.16, and the two lines of the same sentence pair) | the target's tools for inspecting files instead of a shell (OpenCode `read`, `glob`, `grep`; Copilot `read`, `search`), the command-tool rule in the target's names for every mode (allowlisted commands only, one per call, no `;`, `&&` or redirection) and the dot-folder rule of §6.1 (how `.sdd/` files are found); the text names neither Glob nor Bash, which the constructs would match again (§3 step 8) |
| `doctor-probe` | `commands/doctor.md` | lines: the six lines of step 2 (Probe) | the rows and probes of C002-IF-006 §1, §2, the host probe through `sdd host-version {{host_version_arg}}`; on OpenCode also the test for `.sdd/` by `sdd status` or `read` of `.sdd/`, never by `glob` (§6.1 Dot folders; revised for defect D-020 item 1) |
| `doctor-report` | `commands/doctor.md` | lines: the eleven lines of steps 3 and 4 (Report, Outcome) | the statuses of C002-IF-006 §2, the `.cmd`-shim rule, the fallbacks and the outcome lines of §3 |
| `doctor-remedies-host` | `commands/doctor.md` | line: the Claude Code row of the remedies table | the host, sdd CLI and native ast-grep rows; on Copilot also the Copilot hooks row |
| `doctor-remedies-task-tools` | `commands/doctor.md` | line: the Task tools row of the remedies table (`CLAUDE_CODE_ENABLE_TODO_TOOLS`) | the row of the host's todo tool (`todowrite`, `todo`) |
| `code-discovery-toolchain` | `skills/code-discovery/SKILL.md` | lines: the five lines of the toolchain record item | the toolchain record rows of C002-IF-006 §1 (C002-REQ-507) |
| `code-discovery` | `skills/code-discovery/SKILL.md` | section "Claude Code wiring" | the target's code-discovery wiring |
| `gate-protocol-reference` | `skills/gate-protocol/SKILL.md` | line: `The presentation goes into the gate question itself (see Claude Code wiring), …` | the same sentence naming the target's wiring section (`{{host_name}} wiring`) |
| `gate-protocol` | `skills/gate-protocol/SKILL.md` | section "Claude Code wiring" | the gate through the host question tool |
| `interview-protocol` | `skills/interview-protocol/SKILL.md` | section "Claude Code wiring" | the interview through the host question tool |
| `research-protocol` | `skills/research-protocol/SKILL.md` | section "Claude Code wiring" | the research wiring |

A variant applies to every enforcement mode of its target: the table has one variant per anchor,
not one per mode. Text that depends on the mode uses the token `{{enforcement_mode}}` or states the
rule for every mode; the `.cmd`-shim rule of `doctor-report`, for example, is printed in every
mode and names the package's mode (C002-IF-006 §2).

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
| `{{host_version_arg}}` | the argument of `sdd host-version` (C002-IF-007) that reads the target's host: `opencode` on OpenCode; on Copilot `vscode-insiders` when `host.tested_versions.vscode` ends in `-insider` (the Insiders build that S-08 tested), else `vscode` (C002-IF-006 §2; revised for defect D-012) |
| `{{tested_version:<part>}}` | `host.tested_versions.<part>` (`opencode`, `vscode`, `copilot-chat`) |
| `{{package_version}}` | version of the source plugin, which is also the `architect-sdd` version of the same run (C002-INV-11) |
| `{{enforcement_mode}}` | glossary name of the table's enforcement mode |
| `{{server_files}}`, `{{server_shell}}` | host names under which an agent calls the sdd MCP server tools (`sdd-files_write_file` on OpenCode, `sdd-files-write_file` on Copilot) |

## §5 Semantic rules (checked in §3 step 1)

- Every tool name of every source agent's `tools` field has a `tools` entry, and every
  `by_mode` entry covers the table's enforcement mode.
- `Write` and `Edit` map to generic edit tools only under `native-permissions` and
  `copilot-hooks`; under `sdd-mcp-server` they map to the `sdd-files` tools, and `Bash` maps to the
  `sdd-shell` tool (C002-REQ-209, C002-REQ-210, C002-REQ-306, C002-REQ-307). Under `copilot-hooks`
  the generator grants the conductor and every prompt file the `sdd-mcp-server` mapping of Write,
  Edit and Bash instead of the mode's entry (C002-REQ-321).
- `sdd-files` and `sdd-shell` are declared in mode `sdd-mcp-server` on both targets, and also in mode
  `copilot-hooks` on Copilot (C002-REQ-307, C002-REQ-321).
- With `mcp_tool_names.grant` = `per-server`, the tools of one server are granted together; the two
  server profiles keep the write tools and the command tool separately grantable (C002-IF-002 §2).
- Copilot: `mcp_tool_names.target_pattern` is `{server}-{tool}`, `grant_pattern` is
  `{server}/{tool}` and `deferred` is `true` (S-08 §2.1, §3.2, fact F-7; this replaces the `x/y`
  body form of ideation §8). OpenCode: no `grant_pattern` (grants use `target_pattern`), `deferred`
  `false`.
- Every variant file exists and every variant `id` is unique.
- OpenCode: `permissions.<mode>.question` is `deny` or absent. The `question` rule is written per
  agent: `allow` for each agent whose source `tools` holds AskUserQuestion, which is the conductor
  alone, and `deny` for every other Architect agent (C002-REQ-217, C002-REQ-108; TGT-PERM-001).

## §6 Initial entries (informative)

The implementation writes the tables from these entries and from the spike records; values marked
"S-07" or "S-08" are taken from the record of that spike. Tests read the expected values from the
tables, never from this list (C002-CAP-01 acceptance, verification note).

### §6.1 Tools

| Claude Code tool | OpenCode, native | OpenCode, server | Copilot, server | Copilot, hooks |
|---|---|---|---|---|
| Read | `read` | `read` | `read` (host tool `view`, S-08 §2.1, §3.1) | `read` |
| Glob | `glob` | `glob` | `search` (host tools `grep`, `glob`, S-08 §3.1) | `search` |
| Grep | `grep` | `grep` | `search` | `search` |
| Write | `write` | `sdd-files_write_file` | `sdd-files/*` | `edit` (host tools `create`, `edit`, S-08 §3.1) |
| Edit | `edit` | `sdd-files_replace_text` | `sdd-files/*` | `edit` |
| Bash | `bash` | `sdd-shell_run_command` | `sdd-shell/*` | `execute` (host PowerShell tools, S-08 §2.2, §3.1) |
| WebSearch | `websearch` (offered only with `OPENCODE_ENABLE_EXA`, S-07 F-1) | same | dropped (no web search tool in the S-08 record) | same |
| WebFetch | `webfetch` | `webfetch` | `web/fetch` | `web/fetch` |
| LSP | `lsp` (offered only with `OPENCODE_EXPERIMENTAL_LSP_TOOL`, S-07 F-1) | same | usages tool (not in the S-08 record) | same |
| ToolSearch | dropped | dropped | dropped (the host adds `tool_search_tool` to every agent, S-08 §3.2) | dropped |
| AskUserQuestion | `question` | `question` | `ask_user` | `ask_user` |
| TaskCreate, TaskUpdate, TaskList | `todowrite` | same | `todo` (not in the S-08 record) | same |
| Skill | `skill` | `skill` | dropped (skills are inlined) | dropped |

**OpenCode tools at the tested version** (revised for defect D-009; `docs/spikes/S-07-opencode.md`
§0, §2, §7, fact F-1, OpenCode 1.18.31). OpenCode offers `bash`, `edit`, `glob`, `grep`, `read`,
`skill`, `task`, `todowrite`, `webfetch` and `write` by default, and `question` where an agent's
permission allows it. It has no `list` and no `todoread` tool (`glob` lists files, `todowrite`
returns the list it writes), so neither is granted. `websearch` and `lsp` exist only when the
environment sets `OPENCODE_ENABLE_EXA=1` or `OPENCODE_EXPERIMENTAL_LSP_TOOL=1`. A grant that names a
tool the host does not offer is no error (S-07 §2). Without these variables the researcher and the
options analyst search through `webfetch` (and the researcher also through Context7 and DeepWiki),
and the cartographer reads code through Serena. The corpus replay and the evals run without them.

**Dot folders** (revised for defect D-020 item 1; P-01 answer to Q-opencode-glob-01, "Guide agents
(Recommended)"). OpenCode 1.18.31 lists files for `glob` through ripgrep without `--hidden`, so a
`glob` searched from the project root never lists a file inside a dot folder: `.sdd/*`,
`.sdd/_constitution/*` and `.sdd/002-coupon-codes/**/*` return `No files found` while the files
exist, and a session that trusts the result decides that the repository has no `.sdd/` (C002-TS-511
failed so in C002-T-056: result `evals/results/t056-TS-511-opencode-2026-10-20T09-02-41-214Z.json`;
its transcript, like every transcript under `evals/results/transcripts/`, is kept outside version
control). Two forms reach `.sdd/` on that version: `read` of a folder returns its entries, dot
folders included (`<type>directory</type>`; C002-T-056 sessions TS-219 and TS-510, result
`evals/results/t056-TS-219-opencode-2026-10-19T22-04-35-876Z.json`), and `glob` with `path` set to a
folder inside `.sdd/` lists that folder's files (session TS-217, result
`evals/results/t056-TS-217-opencode-2026-10-19T22-03-27-554Z.json`, where the same folder given in the
pattern, `.sdd/002-coupon-codes/**/*`, listed nothing). The generated OpenCode texts therefore find
`.sdd/` files without `glob`:

- whether `.sdd/` exists, and which changes and phases it holds: `sdd status` (run through `bash`, or
  through `{{server_shell}}` under sdd MCP server enforcement), or `read` of `.sdd/`;
- one file: `read` of its path, taken from the workspace layout of the sdd-conventions skill; the
  files of a folder: `read` of that folder;
- text inside `.sdd/`: `grep` with `path` naming a folder or a file inside `.sdd/`
  [ASSUMPTION: D-020 — OpenCode's grep runs the same ripgrep as glob (S-07 §4), so a grep from the project root leaves .sdd/ out and one whose path lies inside .sdd/ searches it, as glob with such a path does; the T-056 transcripts hold one such grep, without a match, and the T-056 re-run of the carried rows confirms it];
- never `glob` to find or to rule out a `.sdd/` file; an empty `glob` or `grep` result is never
  taken as proof that `.sdd/` or a file in it is absent.

The variant `file-inspection` (§2.1) carries this rule into every Architect agent, since all ten
preload the sdd-conventions skill (§3 step 5), and the OpenCode `doctor-probe` variant tests for
`.sdd/` the same way. The construct `glob-prose` (§2) keeps it so: a later source line that names the
Glob tool in a body (the whole, case-sensitive word `Glob`) is a wiring anchor that needs a variant
on every target. `glob` itself stays
granted on OpenCode, for the code outside dot folders (the layer ladder of the code-discovery skill).

**Copilot: not recorded.** The S-08 record lists `glob` and `grep` among the host tools that a
`search` grant gives (§3.1) and shows `Glob` hook inputs on folders without a dot segment
(`docs/spikes/s08/logs/hooks.jsonl`), but no result of a search over a dot folder; the seven
Copilot CLI sessions of C002-T-045 made no `glob` or `grep` call (`evals/results/t045-*.json`: their
tool calls were `sdd-shell-run_command`, `task`, `view` and `sdd-files-write_file`). Whether the Copilot hosts list `.sdd/` through `search` is
therefore unknown. The Copilot variant `file-inspection` states the same finding rule in the Copilot
names (`sdd status` through the command tool of the mode, `read` of a file by its path, no
conclusion from an empty `search` result), as a precaution that costs a few lines of prompt text; a
spike record or a checklist step that shows the host's search tools listing `.sdd/` may relax it.

Copilot entries are `tools` grant names; the S-08 probes granted `read`, `search`, `edit` and
`execute` and recorded the host tools they gave (`docs/spikes/s08/agents/`, record §2.1, §2.2,
§3.1). [ASSUMPTION: S-08 — the record names the question tool `ask_user` (§3.2) but not the tools entry that grants it, nor its input shape or its result without a choice; the generator grants `ask_user` and writes the question variants in the shape of C002-R-001 A-06 (`questions` with `header`, `question`, `options` with `recommended`, `multiSelect`, `allowFreeformInput`), and the interview and gate steps of the manual VS Code checklist confirm both (C002-REQ-614)]

An agent without AskUserQuestion receives no question tool (C002-REQ-108, C002-TS-114).

**Closed tool set.** A grant lists only the tools above; every other tool of the host stays off for
the Architect agents. On Copilot VS Code an agent's or prompt file's `tools` list is an allowlist,
so a tool of an adopter's MCP server is never granted (spike S-08, `subagent_tool_list_confined`);
the host adds only `tool_search_tool` (S-08 §3.2), and an agent without a `tools` list would get
every tool, so every generated agent has one (TGT-GRANT-001).
OpenCode allows most tools by default, including the tools of the adopter's own MCP servers and
plugins, which `permission.edit` does not govern (C002-R-001 C-01). The OpenCode agent entry of each
Architect agent therefore starts its tool map with a catch-all entry that turns every tool off
(`"*": false`) and then turns on only the derived tools (C002-IF-005 §2; C002-REQ-108, C002-TS-133);
TGT-TOOLS-001 checks it.
Spike S-07 records the outcome (C002-IF-009 §3): on OpenCode 1.18.31 the catch-all keeps an
adopter's MCP tool and a plugin tool away, and the named entries override it
(`agent_tools_closed: true`, `docs/spikes/S-07-opencode.md §2`). The catch-all decides in both enforcement modes, so a record with
`agent_tools_closed: false` leaves the tool set open whichever mode the replay selects: it triggers
a revision of this spec with P-01, and until that revision the release check refuses the OpenCode
target with ERR-REL-013 (C002-IF-009 §3, §5).

### §6.2 MCP servers

| Server | Transport | Command or URL | Modes |
|---|---|---|---|
| context7 | http | `https://mcp.context7.com/mcp` | all |
| deepwiki | http | `https://mcp.deepwiki.com/mcp` | all |
| serena | stdio | `sdd serena-launch --user-data --read-only -- start-mcp-server --context <context> --mode planning --project . --enable-web-dashboard False --open-web-dashboard False`; `<context>` is `ide` on OpenCode (S-07 §7: Serena 1.7.0 has no OpenCode context, and `ide` is the generic one for a client with its own file and shell tools); on Copilot not in the S-08 record | all |
| sdd-files | stdio | `sdd-mcp --profile files` | `sdd-mcp-server`; on Copilot also `copilot-hooks` |
| sdd-shell | stdio | `sdd-mcp --profile shell` | `sdd-mcp-server`; on Copilot also `copilot-hooks` |

On Copilot every server is written to the workspace MCP configuration `install/mcp.json` (VS Code
`servers` format, C002-IF-005 §3) and to no plugin MCP configuration: the local agent host reports
plugin servers `not_configured` and starts workspace servers (S-08 §3.2, fact F-2; C002-REQ-301,
C002-REQ-307).

### §6.3 OpenCode permission rules

| Mode | `edit` | `bash` |
|---|---|---|
| native-permissions | `"*": deny`, then `.sdd/*`: allow. OpenCode matches the target path relative to the project root, after resolving `..` and `.` segments, with either separator and, on Windows, in any letter case; a path outside the project is decided by `external_directory` first (S-07 §3.2; C002-R-001 C-02, C-03) | `"*": deny`, then `allow` rules for the forms the generated agents send (`sdd *`, `git <read verb> *` for each read verb, the ripwire read verbs and the bounded default map (ripwire rules below), `ast-grep run *--pattern*`, the version probes as exact strings, the pipe-only entries `head -n *`, `tail -n *`, `wc -l`, `sort`, `uniq`, which OpenCode evaluates as separate parts, S-07 §3.3), then `deny` rules for the forms the guard refuses that a glob can name (below); no rule for the script form `node <path>/sdd.mjs` |
| sdd-mcp-server | `deny` | `deny` |

Other keys in both modes: `external_directory: deny`, `question: allow` for the conductor and
`deny` for the specialists (C002-REQ-217: OpenCode's default for SDK and `opencode serve` sessions is
`question: deny`, S-07 §5, fact F-6), `skill: deny` (skills are inlined), `webfetch` and `websearch`
as the agent's tools allow.

**ripwire rules** (revised for defect D-024, the follow-up of CHG-001 defect D-012). The bash guard
admits two ripwire forms, the verb form and the bounded default map (C001-IF-07 §3.1). The `bash`
rules of `native-permissions` name them as follows. They are written after the `git` rules and
before the `ast-grep` rule, all of them `allow`:

| Form (C001-IF-07 §3.1) | OpenCode rules | Source in `src/hooks/guard-bash.ts` |
|---|---|---|
| verb form, value verb (`--for=<v>` …) | `ripwire *<verb>=*`, one rule per entry, in list order (`ripwire *--for=*` … `ripwire *--expand=*`) | `RIPWIRE_VALUE_VERBS` |
| verb form, flag verb (`--situ` …) | `ripwire *<verb>*`, one rule per entry, in list order (`ripwire *--test-gate*` … `ripwire *--version*`). The rule `ripwire *--test-gate*` also matches the value form `--test-gate=<file>`, which the guard counts as a verb, so the value list needs no `--test-gate` entry | `RIPWIRE_FLAG_VERBS` |
| default-map form: no verb, `--max-tokens=N` | `ripwire *--max-tokens=*`, one rule, after the verb rules | `RIPWIRE_MAP_BOUND` (below) |
| map under an other bound only (`ripwire . --token-budget=4000`) | no rule. The command matches no `allow` rule and falls to the catch-all `"*": deny`, as the guard denies it (BG-442). No `deny` rule names `--token-budget`: the verb form allows it (`ripwire . --for="payment method" --token-budget=4000`, BG-002), and such a rule would deny that form too, a false deny | — |

`bashRules()` of the generator (`scripts/generate/emit/opencode-permissions.ts`, C002-COMP-001)
writes the verb rules from the exported lists `RIPWIRE_VALUE_VERBS` and `RIPWIRE_FLAG_VERBS`, as
before. Both lists keep their present values; `--test-gate` stays out of the value list. CHG-001 kept
them unchanged for this rule set (C001-T-079). The default-map rule needs the map bound
`--max-tokens`, which neither list holds. Today it is a literal inside the guard's `ripwire()`. The
guard core therefore exports it as a third constant, `RIPWIRE_MAP_BOUND` (`"--max-tokens"`), which
both `ripwire()` and `bashRules()` read, so the generator copies no guard data (C002-CON-06). The OpenCode
table's `permissions.native-permissions.bash` list holds the same rules in the same order; a table
that differs is ERR-GEN-004 (C002-IF-004). A glob cannot hold `N` to digits: `*` matches any
characters and `?` one character, and there is no character class (C002-R-001 C-02). The guard's
other conditions on this form cannot be held either, so the rule is a gap row of the table below.

None of this changes the `sdd-mcp-server` mode, which is the OpenCode mode of the table and the
final mode of the S-07 record after the full replay (`docs/spikes/S-07-opencode.md §8`, §13). In that
mode `edit` and `bash` are `deny`, and the bash guard core decides every command of the `sdd-shell`
server exactly, the default-map form included (C002-REQ-209, C002-REQ-210, C002-IF-002 §5.2). The rules
above appear only in a package generated with `--mode opencode=native-permissions` and in the table's
native list. A package generated in the present mode does not change.

**What a glob cannot express.** OpenCode matches a `bash` rule as a wildcard pattern against the
command text, `*` crosses `/` and spaces, and the last matching rule wins (C002-R-001 C-01, C-02). It
splits a compound command and checks each part alone, but it does not check redirection targets and
lets some shell forms through (S-07 §3.3, fact F-3). An `edit` rule is matched against the path as
written, before links are resolved (S-07 §3.2, fact F-2). The guard cores of C002-IF-008 §1 and
C001-IF-07 §2 also decide on arguments and resolved paths, which a pattern cannot always follow. Rows
marked S-07 were found on OpenCode 1.18.31 by the hand-replayed sample of the spike (revised for
defect D-009); the full corpus replay settles them (C002-IF-009 §2):

| Guard rule | Glob form in the OpenCode table | Gap |
|---|---|---|
| path guard: links resolved through the real path (C001-REQ-1104) | none: the `edit` pattern sees the path as written | S-07 (F-2): a junction or symbolic link under `.sdd/` to a folder inside the project (`.sdd/link-to-src/` → `src/`) passes `.sdd/*` and writes into that folder (false allows); a link to a folder outside the project is denied, because `external_directory` is evaluated on the resolved target (1.18.31; 1.15.10 wrote outside) |
| path guard on a folder path (for example PG-048, `{repo}/.sdd/004-x/`, allowed by the guard) | none | S-07 (F-4): `write` and `edit` read the target before the permission check and fail on a folder path, which the replay reads as a deny (C002-IF-009 §2.3; a false deny) |
| redirection `>`, `>>`, `<` is GUARD-BASH-002 (C001-REQ-1107) | none: OpenCode does not check redirection targets | S-07 (F-3): `git log >> src/log.txt`, `git log < input.txt`, `git status > src/redirected.txt` are allowed and run (false allows, BG-203, BG-206) |
| a trailing `;` and arithmetic expansion `$((…))` are GUARD-BASH-002 | none | S-07 (F-3): `git status;` and `git log $((1+1))` are allowed (false allows, BG-215, BG-221); `$(…)`, `<(…)`, `;` and `\|\|` between two commands are split and denied, as the guard denies them |
| pipe position: a pipe-only entry is allowed only after `\|` (C001-IF-07 §3) | the pipe-only entries as exact patterns | S-07 (F-3): every part of a pipe is evaluated alone, so a pipe-only entry also allows the command on its own (`tail -n 5 x`, BG-176: false allow); spellings the exact patterns do not name (`head`, `head -5`, `tail -2`, `sort -r`, `uniq -c`; BG-010, BG-167, BG-170, BG-173) are false denies, and a wider pattern adds standalone false allows |
| script form `node <path>/sdd.mjs` (no `sdd.mjs` under `.sdd/`, no expansion characters, no node options before the script) | none: the generated agents call bare `sdd` (C002-GOAL-04) | allowed script-form cases are denied (false denies) |
| Serena data folder outside the repository (C002-REQ-517, C002-IF-008 §1.1) | `sdd serena-config *` and `sdd serena-launch *` denied, then `sdd serena-config --user-data` and `sdd serena-launch --user-data *` allowed | the repository is unknown when the package is generated, so a positional folder outside it is denied (false denies), and so is the literal `${CLAUDE_PLUGIN_DATA}` that the guard resolves from its environment on Claude Code (BG-374, BG-403; C002-IF-009 §2.1) |
| git output options (`-o`, `--output…`, `-O…`, `--open-files-in-pager`, `--ext-diff`) | `git * -o *`, `git * --output*`, `git * -O*`, `git * --open-files-in-pager*`, `git * --ext-diff*` denied | spellings a pattern misses are false allows that the replay finds |
| `--cwd` of a writing `sdd` subcommand only with a folder at or under the repository root (C002-REQ-521, C002-IF-008 §1.2) | `sdd *--cwd*` denied, written after every `allow` rule of an `sdd` form, the Serena `--user-data` rules included (the last matching rule wins) | the repository root is unknown when the package is generated, so every `sdd` command with `--cwd` is denied, also with a folder inside the root and for subcommands that write no file (false denies; for example the inside-root `--cwd` case of C002-REQ-607); no false allow |
| ripwire verb form: one read verb, bounded flags only (C001-IF-07 §3.1 rule 1, C001-IF-14 §2) | one `allow` rule per read verb (`ripwire *--for=*`, `ripwire *--situ*`, …; ripwire rules above); any other ripwire command falls to the catch-all deny | a command with two read verbs or another flag still matches an `allow` rule (false allows the replay finds; for example an empty `--test-gate=` or two verbs, BG-449, BG-451) |
| ripwire default-map form: no verb, at least one `--max-tokens=N` with digits-only `N`, at most one path word, and only bound and output words besides (C001-IF-07 §3.1 rule 2; revised for defect D-024) | `ripwire *--max-tokens=*` allowed (ripwire rules above); `--token-budget=N` alone matches no `allow` rule and is denied by the catch-all | the glob matches every command that starts with `ripwire ` and holds `--max-tokens=` anywhere. It therefore also allows a map command with a span-edit, write or unknown option (`ripwire . --max-tokens=4000 --edit=src/a.ts:1-2`, BG-448), with a non-digit `N` (`ripwire . --max-tokens=x`, BG-443) or with two path words (`ripwire a b --max-tokens=4000`, BG-447). These are false allows under `native-permissions`. `ripwire . --token-budget=4000` (BG-442) and `ripwire . --max-tokens` (BG-444) stay denied, as the guard denies them |
| ast-grep `run --pattern` without rewrite flags | `ast-grep run *--pattern*` allowed, then `ast-grep * --rewrite*`, `ast-grep * -r *`, `ast-grep * -U*` denied (S-07 §3.3: with `ast-grep run *`, a `run` without `--pattern` was allowed, BG-109) | as for git |
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
the mode. On OpenCode 1.18.31 the hand sample of S-07 differs in 16 of 57 shell cases and in 1 of
52 path cases plus the in-project junction probe, by the rows above, so the record's mode is
`sdd-mcp-server`, provisional until the full corpus replay (`docs/spikes/S-07-opencode.md §3`, §8).
