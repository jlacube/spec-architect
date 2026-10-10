---
id: C001-CAP-05
artifact: spec/acceptance
capability: "Architecture, interfaces and diagrams"
change: CHG-001
phase: 10-spec
status: approved
---

# C001-CAP-05 — Acceptance criteria and scenarios

## C001-REQ-501

#### C001-AC-501.1 — Mandatory sections
```gherkin
Scenario Outline: C001-TS-501 — architecture.md sections by kind
  Given change "004" of kind "<kind>"
  When the lint checks "60-architecture/architecture.md"
  Then error "LINT-ARCH-002" is reported for each missing section among the mandatory set for "<kind>"
  Examples:
    | kind       | mandatory set                                                                                                    |
    | greenfield | Context and scope, Component catalogue, Runtime flows, Data view, Deployment view, Cross-cutting concerns, Constraints, Diagrams |
    | brownfield | the greenfield set plus "As-is to to-be delta"                                                                   |
```

## C001-REQ-502

#### C001-AC-502.1 — Catalogue entry fields
```gherkin
Scenario: C001-TS-502 — component entry without Realizes
  Given component "C004-COMP-03" in the catalogue lacks the field "Status"
  When the user runs "$SDD lint"
  Then the report contains error "LINT-ARCH-003" for "C004-COMP-03" naming "Status"
```

## C001-REQ-503

#### C001-AC-503.1 — Component realizing nothing
```gherkin
Scenario: C001-TS-503 — orphan component
  Given component "C004-COMP-07" with Status "new" and an empty Realizes field
  When the user runs "$SDD lint"
  Then the report contains warning "TR-10" for "C004-COMP-07"
```

## C001-REQ-507

#### C001-AC-507.1 — Mermaid diagrams
```gherkin
Scenario: C001-TS-507 — Mermaid component and sequence diagrams
  When the architect completes the architecture
  Then "architecture.md" contains a "mermaid" block with "flowchart" whose node IDs are the catalogue's COMP IDs
  And one "sequenceDiagram" block per listed runtime flow
```

## C001-REQ-508

#### C001-AC-508.1 — Flow ↔ sequence ↔ scenarios
```gherkin
Scenario: C001-TS-508 — every runtime flow has a sequence
  Given the Runtime flows section lists 3 flows
  When the lint checks the architecture
  Then 3 Mermaid sequence diagrams exist
  And each names at least one existing TS ID
  And a missing one raises "LINT-ARCH-004"
```

## C001-REQ-509

#### C001-AC-509.1 — ID drift detected both ways
```gherkin
Scenario Outline: C001-TS-509 — catalogue vs diagram IDs
  Given the catalogue lists "<catalogue>" and the component diagram shows "<diagram>"
  When the user runs "$SDD lint"
  Then the report "<result>" error "LINT-ARCH-001"
  Examples:
    | catalogue        | diagram                    | result           |
    | COMP-01, COMP-02 | COMP-01, COMP-02           | does not contain |
    | COMP-01, COMP-02 | COMP-01, COMP-02, COMP-09  | contains         |
    | COMP-01, COMP-02 | COMP-01                    | contains         |
```

## C001-REQ-510

#### C001-AC-510.1 — Interface registry row
```gherkin
Scenario: C001-TS-510 — interface registry completeness
  Given "50-interfaces/openapi.yaml" exists
  When the lint checks "50-interfaces/README.md"
  Then a row references "openapi.yaml" with an "IF-" ID, kind, provider, consumers and at least one REQ
  And an interface file without a registry row raises "LINT-IF-002"
```

## C001-REQ-511

#### C001-AC-511.1 — Format by kind
```gherkin
Scenario Outline: C001-TS-511 — interface format
  Given an interface of kind "<kind>"
  When the architect writes it
  Then its file "<file>" declares "<marker>"
  Examples:
    | kind           | file                     | marker                                                   |
    | HTTP API       | openapi.yaml             | openapi: 3.1.x                                           |
    | JSON document  | *.schema.json            | "$schema": "https://json-schema.org/draft/2020-12/schema" |
    | event stream   | events.asyncapi.yaml     | asyncapi: 3.0.x                                          |
    | CLI            | *-cli.md                 | the headings Synopsis, Commands, Exit codes, Output       |
```

## C001-REQ-512

#### C001-AC-512.1 — Parse failure reported with position
```gherkin
Scenario: C001-TS-512 — broken YAML
  Given "50-interfaces/openapi.yaml" has a tab-indentation error on line 14
  When the user runs "$SDD lint"
  Then the report contains error "LINT-IF-001" for "openapi.yaml" with line 14
```

## C001-REQ-513

#### C001-AC-513.1 — Error catalogue rows
```gherkin
Scenario: C001-TS-513 — unwanted-behaviour requirement maps to an error code
  Given requirement "C004-REQ-012" (unwanted-behaviour) whose statement references "ERR-PAY-007"
  When the lint checks "50-interfaces/errors.md"
  Then a row for "ERR-PAY-007" exists with condition, user-facing message and "C004-REQ-012"
  And an error code referenced in a requirement but absent from errors.md raises "LINT-ERR-001"
```

## C001-REQ-514

#### C001-AC-514.1 — Constraint fields
```gherkin
Scenario: C001-TS-514 — constraint without source
  Given "constraints.md" contains "C004-CON-03" without a source
  When the user runs "$SDD lint"
  Then the report contains error "LINT-CON-001" for "C004-CON-03"
```

## C001-REQ-515

#### C001-AC-515.1 — ADR structure and links
```gherkin
Scenario: C001-TS-515 — ADR written during planning
  Given the planner needs a decision on job deduplication not covered by any DEC
  When the architect records it
  Then "20-plan/20-decisions/ADR-<seq>-job-dedup.md" exists with the MADR sections Context, Considered options, Decision outcome, Consequences
  And it links an OA file and at least one CON or COMP ID
```

## C001-REQ-516

#### C001-AC-516.1 — Existing components carry evidence
```gherkin
Scenario: C001-TS-516 — modified component without evidence
  Given component "C004-COMP-02" with Status "modified" and no Evidence entry
  When the user runs "$SDD lint"
  Then the report contains error "LINT-ARCH-005" for "C004-COMP-02"
```

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C001-REQ-501 | TS-501 | TS-501 (kinds) | n/a | TS-501 | n/a | n/a | n/a |
| C001-REQ-502 | TS-502 | n/a | n/a | TS-502 | n/a | n/a | n/a |
| C001-REQ-503 | TS-503 | n/a | n/a | TS-503 | n/a | n/a | n/a |
| C001-REQ-507 | TS-507 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-508 | TS-508 | n/a | n/a | TS-508 | n/a | n/a | n/a |
| C001-REQ-509 | TS-509 | TS-509 | n/a | TS-509 | n/a | n/a | n/a |
| C001-REQ-510 | TS-510 | n/a | n/a | TS-510 | n/a | n/a | n/a |
| C001-REQ-511 | TS-511 | TS-511 (kinds) | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-512 | TS-512 | n/a | n/a | TS-512 | n/a | n/a | n/a |
| C001-REQ-513 | TS-513 | n/a | n/a | TS-513 | n/a | n/a | n/a |
| C001-REQ-514 | TS-514 | n/a | n/a | TS-514 | n/a | n/a | n/a |
| C001-REQ-515 | TS-515 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-516 | TS-516 | n/a | n/a | TS-516 | n/a | n/a | n/a |

Per-column n/a reasons: *alternate/boundary*: these are authoring rules with a single path
and no numeric limits. *Authorization*: local single-user tool. *Concurrency*: single writer
per change (C001-CON-11). *Abuse*: inputs are the user's own artifacts; injection handled by
C001-NFR-205. *Error* n/a: agent authoring behaviour verified by critic review, not by an error path.
