---
description: "must route to architect:sdd-cartographer, must not route to architect:sdd-researcher (trigger words: codebase, callers (not research))"
tags: [routing, must-not-route, sdd-cartographer, not-sdd-researcher]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

In our code below, find which modules call the payment gateway client and how deep the call chains go, with evidence for each.

```ts
// src/billing/gateway.ts
export const gateway = { charge: (cents: number, card: Card) => http.post("/charge", { cents, card }) };

// src/checkout/payments.ts
import { gateway } from "../billing/gateway";
export const capture = (intent: Intent, card: Card) => gateway.charge(intent.cents, card);

// src/checkout/flow.ts
import { capture } from "./payments";
export const placeOrder = (cart: Cart, card: Card) => capture(createIntent(cart), card);

// src/subscriptions/renewal.ts
import { gateway } from "../billing/gateway";
export const renew = (sub: Sub) => gateway.charge(sub.priceCents, sub.card);
```

Give this to the matching Architect specialist agent.
