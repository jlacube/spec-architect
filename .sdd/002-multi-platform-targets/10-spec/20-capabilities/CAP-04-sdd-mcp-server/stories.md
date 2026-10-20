---
id: C002-CAP-04
artifact: spec/stories
change: CHG-002
phase: 10-spec
status: draft
capability: "sdd MCP server"
id_block: { US: 401-499, REQ: 401-499, TS: 401-499 }
---
# C002-CAP-04 — sdd MCP server: user stories

### C002-US-401 — Guarded `.sdd/` writes through the server
- **As a** P-01 spec owner
- **I want** an MCP server whose write and edit tools refuse any target path outside `.sdd/`, decided by the path guard core, and refuse on any internal error
- **So that** a host that cannot identify the calling agent in its hooks still enforces the write boundary, failing closed
- **Value / outcome:** C002-GOAL-02; C002-SC-03
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-04
- **Context & notes:** C002-DEC-001. The server needs no agent identity: only Architect agents are granted its tools, and whatever calls them can write only inside `.sdd/`. The path guard core (current-state §1, path guard row) stays unchanged (C002-GOAL-05); it is called with the server's own input, and no memory folder is allowed (C002-DEC-009). Tools cover the write operations the agents perform today with Write and Edit (create or replace a file, replace a text span), so that agents without generic Edit work as before (ideation §9). The path corpus is replayed through the server (C002-US-602). A refused or failed call returns an error result as text only, which an MCP client that checks structured content against the advertised output schema accepts (glossary "Error result"; Q-mcp-errors-01, defect D-017).
- **Requirements:** C002-REQ-401, C002-REQ-402, C002-REQ-403, C002-REQ-404, C002-REQ-415
- **Traces to:** C002-DEC-001; Q-guards-01; Q-mcp-errors-01; ideation §8 (The `sdd` MCP server)

### C002-US-402 — Allowlisted commands through the server
- **As a** P-01 spec owner
- **I want** an MCP tool that runs a shell command only when the bash guard core allows it, and returns the command's output and exit code
- **So that** agents without a terminal tool can still run `sdd lint`, `sdd trace`, `sdd id next`, git read verbs and the other allowlisted commands
- **Value / outcome:** C002-GOAL-02, C002-GOAL-04
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-04
- **Context & notes:** The allowlist is C001-IF-07 §3, including the change of C002-US-502 (bare `sdd`). The server's shell surface is that allowlist only, which is why it is also the fallback for OpenCode's shell risks (ideation §9). It runs the `sdd` CLI from `architect-sdd` (C002-GOAL-04). The shell corpus is replayed through the server (C002-US-602). The command tool is served apart from the write tools (server profiles `sdd-shell` and `sdd-files`), so that agents without Bash never receive it, even on a host that grants whole servers only (C002-IF-002 §2). A refused command, or one whose executable cannot start, returns an error result as text only (glossary "Error result"; Q-mcp-errors-01, defect D-017).
- **Requirements:** C002-REQ-405, C002-REQ-406, C002-REQ-407, C002-REQ-415
- **Traces to:** C002-DEC-001; Q-mcp-errors-01; ideation §8, §9

### C002-US-403 — Quick-lint findings with each write
- **As a** P-01 spec owner
- **I want** every write through the server to return the quick-lint findings for the written file together with the write result
- **So that** agents on Copilot VS Code, and on OpenCode under the fallback, get the same post-write feedback as the PostToolUse hook gives on Claude Code
- **Value / outcome:** C002-GOAL-03
- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-04
- **Context & notes:** Ideation §5 hook table: post-write quick lint on Copilot VS Code is "in (MCP server returns findings with the write result)". The lint core behind `sdd hook post-write` is reusable; only its Claude output envelope is host-specific (baseline survey §2, `post-write.ts`).
- **Requirements:** C002-REQ-408, C002-REQ-409
- **Traces to:** ideation §5 (Hooks per target); C002-DEC-001

### C002-US-404 — A per-session stdio process shipped with the CLI
- **As a** P-01 spec owner and maintainer
- **I want** the server to run as a stdio process that the host starts with a session and stops with it, shipped as its own bundled entry in `architect-sdd`
- **So that** it respects the constitution (no daemon, no network from the CLI, bundled dependencies under the license allowlist) and installs with the CLI
- **Value / outcome:** C002-GOAL-04
- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-04
- **Context & notes:** C002-CON-04; C002-DEC-001 (Constitution check). It is built next to the CLI in the npm package, not under `plugins/architect/scripts/`, which `build.mjs` keeps for `sdd.mjs` only (current-state E-2). The second bundled entry touches C001-CON-02 (one bundled file), reviewed with the architecture (`scope.md` §4).
- **Requirements:** C002-REQ-410, C002-REQ-411, C002-REQ-412, C002-REQ-413, C002-REQ-414
- **Traces to:** C002-DEC-001; ideation §8 (The `sdd` MCP server)
