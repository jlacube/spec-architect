---
capability: specification
inventory_only: false
updated: 2026-11-16
---

# Specification authoring (`C001-CAP-04`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

The specification phase: context, user stories, EARS requirements, acceptance criteria and
scenarios, non-functional requirements, domain model and definition of done. Prompt content writes
the artifacts; the EARS parser and lint rules check them deterministically.

## Entry points

- Command `plugins/architect/commands/specify.md`.
- `sdd extract-features <NNN>` ("Write .feature files from gherkin blocks"), registered at
  `src/cli/commands.ts:507` without a `run` handler in the table entry.
- Agents `plugins/architect/agents/sdd-spec-writer.md`, `sdd-test-designer.md`.

## Main modules

- Skills `plugins/architect/skills/phase-spec/`, `ears-requirements/`, `user-stories/`,
  `acceptance-scenarios/`, `nfr-catalogue/`, `dod-catalogue/`.
- `src/lint/ears.ts`, `src/lint/spec.ts`, `src/lint/spec-facts.ts`.
- Lint rules `src/lint/rules/ears-001.ts` … `ears-003.ts`, `req-001.ts`, `us-001.ts`, `us-002.ts`,
  `ts-001.ts`, `cov-001.ts`, `cov-002.ts`, `nfr-001.ts`, `dod-001.ts`, `word-001.ts`.

## Owning tests

- `tests/integration/cap04/` (`TS-402` … `TS-422`, `spec-fixture.ts`).
- `tests/unit/lint/spec-facts.test.ts`, `tests/unit/lint/fixtures.test.ts` (lint fixtures under `tests/lint-fixtures/`).
- Evals: `evals/cap04/`.

## Evidence

- **E-1** `src/lint/ears.ts:1` › - — EARS statement parser (77 non-empty lines).
  - layer: grep (git ls-files, size count) · confidence: low
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127; purpose inferred from the file name
- **E-2** `src/lint/spec.ts:1` › - — spec-folder reading for lint (285 non-empty lines, one of the larger files).
  - layer: grep (git ls-files, size count) · confidence: low
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127; purpose inferred from the file name
- **E-3** `plugins/architect/agents/sdd-spec-writer.md:1` › - — specification author agent.
  - layer: grep (description read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127

## Requirements

### C001-REQ-401 — Capability folders
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE a change has profile `full`, THE spec-writer SHALL create one folder `10-spec/20-capabilities/CAP-<nn>-<slug>/` per capability, each containing `stories.md`, `requirements.md` and `acceptance.md`.
- **Rationale:** OA-04 option E
- **Stories:** C001-US-401
- **Priority:** Must
- **Acceptance:** C001-AC-401.1

#### C001-AC-401.1 — One folder per capability with three files
```gherkin
Scenario: C001-TS-401 — capability folders created
  Given change "004" with profile "full" whose ideation identifies capabilities "billing" and "notifications"
  When the spec-writer completes its first pass
  Then the folders "10-spec/20-capabilities/CAP-01-billing" and "CAP-02-notifications" exist
  And each contains "stories.md", "requirements.md" and "acceptance.md"
```

### C001-REQ-402 — User story fields
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the spec-writer writes a user story, THE spec-writer SHALL include the fields persona (P-ID), I want, So that, Value / outcome, Priority (MoSCoW), Size hint, Capability, Context & notes, Requirements and Traces to, plus Out of scope whenever a neighbouring feature is excluded.
- **Rationale:** IDEA-§13.1; Q16
- **Stories:** C001-US-402
- **Priority:** Must
- **Acceptance:** C001-AC-402.1

#### C001-AC-402.1 — Story fields complete
```gherkin
Scenario: C001-TS-402 — missing story field
  Given a story "C004-US-003" without the "So that" field
  When the user runs "$SDD lint"
  Then the report contains error "LINT-US-002" for "C004-US-003" naming the missing field "So that"
```

### C001-REQ-403 — Persona must exist
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a user story references a persona ID that is not defined in `10-context/stakeholders-and-personas.md`, THEN THE lint SHALL report error `LINT-US-001`.
- **Rationale:** consistency
- **Stories:** C001-US-402
- **Priority:** Must
- **Acceptance:** C001-AC-403.1

#### C001-AC-403.1 — Unknown persona
```gherkin
Scenario: C001-TS-403 — persona not defined
  Given story "C004-US-005" says "As a P-09 auditor"
  And "stakeholders-and-personas.md" defines only P-01 to P-04
  When the user runs "$SDD lint"
  Then the report contains error "LINT-US-001" for "C004-US-005" naming "P-09"
```

### C001-REQ-404 — Requirement fields
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the spec-writer writes a functional requirement, THE spec-writer SHALL include the fields Pattern, Statement, Rationale, Stories, Priority and Acceptance, plus Delta whenever the change `kind` is not `greenfield`.
- **Rationale:** IDEA-§12.4
- **Stories:** C001-US-403
- **Priority:** Must
- **Acceptance:** C001-AC-404.1

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

### C001-REQ-405 — EARS shape check
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a requirement's Statement does not match the keyword shape of its declared Pattern as defined in C001-IF-04 §3, THEN THE lint SHALL report error `LINT-EARS-001` with the declared pattern and the detected shape.
- **Rationale:** Q8; IDEA-§13.3
- **Stories:** C001-US-403
- **Priority:** Must
- **Acceptance:** C001-AC-405.1, C001-AC-405.2

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

### C001-REQ-406 — Singular requirements
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a requirement's Statement contains, outside code spans, more than one occurrence of the keyword `SHALL` (including `SHALL NOT`), THEN THE lint SHALL report error `LINT-EARS-002`.
- **Rationale:** ISO/IEC/IEEE 29148 "singular" (IDEA-§13.2)
- **Stories:** C001-US-403
- **Priority:** Must
- **Acceptance:** C001-AC-406.1

#### C001-AC-406.1 — Compound requirement detected
```gherkin
Scenario: C001-TS-407 — two SHALLs
  Given a requirement statement "WHEN init runs, THE sdd CLI SHALL create SDD.md and SHALL NOT overwrite files."
  When the user runs "$SDD lint"
  Then the report contains error "LINT-EARS-002" for that requirement
```

### C001-REQ-407 — Known system names
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the system named after `THE` in a requirement's Statement is not a term of the project glossary, the change's glossary delta or the component catalogue, THEN THE lint SHALL report warning `LINT-EARS-003`.
- **Rationale:** IDEA-§13.3 last paragraph
- **Stories:** C001-US-403
- **Priority:** Should
- **Acceptance:** C001-AC-407.1

#### C001-AC-407.1 — Unknown system warned
```gherkin
Scenario: C001-TS-408 — system not in glossary
  Given glossary terms "sdd CLI", "lint", "conductor"
  And a requirement statement "THE frobnicator SHALL emit events."
  When the user runs "$SDD lint"
  Then the report contains warning "LINT-EARS-003" naming "frobnicator"
  And the exit code is not 1 solely because of this warning
```

### C001-REQ-408 — Banned weak words
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a requirement Statement or an acceptance criterion contains a word from the weak-word list of C001-IF-04 §4 outside code spans and quoted strings, THEN THE lint SHALL report error `LINT-WORD-001` naming the word and its location.
- **Rationale:** IDEA-§13.2 "Unambiguous"; IDEA-P-04
- **Stories:** C001-US-403
- **Priority:** Must
- **Acceptance:** C001-AC-408.1, C001-AC-408.2

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

### C001-REQ-409 — Delta tagging for brownfield
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE a change has `kind` `brownfield` or `mixed`, THE spec-writer SHALL tag every requirement with a Delta of `ADDED`, `MODIFIED`, `REMOVED` or `RENAMED`, and for any value other than `ADDED` cite the full ID of the living-spec requirement it alters.
- **Rationale:** OA-09; Q7 (OpenSpec deltas)
- **Stories:** C001-US-404
- **Priority:** Must
- **Acceptance:** C001-AC-409.1

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

### C001-REQ-410 — Code evidence for changed behaviour
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a requirement with Delta `MODIFIED` or `REMOVED` has no Evidence field containing a file path, a symbol and an evidence layer, THEN THE lint SHALL report error `TR-09`.
- **Rationale:** IDEA-§12.2 TR-09; C001-SC-07
- **Stories:** C001-US-404
- **Priority:** Must
- **Acceptance:** C001-AC-410.1

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

### C001-REQ-411 — Acceptance structure
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the test-designer writes acceptance for a requirement, THE test-designer SHALL write one or more acceptance criteria numbered `AC-<req-seq>.<n>`, each followed by one or more fenced `gherkin` blocks whose `Scenario` or `Scenario Outline` title starts with a `TS` ID.
- **Rationale:** IDEA-§13.4
- **Stories:** C001-US-405
- **Priority:** Must
- **Acceptance:** C001-AC-411.1

#### C001-AC-411.1 — AC and TS identifiers well-formed
```gherkin
Scenario: C001-TS-413 — acceptance numbering
  Given "acceptance.md" with a section for "C004-REQ-012"
  When the user runs "$SDD lint"
  Then every acceptance criterion under it has an ID "C004-AC-012.<n>"
  And every gherkin Scenario title under it begins with an ID "C004-TS-<seq>"
  And an AC without a following gherkin block raises "TR-03"
```

### C001-REQ-412 — Coverage table
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the test-designer completes a capability's `acceptance.md`, THE test-designer SHALL append a coverage table with one row per requirement and one column per checklist item of C001-IF-03 §7 (happy, alternate, boundary, error, authorization, concurrency/idempotency, abuse), each cell holding the covering TS IDs, `n/a: <reason>`, or `n/a` when a per-column reason is stated in a note directly below the table.
- **Rationale:** IDEA-§13.4 coverage checklist; completeness
- **Stories:** C001-US-405
- **Priority:** Must
- **Acceptance:** C001-AC-412.1

#### C001-AC-412.1 — Coverage table present and complete
```gherkin
Scenario: C001-TS-414 — coverage table check
  Given a capability "acceptance.md" whose coverage table omits "C004-REQ-015"
  When the user runs "$SDD lint"
  Then the report contains error "LINT-COV-001" naming "C004-REQ-015"
  And a cell that is empty (neither TS IDs nor "n/a: <reason>") raises "LINT-COV-002"
```

### C001-REQ-413 — Scenario steps
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a scenario does not have exactly one `When` step and at least one `Then` step, THEN THE lint SHALL report error `LINT-TS-001`; `Given` steps are optional.
- **Rationale:** IDEA-§13.8
- **Stories:** C001-US-405
- **Priority:** Must
- **Acceptance:** C001-AC-413.1

#### C001-AC-413.1 — Scenario steps checked
```gherkin
Scenario Outline: C001-TS-415 — scenario step structure
  Given a scenario with <givens> Given, <whens> When and <thens> Then steps
  When the user runs "$SDD lint"
  Then the report "<result>" error "LINT-TS-001"
  Examples:
    | givens | whens | thens | result           |
    | 1      | 1     | 1     | does not contain |
    | 0      | 1     | 1     | does not contain |
    | 1      | 2     | 1     | contains         |
    | 2      | 1     | 0     | contains         |
```

### C001-REQ-414 — NFR fields
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the spec-writer writes a non-functional requirement, THE spec-writer SHALL include the fields Category (ISO 25010 characteristic), Statement (EARS), Metric, Threshold, Method, Environment, Rationale and DoD.
- **Rationale:** IDEA-§13.5
- **Stories:** C001-US-406
- **Priority:** Must
- **Acceptance:** C001-AC-414.1

#### C001-AC-414.1 — NFR fields present
```gherkin
Scenario: C001-TS-416 — NFR missing environment
  Given NFR "C004-NFR-101" without the field "Environment"
  When the user runs "$SDD lint"
  Then the report contains error "LINT-NFR-001" naming "Environment"
```

### C001-REQ-415 — Unmeasurable NFR rejected
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a non-functional requirement has an empty Metric, Threshold or Method field, THEN THE lint SHALL report error `TR-04`.
- **Rationale:** IDEA-§12.2 TR-04
- **Stories:** C001-US-406
- **Priority:** Must
- **Acceptance:** C001-AC-415.1

#### C001-AC-415.1 — Unmeasurable NFR
```gherkin
Scenario: C001-TS-417 — empty threshold
  Given NFR "C004-NFR-102" whose Threshold field is empty
  When the user runs "$SDD lint"
  Then the report contains error "TR-04" for "C004-NFR-102"
```

### C001-REQ-416 — Domain model content
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the spec-writer writes `40-domain/domain-model.md`, THE spec-writer SHALL describe every entity with its attributes (name, type, constraints), relationships, owning component and invariants identified as `INV-<seq>`.
- **Rationale:** IDEA-§11.3
- **Stories:** C001-US-407
- **Priority:** Must
- **Acceptance:** C001-AC-416.1

#### C001-AC-416.1 — Entity description complete
```gherkin
Scenario: C001-TS-418 — domain entity fields
  When the critic reviews "domain-model.md"
  Then every entity section lists Attributes (name, type, constraints), Relationships, Owning component and at least one "INV-" invariant or the statement "Invariants: none (reason)"
```

### C001-REQ-417 — State machines
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN an entity has more than two lifecycle states, THE spec-writer SHALL specify it in `40-domain/state-machines.md` with a Mermaid `stateDiagram-v2` and a transition table (from, event, guard, to, effect).
- **Rationale:** precision on lifecycle behaviour
- **Stories:** C001-US-407
- **Priority:** Must
- **Acceptance:** C001-AC-417.1

#### C001-AC-417.1 — State machine required for 3+ states
```gherkin
Scenario: C001-TS-419 — lifecycle with four states
  Given entity "PhaseArtifact" with states draft, in-review, approved, stale
  When the spec-writer completes "40-domain/"
  Then "state-machines.md" contains a "stateDiagram-v2" block for "PhaseArtifact"
  And a transition table with columns from, event, guard, to, effect covering every arrow of the diagram
```

### C001-REQ-418 — Glossary delta
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN a spec artifact introduces a term absent from `_constitution/glossary.md`, THE spec-writer SHALL define it in `40-domain/glossary-delta.md`.
- **Rationale:** ubiquitous language; merged on archive (C001-CAP-09)
- **Stories:** C001-US-407
- **Priority:** Should
- **Acceptance:** C001-AC-418.1

#### C001-AC-418.1 — New terms defined
```gherkin
Scenario: C001-TS-420 — term introduced without definition
  Given requirement statements use the system name "path guard"
  And "path guard" is absent from "_constitution/glossary.md"
  When the spec-writer completes the spec
  Then "40-domain/glossary-delta.md" defines "path guard"
```

### C001-REQ-419 — Feature DoD content
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the test-designer writes `70-dod.md`, THE test-designer SHALL list each feature DoD item with an ID `DOD-<seq>`, a checkable statement, an evidence type from C001-IF-03 §8 and the REQ or NFR IDs it covers, together with references by ID to the constitution's global DoD items that apply.
- **Rationale:** IDEA-§13.6 three layers
- **Stories:** C001-US-408
- **Priority:** Must
- **Acceptance:** C001-AC-419.1

#### C001-AC-419.1 — Feature DoD items well-formed
```gherkin
Scenario: C001-TS-421 — DoD item structure
  When the lint parses "70-dod.md"
  Then every item has an ID "C<NNN>-DOD-<seq>", a statement, an evidence type and at least one REQ or NFR reference or the word "global"
  And the file references at least one constitution item "DOD-G-<nn>"
```

### C001-REQ-420 — DoD evidence type required
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a DoD item has no evidence type, THEN THE lint SHALL report error `LINT-DOD-001`.
- **Rationale:** "checkable statements, never aspirations" (IDEA-§13.6)
- **Stories:** C001-US-408
- **Priority:** Must
- **Acceptance:** C001-AC-420.1

#### C001-AC-420.1 — Missing evidence type
```gherkin
Scenario: C001-TS-422 — DoD item without evidence type
  Given DoD item "C004-DOD-004" without an evidence type
  When the user runs "$SDD lint"
  Then the report contains error "LINT-DOD-001" for "C004-DOD-004"
```

### C001-REQ-421 — Clarification markers
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN an author agent lacks information needed to write a statement, THE author agent SHALL insert `[NEEDS CLARIFICATION: <question-id>]` at that location and return the corresponding question in its `questions` block.
- **Rationale:** IDEA-P-06
- **Stories:** C001-US-409
- **Priority:** Must
- **Acceptance:** C001-AC-421.1

#### C001-AC-421.1 — Marker plus question
```gherkin
Scenario: C001-TS-423 — author lacks a threshold value
  Given the spec-writer cannot determine the p95 latency target for "C004-NFR-101"
  When it writes the NFR
  Then the Threshold field contains "[NEEDS CLARIFICATION: Q-spec-03]"
  And its returned questions block contains a question with id "Q-spec-03"
```

### C001-REQ-422 — Navigation-only index
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the spec-writer writes `10-spec/00-index.md`, THE spec-writer SHALL limit its content to the reading order, the list of files with their purpose in one line each, the capability list with ID blocks, and ID-count statistics.
- **Rationale:** IDEA-P-02 (index, never summarise)
- **Stories:** C001-US-401
- **Priority:** Should
- **Acceptance:** C001-AC-422.1

#### C001-AC-422.1 — Index content limits
```gherkin
Scenario: C001-TS-424 — index is navigation-only
  When the critic reviews "10-spec/00-index.md"
  Then it contains a reading order, a file list with one-line purposes, the capability list with ID blocks and ID counts
  And it contains no paragraph that restates requirement content
```

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
