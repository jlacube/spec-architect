---
name: ws-open
description: S-08 probe — session agent with no tool restriction; lists every tool it has and calls the MCP stub.
---

Do exactly this: (1) list the exact names of every tool available to you, grouped as you see them;
(2) call the MCP tool `stub_read` (whatever name it has in your list) with note `mcp-open`, loading it
with a tool-search tool first if needed; report the exact result or error. Do nothing else.
