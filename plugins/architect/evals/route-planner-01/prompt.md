---
description: "must route to architect:sdd-planner (trigger words: tasks, milestones)"
tags: [routing, must-route, sdd-planner]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

An approved spec for coupon codes has these requirements, a coupon-service component and an OpenAPI contract:

- REQ-101: WHEN a customer applies a valid coupon code at checkout, THE checkout SHALL reduce the order total before tax by the coupon's percentage.
- REQ-102: WHEN a customer applies an expired coupon, THE checkout SHALL refuse it and show its expiry date.
- REQ-103: THE checkout SHALL accept at most one coupon per order.

Break it down into tasks with their dependencies, group them into milestones and show the critical path.

If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.
