---
description: "must route to architect:sdd-auditor, must not route to architect:sdd-critic (trigger words: lint (not review))"
tags: [routing, must-not-route, sdd-auditor, not-sdd-critic]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Run sdd lint on the plan phase of the SDD workspace here and report the error and warning counts; zero findings or no workspace is a valid answer.

If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.
