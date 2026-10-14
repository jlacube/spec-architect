---
id: C002-R-001
artifact: ideation/research
change: CHG-002
phase: 00-ideation
status: draft
---
# R-001 — Platform facts for the OpenCode and Copilot (VS Code) targets

## Question
Brief (verbatim summary of the three parts): confirm or refute, with official sources, the open
platform facts the design depends on, listed as [VERIFY] in `PORTING-STUDY.md`:

1. VS Code Copilot: do agent-scoped hooks (`hooks` in `.agent.md` frontmatter) fire for that
   agent's tool calls when it runs as a subagent? Exact PreToolUse input for the file-edit and
   terminal tools (tool names, `tool_input` fields) and how a deny is returned. The `askQuestions`
   tool: exact name, parameters, maximum questions, options, free-text answers. Whether
   Claude-format plugins' `agents/`, `commands/`, `skills/` are loaded, and whether
   `${CLAUDE_PLUGIN_ROOT}` is expanded in agent/prompt bodies.
2. OpenCode: `permission.edit` glob semantics (`**`, relative vs absolute paths), how
   `permission.bash` patterns treat compound commands (`&&`, `;`, pipes, `$(...)`), the `question`
   tool limits (questions per call, multi-select), whether `tool.execute.before` plugin input
   identifies the agent, how to load a named skill from an agent prompt, MCP tool naming.
3. Running scripted/headless sessions for evaluation on each platform (OpenCode server/SDK or
   `opencode run`; Copilot CLI or VS Code headless options).

Why: these facts decide the guard design (Q-safety-01: same safety bar as Claude Code), the
interview adaptation per target and the eval approach of CHG-002. Scope per questions-log
(Q-scope-01): OpenCode and GitHub Copilot in VS Code.

## Method
- Read `PORTING-STUDY.md` and `00-ideation/questions-log.md` first.
- Routing: both platforms are named products. Library documentation first: Context7
  (`/anomalyco/opencode` resolved, High reputation; no usable Context7 entry for VS Code or
  Copilot, only unrelated or low-reputation libraries). Repository knowledge next: DeepWiki for
  `sst/opencode` (the repository is now published as `anomalyco/opencode`) and
  `microsoft/vscode-copilot-chat`. Then the official documentation pages (WebFetch) and one web
  search for the VS Code `askQuestions` tool.
- DeepWiki answers are AI-generated summaries of source; findings that rest only on them are
  rated at most medium, and low where the answer is internally inconsistent.
- Nothing was run on either platform. Findings about runtime behaviour are therefore documented
  or source-derived, never observed.
- Today: 2026-10-14. Platforms observed: OpenCode documentation and `dev` branch source as
  returned by Context7 (no version number given by the sources); VS Code 1.109+ documentation;
  Copilot CLI documentation on docs.github.com.

## Findings

### A. VS Code Copilot

- A-01. Agent-scoped hooks run "only when this agent is active, either invoked by the user or as a
  subagent". They are Preview, supported only by the "Local harness", and need the setting
  `chat.useHooks` and a trusted workspace. Syntax: a `hooks` map in the `.agent.md` frontmatter
  (documented example uses `PostToolUse`). The documentation does not show a `PreToolUse`
  example in frontmatter, but nothing restricts the map to certain events. —
  sources: https://code.visualstudio.com/docs/copilot/customization/custom-agents (2026-10-14),
  https://code.visualstudio.com/docs/agent-customization/hooks (2026-10-14) —
  confidence: medium (documentation states subagent activation explicitly; no PreToolUse-in-subagent
  example and nothing observed; still needs spike S-08)
- A-02. Hook input and deny. Common input on stdin: `timestamp`, `cwd`, `session_id`,
  `hook_event_name`, `transcript_path`. PreToolUse adds `tool_name`, `tool_input`, `tool_use_id`.
  Deny is returned as `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"..."}}`;
  values are `allow`, `deny`, `ask`; exit code 2 is a blocking error whose stderr goes to the
  model; any other non-zero exit is a non-blocking warning (the call continues). When hooks
  conflict, the most restrictive decision wins (deny over ask over allow). `updatedInput` is
  ignored if it does not match the tool schema. — sources:
  https://code.visualstudio.com/docs/agents/reference/hooks-reference (2026-10-14) — confidence:
  high (primary reference page)
- A-03. No agent identity in tool-event hook input: PreToolUse and PostToolUse carry no
  `agent_type`; only SubagentStart (`agent_id`, `agent_type`) and SubagentStop (`agent_id`,
  `agent_type`, `stop_hook_active`) carry it. Confirms the study. A non-zero exit other than 2 does
  not block, so a guard script must exit 2 (or print a deny) on its own internal errors to fail
  closed. — sources: https://code.visualstudio.com/docs/agents/reference/hooks-reference
  (2026-10-14) — confidence: high (primary reference page)
- A-04. Matchers: the Local harness ignores `matcher` values in Claude-format hook files, so every
  command for the event runs for every tool. Claude-format workspace hook files
  (`.claude/settings.json`) additionally require `chat.useClaudeHooks`, which is off by default.
  Plugin hooks are read from `hooks.json` or `hooks/hooks.json` (no extra setting is named for
  plugins). — sources: https://code.visualstudio.com/docs/agent-customization/hooks (2026-10-14)
  — confidence: high (primary documentation)
- A-05. Tool names and `tool_input` fields for edit and terminal tools are NOT documented in the
  hook pages ("Tool names and input schemas differ between harnesses"; the documentation tells
  readers to discover them with an audit hook or the agent debug logs). From the extension source,
  the internal tool names are: edit `insert_edit_into_file`, `create_file`,
  `replace_string_in_file`, `multi_replace_string_in_file`, `apply_patch`, `edit_notebook_file`;
  terminal `run_in_terminal`, `get_terminal_output`; ask `vscode_askQuestions`; subagent
  `runSubagent` (plus `search_subagent`, `execution_subagent`). DeepWiki reports the input fields:
  `create_file` {filePath, content}; `replace_string_in_file` {filePath, oldString, newString};
  `multi_replace_string_in_file` {explanation, replacements[{filePath, oldString, newString}]};
  `insert_edit_into_file` {explanation, filePath, code}; `apply_patch` {input, explanation};
  `run_in_terminal` {command, explanation, isBackground} (this last one was derived by DeepWiki
  from the prompt, not from a schema). Whether the hook's `tool_name` equals these internal names
  is NOT confirmed: a secondary search result quotes an `editFiles` sample in an official example
  that I could not locate on the pages I opened. Edit also reaches files through other tools
  (terminal, MCP, extensions), so a path guard must cover every tool that can write. — sources:
  https://raw.githubusercontent.com/microsoft/vscode-copilot-chat/main/src/extension/tools/common/toolNames.ts
  (2026-10-14), https://deepwiki.com/search/what-are-the-internal-tool-nam_f15481a8-c021-45c5-b2c2-678dda1f6928
  (2026-10-14), https://code.visualstudio.com/docs/agents/reference/hooks-reference (2026-10-14) —
  confidence: low (internal names are source-confirmed, medium on their own, but the mapping to hook `tool_name` is not confirmed)
- A-06. `askQuestions` tool. Reference name in agent `tools` lists and prompt files:
  `vscode/askQuestions` (internal id `vscode_askQuestions`; one prompt-files tip spells it
  `vscode/askQuestion`, the singular is a documentation typo as far as the other pages show).
  Parameters (DeepWiki from extension source): `questions[]`, each with `header` (string),
  `question` (string), optional `multiSelect` (boolean), optional `options[]` of {`label`,
  optional `description`, optional `recommended` (boolean)}, optional `allowFreeformInput`
  (boolean). The release notes describe single/multi-select options, free text input and
  highlighted recommended answers, Escape to skip remaining questions. No maximum number of
  questions or options is documented or visible in the schema (the "batches of up to 4" in the
  study is NOT confirmed). Experimental, behind `chat.askQuestions.enabled` (v1.109 notes). —
  sources: https://code.visualstudio.com/updates/v1_109 (2026-10-14),
  https://code.visualstudio.com/docs/agent-customization/prompt-files (2026-10-14),
  https://deepwiki.com/search/what-is-the-exact-tool-name-an_761b87ed-f76f-4cf8-936d-57d11c02f767
  (2026-10-14) — confidence: medium (behaviour documented; parameter schema from an AI summary of
  source; limits unknown)
- A-07. `askQuestions` in subagents and under auto-approve. A VS Code issue (closed as completed
  2026-03-21, no fix version stated) reported the tool unavailable to a subagent; the maintainer
  said the log showed the subagent did have the tool, and the reporter later said it was available
  but not used. A feature request states that with `chat.agent.autoApprove` enabled the tool is
  auto-approved and returns `{"skipped": true}` without UI (status of that request not checked).
  Consequence for Architect: a gate answered by `{"skipped": true}` must never count as approval;
  the interview and gates should run in the primary (conductor) agent, as today. — sources:
  https://github.com/microsoft/vscode/issues/299897 (2026-10-14),
  https://code.visualstudio.com/updates/v1_109 (2026-10-14) — confidence: medium (subagent point from the issue thread; the auto-approve point is low: a feature request seen only in a search snippet, not opened)
- A-08. Claude-format plugins in VS Code: the format is auto-detected from the manifest location
  (`.claude-plugin/plugin.json` for Claude). Components loaded by plugins: skills, MCP servers,
  custom agents, hooks, automation templates, slash commands. The Claude example shows agents as
  `agents/reviewer.md`, skills as `skills/<name>/SKILL.md`, hooks `hooks/hooks.json`, MCP
  `.mcp.json`; a `commands/` folder is shown but its file format is not specified. Plugins need
  `chat.plugins.enabled`; local directories register through `chat.pluginLocations`. — sources:
  https://code.visualstudio.com/docs/agent-customization/agent-plugins (2026-10-14) — confidence: medium (documented list of components; how a Claude agent's frontmatter such as `tools:` or `skills:` is interpreted is not documented)
- A-09. `${CLAUDE_PLUGIN_ROOT}` expansion. Documented: Claude format uses `${CLAUDE_PLUGIN_ROOT}`
  (Copilot accepts it and `${PLUGIN_ROOT}`); VS Code expands it at runtime and also sets it as an
  environment variable in the hook or server process; expansion covers MCP `command`, `args`,
  `cwd`, `env`, `envFile`, `url`, `headers` and hook command fields and `env` values (including
  hooks in custom-agent frontmatter; paths are shell-quoted). The page does NOT say it is
  expanded in the Markdown body of agents, prompts or skills. Refutes nothing, but the
  study's assumption that bodies can use it stays unverified: treat bodies as NOT expanded. —
  sources: https://code.visualstudio.com/docs/agent-customization/agent-plugins (2026-10-14) —
  confidence: medium (high for hooks and MCP, which are documented; for bodies only the absence of documentation, so unverified)
- A-10. Prompt files: `.github/prompts/*.prompt.md`; frontmatter `description`, `name`,
  `argument-hint`, `agent` (`ask`, `agent`, `plan` or a custom agent name), `model`, `tools`;
  tools are referenced in the body with `#tool:<tool-name>`. Arguments are free text typed after
  the slash command (`/create-api for listing customers`) or `${input:name}`; there is no `$ARGUMENTS`
  placeholder documented, so command bodies must be rewritten to say "use the text the user typed
  after the command". — sources: https://code.visualstudio.com/docs/agent-customization/prompt-files
  (2026-10-14) — confidence: high (primary documentation page)
- A-11. Custom agent frontmatter: `name`, `description`, `argument-hint`, `tools`, `agents` (list;
  `*` for all; `[]` for none; the `agent` tool must be in `tools` when `agents` is set), `model`
  (single or prioritised array), `user-invocable` (false: subagent or programmatic only),
  `disable-model-invocation`, `handoffs`, `hooks` (Preview). MCP tools: `<server name>/*`. A tool
  absent at run time is silently ignored. How the `tools` list behaves when the agent runs as a
  subagent is not described. — sources:
  https://code.visualstudio.com/docs/copilot/customization/custom-agents (2026-10-14) —
  confidence: high (fields are in the primary page; subagent tool-list behaviour is unverified)

### B. Copilot CLI (relevant for evals and for the CLI harness)

- B-01. Copilot CLI `preToolUse` input is camelCase (`sessionId`, `timestamp`, `cwd`, `toolName`,
  `toolArgs`) with tool names `edit`, `bash`, `powershell`; in the VS Code-compatible PascalCase
  format it uses `tool_name`/`tool_input` and reports Claude-style names such as `Bash`. Deny:
  stdout JSON `{"permissionDecision":"deny","permissionDecisionReason":"..."}` or exit code 2; other
  non-zero exits also deny; timeouts fail open. No agent identity on tool events (agent fields exist
  only on subagent events). CLI agent-scoped hooks exist ("only while that agent is selected"),
  but repository-defined ones need workspace admission and remote or organisation-hosted agents do
  not run them. — sources:
  https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-hooks-reference
  (2026-10-14) — confidence: high (primary reference); whether CLI agent-scoped hooks fire for
  subagents is not stated (unverified)

### C. OpenCode

- C-01. `permission` actions are `allow`, `ask`, `deny`; object syntax per tool; evaluation is
  "last matching rule wins", so catch-all `"*"` goes first. Agent permissions (frontmatter of an
  agent Markdown file, or `agent.<name>.permission`) are merged with the global config and agent
  rules take precedence. Keys: `read`, `edit` (covers `edit`, `write`, `patch`; `apply_patch` is
  listed with edit in the agents page), `glob`, `grep`, `list`, `bash`, `task`, `skill`, `lsp`,
  `question`, `webfetch`, `websearch`, `external_directory`, `doom_loop`. Most defaults are
  `allow`. — sources: https://opencode.ai/docs/permissions/ (2026-10-14),
  https://opencode.ai/docs/agents/ (2026-10-14) — confidence: high (primary documentation)
- C-02. Glob semantics. Documented: `*` matches zero or more of any character, `?` exactly one,
  everything else literally; `**` is NOT defined (it appears only in examples). From the source
  (DeepWiki quote of `Wildcard.match`): the pattern is turned into an anchored regex where `*`
  becomes `.*` and `?` becomes `.`, backslashes are normalised to `/` in both string and pattern,
  matching is case-insensitive on Windows, and a trailing ` *` makes the argument part optional
  (`ls *` matches `ls`). Consequence: `*` already crosses `/`, so `**` behaves like `*`;
  `.sdd/**` is a prefix match on the string tested. — sources:
  https://opencode.ai/docs/permissions/ (2026-10-14),
  https://deepwiki.com/search/show-the-implementation-of-wil_13efe411-0642-4acd-b72c-2c4a9b5b8568
  (2026-10-14) — confidence: medium (documentation plus a quoted source function from an AI
  summary; not run)
- C-03. UNVERIFIED and in conflict: what path string `edit` rules are matched against. The
  documentation example uses a relative pattern (`packages/web/src/content/docs/*.mdx`) and says
  nothing on resolution; DeepWiki said "absolute" in one answer and "relative to the project root"
  in another. The `^…$` anchoring means the answer decides whether `.sdd/**` matches at all
  (relative) or must be written as `*/.sdd/*` or similar (absolute). Whether `..` segments and
  symlinks are normalised before matching is also unknown (DeepWiki only inferred it). A path such
  as `.sdd/../src/x` would match `.sdd/**` if not normalised. Must be settled by spike S-07
  (replay of the 256-case path corpus). — sources: https://opencode.ai/docs/permissions/
  (2026-10-14), https://deepwiki.com/search/for-the-bash-permission-if-a-r_77218190-1830-4d4e-9e9c-38ad9324f12b
  (2026-10-14) — confidence: low (documentation silent, AI summary contradicts itself, nothing run)
- C-04. Bash compound commands. The shell tool parses the command with a tree-sitter bash grammar;
  its helper collects all `command` descendant nodes, so each side of `&&`, `;` and `|` and
  nested `$(...)` commands are evaluated separately and a rule must allow every part (any deny
  denies the whole call: `sdd status && rm -rf x` is denied under `"*":"deny","sdd *":"allow"`).
  Open points: DeepWiki says a redirection stays inside the command string, so `sdd status > any/file`
  matches `sdd *` and the redirect target is not checked by `edit` rules (inference, to be tested);
  process substitution, here-documents, `eval`, `bash -c "..."` and `sdd` flags that write files
  are not covered by splitting. On Windows the tool may be PowerShell (separate parsing noted in
  the tests). — sources: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/tool/shell.ts
  (via Context7 snippet, 2026-10-14),
  https://deepwiki.com/search/how-does-the-permission-system_2b675184-e3f4-4016-ab66-6c6f660ce759
  (2026-10-14), https://opencode.ai/docs/permissions/ (2026-10-14) — confidence: medium (splitting derived from source by two tools; redirection and bypass classes are low, untested)
- C-05. `question` tool limits. Documented: each question has a header, text and options; the user
  picks an option or types a custom answer; with several questions the user navigates between
  them and submits all answers; permission key `question`. The schema (source/SDK types):
  `questions: Question.Prompt[]` with `question`, `header` (a "very short label, max 30 chars"),
  `options[{label, description}]`, optional `multiple` (multi-select) and optional `custom`
  (free-text input); answers are arrays of strings. No maximum number of questions or options is
  defined. Note the 30-character header limit and that option `description` is required. —
  sources: https://opencode.ai/docs/tools/ (2026-10-14),
  https://github.com/anomalyco/opencode/blob/dev/packages/sdk/js/src/v2/gen/types.gen.ts (via
  Context7, 2026-10-14),
  https://deepwiki.com/search/what-are-the-exact-fields-of-t_c38f8f8f-ee34-4570-b829-74a21b5e25ef
  (2026-10-14) — confidence: medium (documentation is silent on limits; schema from source via two
  tools; default of `custom` not seen)
- C-06. `tool.execute.before` plugin hook: `(input: { tool, sessionID, callID }, output: { args })`;
  a call is blocked by throwing an error; the input has NO agent field. The agent can be derived
  indirectly: a subagent runs in a child session with a `parentID`, and the Task tool sets the
  child session's agent to `subagent_type`; the plugin client (`session.get`/messages) could
  resolve `sessionID` to an agent (DeepWiki; not seen in official docs). Plugin files: project
  `.opencode/plugins/`, global `~/.config/opencode/plugins/`, or npm packages in the `plugin`
  array. Events include `session.created`, `session.idle`, `message.updated`, `permission.asked`,
  `file.edited`. A newer plugin API in the `dev` branch docs (`ctx.tool.hook("execute.before")`
  with `{tool, input}`) exists; see Conflicting evidence. — sources:
  https://opencode.ai/docs/plugins/ (2026-10-14),
  https://github.com/anomalyco/opencode/blob/dev/packages/plugin/src/index.ts (via Context7,
  2026-10-14), https://deepwiki.com/search/1-in-opencode-run-noninteracti_f89e499f-3632-4c47-bee3-8506feae29c4
  (2026-10-14) — confidence: medium (high that the hook input has no agent, from the type and the call site; the session-lookup route to recover it is not documented officially)
- C-07. Loading a skill by name: the `skill` tool; the agent sees skills listed in the tool
  description and calls `skill({ name: "git-release" })`. Permission `skill` with wildcards
  (`allow`/`deny`/`ask`), overridable per agent in frontmatter; `deny` hides the skill. Search
  paths include `.opencode/skills/`, `.claude/skills/` and `.agents/skills/` (project and global).
  `name` is 1-64 lowercase alphanumerics and single hyphens and must equal the folder name;
  `description` 1-1024 characters. — sources: https://opencode.ai/docs/skills/ (2026-10-14),
  https://opencode.ai/docs/tools/ (2026-10-14) — confidence: high (primary documentation pages)
- C-08. Agents and commands. Agent files in `.opencode/agents/<name>.md` (file name is the agent
  name); `mode` `primary|subagent|all` (default `all`), `hidden: true` (subagents only, still
  invokable by the model through Task if permitted), `permission`, `steps`, `model`
  (`provider/model-id`; subagents default to the invoking agent's model), `temperature`; unknown
  options pass through to the provider (example `reasoningEffort: "high"`, which settles the
  study's `effort` question for providers that accept it). `permission.task` globs, last match
  wins; a denied subagent is removed from the Task tool description, but a user can still call it
  with `@`. Commands in `.opencode/commands/*.md`: `description`, `agent`, `subtask`, `model`;
  `$ARGUMENTS`, `$1..`, `` !`cmd` `` and `@file`. — sources: https://opencode.ai/docs/agents/
  (2026-10-14), https://opencode.ai/docs/commands/ (2026-10-14) — confidence: high (primary documentation pages)
- C-09. MCP: `opencode.json` `mcp` entries with `type: "local"` (`command` array, `environment`,
  `cwd`, `enabled`, `timeout`) or `type: "remote"` (`url`, `headers`, `oauth`). Tools are
  registered with the server name as prefix (`mymcp_*` globs); the separator is shown as an
  underscore in the permission and tools examples (`my-mcp_search`). Per-agent enablement uses
  `tools` globs (`"my-mcp*": true`); `permission` globs also work. The study's `serena_find_symbol`
  form is consistent. — sources: https://opencode.ai/docs/mcp-servers/ (2026-10-14),
  https://opencode.ai/docs/tools/ (2026-10-14) — confidence: high (primary documentation pages)

### D. Scripted and headless sessions

- D-01. OpenCode `opencode run "<prompt>"` is the non-interactive mode: flags `--agent`, `--model`,
  `--format json` (raw JSON events), `--session`/`--continue`/`--fork`, `--attach <server-url>`,
  `--file`, `--dir`, `--command`, `--port`, `--auto` ("auto-approve permissions that are not
  explicitly denied"). The documentation does not say what `run` does with a permission request
  or a `question` call without `--auto`; DeepWiki says it waits for an answer (i.e. a scripted run
  can hang). — sources: https://opencode.ai/docs/cli/ (2026-10-14),
  https://deepwiki.com/search/1-in-opencode-run-noninteracti_f89e499f-3632-4c47-bee3-8506feae29c4
  (2026-10-14) — confidence: medium (flags are documented, high; question and permission behaviour without --auto is low, from an AI summary of tests)
- D-02. OpenCode server and SDK: `opencode serve` (default `127.0.0.1:4096`, basic auth through
  `OPENCODE_SERVER_PASSWORD`, `OPENCODE_SERVER_USERNAME`), `GET /event` SSE stream,
  `POST /session/:id/permissions/:permissionID` with body `{response, remember?}`. JS SDK:
  `createOpencode()` (starts server and client, accepts inline `config` overrides),
  `createOpencodeClient({baseUrl})`, `session.create`, `session.prompt` (body `model`, `parts`,
  `noReply`, structured-output format; the page does not list `agent` in the body fields),
  `event.subscribe`. No documented endpoint for answering `question` calls (the generated types
  contain a `question.v2.asked` event, so a reply route probably exists; unverified). A scripted
  evaluation can therefore drive sessions, subscribe to events, auto-answer permissions and
  inspect tool calls and file changes. — sources: https://opencode.ai/docs/server/ (2026-10-14),
  https://opencode.ai/docs/sdk/ (2026-10-14) — confidence: medium (server and SDK basics are documented, high; programmatic answers to question calls are low, undocumented)
- D-03. Copilot CLI non-interactive: `copilot -p "<prompt>"`, `--agent`, `--output-format json`
  (JSONL), `--allow-tool`, `--deny-tool`, `--allow-all-tools`, `--allow-all`/`--yolo`,
  `--no-ask-user` (prevents the agent from pausing to ask the user), `--model`, `-s`, `--share`;
  authentication through `COPILOT_GITHUB_TOKEN` then `GH_TOKEN` then `GITHUB_TOKEN`; other
  variables `COPILOT_ALLOW_ALL`, `COPILOT_MODEL`, `COPILOT_HOME`, `COPILOT_AUTO_UPDATE`. Not
  documented in the pages opened: ACP server mode, `--log-level`, exit codes of `-p` runs, billing.
  `--no-ask-user` means the interview and gate flows cannot be exercised through the question tool
  in `-p` mode; only pre-answered or scripted-input scenarios fit. — sources:
  https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference
  (2026-10-14), https://docs.github.com/en/copilot/how-tos/copilot-cli/automate-copilot-cli/run-cli-programmatically
  (2026-10-14) — confidence: high (flags are in the primary reference; interaction of hooks and agents in `-p` mode is untested)
- D-04. VS Code has no documented headless chat mode. The VS Code CLI has `code chat` with `-m/--mode`
  (`ask`, `edit`, `agent` or a custom agent id), `-a/--add-file`, `--maximize`, `-r`, `-n`, and
  stdin piping; the documentation describes it as starting a chat session and mentions no
  transcript output. Any automation route (Extension Development Host, UI automation) is not
  documented in the pages opened and stays unverified. The documentation describes a "Copilot
  harness" shared by VS Code, Copilot CLI and the Copilot app, but the hook and plugin pages scope
  some features to the "Local harness"; the equivalence of CLI and VS Code behaviour is not
  documented. — sources: https://code.visualstudio.com/docs/configure/command-line (2026-10-14),
  https://code.visualstudio.com/docs/agents/overview (2026-10-14) — confidence: medium (no headless flag is documented, but absence of documentation is not proof)

## Confidence
- High: VS Code hook input/deny contract, matcher ignoring, absence of agent identity on tool
  events, prompt-file and agent frontmatter, OpenCode permission keys, skill tool, agent/command
  syntax, MCP naming, run/serve/SDK basics, Copilot CLI flags.
- Medium: agent-scoped hooks firing for subagents, `askQuestions` schema, OpenCode compound-command
  splitting, OpenCode question schema and absence of limits, Claude-format plugin component loading.
- Low or unverified: hook `tool_name` values for VS Code edit and terminal tools, OpenCode `edit`
  path resolution and traversal normalisation, redirection handling, `${CLAUDE_PLUGIN_ROOT}` in
  agent or prompt bodies, scripted question answering on both platforms, VS Code automation.
- Would raise confidence: spikes S-07 and S-08 (an audit hook logging stdin in VS Code; replay of
  the path and shell corpora against OpenCode's matcher; a tiny agent with a PreToolUse deny hook
  invoked as a subagent).

## Implications
- Safety bar on Copilot (Q-safety-01). The agent-scoped PreToolUse route is now supported on paper
  by the documentation ("as a subagent" is explicit), so it stays viable but is Preview, Local
  harness only, needs `chat.useHooks` and a trusted workspace, and a guard script cannot rely on
  `tool_name` values until captured. Any hook failure other than exit 2 fails open, so the guard
  must wrap its own errors into exit 2. Because the VS Code agent `hooks` run in addition to
  user, workspace and plugin hooks, a generated agent file can carry the guard itself (identity by
  scoping). The `sdd-mcp` write-server alternative remains the identity-free fallback.
- Installing the current Claude plugin as is in VS Code stays unsafe: matchers are ignored, tool
  names differ, no agent identity (A-03, A-04, A-05). The Copilot target must not ship the Claude
  hooks file unchanged.
- OpenCode permissions are the primary enforcement; the key risks are the unverified path string
  and traversal behaviour (C-03) and redirection or indirect writes through an allowed `sdd *`
  command (C-04). A plugin on `tool.execute.before` can add a second layer that runs
  `sdd guard-bash`, but it identifies the agent only through a session lookup (C-06).
- Interview adaptation: the OpenCode question tool takes a `questions` array with a 30-character
  header, required option descriptions, `multiple` and `custom`; the VS Code tool takes
  `questions` with `header`, `question`, `multiSelect`, `options` with `recommended`, and
  `allowFreeformInput`. Neither is documented with a cap, so the 4-question batch and 2-3 options
  rules remain Architect's own convention, kept on both. The VS Code `{"skipped": true}` outcome
  must be handled as "no answer" at every gate.
- Command bodies: VS Code has no `$ARGUMENTS`; OpenCode does. `${CLAUDE_PLUGIN_ROOT}` must be
  replaced in bodies for both targets (npm `sdd` command, Q-cli-01), and stays usable only in
  hooks and MCP config on Copilot.
- Evals: OpenCode can be scripted through `serve` and the SDK (events, permission replies) at low
  cost to the harness; Copilot is scripted only through Copilot CLI, which is a different harness
  from VS Code Local (hooks and agents may differ) and uses `--no-ask-user` for unattended runs.
  VS Code-specific behaviour (agent-scoped hooks, `askQuestions`) cannot be exercised headlessly
  with documented means. IDs affected: Q-safety-01, Q-cli-01, the ported guard requirements, the
  eval requirements for each target, spikes S-07 and S-08.

## Conflicting evidence
- OpenCode documentation exists in two shapes in the source tree: the published pages
  (`packages/web`, `opencode.ai/docs`) use `permission`, `bash`, `task`, and a `question` tool
  described with header, question and options; the newer `dev` content (`services/www`) describes an
  ordered list of `{action, resource, effect}` rules with `shell`, `subagent`, a question tool with
  `header`, `prompt`, `choices`, and an Effect-based plugin API. I used the published pages and the
  `packages/*` source as authoritative for the current release and treated the `dev` variant as an
  upcoming redesign. The exact release these map to is unknown: the spike must record the OpenCode
  version.
- DeepWiki is inconsistent about the `edit` path string (absolute versus relative to the project
  root); weighed as unresolved (C-03).
- The VS Code prompt-file page spells the tool `vscode/askQuestions` and, once, `vscode/askQuestion`;
  the release notes, the extension source and the issue use `askQuestions`; I used the plural.
- The VS Code hooks page restricts agent-scoped hooks to the "Local harness"; the Copilot CLI
  reference documents its own agent-scoped hooks. They are separate implementations; the CLI result
  does not prove the VS Code behaviour.
- A search snippet described a community report of different VS Code hook payloads (`toolArgs`,
  flat output). It contradicts the official reference and looks like the Copilot CLI format; the
  official reference was weighed higher.
- The study states "batches of up to 4" for `askQuestions`: no primary source supports it.

## Follow-up questions
- Which OpenCode version and VS Code/Copilot Chat version will be the supported baseline? (the
  doctor and pinning in the study's risk table depend on it; ask in the spike)
- Does the VS Code hook `tool_name` for terminal and edit tools equal `run_in_terminal` and the
  internal edit names, and does `tool_input` carry the fields of A-05? (audit hook, S-08)
- Does a PreToolUse deny in agent frontmatter block a subagent's tool call and also block the
  subagent's use of MCP tools and of `runSubagent`? (S-08)
- Is `${CLAUDE_PLUGIN_ROOT}` expanded in agent, prompt or skill bodies in VS Code? (S-08; assume no)
- OpenCode: string tested by `edit` rules, `..` and symlink normalisation, redirection targets,
  `bash -c`, `eval`, here-documents; is there a reply endpoint for `question`? (S-07)
- Does `opencode run` block on a `question` call, and can the SDK answer it? (S-07)
- Does Copilot CLI honour `.agent.md` agent-scoped hooks when the agent runs as a subagent, and
  does it load Claude-format plugin `agents/` and `commands/`? (not researched here; not needed
  unless CLI becomes a target)
