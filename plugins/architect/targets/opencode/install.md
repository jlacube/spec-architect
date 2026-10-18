# Architect for {{host_name}} — install notes

This package holds the Architect spec-driven workflow for {{host_name}}: ten agents, 13 commands, the
skills and an `opencode.json` fragment with the MCP servers. It is generated from the Architect
plugin, version {{package_version}}, for {{enforcement_mode}}.

## Prerequisites

- Node.js 20 or later (`node -v`).
- {{host_name}} {{tested_version:opencode}}, the tested version (`opencode --version`). Another
  version is untested; the doctor command reports it.
- Access to the Claude models of the three tiers (Opus, Sonnet and Haiku) under the model ids that the
  `model` field of each file in `.opencode/agents/` names, with the provider of those ids configured
  in {{host_name}}.
- Optional: Serena 1.7 or later (`serena --version`) for symbol-level code discovery.

## Install the sdd CLI

```sh
npm install -g architect-sdd@{{package_version}}
```

This puts `sdd` (the workflow CLI) and `sdd-mcp` (the sdd MCP server) on PATH. Check with
`sdd --version`, which prints {{package_version}}.

## Place the package files

1. Copy the `.opencode/` folder of this package to the root of your repository. If the repository
   already has a `.opencode/` folder, copy the files into it: `agents/sdd-*.md`,
   `commands/architect-*.md` and the folders under `skills/` are the Architect files; keep your own
   files beside them.
2. Merge `opencode.json` of this package into the `opencode.json` at the root of your repository
   (create it if there is none): add each entry of `mcp`, `tools` and `agent` to the key of the same
   name, keeping your own entries. The `tools` entries switch the Architect MCP servers off for your
   own agents; the `agent` entries apply to the ten Architect agents only.
3. Keep `architect-target.json` with the package or next to the copied files: it records the package
   version, the enforcement mode and the {{host_name}} version the package was tested with.

## Start the conductor

Start {{host_name}} in the repository and select the agent `sdd-conductor`: press Tab until the
agent picker shows it, or start with `opencode --agent sdd-conductor`. The commands
`/architect-<name>` (for example `/architect-init`, `/architect-new`, `/architect-status`) run in the
conductor; the nine specialists are subagents that the conductor starts.

Run `/architect-doctor` first: it checks node, {{host_name}}, the sdd CLI, ripwire, Serena, ast-grep,
Context7 and DeepWiki, and sets up Serena's data folder outside the repository. Then run
`/architect-init` to set up `.sdd/` in the repository.
