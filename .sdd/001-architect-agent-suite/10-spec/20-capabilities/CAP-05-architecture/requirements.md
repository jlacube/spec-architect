---
id: C001-CAP-05
artifact: spec/requirements
capability: "Architecture, interfaces and diagrams"
change: CHG-001
phase: 10-spec
status: approved
delta_default: ADDED
---

# C001-CAP-05 — Requirements

All `Delta: ADDED`. Interfaces: Archify CLI (external, C001-IF-14), templates C001-IF-03 §9.

### C001-REQ-501 — Architecture document sections
- **Pattern:** event-driven
- **Statement:** WHEN the architect writes `60-architecture/architecture.md`, THE architect SHALL include the sections Context and scope, Component catalogue, Runtime flows, Data view, Deployment view, Cross-cutting concerns, Constraints, Diagrams, and (for brownfield or mixed changes) As-is to to-be delta.
- **Rationale:** IDEA-§13.7
- **Stories:** C001-US-501
- **Priority:** Must
- **Acceptance:** C001-AC-501.1

### C001-REQ-502 — Component catalogue fields
- **Pattern:** event-driven
- **Statement:** WHEN the architect adds a component to the catalogue, THE architect SHALL give it an ID `COMP-<seq>` and the fields Name, Responsibility, Owned data, Interfaces (IF IDs), Depends on (COMP IDs), Realizes (REQ and NFR IDs) and Status (`existing`, `new`, `modified` or `removed`).
- **Rationale:** IDEA-§13.7; traceability COMP ↔ REQ
- **Stories:** C001-US-501
- **Priority:** Must
- **Acceptance:** C001-AC-502.1

### C001-REQ-503 — Components must realize something
- **Pattern:** unwanted-behaviour
- **Statement:** IF a component with Status other than `removed` lists no REQ or NFR under Realizes, THEN THE lint SHALL report warning `TR-10`.
- **Rationale:** IDEA-§12.2 TR-10
- **Stories:** C001-US-501
- **Priority:** Should
- **Acceptance:** C001-AC-503.1

### C001-REQ-504 — To-be Archify model
- **Pattern:** optional-feature
- **Statement:** WHERE `toolchain.md` records Archify as detected, THE architect SHALL write `60-architecture/to-be.architecture.json` in Archify IR with one node per catalogue component whose node ID equals the component ID, and run `archify validate architecture` on it until it reports no errors.
- **Rationale:** Q12, IDEA-§7.4
- **Stories:** C001-US-502
- **Priority:** Must
- **Acceptance:** C001-AC-504.1

### C001-REQ-505 — Rendered HTML
- **Pattern:** event-driven
- **Statement:** WHEN an Archify IR file validates without errors, THE architect SHALL render it with `archify deliver` to an HTML file of the same base name in `60-architecture/`.
- **Rationale:** human view of the model
- **Stories:** C001-US-502
- **Priority:** Must
- **Acceptance:** C001-AC-505.1

### C001-REQ-506 — As-is model and delta
- **Pattern:** complex
- **Statement:** WHILE the change `kind` is `brownfield` or `mixed`, WHERE Archify is detected, THE architect SHALL produce `as-is.architecture.json` with evidence pinned to the repository's HEAD commit and render `delta.html` with `archify compare architecture as-is.architecture.json to-be.architecture.json`.
- **Rationale:** C001-US-504
- **Stories:** C001-US-504
- **Priority:** Should
- **Acceptance:** C001-AC-506.1

### C001-REQ-507 — Mermaid fallback
- **Pattern:** unwanted-behaviour
- **Statement:** IF Archify is not detected, THEN THE architect SHALL express the component view as a Mermaid `flowchart` and each runtime flow as a Mermaid `sequenceDiagram`, using component IDs as node and participant IDs (with `-` replaced by `_`, as Mermaid identifiers require), and state "Archify: not available — Mermaid fallback" in the Diagrams section.
- **Rationale:** Q12 fallback; Spec-Q3; IDEA-P-10
- **Stories:** C001-US-503
- **Priority:** Must
- **Acceptance:** C001-AC-507.1

### C001-REQ-508 — One sequence per runtime flow
- **Pattern:** event-driven
- **Statement:** WHEN the architect lists a runtime flow in the Runtime flows section, THE architect SHALL provide a sequence diagram for it (Archify sequence IR or Mermaid) that names the TS IDs the flow realizes.
- **Rationale:** IDEA-§13.7 key runtime flows
- **Stories:** C001-US-501
- **Priority:** Must
- **Acceptance:** C001-AC-508.1

### C001-REQ-509 — Diagram/catalogue ID consistency
- **Pattern:** unwanted-behaviour
- **Statement:** IF a component ID (compared after mapping `_` back to `-`) appears in an Archify IR file or a Mermaid component diagram but not in the catalogue, or a non-removed catalogue component appears in no component diagram, THEN THE lint SHALL report error `LINT-ARCH-001`.
- **Rationale:** no drift between model and catalogue
- **Stories:** C001-US-502
- **Priority:** Must
- **Acceptance:** C001-AC-509.1

### C001-REQ-510 — Interface registry
- **Pattern:** event-driven
- **Statement:** WHEN the architect defines an interface, THE architect SHALL register it in `50-interfaces/README.md` with an ID `IF-<seq>`, its kind, its file path, its provider component, its consumer components and the REQ IDs it serves.
- **Rationale:** IDEA-§11.3
- **Stories:** C001-US-505
- **Priority:** Must
- **Acceptance:** C001-AC-510.1

### C001-REQ-511 — Standard formats
- **Pattern:** event-driven
- **Statement:** WHEN an interface is of a kind listed in C001-IF-03 §9 (HTTP API, JSON document, event stream, CLI), THE architect SHALL express it in the format listed there (OpenAPI 3.1, JSON Schema 2020-12, AsyncAPI 3.0, or the CLI contract template).
- **Rationale:** mechanical validation by P-04
- **Stories:** C001-US-505
- **Priority:** Must
- **Acceptance:** C001-AC-511.1

### C001-REQ-512 — Parseable contracts
- **Pattern:** unwanted-behaviour
- **Statement:** IF a `.json`, `.yaml` or `.yml` file under `50-interfaces/` fails to parse, THEN THE lint SHALL report error `LINT-IF-001` with the parser message and position.
- **Rationale:** IDEA-§17.1 lint list
- **Stories:** C001-US-505
- **Priority:** Must
- **Acceptance:** C001-AC-512.1

### C001-REQ-513 — Error catalogue
- **Pattern:** event-driven
- **Statement:** WHEN an interface defines an error condition, THE architect SHALL list it in `50-interfaces/errors.md` with its code, condition, user-facing message, and the REQ or AC IDs that specify it.
- **Rationale:** IDEA-§11.3; ties unwanted-behaviour REQs to codes
- **Stories:** C001-US-505
- **Priority:** Must
- **Acceptance:** C001-AC-513.1

### C001-REQ-514 — Architecture constraints
- **Pattern:** event-driven
- **Statement:** WHEN the architect identifies an architecture constraint, THE architect SHALL record it in `60-architecture/constraints.md` with an ID `CON-<seq>`, a statement, its source (DEC, ADR, NFR or constitution ID) and the affected COMP IDs.
- **Rationale:** IDEA-§13.7
- **Stories:** C001-US-506
- **Priority:** Must
- **Acceptance:** C001-AC-514.1

### C001-REQ-515 — ADRs in planning
- **Pattern:** event-driven
- **Statement:** WHEN the plan phase needs a technical decision that no existing DEC or ADR settles, THE architect SHALL record it as `20-plan/20-decisions/ADR-<seq>-<slug>.md` in MADR form, linking its option analysis and the affected CON and COMP IDs.
- **Rationale:** Q15; IDEA-§11.4
- **Stories:** C001-US-507
- **Priority:** Must
- **Acceptance:** C001-AC-515.1

### C001-REQ-516 — Evidence for as-is components
- **Pattern:** event-driven
- **Statement:** WHEN the architect describes a component with Status `existing`, `modified` or `removed`, THE architect SHALL cite cartographer evidence for it (file path, symbol and evidence layer).
- **Rationale:** C001-GOAL-04
- **Stories:** C001-US-504
- **Priority:** Must
- **Acceptance:** C001-AC-516.1

### C001-REQ-517 — Deterministic Archify runs
- **Pattern:** event-driven
- **Statement:** WHEN the architect invokes the Archify CLI, THE architect SHALL set the environment variable `ARCHIFY_UPDATE_CHECK_DISABLED=1` for that invocation.
- **Rationale:** IDEA-§7.4; determinism and no unsolicited network calls
- **Stories:** C001-US-502
- **Priority:** Should
- **Acceptance:** C001-AC-517.1
