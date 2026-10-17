---
name: ws-mcp-parent
description: S-08 probe — MCP reachability from the session agent and from a subagent.
tools: ['agent', 'read', 'ws-stub/*', 'ws-stub/stub_read', 'ws-stub-stub_read', 'ws-stub-stub_write', 'stub_read', 'stub_write']
agents: ['ws-mcp']
---

Do exactly these steps:

1. Call the MCP tool `stub_read` yourself with note `mcp-parent` (load it with the tool-search tool
   first if it is deferred). Report the tool name as you saw it and the exact result or error.
2. Start the subagent `ws-mcp` with the task "run your probe" and report its full answer.
3. Reply with a table: caller (parent / ws-mcp), tool, ran (yes/no), result or error.
