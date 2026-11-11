# Architect for {{host_name}} — install notes

This package holds the Architect spec-driven workflow for {{host_name}}: ten agents, 13 prompt files,
the skills, the workspace MCP configuration and a copy of the sdd CLI that the hook commands run. It
is generated from the Architect plugin, version {{package_version}}, for {{enforcement_mode}}.

## Prerequisites

- Node.js 20 or later (`node -v`).
- VS Code {{tested_version:vscode}} with GitHub Copilot Chat {{tested_version:copilot-chat}}, the
  tested versions (`sdd host-version {{host_version_arg}}` prints both). Another version is untested; the doctor
  prompt reports it.
- Access to the Claude models of the three tiers (Opus, Sonnet and Haiku) in GitHub Copilot Chat,
  under the model ids that the `model` field of each file in `agents/` names.
- On a Copilot plan that does not offer the model an agent file names (for example a plan without
  Opus models), the host runs that agent on its default model, Sonnet at the tested versions, so the
  agents of the Opus tier then run a tier below their own.
- You see which model ran: in VS Code, the model named in the footer of each reply (pick the model
  in the chat's model picker, step 4); on Copilot CLI, the models listed with their use in the file
  that `--usage-output-file` writes.
- Optional: Serena 1.7 or later (`serena --version`) for symbol-level code discovery.

## Install the sdd CLI

```sh
npm install -g architect-sdd@{{package_version}}
```

This puts `sdd` (the workflow CLI) and `sdd-mcp` (the sdd MCP server) on PATH. Check with
`sdd --version`, which prints {{package_version}}.

## Set up the package and the repository

1. Unpack this package into a folder outside the repository, for example
   `~/architect/copilot-{{package_version}}/`. Its path is written into the package's `hooks.json`
   and into the repository's `.github/hooks/architect-guard.json`, so a path that holds `"`, `$`, `%`
   or a backtick is refused.
2. In a terminal of your own (not through an agent), in the root of the repository, run:

   ```sh
   sdd install copilot --package <folder>
   ```

   where `<folder>` is the package folder of step 1. Run it again in each further repository, and
   again after you move the package folder or replace it with another version. A refusal names each
   of your files or servers that is in the way; nothing is written then. The install writes:
   - `.github/agents/<agent name>.agent.md`, the ten Architect agents;
   - `.github/hooks/architect-guard.json`, the guard hook beside the agents, whose command names this
     machine's package path;
   - `.github/architect-install.json`, the install record;
   - the Architect entries of `servers` in `.vscode/mcp.json`, your own entries kept;
   - `plugin.json` and `hooks.json` in the package folder, which make the folder a plugin.

   Keep the four repository files together: put all of them in version control or none. The package
   folder itself stays outside the repository. In a clone where the package path named by
   `.github/hooks/architect-guard.json` does not exist, VS Code denies every tool call in the
   repository until `sdd install copilot --package <folder>` runs there (fail-closed).
3. After the install step, set these VS Code settings:
   - `chat.plugins.enabled`: `true`;
   - `chat.pluginLocations`: the package folder of step 1;
   - `chat.askQuestions.enabled`: `true`.

   The package folder becomes a plugin only once the install has written its `plugin.json` and
   `hooks.json`, so set the settings after step 2. After a later install, reload the window
   (Developer: Reload Window): VS Code loads the plugin from a copy it took earlier.

## Start the conductor

4. Open a chat of the **Local** session type (the Copilot CLI session type does not offer the
   agents) and select `sdd-conductor` as the session agent in the agent picker. Pick a model in the
   chat's model picker in every new window: a new window starts the picker on "Auto", which routes the
   session to another model, possibly of another vendor. The footer of each reply names the model
   that answered. The nine specialists are subagents that the conductor starts.
5. The Architect commands are the prompt files, offered as `/architect:<name>` (for example
   `/architect:init`, `/architect:new`, `/architect:doctor`, `/architect:status`); they run in the
   conductor. A bare `/init` runs VS Code's own built-in `/init`, which writes `AGENTS.md` or
   `.github/copilot-instructions.md`, not the Architect one: use `/architect:init`.

## Known limitation on VS Code

6. VS Code {{tested_version:vscode}} sends no `agent_type` to PreToolUse hooks, so the subagent guard
   hook cannot tell which agent makes a tool call. In a repository that contains `.sdd/`, the hook
   therefore does not stop a subagent that is not an Architect agent, for example one that your own
   default agent starts, or one that the conductor starts against its instructions, from editing
   files or running commands; the hook still refuses a call it cannot read and fails closed when its
   CLI copy is missing. What holds without the hook: the Architect specialists have no generic edit
   or terminal tool, and their writes and commands go through the sdd MCP servers, which refuse a
   write outside `.sdd/` and a command outside the allowlist. The conductor's restriction to the
   nine Architect specialists comes from its instructions, not from VS Code, so a delegation planted
   in the content it reads and followed by the model is not stopped. On a host that names the
   subagent in its hook input, such a subagent can call only the read-only tools of the tool classes
   file (`hooks/tool-classes.json`) in a repository with `.sdd/`; repositories without `.sdd/` are
   not affected.
7. The Copilot hooks fallback (`copilot-hooks`) is not offered for VS Code {{tested_version:vscode}}:
   it decides the Architect agents' calls by the same `agent_type`, so there it would leave the
   specialists' generic edit and terminal calls undecided.

## Servers and questions

8. No MCP server runs before the first message of a session. Each workspace MCP server
   (`sdd-files`, `sdd-shell`, `serena`, `context7`, `deepwiki`) starts when an agent first uses
   one of its tools; a server that MCP: List Servers shows as not started ("Start") is no fault.
9. Keep the setting `chat.autoReply` off. While it is on, VS Code answers the conductor's questions
   itself with an auto-reply text ("The user is not available to respond …"), which the conductor
   treats as no answer, so no interview round or gate goes forward. `chat.tools.global.autoApprove`
   approves tools only; it does not answer questions.

**Note on Copilot CLI.** Copilot CLI is no supported host of this package. If you start the conductor
there with `--agent architect:sdd-conductor`, Copilot CLI runs that session agent on its own default
model, not on the model of the agent file; the conductor runs on its tier only with `--model <model>`,
where `<model>` is the `model` field of `agents/sdd-conductor.agent.md`. The specialists it starts run
on the models of their own files. Copilot CLI refuses a `--model` that your plan does not offer before
the session starts; then name a model your plan offers, and the conductor runs on that model.

Run `/architect:doctor` first: it checks node, {{host_name}}, the sdd CLI, the hooks setting,
ripwire, Serena, ast-grep, Context7 and DeepWiki, and sets up Serena's data folder outside the repository. Then run
`/architect:init` to set up `.sdd/` in the repository.
