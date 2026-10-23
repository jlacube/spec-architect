---
description: "must route to architect:sdd-test-designer (trigger words: acceptance criteria, scenarios)"
tags: [routing, must-route, sdd-test-designer]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

These requirements are written:

- REQ-101: WHEN a customer applies a valid coupon code at checkout, THE checkout SHALL reduce the order total before tax by the coupon's percentage.
- REQ-102: WHEN a customer applies an expired coupon, THE checkout SHALL refuse it and show its expiry date.
- REQ-103: THE checkout SHALL accept at most one coupon per order.

Write their acceptance criteria and Gherkin scenarios, with the coverage table.

Give this to the matching Architect specialist agent.
