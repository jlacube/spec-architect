---
capability: packaging-safety
inventory_only: false
updated: 2026-11-16
---

# Packaging, safety, environment (`C001-CAP-11`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

How the plugin is built, validated and shipped (bundle, license allowlist, structure checks,
manifests), the hooks that guard Bash and file writes and give workspace feedback, the doctor
command, and the security and injection test corpora.

## Entry points

- Hooks declared in `plugins/architect/hooks/hooks.json`: `guard-path` and `guard-bash`
  (PreToolUse), `hook post-write` (PostToolUse), `hook session-start` (SessionStart).
- Command `plugins/architect/commands/doctor.md`.
- npm scripts `build`, `check`, `package` (`package.json`), implemented by `scripts/build.mjs`,
  `scripts/check.mjs`, `scripts/package.mjs`.

## Main modules

- `src/hooks/` — `guard-bash.ts`, `guard-path.ts`, `post-write.ts`, `session-start.ts`, `input.ts`.
- `scripts/` — `build.mjs` (bundles `plugins/architect/scripts/sdd.mjs`), `check/*.mjs` (structure
  checks: layout, hooks, mcp, readme, port, size, tools, ci, dup, path, rules, evals),
  `licenses.mjs`, `package.mjs`, `test.mjs`.
- Manifests `plugins/architect/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`,
  `plugins/architect/THIRD_PARTY_NOTICES.md`.
- `src/cli/errors.ts`, `src/cli/output.ts` (error codes and output).
- `bench/guards.mjs`, `bench/session-start.mjs`, `bench/faults.mjs`.

## Owning tests

- `tests/integration/cap11/` (`TS-1101` … `TS-1123`, `hooks-feedback.test.ts`, `structure.ts`).
- `tests/guards/` (`bash-corpus.test.ts`, `path-corpus.test.ts` and their JSON corpora),
  `tests/fixtures/secrets/corpus.json`.
- Evals: `evals/cap11/`, `evals/injection/`.

## Evidence

- **E-1** `src/hooks/guard-bash.ts:208` › `decideBash()` — decides allow or deny for a Bash command.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/hooks/guard-path.ts:45` › `decidePath()` — decides allow or deny for a file write.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/hooks/session-start.ts:20` › `sessionBrief()` — builds the session-start brief.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-4** `plugins/architect/hooks/hooks.json:3` › `hooks` — wires the guards and the feedback hooks.
  - layer: grep (file read) · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-5** `scripts/check.mjs:15` › `STEPS` — the `npm run check` pipeline (typecheck, validate, build, tests, fixtures, structure).
  - layer: grep (file read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127

## Requirements

### C001-REQ-1101 — Plugin layout
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE plugin SHALL follow the directory layout of C001-IF-08 §1, including `.claude-plugin/plugin.json`, `agents/`, `skills/`, `commands/`, `hooks/hooks.json`, `.mcp.json`, `scripts/sdd.mjs`, `templates/`, `LICENSE`, `README.md` and `THIRD_PARTY_NOTICES.md`.
- **Rationale:** OA-02 option C; C001-CON-03
- **Stories:** C001-US-1101
- **Priority:** Must
- **Acceptance:** C001-AC-1101.1

#### C001-AC-1101.1 — Layout present
```gherkin
Scenario: C001-TS-1101 — plugin tree
  When the plugin structure check runs
  Then each path of C001-IF-08 §1 exists
  And ".claude-plugin/plugin.json" has name "architect", a semver version and a description
```

### C001-REQ-1102 — Local marketplace
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE repository SHALL contain a marketplace manifest at `.claude-plugin/marketplace.json` that lists the `architect` plugin by relative path, so that adding the repository as a marketplace and installing `architect` from it succeeds.
- **Rationale:** OQ-18 (local marketplace now, public later)
- **Stories:** C001-US-1101
- **Priority:** Must
- **Acceptance:** C001-AC-1102.1

#### C001-AC-1102.1 — Install from local marketplace
```gherkin
Scenario: C001-TS-1102 — marketplace install on Windows 11
  Given an isolated Claude profile on Windows 11 (C001-SPEC-NFR, "Isolated Claude profile") with Claude Code and Node ≥ 20
  When the user adds the repository folder as a plugin marketplace and installs "architect" from it
  Then "architect" appears among installed plugins
  And the agent "architect:sdd-conductor" can be started with "claude --agent architect:sdd-conductor"
```

### C001-REQ-1103 — Path guard
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN an Architect agent requests Write, Edit or NotebookEdit on a path outside both the `.sdd/` folder of the current repository and that agent's own memory folder `.claude/agent-memory/architect-<agent>/`, THE path guard SHALL deny the call (exit code 2) with a message naming the path and the rule `GUARD-PATH-001`.
- **Rationale:** C001-CON-01; D-02; agent memory of C001-IF-09 (`memory: project`), which Claude Code saves with Write in the repository (defect D-007)
- **Stories:** C001-US-1102
- **Priority:** Must
- **Acceptance:** C001-AC-1103.1, C001-AC-1103.2

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
    | Write | architect:sdd-cartographer | C:/repo/.claude/agent-memory/architect-sdd-cartographer/MEMORY.md | 0 |
    | Write | architect:sdd-researcher   | C:/repo/.claude/agent-memory/architect-sdd-cartographer/MEMORY.md | 2 |
```

#### C001-AC-1103.2 — Message content
```gherkin
Scenario: C001-TS-1104 — denial message
  When the path guard denies a write to "C:/repo/src/app.ts"
  Then standard error contains "GUARD-PATH-001" and "src/app.ts" and ".sdd/"
```

### C001-REQ-1104 — Path normalisation in the guard
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a write target resolves outside `.sdd/` after normalising `..` segments, case (on Windows), drive letters and symbolic links, THEN THE path guard SHALL deny the call even when the unnormalised path starts with `.sdd/`.
- **Rationale:** abuse resistance (path traversal)
- **Stories:** C001-US-1102
- **Priority:** Must
- **Acceptance:** C001-AC-1104.1

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

### C001-REQ-1106 — Bash allowlist
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN an Architect agent requests a Bash or PowerShell command, THE bash guard SHALL allow it only if it matches an entry of the allowlist in C001-IF-07 §3, and deny it otherwise with rule `GUARD-BASH-001`.
- **Rationale:** IDEA-§17.2
- **Stories:** C001-US-1103
- **Priority:** Must
- **Acceptance:** C001-AC-1106.1

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
    | ripwire . --callers=createIntent --limit=50              | 0    |
    | ripwire . --max-tokens=4000                              | 0    |
    | ripwire . --test-gate=src/checkout/payments.ts --limit=50 | 0   |
    | git log --oneline -20                                    | 0    |
    | ast-grep run --pattern 'app.get($A, $B)'                 | 0    |
    | git commit -m x                                          | 2    |
    | npm install                                              | 2    |
    | rm -rf src                                               | 2    |
    | ast-grep run --pattern 'x' --rewrite 'y' -U              | 2    |
    | ripwire .                                                | 2    |
```

```gherkin
Scenario Outline: C001-TS-1125 — ripwire forms in the bash guard corpus
  The rows below join the bash guard corpus "tests/guards/bash-corpus.json" (test data the
  implementer writes, category "ripwire") and apply the ripwire forms of C001-IF-07 §3.1 (defect D-012).
  The Examples table has 18 rows; `--max-tokens=N` is the only map bound.
  Given an Architect agent requests the <tool> command "<cmd>"
  When the bash guard evaluates it
  Then the exit code is <code>
  And standard error <stderr>
  Examples:
    | tool       | cmd                                                                  | code | stderr                     |
    | Bash       | ripwire . --max-tokens=4000                                          | 0    | is empty                   |
    | Bash       | ripwire --max-tokens=4000                                            | 0    | is empty                   |
    | Bash       | ripwire . --max-tokens=4000 --json                                   | 0    | is empty                   |
    | Bash       | ripwire . --test-gate=src/checkout/payments.ts --limit=50            | 0    | is empty                   |
    | Bash       | ripwire . --test-gate=src/checkout/payments.ts --limit=50 \| head -n 40 | 0 | is empty                   |
    | Bash       | ripwire --test-gate src/a.ts                                         | 0    | is empty                   |
    | Bash       | ripwire . --token-budget=4000                                        | 2    | contains "GUARD-BASH-001"  |
    | Bash       | ripwire . --max-tokens=x                                             | 2    | contains "GUARD-BASH-001"  |
    | Bash       | ripwire . --max-tokens                                               | 2    | contains "GUARD-BASH-001"  |
    | Bash       | ripwire . --limit=50                                                 | 2    | contains "GUARD-BASH-001"  |
    | Bash       | ripwire . --json                                                     | 2    | contains "GUARD-BASH-001"  |
    | Bash       | ripwire a b --max-tokens=4000                                        | 2    | contains "GUARD-BASH-001"  |
    | Bash       | ripwire . --max-tokens=4000 --edit=src/a.ts:1-2                      | 2    | contains "GUARD-BASH-001"  |
    | Bash       | ripwire . --test-gate= --limit=50                                    | 2    | contains "GUARD-BASH-001"  |
    | Bash       | ripwire . --test-gate src/a.ts --limit=50                            | 2    | contains "GUARD-BASH-001"  |
    | Bash       | ripwire . --test-gate=src/a.ts --situ                                | 2    | contains "GUARD-BASH-001"  |
    | Bash       | ripwire . --test-gate=a --test-gate=b                                | 2    | contains "GUARD-BASH-001"  |
    | PowerShell | ripwire . --max-tokens=4000                                          | 2    | contains "GUARD-BASH-001"  |
```

### C001-REQ-1107 — Compound shell commands
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a shell command requested by an Architect agent contains output redirection, command substitution, or a chained or piped segment that is not itself allowlisted, THEN THE bash guard SHALL deny it with rule `GUARD-BASH-002`.
- **Rationale:** abuse resistance (bypass via chaining)
- **Stories:** C001-US-1103
- **Priority:** Must
- **Acceptance:** C001-AC-1107.1

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

### C001-REQ-1108 — MCP servers declared by the plugin
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE plugin's `.mcp.json` SHALL declare the servers `context7` (remote, `https://mcp.context7.com/mcp`), `deepwiki` (remote, `https://mcp.deepwiki.com/mcp`) and `serena` (local, launched as specified by C001-REQ-1006).
- **Rationale:** Q11, OQ-04, D-03
- **Stories:** C001-US-1104
- **Priority:** Must
- **Acceptance:** C001-AC-1108.1

#### C001-AC-1108.1 — Declared servers
```gherkin
Scenario: C001-TS-1109 — .mcp.json content
  When the plugin's ".mcp.json" is parsed
  Then it declares "context7" with url "https://mcp.context7.com/mcp"
  And "deepwiki" with url "https://mcp.deepwiki.com/mcp"
  And "serena" as a local command server
```

### C001-REQ-1109 — Research MCP scoping
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE definitions of agents other than the researcher SHALL NOT grant tools whose names start with `mcp__plugin_architect_context7__` or `mcp__plugin_architect_deepwiki__`.
- **Rationale:** OQ-04 (researcher only); context cost
- **Stories:** C001-US-1104
- **Priority:** Must
- **Acceptance:** C001-AC-1109.1

#### C001-AC-1109.1 — Research tools only for the researcher
```gherkin
Scenario: C001-TS-1110 — research MCP scoping
  When the frontmatter of all ten agents is parsed
  Then only "sdd-researcher" has "tools" entries starting with "mcp__plugin_architect_context7" or "mcp__plugin_architect_deepwiki"
```

### C001-REQ-1110 — Doctor report
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `/architect:doctor` runs, THE conductor SHALL print a table with, for each of node, git, Claude Code, ripwire, Serena, ast-grep, Context7 and DeepWiki, its status (ok, missing, unreachable or error), version, fallback and, for non-ok tools, the install or fix command from C001-IF-10 §3.
- **Rationale:** C001-SC-09
- **Stories:** C001-US-1105
- **Priority:** Must
- **Acceptance:** C001-AC-1110.1

#### C001-AC-1110.1 — Doctor table
```gherkin
Scenario: C001-TS-1111 — doctor on cfg-no-ripwire
  Given machine configuration "cfg-no-ripwire"
  When P-01 runs "/architect:doctor"
  Then the reply contains a table with 8 rows (node, git, Claude Code, ripwire, Serena, ast-grep, Context7, DeepWiki)
  And the ripwire row shows status "missing", the fallback, and the install command from C001-IF-10 §3
```

### C001-REQ-1111 — Doctor never fails on optional tools
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF an optional tool is missing or a remote MCP server is unreachable, THEN THE conductor SHALL report it in the doctor table and complete the doctor run, reporting failure only when node is missing or older than version 20.
- **Rationale:** IDEA-P-10
- **Stories:** C001-US-1105
- **Priority:** Must
- **Acceptance:** C001-AC-1111.1

#### C001-AC-1111.1 — Only node is fatal
```gherkin
Scenario Outline: C001-TS-1112 — doctor outcome
  Given "<situation>"
  When P-01 runs "/architect:doctor"
  Then the doctor run reports "<outcome>"
  Examples:
    | situation                                  | outcome |
    | DeepWiki endpoint unreachable              | completed with warnings |
    | Serena and ast-grep missing                | completed with warnings |
    | node 18 on PATH                            | failed: node ≥ 20 required |
```

### C001-REQ-1112 — MIT license
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE repository SHALL contain a `LICENSE` file with the MIT license text, the year 2026 and the copyright holder's name.
- **Rationale:** Spec-Q2
- **Stories:** C001-US-1106
- **Priority:** Must
- **Acceptance:** C001-AC-1112.1

#### C001-AC-1112.1 — License file
```gherkin
Scenario: C001-TS-1113 — MIT license
  When "LICENSE" is read
  Then it contains "MIT License", "2026" and the copyright holder's name
  And ".claude-plugin/plugin.json" declares license "MIT"
```

### C001-REQ-1113 — Third-party notices
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE repository SHALL contain `THIRD_PARTY_NOTICES.md` listing every package bundled into `scripts/sdd.mjs` with its version and license.
- **Rationale:** license compliance of bundled dependencies (OA-12 option B)
- **Stories:** C001-US-1106
- **Priority:** Must
- **Acceptance:** C001-AC-1113.1

#### C001-AC-1113.1 — Notices complete
```gherkin
Scenario: C001-TS-1114 — notices match the bundle
  Given the bundle metadata produced by the build lists packages "yaml@2.x"
  When "THIRD_PARTY_NOTICES.md" is checked
  Then it lists every bundled package with version and license
```

### C001-REQ-1114 — Permissive dependencies only
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a package bundled into `scripts/sdd.mjs` has a license outside the allowlist MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0 and 0BSD, THEN THE build SHALL fail with a message naming the package and its license.
- **Rationale:** C001-CON-05
- **Stories:** C001-US-1106
- **Priority:** Must
- **Acceptance:** C001-AC-1114.1

#### C001-AC-1114.1 — Non-permissive dependency fails the build
```gherkin
Scenario: C001-TS-1115 — GPL dependency
  Given a dev change adds a GPL-3.0 package imported by "sdd.mjs" sources
  When the build runs
  Then it exits non-zero naming the package and "GPL-3.0"
```

### C001-REQ-1115 — README content
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE README SHALL contain the sections Prerequisites, Install (Windows 11), Optional tools, Quickstart, Commands, Agents, Workspace layout, Troubleshooting and License.
- **Rationale:** C001-SC-09
- **Stories:** C001-US-1106
- **Priority:** Must
- **Acceptance:** C001-AC-1115.1

#### C001-AC-1115.1 — README sections
```gherkin
Scenario: C001-TS-1116 — README completeness
  When the plugin structure check reads "README.md"
  Then it contains the headings Prerequisites, Install (Windows 11), Optional tools, Quickstart, Commands, Agents, Workspace layout, Troubleshooting, License
```

### C001-REQ-1116 — Delegation eval suite
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE repository SHALL contain a `claude plugin eval` suite of at least 40 prompts with at least three prompts that must route to each of the ten agents and at least one prompt per agent that must not route to it.
- **Rationale:** C001-SC-05; IDEA-§14.4
- **Note:** The conductor is not meant to be spawned as a subagent (C001-IF-09 A0); it runs as the main session (C001-REQ-201). A prompt therefore counts as routed to the conductor when the last reply contains the literal `claude --agent architect:sdd-conductor` and no Architect subagent starts. A must-route prompt of the conductor fails otherwise; a must-not-route prompt of the conductor fails when the last reply contains that literal. The minimum of three must-route prompts and one must-not-route prompt per agent applies to the conductor unchanged (D-016; Q-conductor-route-01).
- **Stories:** C001-US-1107
- **Priority:** Must
- **Acceptance:** C001-AC-1116.1

#### C001-AC-1116.1 — Eval suite size and spread
```gherkin
Scenario: C001-TS-1117 — eval inventory
  When the eval suite definition is parsed
  Then it has at least 40 prompts
  And each of the ten agents has at least 3 "must route" prompts and at least 1 "must not route" prompt
  And each "must route" prompt of the conductor declares one check that its last reply contains the literal "claude --agent architect:sdd-conductor" and one check that allows 0 Architect subagent starts
  And each "must not route" prompt of the conductor declares one check that fails when its last reply contains the literal "claude --agent architect:sdd-conductor"
```

### C001-REQ-1117 — Local check command
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `npm run check` runs in the repository, THE build SHALL run `claude plugin validate`, the unit tests, the lint fixture suite and the plugin structure checks of C001-IF-08 §3, and exit non-zero if any of them fails.
- **Rationale:** IDEA-RK-12
- **Stories:** C001-US-1107
- **Priority:** Must
- **Acceptance:** C001-AC-1117.1

#### C001-AC-1117.1 — Check aggregates and fails
```gherkin
Scenario: C001-TS-1118 — npm run check
  Given one lint fixture is altered so that its expected error no longer occurs
  When the user runs "npm run check"
  Then the exit code is non-zero
  And the output shows the results of plugin validate, unit tests, lint fixtures and structure checks
```

### C001-REQ-1118 — Portable skills and templates
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a skill body or template contains a Claude-Code-specific tool reference (`AskUserQuestion`, `Agent(`, `TodoWrite`, `mcp__`) outside a section titled "Claude Code wiring", THEN THE plugin structure check SHALL report error `PLG-PORT-001`.
- **Rationale:** Q1 portable core; IDEA-P-12
- **Stories:** C001-US-1107, C001-US-1109
- **Priority:** Should
- **Acceptance:** C001-AC-1118.1

#### C001-AC-1118.1 — Portable skills
```gherkin
Scenario: C001-TS-1119 — tool names in skills
  Given "skills/ears-requirements/SKILL.md" mentions "AskUserQuestion" in a section "Examples"
  When the plugin structure check runs
  Then it reports "PLG-PORT-001" for that file
  And a mention inside a section titled "Claude Code wiring" is not reported
```

### C001-REQ-1119 — Dormant cross-platform CI
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE repository SHALL contain GitHub Actions workflow files that run `npm run check` on `windows-latest`, `macos-latest` and `ubuntu-latest` and declare `workflow_dispatch` as their only trigger.
- **Rationale:** Spec-Q4; C001-NG-07
- **Stories:** C001-US-1108
- **Priority:** Should
- **Acceptance:** C001-AC-1119.1

#### C001-AC-1119.1 — Workflows dormant
```gherkin
Scenario: C001-TS-1120 — workflow triggers
  When the files under ".github/workflows/" are parsed
  Then together they cover "windows-latest", "macos-latest" and "ubuntu-latest" running "npm run check"
  And every workflow's "on" key contains only "workflow_dispatch"
```

### C001-REQ-1120 — No machine-specific paths
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a file of the plugin contains an absolute filesystem path (a Windows drive-letter path or a path starting with `/Users/` or `/home/`) outside documentation examples marked as such, THEN THE plugin structure check SHALL report error `PLG-PATH-001`.
- **Rationale:** C001-GOAL-08
- **Stories:** C001-US-1106
- **Priority:** Must
- **Acceptance:** C001-AC-1120.1

#### C001-AC-1120.1 — Absolute paths detected
```gherkin
Scenario: C001-TS-1121 — machine path in a skill
  Given "skills/code-discovery/SKILL.md" contains "C:\\Users\\jerom\\tools\\ripwire.exe"
  When the plugin structure check runs
  Then it reports "PLG-PATH-001" for that file and line
```

### C001-REQ-1121 — Shell-agnostic hook commands
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE commands in `hooks/hooks.json` SHALL invoke `node` with the script path `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs` and arguments only, without shell-specific operators or syntax.
- **Rationale:** Windows PowerShell and Git Bash compatibility (C001-CON-06)
- **Stories:** C001-US-1101
- **Priority:** Must
- **Acceptance:** C001-AC-1121.1

#### C001-AC-1121.1 — Hook command form
```gherkin
Scenario: C001-TS-1122 — hooks.json commands
  When "hooks/hooks.json" is parsed
  Then every hook command starts with "node \"${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs\""
  And contains none of "&&", "||", ";", "|", ">", "$(", "`"
```

### C001-REQ-1122 — Duplicate procedure check
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a command body and an agent body share more than 10 consecutive identical non-blank lines, THEN THE plugin structure check SHALL report error `PLG-DUP-001`.
- **Rationale:** OA-01 (one procedure in phase skills); referenced by C001-TS-205
- **Stories:** C001-US-1107
- **Priority:** Should
- **Acceptance:** C001-AC-1122.1

#### C001-AC-1122.1 — Duplication detected
```gherkin
Scenario: C001-TS-1123 — duplicated procedure
  Given "commands/specify.md" and "agents/sdd-conductor.md" share 14 identical consecutive lines
  When the plugin structure check runs
  Then it reports "PLG-DUP-001" naming both files
```

### C001-REQ-1123 — Minimum Claude Code version
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the Claude Code version reported by `claude --version` is lower than 2.1.295, THEN THE conductor SHALL show Claude Code with status `error` and the update command from C001-IF-10 §3 in the doctor table.
- **Rationale:** C001-AS-09, C001-AS-10; spike S-04 (Claude Code 2.0.76 passes no agent identity to hooks and fails on current models); replaces the guard fallback (former C001-REQ-1105), which hook input cannot support
- **Stories:** C001-US-1105
- **Priority:** Must
- **Acceptance:** C001-AC-1123.1

#### C001-AC-1123.1 — Outdated Claude Code reported
```gherkin
Scenario: C001-TS-1124 — Claude Code below the minimum version
  Given "claude --version" reports "2.0.76 (Claude Code)"
  When P-01 runs "/architect:doctor"
  Then the Claude Code row shows status "error", version "2.0.76" and the update command from C001-IF-10 §3
  And the doctor run reports "completed with warnings"
```

### C001-REQ-1124 — Plugin files only through the CLI or skill bodies
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF an agent, command or skill body names a plugin file to read (a `${CLAUDE_PLUGIN_ROOT}/` path other than `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs`, a path containing `references/`, or a relative link target that resolves to a file of the plugin), THEN THE plugin structure check SHALL report error `PLG-TMPL-001`.
- **Rationale:** D-019 item 2; Q-t082-bugs-01; C001-IF-08 §4; critic CR-32
- **Stories:** C001-US-1107
- **Priority:** Must
- **Acceptance:** C001-AC-1124.1

#### C001-AC-1124.1 — Plugin files named in bodies detected
```gherkin
Scenario Outline: C001-TS-1126 — plugin file named in a body: <construct>
  Given a copy of the shipped plugin in which "<file>" gains <addition>
  When the plugin structure check runs on the copy
  Then the check's "PLG-TMPL-001" findings are exactly <findings>

  Examples:
    | construct | file | addition | findings |
    | template path under the plugin root | agents/sdd-spec-writer.md | the line "Read `${CLAUDE_PLUGIN_ROOT}/templates/lite/10-spec/spec.md` before drafting." | one error for "agents/sdd-spec-writer.md" at the added line |
    | other plugin-root path | skills/phase-spec/SKILL.md | the line "Read `${CLAUDE_PLUGIN_ROOT}/skills/sdd-conventions/SKILL.md` first." | one error for "skills/phase-spec/SKILL.md" at the added line |
    | references/ path | skills/interview-protocol/SKILL.md | the line "Validate the block against `references/questions.schema.json`." | one error for "skills/interview-protocol/SKILL.md" at the added line |
    | relative link into the plugin | commands/specify.md | the line "See [the conventions](../skills/sdd-conventions/SKILL.md)." | one error for "commands/specify.md" at the added line |
    | the CLI path only | agents/sdd-spec-writer.md | the line "Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs lint 001`." | none |
    | template through the CLI | agents/sdd-spec-writer.md | the line "Run `sdd template show lite/10-spec/spec.md` before drafting." | none |
    | hooks.json is not a body | hooks/hooks.json | a SessionStart hook whose command is `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" hook session-start "${CLAUDE_PLUGIN_ROOT}/templates"` | none |
```
Note: one row per construct of C001-IF-08 §4. Each copy differs from the shipped plugin only by the row's addition, so a row with findings "none" also shows that the shipped plugin's bodies have no PLG-TMPL-001 finding. The hooks.json row adds a `${CLAUDE_PLUGIN_ROOT}/` path other than the CLI, so it would be reported if `hooks/hooks.json` were read as a body.

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
