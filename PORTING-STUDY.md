# Porting Architect to GitHub Copilot and OpenCode — feasibility study

Date: 2026-10-13. Scope: what it takes to run the Architect suite (CHG-001, as built through M-6
T-062) on **GitHub Copilot** (VS Code agent mode, Copilot CLI, Copilot cloud agent) and on **OpenCode**.
Method: official documentation read on 2026-10-13 (sources at the end); nothing was run on either
platform yet, so every claim marked **[VERIFY]** needs a spike before design depends on it.

## 1. Summary

| | OpenCode | Copilot in VS Code | Copilot CLI | Copilot cloud agent |
|---|---|---|---|---|
| Overall fit | **good** | **good, with one safety gap** | partial | **poor** (not interactive) |
| Agents + subagents with restricted delegation | native (`mode`, `permission.task`) | native (`.agent.md`, `agents:` list) | native (`.agent.md`) | — |
| Structured interview questions | `question` tool (header, question, options, custom answer, several questions) | `vscode/askQuestions` (batches of up to 4) **[VERIFY]** | **[VERIFY]** | none (runs unattended) |
| Skills (SKILL.md) | native; reads `.claude/skills/` too | native; reads `.claude/skills/` too | native | native |
| Slash commands | `.opencode/commands/*.md` with `agent:` | `.github/prompts/*.prompt.md` with `agent:` | via plugin `commands/` | — |
| Write/shell boundary for Architect agents | **native per-agent permissions** (`edit` path patterns, `bash` patterns) | hooks without agent identity; **agent-scoped hooks** (Preview) **[VERIFY]** | hooks without agent identity on tool events | hooks without agent identity |
| Loads the Claude plugin as is | no | partly (Claude-format plugins: hooks and MCP documented; agents/commands/skills not documented) | marketplace yes, components **[VERIFY]** | — |

Recommendation: **one canonical source, generated targets.** Keep `plugins/architect/` as the single
source and add a build step that generates an OpenCode package and a Copilot package from it. Port
**OpenCode first**: it has native per-agent permissions that enforce the guards without hooks, a
question tool that matches the interview protocol, and it reads skills from `.claude/skills/`. Then
**Copilot in VS Code**, after a spike on agent-scoped hooks. Don't target the Copilot cloud agent:
Architect's gates need P-01's answers during the session.

## 2. What Architect consists of, and how portable each part is

| Part | Where | Portability |
|---|---|---|
| `sdd` CLI (lint, trace, hashes, gates, status, archive, guards) | `scripts/sdd.mjs`, Node ≥ 20 | **fully portable**: plain Node, no Claude dependency; only its *invocation path* (`${CLAUDE_PLUGIN_ROOT}`) is Claude-specific |
| `.sdd/` workspace, templates, IDs, approvals | Markdown/JSON | **fully portable** |
| 18 skills | `skills/*/SKILL.md` | **portable** (Agent Skills format read by both); the "Claude Code wiring" sections name Claude tools and need per-target variants |
| 10 agents | `agents/*.md` | **needs translation**: frontmatter (tools, model, effort, skills, memory) is Claude-specific; bodies mention Claude tool names |
| 13 commands | `commands/*.md` | **needs translation**: `$ARGUMENTS`, `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}` |
| 5 hooks | `hooks/hooks.json` | **needs redesign**: they rely on `agent_type` in hook input, which neither target provides for tool events |
| MCP servers (Context7, DeepWiki, Serena read-only) | `.mcp.json` | **portable servers, different config syntax and tool names** |
| Eval harness | `evals/` (Claude Agent SDK) | **not portable**; each target needs its own way to run scripted sessions |

## 3. Component mapping

### 3.1 Agents

| Claude Code (today) | OpenCode | Copilot (VS Code / CLI) |
|---|---|---|
| `agents/sdd-*.md` | `.opencode/agents/sdd-*.md` | `.github/agents/sdd-*.agent.md` (plugin: `agents/*.agent.md`) |
| `name`, `description` | file name, `description` (required) | `name`, `description` |
| main session: `claude --agent architect:sdd-conductor` | `mode: primary` (selectable in the TUI) | user-invocable agent picked in the agents dropdown |
| specialists as subagents | `mode: subagent`, `hidden: true` | `user-invocable: false` (still callable as subagent) |
| `tools: Agent(architect:sdd-…)` (only the nine) | `permission.task: { "*": "deny", "sdd-*": "allow" }` | `agents: [sdd-researcher, …]` + `agent` tool in `tools` |
| specialists never delegate (REQ-218) | `permission.task: { "*": "deny" }` | `agents: []` |
| `model: opus/sonnet/haiku` | `model: anthropic/claude-…` (any provider) | `model:` display names, list tried in order |
| `effort: xhigh` | passed through as a provider option (`reasoningEffort`) **[VERIFY]** | no equivalent |
| `skills:` preloaded | no preload; on-demand `skill` tool | no preload; on-demand |
| `memory: project` (A1, A2) | none | none |
| `color` | `color` | — |

**Preloading skills** is the main behavioural difference. Architect relies on agents having their
procedure skills in context from the start. Options: (a) the generator inlines the preloaded skills
into each agent's body (simple, deterministic; watch the size budgets of NFR-105); (b) the agent body
says "load skill X before anything else" (cheaper per call, but relies on the model obeying). Prefer
(a) for the phase procedures and protocols, (b) for the large reference skills.

### 3.2 Interview and gates (AskUserQuestion)

Architect's interviews and gates use one AskUserQuestion call with up to four questions, 2–3 options
each, the recommended option first, and a free-text "Other".

- **OpenCode `question` tool:** each question has a header, the question text and options; the user
  picks one or types a custom answer; several questions can be answered before submitting. This
  matches the interview protocol. **[VERIFY]** multi-select and the maximum number of questions.
- **VS Code `vscode/askQuestions`:** usable from custom agents and prompt files; community material
  says batches of up to 4 questions. **[VERIFY]** the parameter schema and free-text answers.
- **Copilot CLI:** **[VERIFY]** whether an equivalent structured-question tool exists.
- **Copilot cloud agent:** runs unattended, so it cannot hold a gate. It is out of scope.

The gate rule (only P-01 approves, words recorded verbatim) is enforced by the CLI plus the agent's
instructions. It ports unchanged as long as the question tool returns P-01's answer verbatim.

### 3.3 Skills

Both targets implement the Agent Skills format (`SKILL.md` with `name` and `description`) and both
read `.claude/skills/` and `.agents/skills/`. The skill bodies port as they are. The "Claude Code
wiring" sections (tool names such as `AskUserQuestion`, `mcp__plugin_architect_…`) need per-target
variants, generated from a small table of tool-name substitutions. PLG-PORT-001 already confines these
names to those sections, which makes the substitution mechanical.

### 3.4 Commands

| Claude Code | OpenCode | Copilot (VS Code) |
|---|---|---|
| `commands/gate.md` → `/architect:gate` | `.opencode/commands/architect-gate.md` → `/architect-gate` | `.github/prompts/architect-gate.prompt.md` → `/architect-gate` |
| runs in the conductor session (the body checks) | `agent: sdd-conductor` in frontmatter | `agent: sdd-conductor` in frontmatter |
| `$ARGUMENTS` | `$ARGUMENTS`, `$1…` | text typed after the command, or `${input:name}` |
| `${CLAUDE_PLUGIN_ROOT}` | none | expanded for Claude-format plugins in hooks and MCP; **[VERIFY]** in prompt bodies |

Bonus on both targets: a command can name the agent that runs it, so the "start the conductor first"
check in every command body becomes unnecessary.

### 3.5 The CLI path

Agents and commands call `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"`. Neither target guarantees
that variable in agent or command bodies. Recommended: **publish the CLI as an npm package**
(`architect-sdd`, `bin: sdd`) so every target calls `sdd …` (or `npx architect-sdd …`), and keep the
Claude plugin's bundled copy for zero-install use. This also simplifies the shell allowlist (`sdd *`).

### 3.6 Safety: path and shell guards

Today the guards are PreToolUse hooks that read `agent_type` (spike S-04) and restrict only
`architect:sdd-*` callers.

**OpenCode — native and declarative.** Per-agent `permission` blocks replace both guards, enforced by
OpenCode itself:

```yaml
# .opencode/agents/sdd-spec-writer.md (frontmatter)
permission:
  edit: { "*": "deny", ".sdd/**": "allow" }
  bash: { "*": "deny", "sdd *": "allow", "git log *": "allow", "git diff *": "allow" }
  webfetch: deny
  task: { "*": "deny" }
```

**[VERIFY]**:
- whether `**` matches across folders and how paths resolve (relative to the project);
- how compound commands (`a && b`, pipes, `$(…)`) are matched against the bash patterns. If OpenCode
  does not split them, add a plugin (`tool.execute.before`, which can throw to block) that runs
  `sdd guard-bash` on the command;
- whether symlink and traversal tricks are normalised (the path guard's 256-case corpus can be
  replayed against OpenCode's matcher).

**Copilot — the identity gap.** Hook input for tool events has no agent identity in VS Code
(`tool_name`, `tool_input`, `tool_use_id` only) or in Copilot CLI. Only subagent start/stop events
carry `agent_type`. Global hooks therefore cannot tell Architect agents from the user's own session.
Options:
1. **Agent-scoped hooks** (VS Code, Preview): a `hooks` map in each `.agent.md` runs only while that
   agent is active, so identity comes from scoping. **[VERIFY]** that they fire for the agent's tool
   calls when it runs as a subagent (undocumented), and that a deny (`permissionDecision: "deny"` or
   exit 2) blocks the call.
2. **Tool restriction instead of path restriction:** give specialists no terminal and no generic edit
   tool, and expose writing through a small local MCP server (`sdd-mcp`: `write_artifact(path,
   content)` that refuses paths outside `.sdd/`, plus `lint`, `trace`, `status`, `gate_approve`).
   Enforcement then lives in the server, needing no identity. More work, but robust on every target,
   Claude Code included.
3. Accept instructions-only safety on Copilot (not recommended: it loses NFR-201's evidence).

Note: VS Code loads Claude-format hooks but **ignores matchers**, and its tool names and
`tool_input` fields differ from Claude Code's, so today's guards would see unknown tools and no
identity and **allow everything**. Installing the current Claude plugin in VS Code is therefore not
safe as is.

### 3.7 Other hooks

| Hook | OpenCode | Copilot (VS Code) |
|---|---|---|
| Session-start brief | plugin on `session.created`; **[VERIFY]** how to inject context | `SessionStart` hook (stdout/`additionalContext`) |
| Post-write quick lint | plugin `tool.execute.after`; **[VERIFY]** feedback channel to the model | `PostToolUse` with `additionalContext` |
| SubagentStop trace | plugin on `session.idle` or a message event | `SubagentStop` (has `agent_type`) |

### 3.8 MCP servers

| | Claude Code | OpenCode | Copilot (VS Code) |
|---|---|---|---|
| Config | plugin `.mcp.json` (`mcpServers`) | `opencode.json` → `mcp` (`type: local` with `command: [...]`, or `type: remote` with `url`) | plugin `.mcp.json` (Claude format, `${CLAUDE_PLUGIN_ROOT}` expanded) or `.vscode/mcp.json` (`servers`) |
| Tool name | `mcp__plugin_architect_serena__find_symbol` | `serena_find_symbol` | `serena/find_symbol` |
| Per-agent grant | `tools:` list | `permission: { "serena_*": "deny", "serena_find_symbol": "allow" }` | `tools: [serena/find_symbol, …]` |

The servers themselves (Context7, DeepWiki over HTTP; Serena over stdio with the read-only mode and
`--project .`) are unchanged. Serena's data folder (`SERENA_HOME`, D-010) needs a per-target data
location instead of `${CLAUDE_PLUGIN_DATA}`.

## 4. Proposed architecture: one source, three outputs

```text
plugins/architect/           canonical source (Claude Code format, as today)
scripts/port/
  model.mjs                  reads agents, commands, skills, hooks, MCP into one neutral model
  targets/claude.mjs         = today's plugin (identity transform)
  targets/opencode.mjs       → dist/opencode/.opencode/{agents,commands,skills,plugins}, opencode.json
  targets/copilot.mjs        → dist/copilot/ (Copilot plugin: agents/*.agent.md, skills, commands, hooks.json, .mcp.json)
  tool-names.json            Claude tool → OpenCode / Copilot tool name table
  models.json                opus/sonnet/haiku → per-target model ids
```

Generation rules:
- agents: frontmatter rewritten per target (tools → permissions or tool lists; models mapped;
  `skills:` inlined or turned into a load instruction; `effort` and `memory` dropped or mapped);
- bodies and skills: Claude tool names and `${CLAUDE_PLUGIN_*}` variables substituted from the tables;
- the structure checks (PLG-*) run on every target output, plus target-specific checks
  (e.g. "every OpenCode specialist has `edit` denied outside `.sdd/**`").

## 5. Effort and order

| Step | Content | Size |
|---|---|---|
| S-07 spike OpenCode | permission globs and bash compounds; question tool limits; skill loading by name; primary/subagent flow; replay of the guard corpora against its matcher | S |
| S-08 spike VS Code Copilot | agent-scoped PreToolUse in subagents; `askQuestions` schema; tool names and `tool_input` of edit/terminal tools; Claude-format plugin loading of agents/commands/skills | S–M |
| CLI on npm | package `architect-sdd` with `bin: sdd`; agents call `sdd` | S |
| Port generator + OpenCode target | model, tables, OpenCode output, PLG checks per target | M |
| Copilot target | output + agent-scoped guard hooks (or the `sdd-mcp` write server) | M–L |
| Evals per target | scripted sessions (OpenCode has a server/SDK; Copilot CLI can run headless) **[VERIFY]**; at least the gate, interview and injection suites | M per target |
| Docs | per-target README sections, troubleshooting | S |

Rough total: about one milestone of work for OpenCode, plus one for Copilot, after the two spikes.

## 6. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Copilot hooks never get agent identity | guards unenforceable on Copilot | agent-scoped hooks, or the `sdd-mcp` write server |
| No skill preloading | specialists skip their procedures | inline the core skills at generation time; evals check the procedure is followed |
| Models differ (Copilot model catalogue, OpenCode providers) | quality and cost vary | model table per target; milestone evals per target |
| Question tools differ (limits, free text) | interview protocol breaks | adapt interview-protocol per target; S-07/S-08 verify limits |
| Platforms move fast (VS Code hooks and plugins are Preview) | rework | pin versions in the doctor; re-run spikes before each release |
| Three targets to test | eval cost ×3 | dev tier on every target, milestone tier on Claude Code plus the first port only |

## 7. How this would enter the SDD process

This is a new change: **CHG-002 "Multi-platform targets"**. It would start at ideation (`/architect:new`,
`/architect:ideate`), with S-07/S-08 as its first plan tasks, after CHG-001's release (M-7). Defects
D-009 and D-010 (CHG-001) are independent and should land first. D-010's fix (launching Serena through
the CLI) also helps the ports, since it removes the dependency on `${CLAUDE_PLUGIN_DATA}`.

## Sources (read 2026-10-13)

- VS Code — [Custom agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents), [Agent Skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills), [Prompt files](https://code.visualstudio.com/docs/copilot/customization/prompt-files), [Hooks](https://code.visualstudio.com/docs/copilot/customization/hooks), [Hooks reference](https://code.visualstudio.com/docs/agents/reference/hooks-reference), [Agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)
- GitHub Copilot — [CLI hooks reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-hooks-reference), [About CLI plugins](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-cli-plugins), [Plugin marketplaces](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-marketplace), [Finding and installing plugins](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing)
- OpenCode — [Agents](https://opencode.ai/docs/agents/), [Permissions](https://opencode.ai/docs/permissions/), [Tools](https://opencode.ai/docs/tools/), [Commands](https://opencode.ai/docs/commands/), [Skills](https://opencode.ai/docs/skills/), [Plugins](https://opencode.ai/docs/plugins/)
- Secondary (claims cross-checked against the official pages where possible) — [Visual Studio Magazine on VS Code reading Claude Code configuration](https://visualstudiomagazine.com/articles/2026/05/04/special-embrace-vs-code-adapts-to-claude-codes-ecosystem.aspx), [Agent Plugins 1.0 overview](https://blakecrosley.com/zh-Hans/blog/agent-plugins-standard)
