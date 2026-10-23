---
description: "must route to architect:sdd-test-designer (trigger words: definition of done)"
tags: [routing, must-route, sdd-test-designer]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Write the definition of done of a small change that adds coupon codes at checkout, with these requirements:

- REQ-101: WHEN a customer applies a valid coupon code at checkout, THE checkout SHALL reduce the order total before tax by the coupon's percentage.
- REQ-102: WHEN a customer applies an expired coupon, THE checkout SHALL refuse it and show its expiry date.
- REQ-103: THE checkout SHALL accept at most one coupon per order.

Inherit these global DoD items: all automated tests pass in CI; a second person reviews the change.

If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.
