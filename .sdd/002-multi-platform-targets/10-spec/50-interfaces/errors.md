---
id: C002-SPEC-ERRORS
artifact: spec/error-catalogue
change: CHG-002
phase: 10-spec
status: draft
---

# C002 — Error, warning and rule catalogue

Same format as the CHG-001 catalogue (`.sdd/001-architect-agent-suite/10-spec/50-interfaces/errors.md`):
every code has a condition, a message, a fix (C001-NFR-601) and the requirement or interface that
specifies it. CHG-001 codes keep their meaning; the guard rules of §6 are repeated here because
CHG-002 requirements name them and extend where they apply. Message placeholders are written
`<name>`.

## 1. Generator errors (`ERR-GEN-*`)

The generator (C002-COMP-001, contract C002-IF-004) prints each error in the CLI human format of
C001-IF-01 (`error <code> <file>:<line> [<target>] — <message>. Fix: <fix>`) and exits 1; ERR-GEN-010
exits 3. A run with an error leaves no target package of that run (C002-INV-02).

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| ERR-GEN-001 | A Claude Code construct of a source file has no entry in a target's mapping table (detected by a construct detector of C002-IF-001) | `<file>:<line>: <kind> "<construct>" has no entry in the <target> mapping table` | Add the entry to `plugins/architect/targets/<target>.json`, or remove the construct from the source | C002-REQ-104, C002-AC-104.1 |
| ERR-GEN-002 | A wiring anchor of an agent, command or skill has no variant for a target: a "Claude Code wiring" section, a line matched by a `variant_required` detector (CLI invocation line, Claude Code host probe), or an anchor that a variant entry of another generated target's table names (doctor host rows, toolchain section); C002-IF-001 §3 step 3 | `<file>:<line>: <section or line> has no <target> wiring variant` | Add the variant file under `plugins/architect/targets/<target>/wiring/` and its `variants` entry | C002-REQ-112, C002-AC-112.1 |
| ERR-GEN-003 | A source agent's `model` is not `opus`, `sonnet` or `haiku` | `<file>:<line>: model "<value>" is not a Claude model tier (opus, sonnet, haiku); targets: <targets>` | Set one of the three tiers in the source agent | C002-REQ-105, C002-TS-110 |
| ERR-GEN-004 | A mapping table does not validate against `mapping-table.schema.json` | `<table>: <JSON pointer>: <schema message>` | Correct the table entry at the pointer | C002-REQ-103, C002-IF-001 |
| ERR-GEN-005 | The anchor of a variant entry is not found in its source file (stale variant) | `<file>: anchor of variant "<id>" not found for <target>` | Update the anchor to the current source text, or remove the entry | C002-REQ-111 |
| ERR-GEN-006 | A variant file holds a token the generator cannot resolve | `<variant file>:<line>: unknown token "<token>"` | Use a token of C002-IF-001 §4 | C002-REQ-111 |
| ERR-GEN-007 | A source plugin file cannot be read, or its frontmatter does not parse | `<file>: <reason>` | Fix the source file | C002-REQ-101 |
| ERR-GEN-008 | The output folder lies inside the source plugin folder | `output folder <path> lies inside the source plugin <path>` | Choose an output folder outside `plugins/architect/` | C002-REQ-102, C002-CON-02 |
| ERR-GEN-009 | `--mode` names an enforcement mode the target does not have | `mode "<mode>" is not an enforcement mode of <target>` | Use a mode of C002-IF-001 (`native-permissions`, `sdd-mcp-server` for opencode; `sdd-mcp-server`, `copilot-hooks` for copilot) | C002-IF-004 |
| ERR-GEN-010 | Writing the output failed (exit 3) | `could not write <path>: <reason>; no target package was kept` | Check disk space and permissions, then run again | C002-REQ-101, C002-INV-02 |

## 2. sdd MCP server results (`ERR-MCP-*`, `WARN-MCP-*`)

Returned in a tool result with `isError: true` and the structured content of
`sdd-mcp-tools.schema.json` (`$defs/errorResult`), except WARN-MCP-001, which accompanies a successful
write, and ERR-MCP-007, which the process prints on standard error before it exits with code 2
(contract C002-IF-002).

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| ERR-MCP-001 | Tool arguments missing, of the wrong type, or not allowed by the tool's input schema | `invalid arguments for <tool>: <detail>` | Call the tool with the arguments of its input schema | C002-REQ-402, C002-TS-402 |
| ERR-MCP-002 | Internal fault while deciding or executing a call (an exception in a guard core, in the server or in the file layer); the call is refused | `internal fault in <tool>: <detail>; the call was refused` | Re-run with `SDD_DEBUG=1` and report the fault | C002-REQ-402, C002-NFR-204 |
| ERR-MCP-003 | I/O error while writing; the target file keeps its previous content | `could not write <path>: <reason>; previous content kept` | Check disk space, permissions and locks on the file | C002-REQ-402 |
| ERR-MCP-004 | The text span of `replace_text` occurs zero times or more than once | `the text to replace occurs <n> times in <path>; it must occur exactly once` | Give a longer span that occurs once | C002-REQ-404, C002-AC-404.1 |
| ERR-MCP-005 | `replace_text` names a file that does not exist | `<path> does not exist; replace_text edits existing files` | Use `write_file` to create the file | C002-REQ-403 |
| ERR-MCP-006 | An allowed command cannot start: its executable is not found, or resolves only to a `.cmd` or `.bat` file, which the server does not run without a shell | `could not start "<executable>": <reason>` (reason `not found on PATH` or `only a .cmd or .bat shim was found`) | Install the tool (doctor), or install a native executable of it instead of an npm `.cmd` shim (C002-IF-002 §5.2, C002-IF-006 §2) | C002-REQ-405, C002-CON-07 |
| ERR-MCP-007 | The server is started with a missing or unknown `--profile`, or an unusable `--root` (exit 2, before any MCP message) | `usage: sdd-mcp --profile files\|shell [--root <dir>]: <detail>` | Correct the server declaration in the target package | C002-IF-002 |

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| WARN-MCP-001 | The quick-lint check could not run after a successful write | `quick-lint findings unavailable for <path>: <reason>` | Run `sdd lint --quick --file <path>` | C002-REQ-409, C002-AC-409.1 |

## 3. Release check errors (`ERR-REL-*`)

The release check (C002-COMP-010) prints every refusal reason, writes the release record with outcome
`refused` and exits 1 (contract C002-IF-009).

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| ERR-REL-001 | The corpus replay of the target reports a differing decision | `<target>: corpus replay differs on <case ids> (<mechanism>)` | Fix the enforcement mechanism or the generated rules, then replay | C002-REQ-617, C002-NFR-201, C002-NFR-202 |
| ERR-REL-002 | An injection eval of the target shows an instruction acted upon | `<target>: injection case <case ids> acted upon` | Fix the agent prompts or wiring, then re-run the dev-tier evals | C002-REQ-617, C002-NFR-203 |
| ERR-REL-003 | No checklist record exists for the Copilot VS Code release | `copilot: no checklist record for version <version>` | Run the manual VS Code checklist and commit its record | C002-REQ-618 |
| ERR-REL-004 | The checklist record has a step that did not pass | `copilot: checklist step <step id> is <result>` | Fix the cause and run the checklist again | C002-REQ-618 |
| ERR-REL-005 | The spike S-08 record shows that subagents are not confined to their tool list and that agent-scoped hooks do not block a subagent's tool calls | `copilot: deferred by the spike S-08 record <path> (no enforcement mode holds)` | None in this change: the Copilot target is deferred (C002-DEC-005) | C002-REQ-620 |
| ERR-REL-006 | A piece of release evidence ran on a host version other than the tested version | `<target>: <evidence> ran on <version>, tested version is <tested>` | Re-run the evidence on the tested version, or record a new tested version through a spike | C002-REQ-621 |
| ERR-REL-007 | The target package proposed for release differs from a regeneration at the release commit | `<target>: package differs from regeneration: <files>` | Regenerate with `npm run package` at the release commit | C002-NFR-501, C002-CON-01 |
| ERR-REL-008 | The target package was generated with an enforcement-mode override (`--mode`) | `<target>: package generated with --mode <mode>; release packages use the table's mode` | Regenerate without `--mode` | C002-IF-004, C002-INV-04 |
| ERR-REL-009 | A required evidence file is missing or does not parse | `<target>: evidence <kind> missing or unreadable at <path>` | Produce the evidence (replay, evals, checklist, spike record) | C002-REQ-617 |
| ERR-REL-010 | Under the Copilot hooks fallback, the checklist record does not show hooks enabled during the run (`hooks_state` missing or `disabled`) | `copilot: checklist record <path> shows hooks <state or "not recorded">; the hooks fallback needs evidence taken with hooks enabled` | Run the checklist again in VS Code with hooks enabled and commit its record | C002-REQ-629, C002-REQ-615 |
| ERR-REL-011 | Under the Copilot hooks fallback, the checklist record lacks a step for one or more Copilot injection cases of the dev tier (results from Copilot CLI do not replace them) | `copilot: checklist record <path> lacks the Copilot injection cases <case ids>` | Run the missing injection steps in VS Code with hooks enabled | C002-REQ-629, C002-REQ-628 |
| ERR-REL-012 | A replay report does not list every corpus case exactly once, or lists as not applicable a case that C002-REQ-626 makes applicable to its mechanism | `<target>: replay report <path> (<mechanism>) <omits cases \| lists cases as not applicable without a rule>: <case ids>` | Re-run the corpus replay suite at the release commit | C002-REQ-617, C002-REQ-626, C002-REQ-627 |

## 4. Build errors (`ERR-BLD-*`)

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| ERR-BLD-001 | A package bundled into an entry of `architect-sdd` (the `sdd` executable or the sdd MCP server) has a license outside the allowlist of C001-REQ-1114 | `build failed: <entry>: bundled package license not allowed: <name>@<version> (<license>)` | Replace the package or remove the import | C002-REQ-413, C002-AC-413.1 |
| ERR-BLD-002 | After the CLI-line translation of C002-IF-003 §1, a template staged for `architect-sdd` still names the CLI through a plugin path (`<plugin-root>/scripts/sdd.mjs`, any `<…>/scripts/sdd.mjs`, or `${CLAUDE_PLUGIN_ROOT}`) | `build failed: template <profile>/<path>:<line>: plugin path of the CLI "<construct>"` | Write the CLI as `node <plugin-root>/scripts/sdd.mjs <arguments>` on an invocation line, which the build translates, or as `sdd` in prose | C002-REQ-519, C002-AC-519.1 |

## 5. CLI errors added by CHG-002 (`ERR-CLI-*`)

Exit code 2, format of C001-IF-01 (contract delta C002-IF-007).

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| ERR-CLI-019 | `sdd template show` names an unknown profile, a path that leaves the profile's template folder after `..` segments and links are resolved, or a template that exists neither under `.sdd/_templates/<profile>/` nor among the shipped templates | `no <profile> template <path>` (the profile and the path as given) | List the templates with `sdd template list <profile>` (C002-REQ-520) | C002-REQ-514, C002-IF-007 |
| ERR-CLI-020 | `--user-data` is given and the per-user data folder cannot be determined (the variable of the platform rule is unset or empty), is a relative path, or resolves inside the current repository | `cannot use the user data folder: <reason>` (reason `<variable> is not set`, `<variable> is relative: <value>` or `<folder> lies inside the repository <root>`) | Set the variable to an absolute folder outside the repository, or pass such a folder as an argument instead of `--user-data` | C002-REQ-516, C002-IF-007 |

## 6. Guard rules

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| GUARD-PATH-001 | Architect agent write outside `.sdd/`, or, on Claude Code only, outside its own memory folder; on the generated targets (sdd MCP server, agent-scoped guard hooks) the memory folder is refused too | `GUARD-PATH-001: <tool> on <target> denied — <reason>. Allowed: <summary>.` (C001-IF-07 §4) | Write inside `.sdd/` only | C001-REQ-1103, C001-REQ-1104, C002-REQ-401, C002-REQ-308 |
| GUARD-BASH-001 | Shell command not on the allowlist of C001-IF-07 §3 as changed by C002-IF-008 §1 (bare `sdd …`, `node --version`), or a Serena command whose data folder is not `--user-data` or a folder outside the repository (C002-IF-008 §1.1) | `GUARD-BASH-001: <tool> on "<command>" denied — <reason>. Allowed: <summary>.` | Use an allowlisted command; for Serena, pass `--user-data` or a data folder outside the repository | C001-REQ-1106, C002-REQ-503, C002-REQ-517, C002-REQ-405 |
| GUARD-BASH-002 | Redirection, substitution, chaining or a non-allowlisted piped segment | `GUARD-BASH-002: <tool> on "<command>" denied — <reason>. Allowed: <summary>.` | Run one allowlisted command, piped only into pipe-only entries | C001-REQ-1107, C002-REQ-405 |
| GUARD-HOOK-001 | An agent-scoped guard hook cannot reach a decision: standard input empty or not JSON, a tool name outside the tool classes of C002-IF-008 §2, or an internal error; the hook exits 2 | `GUARD-HOOK-001: <tool or "tool call"> denied — <fault>.` | Fix the hook input or the tool classes of the Copilot target package | C002-REQ-309, C002-AC-309.1 |

## 7. Target structure checks

See C002-IF-005 §6 (`TGT-*` codes on the target packages and `PLG-VAR-001` on the source plugin);
the codes added in the spec fix round are TGT-SERENA-001 (C002-REQ-114) and TGT-CLASS-001
(C002-REQ-318).
