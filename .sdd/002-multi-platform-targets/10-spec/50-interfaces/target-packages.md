---
id: C002-IF-005
artifact: spec/interface
kind: conventions
change: CHG-002
phase: 10-spec
status: draft
---

# C002-IF-005 — Target package contracts and target structure checks

The expected layout, agent tool lists and MCP configuration of each target package (glossary: target
package contract), written by the generator (C002-COMP-001) and checked by the target structure
checks (C002-COMP-007, §6). Values that come from a mapping table are named by their table key
(C002-IF-001); the checks read them from the table, never from a change folder (C002-REQ-605).

## §1 Rules common to both packages

- Ten agents from the ten source agents, 13 commands from the 13 source commands, one skill folder per
  source skill (with its `references/` files), each translated by the mapping table.
- The conductor is the primary agent and the only one that may start agents, limited to the nine
  specialists (C002-REQ-107, C002-REQ-202, C002-INV-06); every command is bound to the conductor
  (C002-REQ-203, C002-REQ-303).
- No `memory` field (C002-REQ-106). Each agent body ends with the inlined bodies of its source
  `skills`, each under the heading `## Skill: <name>` (C002-REQ-109).
- `architect-target.json`: the generation manifest of C002-IF-004. `INSTALL.md`: the install notes
  (§5). All text files UTF-8 without BOM, LF line endings, sorted keys in JSON (C002-CON-09).

## §2 OpenCode target package (`dist/opencode/`)

```text
dist/opencode/
├── architect-target.json
├── INSTALL.md
├── opencode.json                         merged by P-03 into the project's opencode.json
└── .opencode/
    ├── agents/sdd-<agent>.md             10 agents
    ├── commands/architect-<command>.md   13 commands (placement.command_file)
    ├── skills/<skill>/SKILL.md           18 skills, plus references/
    └── plugins/architect-quick-lint.js   only when the table sets post_write_feedback (C002-REQ-215)
```

Agent file (`.opencode/agents/sdd-spec-writer.md`):

```markdown
---
description: <source description, references translated>
mode: subagent
model: <models.opus>
---
<translated body>

## Skill: sdd-conventions
<inlined skill with its OpenCode variants>
```

`opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": { "type": "remote", "url": "https://mcp.context7.com/mcp" },
    "deepwiki": { "type": "remote", "url": "https://mcp.deepwiki.com/mcp" },
    "serena": { "type": "local", "command": ["sdd", "serena-launch", "--user-data", "--read-only", "--", "start-mcp-server", "…"] },
    "sdd-files": { "type": "local", "command": ["sdd-mcp", "--profile", "files"] },
    "sdd-shell": { "type": "local", "command": ["sdd-mcp", "--profile", "shell"] }
  },
  "tools": { "context7*": false, "deepwiki*": false, "serena*": false, "sdd-files*": false, "sdd-shell*": false },
  "agent": {
    "sdd-spec-writer": {
      "tools": { "*": false, "read": true, "list": true, "glob": true, "grep": true, "sdd-files*": true, "sdd-shell*": true },
      "permission": { "edit": "deny", "bash": "deny", "external_directory": "deny", "question": "deny", "skill": "deny" }
    }
  }
}
```

- Each Architect agent's `tools` map starts with the catch-all `"*": false` and then sets `true` only
  for the tools the table derives from the source `tools` field (C002-IF-001 §6.1, closed tool set),
  so a tool of an adopter's own MCP server or plugin is never available to an Architect agent
  (C002-REQ-108, C002-TS-133). Listed order matters only if spike S-07 shows that OpenCode resolves
  the map by order; the generator writes the catch-all first.
- `sdd-files` and `sdd-shell` appear only under sdd MCP server enforcement (C002-REQ-210); under
  native permission enforcement each agent's `permission.edit` and `permission.bash` are the rule
  lists of the table (C002-REQ-206, C002-REQ-207, C002-IF-001 §6.3), and the agent's `tools` grant
  `write`, `edit`, `bash` as its source tools allow.
- Command files are named `architect-<name>.md` after the source command (C002-REQ-216).
- The `serena` entry runs `sdd serena-launch --user-data --read-only -- start-mcp-server …`
  (C002-REQ-114, TGT-SERENA-001).
- The top-level `tools` entry switches the Architect MCP servers off for every other agent; the file
  has no top-level `permission` key and `agent` entries for the ten Architect agents only
  (C002-REQ-208, C002-TS-210).
- The conductor's `permission.task` is `{"*": "deny", "sdd-researcher": "allow", …}` with the nine
  specialists; every specialist has `"task": "deny"` (C002-REQ-107).
- Whether OpenCode merges an agent defined both in `.opencode/agents/` and under `agent` in
  `opencode.json` is confirmed by spike S-07 [ASSUMPTION: S-07]; if not, the permission block moves to
  the agent file's frontmatter and C002-TS-208 reads it there.

## §3 Copilot target package (`dist/copilot/`)

Revised for defect D-003 (`docs/spikes/S-08-copilot-vscode.md §5`, F-1 … F-7). In VS Code the local
agent host starts workspace agents as subagents but not plugin agents, and starts workspace MCP
servers but not the MCP servers of a plugin (§3, §3.1, §3.2). The package therefore has two parts:
the **plugin part**, which VS Code loads through `chat.pluginLocations` (prompt files, skills, hooks)
and Copilot CLI loads with `--plugin-dir` (also the agents), and the **install sources**, which the
Copilot install command `sdd install copilot` (C002-IF-007) writes into the adopter's repository
(the agents, their guard hook and the MCP servers) and into the package folder (its manifest and
hooks file). Layout of the plugin part as in the S-08 probe plugin (Copilot legacy format:
`plugin.json`, `hooks.json` and `agents/` at the plugin root; `docs/spikes/s08/`, record §1, §2.4).
File names: `<agent name>` is the name of the source agent, such as `sdd-critic` (C002-REQ-322).

```text
dist/copilot/
├── architect-target.json                 generation manifest (C002-IF-004)
├── INSTALL.md                            install notes (§5)
├── agents/<agent name>.agent.md          10 agents: plugin agents on Copilot CLI (`architect:<agent name>`), and the files the install command copies to .github/agents/
├── prompts/<command>.prompt.md           13 prompt files (placement.command_file)
├── skills/<skill>/SKILL.md               18 skills in the Agent Skills format, plus references/
├── install/plugin.json                   plugin manifest (placement.plugin_manifest): name "architect", version, description, "commands": "prompts"; copied to the package root by the install command
├── install/mcp.json                      workspace MCP configuration (placement.config_file), merged into .vscode/mcp.json by the install command
├── install/hooks.template.json           hook declarations whose commands hold the token @CLI_COPY@ (placement.hooks_file)
├── hooks/tool-classes.json               tool classes file, both modes (C002-REQ-318; C002-IF-008 §2)
└── scripts/sdd.mjs                       copy of the plugin's bundled CLI (placement.cli_copy, C002-CON-14)
```

The generated package has no `.mcp.json`, no `hooks.json` and no `plugin.json` at its root. No plugin
MCP configuration declares a server (C002-REQ-307). The hooks file that the plugin loader reads,
`hooks.json` at the package root, is written by the install command from
`install/hooks.template.json` with the absolute path of `scripts/sdd.mjs` in place of `@CLI_COPY@`
(C002-IF-008 §4; C002-REQ-326), and the same install copies the manifest `install/plugin.json` to
`plugin.json`. Until the install, the package folder is therefore no plugin: registering it in
`chat.pluginLocations` loads no agent, prompt file or skill, so no Architect agent or prompt file runs
before its guard hook exists. Otherwise the conductor, as a plugin agent selected in the picker, could
start host built-in agents with no hook loaded (S-08 §3).
[ASSUMPTION: S-08 — the record loaded the probe plugin with its plugin.json only; the fresh-install step of the manual VS Code checklist (C002-REQ-614) confirms that VS Code adds no agent, prompt file or skill from a registered folder without plugin.json; if it does, the generator writes agents/ and prompts/ under install/ as well and the install command copies them to the package root with the manifest]

**What the install command writes** (C002-IF-007, `install copilot`; C002-REQ-322 … C002-REQ-324),
in the order of C002-IF-007 §Install step 5, the guard hook before the agents:

| Source in the package | Written to | How |
|---|---|---|
| `install/hooks.template.json` | `<package>/hooks.json` | `@CLI_COPY@` replaced by `<package>/scripts/sdd.mjs`, absolute, with `/` separators |
| the `PreToolUse` entries of `install/hooks.template.json` | `<repo>/.github/hooks/architect-guard.json` (workspace hook file) | `{ "hooks": { "PreToolUse": [ … ] } }` with those entries, `@CLI_COPY@` replaced as for `hooks.json` |
| `install/plugin.json` | `<package>/plugin.json` | byte copy |
| `agents/<agent name>.agent.md` (10 files) | `<repo>/.github/agents/<agent name>.agent.md` | byte copy |
| every entry of `servers` in `install/mcp.json` | `<repo>/.vscode/mcp.json`, key `servers` | merged: the package's entries added or replaced, every other entry and key kept |
| — | `<repo>/.github/architect-install.json` | install record: package version and the SHA-256 of each agent file, of the workspace hook file and of each server entry written |

**Why the guard hook is written twice** (critic CR-38). The workspace agents are files of the
repository: every VS Code that opens it loads them, with or without the plugin part. The plugin-level
`hooks.json` alone would leave them unguarded where the plugin part is not loaded, is disabled, or is
a copy that VS Code took before the latest install. The workspace hook file sits beside the agents, so the
guard is loaded wherever they are; the plugin-level entry is the one S-08 showed carrying
`agent_type` (§2.3, §3.1). Where the CLI copy named by a hook command does not exist, the hook errors
and the host denies every tool call of the session (C002-IF-008 §2), so neither place fails open.
[ASSUMPTION: S-08 — neither the record nor C002-R-001 covers workspace hook files; VS Code and Copilot CLI are taken to load .github/hooks/*.json of the open repository in the hooks-file format of the package's hooks.json, and to give its PreToolUse commands the same input as plugin-level ones, agent_type on subagent calls included; the fresh-install step of the manual VS Code checklist (C002-REQ-614) and the Copilot CLI eval runner (C002-IF-010 §4) confirm both; if a host needs another location or shape, the install command writes that instead; if a host loads no workspace hook file, the plugin-level entry is the only guard there, and the case of workspace agents without the plugin part returns to P-01]

Agent file (`agents/sdd-spec-writer.agent.md`), sdd MCP server enforcement:

```markdown
---
name: sdd-spec-writer
description: <translated>
model: <models.opus>
tools: ['read', 'search', 'sdd-files/*', 'sdd-shell/*']
agents: []
user-invocable: false
---
<translated body and inlined skills>
```

- Every agent has a `tools` list: an agent without one gets every tool of the host, edit and
  terminal tools included (S-08 §3.2; C002-REQ-604, TGT-GRANT-001).
- The `name` is the file name without `.agent.md`; VS Code reports a workspace agent's name as
  `agent_type` (`sdd-spec-writer`), Copilot CLI reports a plugin agent as `architect:sdd-spec-writer`
  (S-08 §2.3, §3.1). The conductor's `agents` list names the specialists without prefix on both
  hosts, as the S-08 probe parents did (`docs/spikes/s08/agents/probe-parent.agent.md:5`).
- `user-invocable: false` on the nine specialists (`agent_fields.subagent_flags`).
  [ASSUMPTION: S-08 — the record's workspace subagents carried no user-invocable field; the fresh-install step of the manual VS Code checklist (C002-REQ-614) confirms that a workspace agent with user-invocable false is still started as a subagent]
- MCP tools are granted per server (`sdd-files/*`, `serena/*`); the host lists them as deferred
  tools named `<server>-<tool>` (`sdd-files-write_file`) and adds `tool_search_tool`, through which
  an agent loads a deferred tool before its first call, to every agent whose `tools` list omits it
  (S-08 §3.2, fact F-7). Bodies name MCP tools in the `<server>-<tool>` form (C002-IF-001 §2).
- Conductor: `tools` adds `agent`, `ask_user` and the todo tool; `agents` lists the nine
  specialists; no `user-invocable: false`. P-03 selects it as the session agent in the Local
  session type (S-08 §3; §5).
- The `agents` list does not bound the agents the conductor can start. In the 0.0.3 run the local
  agent host offered a parent whose `agents` list named two plugin agents only its host built-in
  agents (`explore`, `task`, `general-purpose`, `rubber-duck`, `code-review`, `research`,
  `security-review`) and the parent itself (S-08 §3), and an agent without a `tools` list of the
  package gets the host's full tool set, PowerShell, `create` and `edit` included (§3.2). The write
  and terminal calls of such agents are denied, in both modes, by the Copilot subagent guard hook in
  a repository with `.sdd/` (C002-IF-008 §2 rule 6; C002-REQ-327).
  [ASSUMPTION: S-08 — three points that §3 and §3.1 do not record: (1) the host also offers its built-in agents to a conductor whose specialists are workspace agents (taken as the worst case; the guard does not depend on it); (2) of the built-in agents' tools, only the hook names Write (create tool) and Bash (terminal tool) are known (§2.3, §3.1), so the edit tool and every other tool the classes file does not name are denied as unclassed (C002-REQ-328); (3) a host built-in agent's tool calls carry agent_type in their hook input, as those of workspace and plugin agents started as subagents do; the manual VS Code checklist (C002-REQ-614) and the Copilot CLI eval runner confirm (1) and (3) (C002-REQ-327 open item); if such calls carry no agent_type, they pass as the session agent's (C002-IF-008 §2 rule 3) and Q-safety-06 returns to P-01]
- Same names in two places: in VS Code the package's `agents/` are also loaded as plugin agents
  (shown in the agent picker, not startable as subagents, S-08 §3). [ASSUMPTION: S-08 — the record tested workspace and plugin agents of different names only; the fresh-install step of the manual VS Code checklist (C002-REQ-614) confirms that the workspace sdd-conductor, selected as session agent, starts the workspace specialists and that the prompt files bind to it; if not, the generator moves the agent files to install/agents/, outside the plugin part, and the Copilot CLI eval runner restores agents/ in its package copy (C002-IF-010 §4)]
- The `serena` entry of `install/mcp.json` runs `sdd serena-launch --user-data --read-only --
  start-mcp-server …` (C002-REQ-114, TGT-SERENA-001); with a `serena/*` grant, the read-only mode
  file is what keeps Serena's editing and shell tools away from the agents.
- Copilot hooks fallback: each specialist's `tools` holds the generic edit and terminal tools the
  table maps Write, Edit and Bash to and no `sdd-files` or `sdd-shell`; the conductor and every
  prompt file keep the server profiles of C002-REQ-117 instead of generic edit and terminal tools
  (C002-REQ-321), because the session agent's calls carry no `agent_type` (S-08 §2.3, §3). No agent
  frontmatter declares a hook: agent-scoped hooks do not run for a subagent's calls in the local
  agent host (S-08 §3.1, fact F-4). The guard hook is the PreToolUse entry below, in the package's
  `hooks.json` and in the workspace hook file beside the agents.

Prompt file (`prompts/plan.prompt.md`, named `<name>.prompt.md` after the source command,
C002-REQ-317): frontmatter `description`, `argument-hint`, `agent: sdd-conductor` and `tools` equal
to the conductor's list, because prompt-file tools take precedence over the agent's (C002-OA-001;
C002-REQ-306). Agent and prompt-file `tools` lists are allowlists, so no tool of an adopter's MCP
server is granted (C002-IF-001 §6.1).

`hooks/tool-classes.json` (both modes): the table's `hook_tool_classes` (C002-IF-008 §2), which
assigns to exactly one of the classes `write`, `terminal` and `read_only` every tool the host offers
to an Architect agent other than the conductor (its granted tools by their hook names, the sdd MCP
server tools included, and the host-added `tool_search_tool`) and every generic edit or terminal
tool of the host whose hook name the spike record gives (`Write`, `Bash`) (C002-REQ-318,
TGT-CLASS-001). The Copilot subagent guard hook reads it in both modes (C002-IF-008 §2 rule 6), the
Copilot guard hook of the fallback also for the Architect agents' calls (rule 8).

`install/mcp.json` (VS Code workspace format, `servers`, as `docs/spikes/s08/workspace/.vscode/mcp.json`):

```json
{
  "servers": {
    "context7": { "type": "http", "url": "https://mcp.context7.com/mcp" },
    "deepwiki": { "type": "http", "url": "https://mcp.deepwiki.com/mcp" },
    "sdd-files": { "args": ["--profile", "files"], "command": "sdd-mcp", "type": "stdio" },
    "sdd-shell": { "args": ["--profile", "shell"], "command": "sdd-mcp", "type": "stdio" },
    "serena": { "args": ["serena-launch", "--user-data", "--read-only", "--", "start-mcp-server", "…"], "command": "sdd", "type": "stdio" }
  }
}
```

`sdd-files` and `sdd-shell` are declared in both modes (C002-REQ-307: under the hooks fallback the
conductor writes through them, C002-REQ-321). The servers start with the session, after its first
message (S-08 §3.2; C002-IF-002 §1).

`install/hooks.template.json` (both modes), commands of C002-IF-008 §4, shown for sdd MCP server
enforcement:

```json
{
  "hooks": {
    "PreToolUse": [{ "command": "node \"@CLI_COPY@\" hook guard --host copilot --mode sdd-mcp-server --agents sdd-conductor,sdd-researcher,sdd-cartographer,sdd-options-analyst,sdd-spec-writer,sdd-test-designer,sdd-architect,sdd-planner,sdd-critic,sdd-auditor", "type": "command" }],
    "SessionStart": [{ "command": "node \"@CLI_COPY@\" hook session-start --host copilot", "type": "command" }],
    "SubagentStop": [{ "command": "node \"@CLI_COPY@\" hook subagent-stop --host copilot --agents sdd-spec-writer,sdd-test-designer,sdd-architect,sdd-planner", "type": "command" }]
  }
}
```

In both modes `hooks` holds exactly one PreToolUse entry, the Copilot subagent guard hook
(C002-REQ-302, C002-REQ-327), which runs for every tool call of every agent. Under the Copilot hooks
fallback its `--mode` is `copilot-hooks`, and the same entry is also the Copilot guard hook of the
Architect agents (C002-REQ-308; C002-IF-008 §2). Only the `PreToolUse` entry goes into the workspace
hook file; SessionStart and SubagentStop stay plugin-level, so that a session gets one brief and one
trace refresh per event.

The hosts ignore matchers (C002-R-001 A-04), so the CLI filters by `agent_type` itself (C002-IF-007,
C002-REQ-315, C002-REQ-320, C002-REQ-327).

## §4 Grants per agent

Source tools: C001-IF-09. "files" = the `sdd-files` tools, "shell" = the `sdd-shell` tool; under
native permission enforcement and the Copilot hooks fallback the same columns hold the generic edit
and shell or terminal tools instead.

| Agent | Write tools | Command tool | Question tool | Starts agents | MCP servers (other) |
|---|---|---|---|---|---|
| sdd-conductor | files | shell | yes | the nine specialists | — |
| sdd-researcher | files (Write only) | — | — | — | context7, deepwiki |
| sdd-cartographer | files (Write only) | shell | — | — | serena |
| sdd-options-analyst | files (Write only) | — | — | — | — |
| sdd-spec-writer | files | shell | — | — | — |
| sdd-test-designer | files | shell | — | — | — |
| sdd-architect | files | shell | — | — | serena |
| sdd-planner | files | shell | — | — | — |
| sdd-critic | files (Write only) | shell | — | — | — |
| sdd-auditor | files (Write only) | shell | — | — | — |

"Write only": on OpenCode the grant is `sdd-files_write_file` alone; on Copilot the package grants
`sdd-files/*` (per-tool grants were shown on Copilot CLI only, S-08 §2.1), so the agent also
receives `replace_text`, which writes under the same boundary. Question tool on Copilot: `ask_user`
(S-08 §3.2, fact F-5). Under the Copilot hooks fallback the conductor's row keeps "files" and
"shell" (C002-REQ-321).

## §5 Install notes

`INSTALL.md` is the table's `install_notes` variant with its tokens resolved. It states: Node.js 20 or
later; the host at its tested version (`{{tested_version:…}}`); access to the Claude models of the
three tiers; `npm install -g architect-sdd@{{package_version}}`; where the package files go
(OpenCode: `.opencode/` and the `opencode.json` merge); how to start the conductor; the enforcement
mode by its glossary name (C002-REQ-204, C002-REQ-304). Copilot, in this order (C002-REQ-304):

1. Unpack the package into a folder outside the repository (its path written into `hooks.json` and
   into the repository's `.github/hooks/architect-guard.json`, so a path holding `"`, `$`, `%` or a
   backtick is refused, ERR-CLI-022).
2. In a terminal of P-03 (not through an agent, C002-REQ-325), in the repository:
   `sdd install copilot --package <folder>`; again in each further repository, and after moving or
   updating the package. A refusal names each adopter file or server in the way (ERR-CLI-021). The
   install writes the guard hook beside the agents (`.github/hooks/architect-guard.json`), whose
   command names this machine's package path: keep `.github/agents/<agent name>.agent.md`, that file
   `.github/architect-install.json` and `.vscode/mcp.json` together (the package itself stays outside
   the repository), all in version control or none (C002-REQ-322). In a clone where
   that path does not exist, VS Code denies every tool call in the repository until the install
   runs there (fail-closed, C002-CON-08).
3. The settings `chat.plugins.enabled` (true), `chat.pluginLocations` (the package folder) and
   `chat.askQuestions.enabled` (true; kept per the open item of C002-REQ-304). Step 2 comes first:
   the package folder becomes a plugin only when the install has written its `plugin.json` and
   `hooks.json` (§3); after a later install that changes `hooks.json`, reload the window, because
   VS Code loads the plugin from a copy (S-08 §3).
4. A chat of the **Local** session type (the Copilot CLI session type does not offer the agents,
   S-08 §3), with `sdd-conductor` selected as the session agent.
5. The workspace MCP servers start only after the first message of a session (S-08 §3.2), so the
   first message is a plain request such as the status, before any write.
6. In a repository with `.sdd/`, while hooks are enabled, a subagent that is not an Architect agent
   (a host built-in agent such as `general-purpose`, or an agent of the adopter started as a
   subagent) can call only the read-only tools of the tool classes file; the calls of P-03's own
   session agent are not affected, and repositories without `.sdd/` are not affected
   (C002-REQ-304, C002-REQ-327, C002-REQ-329).

The README
sections of C002-REQ-205 and C002-REQ-305 link the install-notes source
`targets/<target>/wiring/install-notes.md` of the plugin.

## §6 Target structure checks

Run by `npm run check` on freshly generated packages (C002-REQ-601) and by the release check. Each
finding is printed in the format of C001-IF-08 §3 with the target name.

| Code | Check | Source REQ |
|---|---|---|
| TGT-LAYOUT-001 | The package has the files and folders of §2 or §3 (ten agents, 13 commands named `architect-<name>.md` on OpenCode and `<name>.prompt.md` on Copilot, every skill, manifest, install notes, MCP configuration; on Copilot `install/plugin.json`, `install/mcp.json`, `install/hooks.template.json` and `hooks/tool-classes.json`, and no `.mcp.json`, `hooks.json` or `plugin.json` at the package root) and nothing else | C002-REQ-201, C002-REQ-216, C002-REQ-301, C002-REQ-307, C002-REQ-317, C002-REQ-603 |
| TGT-PORT-001 | No Claude Code construct (detectors of C002-IF-001 §2) outside its `accepted_in` contexts, in agents, commands or prompt files, skills, configuration and hook files; on Copilot `${CLAUDE_PLUGIN_ROOT}` and `${PLUGIN_ROOT}` are accepted in no context; the copied `scripts/sdd.mjs` is not scanned (the templates of `architect-sdd` are scanned by the build, ERR-BLD-002, C002-IF-003 §1) | C002-REQ-602, C002-REQ-326 |
| TGT-TOOLS-001 | Each agent's and prompt file's tool grants equal the grants the table derives from the source `tools` field, server profiles included (an agent without Bash has no `sdd-shell`, C002-TS-130); on OpenCode each Architect agent's `tools` map also starts with the catch-all `"*": false` (§2). The finding names the file and each tool granted or missing | C002-REQ-108, C002-REQ-117, C002-REQ-603 |
| TGT-MCP-001 | The MCP configuration (OpenCode `opencode.json`; Copilot the workspace MCP configuration `install/mcp.json`) declares exactly the servers of the table for the package's mode; on Copilot no other file of the package declares an MCP server | C002-REQ-201, C002-REQ-301, C002-REQ-307, C002-REQ-603 |
| TGT-SERENA-001 | The `serena` entry of the MCP configuration runs `sdd` with the arguments `serena-launch`, `--user-data`, `--read-only`, `--`, `start-mcp-server`, in that order, followed by the table's Serena arguments, and holds no `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}` or `SERENA_HOME`. The finding names the configuration file (`opencode.json` or `install/mcp.json`), `serena` and each missing, misplaced or extra argument (for example `--read-only`) | C002-REQ-114 (C002-TS-124, C002-TS-126) |
| TGT-GRANT-001 | Under sdd MCP server enforcement no agent or prompt file grants a generic edit or terminal tool, by name or through a tool set that contains one, and every Copilot agent has a `tools` list (the finding names the file and the tool, or the missing list); under the Copilot hooks fallback the conductor and every prompt file grant none either (C002-REQ-321) | C002-REQ-209, C002-REQ-306, C002-REQ-321, C002-REQ-604 |
| TGT-CLASS-001 | Both modes: `hooks/tool-classes.json` exists and assigns every tool that the host offers to an Architect agent other than the conductor, by its hook `tool_name` (the tools granted by its `tools` list, the sdd MCP server tools included, and the host-added `tool_search_tool`), and the recorded generic tools `Write` and `Bash`, to exactly one of `write`, `terminal` and `read_only`, with the tools the table maps Read, Glob and Grep to in `read_only`, `Write` and the `sdd-files` tools in `write`, `Bash` and the `sdd-shell` tool in `terminal`, and the terminal dialect of the table; the finding names `tool-classes.json`, the tool and every agent that is offered it, or the generic tool | C002-REQ-318, C002-REQ-319, C002-REQ-327 (C002-TS-330, C002-TS-332) |
| TGT-SIZE-001 | Each inlined skill ≤ 24,000 characters and all inlined skills of one agent ≤ 64,000 characters, references excluded. One finding per budget exceeded, naming the target, the agent, the budget (24,000 per skill or 64,000 per agent), the measured size and the skills concerned: the skill over the per-skill budget, or every inlined skill with its size when the per-agent total is over | C002-REQ-110, C002-NFR-104 (C002-TS-116) |
| TGT-HOOK-001 | Every command of `install/hooks.template.json` is `node "@CLI_COPY@"` followed by arguments only (no `&&`, `\|\|`, `;`, `\|`, `>`, `<`, `$(`, backtick, `${PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_ROOT}`); no agent frontmatter declares a hook; in both modes the template declares exactly one PreToolUse entry, running `hook guard --host copilot` with `--mode` equal to the table's enforcement mode and the ten Architect agents in `--agents`, and no other file of the package declares a PreToolUse hook | C002-REQ-302, C002-REQ-308, C002-REQ-316, C002-REQ-326, C002-REQ-327 |
| TGT-PERM-001 | OpenCode: no top-level `permission`; `agent` entries for the ten agents only; `edit` and `bash` rules as the table's mode requires | C002-REQ-206 … C002-REQ-209 |
| TGT-AGENT-001 | Only the conductor holds an agent-start grant, admitting exactly the nine specialists | C002-REQ-107 |
| TGT-MODE-001 | Conductor primary, specialists subagent; every command or prompt file bound to the conductor | C002-REQ-202, C002-REQ-203, C002-REQ-303 |
| TGT-MEM-001 | No agent has a `memory` field | C002-REQ-106 |
| TGT-NPM-001 | The `architect-sdd` tarball satisfies the rules of C002-IF-003 §2, the shipped templates included | C002-REQ-412, C002-REQ-414, C002-REQ-501, C002-REQ-502, C002-REQ-512, C002-REQ-518, C002-REQ-519 |
| PLG-VAR-001 | On the source plugin: no agent file (`agents/*.md`), command file (`commands/*.md`) or `SKILL.md` holds a host-only name of a generated target (`ask_user`, `tool_search_tool`, `sdd-files`, `sdd-shell`, a token of C002-IF-001 §4 such as `{{host_name}}`) or a variant-only line: a line of 40 or more characters of a wiring variant file under `targets/` that is not in the source text its anchor replaces. The finding names the file, the line and the name or the variant file found | C002-REQ-113 (C002-TS-121, C002-TS-122) |

PLG-VAR-001 extends the plugin structure checks of C001-IF-08 §3; the 14 existing checks are
unchanged (C002-REQ-601).
