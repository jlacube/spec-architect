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
- **Context & notes:** C002-DEC-007: npm package `architect-sdd` with the executable `sdd`; the package also carries the sdd MCP server entry (C002-US-404). Name `architect-sdd`, unscoped, published by P-01 (Q-cli-02, spec round 1); the name's availability stays C002-AS-05. The repository's `package.json` is private with no `bin` today (current-state E-3). Bundled, with no runtime npm dependency (constitution, forbidden technologies). The Claude Code plugin keeps its bundled `scripts/sdd.mjs` and its hook commands (C001-REQ-1121) unchanged, so P-03 on Claude Code needs no npm install (C002-GOAL-05). Edge case for the requirements: a target package and an installed `architect-sdd` of different versions, told apart by `sdd --version`.
- **Requirements:** C002-REQ-501, C002-REQ-502, C002-REQ-509, C002-REQ-511
- **Traces to:** C002-DEC-007; Q-cli-01; ideation §5

### C002-US-502 — The allowlist accepts a bare `sdd` command and `node --version`, and confines the Serena commands
- **As a** P-01 spec owner
- **I want** the bash guard allowlist to accept a bare `sdd …` command and the probe `node --version`, to allow `sdd serena-config` and `sdd serena-launch` only with a data folder outside the repository, and to allow `--cwd` on a writing `sdd` subcommand only with a folder inside the repository root
- **So that** agents and the sdd MCP server can call the npm CLI, the doctor's Node probe is no longer denied (defect D-011 of CHG-001), no allowlisted `sdd` command writes outside `.sdd/` into the repository, and a writing `sdd` command starts from a folder at or under the repository root and therefore writes only the workspace found upward from there (the nearest `.sdd/`; for `init` when none exists, the nearest folder with `.git/`, else the starting folder), never one that `--cwd` names elsewhere
- **Value / outcome:** C002-GOAL-02, C002-GOAL-04, C002-GOAL-05
- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-05
- **Context & notes:** Today `sddCli` accepts only `node <path>/sdd.mjs` or the literal `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs`, with any subcommand, and `VERSION_PROBES` lists `node -v` but not `node --version` (current-state E-5, E-6). The allowlist change is the single `MODIFIED` delta of C001-REQ-1106 under C002-CON-05 (C002-REQ-503); the Serena confinement and the `--cwd` confinement are `ADDED` rules beside it (C002-REQ-517, C002-REQ-521); the "sdd CLI" and "tool versions" rows of C001-IF-07 §3, the `ALLOWED` message and the guard corpora follow (current-state §2 items 5 and 6). They are the only Claude Code behaviours CHG-002 changes (C002-GOAL-05, widened by Q-guards-04 in spec round 2 and Q-guards-05 in spec round 4); D-011 is closed when the implementing task is done. The probe fix covers `node --version` only, because the other probes already use `--version` (decided in C002-REQ-503; ideation §11). A bare `sdd` runs whatever `sdd` the PATH resolves, the same trust as the existing `git` and `ripwire` entries. `sdd serena-config <folder>` writes Serena's configuration under any folder it is given (current-state E-22), hence the confinement on every host (Q-guards-04). The global option `--cwd` lets any writing `sdd` subcommand write the `.sdd/` of another folder, hence the second confinement on every host (Q-guards-05). Workspace discovery itself is unchanged (C001-IF-01): in a repository without `.sdd/`, the nearest `.sdd/` upward can lie above the repository root, as for the path guard and the sdd MCP server (C002-IF-008 §1.2; critic CR-36); stopping discovery at the git root is an idea for a later change.
- **Requirements:** C002-REQ-503, C002-REQ-517, C002-REQ-521, C002-REQ-607
- **Traces to:** C002-DEC-007 (Consequences); ideation §4.1 (G-5), §5 (Dependencies), §9 (risk "a command that writes files"); D-011 of CHG-001; Q-guards-04; Q-guards-05

### C002-US-503 — Doctor on every target
- **As a** P-03 adopter on any target
- **I want** the doctor to report my host and its version against the tested version, and whether `sdd` is reachable and which version it is
- **So that** I see what is missing or untested before I start a change
- **Value / outcome:** C002-GOAL-04; C002-SC-01, C002-SC-02
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-05
- **Context & notes:** Today the doctor reports Claude Code and checks its minimum version (C001-REQ-1110, C001-REQ-1123); on the generated targets the host rows differ, so these are `MODIFIED` candidates. Tested versions are recorded by the doctor and re-checked before each release (ideation §9, platforms change fast): the tested version of a target is the host version recorded by the spike that validated it (Q-versions-01, spec round 1). On Copilot VS Code the doctor also reports disabled hooks, in both Copilot enforcement modes (C002-REQ-510; C002-US-303, C002-US-307). A missing optional tool still never fails the doctor (C001-REQ-1111).
- **Requirements:** C002-REQ-504, C002-REQ-505, C002-REQ-506, C002-REQ-507, C002-REQ-508, C002-REQ-509, C002-REQ-510, C002-REQ-621
- **Traces to:** ideation §9, §11; C002-DEC-005 (Consequences)

### C002-US-504 — Templates through the CLI on every target
- **As a** P-03 adopter on OpenCode or Copilot VS Code
- **I want** the agents to read the artifact templates through `sdd`, from my repository's `.sdd/_templates/` or from the templates installed with `architect-sdd`
- **So that** changes created on my host use the same templates as on Claude Code (apart from the hand-off lines that name the CLI, which name the bare `sdd`), without a plugin-root variable in agent and command bodies
- **Value / outcome:** C002-GOAL-03, C002-GOAL-04
- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-05
- **Context & notes:** Bodies name templates as `${CLAUDE_PLUGIN_ROOT}/templates/…` (`agents/sdd-spec-writer.md:19`, `commands/decide.md:18`, `commands/init.md:25`), which neither generated host expands in bodies (C002-R-001 A-09). Before CHG-002 the CLI looked up templates beside its bundle only when `CLAUDE_PLUGIN_ROOT` was unset (`src/workspace/templates.ts:33`; current-state E-7); the lookup order of the shipped CLI is in C002-IF-003 §1 (defect D-004). The hand-off templates name the CLI as `node <plugin-root>/scripts/sdd.mjs` (`templates/full/20-plan/handoff.md:20-23`, same lines in `templates/lite/`), which the shipped copies must not keep. Command and shipped files: C002-IF-007 (`template show`, `template list`), C002-IF-003 §1.
- **Requirements:** C002-REQ-115, C002-REQ-512, C002-REQ-513, C002-REQ-514, C002-REQ-518, C002-REQ-519, C002-REQ-520
- **Traces to:** ideation §8 (One source, generated targets); C002-DEC-007

### C002-US-505 — Serena read-only and outside the repository on every target
- **As a** P-03 adopter on OpenCode or Copilot VS Code
- **I want** Serena to start read-only, with its data in a per-user folder of `architect-sdd`
- **So that** code intelligence works on my host as on Claude Code and leaves no Serena files in my repository
- **Value / outcome:** C002-GOAL-03, C002-GOAL-04
- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-05
- **Context & notes:** On Claude Code Serena starts through `sdd serena-launch "${CLAUDE_PLUGIN_DATA}"` with the plugin's read-only mode file (C001-REQ-1006, C001-REQ-1013; current-state E-10, E-22); the generated targets cannot rely on either plugin variable (C002-R-001 A-09; C002-IF-001 §2). Serena's context per host is fixed by spikes S-07 and S-08 (baseline survey §4 note 6). Options `--user-data` and `--read-only`: C002-IF-007.
- **Requirements:** C002-REQ-114, C002-REQ-116, C002-REQ-512, C002-REQ-515, C002-REQ-516, C002-REQ-517
- **Traces to:** ideation §8 (One source, generated targets); C002-DEC-007
