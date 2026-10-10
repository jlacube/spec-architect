---
id: C001-ADR-004
artifact: plan/adr
change: CHG-001
phase: 20-plan
status: draft
---

# C001-ADR-004 — Implementers are plain Claude Code sessions in this repository

## Context and problem

The suite stops at the hand-off (Q2). Someone must execute this plan, and that execution
should also test whether the hand-off stands on its own (C001-SC-04).

## Considered options

Options analysis: `../questions-log.md` Round 1, Q-plan-04 (4 candidates, 3 presented).

1. Fresh plain Claude Code sessions following `handoff.md` (recommended)
2. Superpowers executing-plans
3. The planning session continuing
4. Codex CLI (rejected: not installed on the reference machine)

## Decision outcome

Option 1, chosen by P-01 ("Plain Claude Code sessions in this repo (Recommended)"). One
milestone of a dogfood change is executed with Superpowers in T-074 to cover the second
implementer of C001-SC-04.

## Consequences

- `handoff.md` must be self-sufficient; any question an implementer asks about missing
  information is logged as a hand-off defect.
- Progress uses the frontmatter fallback until T-026 delivers `sdd task set`.
- Affects: `handoff.md`, T-026 placement in M-2, C001-COMP-06.
