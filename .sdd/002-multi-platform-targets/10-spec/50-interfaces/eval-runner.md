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
(C002-COMP-009). No case file of CHG-001 changes (C002-REQ-608); the case files that CHG-002 adds
use the case fields of §2.1. Revised for defect D-015 (findings of C002-T-044 and C002-T-046): the
names a case reads (§3), the `answer` option (§2), the selection of rows per host (§1), the
OpenRouter key file with isolated data folders (§4), what `allowTools` gates (§2) and the direct
relay on OpenCode (§2).

## §1 Selection

`npm run eval -- --host claude-code|opencode|copilot-cli` (default `claude-code`, the existing
behaviour; `node evals/harness/run.mjs … --host …` alike). The host is passed to `runSession` through
the harness context (else the variable `EVAL_HOST`); a case never sets the host a session runs on.

**Rows for one host** (revised for defect D-015 items 3 and 7). A case row may carry a `host` field
(`claude-code`, `opencode` or `copilot-cli`): the row then runs only under that `--host`, and its
session result uses that host's own names (§3). A row without a `host` field runs under every
`--host`. A case file that holds one row per host (the CHG-002 doctor, gate, generator and
question-tool cases, C002-T-037, C002-T-038) gives every row its `host` field, the Claude Code rows
included; a run may also keep rows by ID with `--only <id>,…`. Without either, a Claude Code row of
such a file would also run under `--host opencode`. Rows for one host live in the case files of their
scenario, under `evals/targets/<area>/`; there is no case folder per host (no
`evals/targets/opencode-host/`). A selection that leaves no row for the host ends the run before any
session, with exit code 1.

## §2 `runSession` options (unchanged names)

| Option | Meaning on the generated targets |
|---|---|
| `agent` | Architect agent name. OpenCode: the runner removes the `architect:` prefix. Copilot CLI: the runner passes `--agent architect:<agent>`, the `<plugin>:<agent>` form Copilot CLI requires (a bare name fails; `docs/spikes/S-08-copilot-vscode.md §2.3`, fact F-6), `architect` being the package's plugin name (C002-IF-005 §3), so a case's `architect:` name is passed unchanged |
| `prompt`, `cwd` | as today. OpenCode: a prompt `/architect:<name> <arguments>` or `/architect-<name> <arguments>` runs the package command `architect-<name>` with those arguments. The eval relay (`agent` `architect:eval-dispatcher`, prompt `Dispatch: <agent>` followed by a brief) has no OpenCode counterpart: the runner starts `<agent>`, prefix removed, as the session's agent with the brief as its prompt, and the transcript holds a harness record with `event: "relay"` naming that agent. The relay is therefore `direct` on OpenCode (revised for defect D-015 item 6) |
| `answer` | the case's answer function `answer(question, call)`, called once per question of a question-tool call (revised for defect D-015 item 2: the earlier name `answers` was wrong; `answers` is a field of the session result, §3). It returns the label to choose, an array of labels, or, on OpenCode, `{ reject: true }`, which dismisses the whole call. Default: the label of the first option, which the interview protocol marks "(Recommended)". `question` and `call` are given in the names the row reads (§3). On OpenCode, a return value that is none of these (nothing, an empty string, an exception) leaves the call unanswerable (§4). Used where the host lets a script answer (C002-REQ-610) |
| `allowTools` | Claude Code tool names. They gate only the permission requests of the host (revised for defect D-015 item 5). OpenCode: the runner answers a permission request `once` when its permission maps to a tool of `allowTools` (through the target's mapping table, C002-IF-001; `edit` for Write, Edit, MultiEdit and NotebookEdit, `bash` for Bash and PowerShell, `task` for Agent) and rejects every other request; it answers the read-only permissions (`read`, `glob`, `grep`, `list`, `lsp`, `todowrite`, `todoread`, `codesearch`) and `question` with `once`, and rejects `external_directory` and `doom_loop`. A tool that the host runs without asking, because the package's own rules allow it (for example the sdd MCP server tools that an Architect agent is granted), is not gated by `allowTools`: the package decides it, as it does for an adopter |
| `maxTurns` | default 30 (C002-NFR-105) |
| `maxBudgetUsd` | default 0.50; applied when the host reports spend, else recorded as `unreported` (C002-NFR-105 open item) |
| `env` | variables of the host process (for example a machine configuration of a doctor case); a `PATH` given here replaces the runner's own `PATH` for the host |

### §2.1 Case fields of the generated-target runners

Fields of a case row that the generated-target runners read beside the options (C002-T-038,
C002-T-044); the Claude Code runner ignores them.

| Field | Meaning |
|---|---|
| `host` | the host the row is for (§1); selects the names of §3 |
| `targetPackage` | `{ target, mode?, tested_versions?, version? }`: the package generated for the session. `mode` is an enforcement mode (`--mode <target>=<mode>`, C002-IF-004); `tested_versions` replaces the table's `host.tested_versions` in a copy of the source plugin; `version` is the package version: the package is generated from a copy of the source plugin whose `.claude-plugin/plugin.json` gives this version, so that the wiring token `{{package_version}}` and the manifest's `package_version` both carry it (C002-IF-004 §Output; the fixture of C002-TS-515) |
| `mcpOverrides` | `{ <server>: <url> }`: the URL of a remote MCP server replaced in the generated configuration (the unreachable-DeepWiki row of C002-TS-509 on OpenCode) |

## §3 Session result

Each runner returns the shape the graders read today (`transcript`, `answers`, `result`, `wallMs`).

**Names** (revised for defect D-015 item 1). A row whose `host` field names the session's host (§1)
reads that host's own names and inputs: a tool call by the host's tool name with the host's input
(OpenCode: `question`, `edit`, `sdd-shell_run_command`, …), a started agent by the host's agent name
(OpenCode: `sdd-critic`), a question call as the host's question tool with the host's questions.
Every other row reads the source names, mapped back through the target's mapping table: an agent
start is reported as `architect:<agent>`, a tool call by its Claude Code tool name with Claude Code
input keys beside the host's (for example `sdd-files_write_file` or `sdd-files-write_file` →
`Write` with `file_path`), a question-tool call as AskUserQuestion with the host's answer or `null`
for a skipped or dismissed call; a host tool that the table does not map keeps its host name. Every
tool call also carries `host_tool`, the host's own name. The result's `answers` list holds each
answered call with its questions and the answers given, and on OpenCode the reply route
(`question.reply`, or `question.reject` for a dismissed call).

Added fields:

| Field | Value |
|---|---|
| `target` | `claude-code`, `opencode` or `copilot` (C002-TS-611, C002-TS-612, C002-TS-615) |
| `host_versions` | versions read at session start (C002-IF-009, release evidence); on OpenCode the version of the pinned host binary (§4) |
| `end_reason` | `completed`, `turn cap`, `spend cap`, `question unanswerable`, `error` (C002-TS-614); `error` also when the provider refuses a step of the session, for example an OpenRouter error with HTTP status 402 stored on an assistant message |
| `usage` | `{ "turns": n, "usd": number or null }` |
| `spend` | `reported` when the host reported the cost of the steps, else `unreported` |
| `provider`, `models` | the inference provider (`openrouter` on OpenCode; `stub` for the stub host) and the model IDs of the session's steps |
| `error` | present when `end_reason` is `error`: the host's or the provider's error text |
| `api_key_source` | the source of the credential the session ran with, never the credential itself (revised for critic CR-37 of the plan review); the session result carries it as `apiKeySource`, and the harness writes it into each result record and the result file as `api_key_source`, beside `auth`. OpenCode: `openrouter-key-file` for a session on the pinned host binary, whose key comes from P-01's key file (§4 Provider key), and `null` on the stub host, which uses no credential; Claude Code: the `apiKeySource` of the session's init message, as the eval auth switch records it today (for example `none` under the subscription route, C002-T-060); Copilot CLI: the name of the credential source its runner gives the host (C002-T-045), `null` when it gives none |

## §4 Back ends

| Runner | Drives | Caps | Question calls |
|---|---|---|---|
| OpenCode | the OpenCode server (`opencode serve`) of the pinned host binary and the JS SDK of the same version, with the generated OpenCode package in a temporary project (C002-R-001 D-01, D-02; host process below); permission requests answered under `allowTools` (§2) | turns counted from assistant steps; spend from message cost when present (S-07 §10); the session is aborted at a cap (C002-REQ-611) | answered from `answer` through the SDK's reply route (`question.reply`, S-07 §5), or dismissed through `question.reject` when `answer` returns `{ reject: true }`; this works because the conductor holds `question: allow` (C002-REQ-217); a `question` call that `answer` does not cover ends the session with `question unanswerable` |
| Copilot CLI | `copilot -p <prompt> --agent architect:<agent> --plugin-dir <package copy> --additional-mcp-config @<servers file> --output-format json --no-ask-user`, run in the case's temporary git workspace with a temporary Copilot home (`COPILOT_HOME`; C002-R-001 D-03; C002-AS-04 settled by S-08 §2.1, §2.4). Preparation per session: copy `dist/copilot/` to a temporary folder and run `sdd install copilot --package <package copy>` in the workspace (C002-IF-007), so that the copy has its `plugin.json` and `hooks.json` and the workspace its agents, its workspace hook file `.github/hooks/architect-guard.json` and `.vscode/mcp.json` (whether Copilot CLI loads the workspace hook file is an assumption of C002-IF-005 §3 that the runner's events confirm; the plugin-level entry holds the same guard); then write the `servers` entries of the copy's `install/mcp.json` in Copilot CLI's `mcpServers` form to the servers file. The servers do not come from a plugin MCP configuration: the package declares none (C002-REQ-307) | turns counted from the JSON events; the process is killed at a cap | none: `--no-ask-user`; only non-interactive scenarios run (C002-REQ-612) |
| Stub | a scripted host for the runner tests (C002-TS-614) | as the runner under test | scripted |

[ASSUMPTION: S-08 — the record shows Copilot CLI 1.0.98 loading a plugin's .mcp.json (§2.4) but no per-session MCP option; the runner task confirms --additional-mcp-config with copilot --help at the tested version, and otherwise writes the same mcpServers entries to mcp-config.json of the temporary Copilot home; if Copilot CLI already starts the servers of the workspace's .vscode/mcp.json, the runner passes no servers file, so that no server name is declared twice (a duplicate name kept a server from being reached in S-08 §3.1)]
A hook deny shows in the JSON events as a fail-closed hook error, not as exit code 2 (S-08 §2.2);
the runner reports such a call as a tool call that did not run.

**OpenCode host process** (revised for defect D-009; `docs/spikes/S-07-opencode.md §9`, facts F-7,
F-8, F-10; revised for defect D-015 item 4). The OpenCode runner, and the corpus replay suite for
`opencode-permissions` (C002-IF-009 §2), start OpenCode as follows:

- **Pinned host binary.** The executable of the tested version, named by its absolute path in the
  harness configuration, never the `opencode` that PATH resolves: on REF-WIN the Windows PATH
  resolves the npm shim `opencode.cmd` (1.18.31) and the Git Bash PATH finds another install
  (1.15.10) first (F-7). The runner reads the version that binary reports at session start and
  records it in `host_versions.opencode`; a version other than the tested one is recorded as read,
  and the release check refuses that evidence (ERR-REL-006, C002-REQ-621).
- **Own database.** `OPENCODE_DB` names an absolute database file of the run, so the user's shared
  OpenCode database is neither read nor migrated by the tested version (F-8).
- **Isolated data folders.** The host process gets configuration, data, cache and state folders of
  its own under the run folder (`XDG_CONFIG_HOME`, `XDG_DATA_HOME`, `XDG_CACHE_HOME`,
  `XDG_STATE_HOME`), so neither the user's OpenCode configuration nor its credential store is read;
  the global configuration of the run enables the provider `openrouter` only, with auto-update and
  sharing off. Serena's home folder and, on Windows, `LOCALAPPDATA` also point into the run folder.
  Provider variables of the caller's environment (for example `OPENROUTER_*`, `ANTHROPIC_*`,
  `OPENAI_*`) are removed from the host's environment. The stub-model replay isolates the same
  folders and needs no credential.
- **Provider key.** A paid session reads the OpenRouter key from P-01's key file
  `%USERPROFILE%\.architect-evals\openrouter-key.txt` (one line; `~/.architect-evals/openrouter-key.txt`
  on other platforms), passes it to the host process as `OPENROUTER_API_KEY` only and records the
  key source `openrouter-key-file`; the runner refuses to start the session when the file is missing
  or empty. The key is never printed, logged, written to a result or committed (P-01's key file
  replaces the credential store that an earlier text of this contract named).
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
