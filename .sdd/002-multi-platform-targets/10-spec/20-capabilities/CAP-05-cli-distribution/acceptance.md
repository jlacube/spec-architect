---
id: C002-CAP-05
artifact: spec/acceptance
capability: "CLI distribution, allowlist and doctor"
change: CHG-002
phase: 10-spec
status: draft
---

# C002-CAP-05 — Acceptance criteria and scenarios

Verification: npm-package scenarios are integration tests on the packed tarball installed into a
clean prefix outside the repository. Allowlist scenarios feed hook-input JSON (C001-IF-07 §1) for an
Architect agent to `sdd guard-bash` on stdin, as C001-TS-1107 does. The doctor and the toolchain
record are prompts, so their scenarios are agent behaviour. Tags:

- `@eval`: run by the existing harness on Claude Code and by the OpenCode eval runner on OpenCode, on
  the machine configurations of C001-CAP-10 extended with the fixtures named here; scenarios that name
  the Copilot target package run its doctor prompt through the Copilot CLI eval runner
  (C002-REQ-612), with stub `code` executables that report the fixture versions; passes in 9 of 10
  runs (DOD-G-01).
- `@manual-vscode`: a step of the manual VS Code checklist (C002-REQ-614), passed by its checklist
  record (C002-REQ-615); the doctor in VS Code runs in Copilot Chat, which no script drives.
- `@mode-hooks`: applies only when the Copilot target package is generated for the Copilot hooks
  fallback.

Versions in the fixtures: plugin and `architect-sdd` "0.3.0"; the tested versions recorded in the
doctor remedies table of the fixture are OpenCode "1.4.2", VS Code "1.105.1" and GitHub Copilot Chat
"0.32.4". CLI scenarios run the installed `sdd` of the packed tarball with `CLAUDE_PLUGIN_ROOT` and
`CLAUDE_PLUGIN_DATA` unset, in a temporary user profile whose environment the scenario names.

## C002-REQ-501

#### C002-AC-501.1 — npm `sdd` is the same CLI as the bundled one
```gherkin
Scenario: C002-TS-501 — version of the installed executable
  Given the "architect-sdd" tarball is installed globally into a clean prefix
  When P-01 runs "sdd --version" in a fixture workspace
  Then the output equals the output of "node plugins/architect/scripts/sdd.mjs --version"
```

```gherkin
Scenario: C002-TS-502 — same behaviour as the bundled CLI
  Given the "architect-sdd" tarball is installed globally into a clean prefix and "CLAUDE_PLUGIN_ROOT" is unset
  When P-01 runs "sdd change new \"Export\" --profile lite --kind greenfield" in a copy of "fx-bootstrap"
  Then the exit code is 0
  And the change folder holds the same files as the one the bundled "scripts/sdd.mjs" creates in another copy of "fx-bootstrap"
```

## C002-REQ-502

#### C002-AC-502.1 — Packaging writes the unscoped tarball at the plugin version
```gherkin
Scenario: C002-TS-503 — npm package written by npm run package
  Given ".claude-plugin/plugin.json" has version "0.3.0"
  When P-01 runs "npm run package"
  Then "dist/" contains the tarball "architect-sdd-0.3.0.tgz"
  And its "package.json" has name "architect-sdd" without a scope, version "0.3.0" and a "bin" entry "sdd"
```

## C002-REQ-503

#### C002-AC-503.1 — Bare `sdd` and `node --version` allowed, the rest unchanged
```gherkin
Scenario Outline: C002-TS-504 — bash guard decisions after the allowlist change
  Given hook input for tool "<tool>" by agent "architect:sdd-planner" with the command "<command>"
  When the bash guard evaluates it
  Then the exit code is <code>
  And standard error <stderr>
  Examples:
    | tool       | command                     | code | stderr                      |
    | Bash       | sdd lint 002                | 0    | is empty                    |
    | Bash       | sdd status                  | 0    | is empty                    |
    | Bash       | node --version              | 0    | is empty                    |
    | Bash       | node -v                     | 0    | is empty                    |
    | Bash       | node C:/p/scripts/sdd.mjs lint | 0 | is empty                    |
    | PowerShell | sdd status                  | 0    | is empty                    |
    | PowerShell | node --version              | 0    | is empty                    |
    | Bash       | sdd status > out.txt        | 2    | contains "GUARD-BASH-002"   |
    | Bash       | sdd lint; curl http://x     | 2    | contains "GUARD-BASH-002"   |
    | Bash       | npx sdd status              | 2    | contains "GUARD-BASH-001"   |
    | Bash       | sddx status                 | 2    | contains "GUARD-BASH-001"   |
    | Bash       | node --version --eval 1     | 2    | contains "GUARD-BASH-001"   |
```

```gherkin
Scenario: C002-TS-505 — deny message names the new entries
  Given hook input for tool "Bash" by agent "architect:sdd-planner" with the command "npm install"
  When the bash guard evaluates it
  Then standard error contains "GUARD-BASH-001"
  And its "Allowed:" summary names a bare "sdd …" command and "node --version"
```

## C002-REQ-504

#### C002-AC-504.1 — Doctor rows depend on the host
```gherkin
@eval
Scenario Outline: C002-TS-506 — doctor table on Claude Code and OpenCode
  Given machine configuration "cfg-full" on <host>
  When P-01 runs the doctor command
  Then the reply contains a table with the columns Tool, Status, Version, Fallback and Fix
  And its rows are <rows>, in that order
  Examples:
    | host        | rows                                                                                   |
    | Claude Code | node, git, Claude Code, ripwire, Serena, ast-grep, Context7, DeepWiki                  |
    | OpenCode    | node, git, OpenCode, ripwire, Serena, ast-grep, Context7, DeepWiki, sdd CLI            |
```

```gherkin
@eval
Scenario: C002-TS-507 — missing tool on OpenCode
  Given machine configuration "cfg-no-ripwire" on OpenCode
  When P-01 runs the doctor command
  Then the ripwire row shows status "missing", its fallback and the install command from C001-IF-10 §3
```

```gherkin
@eval
Scenario: C002-TS-639 — tool found only as a `.cmd` shim under sdd MCP server enforcement
  Given machine configuration "cfg-full" on OpenCode on REF-WIN with the OpenCode target package generated with "--mode opencode=sdd-mcp-server"
  And ast-grep installed only by "npm install -g @ast-grep/cli", so that PATH holds "ast-grep.cmd" and no native "ast-grep" executable
  When P-01 runs the doctor command
  Then the ast-grep row shows status "error", version "—" and its fallback
  And its Fix column starts with "install a native executable of ast-grep", followed by the install command of the sdd MCP server variant of the doctor remedies table
  And the doctor run reports "completed with warnings"
```

```gherkin
@manual-vscode
Scenario: C002-TS-508 — doctor table in VS Code
  Given the toy change repository in VS Code with "architect-sdd" installed
  When P-01 runs the doctor prompt
  Then the table has a host row for VS Code with GitHub Copilot Chat and a row for the sdd CLI
  And the host row's Version column shows the VS Code version and the GitHub Copilot Chat version that VS Code's About dialog reports
  And it has no Claude Code row
```

## C002-REQ-505

#### C002-AC-505.1 — Only node and an unreachable sdd CLI fail the run
```gherkin
@eval
Scenario Outline: C002-TS-509 — doctor outcome per situation
  Given "<situation>" on <host>
  When P-01 runs the doctor command
  Then the doctor run reports "<outcome>"
  Examples:
    | host        | situation                               | outcome                     |
    | OpenCode    | DeepWiki endpoint unreachable           | completed with warnings     |
    | OpenCode    | ripwire, Serena and ast-grep missing    | completed with warnings     |
    | OpenCode    | node 18 on PATH                         | failed: node ≥ 20 required  |
    | OpenCode    | no "sdd" executable on PATH             | failed, naming the sdd CLI  |
    | Claude Code | no "sdd" executable on PATH             | completed                   |
    | Claude Code | node 18 on PATH                         | failed: node ≥ 20 required  |
```

## C002-REQ-506

#### C002-AC-506.1 — Claude Code version checked on Claude Code only
```gherkin
@eval
Scenario Outline: C002-TS-510 — Claude Code version on each host
  Given "claude --version" reports "<version> (Claude Code)" and the conductor runs on <host>
  When P-01 runs the doctor command
  Then <result>
  Examples:
    | host        | version  | result                                                                           |
    | Claude Code | 2.0.76   | the Claude Code row shows status "error" and the update command from C001-IF-10 §3 |
    | Claude Code | 2.1.295  | the Claude Code row shows status "ok"                                            |
    | OpenCode    | 2.0.76   | the table has no Claude Code row                                                 |
```

## C002-REQ-507

#### C002-AC-507.1 — Toolchain record rows match the host
```gherkin
@eval
Scenario Outline: C002-TS-511 — toolchain.md per host
  Given machine configuration "cfg-full" on <host> and a workspace with ".sdd/"
  When P-01 runs the doctor command
  Then ".sdd/_constitution/toolchain.md" has the rows <rows>
  And every row states detected (yes/no), version, path or endpoint, and the fallback in use
  Examples:
    | host        | rows                                                                                 |
    | Claude Code | node, git, Claude Code, ripwire, Serena, ast-grep, Context7, DeepWiki                |
    | OpenCode    | node, git, OpenCode, ripwire, Serena, ast-grep, Context7, DeepWiki, sdd CLI          |
```

```gherkin
@eval
Scenario: C002-TS-512 — toolchain record written by init on OpenCode
  Given machine configuration "cfg-full" on OpenCode and a repository without ".sdd/"
  When P-01 runs the init command and the baseline survey completes
  Then ".sdd/_constitution/toolchain.md" has the OpenCode row and the sdd CLI row
```

## C002-REQ-508

#### C002-AC-508.1 — A host version other than the tested one is `untested`
```gherkin
@eval
Scenario Outline: C002-TS-513 — host versions against the tested versions
  Given the doctor of the <package> target package, whose doctor remedies table records the tested versions of the fixture
  And the host reports <detected>
  When P-01 runs the doctor command
  Then the row "<row>" shows status "<status>"
  And <fix>
  Examples:
    | package  | row                              | detected                                        | status   | fix                                                 |
    | OpenCode | OpenCode                         | OpenCode "1.4.2"                                | ok       | its Fix column is empty                             |
    | OpenCode | OpenCode                         | OpenCode "1.5.0"                                | untested | its Fix column names "1.4.2"                        |
    | OpenCode | OpenCode                         | OpenCode "1.4.1"                                | untested | its Fix column names "1.4.2"                        |
    | Copilot  | VS Code with GitHub Copilot Chat | VS Code "1.105.1" and GitHub Copilot Chat "0.32.4" | ok    | its Version column shows "1.105.1" and "0.32.4" and its Fix column is empty |
    | Copilot  | VS Code with GitHub Copilot Chat | VS Code "1.106.0" and GitHub Copilot Chat "0.32.4" | untested | its Fix column names "1.105.1" and "0.32.4"     |
    | Copilot  | VS Code with GitHub Copilot Chat | VS Code "1.105.1" and GitHub Copilot Chat "0.33.0" | untested | its Fix column names "1.105.1" and "0.32.4"     |
```

```gherkin
@eval
Scenario: C002-TS-514 — untested is a warning
  Given OpenCode reports version "1.5.0", the tested version is "1.4.2" and every other row is ok
  When P-01 runs the doctor command on OpenCode
  Then the doctor run reports "completed with warnings"
```

## C002-REQ-509

#### C002-AC-509.1 — An sdd CLI that does not match major, minor and patch is an error with the install command
```gherkin
@eval
Scenario Outline: C002-TS-515 — CLI version against the target package version
  Given the OpenCode target package of version "0.3.0" and "sdd --version" reporting "<cli>"
  When P-01 runs the doctor command on OpenCode
  Then the sdd CLI row shows status "<status>"
  And <fix>
  Examples:
    | cli   | status | fix                                                                         |
    | 0.3.0 | ok     | its Fix column is empty                                                     |
    | 0.2.0 | error  | its Fix column holds the npm command that installs "architect-sdd" version "0.3.0" |
    | 0.3.1 | error  | its Fix column holds the npm command that installs "architect-sdd" version "0.3.0" |
    | 0.4.0 | error  | its Fix column holds the npm command that installs "architect-sdd" version "0.3.0" |
    | 1.3.0 | error  | its Fix column holds the npm command that installs "architect-sdd" version "0.3.0" |
```

## C002-REQ-510

#### C002-AC-510.1 — Copilot hooks row is `ok` only when hooks are read as enabled
```gherkin
@manual-vscode @mode-hooks
Scenario Outline: C002-TS-516 — hooks state in the VS Code doctor
  Given in VS Code <state>
  When P-01 runs the doctor prompt
  Then the Copilot hooks row shows status "<status>"
  Examples:
    | state                                              | status |
    | hooks are enabled and the workspace is trusted     | ok     |
    | "chat.useHooks" is false                           | error  |
    | the workspace is in restricted mode (not trusted)  | error  |
```

```gherkin
@eval @mode-hooks
Scenario: C002-TS-526 — hooks state that cannot be read
  Given the doctor of the Copilot target package, in a user profile without the VS Code settings that "sdd host-version vscode" reads, so that it prints "hooks unknown"
  When P-01 runs the doctor command
  Then the Copilot hooks row shows status "error"
  And it does not show status "ok"
  And the doctor run reports "completed with warnings"
```

## C002-REQ-511

#### C002-AC-511.1 — `sdd --version` prints the bare version
```gherkin
Scenario Outline: C002-TS-517 — bare version from each CLI
  Given the "architect-sdd" tarball of version "0.3.0" is installed globally into a clean prefix
  When P-01 runs "<command>"
  Then the exit code is 0
  And standard output is exactly the one line "0.3.0"
  And standard error is empty
  Examples:
    | command                                          |
    | sdd --version                                    |
    | node plugins/architect/scripts/sdd.mjs --version |
```

```gherkin
Scenario: C002-TS-518 — the version command keeps its form
  Given the "architect-sdd" tarball of version "0.3.0" is installed globally into a clean prefix
  When P-01 runs "sdd version"
  Then standard output is "architect-plugin@0.3.0"
```

## C002-REQ-512

#### C002-AC-512.1 — The tarball ships every template and the read-only mode file
```gherkin
Scenario: C002-TS-519 — templates and mode file in the tarball
  Given "npm run package" has written "dist/architect-sdd-0.3.0.tgz"
  When the tarball's file list is compared with "plugins/architect/templates/" and "plugins/architect/serena/architect-read-only.yml"
  Then for every file "plugins/architect/templates/<path>" the tarball holds "package/templates/<path>"
  And each such file has the same SHA-256 as its source file, except the templates whose CLI invocations C002-REQ-518 rewrites (C002-TS-529)
  And it holds "package/serena/architect-read-only.yml" with the same SHA-256 as the source file
```

## C002-REQ-513

#### C002-AC-513.1 — `sdd template show` prefers the repository template, else the shipped one
```gherkin
Scenario Outline: C002-TS-520 — template lookup
  Given a copy of "fx-bootstrap" in which <override>
  When P-01 runs "sdd template show full/10-spec/70-dod.md" in it
  Then the exit code is 0
  And standard output is <output>
  Examples:
    | override                                                                          | output                                                                    |
    | ".sdd/_templates/" does not exist                                                 | byte-identical to "plugins/architect/templates/full/10-spec/70-dod.md"    |
    | ".sdd/_templates/full/10-spec/70-dod.md" holds "# Our DoD"                        | "# Our DoD"                                                               |
    | ".sdd/_templates/full/10-spec/" holds only "nfr.md"                               | byte-identical to "plugins/architect/templates/full/10-spec/70-dod.md"    |
```

## C002-REQ-514

#### C002-AC-514.1 — A template that exists nowhere, or a path that leaves the profile's template folder, is refused with ERR-CLI-019
```gherkin
Scenario Outline: C002-TS-521 — unknown template
  Given a copy of "fx-bootstrap" without ".sdd/_templates/"
  When P-01 runs "sdd template show <argument>" in it
  Then the exit code is 2
  And standard error starts with "ERR-CLI-019" and names the profile "<profile>" and the path "<path>"
  And standard output is empty
  Examples:
    | argument                 | profile | path                 |
    | full/10-spec/missing.md  | full    | 10-spec/missing.md   |
    | beta/ideation.md         | beta    | ideation.md          |
```

```gherkin
Scenario Outline: C002-TS-522 — path that leaves the profile's template folder
  Given a copy of "fx-bootstrap" whose ".sdd/_templates/full/" holds "10-spec/70-dod.md" and the symbolic link "link-out" to the root of that copy
  When P-01 runs "sdd template show <argument>" in it
  Then the exit code is <code>
  And <outcome>
  Examples:
    | argument                              | code | outcome                                                                                                   |
    | full/../../package.json               | 2    | standard error starts with "ERR-CLI-019" and names the profile "full", and standard output is empty       |
    | full/../../../.sdd/registry.json      | 2    | standard error starts with "ERR-CLI-019" and names the profile "full", and standard output is empty       |
    | full/../lite/10-spec/spec.md          | 2    | standard error starts with "ERR-CLI-019" and names the profile "full", and standard output is empty       |
    | full/link-out/package.json            | 2    | standard error starts with "ERR-CLI-019" and names the profile "full", and standard output is empty       |
    | full/10-spec/../10-spec/70-dod.md     | 0    | standard output is byte-identical to ".sdd/_templates/full/10-spec/70-dod.md" of the copy                 |
```

## C002-REQ-515

#### C002-AC-515.1 — `--user-data` puts Serena's data in the per-user data folder
```gherkin
Scenario Outline: C002-TS-523 — Serena configuration per platform
  Given a <platform> user profile with <environment>
  When P-01 runs "sdd serena-config <argument>" in a copy of "fx-bootstrap"
  Then the exit code is 0
  And "<config file>" exists with the Serena dashboard turned off
  And the copy of "fx-bootstrap" has no ".serena/" folder
  Examples:
    | platform | environment                                    | argument     | config file                                                  |
    | Windows  | "LOCALAPPDATA" = "C:/fx-home/AppData/Local"    | --user-data  | C:/fx-home/AppData/Local/architect-sdd/serena/serena_config.yml |
    | Linux    | "XDG_DATA_HOME" = "/fx-home/data"              | --user-data  | /fx-home/data/architect-sdd/serena/serena_config.yml         |
    | Linux    | "XDG_DATA_HOME" unset, "HOME" = "/fx-home"     | --user-data  | /fx-home/.local/share/architect-sdd/serena/serena_config.yml |
    | macOS    | "HOME" = "/Users/fx"                           | --user-data  | /Users/fx/Library/Application Support/architect-sdd/serena/serena_config.yml |
    | Windows  | "LOCALAPPDATA" = "C:/fx-home/AppData/Local"    | C:/fx-plugin-data | C:/fx-plugin-data/serena/serena_config.yml             |
```

```gherkin
Scenario: C002-TS-524 — Serena started with the per-user data folder
  Given a Windows user profile with "LOCALAPPDATA" = "C:/fx-home/AppData/Local"
  And a stub "serena" executable on PATH that records its environment and arguments
  When P-01 runs "sdd serena-launch --user-data -- start-mcp-server --project ." in a copy of "fx-bootstrap"
  Then the stub records "SERENA_HOME" = "C:/fx-home/AppData/Local/architect-sdd/serena"
  And it records the arguments "start-mcp-server", "--project", "."
  And "C:/fx-home/AppData/Local/architect-sdd/serena/serena_config.yml" exists
  And the copy of "fx-bootstrap" has no ".serena/" folder
```

## C002-REQ-516

#### C002-AC-516.1 — Per-user data folder not determinable, relative or inside the repository: ERR-CLI-020, nothing written, Serena not started
```gherkin
Scenario Outline: C002-TS-525 — per-user data folder refused
  Given a copy of "fx-bootstrap" at "<copy>"
  And a <platform> user profile with <environment>
  And a stub "serena" executable on PATH that records each start
  When P-01 runs "<command>" in that copy
  Then the exit code is 2
  And standard error starts with "ERR-CLI-020"
  And no file "serena_config.yml" was written anywhere under the temporary user profile or the copy of "fx-bootstrap"
  And the stub records no start
  Examples:
    | platform | copy             | environment                                                | command                                                  |
    | Windows  | C:/fx-work/repo  | "LOCALAPPDATA" unset                                       | sdd serena-config --user-data                            |
    | Windows  | C:/fx-work/repo  | "LOCALAPPDATA" unset                                       | sdd serena-launch --user-data -- start-mcp-server        |
    | Linux    | /fx-work/repo    | "XDG_DATA_HOME" and "HOME" unset                           | sdd serena-launch --user-data -- start-mcp-server        |
    | Linux    | /fx-work/repo    | "XDG_DATA_HOME" = "data" (relative)                        | sdd serena-config --user-data                            |
    | Windows  | C:/fx-work/repo  | "LOCALAPPDATA" = "C:/fx-work/repo/AppData"                 | sdd serena-config --user-data                            |
    | Windows  | C:/fx-work/repo  | "LOCALAPPDATA" = "c:/FX-WORK/repo/AppData"                 | sdd serena-launch --user-data -- start-mcp-server        |
    | Linux    | /fx-work/repo    | "XDG_DATA_HOME" = "/fx-work/repo/.data"                    | sdd serena-launch --user-data -- start-mcp-server        |
    | macOS    | /fx-work/repo    | "HOME" = "/fx-work/repo"                                   | sdd serena-config --user-data                            |
```

```gherkin
Scenario: C002-TS-533 — per-user data folder beside the repository is accepted
  Given a copy of "fx-bootstrap" at "C:/fx-work/repo"
  And a Windows user profile with "LOCALAPPDATA" = "C:/fx-work/repo-data"
  When P-01 runs "sdd serena-config --user-data" in that copy
  Then the exit code is 0
  And "C:/fx-work/repo-data/architect-sdd/serena/serena_config.yml" exists
```

## C002-REQ-517

#### C002-AC-517.1 — Serena commands allowed only with `--user-data` or a data folder outside the repository
```gherkin
Scenario Outline: C002-TS-527 — bash guard decisions on the Serena commands
  Given the repository root "C:/repo", the folder "C:/fx-data" outside it, and the symbolic link "C:/repo-link" to "C:/repo"
  And hook input for tool "<tool>" by agent "architect:sdd-planner" with the working directory "C:/repo" and the command "<command>"
  When the bash guard evaluates it
  Then the exit code is <code>
  And standard error <stderr>
  Examples:
    | tool       | command                                                             | code | stderr                    |
    | Bash       | sdd serena-config --user-data                                       | 0    | is empty                  |
    | Bash       | sdd serena-launch --user-data --read-only -- start-mcp-server       | 0    | is empty                  |
    | Bash       | sdd serena-config C:/fx-data                                        | 0    | is empty                  |
    | Bash       | node C:/p/scripts/sdd.mjs serena-launch C:/fx-data -- start-mcp-server | 0 | is empty                  |
    | PowerShell | sdd serena-config C:/fx-data                                        | 0    | is empty                  |
    | Bash       | sdd serena-config C:/repo/../fx-data                                | 0    | is empty                  |
    | Bash       | sdd serena-config C:/repo-data                                      | 0    | is empty                  |
    | Bash       | sdd serena-config src                                               | 2    | contains "GUARD-BASH-001" |
    | Bash       | sdd serena-config .                                                 | 2    | contains "GUARD-BASH-001" |
    | Bash       | sdd serena-config C:/repo/src                                       | 2    | contains "GUARD-BASH-001" |
    | Bash       | sdd serena-config c:/REPO/src                                       | 2    | contains "GUARD-BASH-001" |
    | Bash       | sdd serena-config C:/fx-data/../repo/src                            | 2    | contains "GUARD-BASH-001" |
    | Bash       | sdd serena-config C:/repo-link/src                                  | 2    | contains "GUARD-BASH-001" |
    | Bash       | sdd serena-launch C:/repo/.sdd -- start-mcp-server                  | 2    | contains "GUARD-BASH-001" |
    | Bash       | node C:/p/scripts/sdd.mjs serena-config C:/repo/src                 | 2    | contains "GUARD-BASH-001" |
    | PowerShell | sdd serena-launch src -- start-mcp-server                           | 2    | contains "GUARD-BASH-001" |
```

```gherkin
Scenario: C002-TS-528 — the Serena step of the Claude Code doctor stays allowed
  Given "CLAUDE_PLUGIN_DATA" is "C:/Users/fx/.claude/plugins/data/architect-inline" in the environment of the bash guard
  And hook input for tool "Bash" by agent "architect:sdd-conductor" with the working directory "C:/repo" and the Serena command line of step 1 of "plugins/architect/commands/doctor.md", in the form the conductor sends it on Claude Code (C002-IF-008 §1)
  When the bash guard evaluates it
  Then the exit code is 0
  And standard error is empty
```

## C002-REQ-518

#### C002-AC-518.1 — Shipped templates call the CLI as `sdd`
```gherkin
Scenario Outline: C002-TS-529 — hand-off template in the tarball
  Given line <line> of "plugins/architect/templates/<profile>/20-plan/handoff.md" reads "node <plugin-root>/scripts/sdd.mjs <arguments>"
  When "npm run package" writes "dist/architect-sdd-0.3.0.tgz"
  Then line <line> of "package/templates/<profile>/20-plan/handoff.md" in the tarball reads "sdd <arguments>"
  And that file contains neither "scripts/sdd.mjs" nor "<plugin-root>"
  And the source file "plugins/architect/templates/<profile>/20-plan/handoff.md" has the SHA-256 it had before the run
  Examples:
    | profile | line | arguments                                                             |
    | full    | 20   | task set <task-id> --status in-progress                               |
    | full    | 23   | defect add --ref <ID> --summary "<what is wrong>"                     |
    | lite    | 21   | task set <task-id> --status done --commit <sha> --note "<summary>"    |
    | lite    | 22   | task set <task-id> --status blocked --reason "<why>"                  |
```

```gherkin
Scenario: C002-TS-534 — shipped hand-off template read through the CLI
  Given the "architect-sdd" tarball of version "0.3.0" is installed globally into a clean prefix and a copy of "fx-bootstrap" has no ".sdd/_templates/"
  When P-01 runs "sdd template show full/20-plan/handoff.md" in that copy
  Then standard output holds the line "sdd task set <task-id> --status in-progress"
  And it does not contain "scripts/sdd.mjs"
```

## C002-REQ-519

#### C002-AC-519.1 — A plugin path of the CLI left in a shipped template stops the build
```gherkin
Scenario Outline: C002-TS-530 — plugin path in a template of the package
  Given the fixture "fx-plugin-tmpl" whose template "templates/<file>" holds "<text>" on line <line>
  When "npm run package" runs on that fixture
  Then the exit code is non-zero
  And the output holds the error ERR-BLD-002 naming the template "<file>" and line <line>, and containing "<construct>"
  Examples:
    | file                    | line | text                                                        | construct                   |
    | full/20-plan/plan.md    | 12   | The CLI lives at <plugin-root>/scripts/sdd.mjs.             | <plugin-root>/scripts/sdd.mjs |
    | lite/10-spec/spec.md    | 7    | Run ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs with "lint".      | ${CLAUDE_PLUGIN_ROOT}       |
```

```gherkin
Scenario: C002-TS-535 — templates without a plugin path pass
  Given the source plugin's templates hold no plugin path of the CLI other than the invocation lines that C002-REQ-518 rewrites
  When P-01 runs "npm run package"
  Then the exit code is 0
  And the output holds no message naming a template
```

## C002-REQ-520

#### C002-AC-520.1 — `sdd template list` prints every showable template path once, in code-point order
```gherkin
Scenario: C002-TS-531 — shipped templates only
  Given a copy of "fx-bootstrap" without ".sdd/_templates/"
  When P-01 runs "sdd template list lite" in it
  Then the exit code is 0
  And standard output has one line for each file under "plugins/architect/templates/lite/", giving its path relative to that folder with "/" as separator
  And the lines are in ascending code-point order, so that "00-ideation/ideation.md" is the first line and "ids.json" the last for the templates of plugin version "0.3.0"
```

```gherkin
Scenario: C002-TS-532 — repository templates merged, each path once
  Given a copy of "fx-bootstrap" whose ".sdd/_templates/lite/" holds "10-spec/spec.md" and "10-spec/Notes.md"
  When P-01 runs "sdd template list lite" in it
  Then standard output lists "10-spec/spec.md" exactly once
  And it lists "10-spec/Notes.md" on the line before "10-spec/dod.md"
  And for every printed line "<path>", "sdd template show lite/<path>" exits with code 0
```

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C002-REQ-501 | TS-501, TS-502 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-502 | TS-503 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-503 | TS-504 | TS-504 (PowerShell, node -v) | TS-504 (extra word) | TS-504, TS-505 | TS-504 | n/a | TS-504 (npx, sddx, chaining, redirection) |
| C002-REQ-504 | TS-506, TS-508 | TS-506 (Claude Code), TS-513 (two VS Code versions), TS-639 (`.cmd` shim under sdd MCP server enforcement) | n/a | TS-507, TS-639 | n/a | n/a | n/a |
| C002-REQ-505 | TS-509 | TS-509 (Claude Code) | TS-509 (node 18) | TS-509 | n/a | n/a | n/a |
| C002-REQ-506 | TS-510 | TS-510 (OpenCode) | TS-510 (2.1.295) | TS-510 | n/a | n/a | n/a |
| C002-REQ-507 | TS-511 | TS-512 (init) | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-508 | TS-513 | TS-513 (VS Code or GitHub Copilot Chat differs), TS-514 (outcome) | TS-513 (equal, older, newer) | TS-513 | n/a | n/a | n/a |
| C002-REQ-509 | TS-515 | TS-515 (older, newer) | TS-515 (equal, patch, minor and major differ) | TS-515 | n/a | n/a | n/a |
| C002-REQ-510 | TS-516 | TS-516 (two disabling sources) | TS-526 (state not readable) | TS-516, TS-526 | n/a | n/a | TS-526 (unread state never reported ok) |
| C002-REQ-511 | TS-517 | TS-517 (bundled CLI), TS-518 (`sdd version` unchanged) | TS-517 (exactly one line) | n/a | n/a | n/a | n/a |
| C002-REQ-512 | TS-519 | n/a | n/a | n/a: a missing file fails TS-519 and makes the lookup of C002-REQ-514 refuse it (TS-521) | n/a | n/a | n/a |
| C002-REQ-513 | TS-520 | TS-520 (repository override) | TS-520 (override folder without that file) | n/a: no template anywhere is C002-REQ-514 (TS-521) | n/a | n/a | n/a |
| C002-REQ-514 | TS-521 | TS-521 (unknown profile) | TS-522 (`..` that stays inside the profile folder) | TS-521, TS-522 | n/a | n/a | TS-522 (`..` segments and a link leaving the profile's template folder) |
| C002-REQ-515 | TS-523, TS-524 | TS-523 (four platform rules, positional folder unchanged) | TS-523 (XDG_DATA_HOME unset) | n/a: a folder that cannot be determined, is relative or lies inside the repository is C002-REQ-516 (TS-525) | n/a | n/a | TS-523, TS-524 (no `.serena/` in the repository) |
| C002-REQ-516 | TS-525 | TS-525 (serena-config and serena-launch, four platforms) | TS-525 (case-different path inside the repository), TS-533 (folder beside the repository sharing its name prefix) | TS-525 | n/a | n/a | TS-525 (environment variable pointing into the repository, relative value) |
| C002-REQ-517 | TS-527 | TS-527 (`--user-data`, script form, PowerShell), TS-528 (Claude Code doctor step) | TS-527 (`..` leaving and re-entering the repository, sibling folder `C:/repo-data`) | TS-527 | TS-527 | n/a | TS-527 (folder inside the repository through a relative path, a case change, `..` or a link) |
| C002-REQ-518 | TS-529 | TS-529 (both profiles, `task set` and `defect add`), TS-534 (read through `sdd template show`) | n/a | n/a: a plugin path left in a shipped template is C002-REQ-519 (TS-530) | n/a | n/a | n/a |
| C002-REQ-519 | TS-530 | TS-535 (no plugin path left) | n/a | TS-530 | n/a | n/a | n/a |
| C002-REQ-520 | TS-531 | TS-532 (repository templates merged) | TS-532 (path in both places listed once; upper case before lower case) | n/a: the requirement states no failure path; an unknown profile prints no line | n/a | n/a | n/a |

Per-column n/a reasons. *Alternate*: one expected path. *Boundary*: no numeric limit in the
requirement. *Error*: packaging and record rules fail through the build or the doctor outcome tested
in C002-TS-509. *Authorization*: the doctor and the CLI run for the local user; only the allowlist is
an authorization rule. *Concurrency/idempotency*: one doctor run per session; repeated runs rewrite
`toolchain.md` with the same rows. *Abuse*: the doctor and packaging take no external input; the
allowlist carries the misuse cases. The organisation-policy source of C002-REQ-510 is not in
C002-TS-516 because the detection of each source is open for spike S-08 (requirement open item); the
test plan adds it once the detection is known.
