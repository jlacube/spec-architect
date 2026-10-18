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

**Print form** (revised for defects D-004 and D-008). Every code of §1 … §6 of this catalogue is shown as
`<code>: <message>`, the form of the CLI's errors (`ERR-CLI-<nnn>: <message>. Fix: <fix>`, C001-IF-01
Output):

- The Message column holds only the literal text printed after `<code>: `, each placeholder `<name>`
  replaced by its value. The values a placeholder can take are given in the Condition column, never
  in the Message column.
- The CLI (§5) and the generator (§1) append `. Fix: <fix>`. The build (§4), the release check (§3)
  and the sdd MCP server on standard error (ERR-MCP-007, after the diagnostic prefix `sdd-mcp: ` of
  C002-IF-002 §1) print `<code>: <message>` alone, one line per error.
- Where a channel carries the code in a field of its own, the message field holds the Message text
  without the code: the sdd MCP server's tool results (`structuredContent.code` and `.message`; the
  text content is the message, C002-IF-002 §6), the generator's `--json` diagnostics (C002-IF-004)
  and the release record's `refusals` (`release-record.schema.json`).
- The guard rules of §6 are deny messages that start with their code (C001-IF-07 §4), so their
  Message cell holds the whole message, code included.
- In §5 the CLI prints the cell character for character, backticks included, as it does for the
  CHG-001 codes (`src/cli/errors.ts` mirrors §5 and CHG-001 §1, and a test compares the two); in the
  other sections the backticks only delimit the text.

## 1. Generator errors (`ERR-GEN-*`)

The generator (C002-COMP-001, contract C002-IF-004) prints each error as
`<code>: <message>. Fix: <fix>` (print form above; the message names the source file and line) and
exits 1; ERR-GEN-010 exits 3. A run with an error leaves no target package of that run
(C002-INV-02).

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
write, and ERR-MCP-007, which the process prints on standard error as
`sdd-mcp: ERR-MCP-007: <message>` before it exits with code 2 (contract C002-IF-002).

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| ERR-MCP-001 | Tool arguments missing, of the wrong type, or not allowed by the tool's input schema | `invalid arguments for <tool>: <detail>` | Call the tool with the arguments of its input schema | C002-REQ-402, C002-TS-402 |
| ERR-MCP-002 | Internal fault while deciding or executing a call (an exception in a guard core, in the server or in the file layer); the call is refused | `internal fault in <tool>: <detail>; the call was refused` | Re-run with `SDD_DEBUG=1` and report the fault | C002-REQ-402, C002-NFR-204 |
| ERR-MCP-003 | I/O error while writing; the target file keeps its previous content | `could not write <path>: <reason>; previous content kept` | Check disk space, permissions and locks on the file | C002-REQ-402 |
| ERR-MCP-004 | The text span of `replace_text` occurs zero times or more than once | `the text to replace occurs <n> times in <path>; it must occur exactly once` | Give a longer span that occurs once | C002-REQ-404, C002-AC-404.1 |
| ERR-MCP-005 | `replace_text` names a file that does not exist | `<path> does not exist; replace_text edits existing files` | Use `write_file` to create the file | C002-REQ-403 |
| ERR-MCP-006 | An allowed command cannot start: its executable is not found on PATH; it resolves only to a `.cmd` or `.bat` file, which the server does not run without a shell; for the first word `sdd`, the server's own CLI `scripts/sdd.mjs` is not found beside the server's bundle (C002-IF-002 §5.2); or the operating system refuses to start the process. `<reason>` is `not found on PATH`, `only a .cmd or .bat shim was found`, `not found beside the server (<path>)` with `<path>` the absolute path of the missing `sdd.mjs`, or the operating system's error text | `could not start "<executable>": <reason>` | Install the tool (doctor), or install a native executable of it instead of an npm `.cmd` shim (C002-IF-002 §5.2, C002-IF-006 §2); for `sdd`, reinstall `architect-sdd` (`npm install -g architect-sdd@<version>`) | C002-REQ-405, C002-REQ-407, C002-CON-07 |
| ERR-MCP-007 | The server is started with a missing or unknown `--profile`, or an unusable `--root` (exit 2, before any MCP message) | `usage: sdd-mcp --profile files\|shell [--root <dir>]: <detail>` | Correct the server declaration in the target package | C002-IF-002 |

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| WARN-MCP-001 | The quick-lint check could not run after a successful write | `quick-lint findings unavailable for <path>: <reason>` | Run `sdd lint --quick --file <path>` | C002-REQ-409, C002-AC-409.1 |

## 3. Release check errors (`ERR-REL-*`)

The release check (C002-COMP-010) prints every refusal reason as `<code>: <message>`, writes the
release record with outcome `refused` and exits 1 (contract C002-IF-009).

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| ERR-REL-001 | The corpus replay of the target reports a differing decision | `<target>: corpus replay differs on <case ids> (<mechanism>)` | Fix the enforcement mechanism or the generated rules, then replay | C002-REQ-617, C002-NFR-201, C002-NFR-202 |
| ERR-REL-002 | An injection eval of the target shows an instruction acted upon | `<target>: injection case <case ids> acted upon` | Fix the agent prompts or wiring, then re-run the dev-tier evals | C002-REQ-617, C002-NFR-203 |
| ERR-REL-003 | No checklist record exists for the Copilot VS Code release | `copilot: no checklist record for version <version>` | Run the manual VS Code checklist and commit its record | C002-REQ-618 |
| ERR-REL-004 | The checklist record has a step that did not pass | `copilot: checklist step <step id> is <result>` | Fix the cause and run the checklist again | C002-REQ-618 |
| ERR-REL-005 | The spike S-08 record gives `enforcement_mode: deferred`: `subagent_tool_list_confined` is `false` and `guard_hooks_block_subagent_calls` is `false` or absent, that is, subagents are not confined to their tool list and the Copilot guard hooks (plugin-level, keyed by `agent_type`, C002-IF-008 §2) do not block a subagent's tool calls (C002-IF-009 §3). The signed-off record gives `sdd-mcp-server`, so this refusal does not apply at the tested versions | `copilot: deferred by the spike S-08 record <path> (no enforcement mode holds)` | None in this change: the Copilot target is deferred (C002-DEC-005) | C002-REQ-620 |
| ERR-REL-006 | A piece of release evidence ran on a host version other than the tested version | `<target>: <evidence> ran on <version>, tested version is <tested>` | Re-run the evidence on the tested version, or record a new tested version through a spike | C002-REQ-621 |
| ERR-REL-007 | The target package proposed for release differs from a regeneration at the release commit | `<target>: package differs from regeneration: <files>` | Regenerate with `npm run package` at the release commit | C002-NFR-501, C002-CON-01 |
| ERR-REL-008 | The target package was generated with an enforcement-mode override (`--mode`) | `<target>: package generated with --mode <mode>; release packages use the table's mode` | Regenerate without `--mode` | C002-IF-004, C002-INV-04 |
| ERR-REL-009 | A required evidence file is missing or does not parse | `<target>: evidence <kind> missing or unreadable at <path>` | Produce the evidence (replay, evals, checklist, spike record) | C002-REQ-617 |
| ERR-REL-010 | Under the Copilot hooks fallback, the checklist record does not show hooks enabled during the run (`hooks_state` missing or `disabled`); `<state>` is `disabled` or `not recorded`, printed without quotes | `copilot: checklist record <path> shows hooks <state>; the hooks fallback needs evidence taken with hooks enabled` | Run the checklist again in VS Code with hooks enabled and commit its record | C002-REQ-629, C002-REQ-615 |
| ERR-REL-011 | Under the Copilot hooks fallback, the checklist record lacks a step for one or more Copilot injection cases of the dev tier (results from Copilot CLI do not replace them) | `copilot: checklist record <path> lacks the Copilot injection cases <case ids>` | Run the missing injection steps in VS Code with hooks enabled | C002-REQ-629, C002-REQ-628 |
| ERR-REL-012 | A replay report does not list every corpus case exactly once, or its not-applicable list differs from the cases that C002-IF-009 §2.1 excludes for its mechanism, or a replayed case records an expected decision or expected-decision source other than the one C002-IF-009 §2.1 gives for its mechanism and the report's replay host, or the report's replay host lacks a host capability that a case of its cited corpora requires. `<problem>` is one of `omits cases`, `lists cases more than once`, `lists cases as not applicable without a rule`, `replays cases that its mechanism excludes`, `records expectations other than C002-IF-009 §2.1`, `replay host lacks <capability>`; for the last, `<case ids>` are the cases that require the capability | `<target>: replay report <path> (<mechanism>) <problem>: <case ids>` | Re-run the corpus replay suite at the release commit; for `replay host lacks <capability>`, on a replay host that has it (`file-symlink`: REF-WIN with Developer Mode on, or the replay run elevated) | C002-REQ-617, C002-REQ-626, C002-REQ-627, C002-REQ-630, C002-REQ-632, C002-REQ-633, C002-REQ-634 |
| ERR-REL-013 | OpenCode: the S-07 spike record gives `agent_tools_closed: false` or lacks the outcome, so the catch-all tool entry does not close the Architect agents' tool set (C002-IF-009 §3); `<value>` is `false` or `not recorded`, printed without quotes | `opencode: spike S-07 record <path> shows agent_tools_closed <value>; the Architect agents' tool set is not closed` | None in this change: the record triggers a revision of this spec with P-01 (C002-IF-009 §3) | C002-REQ-108, C002-REQ-617 |

## 4. Build errors (`ERR-BLD-*`)

`npm run build` (ERR-BLD-001) and `npm run package` (ERR-BLD-002) print each error as
`<code>: <message>` on standard error, one line per finding, and stop with a non-zero exit code
(C002-TS-418, C002-TS-530 read the code from the line).

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| ERR-BLD-001 | A package bundled into an entry of `architect-sdd` (the `sdd` executable or the sdd MCP server) has a license outside the allowlist of C001-REQ-1114 | `build failed: <entry>: bundled package license not allowed: <name>@<version> (<license>)` | Replace the package or remove the import | C002-REQ-413, C002-AC-413.1 |
| ERR-BLD-002 | After the CLI-line translation of C002-IF-003 §1, a template staged for `architect-sdd` still names the CLI through a plugin path (`<plugin-root>/scripts/sdd.mjs`, any `<…>/scripts/sdd.mjs`, or `${CLAUDE_PLUGIN_ROOT}`) | `build failed: template <profile>/<path>:<line>: plugin path of the CLI "<construct>"` | Write the CLI as `node <plugin-root>/scripts/sdd.mjs <arguments>` on an invocation line, which the build translates, or as `sdd` in prose | C002-REQ-519, C002-AC-519.1 |

## 5. CLI errors added by CHG-002 (`ERR-CLI-*`)

Exit code 2, format of C001-IF-01 (contract delta C002-IF-007).

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| ERR-CLI-019 | `sdd template show` names an unknown profile, a path that leaves the profile's template folder after `..` segments and links are resolved, or a template that exists neither under `.sdd/_templates/<profile>/` nor among the shipped templates. `<profile>` and `<path>` are the profile and the path as given | `no <profile> template <path>` | List the templates with `sdd template list <profile>` (C002-REQ-520) | C002-REQ-514, C002-IF-007 |
| ERR-CLI-020 | `--user-data` is given and the per-user data folder cannot be determined (the variable of the platform rule is unset or empty), is a relative path, or resolves inside the current repository. `<reason>` is `<variable> is not set`, `<variable> is relative: <value>` or `<folder> lies inside the repository <root>` | `cannot use the user data folder: <reason>` | Set the variable to an absolute folder outside the repository, or pass such a folder as an argument instead of `--user-data` | C002-REQ-516, C002-IF-007 |
| ERR-CLI-021 | `sdd install copilot` would replace a file or a server entry it did not write: an existing `.github/agents/<agent name>.agent.md` (such as `.github/agents/sdd-critic.agent.md`, C002-REQ-322) or `.github/hooks/architect-guard.json`, or a `servers` entry of `.vscode/mcp.json` with the name of a package server, that the install record does not list with its present SHA-256 and that differs from what the install would write; or `.vscode/mcp.json` does not parse as strict JSON or has no object at its top level or under `servers`. One line per file or server; nothing is written (C002-IF-007 §Install step 4). `<reason>` is `was not written by sdd install copilot`, `server "<name>" was not written by sdd install copilot`, or `cannot be parsed as JSON without comments: <detail>` | `install conflict: <path> <reason>` | Rename or remove the named agent file, hook file or server entry of your own, or remove the comments from `.vscode/mcp.json`, then run the command again | C002-REQ-324, C002-IF-007 |
| ERR-CLI-022 | `sdd install copilot` cannot use the Copilot package: no `--package` and the running CLI is not the `scripts/sdd.mjs` of a Copilot package; the folder holds no `architect-target.json`, the manifest does not parse or names another target; a source file of C002-IF-005 §3 is missing; or the package's absolute path holds `"`, `$`, `%`, a backtick or a control character, which a hook command cannot carry (C002-IF-008 §4). Nothing is written | `cannot install from <path>: <reason>` | Pass `--package` with the unpacked Copilot package folder, or move the package to a path without those characters | C002-REQ-322, C002-REQ-326, C002-IF-007 |

## 6. Guard rules

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| GUARD-PATH-001 | Architect agent write outside `.sdd/`, or, on Claude Code only, outside its own memory folder; on the generated targets (sdd MCP server, Copilot guard hooks) the memory folder is refused too. Message, `<reason>` and `<summary>` as in C001-IF-07 §4 (the summary without the memory folder on the generated targets, C002-IF-008 §5) | `GUARD-PATH-001: <tool> on <target> denied — <reason>. Allowed: <summary>.` | Write inside `.sdd/` only | C001-REQ-1103, C001-REQ-1104, C001-IF-07, C002-REQ-401, C002-REQ-308 |
| GUARD-BASH-001 | Shell command not on the allowlist of C001-IF-07 §3 as changed by C002-IF-008 §1 (bare `sdd …`, `node --version`), or a Serena command whose data folder is not `--user-data` or a folder outside the repository (C002-IF-008 §1.1), or a writing `sdd` subcommand with a `--cwd` folder that does not resolve to the repository root or a folder under it, or the subcommand `install` in any form (C002-IF-008 §1.2). `<reason>` is a reason of C001-IF-07 §4 or one added by CHG-002: `sdd <subcommand> with a data folder inside the repository (<resolved folder>)`, `sdd <subcommand> with an argument the guard cannot resolve (<word>)`, `sdd <subcommand> with --cwd outside the repository (<resolved folder>)`, `sdd <subcommand> with a --cwd the guard cannot resolve (<word>)`, `sdd install writes outside .sdd/; P-03 runs it in their own terminal`; `<summary>` is the text of C002-IF-008 §1 | `GUARD-BASH-001: <tool> on "<command>" denied — <reason>. Allowed: <summary>.` | Use an allowlisted command; for Serena, pass `--user-data` or a data folder outside the repository; with a writing subcommand, give `--cwd` only a folder inside the repository; ask P-03 to run `sdd install copilot` (C002-IF-005 §5) | C001-REQ-1106, C002-REQ-503, C002-REQ-517, C002-REQ-521, C002-REQ-325, C002-REQ-405 |
| GUARD-BASH-002 | Redirection, substitution, chaining or a non-allowlisted piped segment | `GUARD-BASH-002: <tool> on "<command>" denied — <reason>. Allowed: <summary>.` | Run one allowlisted command, piped only into pipe-only entries | C001-REQ-1107, C002-REQ-405 |
| GUARD-HOOK-001 | The PreToolUse hook of the Copilot target package (`sdd hook guard --host copilot`, C002-IF-008 §2: the Copilot subagent guard hook in both modes, and the Copilot guard hook under the hooks fallback) cannot reach a decision: `--host` missing or other than `copilot`, `--mode` missing or unknown, `--agents` missing or empty, or another option error (rule 1); standard input empty, not JSON or not a JSON object, whoever calls (rule 2); for a non-Architect subagent's call, no or an empty `cwd` or a failed workspace lookup, and, in a repository with `.sdd/`, no tool name, a tool name outside the tool classes, or an unreadable or unparsable tool classes file (rule 6); under the hooks fallback, for an Architect agent's call, no or an empty `cwd`, no tool name, a tool name outside the tool classes, an unreadable or unparsable tool classes file (rule 7), a `write` tool whose input holds no string at the class's `paths` pointers, or a matched `--agents` name without the `sdd-` prefix (rule 8); or an internal error. The hook writes the deny decision on standard output and exits 2; Copilot CLI reports that exit as 1 and fails closed (S-08 §2.2). No fault, and allowed: a readable call without `agent_type` (C002-REQ-320, C002-REQ-330), an Architect agent's call under sdd MCP server enforcement (C002-REQ-330), a non-Architect subagent's call outside a repository with `.sdd/` (C002-REQ-329). `<tool or "tool call">` is the input's `tool_name` when it is a non-empty string, else `tool call`. `<fault>` is one of `hook command usage: <option>` (`<option>` is `--host`, `--mode`, `--agents` or the option parser's detail), `unreadable hook input`, `no cwd`, `workspace lookup failed: <detail>`, `no tool name`, `tool <name> is not in the tool classes`, `tool classes file unreadable: <detail>`, `no path in the tool input (<pointers>)` (`<pointers>` the class's `paths` pointers, comma-separated), `internal error: <detail>` (`agent <agent> of --agents is not an sdd- agent name` for the prefix case) | `GUARD-HOOK-001: <tool or "tool call"> denied — <fault>.` | Fix the hook input, the hook command or the tool classes of the Copilot target package; a tool that the tool classes do not name stays denied until a spike record supplies its class (C002-REQ-308 open item) | C002-REQ-309, C002-REQ-328, C002-AC-309.1 |
| GUARD-HOOK-002 | In either Copilot enforcement mode, a non-Architect subagent (an `agent_type` that names none of the ten Architect agents: a host built-in agent such as `general-purpose`, an agent of the adopter, or a non-string value) calls a tool of the class `write` or `terminal` of the tool classes file while the workspace lookup from the hook input's `cwd` finds `.sdd/` (C002-IF-008 §2 rule 6). Denied whatever the target path or command; deny decision on standard output, exit 2. `<agent_type>` is the input's value, written as JSON when it is not a string | `GUARD-HOOK-002: <tool> denied — subagent <agent_type> is not an Architect agent, and this repository contains .sdd/. Allowed: read-only tools.` | Make the change in your own chat, whose session agent is not guarded, or through the Architect conductor and its specialists; or work in a repository without `.sdd/` (C002-IF-005 §5 step 6) | C002-REQ-327, C002-REQ-304 |

## 7. Target structure checks

See C002-IF-005 §6 (`TGT-*` codes on the target packages, `PLG-VAR-001` on the source plugin and
`PLG-VER-001` on the repository's version sources); the codes added in the spec fix round are
TGT-SERENA-001 (C002-REQ-114) and TGT-CLASS-001 (C002-REQ-318), and PLG-VER-001 is added by the
revision for defect D-005.
