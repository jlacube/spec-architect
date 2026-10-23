---
description: "must not route to any Architect agent (trigger words: general programming)"
tags: [routing, off-topic]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Write a regular expression that matches ISO 8601 calendar dates such as 2026-10-23, and explain it in two sentences.

If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.
