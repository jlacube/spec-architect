## {{host_name}} wiring

- Library documentation: `mcp__plugin_architect_context7__resolve-library-id`, then
  `mcp__plugin_architect_context7__query-docs`.
- Repository knowledge: `mcp__plugin_architect_deepwiki__ask_wiki_question` (repository
  `owner/repo`); `mcp__plugin_architect_deepwiki__read_wiki_structure` and
  `mcp__plugin_architect_deepwiki__read_wiki_contents` for an overview.
- These MCP tools are deferred: load each through the `tool_search_tool` tool before its first
  call. If loading or calling fails, use degraded mode.
- Web: no web search tool is offered; fetch the pages you cite with the fetch tool (`web/fetch`).
