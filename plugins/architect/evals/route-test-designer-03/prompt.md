---
description: "must route to architect:sdd-test-designer (trigger words: test plan)"
tags: [routing, must-route, sdd-test-designer]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Write the test plan for these acceptance scenarios: TS-101 a valid coupon reduces the total before tax; TS-102 an expired coupon is refused with its date; TS-103 a second coupon is refused. Map each to a test case with its level, fixture and environment.

Give this to the matching Architect specialist agent.
