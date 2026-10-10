---
id: C001-CAP-11
artifact: spec/acceptance
capability: "Packaging, safety and environment"
change: CHG-001
phase: 10-spec
status: draft
---

# C001-CAP-11 — Acceptance criteria and scenarios

Guard scenarios are executed by feeding hook-input JSON (C001-IF-07 §1) to
`node scripts/sdd.mjs guard-path` / `guard-bash` on stdin and checking the exit code and
stderr, plus an end-to-end check in a scripted session.

## C001-REQ-1101

#### C001-AC-1101.1 — Layout present
```gherkin
Scenario: C001-TS-1101 — plugin tree
  When the plugin structure check runs
  Then each path of C001-IF-08 §1 exists
  And ".claude-plugin/plugin.json" has name "architect", a semver version and a description
```

## C001-REQ-1102

#### C001-AC-1102.1 — Install from local marketplace
```gherkin
Scenario: C001-TS-1102 — marketplace install on Windows 11
  Given a fresh Windows 11 user profile with Claude Code and Node ≥ 20
  When the user adds the repository folder as a plugin marketplace and installs "architect" from it
  Then "architect" appears among installed plugins
  And the agent "architect:sdd-conductor" can be started with "claude --agent architect:sdd-conductor"
```

## C001-REQ-1103

#### C001-AC-1103.1 — Outside write denied
```gherkin
Scenario Outline: C001-TS-1103 — path guard decisions
  Given hook input for tool "<tool>" by agent "<agent>" targeting "<path>" in repository "C:/repo"
  When the path guard evaluates it
  Then the exit code is <code>
  Examples:
    | tool  | agent                      | path                         | code |
    | Write | architect:sdd-spec-writer  | C:/repo/.sdd/004-x/a.md      | 0    |
    | Write | architect:sdd-spec-writer  | C:/repo/src/app.ts           | 2    |
    | Edit  | architect:sdd-architect    | C:/repo/README.md            | 2    |
    | Write | (non-architect agent)      | C:/repo/src/app.ts           | 0    |
```

#### C001-AC-1103.2 — Message content
```gherkin
Scenario: C001-TS-1104 — denial message
  When the path guard denies a write to "C:/repo/src/app.ts"
  Then standard error contains "GUARD-PATH-001" and "src/app.ts" and ".sdd/"
```

## C001-REQ-1104

#### C001-AC-1104.1 — Traversal and case tricks denied
```gherkin
Scenario Outline: C001-TS-1105 — normalisation
  Given an Architect agent write to "<path>" in repository "C:/repo"
  When the path guard evaluates it
  Then the exit code is <code>
  Examples:
    | path                                   | code |
    | C:/repo/.sdd/../src/app.ts             | 2    |
    | C:/REPO/.SDD/004-x/a.md                | 0    |
    | C:/repo/.sdd/link-to-src/app.ts        | 2    |
    | D:/other/.sdd/a.md                     | 2    |
  And ".sdd/link-to-src" is a symbolic link to "C:/repo/src" in the fixture
```

## C001-REQ-1105

#### C001-AC-1105.1 — Fallback scope
```gherkin
Scenario: C001-TS-1106 — hook input without agent identity
  Given hook input without agent identification for a Write to "C:/repo/src/app.ts"
  And the session's main agent is "architect:sdd-conductor"
  When the path guard evaluates it
  Then the exit code is 2
  And for a session whose main agent is not the conductor the exit code is 0
```

## C001-REQ-1106

#### C001-AC-1106.1 — Allowlist decisions
```gherkin
Scenario Outline: C001-TS-1107 — bash guard
  Given an Architect agent requests the command "<cmd>"
  When the bash guard evaluates it
  Then the exit code is <code>
  Examples:
    | cmd                                                      | code |
    | node C:/p/scripts/sdd.mjs lint --json                    | 0    |
    | ripwire . --for="payment method" --token-budget=4000     | 0    |
    | ripwire --callers=createIntent --top-k=20                | 0    |
    | git log --oneline -20                                    | 0    |
    | ast-grep run --pattern 'app.get($A, $B)'                 | 0    |
    | git commit -m x                                          | 2    |
    | npm install                                              | 2    |
    | rm -rf src                                               | 2    |
    | ast-grep run --pattern 'x' --rewrite 'y' -U              | 2    |
```

## C001-REQ-1107

#### C001-AC-1107.1 — Chaining and redirection
```gherkin
Scenario Outline: C001-TS-1108 — compound commands
  Given an Architect agent requests the command "<cmd>"
  When the bash guard evaluates it
  Then the exit code is <code>
  Examples:
    | cmd                                              | code |
    | git log --oneline \| head -5                     | 0    |
    | git log > src/log.txt                            | 2    |
    | git status && rm -rf src                         | 2    |
    | echo $(cat secrets.txt)                          | 2    |
    | node sdd.mjs lint; curl http://x                 | 2    |
  And "head" is in the allowlist as a pipe target only
```

## C001-REQ-1108

#### C001-AC-1108.1 — Declared servers
```gherkin
Scenario: C001-TS-1109 — .mcp.json content
  When the plugin's ".mcp.json" is parsed
  Then it declares "context7" with url "https://mcp.context7.com/mcp"
  And "deepwiki" with url "https://mcp.deepwiki.com/mcp"
  And "serena" as a local command server
```

## C001-REQ-1109

#### C001-AC-1109.1 — Research tools only for the researcher
```gherkin
Scenario: C001-TS-1110 — research MCP scoping
  When the frontmatter of all ten agents is parsed
  Then only "sdd-researcher" has "tools" entries starting with "mcp__context7" or "mcp__deepwiki"
```

## C001-REQ-1110

#### C001-AC-1110.1 — Doctor table
```gherkin
Scenario: C001-TS-1111 — doctor on cfg-no-ripwire
  Given machine configuration "cfg-no-ripwire"
  When P-01 runs "/architect:doctor"
  Then the reply contains a table with 8 rows (node, git, ripwire, Serena, Archify, ast-grep, Context7, DeepWiki)
  And the ripwire row shows status "missing", the fallback, and the install command from C001-IF-10 §3
```

## C001-REQ-1111

#### C001-AC-1111.1 — Only node is fatal
```gherkin
Scenario Outline: C001-TS-1112 — doctor outcome
  Given "<situation>"
  When P-01 runs "/architect:doctor"
  Then the doctor run reports "<outcome>"
  Examples:
    | situation                                  | outcome |
    | DeepWiki endpoint unreachable              | completed with warnings |
    | Serena, Archify and ast-grep missing       | completed with warnings |
    | node 18 on PATH                            | failed: node ≥ 20 required |
```

## C001-REQ-1112

#### C001-AC-1112.1 — License file
```gherkin
Scenario: C001-TS-1113 — MIT license
  When "LICENSE" is read
  Then it contains "MIT License", "2026" and the copyright holder's name
  And ".claude-plugin/plugin.json" declares license "MIT"
```

## C001-REQ-1113

#### C001-AC-1113.1 — Notices complete
```gherkin
Scenario: C001-TS-1114 — notices match the bundle
  Given the bundle metadata produced by the build lists packages "yaml@2.x"
  When "THIRD_PARTY_NOTICES.md" is checked
  Then it lists every bundled package with version and license
```

## C001-REQ-1114

#### C001-AC-1114.1 — Non-permissive dependency fails the build
```gherkin
Scenario: C001-TS-1115 — GPL dependency
  Given a dev change adds a GPL-3.0 package imported by "sdd.mjs" sources
  When the build runs
  Then it exits non-zero naming the package and "GPL-3.0"
```

## C001-REQ-1115

#### C001-AC-1115.1 — README sections
```gherkin
Scenario: C001-TS-1116 — README completeness
  When the plugin structure check reads "README.md"
  Then it contains the headings Prerequisites, Install (Windows 11), Optional tools, Quickstart, Commands, Agents, Workspace layout, Troubleshooting, License
```

## C001-REQ-1116

#### C001-AC-1116.1 — Eval suite size and spread
```gherkin
Scenario: C001-TS-1117 — eval inventory
  When the eval suite definition is parsed
  Then it has at least 40 prompts
  And each of the ten agents has at least 3 "must route" prompts and at least 1 "must not route" prompt
```

## C001-REQ-1117

#### C001-AC-1117.1 — Check aggregates and fails
```gherkin
Scenario: C001-TS-1118 — npm run check
  Given one lint fixture is altered so that its expected error no longer occurs
  When the user runs "npm run check"
  Then the exit code is non-zero
  And the output shows the results of plugin validate, unit tests, lint fixtures and structure checks
```

## C001-REQ-1118

#### C001-AC-1118.1 — Portable skills
```gherkin
Scenario: C001-TS-1119 — tool names in skills
  Given "skills/ears-requirements/SKILL.md" mentions "AskUserQuestion" in a section "Examples"
  When the plugin structure check runs
  Then it reports "PLG-PORT-001" for that file
  And a mention inside a section titled "Claude Code wiring" is not reported
```

## C001-REQ-1119

#### C001-AC-1119.1 — Workflows dormant
```gherkin
Scenario: C001-TS-1120 — workflow triggers
  When the files under ".github/workflows/" are parsed
  Then together they cover "windows-latest", "macos-latest" and "ubuntu-latest" running "npm run check"
  And every workflow's "on" key contains only "workflow_dispatch"
```

## C001-REQ-1120

#### C001-AC-1120.1 — Absolute paths detected
```gherkin
Scenario: C001-TS-1121 — machine path in a skill
  Given "skills/code-discovery/SKILL.md" contains "C:\\Users\\jerom\\tools\\ripwire.exe"
  When the plugin structure check runs
  Then it reports "PLG-PATH-001" for that file and line
```

## C001-REQ-1121

#### C001-AC-1121.1 — Hook command form
```gherkin
Scenario: C001-TS-1122 — hooks.json commands
  When "hooks/hooks.json" is parsed
  Then every hook command starts with "node \"${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs\""
  And contains none of "&&", "||", ";", "|", ">", "$(", "`"
```

## C001-REQ-1122

#### C001-AC-1122.1 — Duplication detected
```gherkin
Scenario: C001-TS-1123 — duplicated procedure
  Given "commands/specify.md" and "agents/sdd-conductor.md" share 14 identical consecutive lines
  When the plugin structure check runs
  Then it reports "PLG-DUP-001" naming both files
```

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C001-REQ-1101 | TS-1101 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-1102 | TS-1102 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-1103 | TS-1103 | TS-1103 (non-architect agent) | n/a | TS-1104 | TS-1103 | n/a | TS-1105 |
| C001-REQ-1104 | TS-1105 | n/a | TS-1105 (case) | n/a | TS-1105 | n/a | TS-1105 |
| C001-REQ-1105 | TS-1106 | TS-1106 | n/a | n/a | TS-1106 | n/a | n/a |
| C001-REQ-1106 | TS-1107 | n/a | n/a | TS-1107 | TS-1107 | n/a | TS-1107 |
| C001-REQ-1107 | TS-1108 | TS-1108 (pipe to head) | n/a | TS-1108 | n/a | n/a | TS-1108 |
| C001-REQ-1108 | TS-1109 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-1109 | TS-1110 | n/a | n/a | n/a | TS-1110 | n/a | n/a |
| C001-REQ-1110 | TS-1111 | n/a | n/a | TS-1111 | n/a | n/a | n/a |
| C001-REQ-1111 | TS-1112 | TS-1112 | TS-1112 (node version) | TS-1112 | n/a | n/a | n/a |
| C001-REQ-1112 | TS-1113 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-1113 | TS-1114 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-1114 | TS-1115 | n/a | n/a | TS-1115 | n/a | n/a | n/a |
| C001-REQ-1115 | TS-1116 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-1116 | TS-1117 | n/a | TS-1117 (≥40, ≥3/agent) | n/a | n/a | n/a | n/a |
| C001-REQ-1117 | TS-1118 | n/a | n/a | TS-1118 | n/a | n/a | n/a |
| C001-REQ-1118 | TS-1119 | TS-1119 (wiring section) | n/a | TS-1119 | n/a | n/a | n/a |
| C001-REQ-1119 | TS-1120 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-1120 | TS-1121 | n/a | n/a | TS-1121 | n/a | n/a | n/a |
| C001-REQ-1121 | TS-1122 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-1122 | TS-1123 | n/a | n/a | TS-1123 | n/a | n/a | n/a |

Per-column n/a reasons: as in CAP-05. Concurrency is n/a because guards are stateless
per call.
