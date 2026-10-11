---
id: C001-CAP-04
artifact: spec/requirements
capability: "Specification authoring"
change: CHG-001
phase: 10-spec
status: approved
delta_default: ADDED
---

# C001-CAP-04 — Requirements

All `Delta: ADDED`. Interfaces: layout C001-IF-06, ID scheme and EARS shapes C001-IF-04,
artifact templates C001-IF-03 §5–§8.

### C001-REQ-401 — Capability folders
- **Pattern:** optional-feature
- **Statement:** WHERE a change has profile `full`, THE spec-writer SHALL create one folder `10-spec/20-capabilities/CAP-<nn>-<slug>/` per capability, each containing `stories.md`, `requirements.md` and `acceptance.md`.
- **Rationale:** OA-04 option E
- **Stories:** C001-US-401
- **Priority:** Must
- **Acceptance:** C001-AC-401.1

### C001-REQ-402 — User story fields
- **Pattern:** event-driven
- **Statement:** WHEN the spec-writer writes a user story, THE spec-writer SHALL include the fields persona (P-ID), I want, So that, Value / outcome, Priority (MoSCoW), Size hint, Capability, Context & notes, Requirements and Traces to, plus Out of scope whenever a neighbouring feature is excluded.
- **Rationale:** IDEA-§13.1; Q16
- **Stories:** C001-US-402
- **Priority:** Must
- **Acceptance:** C001-AC-402.1

### C001-REQ-403 — Persona must exist
- **Pattern:** unwanted-behaviour
- **Statement:** IF a user story references a persona ID that is not defined in `10-context/stakeholders-and-personas.md`, THEN THE lint SHALL report error `LINT-US-001`.
- **Rationale:** consistency
- **Stories:** C001-US-402
- **Priority:** Must
- **Acceptance:** C001-AC-403.1

### C001-REQ-404 — Requirement fields
- **Pattern:** event-driven
- **Statement:** WHEN the spec-writer writes a functional requirement, THE spec-writer SHALL include the fields Pattern, Statement, Rationale, Stories, Priority and Acceptance, plus Delta whenever the change `kind` is not `greenfield`.
- **Rationale:** IDEA-§12.4
- **Stories:** C001-US-403
- **Priority:** Must
- **Acceptance:** C001-AC-404.1

### C001-REQ-405 — EARS shape check
- **Pattern:** unwanted-behaviour
- **Statement:** IF a requirement's Statement does not match the keyword shape of its declared Pattern as defined in C001-IF-04 §3, THEN THE lint SHALL report error `LINT-EARS-001` with the declared pattern and the detected shape.
- **Rationale:** Q8; IDEA-§13.3
- **Stories:** C001-US-403
- **Priority:** Must
- **Acceptance:** C001-AC-405.1, C001-AC-405.2

### C001-REQ-406 — Singular requirements
- **Pattern:** unwanted-behaviour
- **Statement:** IF a requirement's Statement contains, outside code spans, more than one occurrence of the keyword `SHALL` (including `SHALL NOT`), THEN THE lint SHALL report error `LINT-EARS-002`.
- **Rationale:** ISO/IEC/IEEE 29148 "singular" (IDEA-§13.2)
- **Stories:** C001-US-403
- **Priority:** Must
- **Acceptance:** C001-AC-406.1

### C001-REQ-407 — Known system names
- **Pattern:** unwanted-behaviour
- **Statement:** IF the system named after `THE` in a requirement's Statement is not a term of the project glossary, the change's glossary delta or the component catalogue, THEN THE lint SHALL report warning `LINT-EARS-003`.
- **Rationale:** IDEA-§13.3 last paragraph
- **Stories:** C001-US-403
- **Priority:** Should
- **Acceptance:** C001-AC-407.1

### C001-REQ-408 — Banned weak words
- **Pattern:** unwanted-behaviour
- **Statement:** IF a requirement Statement or an acceptance criterion contains a word from the weak-word list of C001-IF-04 §4 outside code spans and quoted strings, THEN THE lint SHALL report error `LINT-WORD-001` naming the word and its location.
- **Rationale:** IDEA-§13.2 "Unambiguous"; IDEA-P-04
- **Stories:** C001-US-403
- **Priority:** Must
- **Acceptance:** C001-AC-408.1, C001-AC-408.2

### C001-REQ-409 — Delta tagging for brownfield
- **Pattern:** optional-feature
- **Statement:** WHERE a change has `kind` `brownfield` or `mixed`, THE spec-writer SHALL tag every requirement with a Delta of `ADDED`, `MODIFIED`, `REMOVED` or `RENAMED`, and for any value other than `ADDED` cite the full ID of the living-spec requirement it alters.
- **Rationale:** OA-09; Q7 (OpenSpec deltas)
- **Stories:** C001-US-404
- **Priority:** Must
- **Acceptance:** C001-AC-409.1

### C001-REQ-410 — Code evidence for changed behaviour
- **Pattern:** unwanted-behaviour
- **Statement:** IF a requirement with Delta `MODIFIED` or `REMOVED` has no Evidence field containing a file path, a symbol and an evidence layer, THEN THE lint SHALL report error `TR-09`.
- **Rationale:** IDEA-§12.2 TR-09; C001-SC-07
- **Stories:** C001-US-404
- **Priority:** Must
- **Acceptance:** C001-AC-410.1

### C001-REQ-411 — Acceptance structure
- **Pattern:** event-driven
- **Statement:** WHEN the test-designer writes acceptance for a requirement, THE test-designer SHALL write one or more acceptance criteria numbered `AC-<req-seq>.<n>`, each followed by one or more fenced `gherkin` blocks whose `Scenario` or `Scenario Outline` title starts with a `TS` ID.
- **Rationale:** IDEA-§13.4
- **Stories:** C001-US-405
- **Priority:** Must
- **Acceptance:** C001-AC-411.1

### C001-REQ-412 — Coverage table
- **Pattern:** event-driven
- **Statement:** WHEN the test-designer completes a capability's `acceptance.md`, THE test-designer SHALL append a coverage table with one row per requirement and one column per checklist item of C001-IF-03 §7 (happy, alternate, boundary, error, authorization, concurrency/idempotency, abuse), each cell holding the covering TS IDs, `n/a: <reason>`, or `n/a` when a per-column reason is stated in a note directly below the table.
- **Rationale:** IDEA-§13.4 coverage checklist; completeness
- **Stories:** C001-US-405
- **Priority:** Must
- **Acceptance:** C001-AC-412.1

### C001-REQ-413 — Scenario steps
- **Pattern:** unwanted-behaviour
- **Statement:** IF a scenario does not have exactly one `When` step and at least one `Then` step, THEN THE lint SHALL report error `LINT-TS-001`; `Given` steps are optional.
- **Rationale:** IDEA-§13.8
- **Stories:** C001-US-405
- **Priority:** Must
- **Acceptance:** C001-AC-413.1

### C001-REQ-414 — NFR fields
- **Pattern:** event-driven
- **Statement:** WHEN the spec-writer writes a non-functional requirement, THE spec-writer SHALL include the fields Category (ISO 25010 characteristic), Statement (EARS), Metric, Threshold, Method, Environment, Rationale and DoD.
- **Rationale:** IDEA-§13.5
- **Stories:** C001-US-406
- **Priority:** Must
- **Acceptance:** C001-AC-414.1

### C001-REQ-415 — Unmeasurable NFR rejected
- **Pattern:** unwanted-behaviour
- **Statement:** IF a non-functional requirement has an empty Metric, Threshold or Method field, THEN THE lint SHALL report error `TR-04`.
- **Rationale:** IDEA-§12.2 TR-04
- **Stories:** C001-US-406
- **Priority:** Must
- **Acceptance:** C001-AC-415.1

### C001-REQ-416 — Domain model content
- **Pattern:** event-driven
- **Statement:** WHEN the spec-writer writes `40-domain/domain-model.md`, THE spec-writer SHALL describe every entity with its attributes (name, type, constraints), relationships, owning component and invariants identified as `INV-<seq>`.
- **Rationale:** IDEA-§11.3
- **Stories:** C001-US-407
- **Priority:** Must
- **Acceptance:** C001-AC-416.1

### C001-REQ-417 — State machines
- **Pattern:** event-driven
- **Statement:** WHEN an entity has more than two lifecycle states, THE spec-writer SHALL specify it in `40-domain/state-machines.md` with a Mermaid `stateDiagram-v2` and a transition table (from, event, guard, to, effect).
- **Rationale:** precision on lifecycle behaviour
- **Stories:** C001-US-407
- **Priority:** Must
- **Acceptance:** C001-AC-417.1

### C001-REQ-418 — Glossary delta
- **Pattern:** event-driven
- **Statement:** WHEN a spec artifact introduces a term absent from `_constitution/glossary.md`, THE spec-writer SHALL define it in `40-domain/glossary-delta.md`.
- **Rationale:** ubiquitous language; merged on archive (C001-CAP-09)
- **Stories:** C001-US-407
- **Priority:** Should
- **Acceptance:** C001-AC-418.1

### C001-REQ-419 — Feature DoD content
- **Pattern:** event-driven
- **Statement:** WHEN the test-designer writes `70-dod.md`, THE test-designer SHALL list each feature DoD item with an ID `DOD-<seq>`, a checkable statement, an evidence type from C001-IF-03 §8 and the REQ or NFR IDs it covers, together with references by ID to the constitution's global DoD items that apply.
- **Rationale:** IDEA-§13.6 three layers
- **Stories:** C001-US-408
- **Priority:** Must
- **Acceptance:** C001-AC-419.1

### C001-REQ-420 — DoD evidence type required
- **Pattern:** unwanted-behaviour
- **Statement:** IF a DoD item has no evidence type, THEN THE lint SHALL report error `LINT-DOD-001`.
- **Rationale:** "checkable statements, never aspirations" (IDEA-§13.6)
- **Stories:** C001-US-408
- **Priority:** Must
- **Acceptance:** C001-AC-420.1

### C001-REQ-421 — Clarification markers
- **Pattern:** event-driven
- **Statement:** WHEN an author agent lacks information needed to write a statement, THE author agent SHALL insert `[NEEDS CLARIFICATION: <question-id>]` at that location and return the corresponding question in its `questions` block.
- **Rationale:** IDEA-P-06
- **Stories:** C001-US-409
- **Priority:** Must
- **Acceptance:** C001-AC-421.1

### C001-REQ-422 — Navigation-only index
- **Pattern:** event-driven
- **Statement:** WHEN the spec-writer writes `10-spec/00-index.md`, THE spec-writer SHALL limit its content to the reading order, the list of files with their purpose in one line each, the capability list with ID blocks, and ID-count statistics.
- **Rationale:** IDEA-P-02 (index, never summarise)
- **Stories:** C001-US-401
- **Priority:** Should
- **Acceptance:** C001-AC-422.1
