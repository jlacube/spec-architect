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

#### C002-AC-301.1 — Agents, prompt files, skills and MCP configuration present
```gherkin
Scenario: C002-TS-301 — Copilot package layout
  Given "npm run package" has written "dist/copilot/"
  When the target structure check reads the package
  Then it holds the ten agents as "sdd-conductor.agent.md" to "sdd-auditor.agent.md"
  And one prompt file "*.prompt.md" for each of the 13 source commands
  And one skill folder with a "SKILL.md" in the Agent Skills format for each source skill
  And an MCP configuration that declares "context7", "deepwiki" and "serena"
```

```gherkin
Scenario: C002-TS-302 — agent file missing
  Given a generated "dist/copilot/" from which "sdd-critic.agent.md" is removed
  When the target structure check runs on the Copilot target package
  Then it reports an error naming "sdd-critic.agent.md"
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

#### C002-AC-307.1 — Server declared and mapped per agent
```gherkin
@mode-server
Scenario Outline: C002-TS-310 — server declaration and grants
  When the MCP configuration and the agent "<agent>" of "dist/copilot/" are parsed
  Then the MCP configuration declares the sdd MCP server as a local command server of "architect-sdd"
  And "<agent>" is granted <grant>
  Examples:
    | agent               | grant                                               |
    | sdd-spec-writer     | the server's write tools and its command tool       |
    | sdd-researcher      | the server's write tools and not its command tool   |
    | sdd-options-analyst | the server's write tools and not its command tool   |
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
  When the package's agent-scoped path or bash guard hook command runs
  Then the exit code is 2
  And standard error names the fault
  Examples:
    | fault                                                    |
    | standard input is "not json"                             |
    | the hook input names the tool "unknownTool"              |
    | the guard core throws an exception (fault injection)     |
    | standard input is empty                                  |
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

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C002-REQ-301 | TS-301 | n/a | n/a | TS-302 | n/a | n/a | n/a |
| C002-REQ-302 | TS-303 | n/a | n/a | TS-304 | TS-303 | n/a | n/a |
| C002-REQ-303 | TS-305 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-304 | TS-306 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-305 | TS-307 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-306 | TS-308 | TS-308 (tool sets) | n/a | n/a | TS-308 | n/a | TS-309 |
| C002-REQ-307 | TS-310 | TS-310 (agents without Bash) | n/a | n/a | TS-310 | n/a | n/a |
| C002-REQ-308 | TS-311, TS-312 | TS-313 (in VS Code) | n/a | TS-312 | TS-312 | n/a | TS-312 (.. and chaining) |
| C002-REQ-309 | TS-314 | n/a | TS-314 (empty input) | TS-314 | n/a | n/a | TS-314 (unknown tool) |
| C002-REQ-310 | TS-315 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-311 | TS-316, TS-317 | TS-318 (gate) | TS-316 (empty list) | TS-316 | n/a | n/a | TS-317 (auto-approve) |
| C002-REQ-312 | TS-319 | n/a | n/a | TS-319 | n/a | n/a | n/a |
| C002-REQ-313 | TS-320, TS-321 | n/a | TS-320 (10 lines) | n/a | n/a | n/a | n/a |
| C002-REQ-314 | TS-322 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-315 | TS-323 | TS-323 (non-author agent) | n/a | TS-324 | n/a | n/a | n/a |
| C002-REQ-316 | TS-325 | n/a | n/a | TS-326 | n/a | n/a | TS-325 |

Per-column n/a reasons. *Alternate*: package-content rules with one expected form. *Boundary*: no
numeric limit in the requirement except the brief's line count. *Error*: content rules whose failure
is a target structure check error (C002-REQ-603), or event rules whose absence of input is a separate
requirement (C002-REQ-314). *Authorization*: only rules about grants, hooks and permissions carry a
case; the rest is local single-user configuration. *Concurrency/idempotency*: one P-01 session per
change (C001-CON-11); hooks are stateless per call. *Abuse*: the boundary rules carry the traversal,
chaining and planted-input cases; prompt injection on Copilot is C002-NFR-203.
