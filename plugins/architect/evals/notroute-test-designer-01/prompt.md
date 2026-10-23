---
description: "must route to architect:sdd-spec-writer, must not route to architect:sdd-test-designer (trigger words: EARS requirement (not acceptance))"
tags: [routing, must-not-route, sdd-spec-writer, not-sdd-test-designer]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Write this as an EARS requirement with its user story: when a customer applies an expired coupon, the checkout refuses it and shows the expiry date.

Give this to the matching Architect specialist agent.
