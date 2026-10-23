---
description: "must route to architect:sdd-cartographer (trigger words: codebase, baseline survey, evidence)"
tags: [routing, must-route, sdd-cartographer]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Do the baseline survey of this checkout code for a brownfield change: which modules compute totals, who calls them and which tests cover them. Back every claim with an evidence entry.

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

Give this to the matching Architect specialist agent.
