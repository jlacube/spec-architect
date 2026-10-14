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
  the machine configurations of C001-CAP-10 extended with the fixtures named here; passes in 9 of 10
  runs (DOD-G-01).
- `@manual-vscode`: a step of the manual VS Code checklist (C002-REQ-614), passed by its checklist
  record (C002-REQ-615); the doctor in VS Code runs in Copilot Chat, which no script drives.
- `@mode-hooks`: applies only when the Copilot target package is generated for the Copilot hooks
  fallback.

Versions in the fixtures: plugin and `architect-sdd` "0.3.0"; the tested OpenCode version recorded in
the doctor remedies table of the fixture is "1.4.2".

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
@manual-vscode
Scenario: C002-TS-508 — doctor table in VS Code
  Given the toy change repository in VS Code with "architect-sdd" installed
  When P-01 runs the doctor prompt
  Then the table has a host row for VS Code with GitHub Copilot Chat and a row for the sdd CLI
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
Scenario Outline: C002-TS-513 — OpenCode version against the tested version
  Given OpenCode reports version "<detected>" and the tested version in the doctor remedies table is "1.4.2"
  When P-01 runs the doctor command on OpenCode
  Then the OpenCode row shows status "<status>"
  And <fix>
  Examples:
    | detected | status   | fix                                         |
    | 1.4.2    | ok       | its Fix column is empty                     |
    | 1.5.0    | untested | its Fix column names "1.4.2"                |
    | 1.4.1    | untested | its Fix column names "1.4.2"                |
```

```gherkin
@eval
Scenario: C002-TS-514 — untested is a warning
  Given OpenCode reports version "1.5.0", the tested version is "1.4.2" and every other row is ok
  When P-01 runs the doctor command on OpenCode
  Then the doctor run reports "completed with warnings"
```

## C002-REQ-509

#### C002-AC-509.1 — An sdd CLI of another version is an error with the install command
```gherkin
@eval
Scenario: C002-TS-515 — CLI older than the target package
  Given the OpenCode target package of version "0.3.0" and "sdd --version" reporting "0.2.0"
  When P-01 runs the doctor command on OpenCode
  Then the sdd CLI row shows status "error"
  And its Fix column holds the npm command that installs "architect-sdd" version "0.3.0"
```

## C002-REQ-510

#### C002-AC-510.1 — Copilot hooks row reports disabled hooks
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

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C002-REQ-501 | TS-501, TS-502 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-502 | TS-503 | n/a | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-503 | TS-504 | TS-504 (PowerShell, node -v) | TS-504 (extra word) | TS-504, TS-505 | TS-504 | n/a | TS-504 (npx, sddx, chaining, redirection) |
| C002-REQ-504 | TS-506, TS-508 | TS-506 (Claude Code) | n/a | TS-507 | n/a | n/a | n/a |
| C002-REQ-505 | TS-509 | TS-509 (Claude Code) | TS-509 (node 18) | TS-509 | n/a | n/a | n/a |
| C002-REQ-506 | TS-510 | TS-510 (OpenCode) | TS-510 (2.1.295) | TS-510 | n/a | n/a | n/a |
| C002-REQ-507 | TS-511 | TS-512 (init) | n/a | n/a | n/a | n/a | n/a |
| C002-REQ-508 | TS-513 | TS-514 (outcome) | TS-513 (equal, older, newer) | TS-513 | n/a | n/a | n/a |
| C002-REQ-509 | TS-515 | n/a | n/a: which version differences count is open (Q-cli-03 in the requirement) | TS-515 | n/a | n/a | n/a |
| C002-REQ-510 | TS-516 | TS-516 (two disabling sources) | n/a | TS-516 | n/a | n/a | n/a |

Per-column n/a reasons. *Alternate*: one expected path. *Boundary*: no numeric limit in the
requirement. *Error*: packaging and record rules fail through the build or the doctor outcome tested
in C002-TS-509. *Authorization*: the doctor and the CLI run for the local user; only the allowlist is
an authorization rule. *Concurrency/idempotency*: one doctor run per session; repeated runs rewrite
`toolchain.md` with the same rows. *Abuse*: the doctor and packaging take no external input; the
allowlist carries the misuse cases. The organisation-policy source of C002-REQ-510 is not in
C002-TS-516 because the detection of each source is open for spike S-08 (requirement open item); the
test plan adds it once the detection is known.
