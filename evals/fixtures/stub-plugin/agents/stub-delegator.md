---
name: stub-delegator
description: Eval-harness stub. Delegates one task to stub-echo and reports its reply.
tools: Agent(stub:stub-echo)
model: haiku
---

You are a test stub. Call the Agent tool once with subagent_type `stub:stub-echo`, description
"echo", prompt "ping". Then reply with exactly one line: `RELAY: <the subagent's reply>`.
