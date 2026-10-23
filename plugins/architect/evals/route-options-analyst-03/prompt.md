---
description: "must route to architect:sdd-options-analyst (trigger words: decide, options)"
tags: [routing, must-route, sdd-options-analyst]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Help me decide between server-side rendering and a single-page app for an internal admin console: about 200 staff users, mostly forms and tables, a team of three. Weigh the options and recommend one; I'll pick at the next interview round.

Give this to the matching Architect specialist agent.
