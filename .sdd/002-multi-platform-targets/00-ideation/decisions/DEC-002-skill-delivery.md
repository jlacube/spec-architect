---
id: "C002-DEC-002"
artifact: ideation/decision
change: "CHG-002"
phase: 00-ideation
status: accepted
---
# DEC-002 — Skill delivery on targets without preloading

## Context

OpenCode and Copilot load skills on demand by description; Architect agents rely on having their procedure skills in context from the start (Claude `skills:` preload). Analysis: [C002-OA-002](../options/OA-002-skill-delivery.md).

## Decision

The generator inlines each agent's preloaded skills into the generated agent body for OpenCode and Copilot, within the skill budgets of the constitution (≤ 24,000 characters per skill, ≤ 64,000 per agent); an agent whose generated body exceeds the budget fails the structure check.

## Options considered

Presented: inline at generation — 4.45, recommended; hybrid (inline procedures, load catalogues on demand) — 4.25; load instruction in the body — 3.55. Rejected: host file include, command- or fork-based delivery (see OA-002).

## Consequences

- Deterministic: the same procedures are in context on every target.
- The conductor sits close to the budget (estimated 46,000–51,000 characters); the hybrid option is the fallback for any agent that exceeds it.
- The size check runs on the generated outputs, not only on the Claude source.

## Decided
| Date | Decider | Words (verbatim) |
|---|---|---|
| 2026-10-14 | P-01 (jerome.lacube) | "Inline at generation (Recommended)" |
