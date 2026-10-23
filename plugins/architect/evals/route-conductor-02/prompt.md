---
description: "must route to architect:sdd-conductor (main session: hand over, no subagent) (trigger words: spec-driven workflow, interview)"
tags: [routing, must-route, sdd-conductor]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Start the spec-driven workflow for a new change and interview me about it as we go, in rounds of questions with options.

If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.
