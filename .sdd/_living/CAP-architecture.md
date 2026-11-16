---
capability: architecture
inventory_only: false
updated: 2026-11-16
---

# Architecture, interfaces, diagrams (`C001-CAP-05`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

Architecture content of the specification and plan phases: components, interface registry, error
catalogue, constraints, diagrams, the as-is to to-be delta for brownfield changes, and ADRs.
Mostly prompt content; the architecture lint rules check structure and registry consistency.

## Entry points

- Agent `plugins/architect/agents/sdd-architect.md` (invoked by the conductor in the spec and plan phases).

## Main modules

- Skills `plugins/architect/skills/architecture-decisions/`, `diagramming/`.
- Lint rules `src/lint/rules/arch-001.ts` … `arch-005.ts`, `if-001.ts`, `if-002.ts`, `err-001.ts`,
  `delta-001.ts`, `con-001.ts`.

## Owning tests

- `tests/integration/cap05/` (`TS-501` … `TS-516`, `arch-fixture.ts`).
- Evals: `evals/cap05/` (`architecture.eval.mjs`, `TS-507`, `TS-508`, `TS-511`, `TS-515`).

## Evidence

- **E-1** `plugins/architect/agents/sdd-architect.md:1` › - — architecture specialist agent.
  - layer: grep (description read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/lint/rules/if-001.ts:1` › - — interface-registry lint rule (115 non-empty lines, the largest rule file; purpose inferred from the name).
  - layer: grep (git ls-files, size count) · confidence: low
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127; purpose inferred from the file name

## Requirements

### C001-REQ-501 — Architecture document sections
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the architect writes `60-architecture/architecture.md`, THE architect SHALL include the sections Context and scope, Component catalogue, Runtime flows, Data view, Deployment view, Cross-cutting concerns, Constraints, Diagrams, and (for brownfield or mixed changes) As-is to to-be delta.
- **Rationale:** IDEA-§13.7
- **Stories:** C001-US-501
- **Priority:** Must
- **Acceptance:** C001-AC-501.1

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

### C001-REQ-502 — Component catalogue fields
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the architect adds a component to the catalogue, THE architect SHALL give it an ID `COMP-<seq>` and the fields Name, Responsibility, Owned data, Interfaces (IF IDs), Depends on (COMP IDs), Realizes (REQ and NFR IDs) and Status (`existing`, `new`, `modified` or `removed`).
- **Rationale:** IDEA-§13.7; traceability COMP ↔ REQ
- **Stories:** C001-US-501
- **Priority:** Must
- **Acceptance:** C001-AC-502.1

#### C001-AC-502.1 — Catalogue entry fields
```gherkin
Scenario: C001-TS-502 — component entry without Realizes
  Given component "C004-COMP-03" in the catalogue lacks the field "Status"
  When the user runs "$SDD lint"
  Then the report contains error "LINT-ARCH-003" for "C004-COMP-03" naming "Status"
```

### C001-REQ-503 — Components must realize something
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a component with Status other than `removed` lists no REQ or NFR under Realizes, THEN THE lint SHALL report warning `TR-10`.
- **Rationale:** IDEA-§12.2 TR-10
- **Stories:** C001-US-501
- **Priority:** Should
- **Acceptance:** C001-AC-503.1

#### C001-AC-503.1 — Component realizing nothing
```gherkin
Scenario: C001-TS-503 — orphan component
  Given component "C004-COMP-07" with Status "new" and an empty Realizes field
  When the user runs "$SDD lint"
  Then the report contains warning "TR-10" for "C004-COMP-07"
```

### C001-REQ-507 — Mermaid diagrams
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE architect SHALL express the component view as a Mermaid `flowchart` and each runtime flow as a Mermaid `sequenceDiagram`, using component IDs as node and participant IDs (with `-` replaced by `_`, as Mermaid identifiers require).
- **Rationale:** Q12; Spec-Q3; IDEA-P-10; spike S-03 (Archify deferred, Mermaid only in v1)
- **Stories:** C001-US-503
- **Priority:** Must
- **Acceptance:** C001-AC-507.1

#### C001-AC-507.1 — Mermaid diagrams
```gherkin
Scenario: C001-TS-507 — Mermaid component and sequence diagrams
  When the architect completes the architecture
  Then "architecture.md" contains a "mermaid" block with "flowchart" whose node IDs are the catalogue's COMP IDs
  And one "sequenceDiagram" block per listed runtime flow
```

### C001-REQ-508 — One sequence per runtime flow
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the architect lists a runtime flow in the Runtime flows section, THE architect SHALL provide a Mermaid sequence diagram for it that names the TS IDs the flow realizes.
- **Rationale:** IDEA-§13.7 key runtime flows
- **Stories:** C001-US-501
- **Priority:** Must
- **Acceptance:** C001-AC-508.1

#### C001-AC-508.1 — Flow ↔ sequence ↔ scenarios
```gherkin
Scenario: C001-TS-508 — every runtime flow has a sequence
  Given the Runtime flows section lists 3 flows
  When the lint checks the architecture
  Then 3 Mermaid sequence diagrams exist
  And each names at least one existing TS ID
  And a missing one raises "LINT-ARCH-004"
```

### C001-REQ-509 — Diagram/catalogue ID consistency
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a component ID (compared after mapping `_` back to `-`) appears in a Mermaid component diagram but not in the catalogue, or a non-removed catalogue component appears in no component diagram, THEN THE lint SHALL report error `LINT-ARCH-001`.
- **Rationale:** no drift between model and catalogue
- **Stories:** C001-US-502
- **Priority:** Must
- **Acceptance:** C001-AC-509.1

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

### C001-REQ-510 — Interface registry
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the architect defines an interface, THE architect SHALL register it in `50-interfaces/README.md` with an ID `IF-<seq>`, its kind, its file path, its provider component, its consumer components and the REQ IDs it serves.
- **Rationale:** IDEA-§11.3
- **Stories:** C001-US-505
- **Priority:** Must
- **Acceptance:** C001-AC-510.1

#### C001-AC-510.1 — Interface registry row
```gherkin
Scenario: C001-TS-510 — interface registry completeness
  Given "50-interfaces/openapi.yaml" exists
  When the lint checks "50-interfaces/README.md"
  Then a row references "openapi.yaml" with an "IF-" ID, kind, provider, consumers and at least one REQ
  And an interface file without a registry row raises "LINT-IF-002"
```

### C001-REQ-511 — Standard formats
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN an interface is of a kind listed in C001-IF-03 §9 (HTTP API, JSON document, event stream, CLI), THE architect SHALL express it in the format listed there (OpenAPI 3.1, JSON Schema 2020-12, AsyncAPI 3.0, or the CLI contract template).
- **Rationale:** mechanical validation by P-04
- **Stories:** C001-US-505
- **Priority:** Must
- **Acceptance:** C001-AC-511.1

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

### C001-REQ-512 — Parseable contracts
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a `.json`, `.yaml` or `.yml` file under `50-interfaces/` fails to parse, THEN THE lint SHALL report error `LINT-IF-001` with the parser message and position.
- **Rationale:** IDEA-§17.1 lint list
- **Stories:** C001-US-505
- **Priority:** Must
- **Acceptance:** C001-AC-512.1

#### C001-AC-512.1 — Parse failure reported with position
```gherkin
Scenario: C001-TS-512 — broken YAML
  Given "50-interfaces/openapi.yaml" has a tab-indentation error on line 14
  When the user runs "$SDD lint"
  Then the report contains error "LINT-IF-001" for "openapi.yaml" with line 14
```

### C001-REQ-513 — Error catalogue
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN an interface defines an error condition, THE architect SHALL list it in `50-interfaces/errors.md` with its code, condition, user-facing message, and the REQ or AC IDs that specify it.
- **Rationale:** IDEA-§11.3; ties unwanted-behaviour REQs to codes
- **Stories:** C001-US-505
- **Priority:** Must
- **Acceptance:** C001-AC-513.1

#### C001-AC-513.1 — Error catalogue rows
```gherkin
Scenario: C001-TS-513 — unwanted-behaviour requirement maps to an error code
  Given requirement "C004-REQ-012" (unwanted-behaviour) whose statement references "ERR-PAY-007"
  When the lint checks "50-interfaces/errors.md"
  Then a row for "ERR-PAY-007" exists with condition, user-facing message and "C004-REQ-012"
  And an error code referenced in a requirement but absent from errors.md raises "LINT-ERR-001"
```

### C001-REQ-514 — Architecture constraints
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the architect identifies an architecture constraint, THE architect SHALL record it in `60-architecture/constraints.md` with an ID `CON-<seq>`, a statement, its source (DEC, ADR, NFR or constitution ID) and the affected COMP IDs.
- **Rationale:** IDEA-§13.7
- **Stories:** C001-US-506
- **Priority:** Must
- **Acceptance:** C001-AC-514.1

#### C001-AC-514.1 — Constraint fields
```gherkin
Scenario: C001-TS-514 — constraint without source
  Given "constraints.md" contains "C004-CON-03" without a source
  When the user runs "$SDD lint"
  Then the report contains error "LINT-CON-001" for "C004-CON-03"
```

### C001-REQ-515 — ADRs in planning
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the plan phase needs a technical decision that no existing DEC or ADR settles, THE architect SHALL record it as `20-plan/20-decisions/ADR-<seq>-<slug>.md` in MADR form, linking its option analysis and the affected CON and COMP IDs.
- **Rationale:** Q15; IDEA-§11.4
- **Stories:** C001-US-507
- **Priority:** Must
- **Acceptance:** C001-AC-515.1

#### C001-AC-515.1 — ADR structure and links
```gherkin
Scenario: C001-TS-515 — ADR written during planning
  Given the planner needs a decision on job deduplication not covered by any DEC
  When the architect records it
  Then "20-plan/20-decisions/ADR-<seq>-job-dedup.md" exists with the MADR sections Context, Considered options, Decision outcome, Consequences
  And it links an OA file and at least one CON or COMP ID
```

### C001-REQ-516 — Evidence for as-is components
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the architect describes a component with Status `existing`, `modified` or `removed`, THE architect SHALL cite cartographer evidence for it (file path, symbol and evidence layer).
- **Rationale:** C001-GOAL-04
- **Stories:** C001-US-504
- **Priority:** Must
- **Acceptance:** C001-AC-516.1

#### C001-AC-516.1 — Existing components carry evidence
```gherkin
Scenario: C001-TS-516 — modified component without evidence
  Given component "C004-COMP-02" with Status "modified" and no Evidence entry
  When the user runs "$SDD lint"
  Then the report contains error "LINT-ARCH-005" for "C004-COMP-02"
```

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
