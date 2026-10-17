---
id: C002-IF-007
artifact: spec/interface
kind: CLI
change: CHG-002
phase: 10-spec
status: draft
---

# C002-IF-007 — sdd CLI additions (delta to C001-IF-01)

Every command of C001-IF-01 keeps its arguments, output and exit codes. CHG-002 adds the options and
commands below, which the generated targets need; on Claude Code nothing calls them except where a
row says so (C002-GOAL-05). Implemented in the CLI front-end and hook entry points
(C002-COMP-018, C002-COMP-012). Revised for defect D-003: `hook guard` keyed by `agent_type`,
`install copilot` added (`docs/spikes/S-08-copilot-vscode.md §5`).

## Synopsis

```text
sdd --version
sdd host-version opencode|vscode|vscode-insiders [--json]
sdd template show <profile>/<path>
sdd template list <profile>
sdd serena-config <plugin-data-dir> | --user-data
sdd serena-launch (<plugin-data-dir> | --user-data) [--read-only] -- <serena arguments>
sdd hook guard --host copilot --agents <agent>[,<agent>…] [--classes <tool-classes.json>]
sdd hook session-start [--host claude-code|copilot]
sdd hook subagent-stop --host copilot --agents <agent>[,<agent>…]
sdd install copilot [--package <dir>]
```

`sdd` is the `architect-sdd` executable on the generated targets and `node <plugin-root>/scripts/sdd.mjs`
on Claude Code; both are the same program (C002-REQ-501).

## Commands

| Command | Arguments / options | Effect | Requirements |
|---|---|---|---|
| `--version` | — (alone) | Print the bare version `<major>.<minor>.<patch>` (`0.3.0`) on one line and exit 0. `sdd version` keeps printing `architect-plugin@<semver>` (`src/cli/commands.ts:508`) | C002-REQ-511; used by C002-REQ-407, C002-REQ-509 (C002-TS-409, C002-TS-501, C002-TS-515, C002-TS-517) |
| `host-version` | `opencode`, `vscode` or `vscode-insiders`; `--json` | Read the host's version without a shell operator: `opencode` runs `opencode --version`; `vscode` runs `code --version` and `code --list-extensions --show-versions` and reads the hooks state (§Output); `vscode-insiders` does the same with `code-insiders`, and the Copilot doctor variant uses it when the table's tested VS Code version ends in `-insider`, as the build S-08 tested does (C002-IF-009 §3). The probes are fixed commands with fixed arguments; a `.cmd` shim is run through the platform shell only for these fixed command lines | C002-REQ-504, C002-REQ-508, C002-REQ-510 |
| `template show` | `<profile>/<path>`, `<profile>` one of `full`, `lite`, `constitution` (for example `full/10-spec/60-architecture/architecture.md`, `constitution/constitution.md`) | Print the template: `.sdd/_templates/<profile>/<path>` when that file exists, else the template `<profile>/<path>` shipped beside the CLI (C002-IF-003 §1). Before the lookup, `<path>` is normalised (`..` segments removed) and each candidate is resolved through its real path; a candidate whose normalised or real path leaves its profile folder (`.sdd/_templates/<profile>/` or the shipped `templates/<profile>/`) is not used. ERR-CLI-019 when no candidate remains, when the profile is unknown, or when `<path>` leaves the profile folder (`full/../../package.json`, `full/../lite/…`, a link to a folder outside it); a path whose `..` stays inside the profile folder is accepted (C002-TS-522) | C002-REQ-513, C002-REQ-514; construct `plugin-root-templates` of C002-IF-001 §2 |
| `template list` | `<profile>` | Print every `<path>` for which `template show <profile>/<path>` prints a template: the union of the files under `.sdd/_templates/<profile>/` and the shipped `templates/<profile>/`, each path once, relative to the profile folder with `/` separators, in ascending code-point order (upper case before lower case). Files whose real path leaves the profile folder are not listed. An unknown profile prints no line; exit 0 | C002-REQ-520 (C002-TS-531, C002-TS-532) |
| `serena-config` | `<plugin-data-dir>` (unchanged), or `--user-data` instead of the folder | `--user-data` uses the per-user data folder of `architect-sdd`: `%LOCALAPPDATA%\architect-sdd` (Windows), `$HOME/Library/Application Support/architect-sdd` (macOS), `$XDG_DATA_HOME/architect-sdd`, or `$HOME/.local/share/architect-sdd` when `XDG_DATA_HOME` is unset or empty (Linux). ERR-CLI-020, before anything is written, when the variable the platform rule needs is unset or empty (no other fallback), when its value is a relative path, or when the folder resolves inside the repository root of C002-IF-008 §1.1 (letter case, drive letters and links resolved as there). A positional folder is used as given, as today; for Architect agents the bash guard confines it (C002-REQ-517) | C002-REQ-515, C002-REQ-516; C001-REQ-1013 on the generated targets |
| `serena-launch` | `--user-data` as above; `--read-only` | `--user-data` as for `serena-config` (ERR-CLI-020 before Serena starts) and also sets `SERENA_HOME` to `<data>/serena` for the child; `--read-only` adds `--mode <cli folder>/../serena/architect-read-only.yml` to the Serena arguments | C002-REQ-114, C002-REQ-512, C002-REQ-515, C002-REQ-516; C001-REQ-1006, C001-REQ-1013 on the generated targets |
| `hook guard` | `--host copilot`; `--agents <list>`, the Architect agent names, comma-separated; `--classes <file>`, default `hooks/tool-classes.json` of the package that holds the running `scripts/sdd.mjs` (`<cli folder>/../hooks/tool-classes.json`) | Copilot guard hook of the Copilot hooks fallback, declared once at plugin level (C002-IF-005 §3): read Copilot PreToolUse input on standard input; a call whose `agent_type`, with any `architect:` prefix removed, is not in `--agents` (or that has no `agent_type`) is allowed without reading the classes file; for an Architect agent's call, classify the tool with the classes file and run the path or bash guard core for that agent with the memory folder off (C002-IF-008 §2, §5). Exit 0 allow, nothing on standard output; deny: the deny decision on standard output, the guard message or GUARD-HOOK-001 on standard error, exit 2 | C002-REQ-308, C002-REQ-309, C002-REQ-319, C002-REQ-320 |
| `install copilot` | `--package <dir>`: the Copilot target package folder; default: the package that holds the running CLI, when it runs as `node <package>/scripts/sdd.mjs` and `<package>/architect-target.json` names the target `copilot`. The repository is the repository root of C002-IF-008 §1.1 rule 3 from the working folder (global `--cwd` as usual) | The Copilot install command (§Install). Writes the ten workspace agents, merges the server entries into `.vscode/mcp.json`, writes the package's `hooks.json` and the install record; or writes nothing and refuses (ERR-CLI-021, ERR-CLI-022). Never run by an Architect agent: the bash guard denies it in every form (C002-IF-008 §1.2, C002-REQ-325) | C002-REQ-322, C002-REQ-323, C002-REQ-324, C002-REQ-326 |
| `hook session-start` | `--host copilot` | The status brief of C001-IF-07 §4 from Copilot SessionStart input; nothing without `.sdd/`; always exit 0. Without `--host` (Claude Code) unchanged | C002-REQ-313, C002-REQ-314 |
| `hook subagent-stop` | `--host copilot`, `--agents <list>` | When the input's `agent_type`, with any `architect:` prefix removed, is in the list, run `trace --quiet --write --active`; otherwise do nothing. Always exit 0, also when the trace fails. VS Code reports a workspace agent as `sdd-planner`, Copilot CLI a plugin agent as `architect:sdd-planner` (S-08 §2.3, §3.1) | C002-REQ-315 |
| `guard-bash` | unchanged arguments | Allowlist rows of C002-IF-008 §1 (bare `sdd …`, `node --version`), the Serena-command confinement of C002-IF-008 §1.1, which reads `CLAUDE_PLUGIN_DATA` from its own environment, and the `--cwd` confinement of the writing subcommands of C002-IF-008 §1.2 | C002-REQ-503, C002-REQ-517, C002-REQ-521 |

### Install (`sdd install copilot`)

Run by P-03 in their own terminal, once per repository and again after the package moves or
changes version (C002-IF-005 §5). Source files and targets: C002-IF-005 §3 ("What the install
command writes").

1. **Package.** Resolve the package folder (`--package`, else the default above) to an absolute
   path. ERR-CLI-022 when the folder holds no `architect-target.json`, the manifest does not parse
   or names a target other than `copilot`, a source file of C002-IF-005 §3 is missing, or the
   absolute path holds `"`, `$`, `%`, a backtick or a control character (the path is written into
   hook commands, C002-IF-008 §4). `install` with a target other than `copilot`: ERR-CLI-003.
2. **Install record.** Read `<repo>/.github/architect-install.json` when it exists: `{
   "package_version": "<semver>", "agents": { "<repo-relative path>": "sha256:<hex>" },
   "mcp_servers": { "<name>": "sha256:<hex>" } }`, where a server's hash is taken over its entry
   serialised with sorted keys and no white space. A record that does not parse counts as absent.
3. **Recognition.** A file or server entry was written by this command exactly when the record
   lists it with the SHA-256 of its present content. A file or entry edited after the install is
   therefore treated as the adopter's.
4. **Checks, before any write** (C002-REQ-324). A conflict is: an existing
   `.github/agents/sdd-<agent>.agent.md` that is not recognised and differs from the package's file;
   a `.vscode/mcp.json` that does not parse as strict JSON (RFC 8259; comments and trailing commas
   included, which a rewrite would drop), whose top level is not an object or whose `servers` is
   present and not an object; an entry of `servers` with the name of a package server that is not
   recognised and differs from the package's entry. A file or entry equal to the package's is not a
   conflict. On any conflict: one ERR-CLI-021 line per file or server, nothing written, exit 2.
5. **Writes** (C002-REQ-322, C002-REQ-323, C002-REQ-326), each through a temporary file and a
   rename: the ten agent files (folders created as needed); `.vscode/mcp.json` with the package's
   server entries added or replaced and every other key and entry kept in its place (new entries
   appended in code-point order; two-space indentation, LF, final newline); `<package>/hooks.json`
   from `install/hooks.template.json` with every `@CLI_COPY@` replaced by
   `<package>/scripts/sdd.mjs` (absolute, `/` separators); last the install record. A write that
   fails ends with ERR-CLI-017 (exit 3) naming the file and every file already written; those files
   equal the package's, so a second run finds no conflict in them (step 4) and completes the
   install.
6. **Output.** One line per target, `written <path>`, `unchanged <path>` or `merged .vscode/mcp.json
   (<server names>)`, then `next: select sdd-conductor in a Local chat (INSTALL.md step 4)`.

Nothing else in the repository is read or written; `.sdd/` is neither required nor created.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success; `hook guard`: allow; `hook session-start` and `hook subagent-stop`: always; `install copilot`: every file written or unchanged |
| 1 | `host-version`: the host is not installed or not found on PATH (`<host> missing` printed) |
| 2 | Usage error or refused operation (ERR-CLI-003, ERR-CLI-019, ERR-CLI-020, ERR-CLI-021, ERR-CLI-022); `hook guard`: deny or fault (Copilot CLI on Windows reports this exit as 1 and fails closed, S-08 §2.2) |
| 3 | Internal error (ERR-CLI-016) or failed write (ERR-CLI-017), except in `hook guard`, which turns every internal error into a deny with exit 2 (C002-CON-08) |

## Output

- `--version`: one line, the version.
- `template show`: the template bytes unchanged on standard output; nothing on standard error.
- `template list`: one path per line; nothing else.
- `host-version opencode`: `opencode <version>`.
- `host-version vscode` (and `vscode-insiders`, with the same lines): three lines, `vscode <version>`, `copilot-chat <version>` (or
  `copilot-chat missing`), and `hooks enabled`, `hooks disabled (<source>)` or `hooks unknown`, where
  `<source>` is `chat.useHooks`, `workspace-trust` or `policy`. The sources each line reads are fixed
  by spike S-08 (C002-REQ-510 open item).
- `--json` (host-version): `{ "host": "vscode", "versions": { "vscode": "1.105.1", "copilot-chat":
  "0.32.4" }, "hooks": { "state": "enabled|disabled|unknown", "source": "…" } }`.
- `hook guard` deny: on standard output one JSON object, the deny decision of C002-IF-008 §2; on
  standard error the guard message of C001-IF-07 §4 or the GUARD-HOOK-001 message. Allow: nothing
  on either stream.
- `install copilot`: the lines of §Install step 6 on standard output; refusals on standard error.
- Errors: `ERR-CLI-<nnn>: <message>. Fix: <corrective action>` on standard error (C001-IF-01).
