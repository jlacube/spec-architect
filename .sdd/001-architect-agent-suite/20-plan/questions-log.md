---
artifact: plan/questions-log
change: CHG-001
phase: 20-plan
status: approved
---

# CHG-001 — Plan-phase questions log

## Round 1 — 2026-10-10

| ID | Question | Options (recommended first) | Answer (verbatim) | Decision record |
|---|---|---|---|---|
| Q-plan-01 | In what order should the suite be built? | Spikes → CLI core → agents → rest (Recommended) · Agent vertical slice first · Thin slice of everything, then deepen | "Spikes → CLI core → agents → rest (Recommended)" | C001-ADR-001 |
| Q-plan-02 | Source language for the sdd CLI? | TypeScript + esbuild (Recommended) · Plain JavaScript ESM + JSDoc types | "TypeScript + esbuild (Recommended)" | C001-ADR-002 |
| Q-plan-03 | How to run agent-behaviour evals given the 9/10 rule (DOD-G-01)? | Tiered: 1 run in dev, 10 at release (Recommended) · 10 runs at every milestone · Release-only evals | "Tiered: 1 run in dev, 10 at release (Recommended)" | C001-ADR-003 |
| Q-plan-04 | Who executes the plan after the hand-off? | Plain Claude Code sessions in this repo (Recommended) · Superpowers executing-plans · Me, continuing in this session | "Plain Claude Code sessions in this repo (Recommended)" | C001-ADR-004 |

Candidates considered but not presented (per the options-analysis method): for Q-plan-01, "CLI only, agents in a later change" (rejected: G-01/G-02 need agents in v1) and "hooks/guards first" (rejected: guards protect agents that do not exist yet); for Q-plan-02, "Python" (rejected: Q18 chose Node.js) and "Deno/Bun single binary" (rejected in OA-12); for Q-plan-03, "no automated agent evals, manual review only" (rejected: C001-SC-05 needs measurement); for Q-plan-04, "Codex CLI" (rejected: no install on the reference machine yet).

No embedded instructions were found in the free text of the answers.

## Round 2 — 2026-10-10 (during G3 review)

| ID | Question | Options (recommended first) | Answer (verbatim) | Decision record |
|---|---|---|---|---|
| Q-plan-05 | Is a Node.js script (requires Node ≥ 20) acceptable for the sdd CLI, or is a standalone binary wanted? | Keep Node script (Recommended) · Node script + optional single .exe (Node SEA or Bun compile) · Rewrite target: Go native binary | "Keep Node script (Recommended)" | Confirms C001-CON-02, C001-ADR-002; no change |

Candidates considered but not presented: Rust native binary (rejected: slowest to build, same trade-offs as Go); Deno compile (rejected in OA-12).
