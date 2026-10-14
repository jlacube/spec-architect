---
id: "C002-DEC-009"
artifact: ideation/decision
change: "CHG-002"
phase: 00-ideation
status: accepted
---
# DEC-009 — Agent memory on the new targets

## Context

Question Q-memory-01 (round 3); critic finding CR-3: the MCP server has no agent identity, and neither target has native agent memory.

## Decision

The researcher and the cartographer keep no project memory folder on OpenCode or Copilot; the boundary there is `.sdd/` only. Claude Code keeps `memory: project` (C001-REQ-1103 exception).

## Options considered

Presented: No, drop it on targets (recommended); Yes, per-agent folder. Rejected: memory inside `.sdd/` (layout change); platform-native memory (none exists).

## Consequences

- Recorded as non-goal NG-4 of the ideation.
- The generator drops `memory:` from OpenCode and Copilot agents.

## Decided
| Date | Decider | Words (verbatim) |
|---|---|---|
| 2026-10-14 | P-01 (jerome.lacube) | "No, drop it on targets (Recommended)" |
