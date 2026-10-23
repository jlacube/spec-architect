---
description: "must route to architect:sdd-auditor (trigger words: status, registry)"
tags: [routing, must-route, sdd-auditor]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Refresh the SDD registry and status with the sdd commands, and tell me which phases are stale. An empty workspace is a valid answer; report what the commands say.

If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.
