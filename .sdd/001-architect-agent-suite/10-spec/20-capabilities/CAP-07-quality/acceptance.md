---
id: C001-CAP-07
artifact: spec/acceptance
capability: "Quality: lint, traceability, critic, auditor"
change: CHG-001
phase: 10-spec
status: approved
---

# C001-CAP-07 — Acceptance criteria and scenarios

## C001-REQ-701

#### C001-AC-701.1 — Scope selection
```gherkin
Scenario Outline: C001-TS-701 — lint scope
  Given changes "001" (archived), "002" and "003"
  When the user runs "$SDD lint <args>"
  Then the files checked are "<checked>"
  Examples:
    | args                | checked                                                 |
    | 002                 | change 002 only                                          |
    | (none)              | changes 002 and 003 plus SDD.md, registry.json, _living/ |
    | 003 --phase 20-plan | change 003 files under 20-plan/ plus cross-phase rules  |
```

## C001-REQ-702

#### C001-AC-702.1 — Human-readable finding line
```gherkin
Scenario: C001-TS-702 — finding fields
  Given a requirement with two SHALLs at ".sdd/004-x/10-spec/20-capabilities/CAP-01-a/requirements.md" line 42
  When the user runs "$SDD lint"
  Then the output contains a line with "error", "LINT-EARS-002", that path, "42", "C004-REQ-012" and a message
```

## C001-REQ-703

#### C001-AC-703.1 — JSON output validates
```gherkin
Scenario: C001-TS-703 — --json
  When the user runs "$SDD lint --json"
  Then standard output parses as JSON and validates against C001-IF-11 §1
  And standard output contains nothing but that JSON document
```

## C001-REQ-704

#### C001-AC-704.1 — Exit codes
```gherkin
Scenario Outline: C001-TS-704 — lint exit code
  Given a workspace with <errors> errors and <warnings> warnings
  When the user runs "$SDD lint"
  Then the exit code is <code>
  Examples:
    | errors | warnings | code |
    | 0      | 0        | 0    |
    | 0      | 5        | 0    |
    | 1      | 0        | 1    |
  And running "$SDD lint --bogus-flag" exits with code 2
```

## C001-REQ-705

#### C001-AC-705.1 — Single-file mode scope and time limit
```gherkin
Scenario: C001-TS-705 — quick single-file lint
  Given a workspace with 500 artifact files
  When the user runs "$SDD lint --quick --file <one requirements.md>"
  Then only findings located in that file are reported
  And the command completes within the C001-NFR-102 limit on the reference machine
```

## C001-REQ-706

#### C001-AC-706.1 — Files written per started phase
```gherkin
Scenario: C001-TS-706 — trace outputs
  Given change "004" in phase "20-plan"
  When the user runs "$SDD trace 004 --write"
  Then "10-spec/80-traceability.md", "20-plan/80-traceability.md" and "trace.json" exist under ".sdd/004-*/"
  And for a change in phase "10-spec" no "20-plan/80-traceability.md" is written
```

## C001-REQ-707

#### C001-AC-707.1 — Both directions present
```gherkin
Scenario: C001-TS-707 — forward and backward tables
  When "10-spec/80-traceability.md" is generated
  Then it contains a table headed "Forward: US → REQ → AC → TS" and a table headed "Backward: TS → AC → REQ → US"
  And every REQ ID of the change appears in the forward table
```

## C001-REQ-708

#### C001-AC-708.1 — Coverage numbers correct
```gherkin
Scenario: C001-TS-708 — coverage statistics
  Given 10 REQs of which 9 have at least one AC
  When "10-spec/80-traceability.md" is generated
  Then the TR-02 line reads "9 / 10 (90%)"
```

## C001-REQ-709

#### C001-AC-709.1 — trace.json shape
```gherkin
Scenario: C001-TS-709 — trace.json content
  When "trace.json" is generated for change "004"
  Then it validates against C001-IF-12
  And it contains a node for every ID defined in change "004"
  And every "implements" field of every task appears as an edge with relation "implements"
```

## C001-REQ-710

#### C001-AC-710.1 — Finding structure
```gherkin
Scenario: C001-TS-710 — critic finding fields
  When the critic writes "90-critic-report.md"
  Then every finding has an ID "CR-<n>", a severity among blocker, major, minor, at least one artifact ID, a quote with file:line, a reason and a suggested fix
```

## C001-REQ-711

#### C001-AC-711.1 — Rubric table present
```gherkin
Scenario: C001-TS-711 — rubric coverage
  Given the critique-rubrics skill defines 12 checklist items for "requirements"
  When the critic reviews a spec
  Then its report contains a rubric table with 12 rows for "requirements", each marked pass, a finding ID, or "n/a: <reason>"
```

## C001-REQ-712

#### C001-AC-712.1 — Justification when few findings
```gherkin
Scenario: C001-TS-712 — clean review justified
  When the critic reports 2 findings for a spec review
  Then the report has a "Why no further findings" section with one paragraph per rubric section
```

## C001-REQ-713

#### C001-AC-713.1 — Critic writes only its report
```gherkin
Scenario: C001-TS-713 — critic write scope
  When the critic reviews a phase in a scripted session
  Then every Write or Edit call in its transcript targets its critic report file
  And the path guard would deny any other target (C001-REQ-1102)
```

## C001-REQ-714

#### C001-AC-714.1 — Revision review set
```gherkin
Scenario: C001-TS-714 — focused re-review
  Given the spec of change "004" was approved and then REQ-012 was modified during revision
  When the critic reviews the revised spec
  Then the report lists the reviewed ID set including "C004-REQ-012", its ACs, its TSs and its stories
  And IDs unrelated to REQ-012 are not in the reviewed set
```

## C001-REQ-715

#### C001-AC-715.1 — Audit sequence and summary
```gherkin
Scenario: C001-TS-715 — auditor run
  When the conductor requests an audit of change "004"
  Then the auditor transcript shows, in order, "sdd lint --json", "sdd trace", "sdd stale check", "sdd status --write"
  And its reply contains error/warning/info counts, TR-01..TR-08 coverage and the list of stale phases
```

## C001-REQ-716

#### C001-AC-716.1 — Open items regenerated
```gherkin
Scenario: C001-TS-716 — markers collected
  Given 2 "[NEEDS CLARIFICATION]" markers and 1 "[ASSUMPTION]" marker in "10-spec"
  When the user runs "$SDD trace 004 --write"
  Then "10-spec/85-open-items.md" lists 3 rows with type, file, line and reference
  And a marker written inside backticks, double quotes or a fenced code block (for example in this scenario) is not listed
```

## C001-REQ-717

#### C001-AC-717.1 — Dangling reference
```gherkin
Scenario: C001-TS-717 — reference to nowhere
  Given a story lists "C004-REQ-077" which is neither defined nor tombstoned
  When the user runs "$SDD lint"
  Then the report contains error "TR-12" naming "C004-REQ-077" and the story's file and line
  And a reference to a tombstoned ID raises no "TR-12"
```

## C001-REQ-718

#### C001-AC-718.1 — Duplicate definition
```gherkin
Scenario: C001-TS-718 — defined twice
  Given "C004-REQ-012" is defined as a heading in two different files
  When the user runs "$SDD lint"
  Then the report contains error "TR-13" listing both locations
```

## C001-REQ-719

#### C001-AC-719.1 — Placeholders
```gherkin
Scenario Outline: C001-TS-719 — placeholder words
  Given an artifact line "<line>"
  When the user runs "$SDD lint"
  Then the report "<result>" error "LINT-TXT-001"
  Examples:
    | line                                   | result           |
    | Threshold: TBD                         | contains         |
    | Supports JSON, YAML, etc.              | contains         |
    | Run `grep TODO src/`                   | does not contain |
    | The message reads "TODO list empty"    | does not contain |
```

## C001-REQ-720

#### C001-AC-720.1 — Approval refused with open markers
```gherkin
Scenario: C001-TS-720 — gate refusal
  Given "10-spec" of change "004" contains "[NEEDS CLARIFICATION: Q-spec-03]"
  When the user runs "$SDD gate approve 004 10-spec"
  Then the exit code is 2 and standard error contains "ERR-CLI-011" and "Q-spec-03"
  And running "$SDD gate approve 004 10-spec --waive Q-spec-03 --note \"decide in plan\"" succeeds
```

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C001-REQ-701 | TS-701 | TS-701 | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-702 | TS-702 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-703 | TS-703 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-704 | TS-704 | TS-704 | TS-704 (warnings only) | TS-704 (usage) | n/a | n/a | n/a |
| C001-REQ-705 | TS-705 | n/a | TS-705 (500 files) | n/a | n/a | n/a | n/a |
| C001-REQ-706 | TS-706 | TS-706 (spec-only) | n/a | n/a | n/a | n/a: outputs fully regenerated each run (determinism is C001-NFR-302) | n/a |
| C001-REQ-707 | TS-707 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-708 | TS-708 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-709 | TS-709 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-710 | TS-710 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-711 | TS-711 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-712 | TS-712 | n/a | TS-712 (fewer than 3) | n/a | n/a | n/a | n/a |
| C001-REQ-713 | TS-713 | n/a | n/a | TS-713 | n/a | n/a | n/a |
| C001-REQ-714 | TS-714 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-715 | TS-715 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-716 | TS-716 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-717 | TS-717 | TS-717 (tombstoned) | n/a | TS-717 | n/a | n/a | n/a |
| C001-REQ-718 | TS-718 | n/a | n/a | TS-718 | n/a | n/a | n/a |
| C001-REQ-719 | TS-719 | TS-719 (exemptions) | n/a | TS-719 | n/a | n/a | n/a |
| C001-REQ-720 | TS-720 | TS-720 (waiver) | n/a | TS-720 | n/a | n/a | n/a |

Per-column n/a reasons: as in CAP-05.
