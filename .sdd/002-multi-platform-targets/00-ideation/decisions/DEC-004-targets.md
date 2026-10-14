---
id: "C002-DEC-004"
artifact: ideation/decision
change: "CHG-002"
phase: 00-ideation
status: accepted
---
# DEC-004 — Targets in scope

## Context

Question Q-scope-01 (questions-log round 1); analysis `PORTING-STUDY.md` §1 (fit per platform).

## Decision

CHG-002 targets OpenCode and GitHub Copilot in VS Code. Copilot CLI and the Copilot cloud agent are not targets.

## Options considered

Presented: OpenCode + Copilot VS Code (recommended); OpenCode only first; OpenCode + all Copilot. Rejected: Copilot cloud agent (cannot hold a gate).

## Consequences

- Two emitters (OpenCode, Copilot VS Code) and two enforcement mechanisms.
- Copilot CLI is still used as an evaluation harness (C002-DEC-003), not as a supported target.

## Decided
| Date | Decider | Words (verbatim) |
|---|---|---|
| 2026-10-13 | P-01 (jerome.lacube) | "OpenCode + Copilot VS Code (Recommended)" |
