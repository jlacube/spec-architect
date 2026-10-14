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
| `agent` | Architect agent name; the runner removes the `architect:` prefix for the host |
| `prompt`, `cwd` | as today |
| `answers` | scripted answers to question-tool calls; used where the host lets a script answer (C002-REQ-610) |
| `allowTools` | Claude Code tool names; the runner translates them with the target's mapping table (C002-IF-001) and denies every other tool or permission request |
| `maxTurns` | default 30 (C002-NFR-105) |
| `maxBudgetUsd` | default 0.50; applied when the host reports spend, else recorded as `unreported` (C002-NFR-105 open item) |

## §3 Session result

Each runner returns the shape the graders read today, with host names mapped back to the source
names through the mapping table: an agent start is reported as `architect:<agent>`, a tool call by
its Claude Code tool name (for example `sdd-files_write_file` → `Write`), a question-tool call as
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
| Copilot CLI | `copilot -p <prompt> --agent <agent> --output-format json --no-ask-user` with the Copilot package installed in a temporary Copilot home (C002-R-001 D-03; C002-AS-04) | turns counted from the JSON events; the process is killed at a cap | none: `--no-ask-user`; only non-interactive scenarios run (C002-REQ-612) |
| Stub | a scripted host for the runner tests (C002-TS-614) | as the runner under test | scripted |

Eval spend stays within the project budget: dev tier on both generated targets, milestone tier on
Claude Code only (ideation §9).
