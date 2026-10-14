---
id: C002-CAP-01
artifact: spec/requirements
change: CHG-002
phase: 10-spec
status: draft
capability: "Target generation"
---
# C002-CAP-01 — Requirements

Brownfield change: every requirement carries a Delta. No CHG-001 requirement owns `npm run package`,
`dist/` or generation (current-state §2 item 1), so this capability is `ADDED` throughout. Terms and
system names: `../../40-domain/glossary-delta.md`. Acceptance criteria are written in `acceptance.md`.

### C002-REQ-101 — Packaging writes the generated target packages
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN `npm run package` runs in the repository, THE generator SHALL write the OpenCode target package under `dist/opencode/` and the Copilot target package under `dist/copilot/`, both from the source plugin.
- **Rationale:** C002-DEC-006; ideation §8 (One source, generated targets); current-state E-1 (today `npm run package` stages the Claude Code plugin only, which stays as it is, C002-GOAL-05)
- **Stories:** C002-US-101
- **Priority:** Must
- **Acceptance:** C002-AC-101.1
- **Open items:** whether a target refused by C002-REQ-620 is still written is settled in the plan.

### C002-REQ-102 — Generation leaves the source plugin untouched
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE generator SHALL NOT create, modify or delete any file under `plugins/architect/`.
- **Rationale:** C002-CON-01, C002-CON-02; PLG-LAYOUT-001 counts the agent files and `build.mjs` empties `plugins/architect/scripts/` (current-state E-2, E-13); C002-GOAL-05
- **Stories:** C002-US-101
- **Priority:** Must
- **Acceptance:** C002-AC-102.1

### C002-REQ-103 — Translation through one mapping table per target
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the generator writes a target package, THE generator SHALL replace each Claude Code construct of the source plugin with the entry for that construct in the target's mapping table.
- **Rationale:** C002-DEC-006 (Consequences); the constructs to translate and their locations: baseline survey §1 and §4 note 4 (agents, commands and `sdd-conventions` carry constructs outside the wiring sections); MCP tool names become `x_y` on OpenCode and `x/y` on Copilot (ideation §8); Copilot has no `$ARGUMENTS` (C002-R-001 A-10)
- **Stories:** C002-US-102
- **Priority:** Must
- **Acceptance:** C002-AC-103.1
- **Open items:** the mapping of `effort` and `color` (OpenCode passes unknown agent options to the provider, C002-R-001 C-08; Copilot agents have no such field, A-11) is fixed with the mapping tables in the architecture step.

### C002-REQ-104 — Unmapped construct stops generation
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF the source plugin contains a Claude Code construct that has no entry in a target's mapping table, THEN THE generator SHALL exit non-zero with a message naming the file, the line, the construct and the target.
- **Rationale:** C002-US-102 (no Claude-only construct leaks unnoticed); C001-NFR-601 (actionable messages)
- **Stories:** C002-US-102
- **Priority:** Must
- **Acceptance:** C002-AC-104.1

### C002-REQ-105 — Same Claude model tier on every target
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the generator writes an agent for a generated target, THE generator SHALL set the agent's model to the host's Claude model of the tier named in the source agent's `model` field (`opus`, `sonnet` or `haiku`).
- **Rationale:** Q-models-01 (spec round 1, `../../questions-log.md`): "Same Claude tiers"; tiers per agent in C001-IF-09
- **Stories:** C002-US-102
- **Priority:** Must
- **Acceptance:** C002-AC-105.1
- **Open items:** the host model identifier of each tier is an entry of the mapping table, confirmed by spikes S-07 and S-08.

### C002-REQ-106 — No agent memory on the generated targets
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the generator writes an agent for a generated target, THE generator SHALL omit the source agent's `memory` field.
- **Rationale:** C002-DEC-009; C002-NG-04
- **Stories:** C002-US-102
- **Priority:** Must
- **Acceptance:** C002-AC-106.1

### C002-REQ-107 — Only the conductor starts other agents
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the generator writes the agents of a target package, THE generator SHALL grant the right to start other agents to the conductor alone, limited to the nine specialists.
- **Rationale:** C001-REQ-217 and C001-REQ-218 carried to the targets: OpenCode `permission.task` (C002-R-001 C-08), Copilot `agents` list (C002-R-001 A-11)
- **Stories:** C002-US-102
- **Priority:** Must
- **Acceptance:** C002-AC-107.1

### C002-REQ-108 — Least-privilege tool grants
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the generator writes an agent for a generated target, THE generator SHALL grant that agent only the tools that the target's mapping table derives from the source agent's `tools` field.
- **Rationale:** C001-NFR-204 carried to the targets; an agent without AskUserQuestion gets no question tool, so specialists keep returning questions (C001-REQ-208); the write and shell tools map per enforcement mode (C002-REQ-206, C002-REQ-209, C002-REQ-306)
- **Stories:** C002-US-102
- **Priority:** Must
- **Acceptance:** C002-AC-108.1

### C002-REQ-109 — Preloaded skills inlined into the agent body
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the generator writes an agent for a generated target, THE generator SHALL include in the agent body the body of every skill listed in the source agent's `skills` field.
- **Rationale:** C002-DEC-002 (C002-OA-002); both hosts load skills on demand only (C002-R-001 C-07, A-08)
- **Stories:** C002-US-103
- **Priority:** Must
- **Acceptance:** C002-AC-109.1

### C002-REQ-110 — Inlining budget enforced on generated agents
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF the skills inlined into a generated agent body exceed the budget of C002-NFR-104, THEN THE target structure check SHALL report an error naming the target, the agent, its inlined size and the budget.
- **Rationale:** C002-DEC-002 (an agent over the budget fails the structure check; the conductor is estimated at 46,000–51,000 characters); constitution NFR defaults (skill size)
- **Stories:** C002-US-103, C002-US-601
- **Priority:** Must
- **Acceptance:** C002-AC-110.1
- **Open items:** the hybrid delivery of C002-OA-002 is the fallback for an agent that fails this check (C002-DEC-002); it gets its own requirement if the plan applies it.

### C002-REQ-111 — Wiring variant per target
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the generator writes a skill or an inlined skill for a generated target, THE generator SHALL replace each "Claude Code wiring" section and the CLI invocation line of `sdd-conventions` with that target's variant kept in the source plugin.
- **Rationale:** ideation §8 (Skills); four wiring sections and the `sdd-conventions` line (baseline survey §1.2, E-6, E-7); the variants name each host's question tool and, under sdd MCP server enforcement, the server's tools (C002-US-104)
- **Stories:** C002-US-104
- **Priority:** Must
- **Acceptance:** C002-AC-111.1

### C002-REQ-112 — Missing wiring variant stops generation
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF a skill of the source plugin has a "Claude Code wiring" section or the CLI invocation line without a variant for a generated target, THEN THE generator SHALL exit non-zero with a message naming the skill and the target.
- **Rationale:** C002-US-104; same reason as C002-REQ-104
- **Stories:** C002-US-104
- **Priority:** Must
- **Acceptance:** C002-AC-112.1

### C002-REQ-113 — Variants kept out of the Claude Code skill bodies
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE source plugin SHALL keep the wiring variants of the generated targets outside the `SKILL.md` bodies that Claude Code agents preload.
- **Rationale:** C002-GOAL-05: Claude Code agents keep today's skill text and their preloaded size under C001-NFR-105
- **Stories:** C002-US-104, C002-US-607
- **Priority:** Must
- **Acceptance:** C002-AC-113.1
