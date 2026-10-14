---
id: C002-CAP-05
artifact: spec/stories
change: CHG-002
phase: 10-spec
status: draft
capability: "CLI distribution, allowlist and doctor"
id_block: { US: 501-599, REQ: 501-599, TS: 501-599 }
---
# C002-CAP-05 — CLI distribution, allowlist and doctor: user stories

### C002-US-501 — Install the CLI from npm as `sdd`
- **As a** P-03 adopter on OpenCode or Copilot VS Code
- **I want** to install the CLI once from npm and call it as `sdd`
- **So that** agents on my host reach the CLI without a plugin-root variable, which only Claude Code provides
- **Value / outcome:** C002-GOAL-04; C002-SC-01, C002-SC-02
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-05
- **Context & notes:** C002-DEC-007: npm package `architect-sdd` with the executable `sdd`; the package also carries the sdd MCP server entry (C002-US-404). Name `architect-sdd`, unscoped, published by P-01 (Q-cli-02, spec round 1); the name's availability stays C002-AS-05. The repository's `package.json` is private with no `bin` today (current-state E-3). Bundled, with no runtime npm dependency (constitution, forbidden technologies). The Claude Code plugin keeps its bundled `scripts/sdd.mjs` and its hook commands (C001-REQ-1121) unchanged, so P-03 on Claude Code needs no npm install (C002-GOAL-05). Edge case for the requirements: a target package and an installed `architect-sdd` of different versions.
- **Requirements:** C002-REQ-501, C002-REQ-502, C002-REQ-509
- **Traces to:** C002-DEC-007; Q-cli-01; ideation §5

### C002-US-502 — The allowlist accepts a bare `sdd` command and `node --version`
- **As a** P-01 spec owner
- **I want** the bash guard allowlist to accept a bare `sdd …` command and the probe `node --version`
- **So that** agents and the sdd MCP server can call the npm CLI, and the doctor's Node probe is no longer denied (defect D-011 of CHG-001)
- **Value / outcome:** C002-GOAL-04, C002-GOAL-05
- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-05
- **Context & notes:** Today `sddCli` accepts only `node <path>/sdd.mjs` or the literal `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs`, and `VERSION_PROBES` lists `node -v` but not `node --version` (current-state E-5, E-6). The change is a `MODIFIED` delta of C001-REQ-1106 under C002-CON-05; the "sdd CLI" and "tool versions" rows of C001-IF-07 §3, the `ALLOWED` message and the guard corpora follow (current-state §2 items 5 and 6). It is the only Claude Code behaviour CHG-002 changes (C002-GOAL-05); D-011 is closed when the implementing task is done. The probe fix covers `node --version` only, because the other probes already use `--version` (decided in C002-REQ-503; ideation §11). A bare `sdd` runs whatever `sdd` the PATH resolves, the same trust as the existing `git` and `ripwire` entries.
- **Requirements:** C002-REQ-503, C002-REQ-607
- **Traces to:** C002-DEC-007 (Consequences); ideation §4.1 (G-5), §5 (Dependencies); D-011 of CHG-001

### C002-US-503 — Doctor on every target
- **As a** P-03 adopter on any target
- **I want** the doctor to report my host and its version against the tested version, and whether `sdd` is reachable and which version it is
- **So that** I see what is missing or untested before I start a change
- **Value / outcome:** C002-GOAL-04; C002-SC-01, C002-SC-02
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-05
- **Context & notes:** Today the doctor reports Claude Code and checks its minimum version (C001-REQ-1110, C001-REQ-1123); on the generated targets the host rows differ, so these are `MODIFIED` candidates. Tested versions are recorded by the doctor and re-checked before each release (ideation §9, platforms change fast): the tested version of a target is the host version recorded by the spike that validated it (Q-versions-01, spec round 1). On Copilot VS Code the doctor also reports disabled hooks when the Copilot hooks fallback is in use (C002-US-303). A missing optional tool still never fails the doctor (C001-REQ-1111).
- **Requirements:** C002-REQ-504, C002-REQ-505, C002-REQ-506, C002-REQ-507, C002-REQ-508, C002-REQ-509, C002-REQ-510, C002-REQ-621
- **Traces to:** ideation §9, §11; C002-DEC-005 (Consequences)
