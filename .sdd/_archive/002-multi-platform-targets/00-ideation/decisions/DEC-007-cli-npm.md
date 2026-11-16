---
id: "C002-DEC-007"
artifact: ideation/decision
change: "CHG-002"
phase: 00-ideation
status: accepted
---
# DEC-007 — The sdd CLI on npm

## Context

Question Q-cli-01 (round 1); `PORTING-STUDY.md` §3.5 (`${CLAUDE_PLUGIN_ROOT}` exists only on Claude Code; R-001: not expanded in VS Code agent bodies).

## Decision

Publish the CLI as the npm package `architect-sdd` with `bin: sdd`; the Claude plugin keeps its bundled `scripts/sdd.mjs`.

## Options considered

Presented: npm package + bundled (recommended); Bundled copy per target.

## Consequences

- The Bash allowlist (C001-REQ-1106) must accept a bare `sdd …` command (baseline survey: `guard-bash.ts` rejects it today); merge with defect D-011.
- Package name and publishing account are open (owner P-01).

## Decided
| Date | Decider | Words (verbatim) |
|---|---|---|
| 2026-10-13 | P-01 (jerome.lacube) | "npm package + bundled (Recommended)" |
