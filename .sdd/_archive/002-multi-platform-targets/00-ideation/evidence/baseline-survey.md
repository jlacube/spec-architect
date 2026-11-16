---
id: C002-IDEA-BASELINE
artifact: ideation/baseline-survey
change: CHG-002
phase: 00-ideation
status: draft
---

# CHG-002 — Baseline survey: what a generator must translate

Taken 2026-10-14 at commit `74fe494` for ideation step 3. It complements, and does not repeat, the workspace
survey `.sdd/_constitution/baseline-survey.md` (languages, layout, test commands, capability map) and the
feasibility study `PORTING-STUDY.md` (§2 portability, §3 component mapping).

Layers used: Serena (symbols and references in `src/hooks/`), grep/glob and read-only git (counts and
file reads). ripwire is absent (`ripwire --version` exit 127), so every entry carries the disclosure
`ripwire failed: exit 127`. LSP and ast-grep were not needed. Counts are **lines that match**, not
occurrences, unless a column says otherwise; they come from `grep` count mode and are exact for lines.

## 1. Counts table: Claude-Code-specific constructs in `plugins/architect/`

### 1.1 Agents (10 files, `plugins/architect/agents/sdd-*.md`)

Every agent has the frontmatter fields `name`, `description`, `model`, `effort`, `color`, `tools`, `skills`
(7 fields x 10 agents). `memory: project` is set on 2 agents only.

| Agent | model | effort | color | memory | `tools` entries | of which `mcp__plugin_architect_*` | preloaded `skills` | Body or description lines with a Claude construct |
|---|---|---|---|---|---|---|---|---|
| sdd-conductor | opus | xhigh | purple | - | 12 (`Agent(` with 9 targets, AskUserQuestion, TaskCreate, TaskUpdate, TaskList, Skill, 6 file/shell tools) | 0 | 7 | 5: `claude --agent architect:sdd-conductor` (l.3), `${CLAUDE_PLUGIN_ROOT}` (l.19), TaskCreate/TaskUpdate (l.34), AskUserQuestion (l.61, 66) |
| sdd-spec-writer | opus | xhigh | blue | - | 6 | 0 | 5 | 1: `${CLAUDE_PLUGIN_ROOT}` (l.19) |
| sdd-architect | opus | xhigh | red | - | 12 | 5 (Serena) | 4 | 1: ToolSearch (l.19) |
| sdd-critic | opus | xhigh | red | - | 5 | 0 | 3 | 0 |
| sdd-planner | opus | high | pink | - | 6 | 0 | 2 | 0 |
| sdd-test-designer | opus | high | orange | - | 6 | 0 | 3 | 0 |
| sdd-options-analyst | opus | high | yellow | - | 6 (WebSearch, WebFetch) | 0 | 2 | 1: `architect:` namespace |
| sdd-researcher | sonnet | high | cyan | project | 11 (WebSearch, WebFetch, ToolSearch) | 5 (Context7 x2, DeepWiki x3) | 2 | 1: `architect:` namespace |
| sdd-cartographer | sonnet | high | green | project | 12 (LSP, ToolSearch) | 5 (Serena) | 2 | 1: LSP in the layer-ladder prose (l.15) |
| sdd-auditor | haiku | low | green | - | 3 | 0 | 1 | 1: `${CLAUDE_PLUGIN_ROOT}` (l.13) |
| **Total** | 7 opus, 2 sonnet, 1 haiku | 4 xhigh, 5 high, 1 low | 8 distinct | 2 | 79 | 15 | 31 references to 18 skills | 11 |

Distinct Claude tool names granted across `tools`: Read, Grep, Glob, Write, Edit, Bash, WebSearch,
WebFetch, ToolSearch, LSP, Agent, AskUserQuestion, TaskCreate, TaskUpdate, TaskList, Skill, plus 10
distinct `mcp__plugin_architect_*` names (5 Serena, 2 Context7, 3 DeepWiki). `NotebookEdit` and
`PowerShell` appear only in `hooks.json` matchers and in `src/hooks/`, not in any agent `tools`.

### 1.2 Skills (18 `SKILL.md`)

| Construct | Files | Lines | Detail |
|---|---|---|---|
| `## Claude Code wiring` section | 4 | 4 headings | `interview-protocol:119`, `research-protocol:93`, `code-discovery:109`, `gate-protocol:87` (gate-protocol also refers to it in prose at l.29) |
| `mcp__plugin_architect_` names | 2 | 4 | `code-discovery` 1 line (5 Serena names), `research-protocol` 3 lines (Context7 and DeepWiki; two DeepWiki names are written without the prefix) |
| AskUserQuestion | 1 | 2 | `interview-protocol` (inside its wiring section); `gate-protocol` describes the same dialog without naming the tool |
| Backticked Claude tool names (`ToolSearch`, `LSP`, `WebSearch`, `WebFetch`, `AskUserQuestion`) | 3 | 5 | `interview-protocol` 2, `research-protocol` 2, `code-discovery` 1 |
| `${CLAUDE_PLUGIN_ROOT}` **outside** a wiring section | 1 | 1 | `sdd-conventions/SKILL.md:13` (defines `sdd`); PLG-PORT-001 does not look for this variable |
| Namespaced command or agent references (`/architect:...`, `architect:sdd-...`) | 6 | 16 | gate-protocol 5, phase-ideation 4, phase-spec 3, phase-plan 2, sdd-conventions 1, code-discovery 1 |
| Frontmatter fields | 18 | - | `name`, `description` only (the Agent Skills format both targets read); no Claude-only field found by the field grep |

### 1.3 Commands (13 files, `plugins/architect/commands/*.md`)

| Construct | Files | Lines | Detail |
|---|---|---|---|
| Frontmatter `description` and `argument-hint` | 13 | 26 | no `allowed-tools`, `model` or `agent` field is used |
| `$ARGUMENTS` | 10 | 11 | `lint.md` has 2; absent in `status`, `init`, `doctor` (empty `argument-hint`) |
| Guard line "runs in the `architect:sdd-conductor` main session ... start `claude --agent architect:sdd-conductor`" | 13 | 13 | line 6 in every command; PORTING-STUDY §3.4 notes a target `agent:` field makes it redundant |
| `${CLAUDE_PLUGIN_ROOT}` | 2 | 2 | `init.md:25`, `decide.md:18` (template paths) |
| `${CLAUDE_PLUGIN_DATA}` | 2 | 2 | `init.md:9`, `doctor.md:8` (`sdd serena-config "${CLAUDE_PLUGIN_DATA}"`) |
| AskUserQuestion | 1 | 1 | `archive.md:15` |
| Claude tool names in prose | 1 | 1 | `doctor.md:23` (`WebSearch/WebFetch` as Context7 fallback) |
| `architect:` namespace (incl. the guard line) | 13 | 23 | whole command set is addressed as `/architect:<name>` |

### 1.4 Hooks and MCP wiring

| File | Construct | Count |
|---|---|---|
| `hooks/hooks.json` | events: PreToolUse (2 entries), PostToolUse (1), SubagentStop (1), SessionStart (1) | 5 hook commands in 4 events |
| `hooks/hooks.json` | `${CLAUDE_PLUGIN_ROOT}` in every command | 5 |
| `hooks/hooks.json` | tool matchers: `Write\|Edit\|NotebookEdit`, `Bash\|PowerShell`, `Write\|Edit` | 3 |
| `hooks/hooks.json` | SubagentStop matcher on the agent name `^architect:sdd-(spec-writer\|architect\|planner\|test-designer)$` | 1 |
| `.mcp.json` | servers: `context7` (http), `deepwiki` (http), `serena` (stdio via `sdd serena-launch`) | 3 |
| `.mcp.json` | `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_PLUGIN_DATA}` | 2 / 2 (Serena args and `SERENA_HOME`) |
| `.mcp.json` | Serena `--context claude-code` | 1 |
| `serena/architect-read-only.yml` | `excluded_tools` (Serena-native names, no Claude prefix) | 19 names, target-neutral |
| `.claude-plugin/plugin.json` | name, version, description, license, author | 1 manifest (plus `.claude-plugin/marketplace.json` at the repository root) |
| `README.md` | `architect:` namespace lines / lines with `${CLAUDE_PLUGIN_*}` or `claude ` | 29 / 6 |

## 2. Affected areas: code that depends on Claude Code specifics

| Area | What is Claude-specific | Reuse for another target |
|---|---|---|
| `src/hooks/input.ts` | `HookInput` is Claude's hook JSON (`tool_name`, `tool_input`, `agent_type`, `cwd`); `isArchitectAgent` tests `agent_type` starts with `architect:sdd-` | the type is the natural neutral shape; an adapter per target can fill it |
| `src/hooks/guard-path.ts` | `WRITE_TOOLS` = Write, Edit, MultiEdit, NotebookEdit (l.18); reads `file_path` or `notebook_path`; allows `.sdd/` and `.claude/agent-memory/<agent_type with ':' replaced by '-'>` (l.56) | `decidePath` is a pure function of `HookInput`; the memory folder is Claude-only |
| `src/hooks/guard-bash.ts` | tool gate `Bash`/`PowerShell` (l.212, 217); `sddCli` accepts only `node <path>/sdd.mjs` or the literal `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs` (l.119-123); `claude --version` probe (l.133) | `decideBash` is pure; a bare `sdd` command (npm bin) is **not** accepted today |
| `src/hooks/post-write.ts` | reads `tool_input.file_path`; prints a Claude `hookSpecificOutput`/`additionalContext` JSON document (l.36) | lint core is portable; the output envelope is Claude's |
| `src/hooks/session-start.ts` | `sessionBrief(HookInput, cwd)`; output is stdout lines | portable core |
| `src/cli/commands.ts` | command functions `guardPath` (l.427), `guardBash` (l.435), `hookSessionStart` (l.456), `hookPostWrite` (l.462) parse stdin through `parseHookInput` and map to exit codes (0 allow, 2 deny) | the four entry points are where a per-target adapter flag would attach |
| `src/workspace/templates.ts:33` | `defaultPluginRoot()` reads `CLAUDE_PLUGIN_ROOT`, else the folder above the bundle | already falls back to a bundle-relative path; no change needed for a bundled CLI |
| `src/workspace/serena-config.ts`, `serena-launch.ts` | take the data folder as an argument; nothing Claude-named in the code | target-neutral; only the caller's value (`${CLAUDE_PLUGIN_DATA}`) differs |
| `scripts/package.mjs` | stages `.claude-plugin/marketplace.json` and `plugins/architect/`, runs `claude plugin validate`, writes a Claude-only `INSTALL.md`, zips (Windows `tar.exe`) | new targets need their own staging and install notes; reads the version from `plugin.json` |
| `scripts/build.mjs` | bundles `src/cli.ts` to `plugins/architect/scripts/sdd.mjs`; **deletes every other file** in that folder (l.15-17) | a generator must not write into `plugins/architect/scripts/` |
| `package.json` | `private: true`, no `bin`, name `architect-plugin` | an npm CLI package (PORTING-STUDY §3.5) needs a publishable manifest |

### 2.1 Structure checks (`scripts/check/*.mjs`, 14 checks registered in `run.mjs:19`)

| Check | Assumes Claude format? | What it pins |
|---|---|---|
| PLG-LAYOUT-001 `layout.mjs` | yes | `.claude-plugin/plugin.json`, `hooks/hooks.json`, `.mcp.json`; exactly 10 files matching `^sdd-.+\.md$` in `agents/` |
| PLG-TOOLS-001 `tools.mjs` | yes | agent `tools` frontmatter equals its row in the CHG-001 interface file `.sdd/001-architect-agent-suite/10-spec/50-interfaces/agents.md` (path hard-coded in `lib.mjs:15`) |
| PLG-MCP-001 `mcp.mjs` | yes | exactly the three servers, `--context claude-code`, `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` literals |
| PLG-HOOK-001 `hooks.mjs` | yes | every hook command starts with `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"` and has no shell operator |
| PLG-PORT-001 `port.mjs` | partly | scans `skills/` and `templates/` only for `AskUserQuestion\|Agent(\|TodoWrite\|mcp__` outside a wiring section; **agents and commands are not scanned**, and `${CLAUDE_PLUGIN_ROOT}` is not in its pattern |
| PLG-SIZE-001 `size.mjs` | yes (reads `skills` field) | 24,000 characters per skill body, 64,000 per agent over its preloaded skills |
| PLG-DUP-001 `dup.mjs` | yes | no 10-line overlap between a command body and an agent body |
| PLG-EVAL-001 `evals.mjs` | yes | `plugins/architect/evals/<case>/prompt.md` with `claude plugin eval` graders; the folder does not exist at this commit (finding is `pending` while its owner task is open) |
| PLG-PORT-002, PLG-PATH-001, PLG-README-001, PLG-RULES-001, PLG-MSG-001, PLG-CI-001 | no | source-tree or documentation rules, independent of the target |

## 3. Blast-radius preview

ripwire `--impact` is unavailable, so reach is from Serena references plus grep.

| Symbol | Direct callers | Transitive reach | Layer |
|---|---|---|---|
| `isArchitectAgent` (`src/hooks/input.ts:25`) | 2 production: `decideBash` (`guard-bash.ts:210`), `decidePath` (`guard-path.ts:47`) | `guardBash` and `guardPath` in `commands.ts`, then every guard test: 11 test files mention `agent_type` (`tests/guards/fixture.ts`, `bash-corpus.test.ts`, `unit/evals/harness.test.ts`, `cap11/TS-1103`, `1104`, `1105`, `1107`, `1108`, `hooks-feedback`, `cap09/TS-913`, and a fixture) | serena + grep |
| `decidePath` (`src/hooks/guard-path.ts:45`) | `guardPath` (`commands.ts:428`), `tests/guards/fixture.ts:135` | guard path corpus (256 cases) | serena |
| `decideBash` (`src/hooks/guard-bash.ts:208`) | `guardBash` (`commands.ts:436`), `tests/guards/bash-corpus.test.ts:46` | guard bash corpus (277 cases) | serena |
| `parseHookInput` (`src/hooks/input.ts:15`) | `guardPath`, `guardBash`, `hookSessionStart`, `hookPostWrite` in `commands.ts`; 2 test files | the four hook entry points | serena |
| `defaultPluginRoot` (`src/workspace/templates.ts:32`) | template resolution used by init and change creation | not traced (not changed by a generator) | grep |

Touched hotspots (size proxy from the workspace survey; churn not measured): `src/hooks/guard-bash.ts`
(216 lines, 5th largest source file) and `src/cli/commands.ts` (491 lines, the largest, hosts the hook
entry points). A generator that only reads `plugins/architect/` touches neither.

### 3.1 Modules a generator would touch or add

| Kind | Candidate | Why |
|---|---|---|
| Add | a generator module (for example `src/generate/` or `scripts/generate/`), plus a tool-name and path substitution table per target | PORTING-STUDY §4; reads `agents/`, `skills/`, `commands/`, `.mcp.json`; writes outside `plugins/architect/` |
| Add | per-target outputs and their structure checks (OpenCode agents, commands, `opencode.json`; Copilot `.agent.md`, prompts, hook or MCP config) | existing checks fix the Claude layout only |
| Touch (only if the CLI serves other targets) | `src/hooks/guard-bash.ts` `sddCli` for a bare `sdd`; `src/cli/commands.ts` guard and hook entry points for an adapter flag; `src/hooks/post-write.ts` output envelope | the guard cores stay unchanged |
| Touch | `scripts/package.mjs`, `package.json` (bin, `private`), `scripts/check.mjs` (new steps) | packaging and the npm CLI |
| Touch if the source is normalised | `plugins/architect/agents/*.md` and `commands/*.md` bodies (11 agent lines, 13 guard lines) and `sdd-conventions/SKILL.md:13` | only if the project chooses to move Claude names into wiring sections; a table-driven substitution avoids it |
| Do not touch | `plugins/architect/scripts/` (wiped by `build.mjs`), `plugins/architect/agents/` as an output folder (PLG-LAYOUT-001 counts 10 `sdd-*.md`) | generated files go elsewhere |

### 3.2 Existing tests that pin the Claude format

23 test files match the grep for `hooks.json`, `.mcp.json`, `plugin.json`, `mcp__`, `CLAUDE_PLUGIN`,
`agents/sdd-`, `tools:`, `architect:sdd-` or `AskUserQuestion`; the main ones:

- Layout and manifests: `tests/integration/cap11/TS-1101.test.ts` (tree, `plugin.json`), `TS-1109` (`.mcp.json` servers), `TS-1110` (only the researcher holds Context7 and DeepWiki), `TS-1122` (`hooks.json` matchers and commands), `TS-1119` (PLG-PORT-001), `TS-1113`.
- Agent contract: `tests/integration/cap02/agents-if09.test.ts`, `TS-219`, `skills-portability.test.ts`.
- Serena: `tests/integration/cap10/TS-1007`, `TS-1008`, `TS-1009`, `serena-tools.ts`, `serena-config.test.ts`.
- Guards (hook input shaped as Claude sends it, with `agent_type`): `tests/guards/path-corpus.test.ts` and `.json` (256 cases), `bash-corpus.test.ts` and `.json` (277 cases), `cap11/TS-1103`, `1104`, `1105`, `1107`, `1108`, `hooks-feedback.test.ts`.
- Shared helpers: `tests/integration/plugin-files.ts` (3 matches), `tests/unit/workspace/templates.test.ts`, `tests/smoke.test.ts`, `tests/unit/evals/harness.test.ts` (13 matches).

Tests that do not appear in this list (lint, trace, gate, archive, tracking, model, io) do not read the
plugin format; they exercise the `sdd` CLI core, which the study found portable.

### 3.3 Eval harness: what is Claude-SDK-specific

- `evals/harness/` has 15 files; 10 contain a Claude-specific construct, 5 do not (`fixtures`, `questions`, `regrade`, `run`, `workspaces`).
- `evals/harness/session.mjs:4` imports `query` from `@anthropic-ai/claude-agent-sdk` (pinned `0.3.296` in `evals/package.json:8`); it sets `pathToClaudeCodeExecutable`, loads the plugin as `{ type: "local" }`, `settingSources: []`, and answers `AskUserQuestion` through `canUseTool` (l.29-36). This is the only SDK import.
- `env.mjs:11` requires `CLAUDE_CODE_EXECPATH`; `machines.mjs:38` sets `CLAUDE_ENV_FILE`; `metrics.mjs:27` and `assert.mjs:96` read SDK messages (`task_started`, `subagent_type` of the Agent tool call); `overlay.mjs:49` prompts the model to call the Agent tool with `subagent_type` `architect:<name>`.
- `plugin-eval.mjs`, `plugin-cases.mjs`, `cases.mjs` wrap `claude plugin eval` (prompt.md plus graders).
- 104 files under `evals/` (results excluded) reference `harness/`, so any second runner must keep the same case API or the cases must be rewritten.
- `evals/results/` holds committed Claude-run results; `npm run eval` bills the configured API key (workspace survey §3).

## 4. Feasibility notes

1. **The CLI core is target-neutral.** Lint, trace, gates, archive and tracking never read the plugin
   format (section 3.2, last paragraph). Only the invocation spelling differs: `node
   "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"` in 5 hooks, 3 agents, 1 skill and 2 commands.
2. **Guards are reusable as pure functions.** `decidePath` and `decideBash` take a `HookInput` and return
   allow or deny. A per-target adapter (tool-name mapping, identity injection) in front of them keeps
   the 533 corpus cases valid for the cores. What differs per target is who supplies `agent_type`
   (PORTING-STUDY §3.6); that is the subject of `C002-OA-001`.
3. **A bare `sdd` is rejected by the bash guard today** (`sddCli` accepts `node` only). Publishing the CLI
   as an npm bin needs a guard change plus new corpus cases.
4. **PLG-PORT-001 does not confine all Claude names.** Agent bodies carry 11 lines of Claude constructs
   and `sdd-conventions` carries `${CLAUDE_PLUGIN_ROOT}` outside any wiring section. A table-driven
   body substitution must therefore cover agents, commands and one skill, not only the 4 wiring
   sections that PORTING-STUDY §3.3 counts on.
5. **Preloaded skills.** 31 preload references across 18 skills. The enforced cap (64,000 characters of
   preloaded skill bodies per agent, `size.mjs:8`) bounds the inlining option of PORTING-STUDY §3.1; the
   real per-agent totals were not measured (no allowed command prints file sizes).
6. **Serena is mostly neutral.** The read-only mode lists Serena-native tool names; the launcher takes
   the data folder as an argument. Claude-specific parts are the env variable spelling and `--context
   claude-code`; whether other Serena contexts exist and suit OpenCode or Copilot is not established by
   the repository and belongs to research.
7. **Hazard for the build gate.** PLG-TOOLS-001 reads the CHG-001 interface file at a fixed path under
   `.sdd/001-architect-agent-suite/`; archiving CHG-001 would move it. Not caused by a generator, but a
   new check that reads agent definitions should not copy this pattern.
8. **Memory.** `memory: project` (2 agents) writes under `.claude/agent-memory/architect-<agent>/`;
   `guard-path.ts:56` allows that folder. Neither target has an equivalent (PORTING-STUDY §3.1), so the
   generated agents lose this folder and the guard rule has no counterpart there.
9. **Eval harness is not reusable as is.** One SDK import, but 10 of 15 files and the case format depend
   on Claude semantics (Agent tool, `AskUserQuestion` interception, `claude plugin eval`). A second
   runner is separate work; the 104 referencing files suggest keeping the case API stable.

## Evidence

- **E-1** `plugins/architect/agents/sdd-conductor.md:7` › - — `tools` lists 12 entries, among them `Agent(` with 9 `architect:sdd-*` targets, AskUserQuestion, TaskCreate, TaskUpdate, TaskList, Skill.
  - layer: grep · confidence: medium
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `plugins/architect/agents/sdd-researcher.md:8` › - — `tools` lists 5 `mcp__plugin_architect_*` names (Context7 and DeepWiki); `memory: project` at l.7; the cartographer (l.7-8) and architect (l.7) carry the Serena names.
  - layer: grep · confidence: medium
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `plugins/architect/agents/sdd-conductor.md:4` › - — frontmatter values across the 10 agent files (`model`, `effort`, `color`, `memory` lines 4-7): model 7 opus, 2 sonnet, 1 haiku; effort 4 xhigh, 5 high, 1 low; 8 distinct colours; `memory` on 2 agents.
  - layer: grep · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-4** `plugins/architect/hooks/hooks.json:4` › - — 5 hook commands in PreToolUse (2), PostToolUse, SubagentStop, SessionStart; all use `${CLAUDE_PLUGIN_ROOT}`; the SubagentStop matcher names `architect:sdd-` agents.
  - layer: grep (file read) · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-5** `plugins/architect/.mcp.json:11` › `serena` — launched through `sdd serena-launch ${CLAUDE_PLUGIN_DATA}` with `--context claude-code` and the read-only mode file; `SERENA_HOME` is `${CLAUDE_PLUGIN_DATA}/serena`.
  - layer: grep (file read) · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-6** `plugins/architect/skills/interview-protocol/SKILL.md:119` › - — wiring section naming AskUserQuestion with `questions` (1-4), `header`, `multiSelect`, `options` (2-3); the other wiring sections are `research-protocol:93`, `code-discovery:109`, `gate-protocol:87`.
  - layer: grep · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-7** `plugins/architect/skills/sdd-conventions/SKILL.md:13` › - — `${CLAUDE_PLUGIN_ROOT}` used outside a wiring section.
  - layer: grep · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-8** `plugins/architect/commands/gate.md:6` › - — guard line naming `architect:sdd-conductor` and `claude --agent`; the same line sits at l.6 of all 13 commands.
  - layer: grep · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-9** `src/hooks/input.ts:25` › `isArchitectAgent()` — true when `agent_type` starts with `architect:sdd-`; referenced by `decideBash` and `decidePath` only.
  - layer: serena · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-10** `src/hooks/guard-path.ts:45` › `decidePath()` — pure function of `HookInput`; `WRITE_TOOLS` at l.18; allowed folders `.sdd` and `.claude/agent-memory/<agent>` (l.56); called from `src/cli/commands.ts:428` and `tests/guards/fixture.ts:135`.
  - layer: serena · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-11** `src/hooks/guard-bash.ts:208` › `decideBash()` — tool gate `Bash`/`PowerShell` at l.212 and l.217; `sddCli` at l.119 accepts `node` only; called from `src/cli/commands.ts:436` and `tests/guards/bash-corpus.test.ts:46`.
  - layer: serena · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-12** `src/hooks/post-write.ts:15` › `postWriteFeedback()` — returns a `hookSpecificOutput`/`additionalContext` JSON string (l.36).
  - layer: serena · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-13** `src/cli/commands.ts:427` › `guardPath()` — with `guardBash` (l.435), `hookSessionStart` (l.456) and `hookPostWrite` (l.462), the four stdin-JSON entry points built on `parseHookInput`.
  - layer: serena · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-14** `src/workspace/templates.ts:32` › `defaultPluginRoot()` — reads `CLAUDE_PLUGIN_ROOT`, else the folder above the bundle.
  - layer: grep (file read) · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-15** `src/workspace/serena-config.ts:33` › `writeSerenaConfig()` — takes the data folder as an argument; `serenaLaunch` in `serena-launch.ts` likewise; no Claude-named construct.
  - layer: serena · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-16** `scripts/check/port.mjs:7` › `port001` — pattern `AskUserQuestion|Agent\(|TodoWrite|mcp__`; targets are `skills/` and `templates/` only (l.13).
  - layer: grep (file read) · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-17** `scripts/check/run.mjs:19` › `CHECKS` — 14 registered checks; layout, tools, mcp, hooks, size, dup and evals assume the Claude plugin format.
  - layer: grep (file read) · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-18** `scripts/check/lib.mjs:15` › `context()` — `interfaces` path fixed to `.sdd/001-architect-agent-suite/10-spec/50-interfaces`, read by PLG-TOOLS-001.
  - layer: grep · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-19** `scripts/check/layout.mjs:6` › `PATHS` — required Claude layout; l.12-13 require exactly 10 `sdd-*.md` agents.
  - layer: grep (file read) · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-20** `scripts/build.mjs:15` › - — removes every file in `plugins/architect/scripts/` except `sdd.mjs` before bundling.
  - layer: grep (file read) · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-21** `scripts/package.mjs:78` › - — runs `claude plugin validate` on the staged plugin and marketplace (optional when Claude Code is missing); INSTALL.md text is Claude-only (l.44-75).
  - layer: grep (file read) · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-22** `package.json:4` › - — `private: true`, no `bin` field.
  - layer: grep (file read) · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-23** `evals/harness/session.mjs:4` › - — sole import of `@anthropic-ai/claude-agent-sdk`; `canUseTool` answers AskUserQuestion with scripted choices.
  - layer: grep (file read) · confidence: high
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-24** `tests/guards/path-corpus.json:1` › - — 256 cases; `tests/guards/bash-corpus.json:1` — 277 cases (count of `"id"` keys).
  - layer: grep · confidence: medium
  - commit: 74fe494 · pattern: -
  - disclosures: ripwire failed: exit 127
