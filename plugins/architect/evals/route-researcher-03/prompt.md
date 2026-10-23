---
description: "must route to architect:sdd-researcher (trigger words: research, public repositories, standards)"
tags: [routing, must-route, sdd-researcher]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Research how public repositories implement idempotency keys for payment APIs, and what the IETF draft on the Idempotency-Key header says. Write it up as a sourced research note.

Give this to the matching Architect specialist agent.
