# S-08 probe plugin (throwaway, never shipped)

Probe plugin of spike S-08 (C002-T-002). Copilot (legacy) plugin format: `plugin.json`, `agents/*.agent.md`,
`hooks.json`, `.mcp.json`, `commands/`. VS Code and Copilot CLI both load it.

| File | Probe |
|---|---|
| `agents/probe-parent.agent.md` | starts the two subagents and reports a results table |
| `agents/probe-confined.agent.md` | tool list without edit or terminal tools, only `probe-stub/stub_read` (confinement, per-tool MCP grant) |
| `agents/probe-hooked.agent.md` | edit and terminal tools, agent-scoped `PreToolUse` hook `hooks/deny.mjs` (deny JSON + exit 2) |
| `hooks.json` | plugin-level audit hook on `PreToolUse`, `SubagentStart`, `SubagentStop` (logs and allows) |
| `.mcp.json`, `mcp/stub.mjs` | stub MCP server `probe-stub` with `stub_read` and `stub_write`; logs every call |
| `commands/probe-ask.prompt.md` | the question tool (`vscode/askQuestions`) |

Evidence lands in `logs/hooks.jsonl`, `logs/mcp.jsonl` and `sandbox/` (both git-ignored).

## VS Code steps (P-01)

1. Settings (JSON), then reload the window:
   ```json
   "chat.plugins.enabled": true,
   "chat.pluginLocations": { "C:\\Sandbox\\ClaudeCode\\Architect\\docs\\spikes\\s08": true },
   "chat.askQuestions.enabled": true,
   "chat.useHooks": true
   ```
   The workspace must be trusted (agent-scoped hooks need it).
2. Open the Chat view, pick the agent **probe-parent** in the agent picker, and send: `run the probes`.
   Allow tool confirmations when asked (the probes must reach the hooks).
3. When it finishes, copy its reply (the table) into the chat with Claude.
4. In a new chat, run the prompt `/probe-ask`. Answer once by picking an option; run it again and
   press Escape to skip; copy both raw results.
5. Turn `chat.askQuestions.enabled` off, reload, run `/probe-ask` again, copy the reply; turn it back on.
6. Open the model picker and note the exact names of the Claude Opus, Sonnet and Haiku models.
7. Note the AI Credits used (GitHub → Settings → Billing → Copilot usage) before step 2 and after step 5.
