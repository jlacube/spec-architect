---
id: C002-CAP-04
artifact: spec/acceptance
capability: "sdd MCP server"
change: CHG-002
phase: 10-spec
status: draft
---

# C002-CAP-04 — Acceptance criteria and scenarios

Verification: integration tests start the sdd MCP server from the packed `architect-sdd` tarball as
a child process in the fixture repository, exchange MCP JSON-RPC messages over its standard input and
output, and check the results and the file system. No host is needed; the same calls run through
Copilot CLI in the Copilot CLI eval runner (C002-REQ-612). The tests preload `tests/no-network.mjs`
(C002-NFR-205). Fixture: `fx-srv` is a repository at `C:/repo` with `.sdd/002-x/`, `src/app.ts`, a
symbolic link `.sdd/link-to-src` to `src/`, and the file `.sdd/002-x/a.md` whose content is
`status: draft`. Server instances: "sdd-files" is the server started as `sdd-mcp --profile files`
and "sdd-shell" the server started as `sdd-mcp --profile shell`, each as the target packages
declare it (C002-REQ-210, C002-REQ-307).

## C002-REQ-401

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

## C002-REQ-402

#### C002-AC-402.1 — A failed write leaves the previous content
```gherkin
Scenario Outline: C002-TS-402 — faults during a write call
  Given the server instance "sdd-files" runs in "fx-srv" with the fault "<fault>"
  When an agent calls the whole-file write tool on ".sdd/002-x/a.md" with the content "status: approved"
  Then the result is an error result naming the fault
  And ".sdd/002-x/a.md" still holds "status: draft"
  Examples:
    | fault                                                  |
    | the call has no "content" argument                     |
    | the path guard core throws an exception                |
    | the file system reports an I/O error during the write  |
```

## C002-REQ-403

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

## C002-REQ-404

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

## C002-REQ-405

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
  Then the result is an error result with ERR-MCP-006 and the reason "<reason>"
  And the result holds no exit code
  And <after>
  Examples:
    | executables                                                                     | reason                              | after                               |
    | "ast-grep" exists only as "ast-grep.cmd", a stub that records each start        | only a .cmd or .bat shim was found  | the stub "ast-grep.cmd" records no start |
    | no file named "ast-grep" with any extension exists                              | not found on PATH                   | "src/marker.txt" does not exist     |
```

## C002-REQ-406

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

## C002-REQ-407

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
  Then the result is an error result whose "structuredContent.code" is "ERR-MCP-006"
  And its "structuredContent.message" starts with 'could not start "sdd": not found beside the server (' and names the absolute path of "C:/fx/pkg-sdd/scripts/sdd.mjs"
  And the result holds no exit code
  And the PATH executable "sdd" records no start
```

## C002-REQ-408

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

## C002-REQ-409

#### C002-AC-409.1 — Lint failure after a write keeps the write
```gherkin
Scenario: C002-TS-413 — quick lint cannot run
  Given the server instance "sdd-files" runs in "fx-srv" with an injected fault that makes the quick-lint check throw
  When an agent writes ".sdd/002-x/a.md" with the content "status: in-review"
  Then the result reports the write as done with a note that the findings are unavailable
  And ".sdd/002-x/a.md" holds "status: in-review"
```

## C002-REQ-410

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

## C002-REQ-411

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

## C002-REQ-412

#### C002-AC-412.1 — The server is a bundled entry next to `sdd`
```gherkin
Scenario: C002-TS-417 — tarball entries
  Given "npm run package" has written the "architect-sdd" tarball
  When the tarball's file list and "package.json" are read
  Then it holds the bundled "sdd" executable entry and a separate bundled entry for the sdd MCP server
  And "plugins/architect/scripts/" in the repository holds "sdd.mjs" only
```

## C002-REQ-413

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

## C002-REQ-414

#### C002-AC-414.1 — License and notices in the npm package
```gherkin
Scenario: C002-TS-419 — LICENSE and THIRD_PARTY_NOTICES.md
  Given the bundle metadata of both entries lists the packages "yaml@2.x" and the MCP SDK package
  When the "architect-sdd" tarball is read
  Then it contains "LICENSE" with "MIT License"
  And "THIRD_PARTY_NOTICES.md" lists every package bundled into either entry with its version and license
```

## C002-REQ-415

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

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C002-REQ-401 | TS-401 | TS-401 (case) | TS-401 (memory folder) | TS-401 | TS-401 | n/a | TS-401 (.., link, other drive) |
| C002-REQ-402 | TS-402 | n/a | n/a | TS-402 | n/a | n/a | TS-402 (missing argument) |
| C002-REQ-403 | TS-403, TS-404 | n/a | n/a | n/a: refused spans are C002-REQ-404 | n/a | n/a | n/a |
| C002-REQ-404 | TS-405 | n/a | TS-405 (0, 1, 2) | TS-405 | n/a | n/a | n/a |
| C002-REQ-405 | TS-406 | TS-641 (PowerShell dialect), TS-660 (Serena literal with and without the variable set) | n/a | TS-406, TS-641 (unknown dialect), TS-642 (`.cmd` shim, not on PATH) | TS-406, TS-641, TS-660 | n/a | TS-406 (redirection, substitution), TS-641 (Serena data folder inside the repository), TS-660 (literal `${CLAUDE_PLUGIN_DATA}` never expanded from the server's environment; no folder of that name created) |
| C002-REQ-406 | TS-407 | TS-408 (failing command), TS-424 (plugin-root literal not expanded: ordinary non-zero result) | n/a | TS-408, TS-424 | n/a | n/a | TS-424 (a variable never expands to another CLI without a shell) |
| C002-REQ-407 | TS-409 | n/a | n/a | TS-423 (ERR-MCP-006 `not found beside the server`) | n/a | n/a | TS-409 (PATH shadowing), TS-423 (no fallback to a PATH `sdd` when the own CLI is missing) |
| C002-REQ-408 | TS-410 | TS-412 (no finding) | TS-411 (15 of 20) | n/a: C002-REQ-409 | n/a | n/a | n/a |
| C002-REQ-409 | TS-413 | n/a | n/a | TS-413 | n/a | n/a | n/a |
| C002-REQ-410 | TS-414 | n/a | n/a | n/a | n/a | n/a | TS-414 |
| C002-REQ-411 | TS-415 | TS-416 (before initialisation) | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-412 | TS-417 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-413 | TS-418 | TS-418 (both entries) | n/a | TS-418 | n/a | n/a | n/a |
| C002-REQ-414 | TS-419 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-415 | TS-420 | TS-420 (two profiles) | n/a | TS-422 | TS-421 | n/a | TS-421 (tool of the other profile called by name) |

Per-column n/a reasons. *Alternate*: one expected path. *Boundary*: no numeric limit except span
occurrences and the feedback limit of C001-IF-07 §4. *Error*: rules about content or packaging whose
failure is a build or check failure tested elsewhere (C002-REQ-413, C002-REQ-603). *Authorization*:
the server has no agent identity; only Architect agents are granted its tools, by server profile
(C002-REQ-117, C002-REQ-415), so authorization is the boundary decision itself and the profile split. *Concurrency/idempotency*: the host
starts one server per session and sends one call at a time; parallel sessions on one change are
excluded by C001-CON-11. *Abuse*: packaging rules take no external input; the boundary rules carry
the traversal, link, chaining, redirection and PATH cases.
