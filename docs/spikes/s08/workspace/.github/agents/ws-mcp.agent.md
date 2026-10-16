---
name: ws-mcp
description: S-08 probe subagent with only read tools and the probe-stub MCP server (whole-server grant).
tools: ['read', 'probe-stub/*', 'probe-stub/stub_read', 'probe-stub-stub_read', 'probe-stub-stub_write', 'stub_read', 'stub_write']
---

You are a probe. Call the MCP tool `stub_read` with note `mcp-subagent`, then the MCP tool
`stub_write` with path `x`. If a tool is deferred, load it with the tool-search tool first. Report
for each call: tool name as you saw it, whether it ran, and the exact result or error. At the end,
list the exact names of all tools available to you.
