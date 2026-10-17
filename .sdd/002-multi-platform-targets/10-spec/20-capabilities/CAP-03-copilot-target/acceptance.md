---
id: C002-CAP-03
artifact: spec/acceptance
capability: "Copilot VS Code target"
change: CHG-002
phase: 10-spec
status: draft
---

# C002-CAP-03 — Acceptance criteria and scenarios

Verification (C002-DEC-003): VS Code has no headless chat mode. Scenarios without a tag are structure
tests on the generated `dist/copilot/`, integration tests of the Copilot install command, or
integration tests that feed Copilot-format hook input (the field names and `tool_name` values of the
S-08 record, C002-IF-008 §2, §3) to the package's hook commands on stdin and check the exit code,
standard output and standard error. Revised for defect D-003 (`docs/spikes/S-08-copilot-vscode.md
§5`). Tags:

- `@eval`: agent behaviour run by the Copilot CLI eval runner (C002-REQ-612) or the OpenCode eval
  runner (C002-REQ-608); passes at the dev tier: one passing run per Examples row, at most one rerun after a failure (DOD-G-01's 9-of-10 clause waived for CHG-002, Q-evalbudget-01).
- `@manual-vscode`: a step of the manual VS Code checklist (C002-REQ-614), passed by its checklist
  record (C002-REQ-615) on the tested VS Code and GitHub Copilot Chat versions. These are the
  behaviours that can be checked only in VS Code.
- `@mode-server` / `@mode-hooks`: the scenario applies only when the Copilot target package is
  generated for sdd MCP server enforcement or for the Copilot hooks fallback (the signed-off S-08
  record gives sdd MCP server enforcement, `docs/spikes/S-08-copilot-vscode.md §4`); the other mode's
  scenarios are recorded as not applicable in the test report.

Fixtures and terms:

- `fx-cp`: a repository with `.sdd/` (two active changes), `src/app.ts` and `README.md`.
- `fx-cp-install`: a git repository with `src/app.ts` and `README.md`, without `.github/` and `.vscode/`.
- `pkg-cp`: a copy of the generated `dist/copilot/` at `C:/fx/pkg-cp`; `pkg-cp-hooks`: the same for a
  package generated for the Copilot hooks fallback, at `C:/fx/pkg-cp-hooks`. Unless a scenario says
  otherwise, the package is installed into `fx-cp` with `sdd install copilot --package <folder>`, and
  "the package's … hook command" is the command of that entry in `<folder>/hooks.json`, run directly
  with the hook input on stdin.
- "the deny decision": standard output holds one JSON object whose `permissionDecision` and
  `hookSpecificOutput.permissionDecision` are `deny` (C002-IF-008 §2).

## C002-REQ-301

#### C002-AC-301.1 — Agents, prompt files, skills, workspace MCP configuration and the CLI copy present
```gherkin
Scenario: C002-TS-301 — Copilot package layout
  Given "npm run package" has written "dist/copilot/"
  When the target structure check reads the package
  Then it holds the ten agents as "agents/sdd-conductor.agent.md" to "agents/sdd-auditor.agent.md"
  And "plugin.json" with the name "architect"
  And one prompt file "prompts/*.prompt.md" for each of the 13 source commands
  And one skill folder with a "SKILL.md" in the Agent Skills format for each source skill
  And "install/mcp.json" whose "servers" declares "context7", "deepwiki", "serena", "sdd-files" and "sdd-shell"
  And "install/hooks.template.json" in which every hook command starts with 'node "@CLI_COPY@"' and none runs a bare "sdd"
  And no ".mcp.json" and no "hooks.json"
  And "scripts/sdd.mjs" with the same SHA-256 as "plugins/architect/scripts/sdd.mjs" of the same packaging run
```

```gherkin
Scenario Outline: C002-TS-302 — required file missing
  Given a generated "dist/copilot/" from which "<file>" is removed
  When the target structure check runs on the Copilot target package
  Then it reports an error naming "<file>"
  Examples:
    | file                         |
    | agents/sdd-critic.agent.md   |
    | scripts/sdd.mjs              |
    | plugin.json                  |
    | install/mcp.json             |
    | install/hooks.template.json  |
```

## C002-REQ-302

#### C002-AC-302.1 — No PreToolUse hook under sdd MCP server enforcement
```gherkin
@mode-server
Scenario: C002-TS-303 — hook declarations of the package
  When every file of "dist/copilot/" is parsed
  Then "install/hooks.template.json" declares a "SessionStart" and a "SubagentStop" entry and no other event
  And no file declares a "PreToolUse" hook
  And no agent frontmatter has a "hooks" key
```

```gherkin
@mode-server
Scenario Outline: C002-TS-304 — PreToolUse hook added to the package
  Given a generated "dist/copilot/" in which <change>
  When the target structure check runs on the Copilot target package
  Then it reports an error naming "<file>" and "PreToolUse"
  Examples:
    | change                                                                                              | file                        |
    | the source "hooks/hooks.json" is copied unchanged to "hooks.json"                                   | hooks.json                  |
    | "install/hooks.template.json" gains a "PreToolUse" entry running "hook guard --host copilot"        | install/hooks.template.json |
    | the frontmatter of "agents/sdd-critic.agent.md" gains a "hooks" key with a "PreToolUse" entry       | sdd-critic.agent.md         |
```

## C002-REQ-303

#### C002-AC-303.1 — Every prompt file names the conductor
```gherkin
Scenario: C002-TS-305 — prompt file agent field
  When the 13 prompt files of "dist/copilot/" are parsed
  Then each has the field "agent" naming the generated conductor
  And none contains the line "claude --agent architect:sdd-conductor"
```

## C002-REQ-304

#### C002-AC-304.1 — Install notes name prerequisites, the install command, settings, session type and start
```gherkin
Scenario: C002-TS-306 — Copilot install notes
  When the install notes "INSTALL.md" of "dist/copilot/" are read
  Then they state Node.js 20 or later, the VS Code and GitHub Copilot Chat tested versions of the doctor remedies table, and access to the Claude models of the three tiers
  And they give the npm command that installs "architect-sdd"
  And they give the step that runs "sdd install copilot --package <folder>" in P-03's own terminal in the repository, and again in each further repository and after the package moves or changes version
  And they name the settings "chat.plugins.enabled", "chat.pluginLocations" and "chat.askQuestions.enabled" with their values, in a step after the install command step
  And they state that the chat uses the Local session type with "sdd-conductor" selected as the session agent
  And they state that the workspace MCP servers start only after the first message of a session
```

## C002-REQ-305

#### C002-AC-305.1 — README section links the notes and names the enforcement mode
```gherkin
Scenario: C002-TS-307 — README Copilot VS Code section
  Given the Copilot target package is generated for the enforcement mode that spike S-08 fixed
  When the README is read
  Then it has a "Copilot VS Code" section whose link resolves to the install notes of the Copilot target package
  And that section names that enforcement mode by its glossary name
```

## C002-REQ-306

#### C002-AC-306.1 — No generic edit or terminal tool in agents and prompt files
```gherkin
@mode-server
Scenario: C002-TS-308 — tool lists of the Copilot package
  When the "tools" fields of the ten agents and the 13 prompt files of "dist/copilot/" are parsed
  Then each of the ten agents has a "tools" field
  And none grants "edit", "execute" or another VS Code built-in edit or terminal tool, by name or through a tool set that contains one
  And the conductor's "tools" field grants neither
```

```gherkin
@manual-vscode @mode-server
Scenario: C002-TS-309 — conductor asked to edit product code in VS Code
  Given the conductor runs in VS Code on "fx-cp" with the Copilot target package
  When P-01 asks the conductor to add a line to "src/app.ts"
  Then "src/app.ts" is unchanged
  And the chat shows no edit or terminal tool call
```

## C002-REQ-307

#### C002-AC-307.1 — Two local servers declared in the workspace MCP configuration only
```gherkin
Scenario Outline: C002-TS-310 — server profiles declared in the workspace MCP configuration
  Given the Copilot target package generated for <mode>
  When "dist/copilot/install/mcp.json" is parsed
  Then "servers" declares "sdd-files" with the type "stdio", the command "sdd-mcp" and the arguments "--profile", "files"
  And it declares "sdd-shell" with the type "stdio", the command "sdd-mcp" and the arguments "--profile", "shell"
  And no other entry runs "sdd-mcp"
  And no other file of the package declares an MCP server
  Examples:
    | mode                         |
    | sdd MCP server enforcement   |
    | the Copilot hooks fallback   |
```

```gherkin
Scenario Outline: C002-TS-327 — server profile missing or declared in a plugin MCP configuration
  Given a generated "dist/copilot/" in which <change>
  When the target structure check runs on the Copilot target package
  Then it reports the error TGT-MCP-001 naming "<file>" and "<server>"
  Examples:
    | change                                                                    | file             | server    |
    | the "sdd-files" entry is removed from "servers" of "install/mcp.json"     | install/mcp.json | sdd-files |
    | a file ".mcp.json" at the package root declares the server "sdd-shell"    | .mcp.json        | sdd-shell |
```

## C002-REQ-308

#### C002-AC-308.1 — One plugin-level guard hook decides the calls of Architect agents by `agent_type`
```gherkin
@mode-hooks
Scenario: C002-TS-311 — one plugin-level PreToolUse entry
  When "dist/copilot/install/hooks.template.json" and the frontmatter of the ten "*.agent.md" files are parsed
  Then "hooks.PreToolUse" holds exactly one entry
  And its command is 'node "@CLI_COPY@" hook guard --host copilot --agents ' followed by the ten Architect agent names, comma-separated
  And no agent frontmatter declares a hook
```

```gherkin
@mode-hooks
Scenario Outline: C002-TS-312 — hook decisions on Copilot hook input
  Given Copilot PreToolUse hook input in "fx-cp" with "agent_type" "<agent_type>", "tool_name" "<tool>" and <input>
  When the package's PreToolUse hook command runs
  Then the exit code is <code>
  And standard output is <stdout>
  And standard error <stderr>
  Examples:
    | agent_type                | tool  | input                                        | code | stdout                | stderr                        |
    | sdd-spec-writer           | Write | "tool_input.path" ".sdd/002-x/10-spec/a.md"  | 0    | empty                 | is empty                      |
    | sdd-spec-writer           | Write | "tool_input.path" "src/app.ts"               | 2    | the deny decision     | contains "GUARD-PATH-001"     |
    | sdd-spec-writer           | Write | "tool_input.path" ".sdd/../src/app.ts"       | 2    | the deny decision     | contains "GUARD-PATH-001"     |
    | architect:sdd-spec-writer | Write | "tool_input.path" "src/app.ts"               | 2    | the deny decision     | contains "GUARD-PATH-001"     |
    | sdd-spec-writer           | Bash  | "tool_input.command" "sdd lint 002"          | 0    | empty                 | is empty                      |
    | sdd-spec-writer           | Bash  | "tool_input.command" "npm install"           | 2    | the deny decision     | contains "GUARD-BASH-001"     |
    | sdd-spec-writer           | Bash  | "tool_input.command" "git status && rm -rf src" | 2 | the deny decision     | contains "GUARD-BASH-002"     |
    | sdd-spec-writer           | Bash  | "tool_input.command" "sdd install copilot"   | 2    | the deny decision     | contains "GUARD-BASH-001"     |
```

```gherkin
@manual-vscode @mode-hooks
Scenario: C002-TS-313 — subagent write outside .sdd/ blocked in VS Code
  Given hooks are enabled in VS Code and the conductor has dispatched "sdd-spec-writer" on "fx-cp"
  When "sdd-spec-writer" attempts to write "src/app.ts"
  Then "src/app.ts" is unchanged
  And the chat shows that tool call as denied by a hook, with the guard message or the host's hook-error text
```

```gherkin
@eval @mode-hooks
Scenario: C002-TS-336 — guard-hook deny holds on Copilot CLI
  Given Copilot CLI at its tested version with "pkg-cp-hooks" loaded through "--plugin-dir" and installed into the case workspace, a copy of "fx-cp"
  When the Copilot CLI eval runner runs "sdd-spec-writer" with the prompt "Append the line // checked to src/app.ts"
  Then "src/app.ts" of the case workspace is unchanged
  And every "Write" call on "src/app.ts" in the session's JSON events is reported by the runner as a tool call that did not run
```

## C002-REQ-309

#### C002-AC-309.1 — A Copilot guard hook that cannot decide denies on standard output with a non-zero exit code
```gherkin
@mode-hooks
Scenario Outline: C002-TS-314 — faults of the Copilot guard hook
  Given the fault "<fault>"
  When the package's PreToolUse hook command runs
  Then the exit code is 2
  And standard output is the deny decision
  And standard error contains "GUARD-HOOK-001" and names the fault
  Examples:
    | fault                                                                                                   |
    | standard input is "not json"                                                                            |
    | standard input is empty                                                                                 |
    | standard input is the JSON array "[1]"                                                                  |
    | the hook input has "agent_type" "sdd-spec-writer" and the tool "unknownTool", which the tool classes file does not class |
    | the hook input has "agent_type" "sdd-spec-writer" and no "cwd"                                          |
    | the hook input has "agent_type" "sdd-spec-writer" and the "cwd" ""                                      |
    | the hook input has "agent_type" "sdd-spec-writer" and no "tool_name"                                    |
    | the hook input has "agent_type" "sdd-spec-writer" and the tool "Write" without "tool_input.path"        |
    | the hook input has "agent_type" "sdd-spec-writer" and the tool classes file of the package does not exist |
    | the hook input has "agent_type" "sdd-spec-writer" and the tool classes file of the package holds "{ not json" |
    | the hook input has "agent_type" "sdd-spec-writer" and the guard core throws an exception (fault injection) |
```

## C002-REQ-310

#### C002-AC-310.1 — README warns that disabled hooks switch the boundary off
```gherkin
@mode-hooks
Scenario: C002-TS-315 — hooks fallback warning
  When the "Copilot VS Code" section of the README is read
  Then it warns that the write/shell boundary is off whenever hooks are disabled
  And it names "chat.useHooks", Workspace Trust and organisation policy as the disabling sources
```

## C002-REQ-311

#### C002-AC-311.1 — A result without a choice records nothing, on OpenCode and through `ask_user`
```gherkin
@eval
Scenario Outline: C002-TS-316 — no choice on OpenCode
  Given change "002" of "fx-gate" has phase "10-spec" in review on OpenCode
  And the eval script returns "<result>" for the conductor's "question" call of gate G2
  When the conductor receives that result
  Then the transcript shows no "sdd gate approve" command
  And ".sdd/002-*/approvals.json" and the questions log are unchanged
  Examples:
    | result                 |
    | a dismissed call       |
    | an empty answer list   |
```

```gherkin
@manual-vscode
Scenario: C002-TS-317 — skipped answer in VS Code
  Given auto-approve is enabled in VS Code, so that the conductor's "ask_user" call returns without a choice of P-01
  When the conductor asks an interview round for the toy change
  Then the questions log of the toy change has no answer for that round
  And the conductor states that no answer was received
  And the checklist record notes the result that "ask_user" returned
```

```gherkin
@manual-vscode
Scenario: C002-TS-318 — skipped gate question in VS Code
  Given auto-approve is enabled in VS Code and the toy change has phase "00-ideation" in review
  When the conductor's "ask_user" call for the gate question returns without a choice of P-01
  Then the phase stays "in-review" in "change.md"
  And "approvals.json" of the toy change is unchanged
```

## C002-REQ-312

#### C002-AC-312.1 — No `ask_user`: no question, a message naming the tool and the install step
```gherkin
@manual-vscode
Scenario: C002-TS-319 — ask_user unavailable
  Given "ask_user" is removed from the "tools" list of ".github/agents/sdd-conductor.agent.md" in the toy change repository
  When P-01 runs the new-change prompt with the title "Toy change"
  Then the conductor's reply names the missing tool "ask_user" and the step of "INSTALL.md" that makes it available
  And the reply asks no question
  And no change folder is created
```

## C002-REQ-313

#### C002-AC-313.1 — Session-start hook emits the status brief
```gherkin
Scenario: C002-TS-320 — brief on a workspace with two active changes
  Given Copilot SessionStart hook input with "cwd" set to "fx-cp"
  When the package's session-start hook command runs
  Then the exit code is 0
  And standard output has at most 10 lines, the first being "SDD workspace: 2 active change(s)"
```

```gherkin
@manual-vscode
Scenario: C002-TS-321 — brief available to the conductor in VS Code
  Given the toy change repository is open in VS Code with hooks enabled
  When P-01 starts a new chat with the conductor and asks "what is the status?"
  Then the conductor's reply names the active change and its phase without a status command in the chat
```

## C002-REQ-314

#### C002-AC-314.1 — No `.sdd/`, no output
```gherkin
Scenario: C002-TS-322 — repository without a workspace
  Given Copilot SessionStart hook input with "cwd" set to a repository without ".sdd/"
  When the package's session-start hook command runs
  Then the exit code is 0
  And standard output is empty
```

## C002-REQ-315

#### C002-AC-315.1 — Trace refreshed after an author agent in either `agent_type` form, exit code 0
```gherkin
Scenario Outline: C002-TS-323 — SubagentStop by agent
  Given Copilot SubagentStop hook input with "agent_type" "<agent_type>" and "cwd" set to "fx-cp"
  When the package's SubagentStop hook command runs
  Then the exit code is 0
  And "trace.json" of each active change is <trace>
  Examples:
    | agent_type                  | trace     |
    | sdd-spec-writer             | rewritten |
    | sdd-test-designer           | rewritten |
    | sdd-architect               | rewritten |
    | sdd-planner                 | rewritten |
    | architect:sdd-planner       | rewritten |
    | sdd-researcher              | unchanged |
    | architect:sdd-researcher    | unchanged |
```

```gherkin
Scenario: C002-TS-324 — trace refresh fails
  Given Copilot SubagentStop hook input for "sdd-planner" and a "registry.json" of "fx-cp" that does not parse
  When the package's SubagentStop hook command runs
  Then the exit code is 0
```

## C002-REQ-316

#### C002-AC-316.1 — Hook commands call the CLI copy with arguments only
```gherkin
Scenario: C002-TS-325 — hook command form
  When every hook command of "dist/copilot/install/hooks.template.json" is read
  Then each is 'node "@CLI_COPY@"' followed by arguments only
  And none contains "&&", "||", ";", "|", ">", "<", "$(" or a backtick
```

```gherkin
Scenario: C002-TS-326 — shell operator in a hook command
  Given a generated "dist/copilot/install/hooks.template.json" whose session-start hook command ends with "&& echo done"
  When the target structure check runs on the Copilot target package
  Then it reports the error TGT-HOOK-001 naming that hook command and "&&"
```

## C002-REQ-317

#### C002-AC-317.1 — Prompt files named after the source commands
```gherkin
Scenario: C002-TS-328 — prompt file names
  When the file names of "dist/copilot/prompts/" are read
  Then they are exactly "<name>.prompt.md" for each of the 13 source commands "commands/<name>.md"
  And they include "new.prompt.md", "init.prompt.md" and "doctor.prompt.md"
```

```gherkin
@manual-vscode
Scenario: C002-TS-329 — prompt files offered as slash commands in VS Code
  Given the Copilot target package is installed in VS Code at the tested versions
  When P-01 types "/" in the chat input
  Then the list offers "/doctor", "/new" and "/init" from the Architect plugin
  And "/doctor" runs the Architect doctor prompt with the conductor
```

## C002-REQ-318

#### C002-AC-318.1 — Every tool offered to a specialist has a class under the hooks fallback
```gherkin
@mode-hooks
Scenario: C002-TS-330 — tool classes file of the package
  Given the Copilot target package generated for the Copilot hooks fallback
  When the target structure check runs on that package
  Then it reports no TGT-CLASS-001 finding
  And "dist/copilot/hooks/tool-classes.json" assigns exactly one of the classes "write", "terminal" and "read_only" to every hook tool name offered to any of the nine specialists: the tools of its "tools" list and the host-added "tool_search_tool"
  And "Glob", "tool_search_tool" and the "<server>-<tool>" names of the read MCP servers granted to the specialists are in the class "read_only"
  And "Write" is in the class "write" and "Bash" in the class "terminal" with the terminal dialect of the Copilot mapping table
```

```gherkin
@mode-server
Scenario: C002-TS-331 — no tool classes file under sdd MCP server enforcement
  Given the Copilot target package generated for sdd MCP server enforcement
  When the target structure check runs on that package
  Then it reports no TGT-CLASS-001 finding
  And "dist/copilot/hooks/" holds no "tool-classes.json"
```

```gherkin
@mode-hooks
Scenario Outline: C002-TS-332 — tool missing from the tool classes file
  Given a generated "dist/copilot/hooks/tool-classes.json" from which "<tool>" is removed
  When the target structure check runs on the Copilot target package
  Then it reports <result>
  Examples:
    | tool             | result                                                                                          |
    | tool_search_tool | the error TGT-CLASS-001 naming "tool-classes.json", "tool_search_tool" and "sdd-critic.agent.md" |
    | Glob             | the error TGT-CLASS-001 naming "tool-classes.json", "Glob" and each specialist that is offered it |
    | ask_user         | no TGT-CLASS-001 finding, because only the conductor is offered "ask_user"                      |
```

## C002-REQ-319

#### C002-AC-319.1 — Read-only calls of an Architect agent are allowed with exit code 0
```gherkin
@mode-hooks
Scenario Outline: C002-TS-333 — read-only calls through the guard hook
  Given Copilot PreToolUse hook input in "fx-cp" with "agent_type" "sdd-spec-writer", "tool_name" "<tool>" and <input>
  When the package's PreToolUse hook command runs
  Then the exit code is 0
  And standard output and standard error are empty
  Examples:
    | tool                | input                                   |
    | Glob                | "tool_input.pattern" "src/**"           |
    | Glob                | "tool_input.pattern" ".sdd/002-x/*.md"  |
    | tool_search_tool    | "tool_input.query" "sdd-files"          |
    | context7-query-docs | "tool_input.query" "node:test"          |
```

```gherkin
@mode-hooks
Scenario: C002-TS-334 — read tool name in another letter case
  Given Copilot PreToolUse hook input with "agent_type" "sdd-spec-writer" and the "tool_name" "GLOB"
  When the package's PreToolUse hook command runs
  Then the exit code is 2
  And standard output is the deny decision
  And standard error contains "GUARD-HOOK-001"
```

```gherkin
@manual-vscode @mode-hooks
Scenario: C002-TS-335 — reads and searches pass the hooks in VS Code
  Given hooks are enabled in VS Code and the conductor has dispatched "sdd-cartographer" on "fx-cp"
  When "sdd-cartographer" reads "src/app.ts" and searches the repository for "TODO"
  Then the chat shows both tool calls completed
  And neither is shown as blocked by a hook
```

## C002-REQ-320

#### C002-AC-320.1 — Calls without an Architect `agent_type` pass the guard hook
```gherkin
@mode-hooks
Scenario Outline: C002-TS-337 — calls of the session agent and of adopter agents
  Given Copilot PreToolUse hook input in "fx-cp" with <agent_type>, "tool_name" "<tool>" and <input>
  When the package's PreToolUse hook command runs
  Then the exit code is 0
  And standard output and standard error are empty
  Examples:
    | agent_type                                                         | tool  | input                                |
    | no "agent_type" field (a call of the session agent)                | Write | "tool_input.path" "src/app.ts"       |
    | no "agent_type" field (a call of the session agent)                | Bash  | "tool_input.command" "npm install"   |
    | the "agent_type" "my-reviewer" (an adopter's workspace agent)      | Write | "tool_input.path" "src/app.ts"       |
    | the "agent_type" "architect:my-reviewer"                           | Write | "tool_input.path" "src/app.ts"       |
    | the "agent_type" "sdd-unknown", which is none of the ten Architect agents | Bash | "tool_input.command" "rm -rf src" |
    | the "agent_type" 42, which is not a string                         | Write | "tool_input.path" "src/app.ts"       |
```

```gherkin
@mode-hooks
Scenario: C002-TS-338 — a non-Architect call does not depend on the tool classes file
  Given "C:/fx/pkg-cp-hooks/hooks/tool-classes.json" is deleted
  And Copilot PreToolUse hook input in "fx-cp" without "agent_type", with "tool_name" "Bash" and "tool_input.command" "npm test"
  When the package's PreToolUse hook command runs
  Then the exit code is 0
  And standard output is empty
```

## C002-REQ-321

#### C002-AC-321.1 — Under the hooks fallback the conductor and the prompt files hold the server profiles
```gherkin
@mode-hooks
Scenario: C002-TS-339 — conductor and prompt-file grants under the hooks fallback
  Given the Copilot target package generated for the Copilot hooks fallback
  When the "tools" fields of "sdd-conductor.agent.md" and of the 13 prompt files are parsed
  Then each grants "sdd-files/*" and "sdd-shell/*"
  And none grants "edit", "execute" or another VS Code built-in edit or terminal tool, by name or through a tool set that contains one
  And the target structure check reports no TGT-GRANT-001 finding for these files
```

```gherkin
@mode-hooks
Scenario Outline: C002-TS-340 — generic tool granted to the conductor or a prompt file under the hooks fallback
  Given a Copilot target package generated for the Copilot hooks fallback in which "<file>" grants "<tool>"
  When the target structure check runs on that package
  Then it reports the error TGT-GRANT-001 naming "<file>" and "<tool>"
  Examples:
    | file                   | tool    |
    | sdd-conductor.agent.md | edit    |
    | plan.prompt.md         | execute |
```

## C002-REQ-322

#### C002-AC-322.1 — The install command writes the ten workspace agents
```gherkin
Scenario: C002-TS-341 — first install into a repository
  Given "pkg-cp" at "C:/fx/pkg-cp" and the repository "fx-cp-install"
  When P-03 runs "sdd install copilot --package C:/fx/pkg-cp" in "fx-cp-install"
  Then the exit code is 0
  And ".github/agents/" of "fx-cp-install" holds exactly the ten files "sdd-conductor.agent.md" to "sdd-auditor.agent.md", each byte-equal to the file of the same name under "C:/fx/pkg-cp/agents/"
  And ".github/architect-install.json" gives the package version of "C:/fx/pkg-cp/architect-target.json" and the SHA-256 of each of the ten agent files and of each server entry written
  And standard output holds one line "written .github/agents/<file>" per agent file and ends with "next: select sdd-conductor in a Local chat (INSTALL.md step 4)"
  And no file of "fx-cp-install" outside ".github/" and ".vscode/" is added or changed
```

```gherkin
Scenario: C002-TS-342 — package taken from the running CLI copy
  Given "pkg-cp" at "C:/fx/pkg-cp" and the repository "fx-cp-install"
  When P-03 runs 'node "C:/fx/pkg-cp/scripts/sdd.mjs" install copilot' without "--package" in "fx-cp-install"
  Then the exit code is 0
  And ".github/agents/" of "fx-cp-install" holds the ten agent files of "C:/fx/pkg-cp/agents/", byte for byte
```

```gherkin
Scenario: C002-TS-343 — second run with the same package
  Given "fx-cp-install" into which "sdd install copilot --package C:/fx/pkg-cp" has completed
  When P-03 runs "sdd install copilot --package C:/fx/pkg-cp" in "fx-cp-install" again
  Then the exit code is 0
  And the ten agent files, ".vscode/mcp.json" and ".github/architect-install.json" are byte-equal to their content before the run
  And standard output holds the line "unchanged .github/agents/<file>" for each of the ten agent files
```

```gherkin
Scenario: C002-TS-344 — install after a package update
  Given "fx-cp-install" into which "sdd install copilot --package C:/fx/pkg-cp" has completed with the package version "0.3.0"
  And "C:/fx/pkg-cp" is then replaced by a Copilot package of version "0.3.1" whose "agents/sdd-critic.agent.md" differs
  When P-03 runs "sdd install copilot --package C:/fx/pkg-cp" in "fx-cp-install"
  Then the exit code is 0
  And ".github/agents/sdd-critic.agent.md" is byte-equal to the new package's file
  And standard output holds the line "written .github/agents/sdd-critic.agent.md"
  And ".github/architect-install.json" gives the version "0.3.1" and the SHA-256 of the new "sdd-critic.agent.md"
```

```gherkin
Scenario Outline: C002-TS-345 — package that the install command cannot use
  Given the repository "fx-cp-install" and <package>
  When P-03 runs "<command>" in "fx-cp-install"
  Then the exit code is 2
  And standard error starts with "<code>" and names <named>
  And "fx-cp-install" has neither ".github/" nor ".vscode/" afterwards
  Examples:
    | package                                                                            | command                                         | code        | named                                       |
    | the folder "C:/fx/empty" without "architect-target.json"                            | sdd install copilot --package C:/fx/empty       | ERR-CLI-022 | "C:/fx/empty" and "architect-target.json"   |
    | the generated OpenCode package at "C:/fx/pkg-oc"                                    | sdd install copilot --package C:/fx/pkg-oc      | ERR-CLI-022 | "C:/fx/pkg-oc" and the target "opencode"    |
    | "pkg-cp" whose "architect-target.json" holds "{ not json"                           | sdd install copilot --package C:/fx/pkg-cp      | ERR-CLI-022 | "C:/fx/pkg-cp" and "architect-target.json"  |
    | "pkg-cp" without "agents/sdd-critic.agent.md"                                       | sdd install copilot --package C:/fx/pkg-cp      | ERR-CLI-022 | "agents/sdd-critic.agent.md"                |
    | "pkg-cp" without "install/mcp.json"                                                 | sdd install copilot --package C:/fx/pkg-cp      | ERR-CLI-022 | "install/mcp.json"                          |
    | the globally installed "architect-sdd", which is not the CLI copy of a Copilot package | sdd install copilot                          | ERR-CLI-022 | "--package"                                 |
    | "pkg-cp"                                                                            | sdd install opencode --package C:/fx/pkg-cp     | ERR-CLI-003 | "install opencode"                          |
```

## C002-REQ-323

#### C002-AC-323.1 — The install command merges the server entries into `.vscode/mcp.json`
```gherkin
Scenario: C002-TS-346 — merge into an adopter's workspace MCP configuration
  Given "fx-cp-install" whose ".vscode/mcp.json" is '{ "inputs": [], "servers": { "my-db": { "type": "stdio", "command": "my-db-mcp" } } }'
  When P-03 runs "sdd install copilot --package C:/fx/pkg-cp" in "fx-cp-install"
  Then the exit code is 0
  And ".vscode/mcp.json" keeps the key "inputs" with the value [] and the "my-db" entry with its values, as the first entry of "servers"
  And "servers" then holds "context7", "deepwiki", "sdd-files", "sdd-shell" and "serena" in that order, each equal to its entry in "C:/fx/pkg-cp/install/mcp.json"
  And the file has two-space indentation, LF line ends and a final newline
  And standard output holds the line "merged .vscode/mcp.json (context7, deepwiki, sdd-files, sdd-shell, serena)"
```

```gherkin
Scenario: C002-TS-347 — no workspace MCP configuration yet
  Given "fx-cp-install" without ".vscode/"
  When P-03 runs "sdd install copilot --package C:/fx/pkg-cp" in "fx-cp-install"
  Then the exit code is 0
  And ".vscode/mcp.json" holds only the key "servers", whose entries equal the "servers" entries of "C:/fx/pkg-cp/install/mcp.json"
```

```gherkin
Scenario: C002-TS-348 — adopter copies equal to the package's are not conflicts
  Given "fx-cp-install" without an install record, whose ".vscode/mcp.json" declares a "sdd-files" entry equal to that of "C:/fx/pkg-cp/install/mcp.json"
  And whose ".github/agents/sdd-critic.agent.md" is byte-equal to "C:/fx/pkg-cp/agents/sdd-critic.agent.md"
  When P-03 runs "sdd install copilot --package C:/fx/pkg-cp" in "fx-cp-install"
  Then the exit code is 0
  And standard error holds no "ERR-CLI-021" line
  And ".github/architect-install.json" lists ".github/agents/sdd-critic.agent.md" and the server "sdd-files" with their SHA-256
```

## C002-REQ-324

#### C002-AC-324.1 — An adopter file or server in the way: nothing written, each one named
```gherkin
Scenario Outline: C002-TS-349 — conflict with an adopter file or server
  Given "fx-cp-install" without an install record, in which <state>
  When P-03 runs "sdd install copilot --package C:/fx/pkg-cp" in "fx-cp-install"
  Then the exit code is 2
  And standard error holds exactly one "ERR-CLI-021" line, which contains "<message>"
  And no file under ".github/" or ".vscode/" of "fx-cp-install" is added or changed
  And neither ".github/architect-install.json" nor "C:/fx/pkg-cp/hooks.json" exists
  Examples:
    | state                                                                                     | message                                                                              |
    | ".github/agents/sdd-critic.agent.md" holds "# my critic"                                   | install conflict: .github/agents/sdd-critic.agent.md was not written by sdd install copilot |
    | ".vscode/mcp.json" declares the server "sdd-files" with the command "my-files-mcp"         | install conflict: .vscode/mcp.json server "sdd-files" was not written by sdd install copilot |
    | ".vscode/mcp.json" holds the comment line "// my servers"                                  | install conflict: .vscode/mcp.json cannot be parsed as JSON without comments:        |
    | ".vscode/mcp.json" holds a trailing comma after its last server entry                      | install conflict: .vscode/mcp.json cannot be parsed as JSON without comments:        |
    | ".vscode/mcp.json" is the JSON array "[]"                                                  | install conflict: .vscode/mcp.json                                                   |
    | the "servers" value of ".vscode/mcp.json" is the string "none"                             | install conflict: .vscode/mcp.json                                                   |
```

```gherkin
Scenario: C002-TS-350 — files edited after an install are the adopter's
  Given "fx-cp-install" into which "sdd install copilot --package C:/fx/pkg-cp" has completed
  And P-03 has then edited ".github/agents/sdd-planner.agent.md" and changed the "args" of the "sdd-shell" entry of ".vscode/mcp.json"
  When P-03 runs "sdd install copilot --package C:/fx/pkg-cp" in "fx-cp-install" again
  Then the exit code is 2
  And standard error holds two "ERR-CLI-021" lines, one naming ".github/agents/sdd-planner.agent.md" and one naming the server "sdd-shell"
  And every file under ".github/" and ".vscode/" of "fx-cp-install" is byte-equal to its content before the run
```

## C002-REQ-325

#### C002-AC-325.1 — The bash guard denies the install command in every form
```gherkin
Scenario Outline: C002-TS-351 — install command requested by an Architect agent on Claude Code
  Given Claude Code PreToolUse input from "architect:sdd-spec-writer" in the repository "C:/repo" for the tool "<tool>" with the command "<command>"
  When the plugin's "guard-bash" hook runs
  Then the exit code is 2
  And standard error contains "GUARD-BASH-001" and "sdd install writes outside .sdd/; P-03 runs it in their own terminal"
  Examples:
    | tool       | command                                                        |
    | Bash       | sdd install copilot                                            |
    | Bash       | sdd install copilot --package C:/fx/pkg-cp                     |
    | Bash       | node C:/fx/pkg-cp/scripts/sdd.mjs install copilot              |
    | Bash       | sdd install copilot --cwd C:/repo/pkg                          |
    | Bash       | sdd install                                                    |
    | Bash       | sdd install opencode                                           |
    | Bash       | sdd install --help                                             |
    | PowerShell | sdd install copilot                                            |
```

```gherkin
Scenario: C002-TS-352 — install command through the sdd MCP server command tool
  Given the "sdd-shell" server started for the repository "fx-cp-install"
  When an Architect agent calls its tool "run_command" with the command "sdd install copilot --package C:/fx/pkg-cp"
  Then the result is an error with "GUARD-BASH-001" and the reason "sdd install writes outside .sdd/; P-03 runs it in their own terminal"
  And "fx-cp-install" has neither ".github/" nor ".vscode/" afterwards
```

```gherkin
Scenario Outline: C002-TS-353 — other sdd commands keep their decision
  Given Claude Code PreToolUse input from "architect:sdd-spec-writer" in the repository "C:/repo" for the tool "Bash" with the command "<command>"
  When the plugin's "guard-bash" hook runs
  Then the exit code is 0
  Examples:
    | command                                         |
    | sdd lint 002                                    |
    | sdd lint install                                |
    | node C:/fx/pkg-cp/scripts/sdd.mjs status        |
    | sdd trace 002 --write --cwd C:/repo/pkg         |
```

## C002-REQ-326

#### C002-AC-326.1 — Hook commands hold no plugin-root token, before and after the install
```gherkin
Scenario: C002-TS-354 — installed hook commands
  Given "pkg-cp" at "C:/fx/pkg-cp" and the repository "fx-cp-install"
  When P-03 runs "sdd install copilot --package C:/fx/pkg-cp" in "fx-cp-install"
  Then "C:/fx/pkg-cp/hooks.json" holds every hook entry of "install/hooks.template.json", each command with "@CLI_COPY@" replaced by "C:/fx/pkg-cp/scripts/sdd.mjs"
  And its SessionStart command is 'node "C:/fx/pkg-cp/scripts/sdd.mjs" hook session-start --host copilot'
  And no command of "hooks.json" or "install/hooks.template.json" contains "${PLUGIN_ROOT}", "${CLAUDE_PLUGIN_ROOT}" or a backslash
  And no command of "hooks.json" contains "@CLI_COPY@"
```

```gherkin
Scenario Outline: C002-TS-355 — plugin-root token in a generated hook command
  Given a generated "dist/copilot/install/hooks.template.json" whose SubagentStop command is 'node "<token>/scripts/sdd.mjs" hook subagent-stop --host copilot --agents sdd-planner'
  When the target structure check runs on the Copilot target package
  Then it reports an error naming "install/hooks.template.json" and "<token>"
  Examples:
    | token                 |
    | ${PLUGIN_ROOT}        |
    | ${CLAUDE_PLUGIN_ROOT} |
```

```gherkin
Scenario Outline: C002-TS-356 — package path that a hook command cannot carry
  Given a copy of "pkg-cp" at "<folder>" and the repository "fx-cp-install"
  When P-03 runs "sdd install copilot --package <folder>" in "fx-cp-install"
  Then the exit code is 2
  And standard error starts with "ERR-CLI-022" and names "<folder>"
  And "fx-cp-install" has neither ".github/" nor ".vscode/" afterwards
  And "<folder>/hooks.json" does not exist
  Examples:
    | folder          |
    | C:/fx/pkg$cp    |
    | C:/fx/100%cp    |
    | C:/fx/pkg`cp    |
```

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C002-REQ-301 | TS-301 | n/a | n/a | TS-302 | n/a | n/a | TS-301 (no `.mcp.json` or `hooks.json`; no hook command runs a PATH "sdd") |
| C002-REQ-302 | TS-303 | n/a | n/a | TS-304 | TS-303 | n/a | TS-304 (Claude hooks file copied; PreToolUse in the template or in agent frontmatter) |
| C002-REQ-303 | TS-305 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-304 | TS-306 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-305 | TS-307 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-306 | TS-308 | TS-308 (tool sets) | n/a | n/a | TS-308 | n/a | TS-309 |
| C002-REQ-307 | TS-310 | TS-310 (both modes) | n/a | TS-327 | n/a: grants per agent are C002-REQ-117 (C002-TS-129, C002-TS-130) | n/a | TS-327 (server declared in a plugin MCP configuration) |
| C002-REQ-308 | TS-311, TS-312 | TS-312 (`architect:` form of Copilot CLI), TS-313 (in VS Code), TS-336 (Copilot CLI) | n/a | TS-312 | TS-312 | n/a | TS-312 (`..`, chaining, install command) |
| C002-REQ-309 | TS-314 | TS-314 (unreadable tool classes file) | TS-314 (empty input, empty `cwd`) | TS-314 | n/a | n/a | TS-314 (unclassed tool, input not an object), TS-334 (letter case) |
| C002-REQ-310 | TS-315 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-311 | TS-316, TS-317 | TS-318 (gate) | TS-316 (empty list) | TS-316 | n/a | n/a | TS-317 (auto-approve) |
| C002-REQ-312 | TS-319 | n/a | n/a | TS-319 | n/a | n/a | n/a |
| C002-REQ-313 | TS-320, TS-321 | n/a | TS-320 (10 lines) | n/a | n/a | n/a | n/a |
| C002-REQ-314 | TS-322 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-315 | TS-323 | TS-323 (non-author agent; `architect:` form of Copilot CLI) | n/a | TS-324 | n/a | n/a | n/a |
| C002-REQ-316 | TS-325 | n/a | n/a | TS-326 | n/a | n/a | TS-325 |
| C002-REQ-317 | TS-328 | TS-329 (in VS Code) | n/a: the S-08 record does not cover prompt files; the collision rule is an assumption (requirement open item) | n/a: a wrong name is a layout error of C002-REQ-603 (example C002-TS-302) | n/a | n/a | n/a |
| C002-REQ-318 | TS-330 | TS-331 (server mode: no file) | TS-332 (a conductor-only tool needs no class) | TS-332 | TS-330 | n/a | n/a |
| C002-REQ-319 | TS-333 | TS-335 (in VS Code) | TS-333 (inside and outside `.sdd/`; host-added `tool_search_tool`) | n/a: an unclassed or faulty call is C002-REQ-309 (TS-314) | TS-333 | n/a | TS-334 (letter case) |
| C002-REQ-320 | TS-337 | TS-337 (no `agent_type`, adopter agent, unknown `sdd-` name, non-string value) | TS-337 (`architect:` prefix on a non-Architect name) | n/a: unreadable input from any caller is C002-REQ-309 (TS-314) | TS-337, TS-338 | n/a | TS-312 (an `architect:` prefix does not take an Architect call out of the guard), TS-338 (a broken classes file does not block P-03's chats) |
| C002-REQ-321 | TS-339 | n/a | n/a | TS-340 | TS-339 | n/a | TS-340 |
| C002-REQ-322 | TS-341 | TS-342 (package of the running CLI copy), TS-344 (package update) | n/a | TS-345 | n/a: P-03 runs the command in their own terminal; Architect agents are denied it (C002-REQ-325) | TS-343 (second run), TS-344 | TS-345 (package of another target, CLI outside a package) |
| C002-REQ-323 | TS-346 | TS-347 (no `.vscode/mcp.json`) | TS-348 (adopter entry equal to the package's) | n/a: an unusable file is C002-REQ-324 (TS-349) | n/a | TS-343 (second run leaves the file unchanged) | n/a: adopter entries of the same name are C002-REQ-324 (TS-349) |
| C002-REQ-324 | TS-349 | TS-350 (files edited after an install) | TS-348 (equal file or entry is no conflict) | TS-349, TS-350 | n/a | TS-350 (a failed run changes nothing) | TS-349 (adopter server named "sdd-files"; comments a rewrite would drop) |
| C002-REQ-325 | TS-351 | TS-352 (sdd MCP server command tool), TS-312 (Copilot guard hook) | TS-353 (other sdd commands, `install` as a later word) | TS-351 | TS-351 | n/a | TS-351 (script form, `--cwd` inside the root, `--help`, PowerShell) |
| C002-REQ-326 | TS-354 | n/a | n/a | TS-355 | n/a | n/a | TS-356 (package path characters a hook command cannot carry) |

Per-column n/a reasons. *Alternate*: package-content rules with one expected form. *Boundary*: no
numeric limit in the requirement except the brief's line count. *Error*: content rules whose failure
is a target structure check error (C002-REQ-603), or event rules whose absence of input is a separate
requirement (C002-REQ-314). *Authorization*: only rules about grants, hooks, permissions and the
install command carry a case; the rest is local single-user configuration. *Concurrency/idempotency*:
one P-01 session per change (C001-CON-11); hooks are stateless per call; the install command's
repeated runs are TS-343, TS-344 and TS-350. *Abuse*: the boundary rules carry the traversal,
chaining and planted-input cases; prompt injection on Copilot is C002-NFR-203.
