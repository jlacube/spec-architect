---
description: "must route to architect:sdd-conductor (main session: hand over, no subagent) (trigger words: ideation → specification → planning, gates)"
tags: [routing, must-route, sdd-conductor]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Take my idea through the Architect workflow — ideation, then the specification, then the plan, with a gate at each phase: customers should be able to enter coupon codes at checkout.

If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.
