# Architect for {{host_name}} — install notes

This package holds the Architect spec-driven workflow for {{host_name}}: ten agents, 13 prompt files,
the skills, the workspace MCP configuration and a copy of the sdd CLI that the hook commands run. It
is generated from the Architect plugin, version {{package_version}}, for {{enforcement_mode}}.

## Prerequisites

- Node.js 20 or later (`node -v`).
- VS Code {{tested_version:vscode}} with GitHub Copilot Chat {{tested_version:copilot-chat}}, the
  tested versions (`sdd host-version vscode` prints both). Another version is untested; the doctor
  prompt reports it.
- Access to the Claude models of the three tiers (Opus, Sonnet and Haiku) in GitHub Copilot Chat,
  under the model ids that the `model` field of each file in `agents/` names.
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
   agents) and select `sdd-conductor` as the session agent in the agent picker. The prompt files
   `/<name>` (for example `/init`, `/new`, `/status`) run in the conductor; the nine specialists are
   subagents that the conductor starts.
5. The workspace MCP servers (`sdd-files`, `sdd-shell`, `serena`, `context7`, `deepwiki`) start only
   after the first message of a session. Make the first message a plain request such as `/status`,
   before anything that writes.
6. In a repository that contains `.sdd/`, while hooks are enabled, every subagent that is not an
   Architect agent (a host built-in agent such as `general-purpose`, or one of your own agents started
   as a subagent) can call only the read-only tools of the tool classes file
   (`hooks/tool-classes.json`); its write and terminal calls are denied. The calls of your own session
   agent are not affected, and repositories without `.sdd/` are not affected.

Run `/doctor` first: it checks node, {{host_name}}, the sdd CLI, the hooks setting, ripwire, Serena,
ast-grep, Context7 and DeepWiki, and sets up Serena's data folder outside the repository. Then run
`/init` to set up `.sdd/` in the repository.
