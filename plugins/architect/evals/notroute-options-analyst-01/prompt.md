---
description: "must route to architect:sdd-researcher, must not route to architect:sdd-options-analyst (trigger words: library docs (not options))"
tags: [routing, must-not-route, sdd-researcher, not-sdd-options-analyst]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Collect sourced documentation on how Redis and PostgreSQL implement atomic counters, with links and dates. Just the facts, no recommendation.

If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.
