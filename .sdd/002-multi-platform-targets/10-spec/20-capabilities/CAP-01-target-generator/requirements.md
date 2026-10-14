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
- **Rationale:** C002-DEC-006; ideation §8 (One source, generated targets); current-state E-1 (today `npm run package` stages the Claude Code plugin only, which stays as it is, C002-GOAL-05); a target whose release the release check refuses is still generated, and the release check alone decides publication (architecture §6.2, C002-REQ-619); a spike S-08 record that gives `deferred` leads instead to the spec revision of `../../10-context/scope.md` §1.1, which removes the Copilot target (Q-defer-01)
- **Stories:** C002-US-101
- **Priority:** Must
- **Acceptance:** C002-AC-101.1

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
- **Rationale:** C001-NFR-204 carried to the targets; an agent without AskUserQuestion gets no question tool, so specialists keep returning questions (C001-REQ-208); the write and shell tools map per enforcement mode (C002-REQ-206, C002-REQ-209, C002-REQ-306), and under sdd MCP server enforcement by server profile (C002-REQ-117)
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
- **Statement:** IF the skills inlined into a generated agent body exceed a budget of C002-NFR-104, THEN THE target structure check SHALL report an error naming the target, the agent, the budget exceeded, the measured size and the skills concerned (the skill over the per-skill budget, or every inlined skill with its size when the per-agent total is over).
- **Rationale:** C002-DEC-002 (an agent over the budget fails the structure check; the conductor is estimated at 46,000–51,000 characters); constitution NFR defaults (skill size); the skill names tell the maintainer which body to shorten or to deliver by the hybrid fallback
- **Stories:** C002-US-103, C002-US-601
- **Priority:** Must
- **Acceptance:** C002-AC-110.1
- **Open items:** the hybrid delivery of C002-OA-002 is the fallback for an agent that fails this check (C002-DEC-002); it gets its own requirement if the plan applies it.

### C002-REQ-111 — Wiring variant per target
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the generator writes an agent, a command, a skill or an inlined skill for a generated target, THE generator SHALL replace each "Claude Code wiring" section, each CLI invocation line and each other wiring anchor of that file with that target's wiring variant kept in the source plugin.
- **Rationale:** ideation §8 (Skills); four wiring sections (baseline survey §1.2, E-6, E-7); CLI invocation lines in `skills/sdd-conventions/SKILL.md:13`, `agents/sdd-conductor.md:19` and `agents/sdd-auditor.md:13`; other wiring anchors are the host-dependent rows of `commands/doctor.md` and of the code-discovery toolchain section (C002-REQ-504, C002-REQ-507, C002-IF-006); anchors and processing order: C002-IF-001 §2, §3; the variants name each host's question tool and, under sdd MCP server enforcement, the server's tools (C002-US-104)
- **Stories:** C002-US-104
- **Priority:** Must
- **Acceptance:** C002-AC-111.1

### C002-REQ-112 — Missing wiring variant stops generation
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF an agent, a command or a skill of the source plugin has a wiring anchor (a "Claude Code wiring" section, a CLI invocation line, or another wiring anchor of C002-REQ-111 such as the host rows of the doctor command or the toolchain section of the code-discovery skill) without a variant for a generated target, THEN THE generator SHALL exit non-zero with a message naming the file, the line and the target.
- **Rationale:** C002-US-104; same reason as C002-REQ-104; without it a missing variant of the doctor host rows would leave Claude Code rows in the generated doctor without a build failure (C002-REQ-504, C002-REQ-507); every wiring anchor is a required anchor of the mapping tables (C002-IF-001 §3)
- **Stories:** C002-US-104
- **Priority:** Must
- **Acceptance:** C002-AC-112.1

### C002-REQ-113 — Variants kept out of the Claude Code skill bodies
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE source plugin SHALL keep the wiring variants of the generated targets outside the agent, command and `SKILL.md` files that Claude Code loads.
- **Rationale:** C002-GOAL-05: Claude Code agents and commands keep today's text, and preloaded skills their size under C001-NFR-105; the variants of agents and commands (C002-REQ-111) live with the others under `plugins/architect/targets/` (C002-IF-001 §1, C002-CON-10)
- **Stories:** C002-US-104, C002-US-607
- **Priority:** Must
- **Acceptance:** C002-AC-113.1

### C002-REQ-114 — Serena read-only with per-user data on the generated targets
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE target package SHALL declare Serena with a launch command that runs `sdd serena-launch` of `architect-sdd` with Serena's data in the per-user data folder and with the Serena read-only mode file shipped in `architect-sdd`.
- **Rationale:** C001-REQ-1006 and C001-REQ-1013 carried to the generated targets (Serena exposes only the read-only tools of C001-IF-14 §4 and writes nothing into the repository); the Claude Code launch passes `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` (current-state E-10), on which the generated targets cannot rely (C002-R-001 A-09; C002-IF-001 §2); CLI side: C002-REQ-512, C002-REQ-515; launch command: C002-IF-001 §6.2, C002-IF-005 §2, §3
- **Stories:** C002-US-505
- **Priority:** Must
- **Acceptance:** C002-AC-114.1
- **Open items:** Serena's context on each host is fixed by spikes S-07 and S-08 (C002-IF-001 §6.2).

### C002-REQ-115 — Templates named through the CLI
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the generator writes an agent or a command for a generated target, THE generator SHALL replace each template path under `${CLAUDE_PLUGIN_ROOT}/templates/` in its body with the command `sdd template show <profile>/<path>` for that template.
- **Rationale:** template paths in `agents/sdd-spec-writer.md:19`, `commands/decide.md:18` and `commands/init.md:25`; neither generated host expands `${CLAUDE_PLUGIN_ROOT}` in bodies (C002-R-001 A-09); construct `plugin-root-templates` of C002-IF-001 §2; the CLI side is C002-REQ-513
- **Stories:** C002-US-504
- **Priority:** Must
- **Acceptance:** C002-AC-115.1

### C002-REQ-116 — Plugin data folder replaced by the per-user data folder
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the generator writes a command for a generated target, THE generator SHALL replace each `${CLAUDE_PLUGIN_DATA}` argument of an sdd CLI command in its body with the option `--user-data`.
- **Rationale:** `commands/doctor.md:8` and `commands/init.md:9` run `sdd serena-config "${CLAUDE_PLUGIN_DATA}"` (current-state E-22); variable rule of C002-IF-001 §2; C002-IF-006 §4; the CLI side is C002-REQ-515
- **Stories:** C002-US-505
- **Priority:** Must
- **Acceptance:** C002-AC-116.1

### C002-REQ-117 — Server profiles granted by source tool
- **Delta:** ADDED
- **Pattern:** complex
- **Statement:** WHERE a generated target uses sdd MCP server enforcement, WHEN the generator writes an agent for that target, THE generator SHALL grant that agent exactly the server profiles that replace its source tools: `sdd-files` for Write or Edit and `sdd-shell` for Bash.
- **Rationale:** C002-REQ-108 with the two server profiles of the architecture (C002-IF-002 §2; architecture §6.2): Copilot documents only whole-server grants (`<server>/*`, C002-OA-001; C002-R-001 A-11), so the command tool is a server of its own and an agent without Bash (researcher, options-analyst) never receives it (C002-IF-005 §4); declarations: C002-REQ-210, C002-REQ-307; tools per profile: C002-REQ-415
- **Stories:** C002-US-203, C002-US-302
- **Priority:** Must
- **Acceptance:** C002-AC-117.1

### C002-REQ-118 — Host question tool named in agent and command bodies
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the generator writes an agent or a command for a generated target, THE generator SHALL replace each mention of AskUserQuestion in its body with the name of that target's question tool.
- **Rationale:** outside the wiring sections AskUserQuestion is named in `agents/sdd-conductor.md:61` and `:66` (current-state E-25) and in `commands/archive.md:15` (current-state E-28); the archive confirmation is a round of C002-REQ-211, and its unanswered case falls under C002-REQ-311; construct `ask-user-question` of C002-IF-001 §2; the agent `tools` field is translated by C002-REQ-108
- **Stories:** C002-US-104
- **Priority:** Must
- **Acceptance:** C002-AC-118.1
