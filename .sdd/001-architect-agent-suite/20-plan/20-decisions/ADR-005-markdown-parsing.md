---
id: C001-ADR-005
artifact: plan/adr
change: CHG-001
phase: 20-plan
status: draft
---

# C001-ADR-005 — Custom line-oriented artifact parser with `yaml` for frontmatter

## Context and problem

See `OA-005-markdown-parsing.md`.

## Considered options

Five candidates in C001-OA-005; presented A (custom line parser), B (remark), C (markdown-it).

## Decision outcome

A — a line-oriented block parser specialised to the artifact grammar of C001-IF-03, plus the
ISC-licensed `yaml` package for frontmatter, bundled by esbuild. Taken by the planning author
under C001-ADR-002. Not material to P-01's scope decisions; reviewable at G3.

## Consequences

- C001-CON-13 holds: rules consume the parsed graph only.
- Templates (T-015) and the parser (T-010) must evolve together; template changes need
  parser fixtures.
- Affects: C001-COMP-04; RISK-007.
