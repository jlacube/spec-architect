---
description: "must route to architect:sdd-cartographer (trigger words: blast radius, callers, hotspots, evidence)"
tags: [routing, must-route, sdd-cartographer]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

This is the part of our brownfield TypeScript codebase that matters:

```ts
// src/checkout/discount.ts
export function applyDiscount(totalCents: number, pct: number): number {
  return Math.round((totalCents * (100 - pct)) / 100);
}

// src/cart/summary.ts
import { applyDiscount } from "../checkout/discount";
export const cartTotal = (lines: { priceCents: number }[], pct: number) => applyDiscount(lines.reduce((s, l) => s + l.priceCents, 0), pct);

// src/billing/invoice.ts
import { applyDiscount } from "../checkout/discount";
export const invoiceTotal = (inv: { amountCents: number; discountPct: number }) => applyDiscount(inv.amountCents, inv.discountPct);

// tests/cart.test.ts
test("cart total with 10 %", () => expect(cartTotal([{ priceCents: 1000 }], 10)).toBe(900));
```

Map the blast radius of changing applyDiscount to take a Coupon object instead of a percentage: its callers, the tests that reach it and the hotspots, with an evidence entry for each claim.

If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.
