---
id: "C005-SPEC-QLOG"
artifact: spec/questions-log
change: "CHG-005"
phase: 10-spec
status: draft
---
# CHG-005 — Questions log (10-spec)

## Round 1 — 2026-11-17

### Q-archive-01 — How should `sdd archive` recognise the archive task of a change, for both full and lite changes?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 5 (cartographer, `10-spec/evidence/spec-addendum.md` §4)
- **Why it matters:** decides the exemption rule that C001-REQ-913 and G-4 state, and whether the task contract or the `sdd archive` interface changes.
- **Options:**
  1. Marker in the task (Recommended) — one optional key on a full task file and one field on a lite task; the CLI decides alone; no marker keeps today's self-block (fails safe). Score 4.5.
  2. --task option on archive — `sdd archive <NNN> --task <T-ID>`; no task-file change; new CLI surface; the conductor names the task each time. Score 4.
  3. Title contains 'archive' — no contract change; four CHG-001 titles match, only one is the archive task. Score 2.
- **Rejected:** Last task of the hand-off ordered list — CHG-002 had no archive task, its last row is a release task (E-90); The single task in progress when `sdd archive` runs — any in-progress task would pass (E-93).
- **Sources:** E-87…E-94
- **Answer:** Marker in the task (Recommended)
- **Extracted instructions:** none

### Q-sddmd-01 — What should 0.1.1 do for existing workspaces whose SDD.md keeps the old plugin-path sentence?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4 (conductor: release note only; rewrite on `status --write`; rejected below)
- **Why it matters:** the new reporting sentence reaches only new workspaces' SDD.md; only `sdd init --force` rewrites it today (E-80).
- **Options:**
  1. Release note only (Recommended) — new workspaces get the new text; 0.1.1 release notes tell existing users which line to change; no CLI change.
  2. Rewrite on status --write — the CLI replaces the old sentence when found; more CLI work and a preservation test.
- **Rejected:** Tell users to run `sdd init --force` — rewrites more than the one sentence; Leave it unstated — CR-1 gap stays open for existing workspaces.
- **Sources:** E-79, E-80; ideation critic-report.md CR-1
- **Answer:** Release note only (Recommended)
- **Extracted instructions:** none

## Round 2 — 2026-11-17

### Q-profile-01 — CHG-005 has 6 stories and 20 requirements (constitution lite thresholds: ≤ 3 stories, ≤ 10 requirements). Which profile should it keep?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4 (conductor)
- **Why it matters:** the constitution's Profile thresholds are exceeded; the profile shapes the spec and plan layout and the cost of later phases.
- **Options:**
  1. Keep lite (Recommended) — five small independent fixes fit one spec.md and plan.md; thresholds guide the proposal; switching mid-phase re-lays out the spec.
  2. Upgrade to full — `sdd change profile`; matches thresholds; re-layout and higher cost of later phases.
  3. Split into two lite changes — CLI fixes vs conductor text; re-split work, two release tracks for one 0.1.1.
- **Rejected:** Merge requirements down to ≤ 10 — breaks the EARS singularity rule.
- **Sources:** `.sdd/_constitution/constitution.md` §Profile thresholds; spec-writer hand-back (step 3)
- **Answer:** Keep lite (Recommended)
- **Extracted instructions:** none

### Q-extra-reqs-01 — Keep C005-REQ-108 and C005-REQ-115 (spec-writer additions, Should)?
- **Blocking:** no · **Material:** no
- **Why it matters:** both go beyond P-01's explicit answers; each mitigates a risk logged in ideation §9 (unfilled `<version>`, CR-2; archive exemption misfire).
- **Options:**
  1. Keep both as Should (Recommended) — cheap lint checks against logged risks.
  2. Drop both — smaller change; risks rely on tests only.
- **Sources:** spec.md C005-REQ-108, C005-REQ-115
- **Answer:** Keep both as Should (Recommended)
- **Extracted instructions:** none

## Round 3 — 2026-11-17

### Q-litehash-01 — Lite task reports change the approved plan's hash; how should CHG-005 handle this?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 4 (critic, CR-10)
- **Why it matters:** `sdd task set` writes Status, Commit, Notes and Completed at into the body of a lite `20-plan/plan.md`, which the approval hash covers; 20-plan goes stale and `sdd archive` refuses (C005-REQ-113 makes lite reporting mandatory).
- **Options:**
  1. Exclude report fields (Recommended) — hash skips the report fields of lite task sections, as it skips task-file frontmatter; MODIFIED C001-REQ-806, CLI work, tests, one-time rule for lite plans approved under 0.1.0.
  2. Known gap, re-approve G3 — hash unchanged; defect carried; every lite change re-approves G3 before archive.
  3. Archive ignores report-only drift — G3 precondition accepts report-only differences; second comparison rule.
- **Rejected:** Move lite task status into plan.md frontmatter — changes the lite plan layout, task set, status block and LINT-TASK-004.
- **Sources:** C005-REQ-112, C005-REQ-113, C001-REQ-806, 90-critic-report.md CR-10
- **Answer:** Exclude report fields (Recommended)
- **Extracted instructions:** none

### Q-vscode-01 — How should Copilot VS Code be verified for the D-032/D-034 scenarios?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4 (conductor from critic CR-11)
- **Why it matters:** the Copilot CLI eval runner starts with `--no-ask-user`, and Copilot CLI is not a target (C002-NG-01), so the planned Copilot rows cannot run or prove VS Code behaviour.
- **Options:**
  1. Manual VS Code check (Recommended) — one recorded manual run per main case in Copilot VS Code (C002-TS-220 precedent); Claude Code keeps automated evals.
  2. Claude Code evals only — Copilot covered by the shared-text argument (E-8); no direct evidence.
- **Rejected:** Copilot CLI runner with the question tool enabled — Copilot CLI is not a target, proves nothing for VS Code; Drop Copilot verification — leaves a released host unchecked.
- **Sources:** 90-critic-report.md CR-11; C002-TS-220
- **Answer:** Manual VS Code check (Recommended)
- **Extracted instructions:** none

### Q-livingcap-01 — Which living file receives the ADDED requirements of the lite CHG-005 at archive?
- **Blocking:** no · **Material:** no
- **Why it matters:** with no capability key in spec.md's frontmatter, `sdd archive` writes them to a new `_living/CAP-0-1-1-fixes.md`.
- **Options:**
  1. New 0.1.1-fixes file (Recommended) — default lite behaviour, no CLI change; related requirements sit in two living files.
  2. One existing capability file — all ADDED requirements go there although most belong elsewhere.
- **Sources:** C005-CAP-01, 90-critic-report.md CR-14
- **Answer:** New 0.1.1-fixes file (Recommended)
- **Extracted instructions:** none

## Round 4 — 2026-11-17

### Q-litehash-02 — Which one-time rule should 0.1.1 apply to lite plans approved with sdd 0.1.0?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 5 (spec-writer)
- **Why it matters:** under the 0.1.1 rule (C005-REQ-121) a stored 0.1.0 hash includes the report fields, so such a plan shows a changed hash; decides whether stale-check migration code is in scope (C005-REQ-122). CHG-005 itself is affected if its G3 is approved with sdd 0.1.0.
- **Options:**
  1. Re-approve G3 once (Recommended) — no compatibility code; first 0.1.1 stale check marks the plan stale; P-01 revises and re-approves G3 once, per the 0.1.1 release notes. Score 4.60.
  2. Verified one-time rehash — stale check keeps the plan approved when the stored hash equals the 0.1.0-rule hash; saves the re-approval only if no task was reported since G3; adds code and tests. Score 4.10.
- **Rejected:** Accept either hash permanently — goes stale at the first task report anyway; Record the hash rule in each approval — new field for the same outcome; Choose the rule by approval date — ambiguous on release day.
- **Sources:** C005-REQ-121, C005-REQ-122, C001-REQ-810, 90-critic-report.md CR-10, `src/gate/hash.ts:54-59`
- **Answer:** Re-approve G3 once (Recommended)
- **Extracted instructions:** none

## Round 5 — 2026-11-17

### Q-opencode-01 — Carry C005-TS-156 (OpenCode row of the profile round) to CHG-003 with a waiver, or run it in CHG-005?
- **Blocking:** no · **Material:** no
- **Why it matters:** DOD-G-01 requires every scenario to pass or be waived; CHG-003 held no record of it (critic CR-26).
- **Options:**
  1. Carry to CHG-003 (Recommended) — OpenCode not released in 0.1.1; CHG-002 precedent (Q-opencode-scope-01); DOD-G-01 waiver at CHG-005's close and a carry note in CHG-003.
  2. Run it in CHG-005 — no waiver; adds an OpenCode eval run and setup to CHG-005's budget.
- **Sources:** C005-TS-156, C005-DOD-001, 90-critic-report.md CR-26
- **Answer:** Carry to CHG-003 (Recommended)
- **Extracted instructions:** none

### Q-prelog-lint-01 — How should the spec cover lint flagging a pre-phase questions log (C005-TS-111)?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4 (conductor: requirement; defect route; rejected below)
- **Why it matters:** no requirement owns a lint change if C005-TS-111 fails (critic CR-13).
- **Options:**
  1. Requirement: lint accepts it (Recommended) — a lint fix is in scope if TS-111 fails; closes CR-13.
  2. Defect route only — failure logged as a defect, spec revised mid-implementation.
- **Rejected:** Drop TS-111 — leaves the D-034 lint risk unchecked; Put the pre-phase log outside the phase folder — contradicts Q-postgate-01 ("Next phase's log").
- **Sources:** C005-TS-111, C005-REQ-103, 90-critic-report.md CR-13
- **Answer:** Requirement: lint accepts it (Recommended)
- **Extracted instructions:** none
