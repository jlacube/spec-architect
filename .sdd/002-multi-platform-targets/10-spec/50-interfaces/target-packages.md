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

```text
dist/copilot/
├── architect-target.json
├── INSTALL.md
├── <placement.plugin_manifest>           Copilot-format plugin manifest (name and path from spike S-08)
├── agents/sdd-<agent>.agent.md           10 agents
├── prompts/<command>.prompt.md           13 prompt files (placement.command_file)
├── skills/<skill>/SKILL.md               18 skills in the Agent Skills format, plus references/
├── .mcp.json                             MCP configuration
├── hooks/hooks.json                      SessionStart and SubagentStop only (C002-REQ-302)
├── hooks/tool-classes.json               Copilot hooks fallback only (C002-IF-008 §2)
└── scripts/sdd.mjs                       copy of the plugin's bundled CLI, used by hook commands only (C002-CON-14)
```

Agent file (`agents/sdd-spec-writer.agent.md`), sdd MCP server enforcement:

```markdown
---
name: sdd-spec-writer
description: <translated>
model: <models.opus>
tools: ['<read tools>', '<search tools>', 'sdd-files/*', 'sdd-shell/*']
agents: []
user-invocable: false
---
<translated body and inlined skills>
```

- Conductor: `tools` adds `agent`, `vscode/askQuestions` and the todo tool; `agents` lists the nine
  specialists; no `user-invocable: false`.
- The `serena` entry of `.mcp.json` runs `sdd serena-launch --user-data --read-only -- start-mcp-server …`
  (C002-REQ-114, TGT-SERENA-001); with a `serena/*` grant, the read-only mode file is what keeps
  Serena's editing and shell tools away from the agents.
- Copilot hooks fallback: `tools` holds the generic edit and terminal tools the table maps Write,
  Edit and Bash to, no `sdd-files` or `sdd-shell`, and the frontmatter adds:

```yaml
hooks:
  PreToolUse:
    - type: command
      command: node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" hook guard --host copilot --agent sdd-spec-writer --classes "${CLAUDE_PLUGIN_ROOT}/hooks/tool-classes.json"
```

Prompt file (`prompts/plan.prompt.md`, named `<name>.prompt.md` after the source command,
C002-REQ-317): frontmatter `description`, `argument-hint`, `agent: sdd-conductor` and `tools` equal
to the conductor's list, because prompt-file tools take precedence over the agent's (C002-OA-001;
C002-REQ-306). Agent and prompt-file `tools` lists are allowlists, so no tool of an adopter's MCP
server is granted (C002-IF-001 §6.1).

`hooks/tool-classes.json` (Copilot hooks fallback only): the table's `hook_tool_classes` (C002-IF-008
§2), which assigns every tool granted to an agent or a prompt file of the package to exactly one of
the classes `write`, `terminal` and `read_only` (C002-REQ-318, TGT-CLASS-001).

`.mcp.json`:

```json
{
  "mcpServers": {
    "context7": { "type": "http", "url": "https://mcp.context7.com/mcp" },
    "deepwiki": { "type": "http", "url": "https://mcp.deepwiki.com/mcp" },
    "serena": { "command": "sdd", "args": ["serena-launch", "--user-data", "--read-only", "--", "start-mcp-server", "…"] },
    "sdd-files": { "command": "sdd-mcp", "args": ["--profile", "files"] },
    "sdd-shell": { "command": "sdd-mcp", "args": ["--profile", "shell"] }
  }
}
```

`hooks/hooks.json` (both modes): a SessionStart command
`node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" hook session-start --host copilot` and a SubagentStop
command `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" hook subagent-stop --host copilot --agents
sdd-spec-writer,sdd-test-designer,sdd-architect,sdd-planner`; VS Code ignores matchers, so the CLI
filters by `agent_type` itself (C002-IF-007, C002-REQ-315). No PreToolUse entry.

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

"Write only": on OpenCode the grant is `sdd-files_write_file` alone; on Copilot only `sdd-files/*`
can be granted, so the agent also receives `replace_text`, which writes under the same boundary.

## §5 Install notes

`INSTALL.md` is the table's `install_notes` variant with its tokens resolved. It states: Node.js 20 or
later; the host at its tested version (`{{tested_version:…}}`); access to the Claude models of the
three tiers; `npm install -g architect-sdd@{{package_version}}`; where the package files go
(OpenCode: `.opencode/` and the `opencode.json` merge; Copilot: the plugin folder and the settings
`chat.plugins.enabled`, `chat.pluginLocations`, `chat.askQuestions.enabled`); how to start the
conductor; the enforcement mode by its glossary name (C002-REQ-204, C002-REQ-304). The README
sections of C002-REQ-205 and C002-REQ-305 link the install-notes source
`targets/<target>/wiring/install-notes.md` of the plugin.

## §6 Target structure checks

Run by `npm run check` on freshly generated packages (C002-REQ-601) and by the release check. Each
finding is printed in the format of C001-IF-08 §3 with the target name.

| Code | Check | Source REQ |
|---|---|---|
| TGT-LAYOUT-001 | The package has the files and folders of §2 or §3 (ten agents, 13 commands named `architect-<name>.md` on OpenCode and `<name>.prompt.md` on Copilot, every skill, manifest, install notes, MCP configuration) and nothing else | C002-REQ-201, C002-REQ-216, C002-REQ-301, C002-REQ-317, C002-REQ-603 |
| TGT-PORT-001 | No Claude Code construct (detectors of C002-IF-001 §2) outside its `accepted_in` contexts, in agents, commands or prompt files, skills, configuration and hook files; the copied `scripts/sdd.mjs` is not scanned (the templates of `architect-sdd` are scanned by the build, ERR-BLD-002, C002-IF-003 §1) | C002-REQ-602 |
| TGT-TOOLS-001 | Each agent's and prompt file's tool grants equal the grants the table derives from the source `tools` field, server profiles included (an agent without Bash has no `sdd-shell`, C002-TS-130); on OpenCode each Architect agent's `tools` map also starts with the catch-all `"*": false` (§2). The finding names the file and each tool granted or missing | C002-REQ-108, C002-REQ-117, C002-REQ-603 |
| TGT-MCP-001 | The MCP configuration declares exactly the servers of the table for the package's mode | C002-REQ-201, C002-REQ-301, C002-REQ-603 |
| TGT-SERENA-001 | The `serena` entry of the MCP configuration runs `sdd` with the arguments `serena-launch`, `--user-data`, `--read-only`, `--`, `start-mcp-server`, in that order, followed by the table's Serena arguments, and holds no `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}` or `SERENA_HOME`. The finding names the configuration file (`opencode.json` or `.mcp.json`), `serena` and each missing, misplaced or extra argument (for example `--read-only`) | C002-REQ-114 (C002-TS-124, C002-TS-126) |
| TGT-GRANT-001 | Under sdd MCP server enforcement no agent or prompt file grants a generic edit or terminal tool, by name or through a tool set that contains one | C002-REQ-209, C002-REQ-306, C002-REQ-604 |
| TGT-CLASS-001 | Copilot hooks fallback: `hooks/tool-classes.json` exists and assigns every tool granted by any agent or prompt file to exactly one of `write`, `terminal` and `read_only`, with the tools the table maps Read, Glob and Grep to in `read_only`, the terminal tool in `terminal` and the terminal dialect of the table; the finding names `tool-classes.json`, the tool and every agent or prompt file that grants it. sdd MCP server enforcement: the package has no `tool-classes.json` | C002-REQ-318, C002-REQ-319 (C002-TS-330, C002-TS-331, C002-TS-332) |
| TGT-SIZE-001 | Each inlined skill ≤ 24,000 characters and all inlined skills of one agent ≤ 64,000 characters, references excluded. One finding per budget exceeded, naming the target, the agent, the budget (24,000 per skill or 64,000 per agent), the measured size and the skills concerned: the skill over the per-skill budget, or every inlined skill with its size when the per-agent total is over | C002-REQ-110, C002-NFR-104 (C002-TS-116) |
| TGT-HOOK-001 | Hook commands invoke the CLI with arguments only (no `&&`, `\|\|`, `;`, `\|`, `>`, `<`, `$(`, backtick); no PreToolUse hook outside agent frontmatter | C002-REQ-302, C002-REQ-316 |
| TGT-PERM-001 | OpenCode: no top-level `permission`; `agent` entries for the ten agents only; `edit` and `bash` rules as the table's mode requires | C002-REQ-206 … C002-REQ-209 |
| TGT-AGENT-001 | Only the conductor holds an agent-start grant, admitting exactly the nine specialists | C002-REQ-107 |
| TGT-MODE-001 | Conductor primary, specialists subagent; every command or prompt file bound to the conductor | C002-REQ-202, C002-REQ-203, C002-REQ-303 |
| TGT-MEM-001 | No agent has a `memory` field | C002-REQ-106 |
| TGT-NPM-001 | The `architect-sdd` tarball satisfies the rules of C002-IF-003 §2, the shipped templates included | C002-REQ-412, C002-REQ-414, C002-REQ-501, C002-REQ-502, C002-REQ-512, C002-REQ-518, C002-REQ-519 |
| PLG-VAR-001 | On the source plugin: no agent file (`agents/*.md`), command file (`commands/*.md`) or `SKILL.md` holds a host-only name of a generated target (`vscode/askQuestions`, `sdd-files`, `sdd-shell`, a token of C002-IF-001 §4 such as `{{host_name}}`) or a variant-only line: a line of 40 or more characters of a wiring variant file under `targets/` that is not in the source text its anchor replaces. The finding names the file, the line and the name or the variant file found | C002-REQ-113 (C002-TS-121, C002-TS-122) |

PLG-VAR-001 extends the plugin structure checks of C001-IF-08 §3; the 14 existing checks are
unchanged (C002-REQ-601).
