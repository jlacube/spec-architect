---
description: "must route to architect:sdd-architect (trigger words: interfaces)"
tags: [routing, must-route, sdd-architect]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Define the interface of a coupon service — validate a code, apply it to an order, list a month's redemptions — as an OpenAPI contract, add it to the interface registry, and write its error catalogue.

Give this to the matching Architect specialist agent.
