---
description: "must route to architect:sdd-critic, must not route to architect:sdd-planner (trigger words: review, gaps (not plan))"
tags: [routing, must-not-route, sdd-critic, not-sdd-planner]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Review this plan for gaps and ambiguity before its gate:

- T-1 coupon service (no estimate)
- T-2 checkout integration, depends on T-3
- T-3 monthly report, depends on T-2
- Milestone M-1: "done when it works"

Give this to the matching Architect specialist agent.
