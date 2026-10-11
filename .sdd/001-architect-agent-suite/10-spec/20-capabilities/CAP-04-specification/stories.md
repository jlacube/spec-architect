---
id: C001-CAP-04
artifact: spec/stories
capability: "Specification authoring"
change: CHG-001
phase: 10-spec
status: approved
id_block: { US: 401-499, REQ: 401-499, TS: 401-499 }
---

# C001-CAP-04 — Specification authoring: user stories

Interfaces/contracts and architecture are specified in C001-CAP-05 (written by the architect).
This capability covers the spec-writer and test-designer outputs.

### C001-US-401 — A navigable multi-file spec
- **As a** P-01 spec owner
- **I want** the spec split by concern at the top level and by capability for the functional core, with an index that only navigates
- **So that** a detailed spec stays readable, reviewable in diffs, and linkable by ID
- **Value / outcome:** detail without drowning (IDEA-RK-01); Q16 "multiple files"
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-04
- **Context & notes:** OA-04 option E; tree in IDEA-§11.3 (refined in C001-IF-06 §2).
- **Requirements:** C001-REQ-401, C001-REQ-422
- **Traces to:** Q16, OA-04

### C001-US-402 — Detailed user stories
- **As a** P-01 spec owner
- **I want** each user story to state the persona, need, outcome, priority, size, notes, exclusions and links
- **So that** requirements are anchored to a real need and reviewers can judge value
- **Value / outcome:** Q16 "very detailed user stories"
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-04
- **Context & notes:** Story fields follow C001-IF-03 §6; Out of scope is added only when a neighbouring feature is excluded; persona IDs must exist in `10-context/stakeholders-and-personas.md` (LINT-US-001).
- **Requirements:** C001-REQ-402, C001-REQ-403
- **Traces to:** Q16, IDEA-§13.1

### C001-US-403 — Unambiguous EARS requirements
- **As a** P-04 validator
- **I want** every functional requirement written in a declared EARS pattern, singular, free of weak words, and naming a known system
- **So that** each requirement has exactly one testable interpretation
- **Value / outcome:** C001-GOAL-02; Q8
- **Priority:** Must · **Size hint:** L · **Capability:** C001-CAP-04
- **Context & notes:** EARS shapes, the singularity rule and the weak-word list are defined in C001-IF-04 §3–§4; system names come from the glossary delta or the component catalogue.
- **Requirements:** C001-REQ-404, C001-REQ-405, C001-REQ-406, C001-REQ-407, C001-REQ-408
- **Traces to:** Q8, IDEA-§13.2, §13.3

### C001-US-404 — Brownfield deltas backed by code evidence
- **As a** P-01 spec owner changing an existing system
- **I want** each requirement tagged as added, modified, removed or renamed relative to the current truth, with code evidence for anything that changes existing behaviour
- **So that** the spec describes the real system and the change's impact is explicit
- **Value / outcome:** C001-GOAL-04; OpenSpec delta model (Q7)
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-04
- **Context & notes:** Applies to brownfield and mixed changes; Delta tags follow the OpenSpec style chosen in OA-09, and evidence uses the format of C001-IF-03 §11 (TR-09).
- **Requirements:** C001-REQ-409, C001-REQ-410
- **Traces to:** Q3, Q7, OA-09, TR-09

### C001-US-405 — Thorough acceptance scenarios
- **As a** P-02 implementer
- **I want** every requirement to have numbered acceptance criteria with concrete Given/When/Then scenarios covering happy, alternate, boundary, error, authorization, concurrency and abuse cases where applicable
- **So that** I know exactly what "done" means and can automate the checks
- **Value / outcome:** C001-GOAL-02, C001-GOAL-03; Q8, Q16 "very detailed ACs"
- **Priority:** Must · **Size hint:** L · **Capability:** C001-CAP-04
- **Context & notes:** The coverage checklist of C001-IF-03 §7 makes skipped categories explicit (`n/a` with a reason); scenario IDs are the anchors of the test plan.
- **Requirements:** C001-REQ-411, C001-REQ-412, C001-REQ-413
- **Traces to:** Q8, Q16, IDEA-§13.4

### C001-US-406 — Measurable non-functional requirements
- **As a** P-04 validator
- **I want** every NFR to state a metric, threshold, measurement method and environment
- **So that** quality attributes can be verified rather than argued about
- **Value / outcome:** C001-GOAL-02
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-04
- **Context & notes:** NFR categories follow ISO/IEC 25010; an NFR without metric, threshold or method cannot be verified and is a TR-04 error.
- **Requirements:** C001-REQ-414, C001-REQ-415
- **Traces to:** IDEA-§13.5, TR-04

### C001-US-407 — Domain model, invariants and state machines
- **As a** P-02 implementer
- **I want** the entities, their invariants and their lifecycles specified, and new terms added to a glossary
- **So that** I implement the right model and everyone uses the same words
- **Value / outcome:** consistency (IDEA-§13.2 Consistent)
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-04
- **Context & notes:** Entities with more than two lifecycle states get a state machine; new terms go to `40-domain/glossary-delta.md` and are merged into the project glossary at archive.
- **Requirements:** C001-REQ-416, C001-REQ-417, C001-REQ-418
- **Traces to:** IDEA-§11.3 `40-domain/`

### C001-US-408 — Strong, evidence-based Definition of Done
- **As a** P-04 validator
- **I want** a feature DoD whose items are checkable statements with an evidence type, linked to requirements, and inheriting the constitution's global DoD
- **So that** "done" is provable and the same everywhere
- **Value / outcome:** Q16 "strong DoD"
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-04
- **Context & notes:** Evidence types are listed in C001-IF-03 §8; feature DoD items cover requirements directly, by range or by capability, and the constitution's global DoD applies on top.
- **Requirements:** C001-REQ-419, C001-REQ-420
- **Traces to:** Q16, IDEA-§13.6, TR-05

### C001-US-409 — Clarification markers instead of silent assumptions
- **As a** P-01 spec owner
- **I want** authors to mark what they don't know with a visible marker tied to a question
- **So that** unknowns are asked about or explicitly waived, never baked in
- **Value / outcome:** IDEA-P-06 (borrowed from Spec Kit)
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-04
- **Context & notes:** Markers are `[NEEDS CLARIFICATION: <question-id>]`; open markers block approval unless waived by name (C001-REQ-720) and are listed in `85-open-items.md`.
- **Requirements:** C001-REQ-421
- **Traces to:** IDEA-P-06, Q7
