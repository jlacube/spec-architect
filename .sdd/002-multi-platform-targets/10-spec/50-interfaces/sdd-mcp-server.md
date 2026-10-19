---
id: C002-IF-002
artifact: spec/interface
kind: MCP server over stdio
change: CHG-002
phase: 10-spec
status: draft
---

# C002-IF-002 — sdd MCP server

The sdd MCP server (C002-COMP-005) gives Architect agents that have no generic edit or terminal tool
their write and command operations, under the decisions of the path and bash guard cores
(C002-DEC-001, C002-CON-06). Tool input and output schemas: `sdd-mcp-tools.schema.json`. Error and
warning codes: `errors.md` §2 and §6.

## §1 Process

```text
sdd-mcp --profile files|shell [--root <dir>]
```

- `sdd-mcp` is the second executable of `architect-sdd` (C002-IF-003): the bundled entry
  `scripts/sdd-mcp.mjs`, next to the `sdd` entry (C002-REQ-412).
- The host starts one process per declared server and session, with standard input and output as the
  MCP transport, and closes standard input when the session ends (C002-CON-04). The process is not a
  daemon, opens no listening socket and makes no network connection (C002-NFR-205).
- Copilot VS Code: the servers are workspace MCP servers, entries of the repository's
  `.vscode/mcp.json` written by the install command (C002-IF-005 §3, C002-IF-007); the local agent
  host does not start a plugin's MCP servers (`docs/spikes/S-08-copilot-vscode.md §3.2`, fact F-2).
  It starts a workspace server with the session, and only after the session's first message
  ("Cannot start an MCP server before the session runtime has been created. Send a message
  first.", §3.2); until then the agents have no write or command tool, which fails closed, and the
  install notes tell P-03 so (C002-IF-005 §5). Copilot CLI (eval runs only): the eval runner gives
  the servers to the session (C002-IF-010 §4).
- Standard output carries JSON-RPC messages only, one per line (C002-REQ-410). Diagnostics go to
  standard error, one line each, prefixed `sdd-mcp:`; with `SDD_DEBUG=1` every decision is logged
  there with its code (C001-NFR-702). A usage error is the line `sdd-mcp: ERR-MCP-007: <message>`
  (print form of `errors.md`).

| Exit code | Meaning |
|---|---|
| 0 | Standard input closed, before or after initialisation (C002-REQ-411, C002-TS-415, C002-TS-416) |
| 2 | Usage error before any MCP message: missing or unknown `--profile`, unusable `--root` (ERR-MCP-007) |
| 3 | Fatal internal error at start (the lint rules or the guard cores cannot load); no tool was served |

## §2 Profiles and host tool names

One program serves two profiles, declared as two servers in each target package, so that the write
tools and the command tool can be granted separately even where a host grants only whole servers
(`<server>/*`, C002-OA-001; C002-REQ-108).

| Profile | Declared server name | Tools | OpenCode tool names | Copilot tool names (grant) |
|---|---|---|---|---|
| `files` | `sdd-files` | `write_file`, `replace_text` | `sdd-files_write_file`, `sdd-files_replace_text` | `sdd-files-write_file`, `sdd-files-replace_text` (`sdd-files/*`) |
| `shell` | `sdd-shell` | `run_command` | `sdd-shell_run_command` | `sdd-shell-run_command` (`sdd-shell/*`) |

On Copilot the tools are deferred: the host lists them by name and an agent loads one through
`tool_search_tool` before its first call; a subagent granted `<server>/*` reached both tools of a
workspace server, and its tool list held no edit or terminal tool (S-08 §3.2, fact F-7).

An agent whose source `tools` holds Write or Edit is granted the `files` tools; one whose source
holds Bash is granted the `shell` tool (C002-TS-214, C002-TS-310).

## §3 Repository root

The server serves one repository, fixed at initialisation (C002-CON-15):

1. the `--root` argument, if given; else
2. the first root the client offers through MCP `roots/list`, if the client supports roots
   [ASSUMPTION: S-08 — VS Code offers its workspace folders as roots, first folder first; the S-08 record does not show it, and the fresh-install step of the manual VS Code checklist (C002-REQ-614) confirms that a write lands in the open repository's .sdd/]; else
3. the process working folder.

From that folder the server walks up to the first folder that contains `.sdd/`, as the CLI does
(C001-IF-01); without one, the folder itself is the root (a `sdd init` through `run_command` creates
`.sdd/` there). Relative paths in tool arguments resolve against the root. In a multi-root VS Code
workspace, `.sdd/` folders of the other workspace folders are outside the root and every write to
them is refused with GUARD-PATH-001 (C002-REQ-401 open item, settled here).

## §4 Protocol

- MCP over stdio, JSON-RPC 2.0, using the bundled MCP SDK (its license is checked with the build,
  C002-REQ-413). Protocol versions: those the bundled SDK negotiates.
- `initialize` → `serverInfo` `{ "name": "sdd-mcp", "version": "<architect-sdd version>" }`,
  capabilities `{ "tools": { "listChanged": false } }`; no resources, prompts, sampling or
  logging capability.
- `tools/list` → the tools of the profile, with `inputSchema` and `outputSchema` taken from
  `sdd-mcp-tools.schema.json` (`$defs/writeFileInput`, … ).
- `tools/call` → a `CallToolResult` with `content` (one text item, §6) and `structuredContent`
  (the tool's output or `$defs/errorResult`); `isError: true` exactly when the structured content
  is an error result.
- An unknown tool name is a JSON-RPC error `-32602`; a malformed message is `-32700` or `-32600`. No
  tool runs in either case.
- The server handles one `tools/call` at a time, in arrival order; one session writes a change at a
  time (C001-CON-11).

## §5 Tool behaviour

### §5.1 `write_file` and `replace_text`

1. Validate the arguments against the input schema (ERR-MCP-001).
2. Decide: build the hook input `{ "hook_event_name": "PreToolUse", "tool_name": "Write",
   "tool_input": { "file_path": <path> }, "cwd": <root>, "agent_type": "architect:sdd-mcp-server" }`
   and call the path guard core with the memory folder off (C002-IF-008 §5). Deny → refused with
   GUARD-PATH-001 and the core's message. An exception → failed with ERR-MCP-002 (C002-CON-08).
3. `replace_text` only: read the file (missing → ERR-MCP-005), count the occurrences of
   `old_text`; any count other than 1 → refused with ERR-MCP-004 and `occurrences` (C002-REQ-404).
4. Write atomically: a temporary file in the target folder, then rename (C001-REQ-126). Any I/O
   error → failed with ERR-MCP-003; the file keeps its previous content (C002-REQ-402, C002-INV-07).
   ERR-MCP-003 (here, or in step 3 when the file to edit cannot be read) therefore follows only a
   call that step 2 allowed; the corpus replay reads it as `allow` (C002-IF-009 §2.3).
5. Lint: run the quick-lint check of the written file in-process (the rules of C001-COMP-04 loaded
   once at start) and return the findings (C002-REQ-408). A fault here → the write stands and the
   result carries `findings_unavailable` with WARN-MCP-001 (C002-REQ-409).

### §5.2 `run_command`

1. Validate the arguments (ERR-MCP-001).
2. Decide: hook input `{ "tool_name": "Bash" or "PowerShell", "tool_input": { "command": <command> },
   "cwd": <root>, "agent_type": "architect:sdd-mcp-server" }` to the bash guard core, with
   `PowerShell` when the optional argument `dialect` is `powershell` and `Bash` otherwise (default).
   The dialect only selects the guard's syntax rules and tokeniser; the command still runs without a
   shell. Deny → refused with the core's rule (GUARD-BASH-001 or GUARD-BASH-002) and message
   (C002-REQ-405). The core applies the allowlist of C002-IF-008 §1, including the Serena-command
   confinement of §1.1 and the `--cwd` confinement of the writing subcommands of §1.2, with `cwd` =
   root (C002-REQ-517, C002-REQ-521). The server calls the core with variable expansion off,
   because step 3 runs the command without a shell: the literal `${CLAUDE_PLUGIN_DATA}` (C002-IF-008
   §1.1 rule 2) is not replaced by the value of any environment variable, the server's own
   included, and is denied as a word the guard cannot resolve, so only `--user-data` or a folder
   outside the repository passes (revised for defect D-014 item 4: before, the guard call expanded
   the literal from the server's environment, and the CLI, which received the literal text, then
   created a folder named `${CLAUDE_PLUGIN_DATA}` inside the repository). The corpus replay feeds
   PowerShell cases with `dialect: powershell` (C002-IF-009 §2.2).
3. Execute without a shell (C002-CON-07): take the words of each pipe segment from the guard core's
   tokeniser of that dialect; run the first segment as a child process with `shell: false`, working
   folder = root.
   - **No expansion** (revised for defect D-006). Without a shell nothing expands: a variable
     (`${CLAUDE_PLUGIN_ROOT}`, `$HOME`, `$env:X`, `%X%`), `~` or a wildcard reaches the child process
     as the literal text the tokeniser gives. The script form with the plugin-root literal,
     `node ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs …`, passes the bash guard (C001-IF-07 §3,
     current-state E-5) but makes `node` look for a file named by that literal text, so the call
     completes with Node.js's non-zero exit code and its error on standard error, a normal result of
     step 4, not an error result. The generated agents call the bare `sdd` (the CLI invocation
     variants of C002-IF-001 §2, C002-REQ-111), which the next item runs.
   - A first word `sdd` runs the CLI of the server's own package: the Node.js executable that runs
     the server, with `<package>/scripts/sdd.mjs` and the remaining words (C002-REQ-407,
     C002-TS-409); a PATH `sdd` is never used. When that file is not found beside the server's
     bundle, the call fails with ERR-MCP-006, reason `not found beside the server (<path>)`, and no
     process starts.
   - Any other executable is resolved on PATH; one that resolves only to a `.cmd` or `.bat` file is
     not run (ERR-MCP-006, reason `only a .cmd or .bat shim was found`), because running it needs a
     shell. The allowlisted executables are expected as native executables on Windows: `node`,
     `git` (Git for Windows), `uv` and `serena` (uv installs `.exe` launchers), `ripwire` (release
     archive), and `ast-grep`, whose npm install (`npm install -g @ast-grep/cli`, C001-IF-10 §3)
     gives only a `.cmd` shim. Under sdd MCP server enforcement the doctor therefore reports such a
     tool as `error` with the fix to install a native executable (C002-IF-006 §2), and code
     discovery falls back as for a failing layer (C001-REQ-1010). Spikes S-07 and S-08 record
     the shims found on REF-WIN (`cmd_shims`, C002-IF-009 §3).
   - A process that the operating system refuses to start fails with ERR-MCP-006, the reason being
     the operating system's error text.
   - The pipe-only segments (`head -n N`, `tail -n N`, `wc -l`, `sort`, `uniq` with the flags of
     C001-IF-07 §3) are applied in-process to the standard output, line by line.
4. Return `exit_code`, `stdout` and `stderr` (C002-REQ-406). A non-zero exit code is a normal
   result. At `timeout_ms` the process tree is killed and `status` is `timed_out`. Each stream is
   cut at 1,048,576 characters with `truncated` set.

## §6 Text content of results

| Result | `content[0].text` |
|---|---|
| write success | `wrote <path> (<bytes> bytes)`, then the findings block of C001-IF-07 §4 (`sdd quick lint of <path>: <n> finding(s)` and up to 15 lines), or `quick-lint findings unavailable: <reason>` |
| command | `exit <code>` (or `timed out after <ms> ms`), then `--- stdout ---` and `--- stderr ---` sections |
| error result | the `message` of the structured content |

## §7 Performance budget

A refused call returns within 300 ms at p95 (C002-NFR-101) and a write with its findings within
800 ms at p95 (C002-NFR-102): the lint rules, the guard cores and the workspace scan are loaded
once per process, and the quick lint parses the written file and the change it belongs to only.
