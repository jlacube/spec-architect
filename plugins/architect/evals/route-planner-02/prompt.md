---
description: "must route to architect:sdd-planner (trigger words: rollout, hand-off)"
tags: [routing, must-route, sdd-planner]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Write the rollout and rollback plan and the implementer hand-off, with the ordered task list, for shipping coupon codes behind a feature flag. The work: a coupon service, the checkout integration, a monthly report and a database migration.

Give this to the matching Architect specialist agent.
