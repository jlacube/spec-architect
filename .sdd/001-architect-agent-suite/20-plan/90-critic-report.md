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
| CR-17 | major | TC-1117, TS-1117, T-063 | TC-1117's inline fixture cannot cover the conductor line | test data = the plugin's eval case files (PLG-EVAL-001 input) plus negative fixtures (must-route without hand-over check, without 0-subagent check; must-not-route without hand-over check) | fixed: TC-1117 test data = the case files under `plugins/architect/evals/` plus the three negative conductor fixtures |
| CR-18 | minor | T-063, IF-09 | step 1 gives no source for conductor prompts; PLG-EVAL-001 module not a target | "conductor prompts per the C001-REQ-1116 note"; add the PLG-EVAL-001 check module and plugins/architect/evals to targets | fixed: T-063 step 1 cites the C001-REQ-1116 note; targets add `plugins/architect/evals/`, `scripts/check/evals.mjs`, `evals/delegation/suite.mjs`, the D-013 rework of TS-213/214/215 (and the TS-817 fixture) and the `evals` package exclude |
| CR-19 | minor | RISK-005 | mitigation "assertions on tool calls, not prose" vs the conductor's text check | allow the literal command string in the last reply as the one exception (D-016), noting possible flakiness | fixed: RISK-005 mitigation allows the literal hand-over string in the last reply as the one exception (D-016), noted as possibly flaky |

All findings of this section fixed (planner), 2026-10-23.


## Revision D-017 and reduced release tier (2026-10-24)

Scope: 20-plan in `git diff 08129a5 e2ebb2f`, against the same defect and answers. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 4 | 3 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-20 | major | ADR-003 class G, TC-209, TC-213 | TC-209 asserts the same blocking flag as TC-223 but is standard; TC-213 (unattended limit) standard too | move TC-209 to G (14/65); decide TC-213; update counts | fixed: TC-209 in class G (14 high-risk, 65 standard); TC-213 stays standard with the reason in ADR-003 (failures stay in the draft and are caught at the gate) |
| CR-21 | major | ADR-003, T-072, docs/milestone-log.md | milestone runs deferred to the release (M-3…M-6) not in the plan or the estimate; cut 3 reuses results that mostly don't exist | state that release runs close the deferred milestone items and list them in the evidence; restate or drop cut 3 | fixed: ADR-003 states that the release runs close the deferred M-3…M-5 eval items; T-072 lists every deferred item with its closing evidence and updates `docs/milestone-log.md`; cut 3 restated under the reuse conditions |
| CR-22 | major | T-072 step 1, ADR-003 cuts, Q-release-tier-01 | at 350 USD T-072 applies cuts without asking; reuse ignores the T-082 skill change | at 350 USD ask P-01 (second reset or cuts); reuse only with unchanged agent and skill blobs and current models | fixed: at 350 USD T-072 stops and asks P-01 (second reset or the cuts in order); reuse only with unchanged agent and skill blobs and current models |
| CR-23 | major | T-082, D-017, TC-223, TC-215 | one dev pass can't show the fix; no path if the release check fails; no rerun of other blocking-sensitive evals | TC-223 at milestone tier (3/3); TC-209, 213, 222 once; < 9/10 in T-072 reopens D-017 via T-082 | fixed: T-082 runs TC-223 at milestone tier (3/3) and TC-215, 209, 213, 222 once; below 9/10 in T-072 reopens D-017 via T-082 (T-072 step 4); C001-TC-224 added for the negative scenario C001-TS-224 (class G, milestone tier in T-082) |
| CR-24 | minor | ADR-003, RISK-005 | loose figures and references (315 midpoint, reset source, 780 vs 790 + 220, stale context, Affects line) | state formula and source; full tier 790 + 220; history label; RISK-005 3/3 weakness (p ≈ 0.73) | fixed: ADR-003 states source and formula, full tier 790 + 220 runs, history labels, Affects line; RISK-005 notes the 3/3 weakness (p ≈ 0.73) |
| CR-25 | minor | T-082 | components should be COMP-10; optional code-discovery line; conditional generate step | COMP-10; mandatory or drop; npm run check (targets step) | fixed: T-082 components C001-COMP-10; code-discovery line mandatory; `npm run check` (targets step) replaces the conditional generate |
| CR-26 | minor | T-072, test plan §4, handoff, index | release-tier rule restated in several places with counts | link to ADR-003; drop the counts from T-072 | fixed: T-072, test plan §4, handoff and index link to the ADR-003 revision; counts removed |

All findings of this section fixed (planner), 2026-10-24.


## Revision D-018 (2026-10-24)

Scope: `git diff 1f704a5 3164267`, against the defect and P-01's Q-budget-hide-01. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 0 | 2 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-27 | minor | T-082, handoff row 59, CHG-002 handoff | cross-change references mismatch (unnamed C002-T-069, "CHG-002 side only") | name C002-T-069, one reason text, drop "CHG-002 side only" | fixed: T-082 precondition and handoff row 59 name C002-T-069, one reason text "waits for C002-T-068 (done) and C002-T-069" |
| CR-28 | minor | TC-224, T-082 target | repeat CR-30's wording | update with the CR-30 fix | fixed: TC-224 and the T-082 target define the hand-back as the specialist's last assistant message (`parent_tool_use_id` = the Agent call, bounded by the last result message); an unparsable block fails; each run reports whether and by whom the naming question was raised |

All findings of this section fixed (planner), 2026-10-24.


## Revision D-019 (2026-10-24)

Scope: `git diff a99f6e1 b82aaad`, against the defect and P-01's Q-t082-bugs-01 / Q-cap-level-01. Lint: the 9 waived LINT-DELTA-001 plus LINT-REG-001. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 3 | 3 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-29 | major | T-083, IF-05 §2, REQ-221 | phase-spec step 2 (line 41) and phase-ideation steps 3–4 ("Wait for all hand-backs") still batch; shipped skills would cite a CHG-001 spec ID | add them to the targets; cite the sdd-conventions blocking bullet instead | fixed: T-083 targets phase-spec step 2 (line 41) and phase-ideation steps 3–4 (line 58); shipped skills point to the `sdd-conventions` blocking bullet and interview-protocol §2, never to CHG-001 spec IDs |
| CR-30 | major | T-082, CHG-002 handoff, C002-TS-679 | step 4 wording puts TC-209/222/225 at 3.00 USD and the command lacks --host/--auth/--cap-exception and mixes row kinds (default auth api-key) | the two handoff command forms; correct the cap wording | fixed: T-082 step 4 and Verification use the two CHG-002 handoff forms (rule-1 rows TS-223, 224, 215, 213, 225 with `--host claude-code --auth subscription --cap-exception` at 3.00 USD; TS-209, 222 with `--host claude-code --auth subscription` at 0.50 USD) |
| CR-31 | major | T-083, T-082 | T-083's done-check needs T-082 step 4, which depends on T-083 | T-083 done-check: TC-1132, C002-TC-107/127, parse checks; eval passes and D-019 closure in T-082 | fixed: T-083 done-check is TC-1132, C002-TC-107/127 and the parse checks; the eval passes and the D-019 closure are in T-082 |
| CR-32 | minor | ADR-003 | 420 USD not derived; TC-223/224/225 at 1.40 though all ended at 1.52–1.86 | a hidden-budget row with expected and worst case at 3.00 USD | fixed: ADR-003 rule-1 sessions (74) at 1.8–3.0 USD with the hidden budget; expected about 400 USD, worst case about 570 USD, replacing the quoted 420 USD |
| CR-33 | minor | T-083 | assertion checked only on failing traces | a synthetic passing transcript fixture | fixed: T-083 builds synthetic passing transcripts for the TS-225 and TS-215 assertions; the parse check also reproduces the recorded failures |
| CR-34 | minor | registry, handoff | LINT-REG-001 (64 vs 65); extra empty cell in row 60 | sdd status --write; remove the cell | fixed: registry refreshed by the conductor; extra empty cell of handoff row 60 removed |

All findings of this section fixed (planner), 2026-10-24.


## Revision D-020 (2026-10-28)

Scope: `git diff bf04731 0445b9a`, against D-020 / D-036 and Q-noask-01, Q-opencode-defer-01, Q-copilot-002-01. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 2 | 1 |

| ID | Sev. | Finding | Fix | Status |
|---|---|---|---|---|
| CR-35 | major | no runner can send TS-226's second message | conductor decision: TS-226 checks the first reply only (text gate or round, turn ends, no detour); the second-message rules are review-verified; Copilot rows dropped — INJ-19/21 at 0.0.3 are the Copilot evidence | spec part fixed (C001-TS-226: three Claude Code rows, gate, interview round, blocking ask, first reply only; no Copilot CLI rows); TC-226: planner — fixed: TC-226 is the Claude Code eval only (three rows); TC-227 added for TS-227 on the same sessions; T-084 implements REQ-223; D-020 closes when INJ-19 and INJ-21 pass at 0.0.3 in C002-T-071 |
| CR-36 | major | TS-226's first real run is at release | one dev run of the Claude Code rows (~0.60 USD) in T-084 | fixed: T-084 step 5 runs the three Claude Code rows once at dev tier after the skill change (about 0.60 USD notional), graded by TC-226 and TC-227 |
| CR-37 | minor | unclear whether T-072 needs D-020 closed | T-072 precondition: D-020 closed | fixed: T-072 precondition "D-020 closed" (T-084 done, INJ-19 and INJ-21 passing at Copilot CLI 0.0.3 in C002-T-071) |

All findings of this section fixed (planner), 2026-10-28.


## Revision D-028 (2026-11-08)

Scope: `git diff 8b6c1f4 1fb5afb`, against D-028 and Q-toy-g3-limit-01. Read-only review (Read, Grep, Glob). Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 3 | 2 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-40 | major | NFR-304, DOD-015, T-074, Q-toy-g3-limit-01 | "cfg-bare is not run in CHG-001 or CHG-002" overreaches the toy-chain decision; no planned run measures NFR-304 on cfg-bare, so DOD-015 cannot be met | P-01 (Q-nfr304-bare-01, 2026-11-08): defer NFR-304's cfg-bare part to the follow-up change, waived at G2; reword the log line to the toy chain only | fixed: P-01 answer to Q-nfr304-bare-01 ('Defer it to the follow-up (Recommended)') logged in the 2026-11-08 round; the cfg-bare clause of Q-toy-g3-limit-01 scoped to the toy chain by a scope note; G2 Revise recorded citing the waiver (NFR-304 and DOD-015 texts unchanged, cfg-bare part waived at the G2 re-approval); strategy close rule; docs/nfr-results.md NFR-304 row: cfg-bare deferred, P-01 2026-11-08 |
| CR-41 | major | ADR-003, T-072, M-4 | ADR-003's deferred milestone runs still name cfg-full and cfg-bare | narrow to cfg-full and link the D-028 deferral | fixed: ADR-003 Deferred milestone runs names G3 on cfg-full only and links the D-028 deferral of cfg-bare |
| CR-42 | major | T-073, D-028 | "CHG-004" is assumed; the next free number goes to whichever change is created first | name the follow-up by title ("Cost and token efficiency") and record its number once it exists | fixed: the follow-up is named by its title, "Cost and token efficiency", its number recorded once it exists, in CHG-001 (strategy, T-072, handoff, ADR-003) and CHG-002 (C002-IF-010, C002-NFR-105, C002-DOD-012, strategy, test plan, C002-T-076, handoff) and in the caps.mjs and chain.mjs messages and their tests; correction note on the D-028 summary |
| CR-43 | minor | D-028, T-072 | no CHG-001 item tracks creating the follow-up change | add a T-072 done-when item owned by the conductor | fixed: T-072 done-when item owned by the conductor: the follow-up change is created and holds the cfg-bare G3 run, NFR-304's cfg-bare part and the D-044 cost issue |
| CR-44 | minor | Q-toy-g3-limit-01, M-4 | the follow-up's name is attributed to P-01; extracted instructions mix the conductor's decision and omit two of P-01's | separate P-01's words from the conductor's decision; copy the instructions as CHG-002 records them | fixed: strategy M-4 row: deferred to a follow-up change (P-01); named 'Cost and token efficiency' (conductor, CHG-002 CR-112); extracted instructions copied word for word from CHG-002, with the conductor's decision in a separate note |


## Revision D-030 (2026-11-10)

Scope: `git diff a90fab5 6e51f54` (CHG-001 files, docs and scripts), against D-030 and Q-clean-profile-01. Read-only review. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 3 | 2 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-46 | major | TC-1102 | the test-plan TC row still says "REF-WIN fresh user profile" | Environment: REF-WIN, isolated Claude profile (C001-SPEC-NFR) | fixed: 60-test-plan.md TC-1102 Environment cell is "REF-WIN, isolated Claude profile (C001-SPEC-NFR)" |
| CR-47 | major | TC-1102, TS-1102.md step 5 | PowerShell's $HOME isn't changed by the overrides, so the toy repo lands in the real home | use $env:USERPROFILE (or the printed folder); add $HOME and ~ to the caveat | fixed: run sheet step 6 and TS-1102.md step 5 use $env:USERPROFILE\runs\tc1102\toy (the folder the script prints); isolated-profile.ps1 also sets PowerShell's $HOME (Set-Variable) and the FileSystem provider's ~ to the profile folder and prints the toy folder |
| CR-48 | major | TC-1102, T-072 step 6 | the script can fall back to the broken PATH claude 2.0.76; the MSIX LocalCache location isn't searched | refuse below 2.1.295; search %LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude-code; add a -Claude <path> option | fixed: isolated-profile.ps1 refuses a Claude Code below 2.1.295 with an error (tested with a stand-in reporting 2.0.76), searches %LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude-code besides %APPDATA%, and its -Claude <path> option is in the run sheet |
| CR-49 | minor | TC-1102 functional part | the mjs check passes signed out with no init event; the ps1 prints the same PASS with fewer checks | missing init event is a failure when signed out; rename the ps1 output or align its criteria | fixed: isolated-profile-check.mjs fails a signed-out run without the conductor's init event; the ps1 -Check prints "Quick check: PASS/FAIL" (no conductor start) and names the mjs as the functional check of record |
| CR-50 | minor | D-030 close rule | the rule says "window" while the check builds a process environment; the passing evidence is from an uncommitted tree | define the profile by its process environment (window = manual form); close D-030 on a PASS at the approved revision's commit, rerun after the fixes | fixed: C001-SPEC-NFR defines the profile by its process environment (manual form: the window; automated form: the mjs child environment); close rule aligned in the questions-log note plus a correction note on D-030's change.md summary, T-072 verification and done-when: PASS at the commit carrying the approved revision; the mjs prints the commit; rerun PASS recorded in evidence §3 (at 6e51f54 plus uncommitted trees, so not the closing run) |


## Revision D-031 (2026-11-10)

Scope: `git diff 469e2cf 9d51dd6` (CHG-001 defect D-031 and CHG-002 defect D-049, one review), against P-01's instruction of 2026-11-10 "agreed on all points. waive and continue autonomously until you reach some significant that requires my inputs". Read-only review. Appended by the conductor from the critic's reply (compact form).

One review covered CHG-001 D-031 and CHG-002 D-049; findings CR-135 … CR-144 are listed in
`../../002-multi-platform-targets/20-plan/90-critic-report.md`, section "Revision D-049". Those on CHG-001:
CR-138 (release evidence), CR-139 (close rule), CR-140 (follow-up list), CR-141 (C001-SC-09) and CR-143 (run
sheet). All fixed.


## Revision 2026-11-13 — dogfoods kept apart from the Architect repository

Scope: the uncommitted 20-plan revision on `0ee7308` (`git diff`: C001-T-073, C001-T-074, `40-work-breakdown.md`, `handoff.md` rows 65–66, `questions-log.md` round 2026-11-13, and the `change.md` Gate log row of 2026-11-13), against P-01's answers of 2026-11-13. Read-only review (Read, Grep, `git diff`, `git log`, `git show`); `sdd lint 001 --phase 20-plan --json`: 0 errors, 0 warnings, 0 info. Written by the critic (full form). CR numbers continue the counter shared with CHG-002 (last: CR-223 in `../../002-multi-platform-targets/20-plan/90-critic-report.md`).

**Reviewed IDs:** C001-T-073, C001-T-074 and the IDs linked to them: C001-SC-01, C001-SC-03, C001-SC-04, C001-SC-06, C001-SC-07, C001-SC-08; C001-AC-805.1, C001-AC-202.1, C001-AC-617.2, C001-AC-314.1, C001-AC-410.1; C001-TS-805, C001-TS-202, C001-TS-621, C001-TS-315, C001-TS-412; C001-TC-805, C001-TC-202, C001-TC-621, C001-TC-315, C001-TC-412; C001-NFR-106, C001-NFR-304, C001-NFR-701; C001-DOD-013, C001-DOD-021; C001-RISK-003, C001-RISK-013; C001-ADR-004; C001-M-7, C001-T-072, C001-T-075; the observability rows of NFR-106, NFR-304 and NFR-701; the test-plan rows of TC-202, TC-315, TC-412, TC-621 (§7 and §8) and TC-805.

| blocker | major | minor |
|---|---|---|
| 1 | 3 | 2 |

### CR-224 — T-074 reverses P-01's decision "CHG-002 = T-074 dogfood" without P-01's word on it
- **Severity:** blocker
- **Refs:** C001-T-074, C001-SC-01, C001-SC-07, Gate log rows of 2026-10-13 and 2026-11-13, C002-DEC-008
- **Evidence:** "CHG-002 = T-074 dogfood (Recommended)" — `change.md:97` (G3 Revise of 2026-10-13; the approval commit `ca0442b` set T-074's title to "Dogfood: brownfield change CHG-002 (multi-platform targets) and Superpowers execution"); "This change is also CHG-001's brownfield dogfood (C001-T-074): it is specified with Architect itself." — `../002-multi-platform-targets/00-ideation/ideation.md:20-21` (same statement in CHG-002 `00-ideation/questions-log.md:13` and `00-ideation/decisions/DEC-008-delta-sequencing.md:12`). Against: "Use the suite on an existing repository chosen by P-01, other than the Architect repository" — `20-plan/50-tasks/T-074-dogfood-brownfield.md:23`; "the stale change numbers in their titles (CHG-003, CHG-002) are dropped" — `20-plan/questions-log.md:156`. P-01's recorded answers cover only the greenfield repository, the summaries and `evals/results/`: "\"1. Yes\" (a separate empty repository for the greenfield dogfood); \"1. Yes 2. Yes\" (dogfood summaries stay in `docs/dogfood.md`; `evals/results/` stays committed in place); \"You gave my go for actions\"" — `20-plan/questions-log.md:155`; the round's context (`:154`) does not mention the 2026-10-13 decision.
- **Why it matters:** CHG-002 is not a stale number. It is the brownfield dogfood P-01 chose, and it has been through G1–G3 (CHG-002 `change.md:9-11`), so the brownfield half of C001-SC-01 and the TR-09 data of C001-SC-07 may already exist. Excluding the Architect repository drops that evidence and adds a new L dogfood run, a scope and spend change that P-01 was not shown (a full dogfood run was priced at "~50 USD notional and more P-01 time" in Q-nfr304-bare-01, `20-plan/questions-log.md:127`). Approving as is leaves two contradictory P-01 decisions on record, with CHG-002's approved artifacts stating the opposite of T-074.
- **Suggested fix:** Ask P-01 (scope, blocking), quoting the 2026-10-13 decision: (a) CHG-002 stays the brownfield dogfood for C001-SC-01 (brownfield half) and C001-SC-07, and its G1–G3 records and TR-09 result are summarised in `docs/dogfood.md`; T-074 keeps only the Superpowers execution (C001-SC-04, C001-TC-621) of one milestone of a dogfood plan outside the Architect repository, for example the T-073 dogfood's plan in its own repository (CHG-002 has 80 of 82 tasks done, `.sdd/SDD.md:32`, so none of its milestones is left to execute); or (b) the revision as written, recorded as superseding the 2026-10-13 decision. Log the answer verbatim. In `questions-log.md`, add a correction note to `:156`: only CHG-003 was stale, and CHG-002 was a decision that is now kept or reversed. The Gate log row `change.md:144` is CLI-written and stays. Under (b), the conductor adds correction notes to CHG-002's three statements (through a CHG-002 revision, since they are in approved phases) and to `STATUS-AND-NEXT.md:21` (CR-229).
- **Status:** fixed: P-01 answered Q-t074-brownfield-01, 'Keep CHG-002 (Recommended)'; T-074 rewritten (CHG-002 brownfield figures; Superpowers milestone on the T-073 dogfood plan; depends on T-073), WBS graph, table and critical path, handoff; correction note in questions-log.md

### CR-225 — Both dogfoods' verification lints the Architect repository, not the dogfood repository
- **Severity:** major
- **Refs:** C001-T-073, C001-T-074, C001-NFR-701, C001-SC-07, C001-AC-410.1, C001-DOD-013, observability row of C001-NFR-701
- **Evidence:** "G1–G3 approved; usage recorded in the gate log (C001-NFR-701)" and "Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028)." — `20-plan/50-tasks/T-073-dogfood-greenfield.md:46-47`; "C001-TC-621 passes; TR-09 100% on the brownfield spec" followed by the same lint line — `20-plan/50-tasks/T-074-dogfood-brownfield.md:44-45`; "**Method:** lint rule `LINT-GATE-001` on change.md" and "**Environment:** dogfood changes" — `10-spec/30-nfr/nfr.md:295-296`; "| C001-SC-07 | Brownfield grounding | Lint rule TR-09 on brownfield dogfood change |" — `10-spec/10-context/problem-and-goals.md:48`; "| C001-NFR-701 | LINT-GATE-001 result on change.md files | log | C001-T-022, C001-T-073 |" — `20-plan/78-observability.md:40`.
- **Why it matters:** the relative path `plugins/architect/scripts/sdd.mjs` exists only in the Architect repository, and run there the lint reads the Architect `.sdd/`. The dogfood's `change.md` and brownfield spec are now in another repository, so the NFR-701 signal and the TR-09 figure of C001-SC-07 are never produced, and the verification passes whatever the dogfood holds. Before this revision T-073's dogfood lived in this repository, so the line still checked it.
- **Suggested fix:** in both tasks, lint the dogfood workspace: `node <Architect repository>/plugins/architect/scripts/sdd.mjs lint --cwd <dogfood repository>` (the CLI's global `--cwd` option; or the released `sdd.mjs`). Copy its exit code, the LINT-GATE-001 result (both tasks: C001-DOD-013 covers both dogfood changes) and the TR-09 result (T-074) into the summary entry. Keep `npm run check` and the Architect lint only for the `docs/dogfood.md` edit, and add C001-T-074 to the NFR-701 observability row.
- **Status:** fixed: T-073 and T-074 verification lint the dogfood with `--cwd <dogfood repository>`; T-074 lints CHG-002 (`sdd lint 002`) for TR-09; C001-T-074 added to the NFR-701 observability row

### CR-226 — The summary entries leave out figures that only the Architect repository can now show
- **Severity:** major
- **Refs:** C001-T-073, C001-T-074, C001-NFR-106, C001-NFR-304, C001-DOD-013, C001-DOD-021, C001-RISK-013, C001-SC-01, C001-SC-06, C001-AC-805.1
- **Evidence:** "summary entry only: target repository and commit, brownfield log, Superpowers run notes; no dogfood artifact copied" — `20-plan/50-tasks/T-074-dogfood-brownfield.md:30`; "summary entry only: dogfood repository path and commit, time to G2, tokens per phase, critic validity tally" — `20-plan/50-tasks/T-073-dogfood-greenfield.md:30`; "| C001-NFR-106 | Gate-log Usage cells; `docs/dogfood.md` token totals | metric | C001-T-073, C001-T-074 |" — `20-plan/78-observability.md:21`; "| C001-NFR-304 | Dogfood log per machine configuration | log | C001-T-041, C001-T-074 |" — `20-plan/78-observability.md:30`; "| C001-DOD-013 | Token usage recorded for both dogfood changes and within threshold |" — `10-spec/70-dod.md:44`; "Dogfood change > 3,000,000 tokens | P-01 | C001-T-073, C001-T-074" — `20-plan/70-risks.md:28`. T-074's step outline has two steps, "1. Run init (capability inventory), ideation, spec, plan." and "2. Execute one milestone with Superpowers; count missing-info questions.", and neither writes the summary — `20-plan/50-tasks/T-074-dogfood-brownfield.md:39-40`.
- **Why it matters:** the dogfood's Gate log is now in another repository, so `docs/dogfood.md` is the only record that this repository, the release evidence and the archive (C001-T-075) can read. T-074's entry has no token figures, so C001-DOD-013, C001-NFR-106 and RISK-013's trigger cannot be checked for the brownfield change. Neither entry records the G1–G3 outcomes that C001-SC-01, C001-DOD-021 and the real-use side of C001-AC-805.1 rest on. T-074 records neither the TR-09 result (C001-SC-07) nor the phases completed per machine configuration (C001-NFR-304).
- **Suggested fix:** give both tasks one field list for the summary entry:
  - Both tasks: repository path and commit at G3; per gate, the date, decision, approved hash and approver (data taken from the Gate log, not a copied artifact); usage per phase and total tokens against C001-NFR-106 (≤ 3,000,000, target ≤ 2,000,000); time to G2; REQ count; the lint result of CR-225.
  - T-073 adds the critic tally.
  - T-074 adds the TR-09 result with its MODIFIED/REMOVED count, the machine configuration of each phase (C001-NFR-304) and the C001-TC-621 record.
  
  Add a T-074 step 3 that writes the entry, matching T-073 step 3.
- **Status:** fixed (third check, 2026-11-13).
  - **The CHG-002 estimate exists.** It is recorded in `docs/dogfood.md`, section "2026-11-13 — CHG-002 token estimate, taken for C001-T-074 (brownfield half)". Its window matches the commits: CHG-002's creation `9dde137` (2026-10-13 23:29:56 +02:00) and the first G1, G2 and G3 approvals `28a1f60`, `8168833` and `933d457`.
  - **The transcripts are kept.** The 40 subagent transcripts, each with its `.meta.json`, are in `C:\Sandbox\runs\chg002-usage-transcripts`. The one subagent file with October entries that was not copied, `agent-a31ade6553de15833`, ends at 21:16Z on 2026-10-13, before the window opens (21:29:56Z).
  - **The figures add up.** The column totals, the input + output total of 15,203,384 (cache reads excluded) and the 457,125,286 total with cache reads are consistent. I did not recompute the per-phase sums from the transcripts.
  - **C001-NFR-106 correctly does not apply to CHG-002:** it had 121 REQs at its first G3, outside the 5–40 range.
  - **Both tasks name the source.** T-074 step 1 cites the entry and the kept folder. T-073 step 2 sums `**\*.jsonl`, subagents included, with the input, cache-creation, cache-read and output fields stated separately.
  - Hint, not reopened: CHG-002's 15.2 M input + output upper bound meets RISK-013's literal trigger, "Dogfood change > 3,000,000 tokens" (`20-plan/70-risks.md:28`). The risk is defined against C001-NFR-106, which does not apply to CHG-002, so T-074's summary entry could say so for the risk owner, P-01. T-073 step 3 could also name which total is compared with C001-NFR-106, as the CHG-002 entry does: cache reads excluded, with both totals shown.

### CR-227 — The greenfield idea has no size bound, but C001-SC-08 and C001-NFR-106 apply to a medium feature
- **Severity:** major
- **Refs:** C001-T-073, C001-SC-08, C001-NFR-106, C001-DOD-013, C001-RISK-013
- **Evidence:** "with an idea chosen by P-01" — `20-plan/50-tasks/T-073-dogfood-greenfield.md:23`; "P-01 has chosen the greenfield idea; the dogfood repository is new and empty" — `:36`; "C001-SC-01 (greenfield half), SC-03, SC-08 data recorded" — `:51`; "| SC-08 | Time-to-G2 for a medium feature ≤ one working session (excluding your think time) | Dogfood log |" — `00-ideation/ideation.md:2102`; "WHILE taking a medium feature (5–40 REQs) from ideation to G3, THE suite SHALL consume no more tokens than the threshold." — `10-spec/30-nfr/nfr.md:90`.
- **Why it matters:** the revision withdrew the idea accepted at G3 (CR-7) and leaves the choice open with no size criterion. A whole new product in an empty repository can exceed 40 REQs, and a small one can fall under 5. In either case the run's time to G2 and token total measure neither C001-SC-08 nor C001-NFR-106, and RISK-013's "recalibrate threshold after T-073" has no valid input. The mismatch would show only after a paid dogfood run.
- **Suggested fix:** add to T-073's preconditions that the idea is expected to make a medium feature (5–40 REQs, C001-NFR-106), and say so when the conductor asks P-01 for the idea. Record the REQ count at G2 in the summary entry. If the count falls outside 5–40, the entry marks the SC-08 and NFR-106 figures as not applicable, and the conductor raises it with P-01 before T-073 is set done.
- **Status:** fixed: T-073 precondition (medium feature, 5–40 REQs, said when asking P-01 for the idea); REQ count at G2 in the entry and the out-of-range rule in step 3

### CR-228 — Nothing keeps the dogfood repositories that now hold the only full record
- **Severity:** minor
- **Refs:** C001-T-073, C001-T-074, C001-T-075, C001-DOD-021
- **Evidence:** "(for example `C:\Sandbox\dogfood\<name>`)" — `20-plan/50-tasks/T-073-dogfood-greenfield.md:23`; "copy no dogfood artifact into it" — `:42`; "Installed on P-01's machine only. No public publishing and no push in this change" — `20-plan/75-rollout.md:14-15`.
- **Why it matters:** the summary entry names a local repository and a commit. If that repository is deleted or moved before CHG-001 is archived, C001-DOD-021's link evidence points at nothing, and the Gate log rows behind C001-SC-01 are lost.
- **Suggested fix:** add to both tasks' Done when: the dogfood repository is committed at G3 (and, for T-074, after the Superpowers milestone) and stays at its recorded path at least until C001-T-075 is done.
- **Status:** fixed: Done-when item in both tasks (repository committed, kept at its path until C001-T-075 is done)

### CR-229 — References that still put the brownfield dogfood in this repository or name the wrong task
- **Severity:** minor
- **Refs:** C001-TC-621, C001-T-073, C001-T-074, CR-7
- **Evidence:** "1. Take an approved plan of a dogfood change (G3 approved), e.g. CHG-002 of C001-T-073." and "Add the record to `docs/dogfood.md`." — `tests/manual/TS-621.md:12` and `:28` (the C001-TC-621 location, `20-plan/60-test-plan.md:245`); "CHG-002 is also CHG-001's brownfield dogfood (C001-T-074). Folder: `.sdd/002-multi-platform-targets/`." — `STATUS-AND-NEXT.md:21`; "**Status:** partly resolved at G3 — greenfield proposal accepted (\"looks good\"); the brownfield target repository is still to be named by P-01 before M-7." — `20-plan/90-critic-report.md:70`.
- **Why it matters:** T-074 runs the TC-621 procedure, and the procedure's example is a change in this repository, credited to the greenfield task. With the dogfood in another repository, "`docs/dogfood.md`" can be read as that repository's file. The status file and CR-7 state a designation and a proposal that this revision changes.
- **Suggested fix:** once CR-224 is answered, the conductor has the owner of `tests/manual/` change the TS-621 example to "the approved plan of the C001-T-074 dogfood, in its repository" and the record target to "`docs/dogfood.md` of the Architect repository (summary entry)", and updates `STATUS-AND-NEXT.md` §1a. CR-7 is superseded (below).
- **Status:** fixed: tests/manual/TS-621.md step 1 names the T-073 dogfood plan in its repository and the summary entry; STATUS-AND-NEXT.md §1a is true again under Q-t074-brownfield-01 (CHG-002 is the brownfield dogfood), no edit; CR-7 superseded as stated

**Earlier findings affected:** CR-7 is superseded. The greenfield proposal accepted at G3 was withdrawn on 2026-11-13 (`20-plan/questions-log.md:154`). T-073's idea and T-074's repository are again P-01's choice (`:156`), and the brownfield part depends on CR-224.

**Answers to the brief.** C001-TC-202 (eval on fx-empty or fx-brownfield-ts, owned by C001-T-030, `60-test-plan.md:142`) and C001-TC-805 (integration test with an inline fixture, owned by C001-T-025, `:271`) run in the Architect repository and never read a dogfood's `change.md`. So C001-AC-202.1 and C001-AC-805.1 stay verifiable wherever the dogfood's Gate log lives. The same holds for C001-TC-315 and C001-TC-412 (fixtures, `:182`, `:199`). The dogfood adds real-use evidence of those criteria, and that evidence reaches this repository only through the summary entry (CR-226, CR-228). A new repository holds a single change, so the dogfood never shows C001-TS-202's two-change orientation; C001-TC-202 covers that case with its fixture, so no finding. C001-TS-621 ("Given an approved plan from a dogfood change", `10-spec/20-capabilities/CAP-06-planning/acceptance.md:240`) fits a plan in another repository. C001-ADR-004 names no repository for the Superpowers run. The conductor resolves in a new `git init` folder (`docs/release-0.1.0-evidence.md:184`), so starting it in the dogfood repository needs no new risk.

| Rubric | Item | Result |
|---|---|---|
| plan | P1 Every requirement covered by a task | pass: `satisfies_ac` and `verified_by` of T-073 and T-074 unchanged; lint 0 |
| plan | P2 Targets, verification and done-checks | CR-225, CR-226, CR-228 |
| plan | P3 Acyclic graph, coherent milestones | pass: `depends_on` unchanged (T-072 → T-073, T-074 → T-075); the new titles match in the graph (`40-work-breakdown.md:91-92`), the table (`:299-300`), the critical path (`:327`) and hand-off rows 65–66 (`handoff.md:148-149`) |
| plan | P4 Every scenario maps to a planned test | pass for the mapping (TS-202, 805, 315, 412, 621 → TCs unchanged); TC-621 procedure text: CR-229 |
| plan | P5 Risks cover the hotspots touched | CR-226 (RISK-013's trigger has no T-074 figure); RISK-003 unaffected (T-074 still exercises the cartographer's fallbacks) |
| plan | P6 Rollout and rollback | pass: rollout §5 still reports through `docs/dogfood.md`; RB-003 (restore `.sdd/` from git) works inside each dogfood repository; retention: CR-228 |
| plan | P7 ADRs for every remaining technical decision | pass: the repository choice is a P-01 instruction, not a technical decision; ADR-004 holds; the record of that instruction: CR-224 |
| consistency | C001-SC-01, SC-03, SC-04, SC-07, SC-08 | SC-01 and SC-07: CR-224, CR-225, CR-226; SC-08: CR-227; SC-03: pass (T-073 step 2 and the summary's critic tally); SC-04: pass (TS-621 and ADR-004 fit a plan in another repository) |
| consistency | Questions log against decisions on record | CR-224 |

**Verdict of the re-review:** not approvable for G3 until P-01 answers CR-224. CR-225 … CR-227 are planner fixes, and CR-228 and CR-229 can go with them.

**Verification of the fixes (2026-11-13).** Scope: the working tree after the fixes (`git diff`: T-073, T-074, `40-work-breakdown.md`, `handoff.md`, `78-observability.md`, `questions-log.md`, `tests/manual/TS-621.md` and the Status lines of this section). Checks: `sdd lint 001 --json` 0 errors, 0 warnings, 0 info; `sdd trace 001` TR-01 … TR-08 100% and TR-11 acyclic; `sdd lint 002 --json` read-only.
- **CR-224 verified.** Q-t074-brownfield-01 is logged with the presented options and P-01's answer, 'Keep CHG-002 (Recommended)' (`20-plan/questions-log.md:159-163`), and the correction note is at `:157`. T-074 names CHG-002 as the brownfield dogfood and runs the Superpowers milestone on the T-073 plan (`T-074-dogfood-brownfield.md:23`). Its `depends_on: [C001-T-072, C001-T-073]` matches the graph edge, the table, the critical path and the hand-off order (row 65 before row 66). The critical-path weight of 50 is 48 plus T-073's M (2). CHG-002's ideation, the context of C002-DEC-008 and `STATUS-AND-NEXT.md:21` are accurate again.
- **CR-225 verified.** T-073 lints the dogfood with `--cwd` (`T-073-dogfood-greenfield.md:46`). T-074 reads TR-09 from `sdd lint 002` and lints the dogfood after the milestone (`T-074-dogfood-brownfield.md:45-46`). The NFR-701 row lists C001-T-074.
  - Hint, not reopened: `sdd lint 002` exits 1 with the 9 LINT-DELTA-001 errors waived at CHG-002's G2 and G3 (C002-DEC-008), and with no TR-09 finding. T-074 could say that the criterion is "no TR-09 finding", not the exit code. It could also say that the MODIFIED/REMOVED count (9 requirements) comes from the Delta fields, because lint prints no count.
- **CR-226 reopened:** see its Status. The token source is missing for both tasks, and for CHG-002 the figures do not exist.
- **CR-227 verified.** Precondition at `T-073-dogfood-greenfield.md:36`; REQ count and out-of-range rule in step 3 (`:42`).
- **CR-228 verified.** Done-when items at `T-073-dogfood-greenfield.md:52` and `T-074-dogfood-brownfield.md:51`.
- **CR-229 verified.** TS-621 step 1 is updated.
  - Notes, not findings (both predate the revision): `tests/manual/TS-621.md:3` cites C001-AC-617.1, but C001-TS-621 belongs to C001-AC-617.2 (`10-spec/20-capabilities/CAP-06-planning/acceptance.md:237-239`). `:6` still reads "dogfood change of C001-T-074", which step 1 now qualifies.
- **Superseded remarks of this section.**
  - "T-074's repository are again P-01's choice" (Earlier findings affected) no longer holds: the brownfield dogfood is CHG-002.
  - "T-074 still exercises the cartographer's fallbacks" (rubric P5) no longer holds: T-074's brownfield figures come from CHG-002's recorded runs, and its ideation ran without ripwire (`../002-multi-platform-targets/00-ideation/evidence/baseline-survey.md:16`).

**Verdict of the verification:** not approvable for G3 as is. CR-226 (major) is open again; the other five fixes are verified. Closing CR-226 needs two things:
1. A named way to capture usage at each gate for T-073.
2. For CHG-002, either recovered token figures or P-01's decision on waiving the brownfield part of C001-DOD-013 and C001-NFR-106. A waiver needs P-01's word.

**Second check of CR-226, after Q-t074-usage-01 (2026-11-13):** still open. T-073 leaves the subagent transcripts out of its sum, and CHG-002's subagent transcripts are due for the 30-day cleanup before T-074 runs (see its Status). G3 verdict: not approvable as is. It becomes approvable once those planner and conductor fixes are in, with no P-01 decision needed. Take the CHG-002 estimate, or copy the transcripts, now.

**Third check of CR-226 (2026-11-13):** fixed, so all of CR-224 … CR-229 are closed. G3 verdict: approvable, with no finding of this section open.
