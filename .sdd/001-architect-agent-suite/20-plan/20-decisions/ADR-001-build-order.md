---
id: C001-ADR-001
artifact: plan/adr
change: CHG-001
phase: 20-plan
status: draft
---

# C001-ADR-001 — Build order: spikes → CLI core → agents → rest

## Context and problem

213 requirements across 11 capabilities have to be built in an order that limits rework and
risk. Several design points rest on unverified platform behaviour (critic CR-2).

## Considered options

Options analysis: `../questions-log.md` Round 1, Q-plan-01 (5 candidates, 3 presented).

1. Spikes → CLI core → agents → hooks/archive → packaging (recommended)
2. Agent vertical slice first
3. Thin slice of everything, then deepen
4. CLI only in this change, agents later (rejected: G-01/G-02 need agents in v1)
5. Hooks/guards first (rejected: nothing to guard yet)

## Decision outcome

Option 1, chosen by P-01 ("Spikes → CLI core → agents → rest (Recommended)").

## Consequences

- Positive: the lint and gate engine validate every later artifact; the design is corrected
  early if a spike fails.
- Negative: no end-to-end agent demonstration before M-3.
- Affects: C001-COMP-03 … COMP-07 first; milestone structure in `10-strategy.md`; constraint
  C001-CON-13 (pure lint rules) matters early.
