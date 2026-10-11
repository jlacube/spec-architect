---
name: nfr-catalogue
description: Writing non-functional requirements for an SDD spec — ISO/IEC 25010 categories, the NFR entry fields (metric, threshold, method, environment), inherited constitution defaults, and how to mark a threshold that only the spec owner can set. Use when writing 30-nfr/ or the NFR section of a lite spec.
---

# NFR catalogue

An NFR is a measurable quality of the system: it has a metric, a threshold and a method that a
test or a measurement can check.

## Categories (ISO/IEC 25010)

Functional suitability · Performance efficiency (time behaviour, resource utilisation,
capacity) · Compatibility · Usability · Reliability (availability, fault tolerance,
recoverability) · Security (confidentiality, integrity, non-repudiation, accountability,
authenticity) · Maintainability · Portability. Start from the constitution's **NFR defaults**;
write an NFR only where this change needs a different or additional threshold.

## Entry

```markdown
### C004-NFR-101 — Checkout latency with a coupon
- **Category:** Performance efficiency / time behaviour
- **Statement:** WHEN a customer applies a coupon, THE checkout SHALL return the discounted total within the threshold.
- **Metric:** server-side response time of the apply-coupon request, p95
- **Threshold:** ≤ 300 ms at 50 requests per second
- **Method:** load test in CI (k6 script), 10 minutes steady state
- **Environment:** staging, production-sized data set
- **Rationale:** <constitution default, research note or DEC ID>
- **DoD:** C004-DOD-004
```

- The Statement is EARS (ears-requirements skill) and refers to the threshold instead of
  repeating it.
- Metric and threshold carry units; the method says how it is measured and where.
- **Missing value:** when only P-01 can set a threshold (a latency target, an availability
  figure, a budget), write `[NEEDS CLARIFICATION: Q-spec-<nn>]` in the Threshold field and return
  that question, with the same ID, in your `questions` block. Never invent a number.
- Each NFR is covered by a DoD item (`70-dod.md`) with the evidence type of its method.
