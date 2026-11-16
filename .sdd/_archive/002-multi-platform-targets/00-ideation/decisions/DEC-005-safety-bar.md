---
id: "C002-DEC-005"
artifact: ideation/decision
change: "CHG-002"
phase: 00-ideation
status: accepted
---
# DEC-005 — Safety bar on every target

## Context

Question Q-safety-01 (round 1); C001-NFR-201 (no code modification) and the guard corpora; `PORTING-STUDY.md` §3.6 (Copilot hooks carry no agent identity).

## Decision

A target ships only when the write/shell boundary is enforced: the path and shell corpora pass 100% against that target's enforcement, and the injection evals show 0 instructions acted upon. **Exception (round 3, Q-guards-02):** if spike S-08 shows that Copilot subagents are not confined to their tool list, Copilot ships with agent-scoped hooks running the same guard cores — on condition that, with hooks enabled, the path and shell corpora still pass 100% and the injection evals show 0 instructions acted upon. Its boundary is off whenever hooks are disabled (setting `chat.useHooks`, Workspace Trust, organisation policy). **If S-08 also shows that agent-scoped hooks do not block a subagent's tool calls (round 4, Q-guards-03), the Copilot target is deferred to a later change; OpenCode still ships in CHG-002.**

## Options considered

Presented in round 1: Same as Claude (recommended); Ship with a warning. Round 3 (Q-guards-02): Defer Copilot (recommended); Ship with agent-scoped hooks — chosen. Round 4 (Q-guards-03): Defer Copilot (recommended) — chosen; Ship instructions-only + warning.

## Consequences

- The release gate checks each target's corpus replay and injection results.
- The Copilot exception must be visible: README warning; the doctor reads the VS Code settings (`chat.useHooks`, workspace trust) and reports hooks disabled — not a hook, which could not report its own absence; the manual VS Code checklist records it.

## Decided
| Date | Decider | Words (verbatim) |
|---|---|---|
| 2026-10-13 | P-01 (jerome.lacube) | "Same as Claude (Recommended)" |
| 2026-10-14 | P-01 (jerome.lacube) | "Ship with agent-scoped hooks" (Q-guards-02, the exception) |
| 2026-10-14 | P-01 (jerome.lacube) | "Defer Copilot (Recommended)" (Q-guards-03) |
