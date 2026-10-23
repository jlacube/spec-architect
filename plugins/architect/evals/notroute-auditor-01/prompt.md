---
description: "must route to architect:sdd-critic, must not route to architect:sdd-auditor (trigger words: ambiguity (not lint))"
tags: [routing, must-not-route, sdd-critic, not-sdd-auditor]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Check these requirements for ambiguity and untestable statements: REQ-1 the checkout shall be fast; REQ-2 WHEN a coupon is applied, THE checkout SHALL reduce the total appropriately.

Give this to the matching Architect specialist agent.
