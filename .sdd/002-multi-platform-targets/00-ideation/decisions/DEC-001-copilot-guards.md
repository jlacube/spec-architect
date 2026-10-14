---
id: "C002-DEC-001"
artifact: ideation/decision
change: "CHG-002"
phase: 00-ideation
status: accepted
---
# DEC-001 — Write/shell boundary on Copilot in VS Code

## Context

Copilot hook input carries no agent identity for tool events, so the Claude Code guards cannot tell Architect agents from the user's own chat; P-01 set the safety bar to "same as Claude" (Q-safety-01). Analysis: [C002-OA-001](../options/OA-001-copilot-guards.md); facts: [C002-R-001](../research/R-001-platform-facts.md).

## Decision

On Copilot in VS Code, Architect agents get no generic edit or terminal tool. Every `.sdd/` write and every `sdd` CLI call goes through a local `sdd` MCP server that refuses anything outside `.sdd/` and anything outside the CLI allowlist (no memory folder on this target, C002-DEC-009), using the CLI guard cores (`guard-path`, `guard-bash`) and the shared corpora. Claude Code keeps its PreToolUse hooks over the same cores; OpenCode uses its own permission engine, verified against the same corpora (spike S-07).

## Options considered

Presented (letters as in OA-001): (B) `sdd` MCP write server — 3.70, recommended, fails closed; (A) agent-scoped hooks in each generated `.agent.md` — 3.60, Preview, fails open when hooks are off. Rejected: tool-list restriction only, a VS Code extension, deferring Copilot (see OA-001).

## Consequences

- A new component: the `sdd` MCP server (stdio, local, part of the CLI package), with tools for writing `.sdd/` files and running allowlisted `sdd` commands.
- Copilot agents work with fewer, narrower tools; prompts and skills need a Copilot wiring variant that names these tools.
- The guard corpora gain an MCP-server replay; spike S-08 confirms Copilot behaviour before the target ships.
- If S-07 shows OpenCode's matcher cannot be made safe (path normalisation, redirection), OpenCode switches to the same server.
- **Fallback (round 3, Q-guards-02, P-01: "Ship with agent-scoped hooks"):** if spike S-08 shows Copilot subagents are not confined to their tool list, the Copilot target ships with agent-scoped hooks (A) running the same guard cores; its boundary is off whenever hooks are disabled, which C002-DEC-005 records as an exception.
- **Constitution check:** the server is a stdio process the host starts per session and stops with it — not a daemon (C001-CON-12 is about the CLI having no background service); it is built as its own bundled entry next to the CLI in the npm package, not under `plugins/architect/scripts/` (which `build.mjs` keeps for `sdd.mjs` only) unless the build changes; it uses only the allowlisted bundled dependencies.

## Decided
| Date | Decider | Words (verbatim) |
|---|---|---|
| 2026-10-14 | P-01 (jerome.lacube) | "sdd MCP write server (Recommended)" |
| 2026-10-14 | P-01 (jerome.lacube) | "Ship with agent-scoped hooks" (Q-guards-02, fallback) |
| 2026-10-14 | P-01 (jerome.lacube) | "Defer Copilot (Recommended)" (Q-guards-03, if the fallback fails too) |
