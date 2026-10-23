---
description: "must route to architect:sdd-test-designer, must not route to architect:sdd-spec-writer (trigger words: scenarios (not requirements))"
tags: [routing, must-not-route, sdd-test-designer, not-sdd-spec-writer]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Write the Gherkin acceptance scenarios, including the boundary and error cases, for this requirement: REQ-102 WHEN a customer applies an expired coupon, THE checkout SHALL refuse it and show its expiry date.

Give this to the matching Architect specialist agent.
