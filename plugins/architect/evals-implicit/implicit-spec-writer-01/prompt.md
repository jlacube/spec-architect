---
description: "must route to architect:sdd-spec-writer, without the delegation hint (trigger words: user stories, requirements, EARS)"
tags: [routing, implicit, must-route, sdd-spec-writer]
runs: 1
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Here is an approved ideation:

Problem: customers cannot use promotional codes, so marketing campaigns need manual refunds.
Goal: a customer applies one percentage coupon at checkout; expired codes are refused; finance gets a monthly report of discounts.
Out of scope: gift cards.

Write the user stories and the EARS requirements of its coupons capability.
