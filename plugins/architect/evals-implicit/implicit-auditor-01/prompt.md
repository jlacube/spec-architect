---
description: "must route to architect:sdd-auditor, without the delegation hint (trigger words: lint, trace)"
tags: [routing, implicit, must-route, sdd-auditor]
runs: 1
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Run the sdd lint and traceability checks on the SDD workspace here and report the counts per file. If there is no workspace, report what the commands say.
