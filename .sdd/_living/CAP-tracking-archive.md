---
capability: tracking-archive
inventory_only: false
updated: 2026-11-22
---

# Tracking and archive (`C001-CAP-09`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

Task and defect lifecycle tracking, derived implementation status, and the archive step that merges
an implemented change into `_living/` and moves it to `_archive/`.

## Entry points

- `sdd task set`, `sdd defect add|close|reopen`, `sdd archive` (`taskSet`, `defectAdd`,
  `defectClose`, `defectReopen`, `archiveCmd` in `src/cli/commands.ts`).
- Command `plugins/architect/commands/archive.md`.

## Main modules

- `src/tracking/` — `task.ts` (status transitions), `defect.ts`.
- `src/archive/` — `plan.ts` (preview and blockers), `apply.ts`, `living.ts` (living-file edits).
- Implementation-status derivation: `src/workspace/status.ts` (`deriveImplementation`, `taskStates`).

## Owning tests

- `tests/integration/cap09/` (`TS-901` … `TS-924`, fixtures `archive-fixture.ts`,
  `tracking-fixture.ts`).
- Evals: `evals/cap09/TS-910.eval.mjs`.

## Evidence

- **E-1** `src/tracking/task.ts:102` › `setTask()` — applies a task status transition with the report fields.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/archive/plan.ts:171` › `planArchive()` — builds the archive preview.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/archive/apply.ts:9` › `applyArchive()` — applies the archive plan.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-4** `src/archive/living.ts:9` › `newLivingFile()` — creates a `_living/CAP-<slug>.md` file.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127

## Requirements

### C001-REQ-901 — Task status update
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd task set <task-id> --status <status>` runs, THE sdd CLI SHALL write the status, and the provided `--commit` and `--note` values, into the task's frontmatter (`status`, `report.commit`, `report.notes`, and `report.completed_at` when the status is `done`) and then rebuild the registry.
- **Rationale:** IDEA-§10.6
- **Stories:** C001-US-901
- **Priority:** Must
- **Acceptance:** C001-AC-901.1, C001-AC-901.2

#### C001-AC-901.1 — Done with commit
```gherkin
Scenario: C001-TS-901 — mark a task done
  Given task "C004-T-031" with status "in-progress"
  When the user runs "$SDD task set C004-T-031 --status done --commit 3f2a9c1 --note \"merged\""
  Then the task frontmatter has status "done", report.commit "3f2a9c1", report.notes "merged" and report.completed_at = today
  And "registry.json" counts the task as done for "CHG-004"
```

#### C001-AC-901.2 — In progress without commit
```gherkin
Scenario: C001-TS-902 — start a task
  When the user runs "$SDD task set C004-T-032 --status in-progress"
  Then the task frontmatter has status "in-progress" and report.completed_at stays null
```

### C001-REQ-902 — Valid statuses only
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd task set` receives a status other than `todo`, `in-progress`, `blocked`, `done` or `dropped`, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-005` without modifying any file.
- **Rationale:** consistent lifecycle (domain model)
- **Stories:** C001-US-901
- **Priority:** Must
- **Acceptance:** C001-AC-902.1

#### C001-AC-902.1 — Invalid status
```gherkin
Scenario: C001-TS-903 — unknown status value
  When the user runs "$SDD task set C004-T-031 --status finished"
  Then the exit code is 2 and standard error contains "ERR-CLI-005" and the valid values
  And no file is modified
```

### C001-REQ-903 — Blocked needs a reason
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd task set --status blocked` is run without `--reason`, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-006`.
- **Rationale:** blocked tasks must be actionable
- **Stories:** C001-US-901
- **Priority:** Must
- **Acceptance:** C001-AC-903.1

#### C001-AC-903.1 — Blocked without reason
```gherkin
Scenario: C001-TS-904 — missing reason
  When the user runs "$SDD task set C004-T-031 --status blocked"
  Then the exit code is 2 and standard error contains "ERR-CLI-006"
```

### C001-REQ-904 — Done before dependencies
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a task is set to `done` while a task in its `depends_on` list has a status other than `done` or `dropped`, THEN THE sdd CLI SHALL record the update and print warning `WARN-CLI-001` naming the unfinished dependencies.
- **Rationale:** surfaces out-of-order work without blocking reality
- **Stories:** C001-US-901
- **Priority:** Should
- **Acceptance:** C001-AC-904.1

#### C001-AC-904.1 — Out-of-order completion warns
```gherkin
Scenario: C001-TS-905 — dependency unfinished
  Given "C004-T-031" depends on "C004-T-029" with status "in-progress"
  When the user runs "$SDD task set C004-T-031 --status done --commit abc1234"
  Then the exit code is 0
  And the output contains "WARN-CLI-001" naming "C004-T-029"
  And the task status is "done"
```

### C001-REQ-905 — Implementation status derivation
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE sdd CLI SHALL derive each change's `implementation.status` and task counts from its task statuses according to the rules of C001-IF-03 §2.3, whether the statuses were set by command or by editing frontmatter.
- **Rationale:** frontmatter fallback (IDEA-§10.6 point 3)
- **Stories:** C001-US-902
- **Priority:** Must
- **Acceptance:** C001-AC-905.1

#### C001-AC-905.1 — Derivation from hand edits
```gherkin
Scenario Outline: C001-TS-906 — implementation status rules
  Given change "004" with task statuses "<statuses>" edited by hand
  When the user runs "$SDD status --write"
  Then "implementation.status" of "CHG-004" is "<derived>"
  Examples:
    | statuses                              | derived     |
    | todo, todo, todo                      | not-started |
    | done, in-progress, todo               | in-progress |
    | done, blocked, todo                   | blocked     |
    | done, done, dropped                   | done        |
```

### C001-REQ-906 — Done without commit
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a task has status `done` and an empty `report.commit`, THEN THE lint SHALL report warning `LINT-TASK-003`.
- **Rationale:** P-04 needs commit links for validation
- **Stories:** C001-US-902
- **Priority:** Should
- **Acceptance:** C001-AC-906.1

#### C001-AC-906.1 — Done without commit warned
```gherkin
Scenario: C001-TS-907 — missing commit link
  Given task "C004-T-031" with status "done" and empty report.commit
  When the user runs "$SDD lint"
  Then the report contains warning "LINT-TASK-003" for "C004-T-031"
```

### C001-REQ-907 — Defect creation
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd defect add --ref <id> --summary "<text>"` runs, THE sdd CLI SHALL add to `change.md` and `registry.json` a defect `D-<seq>` with the referenced ID, the summary, the reporter, the date and status `open`.
- **Rationale:** IDEA-§10.6
- **Stories:** C001-US-903
- **Priority:** Must
- **Acceptance:** C001-AC-907.1

#### C001-AC-907.1 — Defect recorded
```gherkin
Scenario: C001-TS-908 — add defect
  When the user runs "$SDD defect add --ref C004-REQ-012 --summary \"PSP returns expiry in UTC\""
  Then "change.md" of "004" lists defect "D-001" with ref "C004-REQ-012", the summary, a reporter, today's date and status "open"
  And "registry.json" lists the same defect
```

### C001-REQ-908 — Defect must reference a real ID
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the `--ref` value of `sdd defect add` is not an ID defined in a non-archived change, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-008`.
- **Rationale:** traceable defects
- **Stories:** C001-US-903
- **Priority:** Must
- **Acceptance:** C001-AC-908.1

#### C001-AC-908.1 — Unknown reference refused
```gherkin
Scenario: C001-TS-909 — bad ref
  When the user runs "$SDD defect add --ref C004-REQ-999 --summary \"x\""
  Then the exit code is 2 and standard error contains "ERR-CLI-008"
```

### C001-REQ-909 — Conductor surfaces open defects
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the conductor orients itself and a change has open defects, THE conductor SHALL list each open defect with its referenced ID and propose `/architect:revise` for the phase that defines that ID.
- **Rationale:** IDEA-§20.3
- **Stories:** C001-US-903
- **Priority:** Must
- **Acceptance:** C001-AC-909.1

#### C001-AC-909.1 — Conductor proposes revision
```gherkin
Scenario: C001-TS-910 — open defect at orientation
  Given change "004" has open defect "D-001" referencing "C004-REQ-012" (defined in 10-spec)
  When the conductor session starts
  Then the first reply lists "D-001" with "C004-REQ-012"
  And proposes "/architect:revise spec 004"
```

### C001-REQ-910 — Defect closure
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd defect close <D-id> --resolution "<text>"` runs, THE sdd CLI SHALL set the defect's status to `closed` with the resolution text and date.
- **Rationale:** lifecycle completeness
- **Stories:** C001-US-903
- **Priority:** Must
- **Acceptance:** C001-AC-910.1

#### C001-AC-910.1 — Defect closed
```gherkin
Scenario: C001-TS-911 — close defect
  When the user runs "$SDD defect close D-001 --change 004 --resolution \"REQ-012 now uses UTC (rev 2)\""
  Then defect "D-001" has status "closed", that resolution and today's date
```

### C001-REQ-911 — Session-start brief
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN a Claude Code session starts in a repository containing `.sdd/`, THE session-start hook SHALL emit a brief of at most 10 lines listing each active change with its phase, phase status, task progress and open-defect count.
- **Rationale:** IDEA-§17.2; RK-13
- **Stories:** C001-US-904
- **Priority:** Must
- **Acceptance:** C001-AC-911.1

#### C001-AC-911.1 — Brief content and length
```gherkin
Scenario: C001-TS-912 — session-start brief
  Given changes "003" (20-plan approved, 7/12 tasks, 1 open defect) and "004" (10-spec draft)
  When a Claude Code session starts in the repository
  Then the hook output has at most 10 lines
  And mentions "003", "20-plan", "7/12", "1 open defect", "004", "10-spec", "draft"
```

### C001-REQ-912 — Silent without workspace
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a Claude Code session starts in a repository without `.sdd/`, THEN THE session-start hook SHALL exit with code 0 and empty output.
- **Rationale:** the plugin must not disturb unrelated repositories
- **Stories:** C001-US-904
- **Priority:** Must
- **Acceptance:** C001-AC-912.1

#### C001-AC-912.1 — No output without workspace
```gherkin
Scenario: C001-TS-913 — unrelated repository
  Given a repository without ".sdd"
  When a Claude Code session starts with the plugin enabled
  Then the session-start hook exits 0 with empty standard output and empty standard error
```

### C005-REQ-112 — Archive preconditions without the archive task
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd archive <change>` is requested while gate G3 is not approved, a task without the archive-task marker has a status other than `done` or `dropped`, or a defect is open, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-009` listing every unmet precondition.
- **Rationale:** Q-archive-01 ("Marker in the task", `questions-log.md` of this phase); ideation §4.1 G-4. Today the archive task blocks its own archive until it is done, so it is set done before the archive it performs (E-37, E-38, E-40). The status of a task with the archive-task marker is no precondition, whatever it is; a change without a marked task keeps the rule of C001-REQ-913, every task counted (Q-archive-01: no marker fails safe). The tasks of a lite change: C005-REQ-113 (Q-scope-03).
- **Stories:** C005-US-104
- **Priority:** Must
- **Acceptance:** C005-AC-112.1
- **Evidence:** E-37 — `src/archive/plan.ts:94-108` › `archiveBlockers()` (every file of `20-plan/50-tasks/` done or dropped, the archive task included; layer: serena); E-39 — `src/archive/plan.ts:94-108` › `archiveBlockers()` (no field or rule identifies an archive task; layer: grep); E-41 — `.sdd/_living/CAP-tracking-archive.md:274-281` › `C001-REQ-913` (live statement; layer: grep); E-89 — `.sdd/_archive/001-architect-agent-suite/20-plan/50-tasks/T-075-archive-chg001.md:1-17` › `C001-T-075` (set done before `sdd archive 001`, E-40; layer: grep)
- **Open items:** after the archive, the archive task keeps the status it had when `sdd archive` ran, since no task can be set on an archived change (E-93; C005-REQ-117).

#### C005-AC-112.1 — Archive refused on unmet preconditions, the marked archive task excepted
```gherkin
Scenario Outline: C005-TS-134 — marked archive task does not block, whatever its status
  Given an active full-profile change 003 with gate G3 approved and no open defect
  And the task files "C003-T-001" and "C003-T-002" with status "done"
  And the task file "C003-T-003" "Archive CHG-003 into living specs" with the archive-task marker and status "<status>"
  When "sdd archive 003" runs
  Then the exit code is 0
  And the folder ".sdd/_archive/003-*" exists and no folder ".sdd/003-*" exists
  And "C003-T-003" keeps the status "<status>"
  Examples:
    | status      |
    | todo        |
    | in-progress |
    | blocked     |
```

```gherkin
Scenario: C005-TS-135 — without a marked task the archive task still blocks
  Given an active full-profile change 003 with gate G3 approved and no open defect
  And the task files "C003-T-001" and "C003-T-002" with status "done"
  And the task file "C003-T-003" "Archive CHG-003 into living specs" without the archive-task marker and with status "in-progress"
  When "sdd archive 003" runs
  Then the command fails with ERR-CLI-009 naming "C003-T-003"
  And the folder ".sdd/003-*" is still in place and no folder ".sdd/_archive/003-*" exists
```

```gherkin
Scenario: C005-TS-136 — every unmet precondition listed
  Given an active full-profile change 003 whose gate G3 is not approved and whose defect "D-001" is open
  And the task file "C003-T-002" without the archive-task marker and with status "in-progress"
  And the task file "C003-T-003" with the archive-task marker and status "todo"
  When "sdd archive 003" runs
  Then the command fails with ERR-CLI-009
  And the message names gate G3, "C003-T-002" and "D-001"
  And the message does not name "C003-T-003"
  And no file under ".sdd/" differs from its content before the run
```

```gherkin
Scenario Outline: C005-TS-137 — statuses of an unmarked task
  Given an active full-profile change 003 with gate G3 approved and no open defect
  And the task file "C003-T-002" without the archive-task marker and with status "<status>", every other task "done"
  When "sdd archive 003" runs
  Then <outcome>
  Examples:
    | status      | outcome                                              |
    | done        | the exit code is 0 and the change is archived        |
    | dropped     | the exit code is 0 and the change is archived        |
    | todo        | the command fails with ERR-CLI-009 naming "C003-T-002" |
    | blocked     | the command fails with ERR-CLI-009 naming "C003-T-002" |
```

### C001-REQ-914 — Archive ADDED requirements
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd archive` applies an `ADDED` requirement, THE sdd CLI SHALL append it to `_living/CAP-<slug>.md` of its capability, creating that file if absent and setting `inventory_only: false` while keeping any inventory sections.
- **Rationale:** OA-09; OQ-07
- **Stories:** C001-US-905
- **Priority:** Must
- **Acceptance:** C001-AC-914.1

#### C001-AC-914.1 — ADDED appended, inventory kept
```gherkin
Scenario: C001-TS-915 — archive into an inventory stub
  Given "_living/CAP-billing.md" with "inventory_only: true" and sections Purpose, Entry points
  And change "004" adds "C004-REQ-012" in capability "billing"
  When the user runs "$SDD archive 004"
  Then "_living/CAP-billing.md" has "inventory_only: false", still has Purpose and Entry points, and contains "C004-REQ-012"
```

### C001-REQ-915 — Archive MODIFIED requirements
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd archive` applies a `MODIFIED` requirement, THE sdd CLI SHALL replace the living entry of the cited requirement with the new requirement under its own ID and record the superseded ID, the change ID and the date in the History section of that living file.
- **Rationale:** OA-08 (IDs keep provenance)
- **Stories:** C001-US-905
- **Priority:** Must
- **Acceptance:** C001-AC-915.1

#### C001-AC-915.1 — MODIFIED replaces with history
```gherkin
Scenario: C001-TS-916 — modified requirement
  Given "_living/CAP-billing.md" contains "C002-REQ-044"
  And change "004" has "C004-REQ-012" with "Delta: MODIFIED (was C002-REQ-044)"
  When the user runs "$SDD archive 004"
  Then "_living/CAP-billing.md" contains "C004-REQ-012" and no requirement heading "C002-REQ-044"
  And its History section has a row "C002-REQ-044 superseded by C004-REQ-012 in CHG-004" with today's date
```

### C001-REQ-916 — Archive REMOVED requirements
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd archive` applies a `REMOVED` requirement, THE sdd CLI SHALL delete the cited living entry and record its ID, the change ID and the date in the History section.
- **Rationale:** OA-09
- **Stories:** C001-US-905
- **Priority:** Must
- **Acceptance:** C001-AC-916.1

#### C001-AC-916.1 — REMOVED deleted with history
```gherkin
Scenario: C001-TS-917 — removed requirement
  Given change "004" has a requirement with "Delta: REMOVED (was C002-REQ-050)"
  When the user runs "$SDD archive 004"
  Then "C002-REQ-050" no longer appears as a requirement heading in "_living/"
  And the History section records its removal by "CHG-004"
```

### C001-REQ-917 — Archive RENAMED requirements
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd archive` applies a `RENAMED` requirement, THE sdd CLI SHALL update the title of the cited living entry, moving it to the target capability file when the capability differs, and record the old title in the History section.
- **Rationale:** OpenSpec RENAMED semantics (IDEA-§6.1.2)
- **Stories:** C001-US-905
- **Priority:** Should
- **Acceptance:** C001-AC-917.1

#### C001-AC-917.1 — RENAMED moves and records old title
```gherkin
Scenario: C001-TS-918 — renamed to another capability
  Given "C002-REQ-060" in "_living/CAP-billing.md" with title "Invoice export"
  And change "004" renames it to "Statement export" in capability "reporting"
  When the user runs "$SDD archive 004"
  Then "_living/CAP-reporting.md" contains the entry with title "Statement export"
  And "_living/CAP-billing.md" History records the move and the old title
```

### C001-REQ-918 — Criteria travel with requirements
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd archive` writes a requirement into a living file, THE sdd CLI SHALL include the requirement's acceptance criteria and scenarios under it.
- **Rationale:** current truth must stay verifiable (P-04)
- **Stories:** C001-US-905
- **Priority:** Must
- **Acceptance:** C001-AC-918.1

#### C001-AC-918.1 — ACs and TSs merged
```gherkin
Scenario: C001-TS-919 — acceptance carried along
  Given "C004-REQ-012" has "C004-AC-012.1", "C004-AC-012.2" and scenarios "C004-TS-040", "C004-TS-041"
  When the user runs "$SDD archive 004"
  Then those four IDs appear under "C004-REQ-012" in the living file
```

### C001-REQ-919 — Glossary merge
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd archive` completes the requirement merge, THE sdd CLI SHALL add each term of the change's `glossary-delta.md` to `_constitution/glossary.md`, replacing the definition of an existing term of the same name.
- **Rationale:** C001-REQ-418
- **Stories:** C001-US-905
- **Priority:** Should
- **Acceptance:** C001-AC-919.1

#### C001-AC-919.1 — Glossary updated
```gherkin
Scenario: C001-TS-920 — glossary merge
  Given "glossary-delta.md" of change "004" defines "payment intent" and redefines "checkout"
  When the user runs "$SDD archive 004"
  Then "_constitution/glossary.md" contains "payment intent"
  And the definition of "checkout" equals the delta's definition
```

### C001-REQ-920 — Move to archive
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd archive` has applied all merges, THE sdd CLI SHALL move the change folder to `.sdd/_archive/`, set the change status to `archived` and regenerate the registry and the SDD.md status block.
- **Rationale:** IDEA-§11.1
- **Stories:** C001-US-905
- **Priority:** Must
- **Acceptance:** C001-AC-920.1

#### C001-AC-920.1 — Folder moved and status updated
```gherkin
Scenario: C001-TS-921 — final move
  When "$SDD archive 004" succeeds
  Then ".sdd/_archive/004-*" exists and ".sdd/004-*" does not
  And "registry.json" shows "CHG-004" with status "archived"
  And SDD.md's status block has no row for "004"
```

### C001-REQ-921 — Archive dry run
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE `--dry-run` is passed to `sdd archive`, THE sdd CLI SHALL print every planned operation (file, operation, ID) without modifying any file.
- **Rationale:** preview before an irreversible-feeling merge
- **Stories:** C001-US-906
- **Priority:** Must
- **Acceptance:** C001-AC-921.1

#### C001-AC-921.1 — Dry run modifies nothing
```gherkin
Scenario: C001-TS-922 — preview
  When the user runs "$SDD archive 004 --dry-run"
  Then the output lists each planned operation with file, operation and ID
  And a checksum of all files under ".sdd" is identical before and after
```

### C001-REQ-924 — Interrupted archive completes on re-run
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd archive <change>` runs after an earlier `sdd archive` run of that change was interrupted after writing part of its results (living-spec entries, History rows, glossary rows or the `archived` status in `change.md`) and before moving the change folder to `.sdd/_archive/`, and the change's status is `active` or `archived` and the C001-REQ-913 preconditions hold, THEN THE sdd CLI SHALL complete the operations of C001-REQ-914 … C001-REQ-920 that the interrupted run left undone, so that `.sdd/_living/`, `.sdd/_constitution/glossary.md` and `.sdd/_archive/` (including the moved `change.md`) are byte-identical to one uninterrupted run from the same starting workspace on the date of the interrupted run, with no requirement entry and no History row written twice, the only allowed differences being the History `Date` cells and the living-file `updated` values that a re-run on a later date writes.
- **Rationale:** D-015 (C001-T-080 finding F-6); Q-archive-faults-01, Q-archive-resume-01; critic CR-17. An `archived` status outside `.sdd/_archive/` can only come from an interrupted archive, so `sdd archive` resumes such a change instead of refusing it with ERR-CLI-014; a `stopped` change is still refused with ERR-CLI-014 (C001-INV-06, `../../50-interfaces/errors.md` §1). Operations already applied are recognised without comparing dates, because the re-run can happen on a later day.
- **Stories:** C001-US-905
- **Priority:** Must
- **Acceptance:** C001-AC-924.1

#### C001-AC-924.1 — Re-run completes an interrupted archive exactly once
```gherkin
Scenario Outline: C001-TS-925 — re-run after an interrupted archive
  Given change "004" meets the C001-REQ-913 preconditions and adds "C004-REQ-012" in capability "billing", adds "C004-REQ-013" in capability "payments", modifies "C002-REQ-044" in "billing" (superseded by "C004-REQ-014"), renames "C002-REQ-060" from "Invoice export" in "billing" to "Statement export" in "reporting", and defines "payment intent" in "glossary-delta.md"
  And workspace copy "reference" is the result of one uninterrupted "$SDD archive 004" run on 2026-11-02 from the same starting workspace
  And an earlier "$SDD archive 004" run on 2026-11-02 stopped <interrupted at>, leaving change "004" with status "<status>" in ".sdd/004-*"
  When the user runs "$SDD archive 004" on <re-run date>
  Then the exit code is <code>
  And <result>
  Examples:
    | interrupted at | status | re-run date | code | result |
    | after its first living-file write and before its other living-file writes | active | 2026-11-02 | 0 | ".sdd/_living/", ".sdd/_constitution/glossary.md" and ".sdd/_archive/004-*" (including "change.md") are byte-identical to "reference", and ".sdd/004-*" does not exist |
    | after all living-file writes and the glossary write and before "change.md" | active | 2026-11-02 | 0 | ".sdd/_living/", ".sdd/_constitution/glossary.md" and ".sdd/_archive/004-*" are byte-identical to "reference", and "payment intent" appears once in the glossary |
    | after writing status "archived" to "change.md" and before the folder move | archived | 2026-11-02 | 0 | standard error does not contain "ERR-CLI-014", ".sdd/_living/", ".sdd/_constitution/glossary.md" and ".sdd/_archive/004-*" are byte-identical to "reference", and ".sdd/004-*" does not exist |
    | between the rename's writes of the source file "_living/CAP-billing.md" and the target file "_living/CAP-reporting.md" (in the order the CLI writes them) | active | 2026-11-02 | 0 | "C002-REQ-060" is a requirement heading only in "_living/CAP-reporting.md", titled "Statement export", the History row of its move appears once, and ".sdd/_living/" is byte-identical to "reference" |
    | after its first living-file write and before its other living-file writes | active | 2026-11-05 | 0 | each of "C004-REQ-012", "C004-REQ-013", "C004-REQ-014" and "C002-REQ-060" is a requirement heading exactly once in ".sdd/_living/", each (ID, Event, Change) History row appears exactly once, and ".sdd/_living/", ".sdd/_constitution/glossary.md" and ".sdd/_archive/004-*" differ from "reference" only in History "Date" cells and living-file "updated" values |
    | (no earlier run; the change was stopped at a gate) | stopped | 2026-11-02 | 2 | standard error contains "ERR-CLI-014" and "Change `004` is `stopped`", and a checksum of all files under ".sdd" is identical before and after |
```

### C001-REQ-922 — Allowed task transitions only
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd task set` requests a status transition that the task state machine (`../../40-domain/state-machines.md` §3) does not list, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-013` naming the current and requested statuses.
- **Rationale:** lifecycle integrity (domain model)
- **Stories:** C001-US-901
- **Priority:** Must
- **Acceptance:** C001-AC-922.1

#### C001-AC-922.1 — Disallowed transition refused
```gherkin
Scenario Outline: C001-TS-923 — task transitions
  Given task "C004-T-031" with status "<from>"
  When the user runs "$SDD task set C004-T-031 --status <to>" with any required options
  Then the exit code is <code>
  Examples:
    | from        | to          | code |
    | todo        | in-progress | 0    |
    | done        | in-progress | 0    |
    | dropped     | todo        | 2    |
    | dropped     | done        | 2    |
  And for exit code 2 standard error contains "ERR-CLI-013", the current status and the requested status
```

### C001-REQ-923 — Defect reopening
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd defect reopen <D-id> --change <NNN>` runs on a closed defect, THE sdd CLI SHALL set its status to `open` while keeping its previous resolution and closing date in a history list of that defect.
- **Rationale:** a fix may turn out incomplete during implementation
- **Stories:** C001-US-903
- **Priority:** Should
- **Acceptance:** C001-AC-923.1

#### C001-AC-923.1 — Reopen keeps history
```gherkin
Scenario: C001-TS-924 — reopen a closed defect
  Given defect "D-001" of change "004" closed with resolution "REQ-012 now uses UTC (rev 2)"
  When the user runs "$SDD defect reopen D-001 --change 004"
  Then "D-001" has status "open"
  And its history list contains the previous resolution and closing date
```

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
| C001-REQ-913 | superseded by C005-REQ-112 | CHG-005 | 2026-11-22 |  |
