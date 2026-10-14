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
tests on the generated `dist/copilot/` or integration tests that feed Copilot-format hook input
(the field names and `tool_name` values captured by spike S-08) to the package's hook commands on
stdin and check the exit code, standard output and standard error. Tags:

- `@eval`: agent behaviour run by the Copilot CLI eval runner (C002-REQ-612) or the OpenCode eval
  runner (C002-REQ-608); passes in 9 of 10 runs (DOD-G-01).
- `@manual-vscode`: a step of the manual VS Code checklist (C002-REQ-614), passed by its checklist
  record (C002-REQ-615) on the tested VS Code and GitHub Copilot Chat versions. These are the
  behaviours that can be checked only in VS Code.
- `@mode-server` / `@mode-hooks`: the scenario applies only when the Copilot target package is
  generated for sdd MCP server enforcement or for the Copilot hooks fallback (spike S-08 fixes the
  mode); the other mode's scenarios are recorded as not applicable in the test report.

Fixture: `fx-cp` is a repository with `.sdd/` (two active changes), `src/app.ts` and `README.md`.

## C002-REQ-301

#### C002-AC-301.1 — Agents, prompt files, skills, MCP configuration and the CLI copy present
```gherkin
Scenario: C002-TS-301 — Copilot package layout
  Given "npm run package" has written "dist/copilot/"
  When the target structure check reads the package
  Then it holds the ten agents as "sdd-conductor.agent.md" to "sdd-auditor.agent.md"
  And one prompt file "*.prompt.md" for each of the 13 source commands
  And one skill folder with a "SKILL.md" in the Agent Skills format for each source skill
  And an MCP configuration that declares "context7", "deepwiki" and "serena"
  And "scripts/sdd.mjs" with the same SHA-256 as "plugins/architect/scripts/sdd.mjs" of the same packaging run
  And every hook command of the package runs "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" and none runs a bare "sdd"
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
```

## C002-REQ-302

#### C002-AC-302.1 — PreToolUse hooks only in agent frontmatter
```gherkin
Scenario: C002-TS-303 — hook declarations of the package
  When every file of "dist/copilot/" is parsed
  Then no hook configuration file declares a "PreToolUse" hook
  And "PreToolUse" occurs only in the frontmatter of "*.agent.md" files
```

```gherkin
Scenario: C002-TS-304 — Claude hooks file copied into the package
  Given a generated "dist/copilot/" into which the source "hooks/hooks.json" is copied unchanged
  When the target structure check runs on the Copilot target package
  Then it reports an error naming the copied hooks file and "PreToolUse"
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

#### C002-AC-304.1 — Install notes name prerequisites, install, settings and start
```gherkin
Scenario: C002-TS-306 — Copilot install notes
  When the install notes of "dist/copilot/" are read
  Then they state Node.js 20 or later, the VS Code and GitHub Copilot Chat tested versions of the doctor remedies table, and access to the Claude models of the three tiers
  And they give the npm command that installs "architect-sdd"
  And they name the settings "chat.plugins.enabled", "chat.pluginLocations" and "chat.askQuestions.enabled" with their values
  And they state how to start the conductor
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
  Then none grants a VS Code built-in edit tool or the terminal tool, by name or through a tool set that contains one
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

#### C002-AC-307.1 — Two local servers declared, one per server profile
```gherkin
@mode-server
Scenario: C002-TS-310 — server profiles declared in the MCP configuration
  When "dist/copilot/.mcp.json" is parsed
  Then "mcpServers" declares the local server "sdd-files" with the command "sdd-mcp" and the arguments "--profile", "files"
  And it declares the local server "sdd-shell" with the command "sdd-mcp" and the arguments "--profile", "shell"
  And no other entry runs "sdd-mcp"
```

```gherkin
@mode-server
Scenario: C002-TS-327 — server profile missing from the MCP configuration
  Given a generated "dist/copilot/.mcp.json" from which the "sdd-files" entry is removed
  When the target structure check runs on the Copilot target package
  Then it reports an error naming ".mcp.json" and "sdd-files"
```

## C002-REQ-308

#### C002-AC-308.1 — Every agent carries path and bash guard hooks
```gherkin
@mode-hooks
Scenario: C002-TS-311 — agent-scoped hooks in the frontmatter
  When the frontmatter of the ten "*.agent.md" files is parsed
  Then each declares a PreToolUse hook running the path guard core for each VS Code tool that can write a file
  And each declares a PreToolUse hook running the bash guard core for the terminal tool
```

```gherkin
@mode-hooks
Scenario Outline: C002-TS-312 — hook decisions on Copilot hook input
  Given Copilot PreToolUse hook input for the tool "<tool>" with "<target>" in repository "fx-cp"
  When the package's agent-scoped hook command for that tool runs
  Then the exit code is <code>
  Examples:
    | tool     | target                       | code |
    | edit     | .sdd/002-x/10-spec/a.md      | 0    |
    | edit     | src/app.ts                   | 2    |
    | edit     | .sdd/../src/app.ts           | 2    |
    | terminal | sdd lint 002                 | 0    |
    | terminal | npm install                  | 2    |
    | terminal | git status && rm -rf src     | 2    |
```

```gherkin
@manual-vscode @mode-hooks
Scenario: C002-TS-313 — subagent write outside .sdd/ blocked in VS Code
  Given hooks are enabled in VS Code and the conductor has dispatched "sdd-spec-writer" on "fx-cp"
  When "sdd-spec-writer" attempts to write "src/app.ts"
  Then "src/app.ts" is unchanged
  And the chat shows that tool call as blocked by a hook
```

## C002-REQ-309

#### C002-AC-309.1 — A guard hook that cannot decide denies with exit code 2
```gherkin
@mode-hooks
Scenario Outline: C002-TS-314 — faults of the agent-scoped guard hook
  Given the fault "<fault>"
  When the package's agent-scoped guard hook command of "sdd-spec-writer" runs
  Then the exit code is 2
  And standard error contains "GUARD-HOOK-001" and names the fault
  Examples:
    | fault                                                                          |
    | standard input is "not json"                                                   |
    | the hook input names the tool "unknownTool", which the tool classes file does not class |
    | the tool classes file named by "--classes" does not exist                      |
    | the tool classes file holds "{ not json"                                       |
    | the guard core throws an exception (fault injection)                           |
    | standard input is empty                                                        |
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

#### C002-AC-311.1 — A result without a choice records nothing
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
  Given auto-approve is enabled in VS Code so that "vscode/askQuestions" returns {"skipped": true}
  When the conductor asks an interview round for the toy change
  Then the questions log of the toy change has no answer for that round
  And the conductor states that no answer was received
```

```gherkin
@manual-vscode
Scenario: C002-TS-318 — skipped gate question in VS Code
  Given auto-approve is enabled in VS Code and the toy change has phase "00-ideation" in review
  When "vscode/askQuestions" returns {"skipped": true} for the gate question
  Then the phase stays "in-review" in "change.md"
  And "approvals.json" of the toy change is unchanged
```

## C002-REQ-312

#### C002-AC-312.1 — No question tool: no question, instruction to enable it
```gherkin
@manual-vscode
Scenario: C002-TS-319 — askQuestions disabled
  Given "chat.askQuestions.enabled" is false in VS Code
  When P-01 runs the new-change prompt with the title "Toy change"
  Then the conductor's reply tells P-01 to enable "chat.askQuestions.enabled"
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

#### C002-AC-315.1 — Trace refreshed after an author agent, exit code 0
```gherkin
Scenario Outline: C002-TS-323 — SubagentStop by agent
  Given Copilot SubagentStop hook input with "agent_type" for "<agent>" and "cwd" set to "fx-cp"
  When the package's SubagentStop hook command runs
  Then the exit code is 0
  And "trace.json" of each active change is <trace>
  Examples:
    | agent             | trace                 |
    | sdd-spec-writer   | rewritten             |
    | sdd-test-designer | rewritten             |
    | sdd-architect     | rewritten             |
    | sdd-planner       | rewritten             |
    | sdd-researcher    | unchanged             |
```

```gherkin
Scenario: C002-TS-324 — trace refresh fails
  Given Copilot SubagentStop hook input for "sdd-planner" and a "registry.json" of "fx-cp" that does not parse
  When the package's SubagentStop hook command runs
  Then the exit code is 0
```

## C002-REQ-316

#### C002-AC-316.1 — Hook commands call the sdd CLI with arguments only
```gherkin
Scenario: C002-TS-325 — hook command form
  When every hook command of "dist/copilot/" is read
  Then each invokes the sdd CLI followed by arguments only
  And none contains "&&", "||", ";", "|", ">", "<", "$(" or a backtick
```

```gherkin
Scenario: C002-TS-326 — shell operator in a hook command
  Given a generated "dist/copilot/" whose session-start hook command ends with "&& echo done"
  When the target structure check runs on the Copilot target package
  Then it reports an error naming that hook command and "&&"
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

#### C002-AC-318.1 — Every granted tool has a class under the hooks fallback
```gherkin
@mode-hooks
Scenario: C002-TS-330 — tool classes file of the package
  When "dist/copilot/hooks/tool-classes.json" and the "tools" fields of the ten agents and the 13 prompt files are parsed
  Then every tool name granted by any of them is assigned exactly one of the classes "write", "terminal" and "read_only"
  And the tools the table maps Read, Glob and Grep to are in the class "read_only"
  And the terminal tool is in the class "terminal"
```

```gherkin
@mode-server
Scenario: C002-TS-331 — no tool classes file under sdd MCP server enforcement
  When the file names of "dist/copilot/hooks/" are read
  Then there is no "tool-classes.json"
```

```gherkin
@mode-hooks
Scenario: C002-TS-332 — granted tool missing from the tool classes file
  Given a generated "dist/copilot/hooks/tool-classes.json" from which the tool the table maps Grep to is removed, while "sdd-critic.agent.md" grants that tool
  When the target structure check runs on the Copilot target package
  Then it reports an error naming "tool-classes.json", that tool name and "sdd-critic"
```

## C002-REQ-319

#### C002-AC-319.1 — Read-only tool calls are allowed with exit code 0
```gherkin
@mode-hooks
Scenario Outline: C002-TS-333 — read-only calls through the guard hook
  Given Copilot PreToolUse hook input for the tool "<tool>" of class "read_only" with "<target>" in repository "fx-cp"
  When the package's agent-scoped guard hook command of "sdd-spec-writer" runs
  Then the exit code is 0
  And standard error is empty
  Examples:
    | tool                                        | target            |
    | the tool the table maps Read to             | src/app.ts        |
    | the tool the table maps Read to             | .sdd/002-x/a.md   |
    | the tool the table maps Grep to             | the query "TODO"  |
```

```gherkin
@mode-hooks
Scenario: C002-TS-334 — read tool name in another letter case
  Given Copilot PreToolUse hook input whose "tool_name" is the tool the table maps Read to, written in upper case
  When the package's agent-scoped guard hook command of "sdd-spec-writer" runs
  Then the exit code is 2
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

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C002-REQ-301 | TS-301 | n/a | n/a | TS-302 | n/a | n/a | TS-301 (no hook command runs a PATH "sdd") |
| C002-REQ-302 | TS-303 | n/a | n/a | TS-304 | TS-303 | n/a | n/a |
| C002-REQ-303 | TS-305 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-304 | TS-306 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-305 | TS-307 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-306 | TS-308 | TS-308 (tool sets) | n/a | n/a | TS-308 | n/a | TS-309 |
| C002-REQ-307 | TS-310 | n/a | n/a | TS-327 | n/a: grants per agent are C002-REQ-117 (C002-TS-129, C002-TS-130) | n/a | n/a |
| C002-REQ-308 | TS-311, TS-312 | TS-313 (in VS Code) | n/a | TS-312 | TS-312 | n/a | TS-312 (.. and chaining) |
| C002-REQ-309 | TS-314 | TS-314 (unreadable tool classes file) | TS-314 (empty input) | TS-314 | n/a | n/a | TS-314 (unclassed tool), TS-334 (letter case) |
| C002-REQ-310 | TS-315 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-311 | TS-316, TS-317 | TS-318 (gate) | TS-316 (empty list) | TS-316 | n/a | n/a | TS-317 (auto-approve) |
| C002-REQ-312 | TS-319 | n/a | n/a | TS-319 | n/a | n/a | n/a |
| C002-REQ-313 | TS-320, TS-321 | n/a | TS-320 (10 lines) | n/a | n/a | n/a | n/a |
| C002-REQ-314 | TS-322 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-315 | TS-323 | TS-323 (non-author agent) | n/a | TS-324 | n/a | n/a | n/a |
| C002-REQ-316 | TS-325 | n/a | n/a | TS-326 | n/a | n/a | TS-325 |
| C002-REQ-317 | TS-328 | TS-329 (in VS Code) | n/a: the collision rule is an assumption until spike S-08 (requirement open item) | n/a: a wrong name is a layout error of C002-REQ-603 (example C002-TS-302) | n/a | n/a | n/a |
| C002-REQ-318 | TS-330 | TS-331 (server mode: no file) | n/a | TS-332 | TS-330 | n/a | n/a |
| C002-REQ-319 | TS-333 | TS-335 (in VS Code) | TS-333 (read inside and outside .sdd/) | n/a: an unclassed or faulty call is C002-REQ-309 (TS-314) | TS-333 | n/a | TS-334 (letter case) |

Per-column n/a reasons. *Alternate*: package-content rules with one expected form. *Boundary*: no
numeric limit in the requirement except the brief's line count. *Error*: content rules whose failure
is a target structure check error (C002-REQ-603), or event rules whose absence of input is a separate
requirement (C002-REQ-314). *Authorization*: only rules about grants, hooks and permissions carry a
case; the rest is local single-user configuration. *Concurrency/idempotency*: one P-01 session per
change (C001-CON-11); hooks are stateless per call. *Abuse*: the boundary rules carry the traversal,
chaining and planted-input cases; prompt injection on Copilot is C002-NFR-203.
