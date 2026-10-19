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
| `host_versions` | versions read at session start (C002-IF-009, release evidence); on OpenCode the version of the pinned host binary (§4) |
| `end_reason` | `completed`, `turn cap`, `spend cap`, `question unanswerable`, `error` (C002-TS-614) |
| `usage` | `{ "turns": n, "usd": number or null }` |

## §4 Back ends

| Runner | Drives | Caps | Question calls |
|---|---|---|---|
| OpenCode | the OpenCode server (`opencode serve`) of the pinned host binary and the JS SDK of the same version, with the generated OpenCode package in a temporary project (C002-R-001 D-01, D-02; host process below); permission requests answered by the `allowTools` policy | turns counted from assistant steps; spend from message cost when present (S-07 §10); the session is aborted at a cap (C002-REQ-611) | answered from `answers` through the SDK's reply route (`question.reply`, S-07 §5), which works because the conductor holds `question: allow` (C002-REQ-217); a `question` call that `answers` does not cover ends the session with `question unanswerable` |
| Copilot CLI | `copilot -p <prompt> --agent architect:<agent> --plugin-dir <package copy> --additional-mcp-config @<servers file> --output-format json --no-ask-user`, run in the case's temporary git workspace with a temporary Copilot home (`COPILOT_HOME`; C002-R-001 D-03; C002-AS-04 settled by S-08 §2.1, §2.4). Preparation per session: copy `dist/copilot/` to a temporary folder and run `sdd install copilot --package <package copy>` in the workspace (C002-IF-007), so that the copy has its `plugin.json` and `hooks.json` and the workspace its agents, its workspace hook file `.github/hooks/architect-guard.json` and `.vscode/mcp.json` (whether Copilot CLI loads the workspace hook file is an assumption of C002-IF-005 §3 that the runner's events confirm; the plugin-level entry holds the same guard); then write the `servers` entries of the copy's `install/mcp.json` in Copilot CLI's `mcpServers` form to the servers file. The servers do not come from a plugin MCP configuration: the package declares none (C002-REQ-307) | turns counted from the JSON events; the process is killed at a cap | none: `--no-ask-user`; only non-interactive scenarios run (C002-REQ-612) |
| Stub | a scripted host for the runner tests (C002-TS-614) | as the runner under test | scripted |

[ASSUMPTION: S-08 — the record shows Copilot CLI 1.0.98 loading a plugin's .mcp.json (§2.4) but no per-session MCP option; the runner task confirms --additional-mcp-config with copilot --help at the tested version, and otherwise writes the same mcpServers entries to mcp-config.json of the temporary Copilot home; if Copilot CLI already starts the servers of the workspace's .vscode/mcp.json, the runner passes no servers file, so that no server name is declared twice (a duplicate name kept a server from being reached in S-08 §3.1)]
A hook deny shows in the JSON events as a fail-closed hook error, not as exit code 2 (S-08 §2.2);
the runner reports such a call as a tool call that did not run.

**OpenCode host process** (revised for defect D-009; `docs/spikes/S-07-opencode.md §9`, facts F-7,
F-8, F-10). The OpenCode runner, and the corpus replay suite for `opencode-permissions`
(C002-IF-009 §2), start OpenCode as follows:

- **Pinned host binary.** The executable of the tested version, named by its absolute path in the
  harness configuration, never the `opencode` that PATH resolves: on REF-WIN the Windows PATH
  resolves the npm shim `opencode.cmd` (1.18.31) and the Git Bash PATH finds another install
  (1.15.10) first (F-7). The runner reads the version that binary reports at session start and
  records it in `host_versions.opencode`; a version other than the tested one is recorded as read,
  and the release check refuses that evidence (ERR-REL-006, C002-REQ-621).
- **Own database.** `OPENCODE_DB` names an absolute database file of the run, so the user's shared
  OpenCode database is neither read nor migrated by the tested version (F-8). The credential store
  of the user's data folder stays in use for the eval runner's provider key; the stub-model replay
  needs no credential and isolates the data folders too.
- **Node.js.** The machine that runs the runner or the replay with the OpenCode JS SDK has Node.js
  22.22.2 or later (F-10; `../10-context/scope.md` §5); the adopter's floor stays Node.js 20
  (C002-IF-006 §2).
- **Start-up network conditions** (F-9; C002-ADR-005). Auto-update, sharing and the LSP download
  are switched off (`OPENCODE_DISABLE_AUTOUPDATE`, `OPENCODE_DISABLE_SHARE`,
  `OPENCODE_DISABLE_LSP_DOWNLOAD`) in every run. The corpus replay, which must reach no network,
  also switches the model catalogue fetch off (`OPENCODE_DISABLE_MODELS_FETCH`), runs npm offline
  with `@opencode-ai/plugin` of the tested version ready in the project `.opencode/` folder and the
  isolated global configuration folder, and sends every non-loopback request to a closed proxy port.
  At start OpenCode 1.18.31 also tries to download ripgrep from GitHub; in the replay the closed
  proxy blocks the attempt, the session goes on, and its `grep` and `glob` tools run without it
  (S-07 §4). No ripgrep is provisioned, and neither the replay nor the eval runner depends on the
  download: the replay keeps it blocked as one more network request at start (revised for defect
  D-011 item 3).

Eval spend stays within the project budget: dev tier on every target, milestone tier on Claude Code
and on the first port only, the first generated target that is released (ideation §9, C002-US-603).

**Release evidence by mode.** The injection summary of a runner is release evidence for OpenCode,
and for Copilot VS Code under sdd MCP server enforcement when spike S-08 shows that Copilot CLI
loads the package (C002-AS-04). Under the Copilot hooks fallback the boundary is the Copilot guard
hooks in VS Code, which Copilot CLI does not exercise (a separate hook implementation, C002-R-001),
so the Copilot CLI runner's injection results are recorded with `source: copilot-cli-runner` but not
counted: the injection evidence is the checklist record's injection steps, run in VS Code with hooks
enabled (C002-REQ-628, C002-REQ-629, C002-IF-009 §5).
