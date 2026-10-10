---
artifact: critic-report
change: CHG-001
phase: 20-plan
reviewed_ids: all
reviewer: "Claude (Opus 5.5), same session as the author — NOT independent"
---

# Critic report — CHG-001 20-plan

## Limitations

This is a self-review by the planning session, as for G2. Mechanical checks were done with
`tools/prototypes/planrender.py`: TR-06, TR-07, TR-08 and TR-11 pass, plus a reference check
on T/RISK/RB/M/ADR/OA IDs and an arithmetic check of OA-005/006.

## Summary

| blocker | major | minor |
|---|---|---|
| 0 | 2 | 6 (2 resolved) |

## Findings

### CR-1 — M-4 is a bottleneck of large tasks
- **Severity:** major
- **Refs:** C001-T-041, C001-T-042, C001-T-043 (all L); critical path weight 43
- **Evidence:** `40-work-breakdown.md` critical path passes T-037 → T-038 → T-043
- **Why it matters:** three L tasks in sequence carry most of the agent risk; slippage there delays release.
- **Suggested fix:** accept, but split any of them at execution time if it exceeds two sessions. Splitting is a plan revision with new task IDs.
- **Status:** open (accept or split, P-01)

### CR-2 — Eval cost has no budget figure
- **Severity:** major
- **Refs:** C001-ADR-003, C001-RISK-005, C001-T-072
- **Evidence:** 79 eval TCs × 10 runs at release = 790 sessions, with no token or cost cap stated
- **Why it matters:** release-tier cost could be large and unbudgeted.
- **Suggested fix:** T-029 measures cost per run in M-3. P-01 sets a release budget at the M-3 exit and may lower release runs for low-risk scenarios through an ADR-003 revision.
- **Status:** open (P-01 decides budget at M-3 exit)

### CR-3 — Spike tasks implement no requirement
- **Severity:** minor
- **Refs:** C001-T-002 … C001-T-007, C001-T-027, C001-T-054, C001-T-065, C001-T-070 … C001-T-075
- **Evidence:** `implements: []` with `satisfies_ac` populated
- **Why it matters:** TR-07 accepts AC links, so this is valid, but these tasks contribute evidence rather than features.
- **Status:** accepted by design (no change)

### CR-4 — Some test-case data and locations are generic
- **Severity:** minor
- **Refs:** `60-test-plan.md` §8 rows with "inline fixture from scenario Given/Examples"
- **Why it matters:** the implementer derives fixtures from the scenario text; acceptable because scenarios contain concrete data.
- **Status:** accepted

### CR-5 — Prototype scripts were not reachable by implementers
- **Severity:** minor
- **Refs:** C001-T-024, C001-T-019, C001-T-023, C001-T-028
- **Evidence:** tasks referred to scratchpad-only scripts
- **Status:** resolved — copied to `tools/prototypes/` with a README; tasks updated; T-028 deletes them.

### CR-6 — OA-005 arithmetic errors
- **Severity:** minor
- **Refs:** C001-OA-005
- **Evidence:** B stated 4.00 (computed 3.95); D stated 3.60 (computed 3.80)
- **Status:** resolved — corrected; recommendation unchanged.

### CR-7 — Dogfood target for CHG-002/003 not chosen
- **Severity:** minor
- **Refs:** C001-T-073, C001-T-074
- **Why it matters:** T-074 needs an existing repository from P-01; T-073 proposes "lint auto-fix suggestions" as the greenfield change.
- **Status:** open (P-01 to name both before M-7)

### CR-8 — macOS/Linux untested at v0.1.0
- **Severity:** minor
- **Refs:** C001-T-064, C001-NFR-402
- **Why it matters:** by design (Spec-Q4); portability rests on static checks only.
- **Status:** accepted

## Rubric

| Rubric item | Result |
|---|---|
| Every REQ planned (TR-06) | pass (213/213) |
| Every task has REQ/AC and TS/TC links (TR-07) | pass (58/58) |
| Every TS mapped to a TC (TR-08) | pass (235/235) |
| DAG acyclic, dependencies resolve (TR-11) | pass |
| Task files: targets, verification, done-checks present; no production code | pass |
| Milestones have goals, exit criteria and tasks | pass |
| High-impact risks have mitigation tasks (TR-14) | pass (RISK-001 → T-006, T-030) |
| Hotspots in risks (TR-15) | n/a: greenfield |
| Every NFR has an observability signal and a task | pass (27/27) |
| Rollout/rollback present | pass |
| Hand-off: reading order, rules, ordered list, reporting with fallback, change done | pass |
| Consistency with the approved spec and plan interview | pass by review |
