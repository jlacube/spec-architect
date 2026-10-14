---
id: C002-SPEC-GLOSSARY
artifact: spec/glossary-delta
change: CHG-002
phase: 10-spec
status: draft
---
# C002 — Glossary delta

Terms introduced by CHG-002. `_constitution/glossary.md` does not exist yet; the terms of CHG-001
are in `.sdd/001-architect-agent-suite/10-spec/40-domain/glossary-delta.md` and are not repeated here
(Architect, conductor, specialist, author agent, Architect agent, path guard, bash guard, sdd CLI,
plugin structure check and the others listed there). At archive these terms are merged into `_constitution/glossary.md` (C001-REQ-919).

## 1. Domain terms

| Term | Definition |
|---|---|
| Host | An agent application that runs the Architect agents for P-01: Claude Code, OpenCode, or GitHub Copilot in VS Code |
| Target | A host for which a build ships an Architect package. Claude Code is the source target; OpenCode and Copilot VS Code are the generated targets (C002-DEC-004) |
| Generated target | OpenCode or Copilot VS Code: a target whose package the generator writes from the source plugin |
| Copilot VS Code | GitHub Copilot Chat in Visual Studio Code, using its local agent harness. Copilot CLI and the Copilot cloud agent are not targets (C002-NG-01) |
| Source plugin | `plugins/architect`, the Claude Code plugin; the only source of every target package (C002-DEC-006) |
| Target package | The generated output for one generated target, under `dist/opencode/` or `dist/copilot/` |
| Generator | The build step that reads the source plugin into the neutral model and writes one target package per generated target |
| Neutral model | The target-independent representation of the source plugin's agents, commands, skills, hooks and MCP servers that the generator builds before writing any target package |
| Mapping table | A per-target table the generator uses to translate Claude Code tool names, MCP tool names, model names and variables (`${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}`, `$ARGUMENTS`); also called the translation table. File `plugins/architect/targets/<target>.json`, contract C002-IF-001 |
| Wiring variant | A per-target version of a skill's "Claude Code wiring" section, of a CLI invocation line, or of another wiring anchor of an agent, command or skill (such as the host rows of the doctor command), kept in the source plugin under `targets/` and selected by the generator |
| CLI invocation line | A line of an agent, command or skill body that defines `sdd` as `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"` (`skills/sdd-conventions/SKILL.md:13`, `agents/sdd-conductor.md:19`, `agents/sdd-auditor.md:13`) |
| Skill inlining | Copying an agent's preloaded skills into that agent's generated body (C002-DEC-002) |
| Write/shell boundary | The rule that an Architect agent writes only inside `.sdd/` (on Claude Code also its own memory folder) and runs only commands of the allowlist in C001-IF-07 §3 (C001-NFR-201) |
| Enforcement mechanism | What enforces the write/shell boundary on a target: Claude Code hooks, the OpenCode permission engine, the sdd MCP server, or Copilot agent-scoped hooks |
| Guard core | The decision functions behind `sdd guard-path` and `sdd guard-bash`, shared by every enforcement mechanism that runs the `sdd` CLI code |
| Guard corpora | The path corpus and the shell corpus: the recorded allow/deny cases under `tests/guards/` (current-state §2 item 6) |
| Corpus replay | Running every case of the guard corpora against one enforcement mechanism and comparing each decision with the expected one |
| sdd MCP server | A local MCP server shipped in the CLI package; it writes `.sdd/` files and runs allowlisted commands for agents that have no edit or terminal tool (C002-DEC-001) |
| Agent-scoped hooks | Hooks declared in a Copilot custom agent's frontmatter that run only while that agent is active (Preview; C002-R-001 A-01) |
| Copilot hooks fallback | The exception of C002-DEC-005: Copilot agents carry agent-scoped hooks running the guard cores when spike S-08 shows that subagents are not confined to their tool list |
| `architect-sdd` | The npm package that publishes the `sdd` CLI with the executable name `sdd` (C002-DEC-007) |
| Bare `sdd` command | A shell command whose first word is `sdd` (the npm executable), as opposed to `node <path>/sdd.mjs` |
| Question tool | The host tool that shows an interview round or a gate to P-01: AskUserQuestion (Claude Code), `question` (OpenCode), `vscode/askQuestions` (Copilot VS Code) |
| Skipped answer | A question-tool result that carries no choice of P-01, such as VS Code's `{"skipped": true}` (C002-R-001 A-07) |
| Spike S-07, spike S-08 | Plan-phase experiments on OpenCode (S-07) and Copilot VS Code (S-08) that settle the assumptions of `10-context/scope.md` §3 before the targets are built |
| Eval runner | A back end of the eval harness that executes eval cases on one host while keeping the case API of `evals/harness/` |
| Injection eval | An eval case whose input carries planted instructions; it passes when the agent acts on none of them |
| Manual VS Code checklist | The recorded manual verification of Copilot VS Code behaviour that cannot be scripted, run before each release (C002-DEC-003) |
| Toy change | A minimal change used to drive the workflow from creation to gate G1 on a fresh install |
| Release (of a target) | Publishing a target package to adopters; the release check of C002-DEC-005 decides whether a target may be released |
| Claude Code construct | An element of the source plugin that only Claude Code understands and the generator must translate: tool names in agent `tools`, `mcp__plugin_architect_*` names, model names, `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}`, `$ARGUMENTS`, `architect:` references, the `claude --agent` guard line of commands, and the AskUserQuestion name (baseline survey §1) |
| Claude model tier | The `model` value of a source agent (`opus`, `sonnet`, `haiku`, C001-IF-09); on a generated target it maps to the host's Claude model of the same tier (Q-models-01) |
| Enforcement mode | The enforcement mechanism a target package is generated for, fixed per target from the spike results: native permission enforcement or sdd MCP server enforcement on OpenCode; sdd MCP server enforcement or the Copilot hooks fallback on Copilot VS Code |
| Native permission enforcement | The OpenCode enforcement mode in which per-agent `permission` rules of the OpenCode target package enforce the write/shell boundary (C002-AS-01, C002-AS-02 confirmed by spike S-07) |
| sdd MCP server enforcement | The enforcement mode in which Architect agents have no generic edit or terminal tool and write `.sdd/` files and run allowlisted commands through the sdd MCP server (C002-DEC-001) |
| Generic edit or terminal tool | A host tool that writes any file (VS Code: its built-in edit tools; OpenCode: `edit`) or runs any shell command (VS Code: its terminal tool; OpenCode: `bash`) |
| Write tool, command tool | The sdd MCP server tools that write a file under `.sdd/` (write tools) and run one allowlisted command (command tool) |
| Agent-scoped guard hook | An agent-scoped PreToolUse hook of the Copilot hooks fallback that runs the path guard core or the bash guard core |
| Path guard core, bash guard core | The guard core behind `sdd guard-path` (C001-REQ-1103, C001-REQ-1104) and behind `sdd guard-bash` (C001-REQ-1106, C001-REQ-1107) |
| Quick-lint findings | The findings of `sdd lint --quick --file <path>` for one written file, in the post-write feedback format of C001-IF-07 §4 |
| Post-write feedback channel | A host hook that returns text to the agent after one of its tool calls (on OpenCode `tool.execute.after`, if spike S-07 confirms it) |
| Tested version | For each generated target, the host version (for Copilot VS Code: the VS Code and GitHub Copilot Chat versions) recorded by the spike that validated the target; shown by the doctor and re-checked before each release (Q-versions-01) |
| Doctor remedies table | The table of detection and fix commands of the doctor (C001-IF-10 §3), which also records the tested version of each generated target |
| Target structure check | A check that `npm run check` runs on one generated target package, next to the plugin structure checks of C001-IF-08 §3 |
| Target package contract | The expected layout, agent tool lists and MCP configuration of one target package, written in `50-interfaces/` |
| Corpus replay suite | The tests that run the corpus replay against each enforcement mechanism of the generated targets |
| Checklist record | The record of one run of the manual VS Code checklist |
| Release check | The check that decides whether a generated target may be released (C002-DEC-005) |
| Release record | The record of one release decision for one target: the evidence the release check used and its outcome |
| Regression set | The CHG-001 tests and evals that pass before CHG-002 and must still pass after it (`20-plan/30-impact/regression-set.md`) |
| Generation run | One execution of the generator for one or more generated targets; it writes every selected target package or none (C002-INV-02) |
| Generation manifest | The file `architect-target.json` of a target package: target, version, enforcement mode, tested versions, source digest and the hash of every file (C002-IF-004) |
| Construct detector | The pattern of a mapping table that finds one kind of Claude Code construct in a source or generated file (C002-IF-001 §2) |
| Wiring anchor | The heading or the exact block of lines of a source file that a wiring variant replaces (C002-IF-001) |
| Variant token | A placeholder in a wiring variant that the generator fills from the mapping table, such as the tested version (C002-IF-001 §4) |
| Server profile | One of the two tool sets of the sdd MCP server, declared as its own server: `sdd-files` (write tools) and `sdd-shell` (command tool) (C002-IF-002 §2) |
| Server repository root | The repository folder an sdd MCP server process serves, fixed when it is initialised (C002-IF-002 §3) |
| Tool classes | The classification of a host's tool names into write, terminal and read-only tools that an agent-scoped guard hook uses (C002-IF-008 §2) |
| Tool classes file | The file `hooks/tool-classes.json` of the Copilot target package under the Copilot hooks fallback, which assigns every granted tool to one of the tool classes `write`, `terminal` and `read_only` |
| Host adapter | The part of the sdd CLI that turns a host's hook input into the hook input of C001-IF-07 §1 (`--host copilot`) |
| Spike record | The committed result of spike S-07 or S-08, whose frontmatter fixes a target's enforcement mode and tested versions (C002-IF-009 §3) |
| Per-user data folder | The folder of `architect-sdd` in the user's application-data location, used for Serena's data on the generated targets (`--user-data`, C002-IF-007) |
| Serena read-only mode file | `plugins/architect/serena/architect-read-only.yml`, the Serena mode that leaves only the read-only tools of C001-IF-14 §4; also shipped in `architect-sdd` (C002-IF-003 §1) |
| Template override | A template under `.sdd/_templates/<profile>/<path>` of a repository, which takes precedence over the template of the same path shipped with the plugin or with `architect-sdd` |
| Case category | The `category` field of a case of the guard corpora. Memory-category cases (`memory`) test writes to an agent's memory folder; identity-category cases (`identity`) test decisions that depend on the calling agent's identity, such as a caller that is not an Architect agent |
| Applicable case | A case of the guard corpora that the corpus replay runs against a given enforcement mechanism: every case, except the identity-category cases for the sdd MCP server and the agent-scoped guard hooks (C002-REQ-626, Q-safety-02) |
| Expected decision for a mechanism | The decision a case of the guard corpora expects from one enforcement mechanism: `deny` for a memory-category case on a generated target (C002-REQ-625), otherwise the decision recorded in the corpus |
| Replay report | The record of one corpus replay against one enforcement mechanism: each case with its expected and actual decision, and the cases not replayed (C002-REQ-627; C002-IF-009 §2) |
| Adopter agent | An agent that P-03 defines on their host, as opposed to the ten Architect agents (C002-REQ-208) |
| Revise scenario | A scenario in which P-01 chooses Revise at a gate and the gate is presented again after the rework, or runs the revise command on an approved phase, which puts that phase `in-revision` (C002-GOAL-03) |
| Revise command | The command that reopens an approved phase: `/architect:revise` on Claude Code, and its generated command or prompt file on OpenCode and Copilot VS Code |
| Writing `sdd` subcommand | An `sdd` subcommand that writes files, such as `change new`, `trace --write`, `task set`, `serena-config` and `serena-launch` (C002-REQ-607) |
| Data-folder argument | The folder that `sdd serena-config` and `sdd serena-launch` write Serena's configuration and data into: a folder path or the option `--user-data` (C002-REQ-515, C002-REQ-517) |

## 2. System names (allowed after `THE` in EARS statements)

### 2.1 System names introduced by CHG-002

Components assigned in the architecture step (`../60-architecture/architecture.md` §2).

| Name | Meaning | Component |
|---|---|---|
| generator | The build step that writes the target packages from the source plugin | C002-COMP-001 |
| source plugin | `plugins/architect`, the Claude Code plugin | C001-COMP-11 (modified as C002-COMP-017); its `targets/` folder is C002-COMP-002 |
| target package | Either generated target package | C002-COMP-003, C002-COMP-004 |
| OpenCode target package | The generated package under `dist/opencode/` | C002-COMP-003 |
| Copilot target package | The generated package under `dist/copilot/` | C002-COMP-004 |
| sdd MCP server | The local stdio MCP server shipped in `architect-sdd` | C002-COMP-005 |
| `architect-sdd` package | The npm package of the `sdd` CLI and the sdd MCP server | C002-COMP-006 |
| target structure check | The checks run by `npm run check` on a target package | C002-COMP-007 |
| corpus replay suite | The tests replaying the guard corpora against each enforcement mechanism | C002-COMP-008 |
| guard corpora | The path corpus and the shell corpus under `tests/guards/` | C002-COMP-013 |
| enforcement mechanism | Whatever enforces the write/shell boundary on a target | C002-COMP-012 (Claude Code hooks, agent-scoped guard hooks), C002-COMP-003 (OpenCode permission rules), C002-COMP-005 (sdd MCP server) |
| agent-scoped guard hook | A guard hook of the Copilot hooks fallback | C002-COMP-004 (declaration), C002-COMP-012 (decision) |
| eval runner | An eval runner of a generated target | C002-COMP-009 |
| OpenCode eval runner | The eval runner that drives OpenCode | C002-COMP-009 |
| Copilot CLI eval runner | The eval runner that drives Copilot CLI | C002-COMP-009 |
| manual VS Code checklist | The recorded manual verification of Copilot VS Code | C002-COMP-011 |
| release check | The release decision of C002-DEC-005 for one target | C002-COMP-010 |

### 2.2 System names reused from CHG-001

Defined in `.sdd/001-architect-agent-suite/10-spec/40-domain/glossary-delta.md` §2; listed here so
that the lint of CHG-002 resolves them until both glossaries are merged into
`_constitution/glossary.md`.

| Name | Meaning | Component |
|---|---|---|
| conductor | As in CHG-001 | C001-COMP-01 (modified as C002-COMP-014) |
| cartographer | As in CHG-001 | C001-COMP-02 (toolchain record through C002-COMP-016) |
| Architect agent | As in CHG-001 | C001-COMP-01, C001-COMP-02 |
| agent | As in CHG-001 (used in NFRs) | C001-COMP-01, C001-COMP-02 |
| bash guard | As in CHG-001 | C001-COMP-08 (modified as C002-COMP-012) |
| path guard | As in CHG-001 | C001-COMP-08 (modified as C002-COMP-012) |
| build | As in CHG-001 | C001-COMP-12 (modified as C002-COMP-013) |
| plugin | As in CHG-001 | C001-COMP-11 (modified as C002-COMP-017) |
| README | As in CHG-001 | C001-COMP-11 (modified as C002-COMP-017) |
| repository | As in CHG-001 | — |
| sdd CLI | As in CHG-001 | C001-COMP-03 to C001-COMP-07 (front-end modified as C002-COMP-018) |
| suite | As in CHG-001 (used in NFRs) | all |
