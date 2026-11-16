---
capability: opencode-target
inventory_only: false
updated: 2026-11-16
---
# CAP-opencode-target — Living specification

## Requirements

### C002-REQ-201 — OpenCode target package contents
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode target package SHALL contain the ten agents under `.opencode/agents/`, the commands under `.opencode/commands/`, the skills under `.opencode/skills/` and an `opencode.json` that declares the MCP servers of the source plugin.
- **Rationale:** ideation §8; C002-R-001 C-07, C-08, C-09; servers of the source plugin per C001-REQ-1108
- **Stories:** C002-US-201
- **Priority:** Must
- **Acceptance:** C002-AC-201.1
- **Open items:** Serena's context on OpenCode is fixed by spike S-07 (baseline survey §4 note 6; C002-IF-001 §6.2); its data folder and read-only launch: C002-REQ-114.

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

### C002-REQ-202 — Conductor as the primary agent
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode target package SHALL declare the conductor as a primary agent and the nine specialists as subagents.
- **Rationale:** C001-REQ-201 (conductor as main session) carried to OpenCode agent modes (C002-R-001 C-08)
- **Stories:** C002-US-201
- **Priority:** Must
- **Acceptance:** C002-AC-202.1

#### C002-AC-202.1 — Conductor primary, specialists subagents
```gherkin
Scenario: C002-TS-203 — agent modes
  When the agent files of "dist/opencode/.opencode/agents/" are parsed
  Then "sdd-conductor" has mode "primary"
  And each of the nine specialists has mode "subagent"
```

### C002-REQ-203 — Commands run in the conductor
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode target package SHALL bind every command to the conductor agent.
- **Rationale:** the `claude --agent` guard line of the 13 commands (baseline survey §1.3, E-8) becomes the command's `agent` field (C002-R-001 C-08)
- **Stories:** C002-US-201
- **Priority:** Must
- **Acceptance:** C002-AC-203.1

#### C002-AC-203.1 — Every command is bound to the conductor
```gherkin
Scenario: C002-TS-204 — command agent field
  When the 13 command files of "dist/opencode/.opencode/commands/" are parsed
  Then each has the field "agent" with the value "sdd-conductor"
  And none contains the line "claude --agent architect:sdd-conductor"
```

### C002-REQ-204 — Install notes in the OpenCode package
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode target package SHALL contain install notes that state the prerequisites (Node.js 20 or later, OpenCode at its tested version, access to the Claude models of C002-REQ-105), the installation of `architect-sdd`, the placement of the package files and the start of the conductor.
- **Rationale:** today's `INSTALL.md` is Claude-only (current-state E-1); C002-SC-01
- **Stories:** C002-US-201
- **Priority:** Must
- **Acceptance:** C002-AC-204.1

#### C002-AC-204.1 — Install notes name prerequisites, install, placement and start
```gherkin
Scenario: C002-TS-205 — OpenCode install notes
  When the install notes of "dist/opencode/" are read
  Then they state Node.js 20 or later, the OpenCode tested version of the doctor remedies table, and access to the Claude models of the three tiers
  And they give the npm command that installs "architect-sdd"
  And they state where to place ".opencode/" and "opencode.json"
  And they state how to start the conductor
```

### C002-REQ-205 — README section for OpenCode
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE README SHALL contain an OpenCode section that links the install notes of the OpenCode target package and names the enforcement mode of that package.
- **Rationale:** ideation §5 (per-target README sections); the sections of C001-REQ-1115 stay as they are
- **Stories:** C002-US-201
- **Priority:** Must
- **Acceptance:** C002-AC-205.1

#### C002-AC-205.1 — README section links the notes and names the enforcement mode
```gherkin
Scenario: C002-TS-206 — README OpenCode section
  Given the OpenCode target package is generated for the enforcement mode that spike S-07 fixed
  When the README is read
  Then it has an "OpenCode" section whose link resolves to the install notes of the OpenCode target package
  And that section names that enforcement mode by its glossary name
```

### C002-REQ-206 — Edits confined to `.sdd/` by OpenCode permissions
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE the OpenCode target uses native permission enforcement, THE OpenCode target package SHALL give each Architect agent `edit` permission rules that allow only paths inside `.sdd/` and deny every other path.
- **Rationale:** ideation §8 (Enforcement per target); C002-DEC-005; the boundary of C001-REQ-1103 and C001-REQ-1104 without the memory folder (C002-DEC-009); relies on C002-AS-02
- **Stories:** C002-US-202
- **Priority:** Must
- **Acceptance:** C002-AC-206.1
- **Open items:** the path string OpenCode matches `edit` rules against, and its handling of `..` segments and links, are open for spike S-07 (C002-R-001 C-02, C-03; ideation §11).

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

### C002-REQ-207 — Shell commands confined to the allowlist by OpenCode permissions
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE the OpenCode target uses native permission enforcement, THE OpenCode target package SHALL give each Architect agent `bash` permission rules that allow only the commands of the allowlist in C001-IF-07 §3 and deny every other command.
- **Rationale:** the boundary of C001-REQ-1106 (as changed by C002-REQ-503, C002-REQ-517 and C002-REQ-521) and C001-REQ-1107; relies on C002-AS-01; the risks of ideation §9 (redirection inside an allowed command, a command that writes files, PowerShell on Windows) are corpus cases (C002-REQ-607)
- **Stories:** C002-US-202
- **Priority:** Must
- **Acceptance:** C002-AC-207.1

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

### C002-REQ-208 — The adopter's own agents keep their permissions
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode target package SHALL NOT set permission rules for agents other than the ten Architect agents.
- **Rationale:** C002-US-202 (P-03's own OpenCode agents keep their permissions); agent rules take precedence over global rules (C002-R-001 C-01)
- **Stories:** C002-US-202
- **Priority:** Must
- **Acceptance:** C002-AC-208.1

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

### C002-REQ-209 — Server fallback: no edit or shell permission
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE the OpenCode target uses sdd MCP server enforcement, THE OpenCode target package SHALL deny the `edit` and `bash` permissions to every Architect agent.
- **Rationale:** C002-DEC-001 (Consequences: OpenCode switches to the server if spike S-07 shows its matcher cannot be made safe); C002-AS-02 wrong; not a `tool.execute.before` plugin, whose input has no agent identity (C002-R-001 C-06)
- **Stories:** C002-US-203
- **Priority:** Must
- **Acceptance:** C002-AC-209.1

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

### C002-REQ-210 — Server fallback: two server profiles declared
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE the OpenCode target uses sdd MCP server enforcement, THE OpenCode target package SHALL declare in `opencode.json` two local MCP servers that run the sdd MCP server of `architect-sdd`: `sdd-files` with the server profile of the write tools and `sdd-shell` with the server profile of the command tool.
- **Rationale:** C002-US-203; the server of C002-CAP-04; two server profiles so that the write tools and the command tool are granted apart (C002-IF-002 §2, C002-REQ-415), and an agent without Bash never gets the command tool (C002-REQ-117, least privilege per C002-REQ-108); contract C002-IF-005 §2
- **Stories:** C002-US-203
- **Priority:** Must
- **Acceptance:** C002-AC-210.1

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

### C002-REQ-214 — Question shape on OpenCode
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the conductor asks a question through OpenCode's `question` tool, THE conductor SHALL give the question a header of at most 30 characters and every option a description.
- **Rationale:** C002-R-001 C-05 (30-character header; option description required); spike S-07 on OpenCode 1.18.31 (`docs/spikes/S-07-opencode.md §5`, fact F-6): an option without a description fails with a schema error, and OpenCode does not enforce the header length, so the 30-character limit (the tool schema's description) is Architect's own rule
- **Stories:** C002-US-204
- **Priority:** Must
- **Acceptance:** C002-AC-214.1

#### C002-AC-214.1 — Header length and option descriptions on OpenCode
```gherkin
@eval
Scenario: C002-TS-221 — long topic on the question tool
  Given the conductor on OpenCode must ask about "Inlining budget for the generated conductor agent" (50 characters)
  When the conductor asks the question
  Then the "question" call's header has at most 30 characters
  And every option of the call has a non-empty description
```

### C002-REQ-215 — Quick-lint feedback after writes on OpenCode
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** complex
- **Statement:** WHERE the OpenCode target uses native permission enforcement with a post-write feedback channel, WHEN an Architect agent writes a file under `.sdd/`, THE OpenCode target package SHALL return the quick-lint findings for that file to that agent.
- **Rationale:** ideation §5 (hook table: in if spike S-07 finds a feedback channel); C001-IF-07 §2 (PostToolUse) and §4 (format); under sdd MCP server enforcement C002-REQ-408 applies instead
- **Stories:** C002-US-205
- **Priority:** Should
- **Acceptance:** C002-AC-215.1

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

### C002-REQ-216 — OpenCode command names
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode target package SHALL name each command `architect-<name>`, where `<name>` is the file name of the source command without its extension.
- **Rationale:** the built-in commands of OpenCode 1.18.31 are `init`, `review` and `customize-opencode`; of these, only `init` shares its name with a source command and would collide with it without the prefix (defect D-011 item 1; C002-TS-226; C002-IF-001 §2, row `/architect:<name>`); the prefix keeps the `architect` namespace of the Claude Code names `/architect:<name>`; references in bodies follow the same mapping (C002-REQ-103); placement `.opencode/commands/architect-<command>.md` (C002-IF-005 §2; command files: C002-R-001 C-08)
- **Stories:** C002-US-201
- **Priority:** Must
- **Acceptance:** C002-AC-216.1

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

### C002-REQ-217 — Question tool allowed for the conductor on OpenCode
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode target package SHALL give the conductor the permission rule `question: allow`.
- **Rationale:** the rule applies in both enforcement modes; spike S-07 on OpenCode 1.18.31 (`docs/spikes/S-07-opencode.md §5`, fact F-6; defect D-009): the `question` tool is off by default in SDK and `opencode serve` sessions (default rule `question: deny`), and an agent without the rule gets an "unavailable tool" result; C002-REQ-211, C002-REQ-212, C002-REQ-213 and the scripted answers of C002-REQ-610 rely on the conductor's `question` calls; the specialists keep `question: deny` and return their questions (C001-REQ-208, C002-REQ-108); configuration: C002-IF-001 §6.3
- **Stories:** C002-US-204
- **Priority:** Must
- **Acceptance:** C002-AC-217.1

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

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
