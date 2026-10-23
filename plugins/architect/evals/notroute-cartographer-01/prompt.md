---
description: "must route to architect:sdd-researcher, must not route to architect:sdd-cartographer (trigger words: public repositories, prior art (not codebase))"
tags: [routing, must-not-route, sdd-researcher, not-sdd-cartographer]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Research how other open-source projects structure a plugin marketplace manifest — public repositories and their docs, with dated sources.

If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.
