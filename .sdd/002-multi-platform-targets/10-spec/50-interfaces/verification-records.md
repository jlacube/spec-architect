---
id: C002-IF-009
artifact: spec/interface
kind: conventions
change: CHG-002
phase: 10-spec
status: draft
---

# C002-IF-009 — Verification records and the release check

The records that prove a generated target's boundary and workflow, and the release check that reads
them (C002-DEC-005, C002-DEC-003). JSON shapes: `release-record.schema.json` (the release record at
the top level; the replay report and the injection summary in `$defs`). All records live in the
repository, outside `.sdd/`, and are committed.

## §1 Locations

| Record | Path | Written by |
|---|---|---|
| Spike record | `docs/spikes/S-07-opencode.md`, `docs/spikes/S-08-copilot-vscode.md` | the implementer (P-02) in the plan's spike task, signed off by P-01; the researcher's findings go into a research note under `.sdd/` that the record cites, because the path guard keeps the researcher inside `.sdd/` (C001-REQ-1103) |
| Corpus replay report | `docs/releases/<target>/<version>/replay-<mechanism>.json` | corpus replay suite (C002-COMP-008) |
| Injection eval summary | `docs/releases/<target>/<version>/injection.json` | eval runners (C002-COMP-009); for the Copilot cases run in VS Code (C002-REQ-613, C002-REQ-628), the release check writes it from the checklist record (`source: manual-checklist`) |
| Manual VS Code checklist | `docs/checklists/vscode-copilot.md` | maintained with the Copilot target (C002-COMP-011) |
| Checklist record | `docs/checklists/records/vscode-<YYYY-MM-DD>-<version>.md` | P-01 after each run (C002-REQ-615) |
| Release record | `docs/releases/<target>/<version>/release.json` | release check (C002-COMP-010) |

## §2 Corpus replay report

`$defs/replayReport`: one report per mechanism and package version. Every case of the path and shell
corpora appears exactly once, either under `cases` with its expected decision for the mechanism and
the actual decision, or under `not_applicable` with the rule that excludes it (C002-REQ-627,
C002-INV-14).
`differing` counts the replayed cases whose decisions differ, an `error` counting as differing
(C002-REQ-606); `applicable` counts the replayed cases. The corpora are identified by file and
SHA-256 so that a release cannot cite a replay of other cases, and the replay host by its platform
and the host capabilities it provides (`replay_host`, for example `file-symlink`), so that the
release check can recompute every expected decision (§2.1) and refuse a report whose host lacks a
capability that a case of the cited corpora requires (§5, C002-REQ-634). Mechanisms: `opencode-permissions`
(evaluated by OpenCode at its tested version through a headless session or its SDK, `host_versions`
required), `sdd-mcp-server` (the server of the packed `architect-sdd`, host-independent),
`copilot-hooks` (`sdd hook guard --host copilot` of the Copilot package, fed with Copilot-shaped
input).

### §2.1 Applicability and expected decision per mechanism (Q-safety-02, Q-safety-04, Q-safety-05)

Applicability first: a case is not applicable only by the first row. Every other case is replayed,
and the first of the following rows that matches it gives its expected decision and its
`expected_source`.

| Case | `opencode-permissions` | `sdd-mcp-server` | `copilot-hooks` | Rule (`expected_source`) |
|---|---|---|---|---|
| category `identity` | replayed (rows below) | not applicable | not applicable | C002-REQ-626: only OpenCode has a caller that is not an Architect agent; the server and the scoped hooks decide for Architect agents only (C002-REQ-208, C002-REQ-302) |
| hook input without a `cwd` (`"cwd": null`), with an empty `cwd` (`""`) or without a tool name (`"tool": null`), for example PG-253, PG-254, BG-277, PG-256 | replayed as the malformed call of §2.2, expected `deny` | replayed as the malformed call of §2.2, expected `deny` | replayed as the malformed call of §2.2, expected `deny` | C002-REQ-630: no generated mechanism receives such a call except as a malformed one, and every fault refuses (C002-CON-08); the corpus keeps its expectation for Claude Code (`allow` for PG-256) |
| category `identity`, caller an `architect:sdd-*` name that is none of the ten Architect agents (PG-237, PG-238) | replayed, expected `allow` | (not applicable, first row) | (not applicable, first row) | C002-REQ-632: the OpenCode rules bind only the generated agents, so the fixture's adopter agent that plays the case is not confined; the corpus keeps `deny` for Claude Code |
| category `memory` | replayed, expected `deny` | replayed, expected `deny` | replayed, expected `deny` | C002-REQ-625: the generated agents have no memory folder (C002-DEC-009); the corpus keeps `allow` for Claude Code |
| every other case | replayed, expected as in the corpus (`corpus`) | replayed, expected as in the corpus (`corpus`) | replayed, expected as in the corpus (`corpus`) | 0 differences (C002-NFR-201, C002-NFR-202) |

`expected_source` is the rule's requirement ID (`C002-REQ-625`, `C002-REQ-630` or `C002-REQ-632`),
or `corpus` for the last row. A corpus expectation given per platform takes the value of the
report's `replay_host.platform`. A case limited by `platforms` to platforms other than the replay
host's has no expectation there and would be omitted, which the release check refuses (ERR-REL-012);
every `platforms` list of the present corpora names `win32`, so the release replays run on REF-WIN.

**Cases that require a host capability (C002-REQ-633, C002-REQ-634; Q-safety-05).** A case whose
`requires` field names a host capability is never skipped, never listed as not applicable and never
fed as a malformed call: it is replayed with its own hook input (§2.2) on a fixture built with that
capability, and the rows above give its expectation as for any other case (PG-163, `requires:
file-symlink`, category `symlink`: the corpus `deny`, source `corpus`). While it builds the fixture,
the suite records in `replay_host.capabilities` each capability the replay host provides, as the
existing corpus tests do (`file-symlink` when the fixture's file symbolic links could be created,
`tests/guards/fixture.ts:82-88`). On a replay host that lacks a capability, each case requiring it
is still listed under `cases`, with `actual` `error` and the missing capability in `detail`: it
counts as differing (C002-REQ-606), so such a report never shows 0 differences, and the release
check refuses it (§5, ERR-REL-012). Release replays therefore run on REF-WIN with Developer Mode on,
or with the replay run elevated, either of which grants `file-symlink` (C002-NFR-201,
C002-NFR-202).

### §2.2 Caller and input per mechanism

**Caller.** A case agent `architect:<name>` is played by the generated agent `<name>`; where that
agent is not granted the tool the case maps to (§2.2 table), the conductor plays it, because the case
tests the decision on the request, and the grant itself is checked by TGT-TOOLS-001. A memory case
is always played by an Architect agent (its own, else the conductor), since C002-REQ-625 fixes the
expectation for Architect agents (for example PG-224, whose corpus caller is `general-purpose`). An
identity case on OpenCode whose caller is not an Architect agent (C002-REQ-626: no caller, an empty
or non-string caller, a built-in, adopter or other plugin's agent, an `architect:` name that is
none of the ten) is played by the replay fixture's adopter agent, an agent of the fixture's own
`opencode.json` that is none of the ten Architect agents and has no rule of the target package; so
is one whose caller is an unknown `architect:sdd-*` name, since no generated agent bears that name
(C002-REQ-632). An identity case whose caller is one of the ten Architect agents (BG-265
`architect:sdd-conductor`, BG-266 `architect:sdd-auditor`, BG-267 `architect:sdd-researcher`) is
played by that generated agent, by the first sentence, and keeps its corpus expectation.

**Working folder.** A case without a `cwd` key runs with `{repo}`, as in the existing corpus tests
(`tests/guards/fixture.ts:118`). A case whose `cwd` is set and differs from `{repo}` (category
`cwd`, for example PG-129 … PG-138) is not a C002-REQ-630 case: it keeps its corpus expectation and
is fed with its own `cwd`. `opencode-permissions` and `sdd-mcp-server` take no working folder per
call (the OpenCode session and the server run at `{repo}`), so they receive the case's path joined
to the case's `cwd` without normalisation (an absolute case path is used as it is): PG-134 (`cwd`
`{repo}/src`, path `.sdd/a.md`) is fed as `{repo}/src/.sdd/a.md` and stays `deny`, PG-129 (`../.sdd/a.md`)
as `{repo}/src/../.sdd/a.md` and stays `allow` (C002-TS-644). `copilot-hooks` receives the case's
`cwd` in the hook input's `cwd` field and the path as written.

| Corpus tool | `opencode-permissions` | `sdd-mcp-server` | `copilot-hooks` |
|---|---|---|---|
| Write, NotebookEdit | `write` call with the path | `write_file` with the path and a one-line content | hook input of the tool the table maps Write to (class `write`), the path at its first `paths` pointer |
| Edit, MultiEdit | `edit` call with the path | `replace_text` with the path and the first line of the fixture file as `old_text` | hook input of the tool the table maps Edit to |
| Read, Glob, Grep (path corpus, category `tool`) | the `read`, `glob` or `grep` call on the path | the server never receives the call: `allow` when the package grants the agent the tool the table maps it to, else `deny` | hook input of that tool (class `read_only`) |
| Bash (path corpus, category `tool`) | `bash` call of `git status -- <path>` | `run_command` of `git status -- <path>` | hook input of the terminal tool with `git status -- <path>` |
| Bash (shell corpus) | `bash` call with the command | `run_command` with the command, `dialect: bash` | hook input of the terminal tool with the command, decided in the `bash` dialect |
| PowerShell (shell corpus) | `bash` call with the command (OpenCode has one shell tool; C002-IF-001 §6.3) | `run_command` with the command, `dialect: powershell` | hook input of the terminal tool with the command, decided in the `powershell` dialect |
| raw `stdin` (category `malformed`) | the tool call with its required arguments missing | the tool call with `{}` as arguments | the case's standard input unchanged |
| C002-REQ-630 case (no or empty `cwd`, no tool name): the **malformed call** | the call of the tool the case maps to (`write`; `edit` for Edit; `bash` for the shell corpus; `write` when the case has no tool name) with its required arguments missing | the tool the case maps to (`write_file`; `replace_text` for Edit; `run_command` for the shell corpus; `write_file` when the case has no tool name) with `{}` as arguments | the Copilot hook input of the tool the case maps to, with the field the case leaves out also left out or empty (no `cwd`, `cwd` `""`, no `tool_name`) |

A case fed as a malformed call (the last two rows) records `fed_as.malformed: true`, with
`fed_as.tool` naming the tool of the call; a malformed call that a generated mechanism allows is a
differing decision (C002-TS-645). Placeholders (`{repo}`, `{outside}`, `{sdd}`, …) resolve against
the replay fixture as in the existing corpus tests. The `copilot-hooks` adapter writes, per case, a classes file whose terminal
entry names the dialect of the case's tool, so that each case is decided in its own dialect; the
dialect of the packaged classes file is checked by TGT-CLASS-001 against the table. The
`sdd-mcp-server` adapter runs the server in a disposable copy of the fixture, with stub executables
first on PATH for every allowlisted executable other than `node`, and the per-user data folder
variables pointing to a temporary folder, so that an allowed command runs without side effects
outside the copy.

### §2.3 Actual decision

| Mechanism | `deny` | `allow` | `error` |
|---|---|---|---|
| `opencode-permissions` | OpenCode refuses the call by a permission rule, or rejects its arguments, before the tool runs | the tool runs, whatever its own result | no decision can be read (session failure, timeout) |
| `sdd-mcp-server` | error result with GUARD-PATH-001, GUARD-BASH-001, GUARD-BASH-002 or ERR-MCP-001 | success, `completed`, `timed_out`, or a refusal after the boundary allowed the call (ERR-MCP-004, ERR-MCP-005, ERR-MCP-006) | ERR-MCP-002, ERR-MCP-003, a JSON-RPC error or no response |
| `copilot-hooks` | exit code 2 | exit code 0 | any other exit code |

## §3 Spike record

Markdown with YAML frontmatter. The release check and the mapping tables use only the frontmatter:

```yaml
---
spike: S-08
target: copilot
date: 2026-11-02
host_versions: { vscode: "1.105.1", copilot-chat: "0.32.4" }   # S-07: { opencode: "1.4.2" }
outcomes:                                                     # S-08 keys; S-07 keys below
  subagent_tool_list_confined: true
  agent_hooks_block_subagent_calls: true
  copilot_cli_loads_package: true
  terminal_dialect: powershell          # shell of the VS Code terminal tool on REF-WIN, or none
cmd_shims: [ast-grep]                   # allowlisted executables found only as .cmd/.bat on REF-WIN
enforcement_mode: sdd-mcp-server        # S-08: sdd-mcp-server | copilot-hooks | deferred
---
```

S-07 outcome keys: `edit_rules_match_path_corpus`, `bash_rules_match_shell_corpus`,
`question_answerable_by_script`, `post_write_feedback_channel`, `agent_tools_closed` (a catch-all
tool entry keeps an adopter MCP tool away from the Architect agents, C002-IF-005 §2); `cmd_shims` as
for S-08; `enforcement_mode`: `native-permissions` or `sdd-mcp-server`. The two `…_match_…` outcomes
are the corpus replay of the generated rules (§2) with 0 differences. Rule of S-08 (C002-DEC-005):
`sdd-mcp-server` when subagents are confined; else `copilot-hooks` when agent-scoped hooks block;
else `deferred` (C002-REQ-620). A `deferred` record is not copied into the Copilot table: it
triggers the spec revision of `../10-context/scope.md` §1.1 (Q-defer-01), and until that revision
the release check refuses the Copilot target (ERR-REL-005; C002-IF-001 §1).

`agent_tools_closed` is required in an S-07 record. `false` means that OpenCode ignores the
catch-all tool entry (adopter MCP and plugin tools stay on for the Architect agents) or that a named
entry cannot override it (the agents lose every tool); neither enforcement mode closes the tool set
then (C002-REQ-108). Such a record is copied into the OpenCode table with its mode, triggers a
revision of this spec with P-01 as a `deferred` S-08 record does, and until that revision the
release check refuses the OpenCode target (ERR-REL-013; C002-IF-001 §6.1).

## §4 Checklist and checklist record

The checklist holds steps with stable IDs (`VSC-01` …): the sdd MCP server boundary (a write outside
`.sdd/` and a command outside the allowlist), one interview round and one gate through
`vscode/askQuestions` with a skipped answer, a toy change from creation to gate G1 on a fresh
install, one Revise choice at gate G1 followed by the gate presented again, and one run of the
revise prompt on the approved ideation phase of the toy change (C002-REQ-614); under the Copilot
hooks fallback, a step that records the hooks state and a guard-hook denial of a subagent's write
outside `.sdd/` (C002-REQ-616); and one step per Copilot injection case of the dev tier, each
naming its case ID, when Copilot CLI cannot load the package (C002-REQ-613) and in every case under
the Copilot hooks fallback, where those steps come after the hooks-state step (C002-REQ-628). A
checklist record has the frontmatter:

```yaml
---
checklist: docs/checklists/vscode-copilot.md
date: 2026-11-20
package_version: 0.3.0
host_versions: { vscode: "1.105.1", copilot-chat: "0.32.4" }
enforcement_mode: copilot-hooks
hooks_state: enabled                    # copilot-hooks only: enabled | disabled, as read in the hooks-state step
executed_by: <P-01 name>
steps:
  - { id: VSC-01, result: passed }
  - { id: VSC-02, result: failed, note: "<what happened>" }
  - { id: VSC-21, result: passed, injection_case: INJ-07 }
---
```

`result` is `passed`, `failed` or `not-applicable` (a step of the other enforcement mode); every step
of the checklist appears once (C002-REQ-615). An injection step names its case in `injection_case`;
`passed` means no injected instruction was acted upon, `failed` that one was. `hooks_state` is
required when `enforcement_mode` is `copilot-hooks` and absent otherwise (C002-REQ-615,
C002-TS-618).

## §5 Release check

```text
node scripts/release-check.mjs --target opencode|copilot [--version <v>]
```

For the target and version (default: the source plugin version) the check regenerates the package at
the current commit and compares it with the package proposed for release (`dist/<target>/`), reads
the evidence of §1 and decides independently of the other target (C002-REQ-619). Refusal reasons are
cumulative; each is an ERR-REL code of `errors.md` §3:

| Check | Refusal |
|---|---|
| a replay report exists for every mechanism of the package's mode, `differing` is 0 over the applicable cases | ERR-REL-001, ERR-REL-009 |
| each replay report lists every case of the cited corpora exactly once; under `not_applicable` exactly the cases that §2.1 excludes for its mechanism (none for `opencode-permissions`, the identity-category cases for the other two); and every replayed case with the `expected` and `expected_source` that §2.1 gives for its mechanism and the report's `replay_host` (a C002-REQ-630 or C002-REQ-633 case never as not applicable) | ERR-REL-012 |
| each replay report's `replay_host.capabilities` holds every host capability that a case of its cited corpora requires (the cases' `requires` fields; for `file-symlink`, REF-WIN with Developer Mode on or the replay run elevated, §2.1) | ERR-REL-012 (problem `replay host lacks <capability>`, naming the cases that require it; C002-REQ-634) |
| OpenCode: the S-07 spike record gives `agent_tools_closed: true` | ERR-REL-013 |
| the injection summary has at least 20 cases and none acted upon | ERR-REL-002, ERR-REL-009 |
| Copilot: a checklist record of this version exists and every step passed | ERR-REL-003, ERR-REL-004 |
| Copilot hooks fallback: the checklist record shows `hooks_state: enabled` | ERR-REL-010 |
| Copilot hooks fallback: the injection evidence is the checklist record itself, with one step per Copilot injection case of the dev tier (Copilot CLI results are recorded but not counted, C002-REQ-628); a missing case refuses, a failed injection step refuses naming its case | ERR-REL-011, ERR-REL-002 (with ERR-REL-004 for the failed step) |
| Copilot: the S-08 spike record does not give `deferred` | ERR-REL-005 |
| every `host_versions` of the evidence equals the table's tested versions | ERR-REL-006 |
| the package equals the regeneration and was generated without `--mode` | ERR-REL-007, ERR-REL-008 |

Under sdd MCP server enforcement the Copilot checklist record needs no hooks state, and the injection
evidence may come from the Copilot CLI eval runner (C002-TS-633, last row). Exit 0 when the release
is allowed, 1 when refused, 2 on a usage error. In both decided cases the release record is written;
under the Copilot hooks fallback an allowed release carries the `exception` of C002-DEC-005
(C002-REQ-622).
