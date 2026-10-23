---
description: "must route to architect:sdd-architect (trigger words: ADR)"
tags: [routing, must-route, sdd-architect]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Record an ADR in MADR form: coupon validation moves out of the checkout into its own component. Link it to the constraints and components it affects: the checkout, the coupon service and the order store.

Give this to the matching Architect specialist agent.
