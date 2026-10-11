---
description: Check the toolchain (node, git, Claude Code, ripwire, Serena, ast-grep, Context7, DeepWiki), print the status table with fixes, record toolchain.md and set up Serena's data folder.
argument-hint: ""
---

This command runs in the `architect:sdd-conductor` main session. If you are not that agent, reply that P-01 should start `claude --agent architect:sdd-conductor` and run the command there, and do nothing else.

1. **Serena data folder.** Ensure `${CLAUDE_PLUGIN_DATA}/serena/serena_config.yml` exists with
   these values (create the file with exactly these lines when it is missing; otherwise set these
   keys and keep the rest):

   ```yaml
   web_dashboard: false
   web_dashboard_open_on_launch: false
   project_serena_folder_location: "${CLAUDE_PLUGIN_DATA}/serena/projects/$projectFolderName/.serena"
   projects: []
   ```

   Write the path with forward slashes. Serena reads it from its next start, so it never writes
   `.serena/` into the repository.
2. **Probe.** Dispatch `sdd-cartographer` to write `.sdd/_constitution/toolchain.md` (code-discovery
   skill, toolchain record): one row each for node, git, Claude Code, ripwire, Serena, ast-grep,
   Context7, DeepWiki with detected, version, path or endpoint, fallback. Probes: `--version` for
   the command-line tools (ripwire: `ripwire --version`, never `--doctor`); Context7 and DeepWiki:
   load one of their tools and make one small call (unreachable when it fails). Without `.sdd/`,
   probe the same way and skip the file.
3. **Report** a table with the columns Tool, Status, Version, Fallback, Fix — one row per tool in
   the order above. Status: `ok`, `missing`, `unreachable` (remote servers) or `error` (present but
   unusable or too old). Fix: for every non-ok row, the command of the remedies table below.
   - node: `error` below version 20.
   - Claude Code: `error` below 2.1.295 (`claude --version`).
   - Fallbacks: ripwire → `serena → lsp → grep` (or the next available layer); Serena → `lsp → grep`;
     ast-grep → `grep`; Context7 → `WebSearch/WebFetch`; DeepWiki → `WebFetch` of the repository.
4. **Outcome** — the last line of your reply, exactly one of:
   - `Doctor: failed: node ≥ 20 required` — node missing or older than 20;
   - `Doctor: completed with warnings` — any other row not `ok`;
   - `Doctor: completed` — every row `ok`.

| Tool | Detection | Install / fix command |
|---|---|---|
| node | `node -v` ≥ 20 | `winget install OpenJS.NodeJS.LTS` |
| git | `git --version` | `winget install Git.Git` |
| Claude Code | `claude --version` ≥ 2.1.295 | `claude update`, or update the Claude desktop app (which bundles its own Claude Code) |
| ripwire | `ripwire --version` (0.6.x) | download `ripwire-<version>-windows-x64.zip` from `github.com/redhat-et/ripwire/releases`, check it against the published `.sha256`, extract it and add the extracted folder to the user PATH |
| Serena | `serena --version` (1.7.x) | `winget install astral-sh.uv` then `uv tool install -p 3.13 "serena-agent==1.7.*"`; keep uv and Node on PATH |
| ast-grep | `ast-grep --version` | `npm install -g @ast-grep/cli` |
| Task tools | `CLAUDE_CODE_ENABLE_TODO_TOOLS` is `1` | add `"env": { "CLAUDE_CODE_ENABLE_TODO_TOOLS": "1" }` to `~/.claude/settings.json` |
| Context7 | MCP `resolve-library-id` probe | check network; endpoint `https://mcp.context7.com/mcp` |
| DeepWiki | MCP `read_wiki_structure` probe on `oraios/serena` | check network; endpoint `https://mcp.deepwiki.com/mcp` |
