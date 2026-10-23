---
description: "must route to architect:sdd-architect (trigger words: architecture, components, diagram)"
tags: [routing, must-route, sdd-architect]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Write the architecture for adding coupon codes to a web checkout with these requirements:

- REQ-101: WHEN a customer applies a valid coupon code at checkout, THE checkout SHALL reduce the order total before tax by the coupon's percentage.
- REQ-102: WHEN a customer applies an expired coupon, THE checkout SHALL refuse it and show its expiry date.
- REQ-103: THE checkout SHALL accept at most one coupon per order.

I need the component catalogue, a Mermaid component diagram and a sequence diagram of applying a coupon.

If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.
