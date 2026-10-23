---
description: "must route to architect:sdd-cartographer (trigger words: callers, evidence)"
tags: [routing, must-route, sdd-cartographer]
runs: 3
model: opus
max_turns: 6
timeout_seconds: 120
allowed_tools: [Agent]
disallowed_tools: [Skill]
---

Find every caller of OrderService.total() in the code below and the test reach of each, as evidence for a regression set.

```ts
// src/orders/service.ts
export class OrderService { total(o: Order) { return o.lines.reduce((s, l) => s + l.cents, 0); } }

// src/api/orders.ts
router.get("/orders/:id/total", (req, res) => res.json({ total: orders.total(load(req.params.id)) }));

// src/reports/monthly.ts
export const revenue = (all: Order[]) => all.reduce((s, o) => s + orders.total(o), 0);

// tests/orders.test.ts
test("total sums the lines", () => expect(new OrderService().total(order([100, 250]))).toBe(350));
```

Give this to the matching Architect specialist agent.
