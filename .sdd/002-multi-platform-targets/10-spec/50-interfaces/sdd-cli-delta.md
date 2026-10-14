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
| `--version` | — (alone) | Print the bare version (`0.3.0`) and exit 0. `sdd version` keeps printing `architect-plugin@<semver>` | C002-REQ-407, C002-REQ-509 (C002-TS-409, C002-TS-501, C002-TS-515) |
| `host-version` | `opencode` or `vscode`; `--json` | Read the host's version without a shell operator: `opencode` runs `opencode --version`; `vscode` runs `code --version` and `code --list-extensions --show-versions` and reads the hooks state (§Output). The probes are fixed commands with fixed arguments; a `.cmd` shim is run through the platform shell only for these fixed command lines | C002-REQ-504, C002-REQ-508, C002-REQ-510 |
| `template show` | `<profile>/<path>` (for example `full/10-spec/60-architecture/architecture.md`, `constitution/constitution.md`) | Print the template: `.sdd/_templates/<profile>/<path>` when it exists, else the template shipped beside the CLI (C002-IF-003 §1); ERR-CLI-019 when neither exists | C002-IF-001 §2 (construct `plugin-root-templates`) |
| `template list` | `<profile>` | Print the template paths of the profile, one per line, sorted | — |
| `serena-config` | `--user-data` instead of the folder | Use the per-user data folder: `%LOCALAPPDATA%\architect-sdd` (Windows), `~/Library/Application Support/architect-sdd` (macOS), `$XDG_DATA_HOME/architect-sdd` or `~/.local/share/architect-sdd` (Linux); ERR-CLI-020 when it cannot be determined | C001-REQ-1013 on the generated targets |
| `serena-launch` | `--user-data` as above; `--read-only` | `--user-data` also sets `SERENA_HOME` to `<data>/serena` for the child; `--read-only` adds `--mode <cli folder>/../serena/architect-read-only.yml` to the Serena arguments | C001-REQ-1006, C001-REQ-1013 on the generated targets |
| `hook guard` | `--host copilot`, `--agent <agent>` (an Architect agent name), `--classes <file>` | Agent-scoped guard of the Copilot hooks fallback: read Copilot PreToolUse input on standard input, classify the tool with the classes file and run the path or bash guard core for that agent with the memory folder off (C002-IF-008 §2, §5). Exit 0 allow; exit 2 deny with the guard message, or GUARD-HOOK-001 on any fault | C002-REQ-308, C002-REQ-309 |
| `hook session-start` | `--host copilot` | The status brief of C001-IF-07 §4 from Copilot SessionStart input; nothing without `.sdd/`; always exit 0. Without `--host` (Claude Code) unchanged | C002-REQ-313, C002-REQ-314 |
| `hook subagent-stop` | `--host copilot`, `--agents <list>` | When the input's `agent_type`, with any `architect:` prefix removed, is in the list, run `trace --quiet --write --active`; otherwise do nothing. Always exit 0, also when the trace fails | C002-REQ-315 |
| `guard-bash` | unchanged arguments | Allowlist rows of C002-IF-008 §1 (bare `sdd …`, `node --version`) | C002-REQ-503 |

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success; `hook guard`: allow; `hook session-start` and `hook subagent-stop`: always |
| 1 | `host-version`: the host is not installed or not found on PATH (`<host> missing` printed) |
| 2 | Usage error or refused operation (ERR-CLI-003, ERR-CLI-019, ERR-CLI-020); `hook guard`: deny or fault |
| 3 | Internal error (ERR-CLI-016), except in `hook guard`, which turns every internal error into exit 2 (C002-CON-08) |

## Output

- `--version`: one line, the version.
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
