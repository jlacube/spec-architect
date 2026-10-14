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
(C002-COMP-018, C002-COMP-012).

## Synopsis

```text
sdd --version
sdd host-version opencode|vscode [--json]
sdd template show <profile>/<path>
sdd template list <profile>
sdd serena-config <plugin-data-dir> | --user-data
sdd serena-launch (<plugin-data-dir> | --user-data) [--read-only] -- <serena arguments>
sdd hook guard --host copilot --agent <agent> --classes <tool-classes.json>
sdd hook session-start [--host claude-code|copilot]
sdd hook subagent-stop --host copilot --agents <agent>[,<agent>…]
```

`sdd` is the `architect-sdd` executable on the generated targets and `node <plugin-root>/scripts/sdd.mjs`
on Claude Code; both are the same program (C002-REQ-501).

## Commands

| Command | Arguments / options | Effect | Requirements |
|---|---|---|---|
| `--version` | — (alone) | Print the bare version `<major>.<minor>.<patch>` (`0.3.0`) on one line and exit 0. `sdd version` keeps printing `architect-plugin@<semver>` (`src/cli/commands.ts:508`) | C002-REQ-511; used by C002-REQ-407, C002-REQ-509 (C002-TS-409, C002-TS-501, C002-TS-515, C002-TS-517) |
| `host-version` | `opencode` or `vscode`; `--json` | Read the host's version without a shell operator: `opencode` runs `opencode --version`; `vscode` runs `code --version` and `code --list-extensions --show-versions` and reads the hooks state (§Output). The probes are fixed commands with fixed arguments; a `.cmd` shim is run through the platform shell only for these fixed command lines | C002-REQ-504, C002-REQ-508, C002-REQ-510 |
| `template show` | `<profile>/<path>`, `<profile>` one of `full`, `lite`, `constitution` (for example `full/10-spec/60-architecture/architecture.md`, `constitution/constitution.md`) | Print the template: `.sdd/_templates/<profile>/<path>` when that file exists, else the template `<profile>/<path>` shipped beside the CLI (C002-IF-003 §1). Before the lookup, `<path>` is normalised (`..` segments removed) and each candidate is resolved through its real path; a candidate whose normalised or real path leaves its profile folder (`.sdd/_templates/<profile>/` or the shipped `templates/<profile>/`) is not used. ERR-CLI-019 when no candidate remains, when the profile is unknown, or when `<path>` leaves the profile folder (`full/../../package.json`, `full/../lite/…`, a link to a folder outside it); a path whose `..` stays inside the profile folder is accepted (C002-TS-522) | C002-REQ-513, C002-REQ-514; construct `plugin-root-templates` of C002-IF-001 §2 |
| `template list` | `<profile>` | Print every `<path>` for which `template show <profile>/<path>` prints a template: the union of the files under `.sdd/_templates/<profile>/` and the shipped `templates/<profile>/`, each path once, relative to the profile folder with `/` separators, in ascending code-point order (upper case before lower case). Files whose real path leaves the profile folder are not listed. An unknown profile prints no line; exit 0 | C002-REQ-520 (C002-TS-531, C002-TS-532) |
| `serena-config` | `<plugin-data-dir>` (unchanged), or `--user-data` instead of the folder | `--user-data` uses the per-user data folder of `architect-sdd`: `%LOCALAPPDATA%\architect-sdd` (Windows), `$HOME/Library/Application Support/architect-sdd` (macOS), `$XDG_DATA_HOME/architect-sdd`, or `$HOME/.local/share/architect-sdd` when `XDG_DATA_HOME` is unset or empty (Linux). ERR-CLI-020, before anything is written, when the variable the platform rule needs is unset or empty (no other fallback), when its value is a relative path, or when the folder resolves inside the repository root of C002-IF-008 §1.1 (letter case, drive letters and links resolved as there). A positional folder is used as given, as today; for Architect agents the bash guard confines it (C002-REQ-517) | C002-REQ-515, C002-REQ-516; C001-REQ-1013 on the generated targets |
| `serena-launch` | `--user-data` as above; `--read-only` | `--user-data` as for `serena-config` (ERR-CLI-020 before Serena starts) and also sets `SERENA_HOME` to `<data>/serena` for the child; `--read-only` adds `--mode <cli folder>/../serena/architect-read-only.yml` to the Serena arguments | C002-REQ-114, C002-REQ-512, C002-REQ-515, C002-REQ-516; C001-REQ-1006, C001-REQ-1013 on the generated targets |
| `hook guard` | `--host copilot`, `--agent <agent>` (an Architect agent name), `--classes <file>` | Agent-scoped guard of the Copilot hooks fallback: read Copilot PreToolUse input on standard input, classify the tool with the classes file and run the path or bash guard core for that agent with the memory folder off (C002-IF-008 §2, §5). Exit 0 allow; exit 2 deny with the guard message, or GUARD-HOOK-001 on any fault | C002-REQ-308, C002-REQ-309 |
| `hook session-start` | `--host copilot` | The status brief of C001-IF-07 §4 from Copilot SessionStart input; nothing without `.sdd/`; always exit 0. Without `--host` (Claude Code) unchanged | C002-REQ-313, C002-REQ-314 |
| `hook subagent-stop` | `--host copilot`, `--agents <list>` | When the input's `agent_type`, with any `architect:` prefix removed, is in the list, run `trace --quiet --write --active`; otherwise do nothing. Always exit 0, also when the trace fails | C002-REQ-315 |
| `guard-bash` | unchanged arguments | Allowlist rows of C002-IF-008 §1 (bare `sdd …`, `node --version`) and the Serena-command confinement of C002-IF-008 §1.1, which reads `CLAUDE_PLUGIN_DATA` from its own environment | C002-REQ-503, C002-REQ-517 |

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success; `hook guard`: allow; `hook session-start` and `hook subagent-stop`: always |
| 1 | `host-version`: the host is not installed or not found on PATH (`<host> missing` printed) |
| 2 | Usage error or refused operation (ERR-CLI-003, ERR-CLI-019, ERR-CLI-020); `hook guard`: deny or fault |
| 3 | Internal error (ERR-CLI-016), except in `hook guard`, which turns every internal error into exit 2 (C002-CON-08) |

## Output

- `--version`: one line, the version.
- `template show`: the template bytes unchanged on standard output; nothing on standard error.
- `template list`: one path per line; nothing else.
- `host-version opencode`: `opencode <version>`.
- `host-version vscode`: three lines, `vscode <version>`, `copilot-chat <version>` (or
  `copilot-chat missing`), and `hooks enabled`, `hooks disabled (<source>)` or `hooks unknown`, where
  `<source>` is `chat.useHooks`, `workspace-trust` or `policy`. The sources each line reads are fixed
  by spike S-08 (C002-REQ-510 open item).
- `--json` (host-version): `{ "host": "vscode", "versions": { "vscode": "1.105.1", "copilot-chat":
  "0.32.4" }, "hooks": { "state": "enabled|disabled|unknown", "source": "…" } }`.
- `hook guard` deny: the guard message of C001-IF-07 §4 on standard error, nothing on standard
  output.
- Errors: `ERR-CLI-<nnn>: <message>. Fix: <corrective action>` on standard error (C001-IF-01).
