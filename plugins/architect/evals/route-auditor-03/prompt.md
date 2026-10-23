---
description: "must route to architect:sdd-auditor (trigger words: lint, trace, status)"
tags: [routing, must-route, sdd-auditor]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Give me the deterministic audit of the SDD workspace here — lint counts, traceability coverage and stale phases — from the sdd commands only, even if they find nothing.

Give this to the matching Architect specialist agent.
