---
id: C002-CAP-02
artifact: spec/acceptance
capability: "OpenCode target"
change: CHG-002
phase: 10-spec
status: draft
---

# C002-CAP-02 — Acceptance criteria and scenarios

Verification: scenarios without a tag are structure or integration tests on the generated
`dist/opencode/`. Scenarios that need a running host use OpenCode at its tested version, driven
headless (`opencode run` or its server and SDK) on the fixture repository named in the scenario.
Tags:

- `@eval`: agent behaviour, run by the OpenCode eval runner (C002-REQ-608) or, for Claude Code, by
  the existing harness; passes at the dev tier: one passing run per Examples row, at most one rerun after a failure (DOD-G-01's 9-of-10 clause waived for CHG-002, Q-evalbudget-01).
- `@manual-vscode`: a step of the manual VS Code checklist (C002-REQ-614, C002-DEC-003), passed by
  its checklist record (C002-REQ-615); used where the behaviour is checkable only in VS Code.
- `@mode-native` / `@mode-server`: the scenario applies only when the OpenCode target package is
  generated for native permission enforcement or for sdd MCP server enforcement (spike S-07 fixes the
  mode); the other mode's scenarios are recorded as not applicable in the test report.

Fixture paths: `fx-oc` is a repository with `.sdd/` (change `002-x` in phase `10-spec`), `src/app.ts`,
`README.md`, and a symbolic link `.sdd/link-to-src` to `src/`.

## C002-REQ-201

#### C002-AC-201.1 — The package holds agents, commands, skills and MCP servers
```gherkin
Scenario: C002-TS-201 — OpenCode package layout
  Given "npm run package" has written "dist/opencode/"
  When the target structure check reads the package
  Then ".opencode/agents/" holds the ten agents "sdd-conductor" to "sdd-auditor"
  And ".opencode/commands/" holds one file for each of the 13 source commands
  And ".opencode/skills/" holds one folder with a "SKILL.md" for each source skill
  And "opencode.json" declares the MCP servers "context7", "deepwiki" and "serena"
```

```gherkin
Scenario: C002-TS-202 — server missing from opencode.json
  Given a generated "dist/opencode/opencode.json" from which "deepwiki" is removed
  When the target structure check runs on the OpenCode target package
  Then it reports an error naming "opencode.json" and "deepwiki"
```

## C002-REQ-202

#### C002-AC-202.1 — Conductor primary, specialists subagents
```gherkin
Scenario: C002-TS-203 — agent modes
  When the agent files of "dist/opencode/.opencode/agents/" are parsed
  Then "sdd-conductor" has mode "primary"
  And each of the nine specialists has mode "subagent"
```

## C002-REQ-203

#### C002-AC-203.1 — Every command is bound to the conductor
```gherkin
Scenario: C002-TS-204 — command agent field
  When the 13 command files of "dist/opencode/.opencode/commands/" are parsed
  Then each has the field "agent" with the value "sdd-conductor"
  And none contains the line "claude --agent architect:sdd-conductor"
```

## C002-REQ-204

#### C002-AC-204.1 — Install notes name prerequisites, install, placement and start
```gherkin
Scenario: C002-TS-205 — OpenCode install notes
  When the install notes of "dist/opencode/" are read
  Then they state Node.js 20 or later, the OpenCode tested version of the doctor remedies table, and access to the Claude models of the three tiers
  And they give the npm command that installs "architect-sdd"
  And they state where to place ".opencode/" and "opencode.json"
  And they state how to start the conductor
```

## C002-REQ-205

#### C002-AC-205.1 — README section links the notes and names the enforcement mode
```gherkin
Scenario: C002-TS-206 — README OpenCode section
  Given the OpenCode target package is generated for the enforcement mode that spike S-07 fixed
  When the README is read
  Then it has an "OpenCode" section whose link resolves to the install notes of the OpenCode target package
  And that section names that enforcement mode by its glossary name
```

## C002-REQ-206

#### C002-AC-206.1 — OpenCode allows edits inside `.sdd/` only
```gherkin
@mode-native
Scenario Outline: C002-TS-207 — edit decisions of the OpenCode permission engine
  Given an OpenCode session at the tested version on "fx-oc" with the OpenCode target package
  When the agent "<agent>" calls the edit tool on "<path>"
  Then OpenCode <decision> the call
  Examples:
    | agent            | path                                                          | decision |
    | sdd-spec-writer  | .sdd/002-x/10-spec/a.md                                       | allows   |
    | sdd-spec-writer  | src/app.ts                                                    | denies   |
    | sdd-conductor    | README.md                                                     | denies   |
    | sdd-planner      | .sdd/../src/app.ts                                            | denies   |
    | sdd-architect    | .sdd/link-to-src/app.ts                                       | denies   |
    | sdd-cartographer | .claude/agent-memory/architect-sdd-cartographer/MEMORY.md     | denies   |
```

```gherkin
@mode-native
Scenario: C002-TS-208 — edit rules in opencode.json
  When "dist/opencode/opencode.json" is parsed
  Then each of the ten Architect agents has "edit" rules that allow paths inside ".sdd/"
  And deny every other path
```

## C002-REQ-207

#### C002-AC-207.1 — OpenCode allows allowlisted commands only
```gherkin
@mode-native
Scenario Outline: C002-TS-209 — bash decisions of the OpenCode permission engine
  Given an OpenCode session at the tested version on "fx-oc" with the OpenCode target package
  When the agent "sdd-planner" calls the bash tool with "<command>"
  Then OpenCode <decision> the call
  Examples:
    | command                                          | decision |
    | sdd lint 002                                     | allows   |
    | git log --oneline -5                             | allows   |
    | node --version                                   | allows   |
    | ripwire . --max-tokens=4000                      | allows   |
    | npm install                                      | denies   |
    | git status && rm -rf src                         | denies   |
    | sdd status > out.txt                             | denies   |
    | Remove-Item -Recurse src                         | denies   |
    | ripwire . --token-budget=4000                    | denies   |
```

The ripwire rows follow the ripwire rules of C002-IF-001 §6.3 (defect D-024, the follow-up of CHG-001
defect D-012): the bounded default map under `--max-tokens=N` matches the rule
`ripwire *--max-tokens=*`, and a map under `--token-budget=N` only matches no `allow` rule and falls
to the catch-all deny, as the bash guard denies it (BG-442). The gap rows of that section, such as
a map command with a span-edit option that the glob allows and the bash guard denies (BG-448), are
no expectation of C002-REQ-207: they are known false allows of the native rules, recorded by a
characterization check of the test plan and reported by the corpus replay of the
`opencode-permissions` mechanism as differing decisions (C002-IF-001 §6.3, What a glob cannot
express; C002-IF-009 §2; critic CR-88). The scenario runs only for a package generated with
`--mode opencode=native-permissions`; in the `sdd-mcp-server` mode the bash guard core decides these
commands (C002-REQ-209).

## C002-REQ-208

#### C002-AC-208.1 — No permission rule for agents outside the ten
```gherkin
Scenario: C002-TS-210 — scope of the permission rules
  When "dist/opencode/opencode.json" is parsed
  Then it has no top-level "permission" key
  And it has "agent" entries only for the ten Architect agents
```

```gherkin
Scenario: C002-TS-211 — the adopter's own agent keeps its edit right
  Given an OpenCode session at the tested version on "fx-oc" with the OpenCode target package installed
  And the adopter's own agent "my-build" with "edit" set to "allow"
  When "my-build" calls the edit tool on "src/app.ts"
  Then OpenCode allows the call
  And "src/app.ts" holds the new content
```

## C002-REQ-209

#### C002-AC-209.1 — Under server enforcement no agent has edit or bash
```gherkin
@mode-server
Scenario: C002-TS-212 — edit and bash denied in opencode.json
  When "dist/opencode/opencode.json" is parsed
  Then each of the ten Architect agents has "edit" set to "deny"
  And each has "bash" set to "deny"
```

```gherkin
@mode-server
Scenario: C002-TS-213 — built-in edit refused even inside .sdd/
  Given an OpenCode session at the tested version on "fx-oc" with the OpenCode target package
  When the agent "sdd-spec-writer" calls the built-in edit tool on ".sdd/002-x/10-spec/a.md"
  Then OpenCode denies the call
  And ".sdd/002-x/10-spec/a.md" is unchanged
```

## C002-REQ-210

#### C002-AC-210.1 — Two local servers declared, one per server profile
```gherkin
@mode-server
Scenario: C002-TS-214 — server profiles declared in opencode.json
  When "dist/opencode/opencode.json" is parsed
  Then its "mcp" key declares the local server "sdd-files" with the command "sdd-mcp", "--profile", "files"
  And it declares the local server "sdd-shell" with the command "sdd-mcp", "--profile", "shell"
  And no other "mcp" entry runs "sdd-mcp"
```

```gherkin
@mode-server
Scenario: C002-TS-224 — server profile missing from opencode.json
  Given a generated "dist/opencode/opencode.json" from which the "sdd-shell" entry is removed
  When the target structure check runs on the OpenCode target package
  Then it reports an error naming "opencode.json" and "sdd-shell"
```

## C002-REQ-211

#### C002-AC-211.1 — Rounds of at most four questions on each host's tool
```gherkin
@eval
Scenario Outline: C002-TS-215 — round size on Claude Code and OpenCode
  Given the conductor on <host> needs answers to <n> questions of one interview topic in "fx-bootstrap"
  When the conductor asks P-01 for them
  Then the transcript shows <calls> call(s) of "<tool>"
  And no call carries more than 4 questions
  Examples:
    | host        | n | calls       | tool            |
    | Claude Code | 4 | 1           | AskUserQuestion |
    | OpenCode    | 4 | 1           | question        |
    | OpenCode    | 5 | at least 2  | question        |
```

```gherkin
@manual-vscode
Scenario: C002-TS-216 — round size in VS Code
  Given the conductor in VS Code needs answers to 5 questions of one interview topic
  When the conductor asks P-01 for them
  Then each question dialog comes from an "ask_user" call of the conductor
  And no "ask_user" call shows more than 4 questions
```

## C002-REQ-212

#### C002-AC-212.1 — Gate summary, commitment statement and the four choices
```gherkin
@eval
Scenario Outline: C002-TS-217 — gate question on Claude Code and OpenCode
  Given change "002" of "fx-gate" has phase "10-spec" in review on <host>
  When the conductor presents gate G2
  Then the reply shows the "sdd gate show" summary and a statement starting "Approving means"
  And one "<tool>" call offers exactly "Approve", "Approve with waivers", "Revise" and "Stop"
  Examples:
    | host        | tool            |
    | Claude Code | AskUserQuestion |
    | OpenCode    | question        |
```

```gherkin
@manual-vscode
Scenario: C002-TS-218 — gate question in VS Code
  Given a toy change with phase "00-ideation" in review in VS Code
  When the conductor presents gate G1
  Then the chat shows the gate summary and the statement of what approval commits to
  And one "ask_user" dialog offers exactly "Approve", "Approve with waivers", "Revise" and "Stop"
```

## C002-REQ-213

#### C002-AC-213.1 — Profile confirmed through the host's tool before the change exists
```gherkin
@eval
Scenario Outline: C002-TS-219 — profile round on Claude Code and OpenCode
  Given "fx-bootstrap" with 1 change on <host>
  When P-01 runs the new-change command with the title "Export to CSV"
  Then one "<tool>" call offers a profile first, labelled "(Recommended)", with the expected user stories, requirements and touched modules compared with the constitution's thresholds
  And no folder ".sdd/002-*" exists before the answer
  Examples:
    | host        | tool            |
    | Claude Code | AskUserQuestion |
    | OpenCode    | question        |
```

```gherkin
@manual-vscode
Scenario: C002-TS-220 — profile round in VS Code
  Given a fresh repository with an initialised ".sdd/" in VS Code
  When P-01 runs the new-change prompt with the title "Toy change"
  Then an "ask_user" dialog proposes "lite" or "full" with its size estimate
  And no change folder exists until P-01 answers
```

## C002-REQ-214

#### C002-AC-214.1 — Header length and option descriptions on OpenCode
```gherkin
@eval
Scenario: C002-TS-221 — long topic on the question tool
  Given the conductor on OpenCode must ask about "Inlining budget for the generated conductor agent" (50 characters)
  When the conductor asks the question
  Then the "question" call's header has at most 30 characters
  And every option of the call has a non-empty description
```

## C002-REQ-215

#### C002-AC-215.1 — Findings returned after an `.sdd/` write on OpenCode
```gherkin
@mode-native
Scenario: C002-TS-222 — requirement with two SHALL
  Given the OpenCode target package has a post-write feedback channel (spike S-07)
  And an OpenCode session at the tested version on "fx-oc"
  When "sdd-spec-writer" writes ".sdd/002-x/10-spec/20-capabilities/CAP-01-x/requirements.md" with a statement holding two SHALL
  Then the result returned to "sdd-spec-writer" contains "LINT-EARS-002" and that file's path
```

```gherkin
@mode-native
Scenario: C002-TS-223 — clean file gives no finding
  Given the OpenCode target package has a post-write feedback channel (spike S-07)
  And an OpenCode session at the tested version on "fx-oc"
  When "sdd-spec-writer" writes a requirements file without lint findings under ".sdd/002-x/"
  Then the result returned to "sdd-spec-writer" contains no finding line
```

## C002-REQ-216

#### C002-AC-216.1 — Commands named `architect-<name>`
```gherkin
Scenario: C002-TS-225 — command file names
  When the file names of "dist/opencode/.opencode/commands/" are read
  Then they are exactly "architect-<name>.md" for each of the 13 source commands "commands/<name>.md"
  And they include "architect-new.md" and "architect-init.md"
  And there is no file "new.md" or "init.md"
```

```gherkin
Scenario: C002-TS-226 — built-in commands kept beside the Architect commands
  Given an OpenCode session at the tested version on "fx-oc" with the OpenCode target package
  When the session's command list is read through the OpenCode server API
  Then it lists the 13 commands "architect-<name>", each bound to the agent "sdd-conductor"
  And it lists the built-in commands of OpenCode 1.18.31, "init", "review" and "customize-opencode", each with OpenCode's own description and bound to no Architect agent
  And it lists "architect-init" beside the built-in "init"
```

OpenCode 1.18.31 has no built-in command `new` (defect D-011 item 1); of its built-ins only `init`
shares a name with a source command, and the prefix keeps the two apart.

```gherkin
Scenario: C002-TS-227 — command file without the prefix
  Given a generated "dist/opencode/" in which ".opencode/commands/architect-new.md" is renamed "new.md"
  When the target structure check runs on the OpenCode target package
  Then it reports an error naming "new.md"
```

## C002-REQ-217

#### C002-AC-217.1 — The conductor holds `question: allow`, every specialist `question: deny`
```gherkin
Scenario Outline: C002-TS-228 — question rule per agent in both enforcement modes
  Given "npm run package" has written "dist/opencode/" with "--mode opencode=<mode>"
  When "dist/opencode/opencode.json" is parsed
  Then the "permission" of the agent "sdd-conductor" holds "question" set to "allow"
  And the "permission" of each of the nine specialists holds "question" set to "deny"
  And the target structure check reports no TGT-PERM-001 finding
  Examples:
    | mode               |
    | native-permissions |
    | sdd-mcp-server     |
```

```gherkin
Scenario Outline: C002-TS-229 — question rule missing from the conductor or given to a specialist
  Given a generated "dist/opencode/opencode.json" in which <change>
  When the target structure check runs on the OpenCode target package
  Then it reports the error TGT-PERM-001 naming "<agent>" and <named>
  Examples:
    | change                                                                 | agent         | named                      |
    | the "question" rule of "sdd-conductor" is set to "deny"                | sdd-conductor | the value "deny"           |
    | the "question" key is removed from the "permission" of "sdd-conductor" | sdd-conductor | the missing key "question" |
    | the "question" rule of "sdd-critic" is set to "allow"                  | sdd-critic    | the value "allow"          |
    | the "question" key is removed from the "permission" of "sdd-planner"   | sdd-planner   | the missing key "question" |
```

```gherkin
@eval
Scenario: C002-TS-230 — conductor's question call reaches the SDK in a server session
  Given the OpenCode eval runner with the OpenCode server ("opencode serve") of the pinned host binary of the tested version and the OpenCode target package in a copy of "fx-bootstrap" with 1 change
  When P-01 runs the command "architect-new" with the title "Export to CSV"
  Then the session's events hold a "question" call of "sdd-conductor" that the runner answers through the SDK's reply route
  And no tool part of the session has the status "error" with a text starting "Model tried to call unavailable tool"
  And the run does not end with "question unanswerable"
```

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C002-REQ-201 | TS-201 | n/a | n/a | TS-202 | n/a | n/a | n/a |
| C002-REQ-202 | TS-203 | n/a | n/a | n/a | TS-203 | n/a | n/a |
| C002-REQ-203 | TS-204 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-204 | TS-205 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-205 | TS-206 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-206 | TS-207, TS-208 | n/a | TS-207 (memory folder) | TS-207 | TS-207 | n/a | TS-207 (.. and link) |
| C002-REQ-207 | TS-209 | TS-209 (PowerShell; ripwire bounded default map under `--max-tokens`) | n/a | TS-209 | TS-209 | n/a | TS-209 (chain, redirect; ripwire map under `--token-budget` only, denied) |
| C002-REQ-208 | TS-210 | TS-211 | n/a | n/a | TS-211 | n/a | n/a |
| C002-REQ-209 | TS-212 | n/a | TS-213 (inside .sdd/) | TS-213 | TS-212 | n/a | TS-213 |
| C002-REQ-210 | TS-214 | n/a | n/a | TS-224 | n/a: grants per agent are C002-REQ-117 (C002-TS-129, C002-TS-130) | n/a | n/a |
| C002-REQ-211 | TS-215, TS-216 | TS-215 (Claude Code) | TS-215 (4 and 5 questions) | n/a | n/a | n/a | n/a |
| C002-REQ-212 | TS-217, TS-218 | TS-217 (Claude Code) | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-213 | TS-219, TS-220 | TS-219 (Claude Code) | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-214 | TS-221 | n/a | TS-221 (50-character topic) | n/a | n/a | n/a | n/a |
| C002-REQ-215 | TS-222 | TS-223 (no finding) | n/a | n/a: C002-REQ-215 states no failure path; the server counterpart is C002-REQ-409 | n/a | n/a | n/a |
| C002-REQ-216 | TS-225 | TS-226 (in an OpenCode session) | n/a | TS-227 | n/a | n/a | TS-226 (collision with the built-in "init") |
| C002-REQ-217 | TS-228 | TS-228 (both enforcement modes), TS-230 (in an `opencode serve` session, whose default is `question: deny`) | n/a | TS-229 | TS-228, TS-229 (only the conductor may ask) | n/a | TS-229 (a specialist given `question: allow`) |

Per-column n/a reasons. *Alternate*: package-content rules with one expected form. *Boundary*: no
numeric limit in the requirement. *Error*: content rules whose failure is a target structure check
error (C002-REQ-603, C002-TS-202 as the example) or agent behaviour with no error path; a skipped or
dismissed answer is C002-REQ-311. *Authorization*: only rules about grants or permissions carry a
case; the rest is local single-user configuration. *Concurrency/idempotency*: one P-01 session per
change (C001-CON-11); generation determinism is C002-NFR-301. *Abuse*: the boundary rules carry the
traversal, link, chaining and redirection cases; prompt injection on OpenCode is C002-NFR-203.
