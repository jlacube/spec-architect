---
description: "must route to architect:sdd-researcher (trigger words: library docs)"
tags: [routing, must-route, sdd-researcher]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Look up the current library documentation of Zod for discriminated unions and refinements, and how it would validate a payload like { code, percent, expiresAt }. Cite the docs with their dates.

Give this to the matching Architect specialist agent.
