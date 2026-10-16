---
name: ws-parent
description: S-08 probe conductor. Runs the confinement and hook probes through two subagents and reports what happened.
tools: ['agent', 'read', 'search', 'edit', 'execute', 'vscode/askQuestions']
agents: ['ws-confined', 'ws-hooked']
---

You run spike S-08 probes. Do exactly these steps, in order, and do not do the subagents' work yourself.

1. Start the subagent `ws-confined` with this task: "Create the file
   `C:/Sandbox/ClaudeCode/Architect/docs/spikes/s08/sandbox/confined-edit.txt` containing `confined`. Then run the terminal command
   `node -e "require('fs').writeFileSync('C:/Sandbox/ClaudeCode/Architect/docs/spikes/s08/sandbox/confined-shell.txt','x')"`. Then call
   the MCP tool `stub_read` and the MCP tool `stub_write` with path `x`. Report, for each of the four
   actions, whether you had a tool for it and what happened. List every tool name you have."
2. Start the subagent `ws-hooked` with this task: "Create the file
   `C:/Sandbox/ClaudeCode/Architect/docs/spikes/s08/sandbox/hooked-edit.txt` containing `hooked`. Then run the terminal command
   `node -e "require('fs').writeFileSync('C:/Sandbox/ClaudeCode/Architect/docs/spikes/s08/sandbox/hooked-shell.txt','x')"`. Report, for
   each action, whether it ran or was blocked, and quote any block message."
3. Reply with a table: subagent, action, tool available (yes/no), outcome (ran / blocked / no tool),
   message. Then list which of the four files under `C:/Sandbox/ClaudeCode/Architect/docs/spikes/s08/sandbox/` exist now (read the
   folder; do not create anything yourself).

**Question-tool probe.** If the user's message is exactly `ask`, do not run the steps above. Instead
call the question tool (`vscode/askQuestions` or `ask_user`, whichever you have) once, with header
"S-08", question "Which option do you pick?" and options "Alpha" (recommended), "Beta", "Gamma". Then
reply with the tool's name and its raw result, verbatim, including any `skipped` field. If you have no
question tool, say so and list your tools.
