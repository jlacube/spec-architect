---
id: C001-SPIKE-S-04
task: C001-T-005
change: CHG-001
spike: S-04
title: "Hook input and agent identity"
date: 2026-10-10
verdict: works
guard_design: primary
risk_refs: [C001-RISK-002]
spec_refs: [C001-REQ-1103, C001-REQ-1105, C001-IF-07, C001-AS-09]
---

# S-04 — Hook input and agent identity

## Verdict

**works: primary guard design.** On Claude Code 2.1.295, plugin hooks receive the caller's
identity in `agent_type`, already namespaced with the plugin name
(`"architect:sdd-probe"`). This holds in two cases:

- **Plugin subagents:** every PreToolUse, PostToolUse and SubagentStop event of a plugin
  subagent carries `agent_type`, plus `agent_id`.
- **Plugin agent as main session:** every event of a session started with
  `--agent architect:<name>` carries `agent_type`, from SessionStart through SessionEnd, without
  an `agent_id`.

A probe guard implementing C001-REQ-1103 denied an Architect subagent's write outside
`.sdd/` (exit 2, with the stderr reason shown to the model), and allowed:

- the same agent's write inside `.sdd/`;
- the plain main session's write;
- a built-in `general-purpose` subagent's write.

The `SubagentStop` matcher of C001-IF-07 §2 (`^architect:sdd-(…)$`) matches on `agent_type`.

The fallback of C001-REQ-1105 is never needed on this version. Its premise also has no
source in hook input: when `agent_type` is missing, nothing identifies the session's main
agent. Spec defect **D-S04-1** proposes replacing it with a minimum Claude Code version.

**Important environment finding:** the `claude` CLI on this machine's PATH is **2.0.76**.
With it, every headless session failed on its first tool call with
`API Error 400: tool_use ids must be unique` (with or without hooks), and every hook fired
**twice**. The desktop app bundles **2.1.295**, which worked without errors; that binary
was used for all results below. The npm `latest` is 2.1.296.

## Method

| Item | Value |
|---|---|
| Machine | REF-WIN: Windows 11 Home 10.0.26200, Git Bash; Node 22.13.0 |
| Claude Code | 2.1.295 (desktop app bundle) for the results; 2.0.76 (PATH, `~/.local/bin/claude`) for the failed attempts |
| Plugin | a **scratch copy** of `plugins/architect/` loaded with `--plugin-dir` (nothing installed, no settings changed; Claude Code labels it `architect@inline`), plus: a logging hook (`hooks/log.mjs`, appends stdin JSON per event), a probe agent `sdd-probe` (tools Write, Bash; model haiku) and a probe guard (`hooks/guard-probe.mjs`). The repository's `plugins/architect/hooks/` was **not** modified, so there is nothing to remove there |
| Sessions | `claude -p … --plugin-dir <copy> --model haiku --max-budget-usd 0.3–0.5 --permission-mode acceptEdits --allowedTools Write "Bash(echo:*)" Agent --setting-sources project,local`, run in a scratch git project with the parent session's `CLAUDE*`/`ANTHROPIC*` variables removed. The first attempt inherited them from this desktop session (child-session markers, a messaging token and the account email), so its log was discarded. Total cost of the successful runs: under $0.02 |
| Events hooked | SessionStart, UserPromptSubmit, PreToolUse (`*`), PostToolUse (`*`), SubagentStop (plus three matcher variants), Stop, SessionEnd |

| Run | Scenario | Result |
|---|---|---|
| s1c | main session writes and runs Bash, then delegates the same to `architect:sdd-probe` | main-session events have no `agent_type`; subagent events carry `agent_id` + `agent_type: "architect:sdd-probe"` |
| s2 | `--agent architect:sdd-probe` as the main session, writes and runs Bash | **every** event carries `agent_type: "architect:sdd-probe"`; no `agent_id` |
| s3 | subagent delegation with SubagentStop matchers `^architect:sdd-(probe\|spec-writer)$`, `architect:sdd-nomatch`, `sdd-probe` | only the regex matcher fired: matching is on the full `agent_type` |
| s4 | probe guard: main-session write; Architect subagent writes `sub4.txt` (outside `.sdd/`), then `.sdd/ok4.txt`; `general-purpose` subagent writes `gp4.txt` | main session allowed (no `agent_type`); `sub4.txt` **denied** (exit 2, `GUARD-PATH-001` reason surfaced to the model, file not created); `.sdd/ok4.txt` allowed; `gp4.txt` allowed (`agent_type: "general-purpose"`, no plugin prefix) |

## Fields observed (Claude Code 2.1.295)

| Field | Events | Present when | Notes for C001-IF-07 §1 |
|---|---|---|---|
| `hook_event_name` | all | always | as specified |
| `session_id`, `transcript_path`, `cwd` | all | always | as specified; `cwd` is the project directory |
| `agent_type` | all | the caller is a subagent, or the session was started with `--agent` | **the identity field**: `"<plugin>:<agent>"` for plugin agents (`architect:sdd-probe`), bare for built-in agents (`general-purpose`); absent for a plain main session |
| `agent_id` | tool events, SubagentStop | the caller is a subagent | per-invocation ID (`a31dbdc1c0a1e9f9d`) |
| `tool_name` | Pre/PostToolUse | always | the subagent launcher is named `Agent` (consistent with `Agent(...)` in C001-AS-09) |
| `tool_input.file_path` | Write (Pre/Post) | — | **absolute** path, Windows separators |
| `tool_input.command`, `tool_input.description` | Bash | — | as specified |
| `tool_use_id`, `prompt_id`, `permission_mode`, `effort` | tool events | always | not used by the spec |
| `duration_ms` | PostToolUse | always | not used |
| `agent_transcript_path`, `last_assistant_message`, `background_tasks`, `session_crons`, `stop_hook_active` | SubagentStop | always | `background_tasks[].agent_type` also names the agent |
| `source` | SessionStart | always | `startup` here |

Hook environment: `CLAUDE_PLUGIN_ROOT` (the plugin directory), `CLAUDE_PROJECT_DIR`,
`CLAUDE_CODE_ENTRYPOINT`; on SessionStart also `CLAUDE_ENV_FILE`. No variable names the agent.

Decision semantics confirmed for PreToolUse: exit 2 blocks the call, and stderr is shown to
the model as the reason (C001-IF-07 §2).

Not covered by this spike: the `PowerShell` tool name in the bash-guard matcher (no
PowerShell tool call occurred), `NotebookEdit`, and the plugin label after a marketplace
install instead of `--plugin-dir` (S-05/T-006 installs from the marketplace).

## Captured inputs (sanitized)

Paths are shortened to `<repo>` / `<claude-projects>`; session and prompt UUIDs are replaced;
long strings are truncated to 120 characters; environment values are not reproduced.

### SessionStart (main session, no --agent)

```json
{"session_id": "<uuid>", "transcript_path": "<claude-projects>/<project>/<uuid>.jsonl", "cwd": "<repo>",
 "hook_event_name": "SessionStart", "source": "startup"}
```

### SessionStart (--agent architect:sdd-probe)

```json
{"session_id": "<uuid>", "transcript_path": "<claude-projects>/<project>/<uuid>.jsonl", "cwd": "<repo>",
 "agent_type": "architect:sdd-probe", "hook_event_name": "SessionStart", "source": "startup"}
```

### PreToolUse Write (main agent via --agent)

```json
{"session_id": "<uuid>", "transcript_path": "<claude-projects>/<project>/<uuid>.jsonl", "cwd": "<repo>",
 "prompt_id": "<uuid>", "permission_mode": "acceptEdits", "agent_type": "architect:sdd-probe",
 "effort": {"level": "medium"}, "hook_event_name": "PreToolUse", "tool_name": "Write",
 "tool_input": {"file_path": "<repo>/main2.txt", "content": "main2"}, "tool_use_id": "toolu_01Y9rboQ1axPDcNYBedNxhgy"}
```

### PreToolUse Write (main session, no --agent)

```json
{"session_id": "<uuid>", "transcript_path": "<claude-projects>/<project>/<uuid>.jsonl", "cwd": "<repo>",
 "prompt_id": "<uuid>", "permission_mode": "acceptEdits", "effort": {"level": "medium"},
 "hook_event_name": "PreToolUse", "tool_name": "Write",
 "tool_input": {"file_path": "<repo>/main4.txt", "content": "main4"}, "tool_use_id": "toolu_01JKLKpKvHkdPKNaSRgc6vq7"}
```

### PreToolUse Write (plugin subagent)

```json
{"session_id": "<uuid>", "transcript_path": "<claude-projects>/<project>/<uuid>.jsonl", "cwd": "<repo>",
 "prompt_id": "<uuid>", "permission_mode": "acceptEdits", "agent_id": "a31dbdc1c0a1e9f9d",
 "agent_type": "architect:sdd-probe", "effort": {"level": "medium"}, "hook_event_name": "PreToolUse",
 "tool_name": "Write", "tool_input": {"file_path": "<repo>/sub4.txt", "content": "sub4"},
 "tool_use_id": "toolu_01Lg2hiBPqgQV4wAWT1ACuob"}
```

### PreToolUse Bash (plugin subagent)

```json
{"session_id": "<uuid>", "transcript_path": "<claude-projects>/<project>/<uuid>.jsonl", "cwd": "<repo>",
 "prompt_id": "<uuid>", "permission_mode": "acceptEdits", "agent_id": "abf2fad95682506c5",
 "agent_type": "architect:sdd-probe", "effort": {"level": "medium"}, "hook_event_name": "PreToolUse",
 "tool_name": "Bash", "tool_input": {"command": "echo sub3-bash", "description": "Echo sub3-bash marker string"},
 "tool_use_id": "toolu_014egHuZAAqVbq8PUxJGFWJa"}
```

### PostToolUse Write (built-in subagent)

```json
{"session_id": "<uuid>", "transcript_path": "<claude-projects>/<project>/<uuid>.jsonl", "cwd": "<repo>",
 "prompt_id": "<uuid>", "permission_mode": "acceptEdits", "agent_id": "a8d44141be4da3502",
 "agent_type": "general-purpose", "effort": {"level": "medium"}, "hook_event_name": "PostToolUse",
 "tool_name": "Write", "tool_input": {"file_path": "<repo>/gp4.txt", "content": "gp4\n"},
 "tool_use_id": "toolu_013psTy8wLo978C5JcsQtaER", "duration_ms": 22}
```

### SubagentStop (plugin subagent)

```json
{"session_id": "<uuid>", "transcript_path": "<claude-projects>/<project>/<uuid>.jsonl", "cwd": "<repo>",
 "prompt_id": "<uuid>", "permission_mode": "acceptEdits", "agent_id": "abf2fad95682506c5",
 "agent_type": "architect:sdd-probe", "effort": {"level": "medium"}, "hook_event_name": "SubagentStop",
 "stop_hook_active": false,
 "agent_transcript_path": "<claude-projects>/<project>/<uuid>/subagents/agent-abf2fad95682506c5.jsonl",
 "last_assistant_message": "done",
 "background_tasks": [{"id": "abf2fad95682506c5", "type": "subagent", "status": "running",
   "description": "Run sdd-probe subagent task", "agent_type": "architect:sdd-probe"}],
 "session_crons": []}
```

## Guard design decision

**Primary design (C001-REQ-1103).** The guards read `agent_type`:

- **Architect callers:** apply the guard when `agent_type` starts with `architect:sdd-`.
  This covers the conductor as the main agent (`--agent architect:sdd-conductor`) and every
  Architect subagent.
- **All other callers:** exit 0 for a missing `agent_type` (plain main session) and for
  non-Architect agents (`general-purpose`, other plugins).

`tool_input.file_path` is absolute, so normalisation (C001-REQ-1104) starts from an absolute
Windows path.

## Spec defect raised

| ID | Ref | Summary |
|---|---|---|
| D-S04-1 | C001-REQ-1105 (also C001-AC-1105.1, C001-TS-1106, C001-IF-07 §1 `[VERIFY]`, C001-AS-09) | The fallback cannot work as specified. When `agent_type` is absent, hook input contains nothing that identifies the session's main agent, so "a session whose main agent is `architect:sdd-conductor`" cannot be determined. On Claude Code 2.1.295 the fallback is never reached for Architect callers. The only version seen without identity (2.0.76) also fails on current models (`tool_use ids must be unique`) and fires each hook twice. Proposed: replace C001-REQ-1105 with a minimum supported Claude Code version (verified: 2.1.295) stated in the README and checked by the doctor. Record the observed fields in C001-IF-07 §1 (`agent_type` namespaced `<plugin>:<agent>`, `agent_id` for subagents only, absolute `file_path`) and close its `[VERIFY]`. |

Recorded in the "Defects (manual)" table of `20-plan/handoff.md`.

## Test cases in `verified_by`

C001-TC-1103 and C001-TC-1106 are integration tests of `sdd guard-path` with synthetic hook
input, assigned to C001-T-050. This spike provides their input shape: the samples above
supply the field names for the fixtures. TC-1103 rows 1–4 are consistent with the observed
behaviour (row 4: a non-Architect agent shows `agent_type: "general-purpose"`). TC-1106
depends on D-S04-1.
