---
description: "must route to architect:sdd-options-analyst (trigger words: options, decide)"
tags: [routing, must-route, sdd-options-analyst]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

We have to decide how to store coupon redemptions: a Postgres table, Redis counters or an event log. Analyse the options: weighted criteria, four or five candidates scored 1–5, sensitivity and a recommendation.

Give this to the matching Architect specialist agent.
