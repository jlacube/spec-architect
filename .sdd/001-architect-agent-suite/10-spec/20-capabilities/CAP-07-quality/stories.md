---
id: C001-CAP-07
artifact: spec/stories
capability: "Quality: lint, traceability, critic, auditor"
change: CHG-001
phase: 10-spec
status: draft
id_block: { US: 701-799, REQ: 701-799, TS: 701-799 }
---

# C001-CAP-07 — Quality: user stories

Individual lint rules are specified with the artifact they protect (CAP-01, 03, 04, 05, 06).
This capability specifies the lint engine, the traceability engine, the critic and the auditor.

### C001-US-701 — One deterministic lint command
- **As a** P-01 spec owner
- **I want** a single command that checks a change (or the whole workspace) against all rules and reports errors, warnings and info with stable codes, locations and a machine-readable form
- **So that** gates rest on objective checks and tools can consume the results
- **Value / outcome:** C001-SC-02; OA-07 option C
- **Priority:** Must · **Size hint:** L · **Capability:** C001-CAP-07
- **Requirements:** C001-REQ-701, C001-REQ-702, C001-REQ-703, C001-REQ-704, C001-REQ-705
- **Traces to:** Q16, OA-07, IDEA-§17.1

### C001-US-702 — Generated traceability matrix
- **As a** P-04 validator
- **I want** a generated matrix (markdown and JSON) linking stories, requirements, criteria, scenarios, tasks, tests, components, DoD items and risks, with coverage statistics
- **So that** I can navigate from any requirement to its proof and later compare it with the code
- **Value / outcome:** C001-GOAL-02; v2 conformance-checker input
- **Priority:** Must · **Size hint:** L · **Capability:** C001-CAP-07
- **Requirements:** C001-REQ-706, C001-REQ-707, C001-REQ-708, C001-REQ-709
- **Traces to:** IDEA-§12.2, §12.3

### C001-US-703 — Independent adversarial critic
- **As a** P-01 spec owner
- **I want** an independent reviewer that looks for ambiguity, gaps, contradictions, untestable statements, missing edge cases, summaries posing as detail and unsupported claims, and reports them with evidence and severity
- **So that** I'm not the only line of defence before approving a gate
- **Value / outcome:** C001-SC-03; mitigates IDEA-RK-08 (lenient critic) and RK-09 (gaming the lint)
- **Priority:** Must · **Size hint:** L · **Capability:** C001-CAP-07
- **Requirements:** C001-REQ-710, C001-REQ-711, C001-REQ-712, C001-REQ-713, C001-REQ-714
- **Traces to:** OA-07, IDEA-§14.3 A8

### C001-US-704 — Mechanical bookkeeping on a cheap model
- **As a** P-01 spec owner
- **I want** the generated files (matrix, open items, status) refreshed by a low-cost agent that only runs the scripts and reports
- **So that** expensive models are not spent on bookkeeping
- **Value / outcome:** cost control (Q17)
- **Priority:** Should · **Size hint:** S · **Capability:** C001-CAP-07
- **Requirements:** C001-REQ-715, C001-REQ-716
- **Traces to:** Q17, IDEA-§14.3 A9

### C001-US-705 — Clean generic rules
- **As a** P-04 validator
- **I want** dangling references, ID reuse, leftover placeholders and unresolved markers caught everywhere
- **So that** nothing in an approved artifact points at nothing or says "TBD"
- **Value / outcome:** C001-SC-02
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-07
- **Requirements:** C001-REQ-717, C001-REQ-718, C001-REQ-719, C001-REQ-720
- **Traces to:** TR-12, TR-13, IDEA-§13.8
