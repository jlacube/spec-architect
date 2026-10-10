---
id: C001-CAP-09
artifact: spec/acceptance
capability: "Implementation tracking, orientation and archive"
change: CHG-001
phase: 10-spec
status: draft
---

# C001-CAP-09 — Acceptance criteria and scenarios

## C001-REQ-901

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

## C001-REQ-902

#### C001-AC-902.1 — Invalid status
```gherkin
Scenario: C001-TS-903 — unknown status value
  When the user runs "$SDD task set C004-T-031 --status finished"
  Then the exit code is 2 and standard error contains "ERR-CLI-005" and the valid values
  And no file is modified
```

## C001-REQ-903

#### C001-AC-903.1 — Blocked without reason
```gherkin
Scenario: C001-TS-904 — missing reason
  When the user runs "$SDD task set C004-T-031 --status blocked"
  Then the exit code is 2 and standard error contains "ERR-CLI-006"
```

## C001-REQ-904

#### C001-AC-904.1 — Out-of-order completion warns
```gherkin
Scenario: C001-TS-905 — dependency unfinished
  Given "C004-T-031" depends on "C004-T-029" with status "in-progress"
  When the user runs "$SDD task set C004-T-031 --status done --commit abc1234"
  Then the exit code is 0
  And the output contains "WARN-CLI-001" naming "C004-T-029"
  And the task status is "done"
```

## C001-REQ-905

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

## C001-REQ-906

#### C001-AC-906.1 — Done without commit warned
```gherkin
Scenario: C001-TS-907 — missing commit link
  Given task "C004-T-031" with status "done" and empty report.commit
  When the user runs "$SDD lint"
  Then the report contains warning "LINT-TASK-003" for "C004-T-031"
```

## C001-REQ-907

#### C001-AC-907.1 — Defect recorded
```gherkin
Scenario: C001-TS-908 — add defect
  When the user runs "$SDD defect add --ref C004-REQ-012 --summary \"PSP returns expiry in UTC\""
  Then "change.md" of "004" lists defect "D-001" with ref "C004-REQ-012", the summary, a reporter, today's date and status "open"
  And "registry.json" lists the same defect
```

## C001-REQ-908

#### C001-AC-908.1 — Unknown reference refused
```gherkin
Scenario: C001-TS-909 — bad ref
  When the user runs "$SDD defect add --ref C004-REQ-999 --summary \"x\""
  Then the exit code is 2 and standard error contains "ERR-CLI-008"
```

## C001-REQ-909

#### C001-AC-909.1 — Conductor proposes revision
```gherkin
Scenario: C001-TS-910 — open defect at orientation
  Given change "004" has open defect "D-001" referencing "C004-REQ-012" (defined in 10-spec)
  When the conductor session starts
  Then the first reply lists "D-001" with "C004-REQ-012"
  And proposes "/architect:revise spec 004"
```

## C001-REQ-910

#### C001-AC-910.1 — Defect closed
```gherkin
Scenario: C001-TS-911 — close defect
  When the user runs "$SDD defect close D-001 --change 004 --resolution \"REQ-012 now uses UTC (rev 2)\""
  Then defect "D-001" has status "closed", that resolution and today's date
```

## C001-REQ-911

#### C001-AC-911.1 — Brief content and length
```gherkin
Scenario: C001-TS-912 — session-start brief
  Given changes "003" (20-plan approved, 7/12 tasks, 1 open defect) and "004" (10-spec draft)
  When a Claude Code session starts in the repository
  Then the hook output has at most 10 lines
  And mentions "003", "20-plan", "7/12", "1 open defect", "004", "10-spec", "draft"
```

## C001-REQ-912

#### C001-AC-912.1 — No output without workspace
```gherkin
Scenario: C001-TS-913 — unrelated repository
  Given a repository without ".sdd"
  When a Claude Code session starts with the plugin enabled
  Then the session-start hook exits 0 with empty standard output and empty standard error
```

## C001-REQ-913

#### C001-AC-913.1 — Preconditions listed
```gherkin
Scenario: C001-TS-914 — archive refused
  Given change "004" with G3 approved, task "C004-T-032" "in-progress" and defect "D-002" open
  When the user runs "$SDD archive 004"
  Then the exit code is 2 and standard error contains "ERR-CLI-009", "C004-T-032" and "D-002"
  And no file in ".sdd/_living" or ".sdd/004-*" is modified
```

## C001-REQ-914

#### C001-AC-914.1 — ADDED appended, inventory kept
```gherkin
Scenario: C001-TS-915 — archive into an inventory stub
  Given "_living/CAP-billing.md" with "inventory_only: true" and sections Purpose, Entry points
  And change "004" adds "C004-REQ-012" in capability "billing"
  When the user runs "$SDD archive 004"
  Then "_living/CAP-billing.md" has "inventory_only: false", still has Purpose and Entry points, and contains "C004-REQ-012"
```

## C001-REQ-915

#### C001-AC-915.1 — MODIFIED replaces with history
```gherkin
Scenario: C001-TS-916 — modified requirement
  Given "_living/CAP-billing.md" contains "C002-REQ-044"
  And change "004" has "C004-REQ-012" with "Delta: MODIFIED (was C002-REQ-044)"
  When the user runs "$SDD archive 004"
  Then "_living/CAP-billing.md" contains "C004-REQ-012" and no requirement heading "C002-REQ-044"
  And its History section has a row "C002-REQ-044 superseded by C004-REQ-012 in CHG-004" with today's date
```

## C001-REQ-916

#### C001-AC-916.1 — REMOVED deleted with history
```gherkin
Scenario: C001-TS-917 — removed requirement
  Given change "004" has a requirement with "Delta: REMOVED (was C002-REQ-050)"
  When the user runs "$SDD archive 004"
  Then "C002-REQ-050" no longer appears as a requirement heading in "_living/"
  And the History section records its removal by "CHG-004"
```

## C001-REQ-917

#### C001-AC-917.1 — RENAMED moves and records old title
```gherkin
Scenario: C001-TS-918 — renamed to another capability
  Given "C002-REQ-060" in "_living/CAP-billing.md" with title "Invoice export"
  And change "004" renames it to "Statement export" in capability "reporting"
  When the user runs "$SDD archive 004"
  Then "_living/CAP-reporting.md" contains the entry with title "Statement export"
  And "_living/CAP-billing.md" History records the move and the old title
```

## C001-REQ-918

#### C001-AC-918.1 — ACs and TSs merged
```gherkin
Scenario: C001-TS-919 — acceptance carried along
  Given "C004-REQ-012" has "C004-AC-012.1", "C004-AC-012.2" and scenarios "C004-TS-040", "C004-TS-041"
  When the user runs "$SDD archive 004"
  Then those four IDs appear under "C004-REQ-012" in the living file
```

## C001-REQ-919

#### C001-AC-919.1 — Glossary updated
```gherkin
Scenario: C001-TS-920 — glossary merge
  Given "glossary-delta.md" of change "004" defines "payment intent" and redefines "checkout"
  When the user runs "$SDD archive 004"
  Then "_constitution/glossary.md" contains "payment intent"
  And the definition of "checkout" equals the delta's definition
```

## C001-REQ-920

#### C001-AC-920.1 — Folder moved and status updated
```gherkin
Scenario: C001-TS-921 — final move
  When "$SDD archive 004" succeeds
  Then ".sdd/_archive/004-*" exists and ".sdd/004-*" does not
  And "registry.json" shows "CHG-004" with status "archived"
  And SDD.md's status block has no row for "004"
```

## C001-REQ-921

#### C001-AC-921.1 — Dry run modifies nothing
```gherkin
Scenario: C001-TS-922 — preview
  When the user runs "$SDD archive 004 --dry-run"
  Then the output lists each planned operation with file, operation and ID
  And a checksum of all files under ".sdd" is identical before and after
```

## C001-REQ-922

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

## C001-REQ-923

#### C001-AC-923.1 — Reopen keeps history
```gherkin
Scenario: C001-TS-924 — reopen a closed defect
  Given defect "D-001" of change "004" closed with resolution "REQ-012 now uses UTC (rev 2)"
  When the user runs "$SDD defect reopen D-001 --change 004"
  Then "D-001" has status "open"
  And its history list contains the previous resolution and closing date
```

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C001-REQ-901 | TS-901 | TS-902 | n/a | n/a | n/a | n/a: one writer | n/a |
| C001-REQ-902 | TS-903 | n/a | n/a | TS-903 | n/a | n/a | n/a |
| C001-REQ-903 | TS-904 | n/a | n/a | TS-904 | n/a | n/a | n/a |
| C001-REQ-904 | TS-905 | n/a | n/a | TS-905 | n/a | n/a | n/a |
| C001-REQ-905 | TS-906 | TS-906 | TS-906 | n/a | n/a | n/a | n/a |
| C001-REQ-906 | TS-907 | n/a | n/a | TS-907 | n/a | n/a | n/a |
| C001-REQ-907 | TS-908 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-908 | TS-909 | n/a | n/a | TS-909 | n/a | n/a | n/a |
| C001-REQ-909 | TS-910 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-910 | TS-911 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-911 | TS-912 | n/a | TS-912 (10 lines) | n/a | n/a | n/a | n/a |
| C001-REQ-912 | TS-913 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-913 | TS-914 | n/a | n/a | TS-914 | n/a | n/a | n/a |
| C001-REQ-914 | TS-915 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-915 | TS-916 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-916 | TS-917 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-917 | TS-918 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-918 | TS-919 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-919 | TS-920 | TS-920 (redefinition) | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-920 | TS-921 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-921 | TS-922 | n/a | n/a | n/a | n/a | TS-922 (no side effects) | n/a |
| C001-REQ-922 | TS-923 | TS-923 (reopen done) | n/a | TS-923 | n/a | n/a | n/a |
| C001-REQ-923 | TS-924 | n/a | n/a | n/a | n/a | n/a | n/a |

Per-column n/a reasons: as in CAP-05.
