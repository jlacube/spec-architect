---
id: C001-CAP-10
artifact: spec/stories
capability: "Code intelligence integration"
change: CHG-001
phase: 10-spec
status: approved
id_block: { US: 1001-1099, REQ: 1001-1099, TS: 1001-1099 }
---

# C001-CAP-10 — Code intelligence integration: user stories

### C001-US-1001 — Cheapest sufficient tool, with honest fallback
- **As a** P-01 spec owner
- **I want** the cartographer to use the cheapest tool that can answer each code question, fall back layer by layer when a tool is missing or fails, and say which layer produced each fact
- **So that** brownfield grounding works on any machine and I know how much to trust each claim
- **Value / outcome:** IDEA-P-09, P-10; OA-05
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-10
- **Requirements:** C001-REQ-1001, C001-REQ-1010, C001-REQ-1011
- **Traces to:** Q9, OA-05, IDEA-§20.5

### C001-US-1002 — ripwire as a budgeted CLI
- **As a** P-01 spec owner
- **I want** ripwire used through its CLI with token budgets, and its honesty disclosures (truncations, unindexed languages) carried into the evidence
- **So that** I get its ranking, blast radius and test selection without paying MCP schema cost or losing caveats
- **Value / outcome:** D-05; C001-SC-07
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-10
- **Requirements:** C001-REQ-1003, C001-REQ-1004, C001-REQ-1005
- **Traces to:** Q9, Q10, IDEA-§7.2

### C001-US-1003 — Serena strictly read-only and scoped
- **As a** P-01 spec owner
- **I want** Serena's symbol-precise lookups available only to the agents that need them, and unable to edit anything
- **So that** I get LSP precision without risking code changes or bloating every agent's context
- **Value / outcome:** C001-CON-08; mitigates IDEA-RK-07
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-10
- **Requirements:** C001-REQ-1006, C001-REQ-1007, C001-REQ-1008
- **Traces to:** Q9, IDEA-§7.3, §17.3

### C001-US-1004 — Structural evidence with ast-grep
- **As a** P-01 spec owner
- **I want** structural code patterns (e.g. "handlers without auth middleware") searched with ast-grep when it is installed
- **So that** NFR and constraint statements about existing code are backed by exhaustive structural evidence
- **Value / outcome:** OA-05 option B (optional)
- **Priority:** Could · **Size hint:** S · **Capability:** C001-CAP-10
- **Requirements:** C001-REQ-1009
- **Traces to:** Q9 extension, IDEA-§7.6

### C001-US-1005 — Uniform evidence and lean returns
- **As a** P-04 validator
- **I want** every code claim recorded in one evidence format, and the cartographer to return only a digest and file paths
- **So that** claims are checkable and the conductor's context stays small
- **Value / outcome:** IDEA-P-03; cost control
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-10
- **Requirements:** C001-REQ-1002, C001-REQ-1012
- **Traces to:** IDEA-§14.3 A2
