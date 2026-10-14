---
id: "C002-DEC-008"
artifact: ideation/decision
change: "CHG-002"
phase: 00-ideation
status: accepted
---
# DEC-008 — Citing CHG-001 requirements before CHG-001 is archived

## Context

Question Q-sequence-01 (round 3); critic finding CR-1: LINT-DELTA-001 accepts only IDs present in `_living/`, which CHG-001 reaches at its archive (C001-T-075), and C001-T-075 waits for this dogfood (C001-T-074).

## Decision

CHG-002's spec cites the CHG-001 requirements it changes as MODIFIED deltas, and P-01 waives LINT-DELTA-001 for those citations at CHG-002's G2 and G3. The waiver is temporary: the IDs reach `_living/` at C001-T-075, before CHG-002 can be archived.

## Options considered

Presented: Cite + waive at G2/G3 (recommended); Lint accepts active earlier changes (a CHG-001 defect first); Archive CHG-001 first. Rejected: write the changes as ADDED (misstates the change).

## Consequences

- The gate summaries of G2 and G3 list the waived LINT-DELTA-001 findings.
- C001-T-075 (archive CHG-001) must precede CHG-002's archive.

## Decided
| Date | Decider | Words (verbatim) |
|---|---|---|
| 2026-10-14 | P-01 (jerome.lacube) | "Cite + waive at G2/G3 (Recommended)" |
