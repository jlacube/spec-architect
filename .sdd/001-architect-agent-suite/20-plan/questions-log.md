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

## Round 2026-10-20 — defect D-012 (found in C002-T-048)

### Q-ripwire-guard-01 — Bash guard rule for ripwire vs C001-IF-14
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 3
- **Options:** 1. Allow the IF-14 read-only forms: default map with `--max-tokens`, `--test-gate=<file>`, `--limit`; corpus updated, deny cases kept for anything else (Recommended) · 2. Keep the guard strict, rewrite the code-discovery skill and IF-14 (loses the ranked map) · 3. Defer (known failure for v0.1.0)
- **Answer:** P-01: "Allow read-only forms (Recommended)"
- **Extracted instructions:** none

## Round 2026-10-22 — defect D-014 (found in C001-T-065)

### Q-coverage-01 — Line coverage 79.99% against C001-NFR-502's 85%
- **Options:** 1. Write tests to 85%, and fix the Node 20 packaging filter, the Node 20 test cleanup, the archive fault coverage and the npm run check steps in one catch-up task (Recommended) · 2. Lower NFR-502 to 80% lines · 3. Exclude src/mcp from the measure
- **Answer:** P-01: "Write tests to 85% (Recommended)"

## Round 2026-10-22 — C001-T-080 findings F-6 and F-7 (defects D-014, D-015)

### Q-cov-node20-01 — Node 20's test runner crashes while merging coverage (F-7)
- **Options:** 1. The coverage step measures on Node 22 only and reports skipped on Node 20 with the reason, so all four check runs exit 0 (Recommended) · 2. Keep the step on Node 20 and waive the "exit 0 in all four runs" criterion
- **Answer:** P-01: "Coverage on Node 22 only (Recommended)"
- **Extracted instructions:** none

### Q-archive-faults-01 — archive killed before its folder move (F-6)
- **Options:** 1. Align bench/faults.mjs with C001-NFR-301 (any complete version passes) and log a defect for an archive that resumes without duplicates (Recommended) · 2. Make archive recoverable inside C001-T-080 and keep the stricter bench rule
- **Answer:** P-01: "Align bench, log defect (Recommended)"
- **Extracted instructions:** none
