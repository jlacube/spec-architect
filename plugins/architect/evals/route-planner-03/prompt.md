---
description: "must route to architect:sdd-planner (trigger words: plan, tasks)"
tags: [routing, must-route, sdd-planner]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Plan the coupons work: a task file per unit of work (coupon service, checkout integration, expiry check, monthly report), each with its estimate and depends_on, ordered into milestones.

If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.
