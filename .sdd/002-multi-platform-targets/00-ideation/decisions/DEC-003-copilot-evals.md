---
id: "C002-DEC-003"
artifact: ideation/decision
change: "CHG-002"
phase: 00-ideation
status: accepted
---
# DEC-003 — Evaluation of the Copilot target

## Context

VS Code has no headless chat mode, so its Local harness (where the MCP server, askQuestions and gates run for P-01) cannot be scripted; Copilot CLI can run headless (`-p`, `--agent`, JSON output). Facts: [C002-R-001](../research/R-001-platform-facts.md). Question Q-eval-01 (material: it sets a release-gate condition).

## Decision

Automate what Copilot CLI covers (agent routing, guard behaviour through the MCP server, non-interactive scenarios) and keep a recorded manual VS Code checklist (MCP server boundary, askQuestions interview and gate, end-to-end phase) run before each release.

## Options considered

Presented: CLI evals + manual VS Code checklist — recommended; manual VS Code checks only.

## Consequences

- A Copilot eval harness alongside the Claude Agent SDK harness (and an OpenCode one).
- The release gate requires the manual VS Code record for the Copilot target.

## Decided
| Date | Decider | Words (verbatim) |
|---|---|---|
| 2026-10-14 | P-01 (jerome.lacube) | "CLI evals + manual VS Code checklist (Recommended)" |
