---
description: "must route to architect:sdd-critic, without the delegation hint (trigger words: review, gaps, ambiguity)"
tags: [routing, implicit, must-route, sdd-critic]
runs: 1
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Review this spec before its gate:

- REQ-101: WHEN a customer applies a valid coupon code at checkout, THE checkout SHALL reduce the order total before tax by the coupon's percentage.
- REQ-102: WHEN a customer applies an expired coupon, THE checkout SHALL refuse it and show its expiry date.
- REQ-103: THE checkout SHALL accept at most one coupon per order.
- NFR-1: the checkout shall be fast.

Find gaps, ambiguity, contradictions and untestable statements, and write the critic report.
