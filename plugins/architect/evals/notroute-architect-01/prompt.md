---
description: "must route to architect:sdd-planner, must not route to architect:sdd-architect (trigger words: tasks, estimates (not architecture))"
tags: [routing, must-not-route, sdd-planner, not-sdd-architect]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Break this architecture into implementation tasks with estimates and dependencies: components checkout, coupon service and order store; the coupon service exposes validate and apply; the checkout calls it before tax.

Give this to the matching Architect specialist agent.
