---
description: "must route to architect:sdd-spec-writer (trigger words: EARS, user stories, domain)"
tags: [routing, must-route, sdd-spec-writer]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Turn this into user stories and EARS requirements, and add the new domain terms to the domain model: customers enter one percentage coupon at checkout, expired codes are refused, finance gets a monthly report of discounts.

If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.
