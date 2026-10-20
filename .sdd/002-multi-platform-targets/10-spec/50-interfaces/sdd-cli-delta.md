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
`install copilot` added (`docs/spikes/S-08-copilot-vscode.md §5`); after the critic's D-003 review,
`hook guard` takes `--mode` and is the Copilot subagent guard hook in both modes, and `install
copilot` also writes the workspace hook file and the package's manifest (Q-safety-06, Q-safety-07;
CR-37, CR-38). Revised for defects D-012 (the hooks line reads `chat.useHooks` only) and D-013
(item 8: the refusal reasons and output of `install copilot` as implemented, and `scripts/sdd.mjs`
made a required source file; item 7: MSIX AppData redirection of the per-user data folder).
Revised for the critic's D-010 … D-014 review: CR-45 (an unusable workspace settings file gives
`hooks unknown`; the settings files not read are named) and CR-50 (the install's agent files are
exactly those of the guard hook's `--agents` names). Revised for defect D-020 item 4 (`host-version`
reports the host first on the PATH) and, after the critic's D-018 … D-020 review, for CR-63 (the
probes resolve their executables over the PATH folders only, never the working folder, and run them
by absolute path).

## Synopsis

```text
sdd --version
sdd host-version opencode|vscode|vscode-insiders [--json]
sdd template show <profile>/<path>
sdd template list <profile>
sdd serena-config <plugin-data-dir> | --user-data
sdd serena-launch (<plugin-data-dir> | --user-data) [--read-only] -- <serena arguments>
sdd hook guard --host copilot --mode sdd-mcp-server|copilot-hooks --agents <agent>[,<agent>…] [--classes <tool-classes.json>]
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
| `host-version` | `opencode`, `vscode` or `vscode-insiders`; `--json` | Read the host's version without a shell operator: `opencode` runs `opencode --version`; `vscode` runs `code --version` and `code --list-extensions --show-versions` and reads the hooks state (§Output). **Executable resolution** (revised for defect D-020 item 4 and for critic CR-63): the CLI resolves each executable name itself, over the folders of the CLI process's PATH in their order, and never in the working folder or the repository. On Windows each folder is tried for the name with each extension of `PATHEXT`, in order (`.COM;.EXE;.BAT;.CMD` when `PATHEXT` is unset or empty); on other platforms a regular file with execute permission is taken. An empty or relative PATH entry is skipped, since it would name the working folder. The first match is the executable that a PowerShell terminal of P-03 with the same PATH starts by that name (PowerShell does not look in the current folder), not necessarily the binary that runs the session; no match gives `<host> missing`; no option names another executable (C002-IF-006 §2, which row the doctor reports; C002-IF-010 §4, PATH lead of the eval runner). The probe runs the match by its absolute path, with its fixed arguments and with the folder that holds it as the process's working folder, never the repository: a native executable directly, a `.cmd` or `.bat` shim through the platform shell with its absolute path quoted, the only use of a shell, and for these fixed command lines only. So an `opencode.cmd`, `code.cmd` or `node.exe` placed in the adopter's repository is never started by a probe, also not by an npm shim that starts `node` by name. The same resolution holds for every executable that the CLI starts as a probe. `vscode-insiders` does the same with `code-insiders`, and the Copilot doctor variant uses it when the table's tested VS Code version ends in `-insider`, as the build S-08 tested does (C002-IF-009 §3) | C002-REQ-504, C002-REQ-508, C002-REQ-510 |
| `template show` | `<profile>/<path>`, `<profile>` one of `full`, `lite`, `constitution` (for example `full/10-spec/60-architecture/architecture.md`, `constitution/constitution.md`) | Print the template: `.sdd/_templates/<profile>/<path>` when that file exists, else the template `<profile>/<path>` shipped beside the CLI (C002-IF-003 §1). Before the lookup, `<path>` is normalised (`..` segments removed) and each candidate is resolved through its real path; a candidate whose normalised or real path leaves its profile folder (`.sdd/_templates/<profile>/` or the shipped `templates/<profile>/`) is not used. ERR-CLI-019 when no candidate remains, when the profile is unknown, or when `<path>` leaves the profile folder (`full/../../package.json`, `full/../lite/…`, a link to a folder outside it); a path whose `..` stays inside the profile folder is accepted (C002-TS-522) | C002-REQ-513, C002-REQ-514; construct `plugin-root-templates` of C002-IF-001 §2 |
| `template list` | `<profile>` | Print every `<path>` for which `template show <profile>/<path>` prints a template: the union of the files under `.sdd/_templates/<profile>/` and the shipped `templates/<profile>/`, each path once, relative to the profile folder with `/` separators, in ascending code-point order (upper case before lower case). Files whose real path leaves the profile folder are not listed. An unknown profile prints no line; exit 0 | C002-REQ-520 (C002-TS-531, C002-TS-532) |
| `serena-config` | `<plugin-data-dir>` (unchanged), or `--user-data` instead of the folder | `--user-data` uses the per-user data folder of `architect-sdd`: `%LOCALAPPDATA%\architect-sdd` (Windows), `$HOME/Library/Application Support/architect-sdd` (macOS), `$XDG_DATA_HOME/architect-sdd`, or `$HOME/.local/share/architect-sdd` when `XDG_DATA_HOME` is unset or empty (Linux). ERR-CLI-020, before anything is written, when the variable the platform rule needs is unset or empty (no other fallback), when its value is a relative path, or when the folder resolves inside the repository root of C002-IF-008 §1.1 (letter case, drive letters and links resolved as there). A positional folder is used as given, as today; for Architect agents the bash guard confines it (C002-REQ-517). Known platform condition, no behaviour of the CLI: on Windows, a process started by an application installed as an MSIX package, such as the Claude desktop app, has its writes under `%LOCALAPPDATA%` redirected to `%LOCALAPPDATA%\Packages\<package>\LocalCache\Local\…` (glossary: MSIX AppData redirection), so a per-user data folder written from such a session is not the folder that OpenCode or VS Code started outside the package see; the CLI resolves the folder the same way in both cases and ERR-CLI-020 does not apply to it (C002-REQ-515, C002-REQ-516 rationale; defect D-013 item 7) | C002-REQ-515, C002-REQ-516; C001-REQ-1013 on the generated targets |
| `serena-launch` | `--user-data` as above; `--read-only`, optional | `--user-data` as for `serena-config` (ERR-CLI-020 before Serena starts) and also sets `SERENA_HOME` to `<data>/serena` for the child; `--read-only` adds `--mode <cli folder>/../serena/architect-read-only.yml` to the Serena arguments. A launch without `--read-only` is a valid command, and the bash guard allows it (C002-IF-008 §1.1 rule 1, BG-381); the target packages always pass the option (TGT-SERENA-001) | C002-REQ-114, C002-REQ-512, C002-REQ-515, C002-REQ-516; C001-REQ-1006, C001-REQ-1013 on the generated targets |
| `hook guard` | `--host copilot`; `--mode`, the enforcement mode of the package (`sdd-mcp-server` or `copilot-hooks`); `--agents <list>`, the ten Architect agent names, comma-separated; `--classes <file>`, default `hooks/tool-classes.json` of the package that holds the running `scripts/sdd.mjs` (`<cli folder>/../hooks/tool-classes.json`) | The PreToolUse hook of the Copilot target package, the same entry in the package's `hooks.json` and in the workspace hook file (C002-IF-005 §3): read Copilot PreToolUse input on standard input and decide it by the order of C002-IF-008 §2. A call without `agent_type` is allowed; an Architect agent's call is allowed under `--mode sdd-mcp-server` and decided by its tool class and the path or bash guard core, memory folder off, under `--mode copilot-hooks` (C002-IF-008 §2, §5); a non-Architect subagent's call in a repository with `.sdd/` is denied for a `write` or `terminal` tool (GUARD-HOOK-002), allowed for a `read_only` tool and denied for an unclassed one, and allowed in a repository without `.sdd/`. A `--host` other than `copilot`, a missing or unknown `--mode`, a missing or empty `--agents`, or any other option error is a deny with GUARD-HOOK-001, not a usage error (C002-IF-008 §2 rule 1). Exit 0 allow, nothing on standard output; deny: the deny decision on standard output, the guard message, GUARD-HOOK-001 or GUARD-HOOK-002 on standard error, exit 2 | C002-REQ-308, C002-REQ-309, C002-REQ-319, C002-REQ-320, C002-REQ-327, C002-REQ-328, C002-REQ-329, C002-REQ-330 |
| `install copilot` | `--package <dir>`: the Copilot target package folder; default: the package that holds the running CLI, when it runs as `node <package>/scripts/sdd.mjs` and `<package>/architect-target.json` names the target `copilot`. The repository is the repository root of C002-IF-008 §1.1 rule 3 from the working folder (global `--cwd` as usual) | The Copilot install command (§Install). Writes the package's `hooks.json`, the workspace hook file `.github/hooks/architect-guard.json` and the package's `plugin.json`, then the workspace agents of the guard hook's `--agents` names (the ten Architect agents; §Install step 1), merges the server entries into `.vscode/mcp.json`, and writes the install record; or writes nothing and refuses (ERR-CLI-021, ERR-CLI-022). Never run by an Architect agent: the bash guard denies it in every form (C002-IF-008 §1.2, C002-REQ-325) | C002-REQ-322, C002-REQ-323, C002-REQ-324, C002-REQ-326, C002-REQ-327 |
| `hook session-start` | `--host copilot` | The status brief of C001-IF-07 §4 from Copilot SessionStart input; nothing without `.sdd/`; always exit 0. Without `--host` (Claude Code) unchanged | C002-REQ-313, C002-REQ-314 |
| `hook subagent-stop` | `--host copilot`, `--agents <list>` | When the input's `agent_type`, with any `architect:` prefix removed, is in the list, run `trace --quiet --write --active`; otherwise do nothing. Always exit 0, also when the trace fails. VS Code reports a workspace agent as `sdd-planner`, Copilot CLI a plugin agent as `architect:sdd-planner` (S-08 §2.3, §3.1) | C002-REQ-315 |
| `guard-bash` | unchanged arguments | Allowlist rows of C002-IF-008 §1 (bare `sdd …`, `node --version`), the Serena-command confinement of C002-IF-008 §1.1, which reads `CLAUDE_PLUGIN_DATA` from its own environment, and the `--cwd` confinement of the writing subcommands of C002-IF-008 §1.2 | C002-REQ-503, C002-REQ-517, C002-REQ-521 |

### Install (`sdd install copilot`)

Run by P-03 in their own terminal, once per repository and again after the package moves or
changes version (C002-IF-005 §5). Source files and targets: C002-IF-005 §3 ("What the install
command writes").

1. **Package.** Resolve the package folder (`--package` against the working folder, else the
   default above) to an absolute path, and read the package before anything in the repository. The
   checks, in this order, each refusing with ERR-CLI-022 and the `<reason>` of `errors.md` §5:
   - no `--package`, and the running CLI is not the `scripts/sdd.mjs` of a folder whose
     `architect-target.json` names the target `copilot` (`<path>` is then the running CLI's file);
   - the absolute path holds `"`, `$`, `%`, a backtick or a control character (the path is written
     into hook commands, C002-IF-008 §4);
   - the folder does not exist;
   - the folder holds no `architect-target.json`, or the manifest does not parse, is not a JSON
     object, names a target other than `copilot`, gives no non-empty `package_version`, or lists
     in its `files` no file `agents/<agent name>.agent.md`;
   - a source file of C002-IF-005 §3 is missing: the agent files that the manifest's `files` list
     (never read from the folder; the checks below compare them with the guard hook's agent
     names), `install/plugin.json`,
     `install/mcp.json`, `install/hooks.template.json`, `hooks/tool-classes.json` and
     `scripts/sdd.mjs`, every missing file named. The CLI copy is required although the install
     only writes its path: hook commands that name a missing copy error, and the hosts then deny
     every tool call of the session, so a package without it would install a repository whose
     every call is refused (decided for defect D-013 item 8, the fail-closed choice: the refusal
     comes before any write, C002-CON-08, C002-CON-14);
   - `install/mcp.json` does not parse or has no `servers` object;
   - `install/hooks.template.json` does not parse or has no `PreToolUse` entry under `hooks`;
   - the template's `PreToolUse` entries do not hold exactly one `hook guard` command with a
     non-empty `--agents` value. The **agent names** of the install are the names of that value:
     the word after `--agents` in the entry's `command`, split at commas, blank names dropped, as
     the hook splits it (C002-IF-008 §2); in a generated package they are the ten Architect agent
     names (C002-IF-008 §4, TGT-HOOK-001);
   - the manifest's `files` do not list `agents/<name>.agent.md` for every agent name;
   - the manifest's `files` list an `agents/<name>.agent.md` whose `<name>` is no agent name.

   The install therefore writes exactly the agent files of the guard hook's `--agents` names, the
   ten of a generated package, and refuses a package whose manifest lists other agent files or not
   all of them (fail closed, revised for critic CR-50): a workspace agent that the hook does not
   name would be a non-Architect subagent to it, and a name without its agent file would leave the
   conductor without that specialist. `install` with a target other than `copilot`: ERR-CLI-003.
2. **Install record.** Read `<repo>/.github/architect-install.json` when it exists: `{
   "package_version": "<semver>", "agents": { "<repo-relative path>": "sha256:<hex>" },
   "hook_files": { "<repo-relative path>": "sha256:<hex>" }, "mcp_servers": { "<name>":
   "sha256:<hex>" } }`, where a server's hash is taken over its entry serialised with sorted keys and
   no white space. A record that does not parse counts as absent; a record without `hook_files` (an
   install before this revision) lists no hook file.
3. **Recognition.** A file or server entry was written by this command exactly when the record
   lists it with the SHA-256 of its present content. A file or entry edited after the install is
   therefore treated as the adopter's.
4. **Checks, before any write** (C002-REQ-324). A conflict is: an existing
   `.github/agents/<agent name>.agent.md` or `.github/hooks/architect-guard.json` that is not
   recognised and differs from the content this run would write; a `.vscode/mcp.json` that does not
   parse as strict JSON (RFC 8259; comments and trailing commas included, which a rewrite would
   drop), whose top level is not an object or whose `servers` is present and not an object (each
   with the reason `cannot be parsed as JSON without comments: <detail>`, `<detail>` being the
   parser's message, `the top level is not an object` or `"servers" is not an object`); an entry
   of `servers` with the name of a package server that is not recognised and differs from the
   package's entry. A file or entry equal to what this run would write is not a conflict. On any
   conflict: one ERR-CLI-021 line per file or server, nothing written, exit 2. The package's own
   `hooks.json` and `plugin.json` are rewritten whenever their content differs from what this run
   writes; they are never a conflict.
5. **Writes** (C002-REQ-322, C002-REQ-323, C002-REQ-326, C002-REQ-327), each through a temporary
   file and a rename, in this order, so that an interrupted install never leaves agents without
   their guard hook (C002-CON-08): (a) `<package>/hooks.json` from `install/hooks.template.json` with
   every `@CLI_COPY@` replaced by `<package>/scripts/sdd.mjs` (absolute, `/` separators); (b) the
   workspace hook file `<repo>/.github/hooks/architect-guard.json`, `{ "hooks": { "PreToolUse": […]
   } }` holding the template's `PreToolUse` entries with the same replacement (two-space indentation,
   LF, final newline); (c) `<package>/plugin.json`, a byte copy of `install/plugin.json`; (d) the
   agent files of the agent names of step 1, the ten of a generated package, in the order the
   manifest lists them (folders created as needed); (e) `.vscode/mcp.json` with the package's server entries
   added or replaced and every other key and entry kept in its place (new entries appended in
   code-point order; two-space indentation, LF, final newline); (f) last the install record. A file
   whose present content equals what this run writes is not written again. A write that fails ends
   with ERR-CLI-017 (exit 3, C001-IF-01) naming the file and every file already written: its `<file>`
   placeholder holds `<path> (already written: <paths>)`, `<paths>` being the paths written before,
   comma-separated in write order, or `none`; those files equal what this run writes, so a second
   run finds no conflict in them (step 4) and completes the install.
6. **Output.** One line per target, in the order of step 5: `written <path>` or `unchanged <path>`
   for each file (the package's own files by their absolute path, the repository's by their
   repository-relative path), `written .vscode/mcp.json` when the file did not exist, `merged
   .vscode/mcp.json (<server names>)` when the run added or replaced entries of an existing file
   (names comma-separated, in the order of `install/mcp.json`), `unchanged .vscode/mcp.json`
   otherwise, the record's line, then `next: select sdd-conductor in a Local chat (INSTALL.md step
   4)`.

Nothing else in the repository is read or written; `.sdd/` is neither required nor created.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success; `hook guard`: allow; `hook session-start` and `hook subagent-stop`: always; `install copilot`: every file written or unchanged |
| 1 | `host-version`: the host is not installed or not found on PATH (`<host> missing` printed) |
| 2 | Usage error or refused operation (ERR-CLI-003, ERR-CLI-019, ERR-CLI-020, ERR-CLI-021, ERR-CLI-022); `hook guard`: deny or fault, its own usage errors included (GUARD-HOOK-001), always with the deny decision on standard output (Copilot CLI on Windows reports this exit as 1 and fails closed, S-08 §2.2) |
| 3 | Internal error (ERR-CLI-016) or failed write (ERR-CLI-017), except in `hook guard`, which turns every internal error into a deny with exit 2 (C002-CON-08) |

## Output

- `--version`: one line, the version.
- `template show`: the template bytes unchanged on standard output; nothing on standard error.
- `template list`: one path per line; nothing else.
- `host-version opencode`: `opencode <version>`.
- `host-version vscode` (and `vscode-insiders`, with the same lines): three lines, `vscode <version>`, `copilot-chat <version>` (or
  `copilot-chat missing`), and `hooks enabled`, `hooks disabled (chat.useHooks)` or `hooks unknown`.
  The hooks line reads the setting `chat.useHooks` only (revised for defect D-012; P-01 decision of
  2026-10-19; revised for critic CR-45), each file read as JSON with comments, in this order:
  1. The workspace settings `<repository root>/.vscode/settings.json`, which take precedence. A file
     that does not exist leads to item 2. A file that exists and cannot be read, does not parse, has
     no object at its top level, or holds `chat.useHooks` with a value other than `true` or `false`
     gives `hooks unknown`, and the user settings are not read: VS Code may still take a value from
     such a file that overrides them. Otherwise `true` is `hooks enabled`, `false` is `hooks
     disabled (chat.useHooks)`, and a file without the key leads to item 2.
  2. The user settings of the default profile of the probed build, `User/settings.json` of `Code` or
     `Code - Insiders` under the user configuration folder (`%APPDATA%` on Windows, `~/Library/Application
     Support` on macOS, `$XDG_CONFIG_HOME` or `~/.config` on Linux). `true` is `hooks enabled`,
     `false` is `hooks disabled (chat.useHooks)`; any other outcome (no file, a file that cannot be
     read or parsed or has no object at its top level, the key unset or another value) is `hooks
     unknown`.

  The line is never `enabled` in any other case. Not read: the settings of a VS Code profile other
  than the default one (`User/profiles/<profile>/settings.json`), the settings of a
  `.code-workspace` file, Workspace Trust and organisation policy (C002-REQ-510, C002-IF-006 §2).
- `--json` (host-version): `{ "host": "vscode", "versions": { "vscode": "1.105.1", "copilot-chat":
  "0.32.4" }, "hooks": { "state": "enabled|disabled|unknown", "source": "chat.useHooks" } }`,
  `source` present only with `disabled`.
- `hook guard` deny: on standard output one JSON object, the deny decision of C002-IF-008 §2; on
  standard error the guard message of C001-IF-07 §4, or the GUARD-HOOK-001 or GUARD-HOOK-002
  message. Allow: nothing on either stream.
- `install copilot`: the lines of §Install step 6 on standard output; refusals on standard error.
- Errors: `ERR-CLI-<nnn>: <message>. Fix: <corrective action>` on standard error (C001-IF-01).
