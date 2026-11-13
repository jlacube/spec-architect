---
description: Check the toolchain (node, git, Claude Code, ripwire, Serena, ast-grep, Context7, DeepWiki), print the status table with fixes, record toolchain.md and set up Serena's data folder.
argument-hint: ""
---

This command runs in the `architect:sdd-conductor` main session. If you are not that agent, reply that P-01 should start `claude --agent architect:sdd-conductor` and run the command there, and do nothing else.

1. **Serena data folder.** Run `sdd serena-config "${CLAUDE_PLUGIN_DATA}"` and report its line
   (created, updated or unchanged). It keeps Serena's project data in the plugin data folder (never
   `.serena/` in the repository) and turns the dashboard off, from Serena's next start.
2. **Probe.** First dispatch `sdd-researcher` with a probe brief: at most one call per remote
   server, Context7 `resolve-library-id` with a short library name and DeepWiki
   `read_wiki_structure` on `oraios/serena`; its reply is one outcome line per server:
   `<server>: ok`, `<server>: failed: <error text as returned>`, `<server>: refused: <host text as
   returned>` or `<server>: not offered`. Then dispatch `sdd-cartographer` to write
   `.sdd/_constitution/toolchain.md` (code-discovery skill, toolchain record): one row each for
   node, git, Claude Code, ripwire, Serena, ast-grep, Context7, DeepWiki with detected, version,
   path or endpoint, fallback; its brief holds the researcher's two lines, and it makes no Context7
   or DeepWiki call. Probes: `--version` for the command-line tools (ripwire: `ripwire --version`,
   never `--doctor`). Without `.sdd/`, probe the same way and skip the file.
3. **Report** a table with the columns Tool, Status, Version, Fallback, Fix — one row per tool in
   the order above. Status: `ok`, `missing`, `unreachable` (remote servers) or `error` (present but
   unusable or too old), and `untested` for a remote server that no probe call reached. Fix: for
   every non-ok row, the command of the remedies table below.
   - node: `error` below version 20.
   - Claude Code: `error` below 2.1.295 (`claude --version`).
   - Context7 and DeepWiki, from the researcher's line for the server (`<endpoint>` its endpoint in
     the remedies table): `ok` → `ok`, Fix empty; `failed: <text>` → `unreachable`, Fix
     `check network; endpoint <endpoint>`; `not offered` → `untested`, Fix `the researcher was
     offered no <server> tool: turn on or start the <server> MCP server for the researcher (it is in
     the package's MCP configuration); if it is on, check network; endpoint <endpoint>`;
     `refused: <text>` → `untested`, Fix `allow the <server> tools for the researcher`; no line for
     the server → `untested`, Fix `no probe outcome from the researcher; run the doctor again`.
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
| Context7 | MCP `resolve-library-id` probe by `sdd-researcher` | unreachable (failed): check network; endpoint `https://mcp.context7.com/mcp`; untested (not offered): the researcher was offered no Context7 tool: turn on or start the Context7 MCP server for the researcher (it is in the package's MCP configuration); if it is on, check network; endpoint `https://mcp.context7.com/mcp`; untested (refused): allow the Context7 tools for the researcher; untested (no line): no probe outcome from the researcher; run the doctor again |
| DeepWiki | MCP `read_wiki_structure` probe on `oraios/serena` by `sdd-researcher` | unreachable (failed): check network; endpoint `https://mcp.deepwiki.com/mcp`; untested (not offered): the researcher was offered no DeepWiki tool: turn on or start the DeepWiki MCP server for the researcher (it is in the package's MCP configuration); if it is on, check network; endpoint `https://mcp.deepwiki.com/mcp`; untested (refused): allow the DeepWiki tools for the researcher; untested (no line): no probe outcome from the researcher; run the doctor again |
