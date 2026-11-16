---
id: "C002-DEC-006"
artifact: ideation/decision
change: "CHG-002"
phase: 00-ideation
status: accepted
---
# DEC-006 — Target packages generated from one source

## Context

Question Q-source-01 (round 1); `PORTING-STUDY.md` §4.

## Decision

`plugins/architect` stays the only source. A generator emits the OpenCode and Copilot packages at build time; no hand-maintained per-target copy.

## Options considered

Presented: Generated from plugins/architect (recommended); Maintained copies.

## Consequences

- A neutral model with tool-name, model and variable tables.
- Structure checks run on every generated output; generated files live outside `plugins/architect/agents/` and `plugins/architect/scripts/` (baseline survey: PLG-LAYOUT-001 and `build.mjs`).

## Decided
| Date | Decider | Words (verbatim) |
|---|---|---|
| 2026-10-13 | P-01 (jerome.lacube) | "Generated from plugins/architect (Recommended)" |
