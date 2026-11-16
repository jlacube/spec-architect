---
capability: sdd-mcp-server
inventory_only: false
updated: 2026-11-16
---
# CAP-sdd-mcp-server — Living specification

## Requirements

### C002-REQ-401 — Writes confined to `.sdd/`
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN an agent calls a write tool of the sdd MCP server, THE sdd MCP server SHALL write the file only if the path guard core allows the target path for an Architect agent without a memory folder, and refuse the call with rule `GUARD-PATH-001` otherwise.
- **Rationale:** C002-DEC-001; the decision and its normalisation are those of C001-REQ-1103 and C001-REQ-1104 (current-state §1, path guard row); no memory folder on the generated targets (C002-DEC-009); no agent identity needed, because only Architect agents are granted the server's tools (C002-REQ-117, C002-REQ-210, C002-REQ-307)
- **Stories:** C002-US-401
- **Priority:** Must
- **Acceptance:** C002-AC-401.1
- **Open items:** the `.sdd/` meant is the one under the server repository root; how that root is fixed, multi-root VS Code workspaces included, is settled in C002-IF-002 §3.

#### C002-AC-401.1 — Writes inside `.sdd/` only, otherwise GUARD-PATH-001
```gherkin
Scenario Outline: C002-TS-401 — write decisions
  Given the server instance "sdd-files" runs in "fx-srv"
  When an agent calls the whole-file write tool with the path "<path>" and the content "x"
  Then the result is <result>
  And "<path>" <state>
  Examples:
    | path                                                         | result                    | state                    |
    | C:/repo/.sdd/002-x/b.md                                      | a success                 | holds "x"                |
    | C:/REPO/.SDD/002-x/c.md                                      | a success                 | holds "x"                |
    | C:/repo/src/app.ts                                           | refused with GUARD-PATH-001 | is unchanged           |
    | C:/repo/.sdd/../src/app.ts                                   | refused with GUARD-PATH-001 | is unchanged           |
    | C:/repo/.sdd/link-to-src/app.ts                              | refused with GUARD-PATH-001 | is unchanged           |
    | C:/repo/.claude/agent-memory/architect-sdd-cartographer/MEMORY.md | refused with GUARD-PATH-001 | does not exist   |
    | D:/other/.sdd/a.md                                           | refused with GUARD-PATH-001 | does not exist         |
```

### C002-REQ-402 — Faults leave the file unchanged
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the sdd MCP server cannot complete a write call (invalid arguments, an exception in the path guard core or an I/O error), THEN THE sdd MCP server SHALL return an error result and leave the target file with its previous content.
- **Rationale:** C002-US-401 (refuse on any internal error, fail closed); C001-NFR-301 for the CLI's own state files; an error result carries its code and message as text only, without structured content, so that a client that validates structured content against the tool's advertised output schema accepts it (glossary "Error result"; Q-mcp-errors-01, round 2026-10-20 of `../../questions-log.md`: "No structured error (Recommended)"; defect D-017; form: C002-IF-002 §6.1)
- **Stories:** C002-US-401
- **Priority:** Must
- **Acceptance:** C002-AC-402.1

#### C002-AC-402.1 — A failed write leaves the previous content
```gherkin
Scenario Outline: C002-TS-402 — faults during a write call
  Given the server instance "sdd-files" runs in "fx-srv" with the fault "<fault>"
  When an agent calls the whole-file write tool on ".sdd/002-x/a.md" with the content "status: approved"
  Then the result is an error result whose text starts with "<code>: "
  And ".sdd/002-x/a.md" still holds "status: draft"
  Examples:
    | fault                                                  | code        |
    | the call has no "content" argument                     | ERR-MCP-001 |
    | the path guard core throws an exception                | ERR-MCP-002 |
    | the file system reports an I/O error during the write  | ERR-MCP-003 |
```

```gherkin
Scenario Outline: C002-TS-665 — an error result carries its code and message in its text only
  Given the server instance "<instance>" runs in "fx-srv", on a PATH that holds no file named "ast-grep" with any extension
  When an agent calls <call>
  Then the response is a tool result, not a JSON-RPC error, with "isError" true
  And its "content" holds exactly one text item, whose text <text>
  And the code "<code>" occurs once in that text
  And the result has no "structuredContent" key
  Examples:
    | instance  | call                                                                          | code           | text                                                                                   |
    | sdd-files | the whole-file write tool with the path "C:/repo/src/app.ts" and the content "x" | GUARD-PATH-001 | starts with "GUARD-PATH-001: " and is the path guard core's deny message as the core returns it |
    | sdd-files | the whole-file write tool with the path ".sdd/002-x/b.md" and no "content"    | ERR-MCP-001    | starts with "ERR-MCP-001: invalid arguments for write_file: "                          |
    | sdd-files | the span-replace tool on ".sdd/002-x/a.md" to replace "approved" with "x"     | ERR-MCP-004    | starts with "ERR-MCP-004: the text to replace occurs 0 times in " and ends with "; it must occur exactly once" |
    | sdd-files | the span-replace tool on ".sdd/002-x/none.md" to replace "a" with "b"         | ERR-MCP-005    | starts with "ERR-MCP-005: " and ends with " does not exist; replace_text edits existing files" |
    | sdd-shell | the command tool with "npm install"                                           | GUARD-BASH-001 | starts with 'GUARD-BASH-001: ' and is the bash guard core's deny message as the core returns it |
    | sdd-shell | the command tool with "echo x > src/marker.txt"                               | GUARD-BASH-002 | starts with 'GUARD-BASH-002: ' and is the bash guard core's deny message as the core returns it |
    | sdd-shell | the command tool with "ast-grep --version"                                    | ERR-MCP-006    | is exactly 'ERR-MCP-006: could not start "ast-grep": not found on PATH'                |
```

The rows follow C002-IF-002 §4 and §6.1 (revised for defect D-017, P-01 answer to Q-mcp-errors-01):
an `ERR-MCP-*` text is the print form of `errors.md` without a fix, a `GUARD-*` text is the core's
deny message, which already starts with its code. A success keeps its `structuredContent`
(C002-TS-407, C002-TS-666).

### C002-REQ-403 — Write operations of the agents
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE sdd MCP server SHALL provide one write tool that creates or replaces a whole file and one write tool that replaces one exact text span in an existing file.
- **Rationale:** agents without a generic edit tool keep the operations they perform with Write and Edit today (ideation §9; C002-OA-001, option B notes)
- **Stories:** C002-US-401
- **Priority:** Must
- **Acceptance:** C002-AC-403.1

#### C002-AC-403.1 — One whole-file write tool and one span-replace tool
```gherkin
Scenario: C002-TS-403 — write tools of the server
  Given the server instance "sdd-files" runs in "fx-srv"
  When the client sends "tools/list"
  Then the list holds exactly one tool that creates or replaces a whole file
  And exactly one tool that replaces one exact text span in an existing file
  And no other write tool
```

```gherkin
Scenario: C002-TS-404 — span replacement
  Given the server instance "sdd-files" runs in "fx-srv"
  When an agent calls the span-replace tool on ".sdd/002-x/a.md" to replace "draft" with "in-review"
  Then the result is a success
  And ".sdd/002-x/a.md" holds "status: in-review" and nothing else changed
```

### C002-REQ-404 — Ambiguous text span refused
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the text span to replace occurs zero times or more than once in the file, THEN THE sdd MCP server SHALL refuse the edit and report the number of occurrences found.
- **Rationale:** an edit applies to exactly one place, as with Edit on Claude Code; the number is reported in the text of the error result ERR-MCP-004, which carries no structured content (C002-IF-002 §5.1, §6.1; defect D-017, Q-mcp-errors-01)
- **Stories:** C002-US-401
- **Priority:** Must
- **Acceptance:** C002-AC-404.1

#### C002-AC-404.1 — A span found zero times or more than once is refused with its count
```gherkin
Scenario Outline: C002-TS-405 — occurrences of the span
  Given the server instance "sdd-files" runs in "fx-srv"
  And ".sdd/002-x/b.md" contains the text "TS-101" <count> time(s)
  When an agent calls the span-replace tool on ".sdd/002-x/b.md" to replace "TS-101" with "TS-102"
  Then the result is <result>
  And ".sdd/002-x/b.md" is <state>
  Examples:
    | count | result                                 | state     |
    | 0     | refused, reporting 0 occurrences       | unchanged |
    | 2     | refused, reporting 2 occurrences       | unchanged |
    | 1     | a success                              | changed   |
```

### C002-REQ-405 — Commands confined to the allowlist
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN an agent calls the command tool of the sdd MCP server, THE sdd MCP server SHALL run the command only if the bash guard core allows it for an Architect agent, and refuse the call with the guard's rule (`GUARD-BASH-001` or `GUARD-BASH-002`) otherwise.
- **Rationale:** C002-DEC-001; the decision is that of C001-REQ-1106 (as changed by C002-REQ-503, C002-REQ-517 and C002-REQ-521) and C001-REQ-1107; the server's shell surface is the allowlist only (ideation §9), `sdd serena-config` or `sdd serena-launch` with a folder inside the repository is refused (Q-guards-04), and so is a writing `sdd` subcommand whose `--cwd` folder lies outside the repository root (Q-guards-05); an allowed command runs the executable that the PATH-only executable lookup finds, by its absolute path, never one of the working folder or the repository (C002-CON-17; Q-exec-lookup-01, P-01: "Fix everywhere now (Recommended)"; C002-IF-007 §Executable lookup)
- **Stories:** C002-US-402
- **Priority:** Must
- **Acceptance:** C002-AC-405.1

#### C002-AC-405.1 — Commands run only when the bash guard core allows them
```gherkin
Scenario Outline: C002-TS-406 — command decisions
  Given the server instance "sdd-shell" runs in "fx-srv"
  When an agent calls the command tool with "<command>"
  Then the result is <result>
  And the marker file "src/marker.txt" does not exist
  Examples:
    | command                                   | result                       |
    | sdd lint 002                              | the command's result         |
    | node --version                            | the command's result         |
    | git log --oneline -3                      | the command's result         |
    | npm install                               | refused with GUARD-BASH-001  |
    | echo x > src/marker.txt                   | refused with GUARD-BASH-002  |
    | git status && echo x > src/marker.txt     | refused with GUARD-BASH-002  |
    | echo $(cat src/app.ts)                    | refused with GUARD-BASH-002  |
```

```gherkin
Scenario Outline: C002-TS-641 — command decisions with the dialect argument
  Given the server instance "sdd-shell" runs in "fx-srv", whose environment has no "CLAUDE_PLUGIN_DATA"
  When an agent calls the command tool with "<command>" and the argument "dialect" set to "<dialect>"
  Then the result is <result>
  And "src/app.ts" is unchanged and "src/marker.txt" does not exist
  Examples:
    | dialect    | command                           | result                       |
    | powershell | sdd status                        | the command's result         |
    | powershell | Remove-Item -Recurse src          | refused with GUARD-BASH-001  |
    | powershell | sdd status > src/marker.txt       | refused with GUARD-BASH-002  |
    | powershell | sdd serena-launch src -- start-mcp-server | refused with GUARD-BASH-001 |
    | bash       | sdd serena-config src             | refused with GUARD-BASH-001  |
    | bash       | sdd serena-config C:/repo/.sdd    | refused with GUARD-BASH-001  |
    | zsh        | sdd status                        | refused with ERR-MCP-001     |
```

```gherkin
Scenario Outline: C002-TS-660 — the literal `${CLAUDE_PLUGIN_DATA}` is not expanded by the command tool
  Given the server instance "sdd-shell" runs in "fx-srv", whose environment <environment>
  When an agent calls the command tool with the command '<command>' and the argument "dialect" set to "bash"
  Then the result is refused with GUARD-BASH-001
  And "fx-srv" holds no file or folder named "${CLAUDE_PLUGIN_DATA}"
  And no "serena_config.yml" exists under "C:/fx-data"
  Examples:
    | environment                                           | command                                                   |
    | sets "CLAUDE_PLUGIN_DATA" to "C:/fx-data"             | sdd serena-config "${CLAUDE_PLUGIN_DATA}"                 |
    | sets "CLAUDE_PLUGIN_DATA" to "C:/fx-data"             | sdd serena-config ${CLAUDE_PLUGIN_DATA}                   |
    | sets "CLAUDE_PLUGIN_DATA" to "C:/fx-data"             | sdd serena-launch "${CLAUDE_PLUGIN_DATA}" -- start-mcp-server |
    | has no "CLAUDE_PLUGIN_DATA"                           | sdd serena-config "${CLAUDE_PLUGIN_DATA}"                 |
```

The server runs a command without a shell, so its guard call does not expand the literal: the
folder outside the repository that the environment names is never used (C002-IF-008 §1.1 rule 2,
C002-IF-002 §5.2; defect D-014 item 4).

```gherkin
Scenario Outline: C002-TS-642 — allowed command whose executable cannot be started without a shell
  Given the server instance "sdd-shell" runs in "fx-srv" on REF-WIN with a PATH on which <executables>
  When an agent calls the command tool with "ast-grep --version"
  Then the result is an error result whose text is 'ERR-MCP-006: could not start "ast-grep": <reason>'
  And the result holds no exit code
  And <after>
  Examples:
    | executables                                                                     | reason                              | after                               |
    | "ast-grep" exists only as "ast-grep.cmd", a stub that records each start        | only a .cmd or .bat shim was found  | the stub "ast-grep.cmd" records no start |
    | no file named "ast-grep" with any extension exists                              | not found on PATH                   | "src/marker.txt" does not exist     |
```

```gherkin
Scenario Outline: C002-TS-686 — the command tool starts an executable from the PATH folders only
  Given the server instance "sdd-shell" runs in a copy of "fx-srv" at "C:/fx/srv" on REF-WIN, its repository root and working folder
  And "C:/fx/srv" holds the stub "git.exe", which prints "planted" and records each start
  And the server's PATH is "<path>" followed by the folder of the real "node.exe", where "C:/fx/git-bin" holds <bin>, and no other folder of that PATH holds a "git" executable
  When an agent calls the command tool with "git --version"
  Then <result>
  And the stub "C:/fx/srv/git.exe" records no start
  Examples:
    | path               | bin                                                                    | result                                                                                                     |
    | C:/fx/git-bin      | the stub "git.exe", which prints "git version 2.51.0.windows.1"        | the result holds exit code 0 and standard output "git version 2.51.0.windows.1"                            |
    | .;C:/fx/git-bin    | the stub "git.exe", which prints "git version 2.51.0.windows.1"        | the result holds exit code 0 and standard output "git version 2.51.0.windows.1"                            |
    | ;C:/fx/git-bin     | the stub "git.exe", which prints "git version 2.51.0.windows.1"        | the result holds exit code 0 and standard output "git version 2.51.0.windows.1"                            |
    | C:/fx/git-bin      | no file named "git" with any extension                                 | the result is an error result whose text is 'ERR-MCP-006: could not start "git": not found on PATH'        |
    | .                  | no file named "git" with any extension                                 | the result is an error result whose text is 'ERR-MCP-006: could not start "git": not found on PATH'        |
    | C:/fx/git-bin      | only "git.cmd", a stub that records each start                         | the result is an error result whose text is 'ERR-MCP-006: could not start "git": only a .cmd or .bat shim was found', and the stub "C:/fx/git-bin/git.cmd" records no start |
```

```gherkin
Scenario: C002-TS-687 — the process tree is killed by the taskkill of the PATH folders
  Given the server instance "sdd-shell" runs in a copy of "fx-srv" at "C:/fx/srv" on REF-WIN, whose root holds the stub "taskkill.exe", which records each start
  And the server's PATH holds "C:/fx/git-bin", whose stub "git.exe" never ends and starts one child process that never ends, and "C:/Windows/System32", whose "taskkill.exe" is the one of Windows
  When an agent calls the command tool with "git --version" and "timeout_ms" 2000
  Then the result has the "status" "timed_out"
  And neither the stub "git.exe" nor its child process runs 5 seconds after the result
  And the stub "C:/fx/srv/taskkill.exe" records no start
```

The server resolves every allowlisted executable other than `sdd`, and `taskkill` at a timeout, by
the executable lookup of C002-IF-007: the folders of its PATH only, an empty or relative entry
skipped, never its working folder or the repository, and starts the first native match by its
absolute path (C002-IF-002 §5.2 steps 3 and 4, C002-CON-17; critic CR-63, P-01 answer to
Q-exec-lookup-01).

```gherkin
Scenario Outline: C002-TS-666 — OpenCode 1.18.31 accepts refused and failed calls of the server's tools
  Given OpenCode 1.18.31 started as the pinned host binary with a database and data folders of its own, in a copy of "fx-srv" with the OpenCode target package generated with "--mode opencode=sdd-mcp-server"
  And a stub model whose first step makes "sdd-conductor" call "<host tool>" with <arguments>, and whose second step answers "done"
  And a PATH that holds no file named "ast-grep" with any extension
  When the session runs
  Then the session's part for the "<host tool>" call holds the text <text>
  And no part, message or session error of the session contains "-32602" or "structured content does not match the output schema"
  And the session reaches the stub model's second step
  And <state>
  Examples:
    | host tool             | arguments                                          | text                                                                  | state                              |
    | sdd-shell_run_command | the command "npm install"                          | that starts with "GUARD-BASH-001: "                                   | no folder "node_modules" exists    |
    | sdd-shell_run_command | the command "ast-grep --version"                   | 'ERR-MCP-006: could not start "ast-grep": not found on PATH'          | "src/marker.txt" does not exist    |
    | sdd-files_write_file  | the path "src/app.ts" and the content "x"          | that starts with "GUARD-PATH-001: "                                   | "src/app.ts" is unchanged          |
    | sdd-shell_run_command | the command "sdd status"                           | that starts with "exit 0"                                             | "src/marker.txt" does not exist    |
```

OpenCode 1.18.31 validates every `structuredContent` against the tool's advertised `outputSchema`;
an error result carries none (C002-IF-002 §4, defect D-017), and the success row checks that the
success output still validates. The doctor reads a probe of a tool that is not on PATH as `missing`
from that text (C002-IF-006 §2; C002-TS-507).

### C002-REQ-406 — Command results returned
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the sdd MCP server has run an allowed command, THE sdd MCP server SHALL return the command's exit code, standard output and standard error to the calling agent.
- **Rationale:** C002-US-402 (agents read `sdd lint`, `sdd trace` and git output)
- **Stories:** C002-US-402
- **Priority:** Must
- **Acceptance:** C002-AC-406.1

#### C002-AC-406.1 — Exit code, standard output and standard error returned
```gherkin
Scenario: C002-TS-407 — successful command
  Given the server instance "sdd-shell" runs in "fx-srv"
  When an agent calls the command tool with "git rev-parse --is-inside-work-tree"
  Then the result holds exit code 0, standard output "true" and an empty standard error
```

```gherkin
Scenario: C002-TS-408 — failing command
  Given the server instance "sdd-shell" runs in "fx-srv", which has no change "999"
  When an agent calls the command tool with "sdd lint 999"
  Then the result holds the non-zero exit code of "sdd lint 999" and its standard error text
  And the result is not an MCP error result
```

```gherkin
Scenario: C002-TS-424 — plugin-root variable reaches node as literal text
  Given the server instance "sdd-shell" runs in "fx-srv", whose environment sets "CLAUDE_PLUGIN_ROOT" to "C:/fx/plugin"
  And "C:/fx/plugin/scripts/sdd.mjs" is a stub that records each start
  When an agent calls the command tool with "node ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs status"
  Then the result is not an MCP error result
  And it holds the non-zero exit code of "node" and a standard error text that contains "${CLAUDE_PLUGIN_ROOT}"
  And the stub "C:/fx/plugin/scripts/sdd.mjs" records no start
```

### C002-REQ-407 — Commands use the server's own CLI
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the sdd MCP server runs an `sdd` command, THE sdd MCP server SHALL run the sdd CLI of the `architect-sdd` package version it belongs to.
- **Rationale:** C002-GOAL-04; a PATH `sdd` of another version cannot change what the server runs
- **Stories:** C002-US-402
- **Priority:** Must
- **Acceptance:** C002-AC-407.1

#### C002-AC-407.1 — The server runs its own package's CLI
```gherkin
Scenario: C002-TS-409 — another sdd on PATH
  Given the server instance "sdd-shell" of "architect-sdd" version "0.3.0" runs in "fx-srv"
  And the PATH holds first an executable "sdd" that prints "0.0.1-fake"
  When an agent calls the command tool with "sdd --version"
  Then the standard output in the result is "0.3.0"
```

```gherkin
Scenario: C002-TS-423 — own CLI not found beside the server
  Given the server instance "sdd-shell" runs in "fx-srv" from an unpacked "architect-sdd" package at "C:/fx/pkg-sdd" whose "scripts/sdd.mjs" was deleted before the start
  And the PATH holds first an executable "sdd" that records each start
  When an agent calls the command tool with "sdd status"
  Then the result is an error result with "isError" true and no "structuredContent" key
  And its only text item starts with 'ERR-MCP-006: could not start "sdd": not found beside the server (', names the absolute path of "C:/fx/pkg-sdd/scripts/sdd.mjs" and ends with ")"
  And the result holds no exit code
  And the PATH executable "sdd" records no start
```

### C002-REQ-408 — Quick-lint findings with each write
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the sdd MCP server has written a file under `.sdd/`, THE sdd MCP server SHALL return the quick-lint findings for that file together with the write result.
- **Rationale:** ideation §5 (hook table: findings with the write result on Copilot VS Code); the lint core is reusable, only the Claude output envelope is host-specific (baseline survey §2, `post-write.ts`, E-12); format of C001-IF-07 §4
- **Stories:** C002-US-403
- **Priority:** Must
- **Acceptance:** C002-AC-408.1

#### C002-AC-408.1 — Write result carries the quick-lint findings
```gherkin
Scenario: C002-TS-410 — requirement with two SHALL
  Given the server instance "sdd-files" runs in "fx-srv"
  When an agent writes ".sdd/002-x/10-spec/20-capabilities/CAP-01-x/requirements.md" whose only requirement has two SHALL
  Then the result reports the write as done
  And it contains a finding "LINT-EARS-002" for that file in the format of C001-IF-07 §4
```

```gherkin
Scenario: C002-TS-411 — more findings than the feedback limit
  Given the server instance "sdd-files" runs in "fx-srv"
  When an agent writes a requirements file that produces 20 quick-lint findings
  Then the result reports the write as done
  And it contains 15 findings, errors before warnings
```

```gherkin
Scenario: C002-TS-412 — clean file
  Given the server instance "sdd-files" runs in "fx-srv"
  When an agent writes a requirements file that produces no quick-lint finding
  Then the result reports the write as done
  And it contains no finding line
```

### C002-REQ-409 — Write result without findings
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the quick-lint check cannot run after a successful write, THEN THE sdd MCP server SHALL return the write result with a note that the findings are unavailable.
- **Rationale:** the post-write hook never blocks a write (C001-IF-07 §2: always exit 0)
- **Stories:** C002-US-403
- **Priority:** Must
- **Acceptance:** C002-AC-409.1

#### C002-AC-409.1 — Lint failure after a write keeps the write
```gherkin
Scenario: C002-TS-413 — quick lint cannot run
  Given the server instance "sdd-files" runs in "fx-srv" with an injected fault that makes the quick-lint check throw
  When an agent writes ".sdd/002-x/a.md" with the content "status: in-review"
  Then the result reports the write as done with a note that the findings are unavailable
  And ".sdd/002-x/a.md" holds "status: in-review"
```

### C002-REQ-410 — Standard input and output only
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE sdd MCP server SHALL exchange MCP messages over its standard input and standard output only.
- **Rationale:** C002-CON-04; ideation §8 (a stdio process the host starts per session)
- **Stories:** C002-US-404
- **Priority:** Must
- **Acceptance:** C002-AC-410.1

#### C002-AC-410.1 — MCP messages on standard input and output only
```gherkin
Scenario Outline: C002-TS-414 — one session over stdio
  Given the server instance "<instance>" is started as a child process in "fx-srv" with "tests/no-network.mjs" preloaded
  When the client completes "initialize", "tools/list" and <call> over the process's standard input
  Then every line the process writes to standard output parses as a JSON-RPC message
  And the process opened no listening socket and no network connection
  Examples:
    | instance  | call                                   |
    | sdd-files | one write call on ".sdd/002-x/b.md"    |
    | sdd-shell | one command call with "sdd status"     |
```

### C002-REQ-411 — Ends with the session
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the host closes the standard input of the sdd MCP server, THE sdd MCP server SHALL exit with code 0.
- **Rationale:** C002-CON-04 (not a daemon); constitution, forbidden technologies
- **Stories:** C002-US-404
- **Priority:** Must
- **Acceptance:** C002-AC-411.1

#### C002-AC-411.1 — Closing standard input ends the server
```gherkin
Scenario Outline: C002-TS-415 — host closes the session
  Given the server instance "<instance>" has answered "initialize"
  When the client closes the server's standard input
  Then the process exits with code 0
  Examples:
    | instance  |
    | sdd-files |
    | sdd-shell |
```

```gherkin
Scenario: C002-TS-416 — input closed before initialisation
  Given the server instance "sdd-shell" has just started and received no message
  When the client closes the server's standard input
  Then the process exits with code 0
```

### C002-REQ-412 — Shipped in `architect-sdd`
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE `architect-sdd` package SHALL contain the sdd MCP server as a bundled entry of its own, next to the `sdd` executable.
- **Rationale:** C002-DEC-001 (Constitution check); not under `plugins/architect/scripts/`, which `build.mjs` keeps for `sdd.mjs` only (current-state E-2); C001-CON-02 is reviewed in the architecture step (`../../10-context/scope.md` §4); the templates and the Serena read-only mode file the CLI needs are shipped by C002-REQ-512
- **Stories:** C002-US-404
- **Priority:** Must
- **Acceptance:** C002-AC-412.1

#### C002-AC-412.1 — The server is a bundled entry next to `sdd`
```gherkin
Scenario: C002-TS-417 — tarball entries
  Given "npm run package" has written the "architect-sdd" tarball
  When the tarball's file list and "package.json" are read
  Then it holds the bundled "sdd" executable entry and a separate bundled entry for the sdd MCP server
  And "plugins/architect/scripts/" in the repository holds "sdd.mjs" only
```

### C002-REQ-413 — License check of every bundled entry
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a package bundled into an entry of the `architect-sdd` package has a license outside the allowlist of C001-REQ-1114, THEN THE build SHALL fail with a message naming the package and its license.
- **Rationale:** constitution, forbidden technologies; C001-REQ-1114 stays as it is for `scripts/sdd.mjs`
- **Stories:** C002-US-404
- **Priority:** Must
- **Acceptance:** C002-AC-413.1

#### C002-AC-413.1 — A bundled package outside the allowlist fails the build
```gherkin
Scenario Outline: C002-TS-418 — GPL dependency in an entry
  Given a development change makes the <entry> sources import the package "gpl-lib" version "1.0.0" with the license "GPL-3.0"
  When the build runs
  Then it exits non-zero
  And a line of its standard error starts with "ERR-BLD-001: build failed: " and ends with "bundled package license not allowed: gpl-lib@1.0.0 (GPL-3.0)"
  Examples:
    | entry           |
    | sdd executable  |
    | sdd MCP server  |
```

### C002-REQ-414 — License and notices in `architect-sdd`
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE `architect-sdd` package SHALL contain the MIT `LICENSE` and a `THIRD_PARTY_NOTICES.md` that lists every package bundled into its entries with its version and license.
- **Rationale:** C001-REQ-1112 and C001-REQ-1113 carried to the npm package
- **Stories:** C002-US-404
- **Priority:** Must
- **Acceptance:** C002-AC-414.1

#### C002-AC-414.1 — License and notices in the npm package
```gherkin
Scenario: C002-TS-419 — LICENSE and THIRD_PARTY_NOTICES.md
  Given the bundle metadata of both entries lists the packages "yaml@2.x" and the MCP SDK package
  When the "architect-sdd" tarball is read
  Then it contains "LICENSE" with "MIT License"
  And "THIRD_PARTY_NOTICES.md" lists every package bundled into either entry with its version and license
```

### C002-REQ-415 — One tool set per server profile
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the host starts the sdd MCP server with a server profile, THE sdd MCP server SHALL list only the tools of that profile: the write tools for the profile `files` and the command tool for the profile `shell`.
- **Rationale:** a host that grants whole servers only (`<server>/*` on Copilot, C002-OA-001; the grant form tested in VS Code, `docs/spikes/S-08-copilot-vscode.md §3.2`) can then grant the command tool apart from the write tools (C002-REQ-117, C002-REQ-210, C002-REQ-307); one program, two declared servers (C002-IF-002 §1, §2; architecture §6.2)
- **Stories:** C002-US-401, C002-US-402
- **Priority:** Must
- **Acceptance:** C002-AC-415.1

#### C002-AC-415.1 — Each server profile lists only its own tools
```gherkin
Scenario Outline: C002-TS-420 — tool list per profile
  Given the sdd MCP server is started in "fx-srv" as "sdd-mcp --profile <profile>"
  When the client sends "tools/list"
  Then the list holds exactly the tools <tools>
  Examples:
    | profile | tools                          |
    | files   | "write_file" and "replace_text" |
    | shell   | "run_command"                   |
```

```gherkin
Scenario Outline: C002-TS-421 — tool of the other profile called by name
  Given the server instance "<instance>" runs in "fx-srv"
  When the client calls the tool "<tool>" with <arguments>
  Then the response is the JSON-RPC error "-32602"
  And <state>
  Examples:
    | instance  | tool        | arguments                                                    | state                                    |
    | sdd-files | run_command | the command "echo x > src/marker.txt"                        | "src/marker.txt" does not exist          |
    | sdd-shell | write_file  | the path ".sdd/002-x/a.md" and the content "status: approved" | ".sdd/002-x/a.md" still holds "status: draft" |
```

```gherkin
Scenario Outline: C002-TS-422 — missing or unknown profile
  When the sdd MCP server is started in "fx-srv" as "<command line>"
  Then the process exits with code 2 before any MCP message
  And a line of standard error starts with "sdd-mcp: ERR-MCP-007: usage: sdd-mcp --profile files|shell [--root <dir>]: "
  And standard output is empty
  Examples:
    | command line              |
    | sdd-mcp                   |
    | sdd-mcp --profile admin   |
```

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
