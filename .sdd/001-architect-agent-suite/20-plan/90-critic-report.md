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
| 0 | 2 (1 resolved) | 6 (2 resolved, 1 partly) |

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
- **Status:** resolved at G3 — P-01: "ok let's see after M-3, which means we need to have detailed metrics of token consumption + timings". T-029 now records tokens by type, agent and model and timings by session, subagent and tool call; the M-3 exit criterion includes the metrics report and the budget decision.

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
- **Status:** partly resolved at G3 — greenfield proposal accepted ("looks good"); the brownfield target repository is still to be named by P-01 before M-7.

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


## Revision D-012 (2026-10-21)

Scope: 4945599 (20-plan). Lint 0. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 1 | 1 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-9 | major | C001-T-079, TC-1125 (follows spec CR-13) | T-079 counts `--token-budget=N` as a map bound; TC-1125 inherits the allow row | apply CR-13's resolution to T-079 and TC-1125 | fixed |
| CR-10 | minor | C001-T-079, ADR-006 | verification runs `node --test tests/…ts` directly (fails on Node 20 / 22.13) | `npm test -- cap11/TS-1107 cap11/TS-1125 guards/bash-corpus` | fixed |

All findings of this section fixed (architect, test-designer, planner; T-079 wording aligned by the conductor), 2026-10-21.


## Revision D-014 F-6/F-7 and D-015 (2026-10-22)

Scope: c3e7287 (20-plan), against D-014 F-6/F-7, D-015, Q-cov-node20-01, Q-archive-faults-01. Lint 0. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 3 | 3 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-11 | major | T-081, REQ-917, RISK-015 | a cross-capability rename cannot resume: files are written in sorted order, so a failure between source and target writes loses the entry (or leaves it in both, and locate picks the wrong one) | write gaining files before losing files; state how an ID found in two living files is resolved; add the split state to RISK-015 | fixed: T-081 two-pass write order (a moved entry reaches its target before it leaves its source); an ID in two files is resolved only as this change's move-in, else ERR-CLI-009; split state in RISK-015 |
| CR-12 | major | TC-1131, D-015, REQ-920 | atomic-write-fail-at=k cannot reach "archived, not moved": change.md is the last atomic write and the folder move is a plain renameSync (no EPERM retry) | a fault switch at the folder move (or build the state in the fixture); name the mechanism in TC-1131 | fixed: T-081 targets `SDD_TEST_FAULT=archive-move-fail` and the folder move through `renameWithRetry`; TC-1131 names the mechanism per TS-925 row |
| CR-13 | major | TC-1131, T-081 | "never key on the date" is untested: the CLI always uses today's date and TC-1131 compares same-date runs | test-only date switch as a T-081 target; a TC-1131 case re-run on a later date (each ID once, each History row once) | fixed: T-081 targets `SDD_TEST_TODAY`; a resumed run keeps the interrupted run's date; TC-1131 row 5 re-runs on 2026-11-05 |
| CR-14 | minor | T-081, REQ-921, TC-922 | step 4 keeps glossary and status ops; step 5 claims dry-run lists only what remains | skip already-matching glossary rows and an already-archived status, or limit the claim to delta ops | fixed: T-081 step 5 leaves out matching glossary rows and an already-archived status, so the dry run lists only what remains |
| CR-15 | minor | TC-1126, T-080, NFR-301 | the exact bench pass rule lives only in T-080; TC-1126 has the short form | move the rule into TC-1126's Pass cell; T-080 links to it | fixed: exact pass rule and exit code in the TC-1126 Location cell; T-080 links to it |
| CR-16 | minor | T-081, REQ-920, RB-003 | the recovery sentence ("run /architect:archive again") is wrong after the folder move (ERR-CLI-002) | cover both cases: before the move re-run archive; if already under _archive/, run sdd status --write | fixed: the archive.md sentence covers both cases (re-run before the move, `sdd status --write` after it) |

All findings of this section fixed (planner), 2026-10-22, after C001-REQ-924, C001-AC-924.1 and C001-TS-925 were added (133ab4e, a660c2a); C001-TC-1131 now verifies C001-TS-925.


## Revision D-016 (2026-10-23)

Scope: plan against the D-016 spec revision (3a19cef). Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 1 | 2 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-17 | major | TC-1117, TS-1117, T-063 | TC-1117's inline fixture cannot cover the conductor line | test data = the plugin's eval case files (PLG-EVAL-001 input) plus negative fixtures (must-route without hand-over check, without 0-subagent check; must-not-route without hand-over check) | open |
| CR-18 | minor | T-063, IF-09 | step 1 gives no source for conductor prompts; PLG-EVAL-001 module not a target | "conductor prompts per the C001-REQ-1116 note"; add the PLG-EVAL-001 check module and plugins/architect/evals to targets | open |
| CR-19 | minor | RISK-005 | mitigation "assertions on tool calls, not prose" vs the conductor's text check | allow the literal command string in the last reply as the one exception (D-016), noting possible flakiness | open |
