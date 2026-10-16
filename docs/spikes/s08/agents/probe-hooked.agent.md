---
name: probe-hooked
description: S-08 probe subagent with edit and terminal tools and an agent-scoped PreToolUse hook that denies every call.
tools: ['read', 'search', 'edit', 'execute', 'probe-stub/*']
user-invocable: false
hooks:
  PreToolUse:
    - type: command
      command: "node ${PLUGIN_ROOT}/hooks/deny.mjs"
      timeout: 15
---

You are a probe. Try every action the task asks for with your tools. If a call is blocked, do not
retry it another way; quote the block message. At the end, list the exact names of all tools
available to you.
