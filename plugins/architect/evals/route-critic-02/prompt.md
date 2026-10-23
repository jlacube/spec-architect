---
description: "must route to architect:sdd-critic (trigger words: critique)"
tags: [routing, must-route, sdd-critic]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Critique this ideation and give me its readiness verdict:

Problem: customers cannot use promotional codes, so marketing campaigns need manual refunds.
Goal: a customer applies one percentage coupon at checkout; expired codes are refused; finance gets a monthly report of discounts.
Out of scope: gift cards.
Open question: do coupons stack? (no owner, no phase)

Give this to the matching Architect specialist agent.
