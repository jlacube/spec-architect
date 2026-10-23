---
description: "must route to architect:sdd-spec-writer (trigger words: NFR)"
tags: [routing, must-route, sdd-spec-writer]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Write the NFRs of a checkout capability — customers pay for their basket online, peaks of 500 orders a minute, it must work with screen readers: response time, availability and accessibility, each with a metric, a threshold and a method.

Give this to the matching Architect specialist agent.
