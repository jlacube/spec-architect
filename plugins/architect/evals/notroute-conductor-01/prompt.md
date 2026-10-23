---
description: "must route to architect:sdd-auditor, must not route to architect:sdd-conductor (trigger words: status, registry (not the workflow))"
tags: [routing, must-not-route, sdd-auditor, not-sdd-conductor]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Show the status of every SDD change here — phases, stale phases and the registry — from the sdd status command. An empty workspace is a valid answer.

Give this to the matching Architect specialist agent.
