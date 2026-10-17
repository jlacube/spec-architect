---
id: C002-IF-010
artifact: spec/interface
kind: conventions
change: CHG-002
phase: 10-spec
status: draft
---

# C002-IF-010 — Eval runner contract

The eval cases under `evals/` call `runSession` of `evals/harness/session.mjs` (current-state E-9).
CHG-002 keeps that call and its options, and puts the host behind it: a runner per host
(C002-COMP-009). No case file changes (C002-REQ-608).

## §1 Selection

`npm run eval -- --host claude-code|opencode|copilot-cli` (default `claude-code`, the existing
behaviour). The host is passed to `runSession` through the harness context; a case never names it.

## §2 `runSession` options (unchanged names)

| Option | Meaning on the generated targets |
|---|---|
| `agent` | Architect agent name. OpenCode: the runner removes the `architect:` prefix. Copilot CLI: the runner passes `--agent architect:<agent>`, the `<plugin>:<agent>` form Copilot CLI requires (a bare name fails; `docs/spikes/S-08-copilot-vscode.md §2.3`, fact F-6), `architect` being the package's plugin name (C002-IF-005 §3), so a case's `architect:` name is passed unchanged |
| `prompt`, `cwd` | as today |
| `answers` | scripted answers to question-tool calls; used where the host lets a script answer (C002-REQ-610) |
| `allowTools` | Claude Code tool names; the runner translates them with the target's mapping table (C002-IF-001) and denies every other tool or permission request |
| `maxTurns` | default 30 (C002-NFR-105) |
| `maxBudgetUsd` | default 0.50; applied when the host reports spend, else recorded as `unreported` (C002-NFR-105 open item) |

## §3 Session result

Each runner returns the shape the graders read today, with host names mapped back to the source
names through the mapping table: an agent start is reported as `architect:<agent>`, a tool call by
its Claude Code tool name (for example `sdd-files_write_file` or `sdd-files-write_file` → `Write`), a question-tool call as
AskUserQuestion with the host's answer or `null` for a skipped or dismissed call. Added fields:

| Field | Value |
|---|---|
| `target` | `claude-code`, `opencode` or `copilot` (C002-TS-611, C002-TS-612, C002-TS-615) |
| `host_versions` | versions read at session start (C002-IF-009, release evidence) |
| `end_reason` | `completed`, `turn cap`, `spend cap`, `question unanswerable`, `error` (C002-TS-614) |
| `usage` | `{ "turns": n, "usd": number or null }` |

## §4 Back ends

| Runner | Drives | Caps | Question calls |
|---|---|---|---|
| OpenCode | the OpenCode server and JS SDK at the tested version, with the generated OpenCode package in a temporary project (C002-R-001 D-01, D-02); permission requests answered by the `allowTools` policy | turns counted from assistant steps; spend from message cost when present; the session is aborted at a cap (C002-REQ-611) | answered from `answers` when spike S-07 shows a reply route; otherwise the session ends with `question unanswerable` |
| Copilot CLI | `copilot -p <prompt> --agent architect:<agent> --plugin-dir <package copy> --additional-mcp-config @<servers file> --output-format json --no-ask-user`, run in the case's temporary git workspace with a temporary Copilot home (`COPILOT_HOME`; C002-R-001 D-03; C002-AS-04 settled by S-08 §2.1, §2.4). Preparation per session: copy `dist/copilot/` to a temporary folder and run `sdd install copilot --package <package copy>` in the workspace (C002-IF-007), so that the copy has its `hooks.json` and the workspace its agents and `.vscode/mcp.json`; then write the `servers` entries of the copy's `install/mcp.json` in Copilot CLI's `mcpServers` form to the servers file. The servers do not come from a plugin MCP configuration: the package declares none (C002-REQ-307) | turns counted from the JSON events; the process is killed at a cap | none: `--no-ask-user`; only non-interactive scenarios run (C002-REQ-612) |
| Stub | a scripted host for the runner tests (C002-TS-614) | as the runner under test | scripted |

[ASSUMPTION: S-08 — the record shows Copilot CLI 1.0.98 loading a plugin's .mcp.json (§2.4) but no per-session MCP option; the runner task confirms --additional-mcp-config with copilot --help at the tested version, and otherwise writes the same mcpServers entries to mcp-config.json of the temporary Copilot home; if Copilot CLI already starts the servers of the workspace's .vscode/mcp.json, the runner passes no servers file, so that no server name is declared twice (a duplicate name kept a server from being reached in S-08 §3.1)]
A hook deny shows in the JSON events as a fail-closed hook error, not as exit code 2 (S-08 §2.2);
the runner reports such a call as a tool call that did not run.

Eval spend stays within the project budget: dev tier on every target, milestone tier on Claude Code
and on the first port only, the first generated target that is released (ideation §9, C002-US-603).

**Release evidence by mode.** The injection summary of a runner is release evidence for OpenCode,
and for Copilot VS Code under sdd MCP server enforcement when spike S-08 shows that Copilot CLI
loads the package (C002-AS-04). Under the Copilot hooks fallback the boundary is the Copilot guard
hooks in VS Code, which Copilot CLI does not exercise (a separate hook implementation, C002-R-001),
so the Copilot CLI runner's injection results are recorded with `source: copilot-cli-runner` but not
counted: the injection evidence is the checklist record's injection steps, run in VS Code with hooks
enabled (C002-REQ-628, C002-REQ-629, C002-IF-009 §5).
