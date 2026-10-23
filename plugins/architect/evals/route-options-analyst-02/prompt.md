---
description: "must route to architect:sdd-options-analyst (trigger words: trade-off)"
tags: [routing, must-route, sdd-options-analyst]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

A team of four is starting a coupon service: monorepo or a separate repository? Give me the trade-off analysis with weighted criteria and scored candidates, and write it up as an options analysis.

If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.
