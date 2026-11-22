---
capability: 0-1-1-fixes
inventory_only: false
updated: 2026-11-22
---
# CAP-0-1-1-fixes — Living specification

## Requirements

### C005-REQ-102 — Change created with the profile and kind P-01 gave
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** event-driven
- **Statement:** WHEN the conductor creates a change on a create-change request, THE conductor SHALL run `sdd change new` with `--profile` set to the profile that P-01 confirmed and `--kind` set to the kind that the option `--kind` of the new-change command gave or, without that option, to the kind that P-01 answered in the new-change round or in a further round of C005-REQ-124.
- **Rationale:** ideation §4.1 G-1 (check: 0 creations with unasked defaults); the new-change procedure includes the kind (ideation §4.1 G-1). The sdd CLI applies `--profile full` and `--kind greenfield` when an option is missing (E-13, E-14) and keeps doing so (Q-newchange-01); with both options always given, its defaults never decide a change. Where the kind comes from: C005-REQ-123; a kind answer that names no kind, and the further rounds that follow it: C005-REQ-124 (critic CR-12, CR-22). An answer that declines the change, in the new-change round or in a further round, gives no kind, so no run of `sdd change new` can meet this requirement and no change is created.
- **Stories:** C005-US-101
- **Priority:** Must
- **Acceptance:** C005-AC-102.1

#### C005-AC-102.1 — Change created with both options from P-01's answers
```gherkin
@eval
Scenario: C005-TS-106 — profile and kind passed to sdd change new on Claude Code
  Given the case workspace of C005-TS-101 on Claude Code
  And P-01 has written "I need a new change: export the order list to CSV", a request that gives no option "--kind"
  When P-01 answers the new-change round with the profile "lite" and the kind "brownfield"
  Then the transcript shows exactly one "sdd change new" call, with the options "--profile lite" and "--kind brownfield"
  And the file ".sdd/002-*/change.md" gives "profile: lite" and "kind: brownfield"
```

```gherkin
@manual-vscode
Scenario: C005-TS-157 — profile and kind passed to sdd change new in Copilot VS Code
  Given the repository of C005-TS-155, open in VS Code with the Copilot target package 0.1.1 installed
  And P-01 has sent the conductor the message "I need a new change: export the order list to CSV"
  When P-01 answers the "askQuestions" dialog of the new-change round with the profile "lite" and the kind "brownfield"
  Then the chat shows exactly one "sdd change new" run, with the options "--profile lite" and "--kind brownfield"
  And the file ".sdd/001-*/change.md" gives "profile: lite" and "kind: brownfield"
```

```gherkin
@eval
Scenario: C005-TS-107 — answers equal to the CLI defaults are passed as options
  Given the case workspace of C005-TS-101 on Claude Code
  And the conductor has proposed the profile "lite (Recommended)" for "I need a new change: export the order list to CSV", a request that gives no option "--kind"
  When P-01 answers the new-change round with the profile "full" and the kind "greenfield"
  Then the transcript shows exactly one "sdd change new" call, with the options "--profile full" and "--kind greenfield"
  And the file ".sdd/002-*/change.md" gives "profile: full" and "kind: greenfield"
```

### C005-REQ-123 — Kind asked in the new-change round
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** event-driven
- **Statement:** WHEN P-01 makes a create-change request that does not give the option `--kind`, THE conductor SHALL ask for the change kind (`greenfield`, `brownfield` or `mixed`) in the interview round that proposes the profile.
- **Rationale:** ideation §4.1 G-1 ("profile and kind round"; check: 0 creations with unasked defaults); critic CR-12. Today the procedure asks the kind only when `--kind` was not given and the repository has code (`plugins/architect/commands/new.md:17-18`, E-10), so in a repository without code the kind comes from no answer, and "has code" is left to the conductor's judgement. This requirement drops that condition. A request in plain words never gives `--kind`. The conductor may recommend a kind, such as `greenfield` in a repository without code, but P-01 answers. The option `--kind` of the new-change command is P-01's own answer and is not asked again (C005-REQ-102). The question belongs to the round of C005-REQ-101, so asking it adds no round; a further round follows only an answer that names no single kind (C005-REQ-124).
- **Stories:** C005-US-101
- **Priority:** Must
- **Acceptance:** C005-AC-123.1

#### C005-AC-123.1 — Kind asked in the profile round unless the command gave it
```gherkin
@eval
Scenario: C005-TS-158 — kind asked in the round that proposes the profile
  Given the case workspace of C005-TS-101 on Claude Code
  When P-01 writes to the conductor "I need a new change: export the order list to CSV"
  Then the "AskUserQuestion" call that proposes "lite" or "full" also asks for the kind with the options "greenfield", "brownfield" and "mixed"
  And the transcript shows no other question call before any "sdd change new" call
```

```gherkin
@eval
Scenario: C005-TS-159 — kind given by the new-change command is not asked again
  Given the case workspace of C005-TS-101 on Claude Code
  And P-01 has run "/architect:new Export the order list to CSV --kind brownfield"
  When P-01 answers the profile question of the new-change round with "lite"
  Then the transcript shows no question that asks for the kind
  And the transcript shows exactly one "sdd change new" call, with the options "--profile lite" and "--kind brownfield"
```

```gherkin
@eval
Scenario: C005-TS-160 — kind asked in a repository without code
  Given a case workspace on Claude Code whose repository holds no file outside ".sdd/" and ".git/", with an initialised ".sdd/" and no change
  When P-01 writes to the conductor "I need a new change: a CSV export tool"
  Then the "AskUserQuestion" call that proposes "lite" or "full" also asks for the kind with the options "greenfield", "brownfield" and "mixed"
  And no folder ".sdd/001-*" exists before P-01 answers that call
```

### C005-REQ-124 — Kind answer that names no kind
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** unwanted-behaviour
- **Statement:** IF P-01 answers the kind question of the new-change round, or of a further round of this requirement, with text that does not name exactly one of the kinds `greenfield`, `brownfield` and `mixed` and does not decline the change, THEN THE conductor SHALL ask for the kind again in a further interview round before it runs `sdd change new`.
- **Rationale:** critic CR-12, CR-22. The question tool always accepts free text (`plugins/architect/skills/interview-protocol/SKILL.md:48`: no "Other" option, P-01 can always answer in free text), so an answer such as "it changes existing code" is a real case. C005-REQ-102 needs one kind to pass, and the interview protocol asks about an ambiguous answer in the next round instead of guessing (`interview-protocol/SKILL.md:106-107`). The rule holds in every further round too: a second answer that names no single kind gets one more round, and the conductor derives no kind from it. An answer that declines the change, such as "Stop, do not create it", gets no further round; it gives no kind, so no change is created (C005-REQ-102), as a declined profile round creates none (C005-REQ-101).
- **Stories:** C005-US-101
- **Priority:** Must
- **Acceptance:** C005-AC-124.1

#### C005-AC-124.1 — Kind asked again when the answer names no kind
```gherkin
@eval
Scenario Outline: C005-TS-161 — kind answer that names no kind or more than one
  Given the case workspace of C005-TS-101 on Claude Code
  And P-01 has written "I need a new change: export the order list to CSV"
  When P-01 answers the new-change round with the profile "lite" and, to the kind question, the free text "<answer>"
  Then the transcript shows a further "AskUserQuestion" call that asks for the kind with the options "greenfield", "brownfield" and "mixed"
  And that call comes before any "sdd change new" call
  And no folder ".sdd/002-*" exists before P-01 answers that call
  Examples:
    | answer                                |
    | it changes existing code              |
    | brownfield or mixed, you decide       |
    | legacy                                |
```

```gherkin
@eval
Scenario: C005-TS-162 — kind answered in the further round
  Given the case workspace of C005-TS-161 with the answer "it changes existing code", after the further "AskUserQuestion" call for the kind
  When P-01 answers that call with "mixed"
  Then the transcript shows exactly one "sdd change new" call, with the options "--profile lite" and "--kind mixed"
  And the file ".sdd/002-*/change.md" gives "profile: lite" and "kind: mixed"
```

```gherkin
@eval
Scenario: C005-TS-163 — free text that names exactly one kind is not asked again
  Given the case workspace of C005-TS-101 on Claude Code
  And P-01 has written "I need a new change: export the order list to CSV"
  When P-01 answers the new-change round with the profile "lite" and, to the kind question, the free text "brownfield, it changes the existing order module"
  Then the transcript shows no further question that asks for the kind
  And the transcript shows exactly one "sdd change new" call, with the options "--profile lite" and "--kind brownfield"
```

```gherkin
@eval
Scenario: C005-TS-173 — further-round answer that again names no kind gets one more round
  Given the case workspace of C005-TS-161 with the answer "it changes existing code", after the further "AskUserQuestion" call for the kind
  When P-01 answers that call with the free text "you decide"
  Then the transcript shows one more "AskUserQuestion" call that asks for the kind with the options "greenfield", "brownfield" and "mixed"
  And the transcript shows no "sdd change new" call before P-01 answers that call
  And no folder ".sdd/002-*" exists before P-01 answers that call
```

```gherkin
@eval
Scenario: C005-TS-174 — change declined in the further round, no change created
  Given the case workspace of C005-TS-161 with the answer "it changes existing code", after the further "AskUserQuestion" call for the kind
  When P-01 answers that call with the free text "Stop, do not create it"
  Then the transcript shows no later question call that asks for the kind
  And the transcript shows no "sdd change new" call
  And no folder ".sdd/002-*" exists after the turn
```

### C005-REQ-103 — Pre-phase round logged in the next phase's questions log
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** complex
- **Statement:** WHILE an active change has its last approved gate at G1 or G2 and the next phase (`10-spec` after G1, `20-plan` after G2) is `not-started`, WHEN P-01 answers an interview round, THE conductor SHALL append the round, with the round number, the date, each question with its options and recommendation, and P-01's answer verbatim, to `questions-log.md` in the folder of that next phase, creating the file on first use.
- **Rationale:** Q-postgate-01 ("Next phase's log"); ideation §4.1 G-2. C001-REQ-210 stays the rule inside an open phase and is not restated; between a gate approval and the next phase no phase is open, so "the phase's" log names no file (E-19, E-20, E-21). The approved phase's log is part of its approval hash (E-22), whereas the next phase's folder is covered by no approved hash; the round becomes part of the next phase and of its approval. Answers after G3 or after a Stop are a non-goal (Q-scope-04; ideation §4.2 item 3): no phase follows G3, and a stopped change is not active. The requirement holds whatever starts the round in the window: a question the conductor raises itself, or one that P-01 asks it to put, such as "G1 is approved. Before the spec starts, ask me whether the CSV export writes a header row"; an eval case starts the round with such a P-01 message (critic CR-21). The lint result on the log that this rule creates: C005-REQ-126.
- **Stories:** C005-US-102
- **Priority:** Must
- **Acceptance:** C005-AC-103.1

#### C005-AC-103.1 — Pre-phase round appended to the next phase's questions log, approved phase untouched
```gherkin
@eval
Scenario: C005-TS-108 — answer after the G1 approval on Claude Code
  Given a case workspace on Claude Code with the active full-profile change 002 "Export to CSV", gate G1 approved, phase "10-spec" "not-started" and no file "002-export-to-csv/10-spec/questions-log.md"
  And P-01 has written "G1 is approved. Before the spec starts, ask me whether the CSV export writes a header row"
  When P-01 answers the conductor's question on the header row with "Yes, and use a semicolon separator"
  Then the file "002-export-to-csv/10-spec/questions-log.md" exists and holds one round with the round number 1, the date of the run, the question with the options and the recommendation that the question call of the transcript shows, and the answer "Yes, and use a semicolon separator" verbatim
  And "002-export-to-csv/00-ideation/questions-log.md" is byte-identical to its content before the turn
  And "sdd hash 002 00-ideation" prints the hash that "approvals.json" records for "00-ideation"
  And "sdd stale check 002" reports no stale phase
```

```gherkin
@manual-vscode
Scenario: C005-TS-164 — answer after the G1 approval in Copilot VS Code
  Given a repository open in VS Code with the Copilot target package 0.1.1 installed and the active full-profile change 001 "Export to CSV", gate G1 approved, phase "10-spec" "not-started" and no file "001-export-to-csv/10-spec/questions-log.md"
  And P-01 has sent the conductor the message "G1 is approved. Before the spec starts, ask me whether the CSV export writes a header row"
  When P-01 answers the "askQuestions" dialog on the header row with "Yes, and use a semicolon separator"
  Then the file "001-export-to-csv/10-spec/questions-log.md" exists and holds one round with the answer "Yes, and use a semicolon separator" verbatim
  And "001-export-to-csv/00-ideation/questions-log.md" is byte-identical to its content before the turn
  And "sdd stale check 001", run by P-01 in the terminal, reports no stale phase
```

```gherkin
@eval
Scenario: C005-TS-109 — answer after the G2 approval goes to the 20-plan log
  Given a case workspace on Claude Code with the active full-profile change 002 "Export to CSV", gate G2 approved, phase "20-plan" "not-started" and no file "002-export-to-csv/20-plan/questions-log.md"
  And P-01 has written "G2 is approved. Before the plan starts, ask me whether the export task comes before the import task"
  When P-01 answers the conductor's question on the task order with "No, import first"
  Then the file "002-export-to-csv/20-plan/questions-log.md" exists and holds one round with the answer "No, import first" verbatim
  And "002-export-to-csv/10-spec/questions-log.md" is byte-identical to its content before the turn
  And "sdd stale check 002" reports no stale phase
```

```gherkin
@eval
Scenario: C005-TS-110 — second pre-phase round appended after the first
  Given the case workspace of C005-TS-108 on Claude Code after its turn, with round 1 in "002-export-to-csv/10-spec/questions-log.md"
  And P-01 has written "Also ask me whether empty orders are exported"
  When P-01 answers the conductor's question on empty orders with "No"
  Then "002-export-to-csv/10-spec/questions-log.md" holds round 1 unchanged followed by round 2 with the answer "No" verbatim
  And the file holds exactly 2 rounds
```

### C005-REQ-104 — Pre-phase round marked in the log
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** event-driven
- **Statement:** WHEN the conductor appends a pre-phase round to a questions log, THE conductor SHALL state in that round's entry that the round was given before the phase started, after the approval of the gate it names (G1 or G2).
- **Rationale:** Q-postgate-01 ("marked as given before the phase started"); a reader of the phase's log, P-01 or the critic, can tell which answers predate the phase's start.
- **Stories:** C005-US-102
- **Priority:** Must
- **Acceptance:** C005-AC-104.1

#### C005-AC-104.1 — Pre-phase round states the gate after which it was given
```gherkin
@eval
Scenario Outline: C005-TS-112 — pre-phase round marked with its gate
  Given a case workspace on Claude Code with the active full-profile change 002, gate <gate> approved and phase "<phase>" "not-started"
  And P-01 has written "<message>"
  When P-01 answers the conductor's question on the header row with "Yes"
  Then the round entry in "002-*/<phase>/questions-log.md" states that the round was given before "<phase>" started, after the approval of gate <gate>
  Examples:
    | gate | phase   | message                                                                              |
    | G1   | 10-spec | G1 is approved. Before the spec starts, ask me whether the CSV export writes a header row |
    | G2   | 20-plan | G2 is approved. Before the plan starts, ask me whether the CSV export writes a header row |
```

```gherkin
@manual-vscode
Scenario: C005-TS-165 — pre-phase round marked with its gate in Copilot VS Code
  Given the repository of C005-TS-164 after its run
  When P-01 opens "001-export-to-csv/10-spec/questions-log.md"
  Then its round entry states that the round was given before "10-spec" started, after the approval of gate G1
```

```gherkin
@eval
Scenario: C005-TS-113 — round answered after the phase started carries no pre-phase mark
  Given a case workspace on Claude Code with the active full-profile change 002, gate G1 approved and phase "10-spec" "draft"
  And P-01 has written "Ask me whether the CSV export writes a header row"
  When P-01 answers the conductor's question on the header row with "Yes"
  Then the new round entry in "002-*/10-spec/questions-log.md" holds the answer "Yes" verbatim
  And that entry does not state that the round was given before "10-spec" started
```

### C005-REQ-126 — Pre-phase questions log accepted by the lint
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** state-driven
- **Statement:** WHILE the `10-spec` or `20-plan` phase of a change of either profile is `not-started` and the folder of that phase holds a `questions-log.md` in the form of C005-IF-004 whose ID references all resolve, THE lint SHALL report for that change exactly the findings that it reports for the same change without that file.
- **Rationale:** Q-prelog-lint-01 ("Requirement: lint accepts it", `questions-log.md` of this phase, round 5); critic CR-13; ideation §9 (lint risk of the next phase's log on a lite change). C005-REQ-103 creates the log in the folder of a phase that has not started. Whether the lint accepts it there was not run (E-25), and no sdd subcommand writes or checks the log (C005-IF-004). With this requirement, a lint change is in scope if its acceptance fails. One comparison with the same change without the file decides the outcome: then no finding names the log, and the log adds or removes no finding on another file, such as a file scaffolded in a not-started phase of a lite change. An ID reference of the log that does not resolve keeps its finding, hence the condition on references. Once the phase starts, the log is the questions log of an open phase (C001-REQ-210).
- **Stories:** C005-US-102
- **Priority:** Must
- **Acceptance:** C005-AC-126.1

#### C005-AC-126.1 — Lint reports the same findings with and without a pre-phase questions log
```gherkin
Scenario Outline: C005-TS-111 — pre-phase log in a not-started phase adds or removes no lint finding
  Given a workspace with the active <profile> change 003 and its scaffolded files, gate <gate> approved and phase "<phase>" "not-started"
  And the file "003-*/<phase>/questions-log.md" holds one round in the form of C005-IF-004, marked as given before "<phase>" started, after the approval of gate <gate>, and every ID reference of the file resolves
  When "sdd lint 003" runs
  Then no finding of the output names "003-*/<phase>/questions-log.md"
  And the findings of the output are those that "sdd lint 003" prints for the same workspace without that file
  And "sdd stale check 003" reports no stale phase
  Examples:
    | profile | gate | phase   |
    | lite    | G1   | 10-spec |
    | lite    | G2   | 20-plan |
    | full    | G1   | 10-spec |
```

```gherkin
Scenario: C005-TS-175 — unresolved ID reference in a pre-phase log keeps its finding
  Given a workspace with the active lite change 003 and its scaffolded files, gate G1 approved and phase "10-spec" "not-started"
  And the file "003-*/10-spec/questions-log.md" holds one round in the form of C005-IF-004 with a question whose Sources line names "C003-REQ-999", an ID that is neither defined in the workspace nor tombstoned
  When "sdd lint 003" runs
  Then the output holds the error "TR-12" of C001-REQ-717 with its location in "003-*/10-spec/questions-log.md", naming "C003-REQ-999"
```

### C005-REQ-105 — Reporting commands that run without the plugin
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** ubiquitous
- **Statement:** THE Reporting protocol section of `handoff.md` SHALL give each of its CLI commands as a bare `sdd` command, after the install line.
- **Rationale:** Q-handoff-01 ("Bare sdd + install line"); R-001 (`architect-sdd` installs the executable `sdd`); ideation §4.1 G-3. Both hand-off templates give `node <plugin-root>/scripts/sdd.mjs …`, which no text resolves (E-27, E-28, E-72), and an implementer without the plugin left tasks `todo` (E-34). C001-REQ-616 (sections, CLI commands and the frontmatter fallback) stays as stated, and so does the frontmatter fallback (ideation §4.2 item 5). With no plugin-path line left in the source templates, the rewrite of C002-REQ-518 changes no hand-off line and C002-REQ-519 finds nothing to report (E-75); both stay as stated, while the tests that pin the plugin-path form change (E-36, E-76).
- **Stories:** C005-US-103
- **Priority:** Must
- **Acceptance:** C005-AC-105.1

#### C005-AC-105.1 — Reporting protocol gives bare sdd commands after the install line
```gherkin
Scenario: C005-TS-114 — Reporting protocol of a scaffolded lite hand-off
  Given an initialised repository and the sdd CLI of the source plugin
  When "sdd change new "Export to CSV" --profile lite --kind brownfield" runs
  Then the Reporting protocol section of ".sdd/001-*/20-plan/handoff.md" gives the install line before its first CLI command
  And each of its CLI commands ("task set" with "in-progress", "done" and "blocked"; "defect add") starts with "sdd "
  And no line of the section contains "node " or "scripts/sdd.mjs"
  And the frontmatter fallback paragraph follows the CLI commands
```

```gherkin
Scenario Outline: C005-TS-115 — Reporting protocol of each source hand-off template
  Given the source template "plugins/architect/templates/<profile>/20-plan/handoff.md"
  When the template test reads its Reporting protocol section
  Then the section gives the install line before its first CLI command
  And each of its 4 CLI commands starts with "sdd "
  And no line of the section contains "node " or "scripts/sdd.mjs"
  Examples:
    | profile |
    | full    |
    | lite    |
```

```gherkin
Scenario: C005-TS-116 — npm packaging leaves the Reporting protocol of the hand-off templates unchanged
  Given the source plugin
  When the packaging stages the "architect-sdd" package
  Then the Reporting protocol section of each staged "templates/full/20-plan/handoff.md" and "templates/lite/20-plan/handoff.md" is byte-identical to that section of its source template
  And the packaging reports no ERR-BLD-002
```

### C005-REQ-106 — Version in a hand-off written by the sdd CLI
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** event-driven
- **Statement:** WHEN the sdd CLI writes `20-plan/handoff.md` from its template, THE sdd CLI SHALL write the install line with its own version, as `sdd --version` prints it.
- **Rationale:** ideation §4.1 G-3 ("filled in deterministically", rule set in this phase) and §11; critic CR-2. The sdd CLI writes the hand-off of a lite change at `sdd change new --profile lite` (E-68) and renders full-profile templates at `sdd change profile <NNN> full` (E-69). It knows its version at run time (E-74; C002-REQ-511), and the npm `sdd` is built from the same version (C002-REQ-501, C002-REQ-502), so a hand-off scaffolded on either host names the plugin version. Templates are filled only for the keys passed, and none is a version today (E-67, E-68, E-71). `sdd template show` keeps printing the template bytes unchanged (E-70; C002-REQ-513).
- **Stories:** C005-US-103
- **Priority:** Must
- **Acceptance:** C005-AC-106.1

#### C005-AC-106.1 — Hand-off scaffolded by the sdd CLI names the CLI's own version
```gherkin
Scenario: C005-TS-117 — lite hand-off scaffolded by the plugin's sdd CLI
  Given an initialised repository and the sdd CLI of the source plugin built from "plugin.json" version "0.1.1", so that "sdd --version" prints "0.1.1"
  When "sdd change new "Export to CSV" --profile lite --kind brownfield" runs
  Then ".sdd/001-*/20-plan/handoff.md" holds the line "npm install -g architect-sdd@0.1.1"
  And the file holds no "{{" placeholder and no "<version>"
```

```gherkin
Scenario: C005-TS-118 — lite hand-off scaffolded by the npm-installed sdd
  Given the "architect-sdd" tarball built by the packaging from the same "plugin.json", installed with npm into an empty global prefix
  And an initialised repository
  When the installed "sdd" runs "change new "Export to CSV" --profile lite --kind brownfield"
  Then the install line of ".sdd/001-*/20-plan/handoff.md" names the version that the installed "sdd --version" prints
  And that version equals the "version" of "plugins/architect/.claude-plugin/plugin.json"
```

```gherkin
Scenario: C005-TS-119 — template show prints the hand-off template unfilled
  Given the sdd CLI of the source plugin
  When "sdd template show lite/20-plan/handoff.md" runs
  Then standard output is byte-identical to "plugins/architect/templates/lite/20-plan/handoff.md"
```

### C005-REQ-107 — Version in a hand-off written by the planner
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** event-driven
- **Statement:** WHEN the planner writes the Reporting protocol section of `handoff.md`, THE planner SHALL write the install line with the version that `sdd --version` prints in the planner's session.
- **Rationale:** the sdd CLI scaffolds no full-profile hand-off (E-68); the planner writes it from the planning skill (E-73), and a template read through `sdd template show` holds the template bytes unchanged (E-70, E-78), so the planner writes the version itself. `sdd --version` prints the bare version (C002-REQ-511). The same rule holds when the planner rewrites the section of a scaffolded lite hand-off.
- **Stories:** C005-US-103
- **Priority:** Must
- **Acceptance:** C005-AC-107.1

#### C005-AC-107.1 — Hand-off written by the planner names the version of the session's sdd
```gherkin
@eval
Scenario: C005-TS-120 — planner writes the hand-off of a full plan
  Given a case workspace on Claude Code where "sdd --version" prints "0.1.1", with the active full-profile change 002, phase "10-spec" approved, phase "20-plan" "draft" and no file "002-*/20-plan/handoff.md"
  When the conductor runs the plan step of change 002 to the hand-off
  Then the Reporting protocol section of "002-*/20-plan/handoff.md" holds the line "npm install -g architect-sdd@0.1.1"
  And the file holds no "<version>" and no "{{" placeholder
```

```gherkin
@eval
Scenario: C005-TS-121 — planner rewrites the Reporting protocol of a scaffolded lite hand-off
  Given a case workspace on Claude Code where "sdd --version" prints "0.1.1", with the active lite change 003, phase "10-spec" approved and the scaffolded "003-*/20-plan/handoff.md"
  When the planner writes the plan and the hand-off of change 003, its Reporting protocol section included
  Then the Reporting protocol section of "003-*/20-plan/handoff.md" holds the line "npm install -g architect-sdd@0.1.1"
  And the file holds no "<version>" and no "{{" placeholder
```

### C005-REQ-108 — Hand-off without a versioned install line reported
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** complex
- **Statement:** WHILE the `20-plan` phase of a change is `draft`, `in-review` or `in-revision`, IF the Reporting protocol section of its `handoff.md` holds no install line that names a bare semantic version (`<major>.<minor>.<patch>`), THEN THE lint SHALL report an error-severity finding naming the file.
- **Rationale:** constitution principle 2 (exact things are done by the sdd CLI, never by a model) and ideation §9 (risk "`<version>` left unfilled", impact high; critic CR-2): C005-REQ-107 is model behaviour, and the lint reports no leftover placeholder today (E-77); LINT-HAND-001 checks only the words `task set`, `defect add` and `frontmatter` (E-77; C001-REQ-616). The check applies only while a plan is written or reviewed, so the hand-offs of approved plans and of archived changes, which predate the install line (E-29), raise no new finding (DOD-G-03).
- **Stories:** C005-US-103
- **Priority:** Should
- **Acceptance:** C005-AC-108.1

#### C005-AC-108.1 — Lint reports a hand-off without a versioned install line while the plan is open
```gherkin
Scenario Outline: C005-TS-122 — versioned install line accepted
  Given an active change 002 whose phase "20-plan" is "draft" and whose Reporting protocol section of "20-plan/handoff.md" holds the line "<line>"
  When "sdd lint 002" runs
  Then the output holds no LINT-HAND-003 finding for "002-*/20-plan/handoff.md"
  Examples:
    | line                                     |
    | npm install -g architect-sdd@0.1.1       |
    | npm install -g architect-sdd@10.20.300   |
```

```gherkin
Scenario Outline: C005-TS-123 — missing or unversioned install line reported
  Given an active change 002 whose phase "20-plan" is "draft" and whose Reporting protocol section of "20-plan/handoff.md" holds <install line>
  When "sdd lint 002" runs
  Then the output holds an error-severity LINT-HAND-003 finding that names "002-*/20-plan/handoff.md"
  And the exit code is not 0
  Examples:
    | install line                                       |
    | the line "npm install -g architect-sdd@<version>"   |
    | the line "npm install -g architect-sdd@{{VERSION}}" |
    | the line "npm install -g architect-sdd@latest"      |
    | the line "npm install -g architect-sdd@0.1"         |
    | the line "npm install -g architect-sdd@0.1.1-rc.1"  |
    | no install line                                     |
```

```gherkin
Scenario Outline: C005-TS-124 — install-line check only while the plan is open
  Given a change 002 whose phase "20-plan" is "<status>" and whose Reporting protocol section of "20-plan/handoff.md" holds no install line<where>
  When "sdd lint" runs on the workspace
  Then the output holds <count> finding(s) of LINT-HAND-003
  Examples:
    | status      | where                              | count |
    | draft       |                                    | 1     |
    | in-review   |                                    | 1     |
    | in-revision |                                    | 1     |
    | approved    |                                    | 0     |
    | stale       |                                    | 0     |
    | approved    | , in a change under ".sdd/_archive/" | 0   |
```

```gherkin
Scenario: C005-TS-125 — install line outside the Reporting protocol section reported
  Given an active change 002 whose phase "20-plan" is "draft"
  And "20-plan/handoff.md" holds the line "npm install -g architect-sdd@0.1.1" in its section "Ordered task list" and no install line in its Reporting protocol section
  When "sdd lint 002" runs
  Then the output holds an error-severity LINT-HAND-003 finding that names "002-*/20-plan/handoff.md"
```

### C005-REQ-109 — Reporting sentence of `SDD.md`
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** event-driven
- **Statement:** WHEN `sdd init` writes `SDD.md` (in a workspace without `SDD.md`, or with the option `--force`), THE sdd CLI SHALL give in the section "If you are implementing a change" the install line with its own version, followed by the bare command `sdd task set <task-id> --status <status>`.
- **Rationale:** ideation §4.1 G-3; critic CR-1. The sentence of `src/workspace/sddmd.ts:33` gives `node <plugin-root>/scripts/sdd.mjs task set …` (E-79, E-83); C001-REQ-103 fixes the section names, not this sentence, and stays as stated. An existing `SDD.md` is re-rendered only by `sdd init --force` (E-80); existing workspaces are reached through the release notes (Q-sddmd-01; C005-REQ-120). The bundled copy of the sentence changes only on `npm run build` (E-79).
- **Stories:** C005-US-103
- **Priority:** Must
- **Acceptance:** C005-AC-109.1

#### C005-AC-109.1 — SDD.md written by sdd init gives the install line and the bare task command
```gherkin
Scenario: C005-TS-126 — SDD.md of a new workspace
  Given an empty git repository and the sdd CLI of the source plugin, whose "sdd --version" prints "0.1.1"
  When "sdd init" runs
  Then the section "If you are implementing a change" of ".sdd/SDD.md" holds "npm install -g architect-sdd@0.1.1" followed by "sdd task set <task-id> --status <status>"
  And ".sdd/SDD.md" contains no "<plugin-root>" and no "scripts/sdd.mjs task set"
```

```gherkin
Scenario: C005-TS-127 — sdd init --force replaces the 0.1.0 sentence
  Given a workspace whose ".sdd/SDD.md" holds, in the section "If you are implementing a change", the sentence that the sdd CLI 0.1.0 wrote (E-79), and a status block
  When "sdd init --force" runs with the sdd CLI whose "sdd --version" prints "0.1.1"
  Then that section holds "npm install -g architect-sdd@0.1.1" followed by "sdd task set <task-id> --status <status>"
  And the section contains no "node <plugin-root>/scripts/sdd.mjs"
  And the status block is still present
```

```gherkin
Scenario: C005-TS-128 — sdd init without --force keeps an existing SDD.md sentence
  Given a workspace whose ".sdd/SDD.md" holds the 0.1.0 sentence in the section "If you are implementing a change"
  When "sdd init" runs without "--force"
  Then the section "If you are implementing a change" of ".sdd/SDD.md" is byte-identical to its content before the run
```

### C005-REQ-110 — Reporting step of the README
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** ubiquitous
- **Statement:** THE plugin README SHALL give, in its step that hands a change to an implementer, the install line with the version of the source plugin, followed by the bare command `sdd task set <task-ID> --status done --commit <sha>`.
- **Rationale:** ideation §4.1 G-3; critic CR-1. `plugins/architect/README.md:114` gives `node <plugin>/scripts/sdd.mjs task set …` (E-81), and no test pins the line (E-86). The plugin README is that file, not the repository's root `README.md`, which the constitution's system name "README" denotes and which holds neither form (critic CR-17). The README is static text, so the version it names is the version of `plugin.json`, the single version source (E-5); the acceptance compares the two.
- **Stories:** C005-US-103
- **Priority:** Must
- **Acceptance:** C005-AC-110.1

#### C005-AC-110.1 — Plugin README hand-off step names the version of plugin.json
```gherkin
Scenario: C005-TS-129 — README step matches the plugin version
  Given the source plugin
  When the README test reads the step of "plugins/architect/README.md" that hands a change to an implementer
  Then the step holds "npm install -g architect-sdd@<V>", where <V> is the "version" of "plugins/architect/.claude-plugin/plugin.json"
  And it is followed by "sdd task set <task-ID> --status done --commit <sha>"
```

```gherkin
Scenario: C005-TS-130 — README version that differs from plugin.json fails the test
  Given a temporary copy of the source plugin whose "plugin.json" gives version "0.1.2" and whose README step names "architect-sdd@0.1.1"
  When the README test runs on that copy
  Then the test fails with a message naming "README.md", "0.1.1" and "0.1.2"
```

### C005-REQ-111 — No plugin-path invocation in the source plugin
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** ubiquitous
- **Statement:** THE source plugin SHALL NOT contain the text `<plugin-root>` or `<plugin>/scripts/sdd.mjs` in any of its files.
- **Rationale:** ideation §4.1 G-3 (check: no shipped text contains either form). The source plugin's files include the bundled CLI, which carries the `SDD.md` text (E-79). Today the forms occur only in the two hand-off templates, README line 114 and the `SDD.md` sentence (E-72, E-81, E-82, E-83). The CLI invocation lines with `${CLAUDE_PLUGIN_ROOT}` address agents inside the plugin, not implementers, and stay (E-82).
- **Stories:** C005-US-103
- **Priority:** Must
- **Acceptance:** C005-AC-111.1

#### C005-AC-111.1 — No plugin-path invocation in any file of the source plugin
```gherkin
Scenario: C005-TS-131 — source plugin free of plugin-path forms
  Given the source plugin "plugins/architect/", the bundle "scripts/sdd.mjs" included
  When the source-text test scans every file of it
  Then it finds 0 occurrences of "<plugin-root>"
  And it finds 0 occurrences of "<plugin>/scripts/sdd.mjs"
```

```gherkin
Scenario Outline: C005-TS-132 — planted plugin-path form reported
  Given a temporary copy of the source plugin whose file "<file>" holds "<text>" at line 5
  When the source-text test scans that copy
  Then the test fails with a message naming "<file>" and line 5
  Examples:
    | file                               | text                                                      |
    | templates/full/20-plan/handoff.md  | node <plugin-root>/scripts/sdd.mjs task set T-001 --status done |
    | README.md                          | node <plugin>/scripts/sdd.mjs task set T-001 --status done      |
    | scripts/sdd.mjs                    | report progress with node <plugin-root>/scripts/sdd.mjs         |
```

```gherkin
Scenario: C005-TS-133 — CLAUDE_PLUGIN_ROOT invocation lines are not reported
  Given the source plugin, whose "agents/sdd-conductor.md" holds a CLI invocation line with "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" (E-82)
  When the source-text test scans every file of it
  Then the test reports no occurrence for that line
```

### C005-REQ-113 — Tasks of a lite change in the archive preconditions
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** optional-feature
- **Statement:** WHERE a change has the lite profile, THE sdd CLI SHALL take the tasks of the archive preconditions of C005-REQ-112 from the task sections of `20-plan/plan.md`, each with the status in its Status field.
- **Rationale:** Q-scope-03 ("Include lite tasks"). C001-REQ-913 counts every task, but the preconditions read only `20-plan/50-tasks/`, which a lite change does not have, so open lite tasks never block (E-42, E-43, E-94); `task set` and the status block already read the lite task sections (E-42). A full change keeps its task files.
- **Stories:** C005-US-104
- **Priority:** Must
- **Acceptance:** C005-AC-113.1

#### C005-AC-113.1 — Task sections of a lite plan counted in the archive preconditions
```gherkin
Scenario: C005-TS-138 — open lite task blocks the archive
  Given an active lite change 004 with gate G3 approved and no open defect
  And the task sections "C004-T-001" and "C004-T-003" of "20-plan/plan.md" with Status "done"
  And the task section "C004-T-002" without the archive-task marker and with Status "in-progress"
  When "sdd archive 004" runs
  Then the command fails with ERR-CLI-009 naming "C004-T-002"
  And the folder ".sdd/004-*" is still in place
```

```gherkin
Scenario: C005-TS-139 — lite change whose only open task is the marked archive task
  Given an active lite change 004 with gate G3 approved and no open defect
  And the task sections "C004-T-001" and "C004-T-002" of "20-plan/plan.md" with Status "done"
  And the task section "C004-T-003" with the archive-task marker and Status "todo"
  When "sdd archive 004" runs
  Then the exit code is 0
  And the folder ".sdd/_archive/004-*" exists
```

```gherkin
Scenario Outline: C005-TS-140 — Status values of an unmarked lite task
  Given an active lite change 004 with gate G3 approved and no open defect
  And the task section "C004-T-002" of "20-plan/plan.md" without the archive-task marker and with Status "<status>", every other task section "done"
  When "sdd archive 004" runs
  Then <outcome>
  Examples:
    | status      | outcome                                              |
    | done        | the exit code is 0 and the change is archived        |
    | dropped     | the exit code is 0 and the change is archived        |
    | todo        | the command fails with ERR-CLI-009 naming "C004-T-002" |
    | blocked     | the command fails with ERR-CLI-009 naming "C004-T-002" |
```

### C005-REQ-114 — Archive task marked by the planner
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** event-driven
- **Statement:** WHEN the planner writes a task that runs `sdd archive` for its own change, THE planner SHALL give that task the archive-task marker.
- **Rationale:** Q-archive-01: the marker is an optional key of a full task file and a field of a lite task section; extra keys and fields are accepted today (E-87, E-88). Without the marker the archive task blocks its own archive (C005-REQ-112). Not every change has an archive task (CHG-002 had none, E-90).
- **Stories:** C005-US-104
- **Priority:** Must
- **Acceptance:** C005-AC-114.1

#### C005-AC-114.1 — Planner marks the task that runs the change's own archive
```gherkin
@eval
Scenario: C005-TS-141 — archive task of a full plan marked
  Given a case workspace on Claude Code with the active full-profile change 002, phase "10-spec" approved, whose ideation states that the change ends with its archive into the living specs
  When the planner writes the tasks of change 002
  Then exactly one task file under "002-*/20-plan/50-tasks/" has steps that run "sdd archive 002"
  And that task file carries the archive-task marker
  And no other task file of change 002 carries the archive-task marker
```

```gherkin
@eval
Scenario: C005-TS-142 — archive task of a lite plan marked
  Given a case workspace on Claude Code with the active lite change 003, phase "10-spec" approved, whose ideation states that the change ends with its archive into the living specs
  When the planner writes the task sections of "003-*/20-plan/plan.md"
  Then the task section whose steps run "sdd archive 003" carries the archive-task marker field
  And no other task section carries the archive-task marker field
```

```gherkin
@eval
Scenario: C005-TS-143 — task that works on archive features is not marked
  Given a case workspace on Claude Code with the active full-profile change 002, phase "10-spec" approved, whose requirements include a cleanup job titled "Archive old CSV exports" and whose ideation states that the change ends with its archive into the living specs
  When the planner writes the tasks of change 002
  Then the task that implements "Archive old CSV exports" carries no archive-task marker
  And only the task whose steps run "sdd archive 002" carries the archive-task marker
```

### C005-REQ-115 — More than one archive task reported
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** unwanted-behaviour
- **Statement:** IF more than one task of a change carries the archive-task marker, THEN THE lint SHALL report an error-severity finding naming each marked task.
- **Rationale:** the status of a marked task never blocks the archive (C005-REQ-112), so a second marked task would leave open work unchecked; the error stops such a plan before G3 (constitution, quality bar: no lint error before a gate). A change has one task that runs its archive or none (E-89, E-90).
- **Stories:** C005-US-104
- **Priority:** Should
- **Acceptance:** C005-AC-115.1

#### C005-AC-115.1 — Lint reports more than one marked archive task
```gherkin
Scenario Outline: C005-TS-144 — two marked tasks reported
  Given an active <profile> change 002 whose tasks "C002-T-003" and "C002-T-005" both carry the archive-task marker
  When "sdd lint 002" runs
  Then the output holds an error-severity LINT-TASK-005 finding that names "C002-T-003" and "C002-T-005"
  And the exit code is not 0
  Examples:
    | profile      |
    | full-profile |
    | lite         |
```

```gherkin
Scenario Outline: C005-TS-145 — zero or one marked task accepted
  Given an active full-profile change 002 with <count> task(s) carrying the archive-task marker
  When "sdd lint 002" runs
  Then the output holds no LINT-TASK-005 finding
  Examples:
    | count |
    | 0     |
    | 1     |
```

### C005-REQ-122 — Lite plans approved with the sdd CLI 0.1.0
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** event-driven
- **Statement:** WHEN `sdd stale check` runs on a lite change whose `20-plan` phase is `approved` with an approval hash computed with the report-field lines of its task sections included, as the sdd CLI 0.1.0 computes it, THE sdd CLI SHALL set that `20-plan` phase `stale`, with no rule that accepts the hash of the 0.1.0 normalisation.
- **Rationale:** Q-litehash-02 ("Re-approve G3 once", `questions-log.md` of this phase, round 4): no compatibility code. P-01 revises the plan and re-approves G3 once with the sdd CLI 0.1.1, after which the stored hash follows C005-REQ-121; the 0.1.1 release notes tell P-01 of that one re-approval and of the sdd CLI it needs (C005-REQ-125). If the sdd CLI 0.1.0 reported tasks of the plan, a task section may hold report-field lines between `- **Done when:**` and its checkboxes (E-99; D-001), which C005-REQ-127 does not move; LINT-TASK-001 then reads Done when as empty, and that G3 approval refuses with ERR-CLI-010 (`src/gate/gate.ts:138-139`) until P-01 moves the lines by hand, as the release notes also state (C005-REQ-125; Q-placement-01, "Hand move in notes (Recommended)", round 7; critic CR-46). The approval holds only while every later `sdd stale check` of the change runs the sdd CLI 0.1.1: the sdd CLI 0.1.0 computes the hash with the report-field lines included, so it sets the phase `stale` again whenever the plan holds such a line (critic CR-25). Under C005-REQ-121 the recomputed hash of such a plan leaves out the report-field lines that its stored hash includes. The two hashes therefore differ even when nothing changed since the approval, and C001-REQ-810 sets the phase `stale`. A stored approval records no version of the hash rule (E-96). Full changes and the other phases are not affected (C005-REQ-121). At `fef82eb` no lite change of this repository has an approved `20-plan` (registry: CHG-003, CHG-004 and CHG-005 at `not-started`); CHG-005 becomes such a change if its G3 approval is made with the sdd CLI 0.1.0.
- **Stories:** C005-US-104
- **Priority:** Must
- **Acceptance:** C005-AC-122.1

#### C005-AC-122.1 — Lite plan approved with the sdd CLI 0.1.0 reported stale once, re-approved once
```gherkin
Scenario Outline: C005-TS-170 — first 0.1.1 stale check on a plan approved with the sdd CLI 0.1.0
  Given a <profile> change 004 whose phase "20-plan" is "approved" with the hash that the sdd CLI 0.1.0 computed, recorded in "approvals.json", with <tasks>
  And no file of "20-plan" has changed since that approval
  When "sdd stale check 004" runs with the sdd CLI 0.1.1
  Then <result>
  Examples:
    | profile | tasks                                                            | result                                                                                         |
    | lite    | the task sections of "20-plan/plan.md" at Status "todo"          | the output reports phase "20-plan" stale and "change.md" gives "20-plan" the status "stale"    |
    | full    | the task files of "20-plan/50-tasks/" at status "todo"           | the output reports no stale phase and "change.md" gives "20-plan" the status "approved"        |
```

```gherkin
Scenario: C005-TS-171 — after one re-approval, task reports leave the plan approved
  Given the lite change 004 of C005-TS-170 after its stale check, then one revision of phase "20-plan" and its G3 approval with the sdd CLI 0.1.1
  When "sdd task set C004-T-001 --status in-progress" runs
  Then "sdd stale check 004" reports no stale phase
  And "change.md" gives "20-plan" the status "approved"
```

### C005-REQ-127 — Place of a report-field line in a lite task section
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** event-driven
- **Statement:** WHEN `sdd task set` writes a report field into a lite task section of `20-plan/plan.md`, THE sdd CLI SHALL write the field's line in place of the section's first field line of that field, or, when the section holds no field line of that field, directly after the section's last field line and its continuation lines, or, when the section holds no field line, directly after the section's heading line.
- **Rationale:** defect D-001 of this change, found when C005-T-001 was reported on 2026-11-17; P-01's answer to Q-d001-01 ("Fix in CHG-005 (Recommended)": one requirement and one task, `questions-log.md` of this phase, round 6). Field line and continuation line: glossary delta; the continuation lines of a field line are the lines that LINT-TASK-001 reads as that field's value (`src/lint/spec.ts:180`), so a blank line or an unindented line ends them (critic CR-42). The sdd CLI 0.1.0 replaces the first line of the section that begins with `- **<name>:**` and otherwise inserts the field after the last line of the section that begins with `- **` (E-99), or after the heading line when there is none (`src/tracking/task.ts:95` at `9eae3b2`). In a task section whose last field is `- **Done when:**` with its checkbox lines, the Commit, Notes and Completed at lines therefore land between that field and its checkboxes. The checkboxes then belong to Completed at, LINT-TASK-001 reports an empty Done when, and `sdd gate approve` refuses a lite `20-plan` until the lines are moved by hand. Only the place of a missing field changes: it now follows the continuation lines of the last field line. The replacement in place and the place after the heading line are 0.1.0 behaviour, stated here because no living requirement places a field line of a lite task: C001-REQ-901 writes the frontmatter of a task file only (`../../_living/CAP-tracking-archive.md:58`), and C001-REQ-618 names the fields of a lite task section, not where `sdd task set` writes them (`../../_living/CAP-planning.md:405`; critic CR-44). The statement has one outcome, the place of the written line, and its three cases exclude each other. Lines that the sdd CLI 0.1.0 already wrote keep their place, since a field that the section holds is replaced in place; P-01 moves them by hand, as P-01's answer to Q-placement-01 decided ("Hand move in notes (Recommended)", `questions-log.md` of this phase, round 7; C005-REQ-125; C005-US-104, Out of scope). Where the lines stand does not change the approval hash: step 2a of C005-IF-005 removes them wherever they are in the task section.
- **Stories:** C005-US-104
- **Priority:** Must
- **Acceptance:** C005-AC-127.1
- **Open items:** the values that `sdd task set` writes into the report-field lines (E-99) stay as at 0.1.0; no living requirement states them for a lite task section (C001-REQ-901 covers task-file frontmatter), and this requirement states only where the lines go.

#### C005-AC-127.1 — A report-field line of a lite task replaces that field's line, or directly follows the last field line and its continuation lines, or directly follows the heading line
```gherkin
Scenario Outline: C005-TS-176 — missing report fields written directly after the two indented checkbox lines of Done when
  Given an active lite change 004 whose "20-plan/plan.md" holds the task section "C004-T-001" that begins with exactly these lines, in this order:
    """
    ### C004-T-001 — CSV export
    - **Status:** in-progress
    - **Targets:**
      - add src/export/csv.ts
    - **Verification:**
      - npm test
    - **Done when:**
      - [ ] CSV header written
      - [ ] CSV rows written
    """
  And <next>
  When "sdd task set C004-T-001 --status done --commit a1b2c3d --note "CSV export done"" runs
  Then the lines "  - [ ] CSV header written" and "  - [ ] CSV rows written" directly follow the line "- **Done when:**", in this order
  And the lines "- **Commit:** a1b2c3d", "- **Notes:** CSV export done" and "- **Completed at:** " followed by today's date directly follow the line "  - [ ] CSV rows written", in this order
  And the line directly after the line "- **Completed at:** " followed by today's date is <after>
  And the line "- **Status:** done" stands where "- **Status:** in-progress" stood
  And "sdd lint 004" reports no LINT-TASK-001 finding for "C004-T-001"
  Examples:
    | next                                                                                                                                                        | after                                                                     |
    | the section ends with the line "  - [ ] CSV rows written", and the line directly after the section is the heading line "### C004-T-002 — CSV download"     | the heading line "### C004-T-002 — CSV download"                          |
    | the section ends with a blank line after "  - [ ] CSV rows written", and the line directly after the section is the heading line "## Test mapping"         | the blank line that ends the section                                      |
    | the section ends with the line "  - [ ] CSV rows written", which is the last line of the file, ended by a line break                                       | none: the line "- **Completed at:** " with today's date ends the file, ended by a line break |
```

```gherkin
Scenario Outline: C005-TS-177 — place of a missing report field after the last field line, by the form of the lines that follow it
  Given an active lite change 004 whose "20-plan/plan.md" holds the task section "C004-T-001" with exactly these lines, in this order: "### C004-T-001 — CSV export", "- **Status:** todo", "- **Done when:**", then <tail>, where "" stands for a blank line
  And the line directly after the section is the heading line "## Test mapping"
  When "sdd task set C004-T-001 --status in-progress" runs
  Then the line "- **Status:** in-progress" stands where "- **Status:** todo" stood
  And the line "- **Completed at:** —" stands directly after the line <before> and directly before <after>
  And every other line of the file keeps its content and its order
  Examples:
    | tail                                                                 | before                           | after                              |
    | "  - [ ] CSV header written", "- **Archive task:** true", ""         | "- **Archive task:** true"       | a blank line                       |
    | "  - [ ] CSV header written", "", "  - [ ] CSV rows written", ""     | "  - [ ] CSV header written"     | a blank line                       |
    | "  - [ ] CSV header written", "- [ ] CSV rows written", ""           | "  - [ ] CSV header written"     | the line "- [ ] CSV rows written"  |
    | "- [ ] CSV header written", ""                                       | "- **Done when:**"               | the line "- [ ] CSV header written" |
```

Readings of the insertion point listed by critic CR-42 (`90-critic-report.md`) that each row of C005-TS-177 rules out:
row 1 (a last field with no continuation line) rules out "every line up to the next field or the end of the section"
(c), which also takes the trailing blank line; row 2 (a blank line, then an indented line) rules out the Markdown list
item (b), reading (c) and the 0.1.0 place (directly after `- **Done when:**`); row 3 (an unindented `- [ ]` line after
an indented one) rules out reading (c) and the 0.1.0 place; row 4 (an unindented `- [ ]` line directly after the field
line) rules out reading (c). Rows 1 and 4 keep the 0.1.0 result.

```gherkin
Scenario: C005-TS-178 — report fields of a task section with no field line written directly after its heading line
  Given an active lite change 004 whose "20-plan/plan.md" holds the task section "C004-T-001" with exactly these lines, in this order: "### C004-T-001 — CSV export", "Write the CSV export.", ""
  And the line directly after the section is the heading line "## Test mapping"
  When "sdd task set C004-T-001 --status in-progress" runs
  Then the line "- **Status:** in-progress" directly follows the line "### C004-T-001 — CSV export"
  And the line "- **Completed at:** —" directly follows the line "- **Status:** in-progress"
  And the line "Write the CSV export." directly follows the line "- **Completed at:** —"
```

```gherkin
Scenario Outline: C005-TS-179 — report field that the section holds replaced where its first field line stands
  Given an active lite change 004 whose "20-plan/plan.md" holds the task section "C004-T-001" with exactly these lines, in this order: "### C004-T-001 — CSV export", "- **Status:** in-progress", "- **Done when:**", then <lines>, where "" stands for a blank line
  And the line directly after the section is the heading line "## Test mapping"
  When "sdd task set C004-T-001 --status done --commit a1b2c3d" runs
  Then the line "- **Status:** done" stands where "- **Status:** in-progress" stood
  And the line "- **Commit:** a1b2c3d" stands where the line "- **Commit:** 0a0a0a0" stood
  And the line "- **Completed at:** " followed by today's date stands where the line "- **Completed at:** —" stood
  And the file has as many lines as before, and every other line keeps its content and its place
  Examples:
    | lines                                                                                                 |
    | "  - [ ] CSV header written", "- **Commit:** 0a0a0a0", "- **Completed at:** —", ""                    |
    | "- **Commit:** 0a0a0a0", "- **Completed at:** —", "  - [ ] CSV header written", ""                    |
    | "- **Commit:** 0a0a0a0", "  - [ ] CSV header written", "- **Commit:** 0b0b0b0", "- **Completed at:** —", "" |
```

### C005-REQ-116 — Read-only subcommands on an archived change
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** event-driven
- **Statement:** WHEN a read-only `sdd` subcommand names a change number that only a change folder under `.sdd/_archive/` carries, THE sdd CLI SHALL run that subcommand on that folder.
- **Rationale:** Q-scope-02 ("Read-only lookups"); ideation §4.1 G-5. Read-only `sdd` subcommands are the complement of the writing `sdd` subcommands (E-54, E-55; Domain notes). Today each of them fails with ERR-CLI-002 on an archived change (E-46, E-51, E-66), while the phase hash works on an archived folder (E-49). Those that name a change are `gate show`, `hash`, `lint`, `trace` without `--write` and `archive --dry-run` (`evidence/spec-addendum.md` §1); `status` without `--write` names none and already reads archived changes (E-50, E-66). `gate show` and `lint` select the change a second time in the lint engine (E-57, E-66), so the outcome holds only when that selection finds the folder as well. On an archived change, `archive --dry-run` reaches the archive plan's existing refusal of an archived change, ERR-CLI-014 (E-65), instead of ERR-CLI-002. C001-REQ-801 and C001-REQ-806 do not exclude archived changes (E-52); C001-REQ-801 stays as stated, and C001-REQ-806 changes only by C005-REQ-121, which keeps that point (critic CR-24).
- **Stories:** C005-US-105
- **Priority:** Must
- **Acceptance:** C005-AC-116.1

#### C005-AC-116.1 — Read-only subcommands run on an archived change
```gherkin
Scenario Outline: C005-TS-146 — read-only subcommand on an archived change
  Given a workspace whose change 001 lies under ".sdd/_archive/001-coupon-codes/", with no folder ".sdd/001-*"
  And "sdd hash 001 10-spec" printed the hash H before the archive
  When "<command>" runs
  Then the output contains no "ERR-CLI-002"
  And <result>
  And no file under ".sdd/" differs from its content before the run
  Examples:
    | command                   | result                                                        |
    | sdd hash 001 10-spec      | standard output is the hash H                                 |
    | sdd gate show 001 10-spec | standard output is the gate summary of phase "10-spec" of change 001 |
    | sdd lint 001              | the findings printed all name files of ".sdd/_archive/001-coupon-codes/" |
    | sdd trace 001             | standard output is the trace result of change 001             |
```

```gherkin
Scenario: C005-TS-147 — archive --dry-run on an archived change reaches the archive plan's refusal
  Given the workspace of C005-TS-146
  When "sdd archive 001 --dry-run" runs
  Then the command fails with ERR-CLI-014, not ERR-CLI-002
  And no file under ".sdd/" differs from its content before the run
```

```gherkin
Scenario: C005-TS-148 — number carried by no change folder
  Given the workspace of C005-TS-146, where no folder in ".sdd/" or ".sdd/_archive/" carries the number 009
  When "sdd hash 009 10-spec" runs
  Then the command fails with ERR-CLI-002 and exit code 2
```

### C005-REQ-117 — Writing subcommands refuse an archived change
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** unwanted-behaviour
- **Statement:** IF a writing `sdd` subcommand names an archived change, by its number or by an ID of that change, THEN THE sdd CLI SHALL refuse with exit code 2 and write no file.
- **Rationale:** Q-scope-02 (writing commands keep refusing); ideation §4.2 item 2 and §9 risk "archived resolver lets a writing command touch a closed change". The writing subcommands that name a change, and the files each one writes: `evidence/spec-addendum.md` §1 (E-59 … E-65). Today they refuse with ERR-CLI-002 (E-46, E-48, E-51); the tests of E-53 (ERR-CLI-002 on a missing change) stay green. The error code is ERR-CLI-014, which gate approval and the archive plan already give an archived change (E-61, E-65); C005-IF-001 sets it (Decision: error code of a writing invocation on an archived change). A writing subcommand that names no change names no archived change, so it is outside this requirement, also when run from inside `.sdd/_archive/` (C005-US-105, Out of scope; critic CR-15).
- **Stories:** C005-US-105
- **Priority:** Must
- **Acceptance:** C005-AC-117.1

#### C005-AC-117.1 — Writing subcommands refuse an archived change and write nothing
```gherkin
Scenario Outline: C005-TS-149 — writing subcommand naming an archived change by number
  Given the workspace of C005-TS-146, whose archived change 001 has the closed defect "D-001"
  When "<command>" runs
  Then the exit code is 2
  And standard error starts with "ERR-CLI-014"
  And no file under ".sdd/" differs from its content before the run
  Examples:
    | command                                                   |
    | sdd trace 001 --write                                     |
    | sdd stale check 001                                       |
    | sdd gate approve 001 20-plan --note "again"               |
    | sdd gate record 001 20-plan --decision revise --note "redo" |
    | sdd change revise 001 10-spec --reason "edit"             |
    | sdd change stop 001 --reason "stop"                       |
    | sdd defect reopen D-001 --change 001                      |
    | sdd defect close D-001 --change 001 --resolution "again"  |
    | sdd id next TS --change 001                               |
    | sdd change profile 001 full                               |
    | sdd archive 001                                           |
```

```gherkin
Scenario Outline: C005-TS-150 — writing subcommand naming an archived change by an ID
  Given the workspace of C005-TS-146, whose archived change 001 holds the task "C001-T-075" and the requirement "C001-REQ-913"
  When "<command>" runs
  Then the exit code is 2
  And standard error starts with "<code>"
  And no file under ".sdd/" differs from its content before the run
  Examples:
    | command                                                          | code        |
    | sdd task set C001-T-075 --status done                            | ERR-CLI-014 |
    | sdd defect add --ref C001-REQ-913 --summary "late finding"       | ERR-CLI-008 |
    | sdd id tombstone C001-REQ-913 --reason "retire"                  | ERR-CLI-014 |
```

```gherkin
Scenario: C005-TS-166 — refusal line of a writing subcommand on an archived change
  Given the workspace of C005-TS-146
  When "sdd stale check 001" runs
  Then standard error is the single line "ERR-CLI-014: Change `001` is `archived`. Fix: Create a new change"
  And the exit code is 2
```

### C005-REQ-118 — 0.1.1 packages for both hosts
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** ubiquitous
- **Statement:** THE 0.1.1 release SHALL contain the Claude Code plugin package and the Copilot target package, each at version 0.1.1.
- **Rationale:** Q-release-01 ("Release 0.1.1 here"); ideation §4.1 G-6 and §5; both hosts as in Context, Conventions. The version has one source, `plugin.json` (E-5), from which the build takes the version of every package (C002-REQ-502; E-32). The Copilot target package is released only when the release check allows it (C002-REQ-617, C002-REQ-618), and its release record names version 0.1.1. Package set as for 0.1.0 (`docs/releases/github-release-notes-0.1.0.md`).
- **Stories:** C005-US-106
- **Priority:** Must
- **Acceptance:** C005-AC-118.1

#### C005-AC-118.1 — 0.1.1 release holds both host packages at version 0.1.1
```gherkin
@review
Scenario: C005-TS-152 — packages of the 0.1.1 release
  Given the 0.1.1 release is published on GitHub
  When P-01 reviews the release and its assets
  Then the release holds the Claude Code plugin package, whose "plugin.json" gives version "0.1.1"
  And it holds the Copilot target package with its checksum, whose package manifest gives version "0.1.1"
  And the Copilot release record names version "0.1.1" and the release check result that allows the release
```

### C005-REQ-119 — `architect-sdd` 0.1.1 on npm no later than the release
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** ubiquitous
- **Statement:** THE `architect-sdd` package SHALL be published on the npm registry at version 0.1.1 no later than the 0.1.1 release.
- **Rationale:** Q-release-01; the install line of a 0.1.1 hand-off names `architect-sdd@0.1.1` (C005-REQ-106, C005-REQ-107), and the Copilot target package needs the `sdd` of its own version (C002-REQ-509); ideation §9 risk "a 0.1.1 hand-off names a version not yet on npm". P-01 publishes (ideation §5; C002-REQ-502, Open items).
- **Stories:** C005-US-106
- **Priority:** Must
- **Acceptance:** C005-AC-119.1

#### C005-AC-119.1 — architect-sdd 0.1.1 on npm no later than the release
```gherkin
@review
Scenario: C005-TS-153 — npm publication before or with the release
  Given the 0.1.1 release is published on GitHub
  When P-01 runs "npm view architect-sdd@0.1.1 version" and "npm view architect-sdd time --json"
  Then the first command prints "0.1.1"
  And the publish time of "0.1.1" in the second output is no later than the publish time of the 0.1.1 release on GitHub
```

### C005-REQ-120 — Release notes for existing workspaces
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** ubiquitous
- **Statement:** THE 0.1.1 release notes SHALL quote the reporting sentence that the sdd CLI 0.1.0 wrote in the section "If you are implementing a change" of `SDD.md` and give the sentence that replaces it.
- **Rationale:** Q-sddmd-01 ("Release note only", `questions-log.md` of this phase): an existing `SDD.md` keeps the old sentence, since only `sdd init --force` re-renders it (E-80); the new sentence: C005-REQ-109. The release-notes statement on the one G3 re-approval of a lite plan is a separate outcome: C005-REQ-125.
- **Stories:** C005-US-106
- **Priority:** Must
- **Acceptance:** C005-AC-120.1

#### C005-AC-120.1 — Release notes give the old and the new SDD.md sentence
```gherkin
@review
Scenario: C005-TS-154 — SDD.md sentence in the 0.1.1 release notes
  Given the 0.1.1 release notes
  When P-01 reviews them
  Then they quote the sentence "Read `NNN-slug/20-plan/handoff.md` and report progress with `node <plugin-root>/scripts/sdd.mjs task set <task-id> --status <status>` as described there."
  And they give, as its replacement, the text that "sdd init" 0.1.1 writes in the section "If you are implementing a change" in C005-TS-126
```

### C005-REQ-125 — Release notes on the one G3 re-approval of a lite plan
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** ubiquitous
- **Statement:** THE 0.1.1 release notes SHALL state, for a lite change whose `20-plan` phase was approved with the sdd CLI 0.1.0, that the first `sdd stale check` of the sdd CLI 0.1.1 sets that phase `stale`, that one revision of the phase and one G3 approval with the sdd CLI 0.1.1 make it `approved` again, that before that G3 approval P-01 moves each report-field line that stands between a field line, such as `- **Done when:**`, and that field's indented lines, such as its checkbox lines, to directly after those indented lines, and that the approval holds only while every later `sdd stale check` of the change runs the sdd CLI 0.1.1.
- **Rationale:** Q-litehash-02 ("Re-approve G3 once", `questions-log.md` of this phase, round 4): no compatibility code, so P-01 learns of the one re-approval from the release notes. The stale result: C005-REQ-122; the hash rule after the re-approval: C005-REQ-121. The two CLI versions give a lite plan different hashes in both directions (critic CR-25): a G3 approval made with the sdd CLI 0.1.0 is undone by the first stale check of the sdd CLI 0.1.1, and an approval made with the sdd CLI 0.1.1 is undone by a later stale check of the sdd CLI 0.1.0 (C005-REQ-122), so "one re-approval" holds only with the sdd CLI 0.1.1 at the approval and at every later stale check. The hand move: if the sdd CLI 0.1.0 reported tasks of such a plan, it may have written report-field lines between a field and its indented lines (E-99; D-001). C005-REQ-127 changes only where a missing field goes and replaces a field that the section holds in place, so those lines stay where they are; LINT-TASK-001 then reads the field, such as Done when, as empty, and the G3 approval refuses with ERR-CLI-010 until they are moved (C005-REQ-122; critic CR-46). The sdd CLI repairs no such section, and the release notes tell P-01 to move the lines by hand: P-01's answer to Q-placement-01 ("Hand move in notes (Recommended)", `questions-log.md` of this phase, round 7; C005-US-104, Out of scope). The fix of D-001 for later reports is C005-REQ-127 (Q-d001-01, round 6). The four parts are one outcome, the one-time procedure, checked together by one review (C005-AC-125.1). Separate from C005-REQ-120, since the procedure and the `SDD.md` sentence can each be present or missing on its own.
- **Stories:** C005-US-106
- **Priority:** Must
- **Acceptance:** C005-AC-125.1

#### C005-AC-125.1 — Release notes state the one G3 re-approval of a lite plan approved with the sdd CLI 0.1.0 and the hand move before it
```gherkin
@review
Scenario: C005-TS-172 — G3 re-approval and hand move stated in the 0.1.1 release notes
  Given the 0.1.1 release notes
  When P-01 reviews them
  Then they state that the first "sdd stale check" of the sdd CLI 0.1.1 reports stale the "20-plan" phase of a lite change approved with the sdd CLI 0.1.0
  And they state that one revision of that phase and one G3 approval with the sdd CLI 0.1.1 make it approved again
  And they state that, before that G3 approval, P-01 moves each report-field line that stands between a field line, such as "- **Done when:**", and that field's indented lines, such as its checkbox lines, to directly after those indented lines
  And they state that this approval holds only while every later "sdd stale check" of the change runs the sdd CLI 0.1.1
```

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
