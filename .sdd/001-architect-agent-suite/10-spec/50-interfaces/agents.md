---
id: C001-IF-09
artifact: spec/interface
kind: agent definitions
change: CHG-001
phase: 10-spec
status: approved
---

# C001-IF-09 — Agent definitions

Normative frontmatter for the ten agents (C001-CON-10). Prompts (bodies) are authored in the
plan phase; this contract fixes identity, model routing (Q17), tool grants (least privilege,
C001-NFR-204) and preloaded skills. Plugin agents ignore `hooks`, `mcpServers`,
`permissionMode` and `initialPrompt` (C001-CON-03); those fields must be absent.

| # | name | model | effort | tools (exact set) | skills |
|---|---|---|---|---|---|
| A0 | `sdd-conductor` | opus | xhigh | `Agent(architect:sdd-researcher, architect:sdd-cartographer, architect:sdd-options-analyst, architect:sdd-spec-writer, architect:sdd-test-designer, architect:sdd-architect, architect:sdd-planner, architect:sdd-critic, architect:sdd-auditor)`, AskUserQuestion, Read, Glob, Grep, Write, Edit, Bash, TodoWrite, Skill | sdd-conventions, interview-protocol, options-analysis, gate-protocol, phase-ideation, phase-spec, phase-plan |
| A1 | `sdd-researcher` | sonnet | high | WebSearch, WebFetch, ToolSearch, `mcp__plugin_architect_context7__resolve-library-id`, `mcp__plugin_architect_context7__query-docs`, `mcp__plugin_architect_deepwiki__read_wiki_structure`, `mcp__plugin_architect_deepwiki__read_wiki_contents`, `mcp__plugin_architect_deepwiki__ask_wiki_question`, Read, Glob, Write | research-protocol, sdd-conventions |
| A2 | `sdd-cartographer` | sonnet | high | Bash, Read, Grep, Glob, LSP, Write, ToolSearch, `mcp__plugin_architect_serena__find_symbol`, `mcp__plugin_architect_serena__get_symbols_overview`, `mcp__plugin_architect_serena__find_referencing_symbols`, `mcp__plugin_architect_serena__find_declaration`, `mcp__plugin_architect_serena__find_implementations` | code-discovery, sdd-conventions |
| A3 | `sdd-options-analyst` | opus | high | Read, Grep, Glob, WebSearch, WebFetch, Write | options-analysis, sdd-conventions |
| A4 | `sdd-spec-writer` | opus | xhigh | Read, Grep, Glob, Write, Edit, Bash | sdd-conventions, ears-requirements, user-stories, nfr-catalogue, options-analysis |
| A5 | `sdd-test-designer` | opus | high | Read, Grep, Glob, Write, Edit, Bash | acceptance-scenarios, dod-catalogue, sdd-conventions |
| A6 | `sdd-architect` | opus | xhigh | Read, Grep, Glob, Write, Edit, Bash, ToolSearch, `mcp__plugin_architect_serena__find_symbol`, `mcp__plugin_architect_serena__get_symbols_overview`, `mcp__plugin_architect_serena__find_referencing_symbols`, `mcp__plugin_architect_serena__find_declaration`, `mcp__plugin_architect_serena__find_implementations` | diagramming, architecture-decisions, options-analysis, sdd-conventions |
| A7 | `sdd-planner` | opus | high | Read, Grep, Glob, Write, Edit, Bash | planning, sdd-conventions |
| A8 | `sdd-critic` | opus | xhigh | Read, Grep, Glob, Bash, Write | critique-rubrics, ears-requirements, sdd-conventions |
| A9 | `sdd-auditor` | haiku | low | Bash, Read, Write | sdd-conventions |

Notes:

- Names verified with Claude Code 2.1.295 (spikes S-05, S-06). Agents are spawned by plugin-qualified
  name (`architect:sdd-…`); a short name in `Agent(...)` admits no agent. Tools of the plugin's MCP
  servers are named `mcp__plugin_architect_<server>__<tool>`. They are deferred, so every agent with
  an MCP grant also has `ToolSearch`, which loads only tools the agent's `tools` field permits.
  PLG-TOOLS-001 compares the frontmatter against this table.
- A0 is started as the main session (`claude --agent architect:sdd-conductor`); it is not
  meant to be spawned as a subagent. Its description says so.
- A1–A9 never include `Agent` (C001-REQ-218).
- `memory: project` is set for A1 and A2 only (OA-13 / OQ-08).
- `color` is cosmetic: A0 purple, A1 cyan, A2 green, A3 yellow, A4 blue, A5 orange,
  A6 red, A7 pink, A8 red, A9 green.

## Descriptions (routing contract)

Each `description` names its phase(s), states when to use it and when not to, and avoids
trigger words owned by sibling agents (IDEA-§14.4). Ownership of trigger words:
"research/prior art/library docs" → A1; "codebase/callers/blast radius/hotspots/evidence" →
A2; "options/trade-off/decide" → A3; "user stories/requirements/EARS/NFR/domain" → A4;
"acceptance criteria/scenarios/test plan/definition of done" → A5;
"architecture/components/interfaces/ADR/diagram" → A6; "plan/tasks/milestones/rollout/hand-off"
→ A7; "review/critique/gaps/ambiguity" → A8; "lint/trace/status/registry" → A9.
