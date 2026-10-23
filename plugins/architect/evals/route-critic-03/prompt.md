---
description: "must route to architect:sdd-critic (trigger words: review, gaps)"
tags: [routing, must-route, sdd-critic]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Is this plan ready for its gate? Review it against the plan rubric and list the gaps as evidence-backed findings.

- T-1 coupon service (no estimate)
- T-2 checkout integration, depends on T-3
- T-3 monthly report, depends on T-2
- Milestone M-1: "done when it works"

Give this to the matching Architect specialist agent.
