---
id: C001-CAP-05
artifact: spec/stories
capability: "Architecture, interfaces and diagrams"
change: CHG-001
phase: 10-spec
status: approved
id_block: { US: 501-599, REQ: 501-599, TS: 501-599 }
---

# C001-CAP-05 — Architecture, interfaces and diagrams: user stories

### C001-US-501 — A complete architecture description
- **As a** P-04 validator
- **I want** an architecture document with fixed sections and a component catalogue where each component lists its responsibility, data, interfaces, dependencies and the requirements it realizes
- **So that** I can check that the code's structure realizes the specified behaviour and constraints
- **Value / outcome:** Q16 "architecture outputs very detailed, no brief"; C001-GOAL-02
- **Priority:** Must · **Size hint:** L · **Capability:** C001-CAP-05
- **Context & notes:** Section set and catalogue fields are fixed by C001-IF-06 and the architecture template; components without realized requirements are flagged by TR-10.
- **Requirements:** C001-REQ-501, C001-REQ-502, C001-REQ-503, C001-REQ-508
- **Traces to:** Q16, IDEA-§13.7

### C001-US-502 — Verified architecture diagrams
- **As a** P-01 spec owner
- **I want** architecture diagrams generated from a typed, validated model whose node IDs are the component IDs
- **So that** diagrams cannot drift from the catalogue or show components that don't exist
- **Value / outcome:** Q12; fewer hallucinated components. v1 checks Mermaid diagrams against the catalogue; the Archify model is deferred to a later change (spike S-03)
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-05
- **Context & notes:** Archify was deferred (spike S-03: no output on Windows 11), so diagrams are Mermaid; the lint checks diagram IDs against the catalogue after mapping `_` back to `-` (LINT-ARCH-001).
- **Requirements:** C001-REQ-509
- **Traces to:** Q12, IDEA-§7.4

### C001-US-503 — Diagrams without Archify
- **As a** P-03 adopter without Archify installed (or P-01 during CHG-001)
- **I want** Mermaid diagrams that use the same component IDs
- **So that** the spec is complete and renders on GitHub even without Archify
- **Value / outcome:** Q12; Spec-Q3 (Mermaid in v1, Archify in a later change, spike S-03)
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-05
- **Context & notes:** By convention (architecture §8) component IDs are written with `_` instead of `-` as Mermaid node IDs; the lint maps them back before comparing with the catalogue.
- **Requirements:** C001-REQ-507
- **Traces to:** Q12, Spec-Q3, IDEA-P-10

### C001-US-504 — As-is versus to-be for brownfield
- **As a** P-01 spec owner changing an existing system
- **I want** the current architecture, backed by code evidence, next to the target one and a visual delta between them
- **So that** I see exactly what the change does to the structure
- **Value / outcome:** C001-GOAL-04. v1 provides the evidence-backed as-is components; the visual delta needs Archify and is deferred (spike S-03)
- **Priority:** Should · **Size hint:** M · **Capability:** C001-CAP-05
- **Context & notes:** Brownfield and mixed changes; as-is components carry cartographer evidence (LINT-ARCH-005) and the delta section lists added, modified and removed components.
- **Requirements:** C001-REQ-516
- **Traces to:** Q3, IDEA-§7.4 (compare)

### C001-US-505 — Machine-readable interface contracts
- **As a** P-02 implementer
- **I want** every interface specified in its standard machine-readable format with an error catalogue
- **So that** I can generate stubs and contract tests, and P-04 can validate the implementation mechanically
- **Value / outcome:** C001-GOAL-02, C001-GOAL-03
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-05
- **Context & notes:** Formats per C001-IF-03 §9 (OpenAPI, JSON Schema, AsyncAPI, CLI contract, conventions); every contract file is registered in `50-interfaces/README.md` and must parse (LINT-IF-001).
- **Requirements:** C001-REQ-510, C001-REQ-511, C001-REQ-512, C001-REQ-513
- **Traces to:** IDEA-§7.7 (API contracts), §11.3

### C001-US-506 — Explicit architecture constraints
- **As a** P-02 implementer
- **I want** architecture constraints listed with their source and the components they bind
- **So that** I know which design rules are non-negotiable and why
- **Value / outcome:** fewer design deviations
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-05
- **Context & notes:** Every constraint names its source (DEC, ADR, NFR or constitution item) so it can be challenged at its origin; scope constraints live in `10-context/scope.md`, architecture constraints in `60-architecture/constraints.md`.
- **Requirements:** C001-REQ-514
- **Traces to:** IDEA-§13.7

### C001-US-507 — Technical decisions as ADRs
- **As a** P-04 validator
- **I want** technical decisions taken during planning recorded as ADRs backed by options analyses
- **So that** design rationale survives the change
- **Value / outcome:** C001-GOAL-05
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-05
- **Context & notes:** ADRs are written in `20-plan/20-decisions/` with the option analysis they close, using the same scoring rules as ideation option analyses.
- **Requirements:** C001-REQ-515
- **Traces to:** Q15, IDEA-§11.4
