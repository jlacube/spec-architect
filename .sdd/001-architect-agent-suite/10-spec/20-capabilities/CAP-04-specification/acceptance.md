---
id: C001-CAP-04
artifact: spec/acceptance
capability: "Specification authoring"
change: CHG-001
phase: 10-spec
status: approved
---

# C001-CAP-04 — Acceptance criteria and scenarios

## C001-REQ-401

#### C001-AC-401.1 — One folder per capability with three files
```gherkin
Scenario: C001-TS-401 — capability folders created
  Given change "004" with profile "full" whose ideation identifies capabilities "billing" and "notifications"
  When the spec-writer completes its first pass
  Then the folders "10-spec/20-capabilities/CAP-01-billing" and "CAP-02-notifications" exist
  And each contains "stories.md", "requirements.md" and "acceptance.md"
```

## C001-REQ-402

#### C001-AC-402.1 — Story fields complete
```gherkin
Scenario: C001-TS-402 — missing story field
  Given a story "C004-US-003" without the "So that" field
  When the user runs "$SDD lint"
  Then the report contains error "LINT-US-002" for "C004-US-003" naming the missing field "So that"
```

## C001-REQ-403

#### C001-AC-403.1 — Unknown persona
```gherkin
Scenario: C001-TS-403 — persona not defined
  Given story "C004-US-005" says "As a P-09 auditor"
  And "stakeholders-and-personas.md" defines only P-01 to P-04
  When the user runs "$SDD lint"
  Then the report contains error "LINT-US-001" for "C004-US-005" naming "P-09"
```

## C001-REQ-404

#### C001-AC-404.1 — Requirement fields complete
```gherkin
Scenario Outline: C001-TS-404 — missing requirement field
  Given requirement "C004-REQ-010" in a change of kind "<kind>" without the field "<field>"
  When the user runs "$SDD lint"
  Then the report "<result>" error "LINT-REQ-001" naming "<field>"
  Examples:
    | kind       | field      | result           |
    | greenfield | Pattern    | contains         |
    | greenfield | Acceptance | contains         |
    | greenfield | Delta      | does not contain |
    | brownfield | Delta      | contains         |
```

## C001-REQ-405

#### C001-AC-405.1 — Mismatched pattern detected
```gherkin
Scenario Outline: C001-TS-405 — EARS shape mismatch
  Given a requirement declared "<declared>" with statement "<statement>"
  When the user runs "$SDD lint"
  Then the report "<result>" error "LINT-EARS-001"
  Examples:
    | declared            | statement                                                              | result           |
    | event-driven        | WHEN a file is saved, THE linter SHALL re-run checks.                  | does not contain |
    | event-driven        | THE linter SHALL re-run checks after saves.                            | contains         |
    | unwanted-behaviour  | IF the file is missing, THEN THE sdd CLI SHALL exit with code 2.        | does not contain |
    | unwanted-behaviour  | IF the file is missing, THE sdd CLI SHALL exit with code 2.             | contains         |
    | state-driven        | WHILE a gate is pending, THE conductor SHALL refuse new phases.         | does not contain |
    | optional-feature    | WHERE lite profile is used, THE sdd CLI SHALL scaffold 6 files.         | does not contain |
    | complex             | WHILE offline, WHEN a sync is requested, THE client SHALL queue it.     | does not contain |
    | ubiquitous          | WHEN asked, THE sdd CLI SHALL print its version.                        | contains         |
```

#### C001-AC-405.2 — Case-insensitive keywords
```gherkin
Scenario: C001-TS-406 — lower-case keywords accepted
  Given a requirement declared "event-driven" with statement "When a file is saved, the linter shall re-run checks."
  When the user runs "$SDD lint"
  Then the report does not contain "LINT-EARS-001" for it
```

## C001-REQ-406

#### C001-AC-406.1 — Compound requirement detected
```gherkin
Scenario: C001-TS-407 — two SHALLs
  Given a requirement statement "WHEN init runs, THE sdd CLI SHALL create SDD.md and SHALL NOT overwrite files."
  When the user runs "$SDD lint"
  Then the report contains error "LINT-EARS-002" for that requirement
```

## C001-REQ-407

#### C001-AC-407.1 — Unknown system warned
```gherkin
Scenario: C001-TS-408 — system not in glossary
  Given glossary terms "sdd CLI", "lint", "conductor"
  And a requirement statement "THE frobnicator SHALL emit events."
  When the user runs "$SDD lint"
  Then the report contains warning "LINT-EARS-003" naming "frobnicator"
  And the exit code is not 1 solely because of this warning
```

## C001-REQ-408

#### C001-AC-408.1 — Weak word flagged
```gherkin
Scenario: C001-TS-409 — weak word in a requirement
  Given a requirement statement "THE API SHALL respond fast."
  When the user runs "$SDD lint"
  Then the report contains error "LINT-WORD-001" naming "fast" and the line number
```

#### C001-AC-408.2 — Weak words inside code or quotes are ignored
```gherkin
Scenario: C001-TS-410 — exemptions
  Given an acceptance criterion "The output contains `--fast` and the message \"as needed\""
  When the user runs "$SDD lint"
  Then the report does not contain "LINT-WORD-001" for it
```

## C001-REQ-409

#### C001-AC-409.1 — Brownfield delta tags present and resolvable
```gherkin
Scenario: C001-TS-411 — MODIFIED cites living requirement
  Given change "004" of kind "brownfield"
  And requirement "C004-REQ-012" with "Delta: MODIFIED (was C002-REQ-044)"
  And "_living/CAP-billing.md" contains "C002-REQ-044"
  When the user runs "$SDD lint"
  Then no delta-related error is reported for "C004-REQ-012"
  And if "C002-REQ-044" did not exist in "_living/", error "LINT-DELTA-001" would be reported
```

## C001-REQ-410

#### C001-AC-410.1 — Evidence required for MODIFIED and REMOVED
```gherkin
Scenario Outline: C001-TS-412 — TR-09 enforcement
  Given a brownfield requirement with Delta "<delta>" and Evidence "<evidence>"
  When the user runs "$SDD lint"
  Then the report "<result>" error "TR-09"
  Examples:
    | delta    | evidence                                                         | result           |
    | MODIFIED | src/pay.ts:118 createIntent() — layer: serena                    | does not contain |
    | MODIFIED | (none)                                                           | contains         |
    | REMOVED  | src/legacy/batch.ts — layer: grep                                | contains         |
    | ADDED    | (none)                                                           | does not contain |
```
Note: the third row fails because a symbol is missing.

## C001-REQ-411

#### C001-AC-411.1 — AC and TS identifiers well-formed
```gherkin
Scenario: C001-TS-413 — acceptance numbering
  Given "acceptance.md" with a section for "C004-REQ-012"
  When the user runs "$SDD lint"
  Then every acceptance criterion under it has an ID "C004-AC-012.<n>"
  And every gherkin Scenario title under it begins with an ID "C004-TS-<seq>"
  And an AC without a following gherkin block raises "TR-03"
```

## C001-REQ-412

#### C001-AC-412.1 — Coverage table present and complete
```gherkin
Scenario: C001-TS-414 — coverage table check
  Given a capability "acceptance.md" whose coverage table omits "C004-REQ-015"
  When the user runs "$SDD lint"
  Then the report contains error "LINT-COV-001" naming "C004-REQ-015"
  And a cell that is empty (neither TS IDs nor "n/a: <reason>") raises "LINT-COV-002"
```

## C001-REQ-413

#### C001-AC-413.1 — Scenario steps checked
```gherkin
Scenario Outline: C001-TS-415 — scenario step structure
  Given a scenario with <givens> Given, <whens> When and <thens> Then steps
  When the user runs "$SDD lint"
  Then the report "<result>" error "LINT-TS-001"
  Examples:
    | givens | whens | thens | result           |
    | 1      | 1     | 1     | does not contain |
    | 0      | 1     | 1     | contains         |
    | 1      | 2     | 1     | contains         |
    | 2      | 1     | 0     | contains         |
```

## C001-REQ-414

#### C001-AC-414.1 — NFR fields present
```gherkin
Scenario: C001-TS-416 — NFR missing environment
  Given NFR "C004-NFR-101" without the field "Environment"
  When the user runs "$SDD lint"
  Then the report contains error "LINT-NFR-001" naming "Environment"
```

## C001-REQ-415

#### C001-AC-415.1 — Unmeasurable NFR
```gherkin
Scenario: C001-TS-417 — empty threshold
  Given NFR "C004-NFR-102" whose Threshold field is empty
  When the user runs "$SDD lint"
  Then the report contains error "TR-04" for "C004-NFR-102"
```

## C001-REQ-416

#### C001-AC-416.1 — Entity description complete
```gherkin
Scenario: C001-TS-418 — domain entity fields
  When the critic reviews "domain-model.md"
  Then every entity section lists Attributes (name, type, constraints), Relationships, Owning component and at least one "INV-" invariant or the statement "Invariants: none (reason)"
```

## C001-REQ-417

#### C001-AC-417.1 — State machine required for 3+ states
```gherkin
Scenario: C001-TS-419 — lifecycle with four states
  Given entity "PhaseArtifact" with states draft, in-review, approved, stale
  When the spec-writer completes "40-domain/"
  Then "state-machines.md" contains a "stateDiagram-v2" block for "PhaseArtifact"
  And a transition table with columns from, event, guard, to, effect covering every arrow of the diagram
```

## C001-REQ-418

#### C001-AC-418.1 — New terms defined
```gherkin
Scenario: C001-TS-420 — term introduced without definition
  Given requirement statements use the system name "path guard"
  And "path guard" is absent from "_constitution/glossary.md"
  When the spec-writer completes the spec
  Then "40-domain/glossary-delta.md" defines "path guard"
```

## C001-REQ-419

#### C001-AC-419.1 — Feature DoD items well-formed
```gherkin
Scenario: C001-TS-421 — DoD item structure
  When the lint parses "70-dod.md"
  Then every item has an ID "C<NNN>-DOD-<seq>", a statement, an evidence type and at least one REQ or NFR reference or the word "global"
  And the file references at least one constitution item "DOD-G-<nn>"
```

## C001-REQ-420

#### C001-AC-420.1 — Missing evidence type
```gherkin
Scenario: C001-TS-422 — DoD item without evidence type
  Given DoD item "C004-DOD-004" without an evidence type
  When the user runs "$SDD lint"
  Then the report contains error "LINT-DOD-001" for "C004-DOD-004"
```

## C001-REQ-421

#### C001-AC-421.1 — Marker plus question
```gherkin
Scenario: C001-TS-423 — author lacks a threshold value
  Given the spec-writer cannot determine the p95 latency target for "C004-NFR-101"
  When it writes the NFR
  Then the Threshold field contains "[NEEDS CLARIFICATION: Q-spec-03]"
  And its returned questions block contains a question with id "Q-spec-03"
```

## C001-REQ-422

#### C001-AC-422.1 — Index content limits
```gherkin
Scenario: C001-TS-424 — index is navigation-only
  When the critic reviews "10-spec/00-index.md"
  Then it contains a reading order, a file list with one-line purposes, the capability list with ID blocks and ID counts
  And it contains no paragraph that restates requirement content
```

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C001-REQ-401 | TS-401 | n/a: single creation path | n/a: no numeric limits | n/a: agent behaviour, no error path | n/a: local single user | n/a: one writer per change | n/a: no untrusted input |
| C001-REQ-402 | TS-402 | n/a | n/a | TS-402 | n/a: local single user | n/a | n/a |
| C001-REQ-403 | TS-403 | n/a | n/a | TS-403 | n/a | n/a | n/a |
| C001-REQ-404 | TS-404 | TS-404 (kind variants) | n/a | TS-404 | n/a | n/a | n/a |
| C001-REQ-405 | TS-405 | TS-406 | TS-405 (complex pattern) | TS-405 | n/a | n/a | n/a: lint input is local files |
| C001-REQ-406 | TS-407 | n/a | n/a | TS-407 | n/a | n/a | n/a |
| C001-REQ-407 | TS-408 | n/a | n/a | TS-408 | n/a | n/a | n/a |
| C001-REQ-408 | TS-409 | TS-410 | n/a | TS-409 | n/a | n/a | n/a |
| C001-REQ-409 | TS-411 | n/a | n/a | TS-411 | n/a | n/a | n/a |
| C001-REQ-410 | TS-412 | TS-412 | n/a | TS-412 | n/a | n/a | n/a |
| C001-REQ-411 | TS-413 | n/a | n/a | TS-413 | n/a | n/a | n/a |
| C001-REQ-412 | TS-414 | n/a | n/a | TS-414 | n/a | n/a | n/a |
| C001-REQ-413 | TS-415 | TS-415 | TS-415 | TS-415 | n/a | n/a | n/a |
| C001-REQ-414 | TS-416 | n/a | n/a | TS-416 | n/a | n/a | n/a |
| C001-REQ-415 | TS-417 | n/a | n/a | TS-417 | n/a | n/a | n/a |
| C001-REQ-416 | TS-418 | n/a | n/a | n/a: critic judgement | n/a | n/a | n/a |
| C001-REQ-417 | TS-419 | n/a | TS-419 (threshold of 3 states) | n/a | n/a | n/a | n/a |
| C001-REQ-418 | TS-420 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-419 | TS-421 | n/a | n/a | TS-421 | n/a | n/a | n/a |
| C001-REQ-420 | TS-422 | n/a | n/a | TS-422 | n/a | n/a | n/a |
| C001-REQ-421 | TS-423 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-422 | TS-424 | n/a | n/a | n/a: critic judgement | n/a | n/a | n/a |

Global n/a reasons for this capability: *authorization*: the suite is a local, single-user tool;
access control is delegated to the OS and to Claude Code permissions (see C001-NFR-201 and C001-NFR-204).
*Concurrency*: one conductor session writes a change at a time (C001-CON-11, architecture).
*Abuse*: inputs are the user's own repository files; prompt-injection from repository content
is handled by C001-NFR-205.
