---
description: "must route to architect:sdd-auditor (trigger words: lint, trace)"
tags: [routing, must-route, sdd-auditor]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Run the sdd lint and traceability checks on the SDD workspace here and report the counts per file. If there is no workspace, report what the commands say.

Give this to the matching Architect specialist agent.
