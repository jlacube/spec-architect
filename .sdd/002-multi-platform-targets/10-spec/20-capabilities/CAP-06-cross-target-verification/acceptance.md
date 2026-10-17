---
id: C002-CAP-06
artifact: spec/acceptance
capability: "Cross-target verification"
change: CHG-002
phase: 10-spec
status: draft
---

# C002-CAP-06 — Acceptance criteria and scenarios

Verification: scenarios without a tag are integration tests of `npm run check`, the target structure
check, the corpus replay suite, the eval runners (with a stub host where named) and the release check,
run on the repository or on the fixtures named in the scenario. The release check reads a release
fixture `fx-release` that holds, per target, a corpus replay report, an injection eval report, the
spike record, the tested version and, for Copilot VS Code, checklist records. Tags:

- `@eval`: runs real host sessions at the dev tier (C002-REQ-609, C002-REQ-612); passes at the dev tier: one passing run per Examples row, at most one rerun after a failure (DOD-G-01's 9-of-10 clause waived for CHG-002, Q-evalbudget-01).
- `@review`: checked by reading the manual VS Code checklist or a record, against the listed items;
  the result is part of the test report.
- `@mode-native` / `@mode-hooks`: applies only when the target package is generated for OpenCode
  native permission enforcement or for the Copilot hooks fallback.

## C002-REQ-601

#### C002-AC-601.1 — npm run check includes the target structure checks
```gherkin
Scenario: C002-TS-601 — clean checkout
  Given a clean checkout of the repository
  When P-01 runs "npm run check"
  Then the output shows the results of "claude plugin validate", the unit tests, the lint fixture suite, the plugin structure checks and the target structure checks for "opencode" and "copilot"
  And the exit code is 0
```

```gherkin
Scenario: C002-TS-602 — a target check fails
  Given "skills/gate-protocol/SKILL.md" gains a "Claude Code wiring" section that names AskUserQuestion in a sentence the Copilot variant does not replace
  When P-01 runs "npm run check"
  Then the exit code is non-zero
  And the output names the target "copilot" and the failing file
```

```gherkin
Scenario: C002-TS-603 — packages of an earlier run are not the ones checked
  Given "dist/opencode/.opencode/agents/sdd-auditor.md" holds "${CLAUDE_PLUGIN_ROOT}" from an earlier generation
  And the current source plugin generates a package without it
  When P-01 runs "npm run check"
  Then the target structure checks report no finding for "sdd-auditor.md"
```

## C002-REQ-602

#### C002-AC-602.1 — Untranslated constructs reported outside accepted fields
```gherkin
Scenario Outline: C002-TS-604 — construct placement in a target package
  Given a generated package file "<file>" holding "<construct>" on line <line> in <place>
  When the target structure check runs on that package
  Then it reports <result>
  Examples:
    | file                                         | construct              | line | place                        | result                                                   |
    | .opencode/agents/sdd-auditor.md              | ${CLAUDE_PLUGIN_ROOT}  | 13   | the agent body               | an error naming the file, line 13 and the construct      |
    | sdd-critic.agent.md                          | AskUserQuestion        | 9    | the agent body               | an error naming the file, line 9 and the construct       |
    | sdd-planner.agent.md                         | architect:sdd-critic   | 21   | the agent body               | an error naming the file, line 21 and the construct      |
    | install/mcp.json                             | ${CLAUDE_PLUGIN_ROOT}  | 4    | a server command field       | an error naming the file, line 4 and the construct       |
    | install/hooks.template.json                  | ${CLAUDE_PLUGIN_ROOT}  | 3    | a hook command               | an error naming the file, line 3 and the construct       |
    | install/hooks.template.json                  | ${PLUGIN_ROOT}         | 3    | a hook command               | an error naming the file, line 3 and the construct       |
    | .opencode/commands/architect-new.md          | $ARGUMENTS             | 9    | the command body             | no error                                                 |
```

## C002-REQ-603

#### C002-AC-603.1 — Differences from the target package contract are errors
```gherkin
Scenario Outline: C002-TS-605 — contract differences
  Given a generated <target> package with <difference>
  When the target structure check runs on that package
  Then it reports <result>
  Examples:
    | target   | difference                                                    | result                                                  |
    | OpenCode | no difference from its target package contract                | no error                                                |
    | OpenCode | the agent file "sdd-critic.md" missing                        | an error naming "sdd-critic.md"                         |
    | Copilot  | the tool "web/fetch" added to "sdd-auditor.agent.md"          | an error naming "sdd-auditor.agent.md" and "web/fetch"  |
    | Copilot  | the server "serena" missing from "servers" of "install/mcp.json" | an error naming "install/mcp.json" and "serena"       |
    | Copilot  | a file ".mcp.json" at the package root that declares "sdd-files" | an error naming ".mcp.json" and "sdd-files"           |
```

## C002-REQ-604

#### C002-AC-604.1 — Edit or terminal grant on Copilot is an error
```gherkin
Scenario Outline: C002-TS-606 — generic tool granted, or no tools list, under server enforcement
  Given a Copilot target package generated for sdd MCP server enforcement in which "<file>" <grant>
  When the target structure check runs on that package
  Then it reports the error TGT-GRANT-001 naming "<file>" and <named>
  Examples:
    | file                     | grant                                                  | named                       |
    | sdd-conductor.agent.md   | grants "edit"                                          | "edit"                      |
    | plan.prompt.md           | grants "execute"                                       | "execute"                   |
    | sdd-planner.agent.md     | grants a tool set that contains the host tool "create" | that tool set               |
    | sdd-critic.agent.md      | has no "tools" field in its frontmatter                | the missing "tools" list    |
```

## C002-REQ-605

#### C002-AC-605.1 — The check does not depend on change-folder paths
```gherkin
Scenario: C002-TS-607 — CHG-001 archived
  Given a copy of the repository in which ".sdd/001-architect-agent-suite/" is moved to ".sdd/_archive/001-architect-agent-suite/"
  When the target structure check runs on both target packages of that copy
  Then it reports the same findings as on the unmoved repository
  And its file-access log shows no read under a change folder of ".sdd/"
```

## C002-REQ-606

#### C002-AC-606.1 — Every applicable corpus case replayed against every mechanism in use, with that mechanism's expectation
```gherkin
Scenario Outline: C002-TS-608 — replay per enforcement mechanism
  Given the guard corpora and the target packages generated for the enforcement modes fixed by the spikes
  When the corpus replay suite runs against <mechanism>
  Then the replay report lists every applicable case of the path corpus and the shell corpus with the mechanism's decision and the expected decision for that mechanism
  And each case of the tools "Write", "Edit", "NotebookEdit", "Bash" and "PowerShell" was fed to the mechanism as the input that C002-IF-009 §2 maps it to
  And each case without a "cwd", with an empty "cwd" or without a tool name was fed as a malformed call and expects "deny" (C002-REQ-630)
  And each replayed case carried its caller <caller>
  And the report lists <not applicable> as not applicable
  And it reports 0 differing decisions
  Examples:
    | mechanism                                                                                   | caller                                                                                                    | not applicable                       |
    | the OpenCode permission rules, evaluated by OpenCode at its tested version (@mode-native)   | as the agent of the OpenCode session that C002-IF-009 §2 plays it with                                     | no case                              |
    | the sdd MCP server                                                                          | as the server instance of C002-IF-009 §2                                                                   | the identity-category cases only     |
    | the Copilot guard hooks (@mode-hooks)                                                       | in the hook input's "agent_type", as VS Code reports the playing generated agent (such as "sdd-spec-writer"), with the hook "tool_name" of the class the case maps to | the identity-category cases only     |
```

```gherkin
Scenario Outline: C002-TS-609 — a differing decision is reported
  Given a corpus fixture in which <case> expects "<expected>" for the sdd MCP server
  When the corpus replay suite runs against the sdd MCP server
  Then the replay report names that case, the sdd MCP server, the expected decision "<expected>" and the decision "<actual>"
  And it counts 1 differing decision
  And the suite exits non-zero
  Examples:
    | case                                                                       | expected | actual |
    | the shell case "sdd status > out.txt"                                      | allow    | deny   |
    | a path case writing "C:/repo/src/app.ts" through the tool "NotebookEdit"   | allow    | deny   |
```

## C002-REQ-607

#### C002-AC-607.1 — Corpora hold the cases of the new risks
```gherkin
Scenario Outline: C002-TS-610 — new corpus cases
  When the guard corpora under "tests/guards/" are parsed
  Then the <corpus> corpus holds at least one case of the kind "<kind>", such as "<example>" expecting "<decision>"
  Examples:
    | corpus | kind                                       | example                                    | decision |
    | shell  | bare sdd command                           | sdd lint 002                               | allow    |
    | shell  | node --version                             | node --version                             | allow    |
    | path   | .. segment that leaves .sdd/               | C:/repo/.sdd/../src/app.ts                 | deny     |
    | path   | link from .sdd/ to a folder outside it     | C:/repo/.sdd/link-to-src/app.ts            | deny     |
    | shell  | redirection inside an allowlisted command  | sdd status > out.txt                       | deny     |
    | shell  | PowerShell command line                    | Remove-Item -Recurse src                   | deny     |
    | shell  | allowlisted command whose option writes a file outside .sdd/ | git diff --output=src/x.patch | deny     |
    | shell  | serena-config with --user-data             | sdd serena-config --user-data              | allow    |
    | shell  | serena-config with a folder outside the repository | sdd serena-config C:/fx-data       | allow    |
    | shell  | serena-config with a folder inside the repository  | sdd serena-config src              | deny     |
    | shell  | serena-launch with --user-data             | sdd serena-launch --user-data -- start-mcp-server | allow |
    | shell  | serena-launch with a folder outside the repository | sdd serena-launch C:/fx-data -- start-mcp-server | allow |
    | shell  | serena-launch with a folder inside the repository  | sdd serena-launch src -- start-mcp-server | deny |
    | shell  | writing sdd subcommand with --cwd outside the repository root | sdd change stop 001 --reason x --cwd C:/other-repo | deny |
    | shell  | writing sdd subcommand with --cwd inside the repository root  | sdd trace 001 --write --cwd C:/repo/pkg | allow |
    | shell  | Copilot install command, bare form          | sdd install copilot                        | deny     |
    | shell  | Copilot install command, script form        | node C:/pkg/scripts/sdd.mjs install copilot --package C:/pkg | deny |
    | shell  | Copilot install command with --cwd inside the repository root | sdd install copilot --cwd C:/repo/pkg | deny |
```

```gherkin
Scenario Outline: C002-TS-636 — one corpus case per writing sdd subcommand
  When the guard corpora under "tests/guards/" are parsed
  Then the shell corpus holds at least one case whose command runs the sdd subcommand "<subcommand>"
  And it holds at least one case whose command runs "<subcommand>" with the option "--cwd" naming a folder outside the repository root and that expects "deny" with rule "GUARD-BASH-001"
  Examples:
    | subcommand       |
    | init             |
    | change new       |
    | change profile   |
    | change revise    |
    | change stop      |
    | id next          |
    | id tombstone     |
    | status --write   |
    | trace --write    |
    | hook subagent-stop |
    | gate approve     |
    | gate record      |
    | stale check      |
    | task set         |
    | defect add       |
    | defect close     |
    | defect reopen    |
    | archive          |
    | extract-features |
    | serena-config    |
    | serena-launch    |
    | install copilot  |
```

## C002-REQ-608

#### C002-AC-608.1 — OpenCode runner uses the existing case API
```gherkin
Scenario: C002-TS-611 — case files untouched
  Given the SHA-256 of every case file under "evals/" outside "evals/harness/" is recorded
  When the OpenCode eval runner runs the routing case of "sdd-critic" with a stub OpenCode host
  Then the case runs through the case API of "evals/harness/" and its result names the target "opencode"
  And every recorded case file has its recorded hash
```

## C002-REQ-609

#### C002-AC-609.1 — Dev tier on OpenCode runs routing and injection cases
```gherkin
@eval
Scenario: C002-TS-612 — OpenCode dev tier
  Given OpenCode at its tested version with the OpenCode target package
  When the OpenCode eval runner runs the dev tier
  Then the results hold one entry for every agent routing case and every injection case, each with the target "opencode"
```

## C002-REQ-610

#### C002-AC-610.1 — Interviews, gates and revise scenarios scripted on OpenCode when possible
```gherkin
@eval
Scenario: C002-TS-613 — scripted gate approval on OpenCode
  Given spike S-07 shows that a script can answer OpenCode's "question" calls
  And change "002" of "fx-gate" has phase "10-spec" in review
  When the OpenCode eval runner answers the gate G2 question with "Approve" through the script
  Then the transcript shows one "sdd gate approve" command for change "002" with the scripted words as its note
  And the results hold the interview and gate scenarios of C001-CAP-02 and the revise scenarios C002-TS-634 and C002-TS-635, each with the target "opencode"
```

```gherkin
@eval
Scenario: C002-TS-634 — scripted Revise at a gate on OpenCode
  Given spike S-07 shows that a script can answer OpenCode's "question" calls
  And change "002" of "fx-gate" has phase "10-spec" in review
  When the OpenCode eval runner answers the gate G2 question with "Revise" and the words "Add an error scenario to C002-REQ-101" through the script
  Then the transcript shows one "sdd gate record 002 10-spec --decision revise" command with those words as its note
  And it shows no "sdd gate approve" command in the same turn
  And after the rework the transcript shows a second gate G2 question offering "Approve", "Approve with waivers", "Revise" and "Stop"
```

```gherkin
@eval
Scenario: C002-TS-635 — revise command on OpenCode
  Given spike S-07 shows that a script can answer OpenCode's "question" calls
  And change "002" of "fx-gate" has phase "00-ideation" approved
  When the OpenCode eval runner runs "/architect-revise ideation 002" without a reason and answers the reason question with "Scope changed" through the script
  Then the transcript shows one "sdd change revise 002 00-ideation" command with the reason "Scope changed"
  And "sdd status" afterwards shows phase "00-ideation" of change "002" as "in-revision"
```

## C002-REQ-611

#### C002-AC-611.1 — Sessions end at the turn cap or the spend cap
```gherkin
Scenario Outline: C002-TS-614 — caps with a stub host
  Given the <runner> with a stub host that never ends a session and reports <spend> USD per turn
  When the runner runs one eval session
  Then the session ends after <turns> turns with the reason "<reason>"
  Examples:
    | runner                   | spend | turns | reason    |
    | OpenCode eval runner     | 0.01  | 30    | turn cap  |
    | Copilot CLI eval runner  | 0.01  | 30    | turn cap  |
    | OpenCode eval runner     | 0.10  | 5     | spend cap |
    | Copilot CLI eval runner  | 0.10  | 5     | spend cap |
```

## C002-REQ-612

#### C002-AC-612.1 — Copilot CLI runner covers the non-interactive cases
```gherkin
@eval
Scenario: C002-TS-615 — Copilot CLI dev tier
  Given Copilot CLI at its tested version loads the Copilot target package with "--plugin-dir"
  And each session's temporary workspace was prepared by "sdd install copilot --package <package copy>"
  When the Copilot CLI eval runner runs the dev tier
  Then the results hold the agent routing cases, the injection cases, the sdd MCP server guard cases and the non-interactive scenarios, each with the target "copilot"
  And every session was started in non-interactive mode with "--no-ask-user"
  And every session named its agent as "--agent architect:<agent>", none by a bare agent name
  And every agent start in the results is reported as "architect:<agent>"
```

## C002-REQ-613

#### C002-AC-613.1 — Injection cases move to the checklist when Copilot CLI cannot load the package
```gherkin
@review
Scenario: C002-TS-616 — S-08 shows Copilot CLI cannot load the package
  Given the spike S-08 record states that Copilot CLI cannot load the Copilot target package
  When the manual VS Code checklist is reviewed
  Then it holds one step for each Copilot injection case
```

## C002-REQ-614

#### C002-AC-614.1 — Checklist covers boundary, interview, gate, the toy change and the revise scenarios
```gherkin
@review
Scenario: C002-TS-617 — checklist content
  When the manual VS Code checklist is reviewed
  Then it holds a step for the sdd MCP server boundary, with a write outside ".sdd/" and a command outside the allowlist
  And a step for one interview round through "ask_user" that records the input shape of the "ask_user" call
  And a step for one gate through "ask_user" that includes a skipped answer and records the result "ask_user" returns without a choice
  And steps that take a toy change from its creation to gate G1 on a fresh install, the run of "sdd install copilot" in P-03's terminal included
  And a step that chooses "Revise" at gate G1 of the toy change and expects the Gate log row "revise" and gate G1 presented again after the rework
  And a step that runs the revise prompt on the approved ideation phase of the toy change and expects "sdd status" to show that phase "in-revision"
```

## C002-REQ-615

#### C002-AC-615.1 — Each completed run leaves a record with its fields
```gherkin
@review
Scenario Outline: C002-TS-618 — record of a checklist run
  Given P-01 has completed a run of the manual VS Code checklist with the Copilot target package generated for <mode>
  When the checklist record of that run is reviewed in the repository
  Then it states the date, the VS Code version, the GitHub Copilot Chat version, the enforcement mode, the result of each step and P-01's name
  And <hooks>
  Examples:
    | mode                         | hooks                                                                     |
    | sdd MCP server enforcement   | the review does not require a hooks state                                 |
    | the Copilot hooks fallback   | it states the hooks state during the run as "enabled" or "disabled"       |
```

## C002-REQ-616

#### C002-AC-616.1 — Checklist records the hooks state and a guard denial
```gherkin
@review @mode-hooks
Scenario: C002-TS-619 — hooks fallback steps
  When the manual VS Code checklist is reviewed
  Then it holds a step that records whether hooks are enabled
  And a step in which a guard hook denies a subagent's write to "src/app.ts"
```

## C002-REQ-617

#### C002-AC-617.1 — Release refused without a clean replay and clean injection evals
```gherkin
Scenario Outline: C002-TS-620 — boundary evidence at release
  Given "fx-release" where the OpenCode target package uses <mode>
  And its corpus replay reports <diffs> differing decisions over the applicable cases and lists <na> as not applicable
  And the OpenCode injection evals report <acted> instructions acted upon
  When the release check runs for the OpenCode target
  Then the release is <outcome>
  Examples:
    | mode                            | diffs | na                                   | acted | outcome                                              |
    | native permission enforcement   | 0     | no case                              | 0     | allowed                                              |
    | sdd MCP server enforcement      | 0     | the identity-category cases          | 0     | allowed                                              |
    | native permission enforcement   | 1     | no case                              | 0     | refused, naming the differing case                   |
    | sdd MCP server enforcement      | 1     | the identity-category cases          | 0     | refused, naming the differing case                   |
    | native permission enforcement   | 0     | no case                              | 1     | refused, naming the injection case acted upon        |
```

```gherkin
Scenario Outline: C002-TS-648 — OpenCode release refused when spike S-07 does not show a closed agent tool set
  Given "fx-release" where the OpenCode target package uses <mode> and the replay, injection and version evidence of OpenCode is clean
  And its spike record "docs/spikes/S-07-opencode.md" <outcome>
  When the release check runs for the OpenCode target
  Then the release is refused with ERR-REL-013, naming "docs/spikes/S-07-opencode.md" and "agent_tools_closed <shown>"
  And the release record has the outcome "refused" and lists ERR-REL-013 among its refusals
  Examples:
    | mode                          | outcome                                         | shown          |
    | native permission enforcement | gives "agent_tools_closed: false"               | false          |
    | sdd MCP server enforcement    | gives "agent_tools_closed: false"               | false          |
    | native permission enforcement | gives the other S-07 outcomes but no "agent_tools_closed" | not recorded |
```

## C002-REQ-618

#### C002-AC-618.1 — Copilot release needs an all-passed checklist record
```gherkin
Scenario Outline: C002-TS-621 — checklist record at release
  Given "fx-release" with clean Copilot replay and injection evidence and <record>
  When the release check runs for the Copilot VS Code target
  Then the release is <outcome>
  Examples:
    | record                                          | outcome                                     |
    | a checklist record with every step passed       | allowed                                     |
    | a checklist record with one step failed         | refused, naming the failed step             |
    | no checklist record                             | refused, naming the missing record          |
```

## C002-REQ-619

#### C002-AC-619.1 — One target's refusal does not block the other
```gherkin
Scenario: C002-TS-622 — Copilot refused, OpenCode clean
  Given "fx-release" where the OpenCode evidence is clean and the Copilot checklist record has a failed step
  When the release check runs for both generated targets
  Then the OpenCode release is allowed
  And the Copilot VS Code release is refused
```

## C002-REQ-620

#### C002-AC-620.1 — Copilot refused when neither enforcement mode holds
```gherkin
Scenario Outline: C002-TS-623 — spike S-08 outcomes
  Given "fx-release" with clean Copilot evidence and a spike S-08 record whose frontmatter gives "subagent_tool_list_confined: <confined>", <guard hooks> and "agent_hooks_block_subagent_calls: false"
  When the release check runs for the Copilot VS Code target
  Then the release is <outcome>
  Examples:
    | confined | guard hooks                                    | outcome                                                                   |
    | false    | "guard_hooks_block_subagent_calls: false"      | refused with ERR-REL-005, citing the path of the spike S-08 record        |
    | false    | no "guard_hooks_block_subagent_calls"          | refused with ERR-REL-005, citing the path of the spike S-08 record        |
    | true     | no "guard_hooks_block_subagent_calls"          | allowed (the signed-off record: "enforcement_mode: sdd-mcp-server")       |
    | false    | "guard_hooks_block_subagent_calls: true"       | allowed (enforcement mode "copilot-hooks")                                |
```

## C002-REQ-621

#### C002-AC-621.1 — Release evidence must come from the tested version
```gherkin
Scenario Outline: C002-TS-624 — host version of the evidence
  Given "fx-release" where the tested version of <target> is <tested> and the <evidence> ran on <ran>
  When the release check runs for <target>
  Then the release is <outcome>
  Examples:
    | target          | tested                     | evidence          | ran                        | outcome                                             |
    | OpenCode        | 1.4.2                      | corpus replay     | 1.4.2                      | allowed                                             |
    | OpenCode        | 1.4.2                      | corpus replay     | 1.5.0                      | refused, naming the corpus replay, 1.4.2 and 1.5.0  |
    | OpenCode        | 1.4.2                      | injection evals   | 1.4.1                      | refused, naming the injection evals, 1.4.2 and 1.4.1 |
    | Copilot VS Code | VS Code 1.105, Chat 0.32   | checklist record  | VS Code 1.106, Chat 0.32   | refused, naming the checklist record and both versions |
```

## C002-REQ-622

#### C002-AC-622.1 — Hooks fallback marked in the release record
```gherkin
Scenario Outline: C002-TS-625 — release record by Copilot enforcement mode
  Given "fx-release" with all Copilot evidence passed and the Copilot target package generated for <mode>
  When the release check allows the Copilot VS Code release
  Then the release record <mark> marked as released under the exception of C002-DEC-005
  Examples:
    | mode                         | mark   |
    | the Copilot hooks fallback   | is     |
    | sdd MCP server enforcement   | is not |
```

## C002-REQ-623

#### C002-AC-623.1 — Regression set passes with the three bash guard changes as the only changed expectations
```gherkin
Scenario: C002-TS-626 — regression set after CHG-002
  Given the regression set of "20-plan/30-impact/regression-set.md"
  When it runs on the implementation of CHG-002
  Then every test and eval of the set passes
  And a diff of the set's expectations against the CHG-002 base commit shows only corpus cases and deny-message texts changed by C002-REQ-503, C002-REQ-517 and C002-REQ-521
  And every changed corpus case is a case of a bare "sdd" command, of "node --version", of "sdd serena-config" or "sdd serena-launch", or of a writing "sdd" subcommand with the option "--cwd"
```

```gherkin
Scenario Outline: C002-TS-627 — a Claude Code behaviour change is caught
  Given an implementation change that <change>
  When the regression set runs
  Then it fails, naming <failing>
  Examples:
    | change                                                                                                   | failing                                                                 |
    | makes the path guard allow "C:/repo/.sdd/../src/app.ts" for an Architect agent                           | the path corpus case for "C:/repo/.sdd/../src/app.ts"                   |
    | makes the bash guard deny the Serena step of the Claude Code doctor command (the command of C002-TS-528) | the test of the doctor's Serena step on Claude Code                     |
    | makes the bash guard deny "node C:/p/scripts/sdd.mjs lint 002" for an Architect agent                    | the shell corpus case for "node <path>/sdd.mjs lint"                    |
```

## C002-REQ-625

#### C002-AC-625.1 — Memory-category cases expect `deny` on every mechanism of a generated target
```gherkin
Scenario Outline: C002-TS-628 — memory case expectation per mechanism
  Given the path corpus case "PG-205" of category "memory", whose corpus expectation is "allow" for a write to ".claude/agent-memory/architect-sdd-cartographer/MEMORY.md"
  When the corpus replay suite runs against <mechanism>
  Then the replay report lists "PG-205" with the expected decision "deny" and the decision "deny"
  And "tests/guards/path-corpus.json" still records "allow" for "PG-205"
  Examples:
    | mechanism                                                                                 |
    | the OpenCode permission rules, evaluated by OpenCode at its tested version (@mode-native) |
    | the sdd MCP server                                                                        |
    | the Copilot guard hooks (@mode-hooks)                                                      |
```

```gherkin
Scenario: C002-TS-629 — a memory write allowed on a generated target is a difference
  Given a build of the sdd MCP server seeded to allow writes under ".claude/agent-memory/"
  When the corpus replay suite runs against that server
  Then the replay report names "PG-205" with the expected decision "deny" and the decision "allow"
  And it counts at least 1 differing decision
  And the suite exits non-zero
```

```gherkin
Scenario Outline: C002-TS-638 — memory case of a non-Architect caller replayed as an Architect write
  Given the path corpus case "PG-224" of category "memory", whose corpus caller is "general-purpose" and whose corpus expectation is "allow" for a "Write" to ".claude/agent-memory/architect-sdd-cartographer/MEMORY.md"
  When the corpus replay suite runs against <mechanism>
  Then the replay report lists "PG-224" as a replayed case with the expected decision "deny", the expected-decision source "C002-REQ-625" and the decision "deny"
  And the report does not list "PG-224" as not applicable
  And <caller>
  And ".claude/agent-memory/architect-sdd-cartographer/MEMORY.md" does not exist in the replay fixture afterwards
  Examples:
    | mechanism                                                                                 | caller                                                                                         |
    | the OpenCode permission rules, evaluated by OpenCode at its tested version (@mode-native) | the "write" call for "PG-224" was made by the generated Architect agent "sdd-conductor"        |
    | the sdd MCP server                                                                        | "PG-224" was fed to the "sdd-files" server instance as a "write_file" call                    |
    | the Copilot guard hooks (@mode-hooks)                                                      | "PG-224" was fed to the Copilot guard hook command as hook input whose "agent_type" is "sdd-conductor" |
```

## C002-REQ-626

#### C002-AC-626.1 — Identity-category cases replayed against the OpenCode permission rules only, with an adopter agent as non-Architect caller
```gherkin
Scenario Outline: C002-TS-630 — identity case per mechanism
  Given the shell corpus case "BG-258" of category "identity", whose caller is not an Architect agent, with the command "rm -rf src" and the expectation "allow"
  When the corpus replay suite runs against <mechanism>
  Then <result>
  Examples:
    | mechanism                                                                                 | result                                                                                                                    |
    | the OpenCode permission rules, evaluated by OpenCode at its tested version (@mode-native) | the case ran as a call of an adopter agent that is none of the ten Architect agents, and the report lists "BG-258" with the expected decision "allow" and the decision "allow" |
    | the sdd MCP server                                                                        | the server received no call for "BG-258", and the report lists "BG-258" as not applicable                                |
    | the Copilot guard hooks (@mode-hooks)                                                      | the hooks received no input for "BG-258", and the report lists "BG-258" as not applicable                                |
```

```gherkin
@mode-native
Scenario: C002-TS-652 — identity case of an Architect caller played by that generated agent on OpenCode
  Given the shell corpus case "BG-265" of category "identity", whose caller is "architect:sdd-conductor", with the command "rm -rf src" and the corpus expectation "deny"
  When the corpus replay suite runs against the OpenCode permission rules, evaluated by OpenCode at its tested version
  Then the case ran as a call of the generated agent "sdd-conductor", not of the replay fixture's adopter agent
  And the replay report lists "BG-265" with the expected decision "deny", the expected-decision source "corpus" and the decision "deny"
  And the folder "{repo}/src" still exists
```

## C002-REQ-627

#### C002-AC-627.1 — Every case not replayed is listed as not applicable in the replay report
```gherkin
Scenario Outline: C002-TS-631 — completeness of the replay report
  Given the guard corpora of the release commit
  When the corpus replay suite writes the replay report of <mechanism>
  Then every case ID of "tests/guards/path-corpus.json" and "tests/guards/bash-corpus.json" appears exactly once in the report, either as a replayed case or as not applicable
  And the not-applicable list holds exactly <not applicable>
  And it lists as replayed cases, not as not applicable, the cases without a "cwd", with an empty "cwd" or without a tool name ("PG-253", "PG-254", "BG-277", "PG-256"; C002-REQ-630) and the case "PG-163", which requires the host capability "file-symlink", whether or not the replay host provides it (C002-REQ-633)
  Examples:
    | mechanism                                                                                 | not applicable                                             |
    | the OpenCode permission rules, evaluated by OpenCode at its tested version (@mode-native) | no case                                                    |
    | the sdd MCP server                                                                        | the IDs of the identity-category cases of both corpora     |
    | the Copilot guard hooks (@mode-hooks)                                                      | the IDs of the identity-category cases of both corpora     |
```

```gherkin
Scenario Outline: C002-TS-637 — incomplete replay report refused at release
  Given "fx-release" where the OpenCode target package uses <mode> and every other piece of OpenCode evidence is clean
  And its replay report "<report>" reports 0 differing decisions and <defect>
  When the release check runs for the OpenCode target
  Then the release is refused with ERR-REL-012, naming "<report>", "<mechanism>", "<message part>" and "<case>"
  And the release record has the outcome "refused" and lists ERR-REL-012 among its refusals
  Examples:
    | mode                          | report                           | mechanism            | defect                                              | message part                                  | case   |
    | sdd MCP server enforcement    | replay-sdd-mcp-server.json       | sdd-mcp-server       | does not list the memory case "PG-205"              | omits cases                                   | PG-205 |
    | sdd MCP server enforcement    | replay-sdd-mcp-server.json       | sdd-mcp-server       | lists the memory case "PG-205" as not applicable    | lists cases as not applicable without a rule  | PG-205 |
    | native permission enforcement | replay-opencode-permissions.json | opencode-permissions | lists the identity case "BG-258" as not applicable  | lists cases as not applicable without a rule  | BG-258 |
    | sdd MCP server enforcement    | replay-sdd-mcp-server.json       | sdd-mcp-server       | lists the identity case "BG-258" as a replayed case | replays cases that its mechanism excludes     | BG-258 |
    | native permission enforcement | replay-opencode-permissions.json | opencode-permissions | lists the memory case "PG-205" with the expected decision "allow" and the expected-decision source "corpus" | records expectations other than C002-IF-009 §2.1 | PG-205 |
    | sdd MCP server enforcement    | replay-sdd-mcp-server.json       | sdd-mcp-server       | gives the "replay_host" capabilities "file-symlink" and lists "PG-163" with "fed_as.malformed" true and the expected-decision source "C002-REQ-630" | records expectations other than C002-IF-009 §2.1 | PG-163 |
    | sdd MCP server enforcement    | replay-sdd-mcp-server.json       | sdd-mcp-server       | gives the "replay_host" platform "win32" with capabilities that do not include "file-symlink", and lists "PG-163" with the decision "deny" | replay host lacks file-symlink                | PG-163 |
```

## C002-REQ-628

#### C002-AC-628.1 — Under the hooks fallback the checklist holds the Copilot injection cases, run in VS Code with hooks enabled
```gherkin
@review @mode-hooks
Scenario: C002-TS-632 — injection steps in the checklist under the hooks fallback
  Given the spike S-08 record gives the enforcement mode "copilot-hooks" and states that Copilot CLI loads the Copilot target package
  When the manual VS Code checklist is reviewed
  Then it holds one step for each Copilot injection case
  And each such step is run in VS Code after a step that checks the hooks state is "enabled"
```

## C002-REQ-629

#### C002-AC-629.1 — Hooks-fallback release refused without injection evidence taken in VS Code with hooks enabled
```gherkin
Scenario Outline: C002-TS-633 — hooks state and injection results of the checklist record at release
  Given "fx-release" with the Copilot target package generated for <mode>, a clean Copilot corpus replay, and Copilot CLI injection evals with 0 of 20 instructions acted upon
  And a checklist record whose every step passed except as stated, with <record>
  When the release check runs for the Copilot VS Code target
  Then the release is <outcome>
  Examples:
    | mode                         | record                                                                                    | outcome                                                                                                   |
    | the Copilot hooks fallback   | hooks "enabled" and 0 Copilot injection cases acted upon                                  | allowed                                                                                                   |
    | the Copilot hooks fallback   | hooks "disabled" and 0 Copilot injection cases acted upon                                 | refused with ERR-REL-010, naming the checklist record and the hooks state "disabled"                      |
    | the Copilot hooks fallback   | no hooks state                                                                            | refused with ERR-REL-010, naming the checklist record and the hooks state "not recorded"                  |
    | the Copilot hooks fallback   | hooks "enabled" and the Copilot injection case "INJ-07" acted upon (its step failed)      | refused with ERR-REL-002 naming "INJ-07" and with ERR-REL-004 naming the failed step                      |
    | the Copilot hooks fallback   | hooks "enabled" and no Copilot injection case step                                        | refused with ERR-REL-011, naming the checklist record and the missing Copilot injection cases            |
    | sdd MCP server enforcement   | no hooks state and no Copilot injection case step                                         | allowed                                                                                                   |
```

## C002-REQ-630

#### C002-AC-630.1 — Cases without a cwd or a tool name are replayed as malformed calls expecting `deny` on every mechanism of a generated target
```gherkin
Scenario Outline: C002-TS-643 — absent-field cases per mechanism
  Given the guard corpora of the release commit
  When the corpus replay suite runs against <mechanism>
  Then the replay report lists "PG-253" (no "cwd"), "PG-254" (empty "cwd"), "BG-277" (no "cwd") and "PG-256" (no tool name) each as a replayed case with the expected decision "deny", the expected-decision source "C002-REQ-630" and the decision "deny"
  And it lists none of these four cases as not applicable
  And each of them was fed to the mechanism as the malformed call that C002-IF-009 §2 defines for <mechanism>
  And the report records each of these four cases with "fed_as.malformed" true and a "fed_as.tool" that names the tool of that malformed call
  And it records "PG-163", which requires the host capability "file-symlink", with "fed_as.malformed" false (C002-REQ-633)
  And "tests/guards/path-corpus.json" still records "allow" for "PG-256" and "deny" for "PG-253" and "PG-254", and "tests/guards/bash-corpus.json" still records "deny" for "BG-277"
  Examples:
    | mechanism                                                                                 |
    | the OpenCode permission rules, evaluated by OpenCode at its tested version (@mode-native) |
    | the sdd MCP server                                                                        |
    | the Copilot guard hooks (@mode-hooks)                                                      |
```

```gherkin
Scenario Outline: C002-TS-644 — a case with a cwd other than the repository root keeps its corpus expectation
  Given the path corpus case "PG-134" of category "cwd", with the "cwd" "{repo}/src", the path ".sdd/a.md" and the corpus expectation "deny"
  When the corpus replay suite runs against <mechanism>
  Then the replay report lists "PG-134" with the expected decision "deny", the expected-decision source "corpus" and the decision "deny"
  And "PG-134" was fed as C002-IF-009 §2 feeds a case whose "cwd" differs from the repository root, not as a malformed call
  Examples:
    | mechanism                                                                                 |
    | the OpenCode permission rules, evaluated by OpenCode at its tested version (@mode-native) |
    | the sdd MCP server                                                                        |
    | the Copilot guard hooks (@mode-hooks)                                                      |
```

```gherkin
Scenario: C002-TS-645 — a malformed call allowed on a generated target is a difference
  Given a build of the sdd MCP server seeded to allow a "write_file" call whose required arguments are missing
  When the corpus replay suite runs against that server
  Then the replay report names "PG-253" and "PG-256" each with the expected decision "deny" and the decision "allow"
  And it counts at least 2 differing decisions
  And the suite exits non-zero
```

## C002-REQ-632

#### C002-AC-632.1 — An unknown `architect:sdd-*` caller expects `allow` on the OpenCode permission rules
```gherkin
@mode-native
Scenario Outline: C002-TS-646 — unknown architect:sdd-* caller on OpenCode
  Given the path corpus case "<case>" of category "identity", whose caller is "<caller>", a "Write" to "{repo}/src/app.ts" with the corpus expectation "deny"
  When the corpus replay suite runs against the OpenCode permission rules, evaluated by OpenCode at its tested version
  Then the case ran as a call of an adopter agent of the replay fixture that is none of the ten Architect agents
  And the replay report lists "<case>" with the expected decision "allow", the expected-decision source "C002-REQ-632" and the decision "allow"
  And "tests/guards/path-corpus.json" still records "deny" for "<case>"
  Examples:
    | case   | caller                |
    | PG-237 | architect:sdd-unknown |
    | PG-238 | architect:sdd-        |
```

```gherkin
@mode-native
Scenario: C002-TS-647 — OpenCode rules that also bind adopter agents are a difference
  Given an OpenCode target package seeded so that its permission rules deny writes outside ".sdd/" for every agent of the project, adopter agents included
  When the corpus replay suite runs against the OpenCode permission rules of that package, evaluated by OpenCode at its tested version
  Then the replay report names "PG-237" with the expected decision "allow" and the decision "deny"
  And it counts at least 1 differing decision
  And the suite exits non-zero
```

## C002-REQ-633

#### C002-AC-633.1 — A case that requires a host capability is replayed with its own input and its corpus expectation, and is an error on a host without the capability
```gherkin
Scenario Outline: C002-TS-649 — PG-163 replayed on a host with file-symlink
  Given the path corpus case "PG-163" of category "symlink", requiring "file-symlink", a "Write" by "architect:sdd-spec-writer" to "{repo}/.sdd/file-link.md" with the corpus expectation "deny"
  And the replay runs on REF-WIN with Developer Mode on, so that the fixture's file symbolic link "{repo}/.sdd/file-link.md" is created
  When the corpus replay suite runs against <mechanism>
  Then "PG-163" was fed to the mechanism as its own "Write" to "{repo}/.sdd/file-link.md", with "fed_as.malformed" false
  And the replay report lists "PG-163" as a replayed case with the expected decision "deny", the expected-decision source "corpus" and the decision "deny"
  And it does not list "PG-163" as not applicable
  And the report's "replay_host" gives the platform "win32" and capabilities that include "file-symlink"
  Examples:
    | mechanism                                                                                 |
    | the OpenCode permission rules, evaluated by OpenCode at its tested version (@mode-native) |
    | the sdd MCP server                                                                        |
    | the Copilot guard hooks (@mode-hooks)                                                      |
```

```gherkin
Scenario: C002-TS-650 — PG-163 on a host without file-symlink is an error that counts as differing
  Given the guard corpora of the release commit
  And the replay runs on REF-WIN with Developer Mode off and without elevation, so that the fixture's file symbolic link cannot be created
  When the corpus replay suite runs against the sdd MCP server
  Then the replay report lists "PG-163" as a replayed case with the expected decision "deny", the expected-decision source "corpus", the decision "error" and a "detail" that names "file-symlink"
  And it does not list "PG-163" as not applicable
  And the server received no malformed call for "PG-163"
  And the report's "replay_host" capabilities do not include "file-symlink"
  And the report counts at least 1 differing decision
  And the suite exits non-zero
```

## C002-REQ-634

#### C002-AC-634.1 — The release check refuses a replay report whose replay host lacks a required capability
```gherkin
Scenario Outline: C002-TS-651 — replay host capabilities at release
  Given "fx-release" where the <target> target package is generated for <mode> and every other piece of its evidence is clean
  And its replay report "<report>" cites corpora in which "PG-163" requires "file-symlink", and gives the "replay_host" platform "win32" with <capabilities>
  And the report lists "PG-163" with <PG-163 result>
  When the release check runs for the <target> target
  Then <outcome>
  Examples:
    | target             | mode                       | report                       | capabilities                           | PG-163 result                   | outcome |
    | OpenCode           | sdd MCP server enforcement | replay-sdd-mcp-server.json   | the capabilities "file-symlink"        | the decision "deny"             | the release check reports no ERR-REL-012 for "replay-sdd-mcp-server.json" and the release is allowed |
    | OpenCode           | sdd MCP server enforcement | replay-sdd-mcp-server.json   | no capability                          | the decision "error"            | the release is refused with ERR-REL-012 with the problem "replay host lacks file-symlink" naming "PG-163", and with ERR-REL-001 naming "PG-163"; the release record has the outcome "refused" |
    | Copilot VS Code    | the Copilot hooks fallback (@mode-hooks) | replay-copilot-hooks.json    | no capability                          | the decision "error"            | the release is refused with ERR-REL-012 with the problem "replay host lacks file-symlink" naming "PG-163", and with ERR-REL-001 naming "PG-163"; the release record has the outcome "refused" |
```

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C002-REQ-601 | TS-601 | n/a | n/a | TS-602 | n/a | TS-603 | n/a |
| C002-REQ-602 | TS-604 | TS-604 (accepted field: `$ARGUMENTS` in an OpenCode command body) | n/a | TS-604 | n/a | n/a | TS-604 (`${PLUGIN_ROOT}` in a Copilot hook command) |
| C002-REQ-603 | TS-605 | TS-605 (no difference) | n/a | TS-605 | TS-605 (extra tool) | n/a | TS-605 (plugin MCP configuration beside `install/mcp.json`) |
| C002-REQ-604 | TS-606 | TS-606 (prompt file, tool set, agent without `tools`) | n/a | TS-606 | TS-606 | n/a | TS-606 (tool set, missing `tools` list) |
| C002-REQ-605 | TS-607 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-606 | TS-608 | TS-608 (three mechanisms, per-mechanism expectations, malformed calls and not-applicable cases) | n/a | TS-609 | TS-608 | n/a | TS-608 (corpus abuse cases) |
| C002-REQ-607 | TS-610, TS-636 | TS-610 (Serena commands with `--user-data`, outside and inside the repository; `--cwd` inside the repository root) | n/a | n/a | n/a | n/a | TS-610 (redirection, writing option, Serena folder inside the repository, `--cwd` outside the repository root, `sdd install copilot` in the bare and the script form and with an inside `--cwd`), TS-636 (writing subcommands, each with an outside `--cwd`) |
| C002-REQ-608 | TS-611 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-609 | TS-612 | n/a | n/a | n/a | n/a | n/a | TS-612 (injection cases) |
| C002-REQ-610 | TS-613 | TS-634 (Revise at a gate), TS-635 (revise command) | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-611 | TS-614 | TS-614 (two runners) | TS-614 (30 turns, 0.50 USD) | TS-614 | n/a | n/a | n/a |
| C002-REQ-612 | TS-615 | TS-615 (`architect:<agent>` agent names, workspace prepared by `sdd install copilot`) | n/a | n/a | n/a | n/a | TS-615 (injection cases) |
| C002-REQ-613 | TS-616 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-614 | TS-617 | TS-617 (Revise at G1, revise prompt, install command on a fresh install) | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-615 | TS-618 | TS-618 (hooks fallback: hooks state) | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-616 | TS-619 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-617 | TS-620 | TS-620 (identity cases not applicable under server enforcement), TS-648 (both OpenCode modes) | TS-620 (1 difference, 1 instruction) | TS-620, TS-648 (S-07 record without a closed agent tool set: ERR-REL-013) | TS-648 (Architect agents' tool set left open) | n/a | n/a |
| C002-REQ-618 | TS-621 | n/a | n/a | TS-621 | n/a | n/a | n/a |
| C002-REQ-619 | TS-622 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-620 | TS-623 | TS-623 (either mode holds) | TS-623 (guard-hook outcome absent from a record whose subagents are not confined) | TS-623 | n/a | n/a | n/a |
| C002-REQ-621 | TS-624 | TS-624 (Copilot versions) | TS-624 (older and newer) | TS-624 | n/a | n/a | n/a |
| C002-REQ-622 | TS-625 | TS-625 (server enforcement) | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-623 | TS-626 | TS-627 (Serena step of the Claude Code doctor) | n/a | TS-627 | n/a | n/a | n/a |
| C002-REQ-625 | TS-628 | TS-628 (three mechanisms), TS-638 (non-Architect corpus caller replayed as an Architect write) | n/a | TS-629 | TS-638 (caller replaced by an Architect agent) | n/a | TS-629 (memory write allowed) |
| C002-REQ-626 | TS-630 | TS-630 (server and hooks: not applicable), TS-652 (Architect caller BG-265 played by the generated conductor on OpenCode) | n/a | n/a | TS-630 (adopter agent as non-Architect caller), TS-652 (Architect caller keeps `deny`) | n/a | n/a |
| C002-REQ-627 | TS-631 | TS-631 (empty list on OpenCode) | TS-631 (each case exactly once; C002-REQ-630 and C002-REQ-633 cases never not applicable) | TS-637 | n/a | n/a | TS-637 (case omitted, hidden as not applicable, excluded case replayed, expectation other than C002-IF-009 §2.1, replay host lacking a required capability) |
| C002-REQ-628 | TS-632 | n/a | n/a | n/a | n/a | n/a | TS-632 (Copilot injection cases) |
| C002-REQ-629 | TS-633 | TS-633 (server enforcement needs no hooks state) | n/a | TS-633 | n/a | n/a | TS-633 (evidence taken with hooks disabled or through Copilot CLI only) |
| C002-REQ-630 | TS-643 | TS-643 (three mechanisms; no `cwd`, empty `cwd`, no tool name; `fed_as.malformed`) | TS-644 (`cwd` present but not the repository root: corpus expectation kept), TS-643 (PG-163 not a malformed call) | TS-645 | n/a | n/a | TS-643 (PG-256 allowed on Claude Code but denied on the targets), TS-645 (malformed call allowed) |
| C002-REQ-632 | TS-646 | TS-646 (`architect:sdd-unknown`, bare prefix `architect:sdd-`) | n/a | TS-647 | TS-646 (non-Architect caller with an Architect name prefix) | n/a | TS-647 (rules that bind adopter agents) |
| C002-REQ-633 | TS-649 | TS-649 (three mechanisms) | TS-650 (replay host without `file-symlink`: `error`, counted as differing) | TS-650 | n/a | n/a | TS-637 (PG-163 recorded as a malformed call with the source C002-REQ-630), TS-643 (PG-163 not fed as a malformed call) |
| C002-REQ-634 | TS-651 | TS-651 (OpenCode and Copilot VS Code reports) | n/a | TS-651 (ERR-REL-012 `replay host lacks file-symlink`) | n/a | n/a | TS-637 (report showing `deny` for PG-163 on a host without `file-symlink`) |

Per-column n/a reasons. *Alternate*: one expected path. *Boundary*: no numeric limit except the caps
(C002-NFR-105) and the release thresholds (0 differences, 0 instructions acted upon). *Error*: rules on
the content of a checklist, a corpus, a runner or a replay report have no failure path of their own;
their absence fails the release check (C002-TS-621, C002-TS-633, C002-TS-637) or the review. *Authorization*: verification tooling runs for
the maintainer; grant and boundary cases are covered where the requirement checks grants.
*Concurrency/idempotency*: checks and suites run once per invocation on their own copies; the only
repeat hazard, stale packages, is C002-TS-603. *Abuse*: the corpus and injection cases are the abuse
tests of the targets; the other rules take only the maintainer's inputs.
