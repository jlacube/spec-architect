---
id: C001-CAP-11
artifact: spec/stories
capability: "Packaging, safety and environment"
change: CHG-001
phase: 10-spec
status: approved
id_block: { US: 1101-1199, REQ: 1101-1199, TS: 1101-1199 }
---

# C001-CAP-11 — Packaging, safety and environment: user stories

### C001-US-1101 — Install from a local marketplace
- **As a** P-01 spec owner (and later P-03 adopter)
- **I want** the suite packaged as a Claude Code plugin with a marketplace manifest in this repository
- **So that** I can install, update and later share it with standard plugin commands
- **Value / outcome:** C001-GOAL-08; OA-02 option C; OQ-18
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-11
- **Requirements:** C001-REQ-1101, C001-REQ-1102, C001-REQ-1121
- **Traces to:** Q4, OA-02, OQ-18

### C001-US-1102 — Spec agents physically cannot touch code
- **As a** P-01 spec owner
- **I want** a guard that denies any write by the spec agents outside `.sdd/`, including through path tricks
- **So that** the "spec phases only" boundary holds even if an agent misbehaves or is prompt-injected
- **Value / outcome:** C001-CON-01; D-02
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-11
- **Requirements:** C001-REQ-1103, C001-REQ-1104, C001-REQ-1105
- **Traces to:** Q2, IDEA-P-01, §17.2

### C001-US-1103 — Shell access limited to read-only tools
- **As a** P-01 spec owner
- **I want** agents' shell commands restricted to an allowlist of read-only tool invocations and the sdd CLI
- **So that** nothing mutates the repository or the machine through Bash
- **Value / outcome:** C001-CON-01
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-11
- **Requirements:** C001-REQ-1106, C001-REQ-1107
- **Traces to:** IDEA-§17.2, §17.3

### C001-US-1104 — Research and code MCP servers configured once, scoped per agent
- **As a** P-01 spec owner
- **I want** Context7, DeepWiki and Serena declared by the plugin and granted only to the agents that use them
- **So that** setup is automatic and other agents don't pay their schema cost
- **Value / outcome:** Q11, OQ-04; IDEA-RK-07
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-11
- **Requirements:** C001-REQ-1108, C001-REQ-1109
- **Traces to:** Q11, OQ-04, D-03

### C001-US-1105 — A doctor that tells me what's missing and how to fix it
- **As a** P-03 adopter on a fresh machine
- **I want** one command that checks every prerequisite and optional tool, shows fallbacks and prints the install command for anything missing
- **So that** I get a working setup without reading the source
- **Value / outcome:** C001-SC-09
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-11
- **Requirements:** C001-REQ-1110, C001-REQ-1111
- **Traces to:** IDEA-§16, §21

### C001-US-1106 — Shareable: license, notices, documentation, no machine-specific paths
- **As a** P-03 adopter
- **I want** a clear MIT license, a list of bundled third-party licenses, a README for Windows-first installation, and no hard-coded paths from the author's machine
- **So that** I can legally use, install and adapt the suite
- **Value / outcome:** C001-GOAL-08; Spec-Q2
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-11
- **Requirements:** C001-REQ-1112, C001-REQ-1113, C001-REQ-1114, C001-REQ-1115, C001-REQ-1120
- **Traces to:** Q4, Spec-Q2, IDEA-RK-14

### C001-US-1107 — Measured delegation and validated plugin
- **As a** P-01 spec owner
- **I want** an eval suite proving that prompts reach the right agent, plus one local check command that validates the plugin, runs the tests and the lint fixtures
- **So that** regressions in agent descriptions or structure are caught before I rely on them
- **Value / outcome:** C001-SC-05; IDEA-RK-12
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-11
- **Requirements:** C001-REQ-1116, C001-REQ-1117, C001-REQ-1118, C001-REQ-1122
- **Traces to:** IDEA-§14.4, §25

### C001-US-1108 — Cross-platform CI prepared but dormant
- **As a** P-01 spec owner
- **I want** CI workflows for Windows, macOS and Linux written and ready, but not triggered automatically on any remote server
- **So that** enabling cross-platform testing later is a switch, not a project
- **Value / outcome:** Spec-Q4 ("2 will come fast, maybe prepare but don't run on remote servers yet")
- **Priority:** Should · **Size hint:** S · **Capability:** C001-CAP-11
- **Requirements:** C001-REQ-1119
- **Traces to:** Spec-Q4, C001-NG-07

### C001-US-1109 — A portable methodology core
- **As a** P-03 adopter using another agent runtime later
- **I want** skills and templates written as plain methodology without Claude-Code-specific tool names except in clearly marked wiring sections
- **So that** they can be reused through AGENTS.md or another runtime's skill loader
- **Value / outcome:** Q1 portable core; IDEA-P-12
- **Priority:** Should · **Size hint:** S · **Capability:** C001-CAP-11
- **Requirements:** C001-REQ-1118
- **Traces to:** Q1, IDEA-§15.2
