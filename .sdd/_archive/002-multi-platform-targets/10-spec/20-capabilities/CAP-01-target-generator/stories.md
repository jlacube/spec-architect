---
id: C002-CAP-01
artifact: spec/stories
change: CHG-002
phase: 10-spec
status: draft
capability: "Target generation"
id_block: { US: 101-199, REQ: 101-199, TS: 101-199 }
---
# C002-CAP-01 — Target generation: user stories

### C002-US-101 — One build emits every target package
- **As a** P-01 spec owner and maintainer
- **I want** `npm run package` to write the OpenCode and the Copilot VS Code target packages from the source plugin, next to the Claude Code plugin it stages today
- **So that** a change to the source plugin reaches every target in one step, without a hand-maintained copy
- **Value / outcome:** C002-GOAL-01; C002-SC-04
- **Priority:** Must · **Size hint:** L · **Capability:** C002-CAP-01
- **Context & notes:** Packages go to `dist/opencode/` and `dist/copilot/` (ideation §8) and never into `plugins/architect/agents/` or `plugins/architect/scripts/` (C002-CON-02: PLG-LAYOUT-001 counts the agent files, `build.mjs` deletes everything but `sdd.mjs`; current-state E-2, E-13). No CHG-001 requirement owns `npm run package` or `dist/` (current-state §2 item 1), so the packaging requirements are `ADDED`. The generator reads the source plugin into a neutral model first, then writes each target package from it. Whether a written package is released is decided by the release check (C002-US-606).
- **Requirements:** C002-REQ-101, C002-REQ-102
- **Traces to:** ideation §5, §8; C002-DEC-006; Q-source-01

### C002-US-102 — Claude constructs translated by mapping tables
- **As a** P-01 spec owner and maintainer
- **I want** the generator to translate tool names, MCP tool names, model names, variables and the `architect:` namespace through one mapping table per target, and to refuse a construct that has no mapping
- **So that** I keep writing the Claude Code plugin and every generated target follows without edits to the source bodies, and no Claude-only construct leaks into a target package unnoticed
- **Value / outcome:** C002-GOAL-01, C002-GOAL-04
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-01
- **Context & notes:** What must be translated is counted in the baseline survey §1 (agent `tools`, 15 `mcp__plugin_architect_*` names, `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}`, `$ARGUMENTS`, the `claude --agent` guard line of 13 commands); PLG-PORT-001 does not confine all of them (baseline survey §4 note 4), so agents, commands and one skill line are in the table's reach. MCP names become `x_y` on OpenCode and `x/y` on Copilot (ideation §8). Agent `tools` lists become per-target tool and permission entries; only the conductor may start other agents, as on Claude Code (C001-IF-09). `memory:` is dropped on both generated targets (C002-DEC-009, C002-NG-04). Model names per target: the host's Claude model of the source agent's tier (Q-models-01, spec round 1). VS Code has no `$ARGUMENTS`; command bodies there refer to the text typed after the command (C002-R-001 A-10).
- **Requirements:** C002-REQ-103, C002-REQ-104, C002-REQ-105, C002-REQ-106, C002-REQ-107, C002-REQ-108, C002-REQ-602
- **Traces to:** ideation §8; C002-DEC-006, C002-DEC-009; baseline survey §1, §4

### C002-US-103 — Procedure skills in context on every target
- **As a** P-01 spec owner
- **I want** each generated agent body to contain the skills its source agent preloads, within the constitution's skill budgets, and a build that fails for an agent whose generated body exceeds the budget
- **So that** specialists follow the same procedures on hosts that load skills only on demand
- **Value / outcome:** C002-GOAL-03
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-01
- **Context & notes:** Inline at generation (C002-DEC-002, C002-OA-002). Budgets: constitution NFR defaults, skill size (24,000 characters per skill body, 64,000 per agent). The conductor is estimated at 46,000–51,000 characters; the hybrid option of C002-OA-002 (inline procedures, load catalogues on demand) is the fallback for an agent that exceeds the budget. The size check runs on the generated bodies (C002-US-601).
- **Requirements:** C002-REQ-109, C002-REQ-110
- **Traces to:** C002-DEC-002; Q-skills-01

### C002-US-104 — Per-target wiring variants
- **As a** P-01 spec owner and maintainer
- **I want** to keep a per-target variant of each "Claude Code wiring" section and of each CLI invocation line of the agents, commands and skills in the source plugin, and the generator to put the target's variant into each target package
- **So that** agents on each target are told the tools and the CLI spelling that exist on that host
- **Value / outcome:** C002-GOAL-03, C002-GOAL-04
- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-01
- **Context & notes:** Four skills have a wiring section (`interview-protocol`, `research-protocol`, `code-discovery`, `gate-protocol`); `sdd-conventions` defines `sdd` with `${CLAUDE_PLUGIN_ROOT}` outside a wiring section (baseline survey §1.2, E-6, E-7), and so do `agents/sdd-conductor.md:19` and `agents/sdd-auditor.md:13`. The doctor command's host rows are variants of the same kind (C002-IF-006). The variants name the question tool of each host (C002-US-204, C002-US-304) and, on Copilot VS Code, the sdd MCP server tools instead of Bash (C002-US-302); AskUserQuestion named in agent and command bodies (`commands/archive.md:15`) becomes the host's question tool too. The Claude Code variant is today's text, so the Claude Code plugin does not change (C002-GOAL-05).
- **Requirements:** C002-REQ-111, C002-REQ-112, C002-REQ-113, C002-REQ-118
- **Traces to:** ideation §8 (Skills); C002-DEC-002
