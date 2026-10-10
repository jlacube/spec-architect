---
id: C001-CAP-06
artifact: spec/stories
capability: "Planning and hand-off"
change: CHG-001
phase: 10-spec
status: draft
id_block: { US: 601-699, REQ: 601-699, TS: 601-699 }
---

# C001-CAP-06 — Planning and hand-off: user stories

### C001-US-601 — A sequenced strategy with milestones
- **As a** P-02 implementer
- **I want** a strategy that explains the approach and sequencing, organised in milestones with exit criteria
- **So that** I build in an order that reduces risk early and know when each stage is finished
- **Value / outcome:** C001-GOAL-03
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-06
- **Requirements:** C001-REQ-601, C001-REQ-608
- **Traces to:** IDEA-§10.5, §11.4

### C001-US-602 — Self-contained, test-anchored task files
- **As a** P-02 implementer
- **I want** one file per task naming the exact targets, the requirements and acceptance criteria it serves, the scenarios that prove it, the verification commands and the done-checks, without prescribing code
- **So that** I can execute any task without re-reading the whole spec, and P-04 can validate it later
- **Value / outcome:** C001-GOAL-03, C001-GOAL-07; OA-11 option B
- **Priority:** Must · **Size hint:** L · **Capability:** C001-CAP-06
- **Out of scope:** code-level plans with complete function bodies (OA-11 option C rejected).
- **Requirements:** C001-REQ-602, C001-REQ-603, C001-REQ-604, C001-REQ-605, C001-REQ-606
- **Traces to:** Q6, OA-11, IDEA-§12.5

### C001-US-603 — A valid dependency graph
- **As a** P-02 implementer
- **I want** task dependencies that form an acyclic graph with a visible critical path
- **So that** I never get stuck on circular prerequisites and know what gates the finish date
- **Value / outcome:** executability (C001-SC-04)
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-06
- **Requirements:** C001-REQ-607, C001-REQ-608
- **Traces to:** TR-11

### C001-US-604 — A test plan that covers every scenario
- **As a** P-04 validator
- **I want** every acceptance scenario mapped to a planned test with its level, location, data and environment
- **So that** I can confirm, scenario by scenario, that the specification is verified by tests
- **Value / outcome:** C001-GOAL-02
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-06
- **Requirements:** C001-REQ-609
- **Traces to:** TR-08, IDEA-§11.4

### C001-US-605 — Impact analysis for brownfield plans
- **As a** P-01 spec owner changing an existing system
- **I want** the plan to include the blast radius of each touched symbol, the hotspots involved and the regression tests to keep green
- **So that** risky areas get explicit tasks and tests, and nothing breaks silently
- **Value / outcome:** C001-GOAL-04
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-06
- **Requirements:** C001-REQ-610, C001-REQ-611, C001-REQ-612
- **Traces to:** Q9, IDEA-§7.2, §20.2

### C001-US-606 — Risks, rollout, rollback and observability
- **As a** P-02 implementer
- **I want** a risk register with mitigations, a rollout and rollback plan, and the signals that prove the NFRs in production
- **So that** delivery is safe and quality is observable after release
- **Value / outcome:** C001-GOAL-03
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-06
- **Requirements:** C001-REQ-613, C001-REQ-614, C001-REQ-615
- **Traces to:** IDEA-§11.4, TR-14

### C001-US-607 — A hand-off any implementer can follow
- **As a** P-02 implementer, possibly without the Architect plugin
- **I want** a single hand-off document with the reading order, the rules, an ordered task list and the progress-reporting protocol (with a no-tooling fallback)
- **So that** I can start immediately and keep `.sdd/` informed of progress and spec defects
- **Value / outcome:** C001-GOAL-06, C001-GOAL-07; Q6, Q19
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-06
- **Requirements:** C001-REQ-616, C001-REQ-617
- **Traces to:** Q6, Q19, IDEA-§10.6

### C001-US-608 — Lite plans
- **As a** P-01 spec owner on a small change
- **I want** the plan in a single file with inline tasks that carry the same fields
- **So that** small changes keep traceability with little overhead
- **Value / outcome:** OQ-05
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-06
- **Requirements:** C001-REQ-618
- **Traces to:** OQ-05, Spec-Q1
