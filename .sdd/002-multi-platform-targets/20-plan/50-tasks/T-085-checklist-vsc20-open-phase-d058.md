---
id: C002-T-085
title: "Fix for revision D-058: the cause outside-narrowed-step in the release check's step check, VSC-20's free-text half while a phase of the toy change is open, the record template and the T-050 run sheet"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-084]
implements: [C002-REQ-311, C002-REQ-614, C002-REQ-615, C002-REQ-618]
satisfies_ac: [C002-AC-311.1, C002-AC-614.1, C002-AC-615.1, C002-AC-618.1]
verified_by: [C002-TS-317, C002-TS-617, C002-TS-618, C002-TS-668, C002-TS-711, C002-TC-317, C002-TC-617, C002-TC-618, C002-TC-668, C002-TC-937]
components: [C002-COMP-011]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-085 — Fix for revision D-058: the cause outside-narrowed-step in the release check's step check, VSC-20's free-text half while a phase of the toy change is open, the record template and the T-050 run sheet

## Intent

Run 4 of C002-T-050 (2026-11-13, started 05:58 in `C:\Sandbox\runs\t050f`, candidate 7b8414a, after
C002-T-084 was done at fb7b9d2) passed every step except the free-text half of VSC-20 at its first
try. The checklist and the run sheet let P-01 type the answer "during or after the VSC-30 rework".
P-01 typed it after gate G1 was approved, when no phase of the toy change was open, and the conductor
logged the answer nowhere (defect D-058, on C002-TS-317). That behaviour is the conductor gap CHG-001
D-034 on C001-REQ-210: a known gap of 0.1.0, shared by Claude Code, fixed in a later change.

P-01 answered Q-t050-vsc20-03 with "Listed cause + known gap (Recommended)", after Q-t050-vsc20-01 and
Q-t050-vsc20-02 (`../questions-log.md`, round "2026-11-13 — C002-T-050 run 4, VSC-20 free-text half").
So the first try stays in VSC-20's `earlier_results` under the new cause `outside-narrowed-step`, with
the keys `defect` and `tracked_by`. The release check excuses such a failed try only when both keys
are defect IDs of the forms `D-<NNN>` and `CHG-<NNN> D-<NNN>` (C002-IF-009 §4 Earlier runs, Tries outside a narrowed step; §5 rule 6;
ERR-REL-004). The record review checks conditions (a) … (e) from the entry's `note` (C002-TS-618,
C002-TS-711).

This task:
- changes the release check's step check and its error catalogue mirror;
- adds the two new TS-668 rows to the release-check test;
- narrows the checklist's VSC-20 free-text half to an open phase (`draft`, `in-review` or
  `in-revision`; critic CR-208), with the input point of critic CR-213;
- brings the record template and the run sheet to the new cause.

No package file changes, so the candidate stays 7b8414a; no paid session. **Estimate S:** P-01's
option gave about 2–3 h for the code, spec and docs together. The code change is one branch of rule 6
plus one catalogue row; the rest is docs and test rows.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `scripts/release/evidence.ts` › `stepCheck`, rule 6 (the loop over `earlier_results`, lines 218–236) | an earlier `failed` run whose `cause` is `outside-narrowed-step` is excused when its `defect` matches `^D-\d{3}$` and its `tracked_by` matches `^CHG-\d{3} D-\d{3}$` (critic CR-219; one supporting C002-TS-668 test row each for a malformed value); this needs no step index and no restore re-run, and does not count toward the rerun count that the restore step must match (`RERUN_CAUSES` unchanged). Otherwise the line is `failed in an earlier run outside a narrowed step without defect and tracked_by` (C002-IF-009 §5 rule 6). Every other earlier `failed` run is unchanged: `repeated` stays binding with `failed in an earlier run not repeated under the rerun rule`. With an unreadable step index (ERR-REL-009 `checklist`), a try outside a narrowed step that has both keys stays excused (§5, last paragraph) |
| modify | `scripts/release/errors.ts` › `REL_CATALOGUE`, row ERR-REL-004 (line 23) | verbatim as the revised row of `10-spec/50-interfaces/errors.md` §3; "the ERR-REL catalogue mirrors errors.md §3 verbatim" (`release-check.test.ts` line 521) stays green |
| modify | `tests/integration/cap06/release-check.test.ts` › the C002-TS-668 rows (lines 609–645) | an `earlier` helper form with `defect` and `tracked_by`; after row 20 (the `skipped` / `repeated` row), the two new Examples rows of C002-TS-668 in spec order: `outside-narrowed-step` with `defect` `D-058` and `tracked_by` `CHG-001 D-034` → allowed; with `defect` `D-058` and no `tracked_by` → exactly the line `ERR-REL-004: copilot: checklist step VSC-02 is failed in an earlier run outside a narrowed step without defect and tracked_by`; `rows.length` 24 → 26 (C002-TC-668). Supporting rows outside the scenario: an empty `tracked_by` and an empty `defect` refuse with the same line; `outside-narrowed-step` with both keys and an unreadable step index stays excused; `outside-narrowed-step` with a `passed` result needs no keys |
| modify | `docs/checklists/vscode-copilot.md` › VSC-20, intro paragraph and **Do**, free-text half | the half runs **while a phase of the toy change is open**, that is, its status in the toy change's `change.md` is `draft`, `in-review` or `in-revision` (CR-208): during the VSC-30 rework (`draft`), before gate G1 is decided again, or **inside VSC-31**, after its revise (`in-revision`) and before gate G1 is decided (CR-213); **never after an approval and before the next phase starts** (then no phase is open, and the 0.1.0 conductor logs the answer in no questions log: CHG-001 D-034). "during or after the VSC-30 rework" is removed. The words the existing test pins stay: `chat.autoReply`, "free-text half", `Keep the CSV export out of v1`, "both halves pass", "one round" and `selected: []` (`checklist.test.ts` line 538). A history note: run 4's first try was typed after the G1 approval (D-058) |
| modify | same file › VSC-20 **Record** | the free-text half also records the open phase it ran in (phase and status, e.g. `00-ideation in-revision`) and the questions-log file and round that hold the answer. A try of the half outside the narrowed Do goes into VSC-20's `earlier_results` under `outside-narrowed-step`, with `defect`, `tracked_by` and the evidence for (a) … (e) in its `note` (C002-IF-009 §4) |
| modify | same file › the cause lists (the Run order text at lines 72–74 and 122, and the VSC-07 Record at line 345) | the cause `outside-narrowed-step` (a try outside a step's Do as narrowed by an approved revision; with `defect` and `tracked_by`; excused only with both, after review) beside the three rerun causes; the rerun rule itself is unchanged |
| modify | same file › "Who runs the steps" bullet (line 85) | P-01's batch after VSC-29: VSC-30, with VSC-20's free-text half typed during its rework; VSC-12; the twin half of VSC-01. The batch may continue inside VSC-31 for the free-text half (C002-IF-009 §4 Executor, CR-213) |
| modify | `docs/checklists/records/TEMPLATE.md` › the VSC-07 `earlier_results` example (line 35) and the field guidance (lines 235–242) | the cause placeholder adds `outside-narrowed-step`. The guidance gains the cause and the keys `defect` (the defect of this change whose revision narrowed the step, e.g. `D-058`) and `tracked_by` (the open defect that tracks the behaviour the try showed, change-qualified, e.g. `CHG-001 D-034`), both required for a `failed` try. It also says the `note` names the evidence for conditions (a) … (e) of C002-IF-009 §4 (the try's timestamp from the chat session file or hooks log and the commit time of the approval commit; the candidate commit of try and record; the narrowed Given and Do; the failing expectation and the excluded circumstance; the later run within the narrowed Do; the tracking defect). A try that does not meet them goes under `repeated`, which stays binding. The template must not contain the word "retake" (assertion at `checklist.test.ts` line 682, kept) |
| modify | same file › VSC-20 `free_text_half` and the VSC-20 / VSC-29 guidance (lines 75–78, 251–257) | `open_phase: "<phase of the toy change open when P-01 typed the answer, and its status: draft, in-review or in-revision, e.g. 00-ideation in-revision>"`; `questions_log` names the file and round of that phase's questions log |
| modify | same file › `## Notes` placeholder (line 285) | unchanged rule "Earlier runs belong in earlier_results, not here", now naming tries outside a narrowed step among them |
| modify | `docs/runsheets/T-050-vscode-checklist.md` › banner (after the run-3 paragraph, line 39) | run 4 (2026-11-13, 05:58, `t050f`, 7b8414a) passed every step except VSC-20's free-text half at its first try. That try was typed after gate G1 was approved (no phase open; D-058; the conductor gap CHG-001 D-034). P-01's answers: Q-t050-vsc20-01, "Retype in VSC-31 (Recommended)": retyped inside VSC-31 after the revise, Round 8, Q-export-01 of the toy ideation's questions log, then VSC-54 passed and P-01's settings were restored (`FF55715DE862`). Q-t050-vsc20-02, "Revision for VSC-20 (Recommended)", then Q-t050-vsc20-03, "Listed cause + known gap (Recommended)". No new run; the record of run 4 is rewritten after C002-T-085 is done (C002-T-050 step 0.5) |
| modify | same file › the end-batch paragraph (line 41) and step 5, Group 4 (line 209) | P-01's batch: send `/architect:gate <NNN>`, choose Revise and type the reason; during the rework (`draft`), before G1 is presented again, ask for the one round and type the answer; then Approve; then VSC-12 and the twin half of VSC-01. If the half has not passed by then, it runs inside VSC-31 after the revise (`in-revision`), before G1 is decided (CR-213). "during or after the VSC-30 rework" is removed |
| modify | same file › step 9 (the rerun rule, line 245) and step 11 | step 9 names the fourth cause with its keys. Step 11: the run-4 statement with C002-T-084's done commit stays. VSC-20's first try is recorded in `earlier_results` (`result: failed`, `cause: outside-narrowed-step`, `defect: D-058`, `tracked_by: CHG-001 D-034`, `note` with the evidence for (a) … (e) and candidate 7b8414a), not in the Notes. Condition (c) is worded as the spec words it (CR-212): "the try's only failing expectation fails because of the circumstance that the revision excludes". The review entry (C002-TC-618, C002-TC-937) and P-01's sign-off are dated after the G2 and G3 approvals of revision D-058 |
| modify | `tests/integration/cap06/checklist.test.ts` | a C002-T-085 test (C002-TC-617). VSC-20's Do names `draft`, `in-review` and `in-revision`, the VSC-30 rework and VSC-31, and says never after an approval; it no longer holds "during or after". Its Record names the open phase and the cause `outside-narrowed-step`. The cause lists (line 461's rule text) also name `outside-narrowed-step`. A C002-TC-618 template check: the VSC-07 example's cause placeholder includes `outside-narrowed-step` (line 481 keeps its three causes); the guidance names `defect`, `tracked_by` and the conditions (a) … (e); `free_text_half` has `open_phase`; `!/retake/i` on the template stays green. No existing test reads the run sheet (no file under `tests/` names `docs/runsheets/`) |

## Preconditions

- The G2 and G3 approvals of the revision for D-058: C002-IF-009 §4 Earlier runs (the cause
  `outside-narrowed-step`, the keys `defect` and `tracked_by`, "Tries outside a narrowed step"), §5
  rule 6, ERR-REL-004, C002-REQ-615, C002-REQ-618, C002-DOD-004, the glossary, C002-TS-317, the
  C002-TS-668 rows and C002-TS-711.
- CHG-001 defect D-034 open on C001-REQ-210 (the `tracked_by` of run 4's entry).
- C002-T-084 done (candidate 7b8414a, done commit fb7b9d2).
- Q-t050-vsc20-01 … 03 answered by P-01 and logged (`../questions-log.md`).

## Step outline (no production code)

1. **Tests first.** Add the two C002-TS-668 rows and the supporting rows to `release-check.test.ts`,
   and the C002-T-085 assertions to `checklist.test.ts`. Run `npm test -- cap06/release-check` and
   `npm test -- cap06/checklist`. The new rows fail against the current step check. The catalogue
   mirror test already fails against the revised `errors.md`.
2. **Release check.** Change rule 6 of `stepCheck` and the ERR-REL-004 row of `REL_CATALOGUE`, as the
   Targets table says; `npm test -- cap06/release-check` green, every earlier row unchanged.
3. **Checklist.** VSC-20's intro, Do, Record and history note; the cause lists; the "Who runs the
   steps" bullet. No step is added or removed; the step index, the run-order lines and the step IDs
   stay (the step check reads them, C002-IF-009 §5).
4. **Record template.** The cause placeholder, the field guidance with `defect`, `tracked_by` and
   the note evidence, `open_phase` and the `questions_log` placeholder. The template still parses
   (`splitFrontmatter` without error) and holds no "retake".
5. **Run sheet.** The run-4 banner, the batch order with the free-text half during the VSC-30 rework
   or inside VSC-31, step 9 and step 11.
6. **Check.** `npm run check`, then the dry run. **No `npm run package` and no file comparison**: no
   package input changes.
   - `scripts/package.mjs` `stageMarketplace` (lines 84–92) stages `.claude-plugin/marketplace.json`,
     `plugins/architect/` without `CLAUDE_EXCLUDES`, and a generated `INSTALL.md`.
   - `stageNpm` (lines 131–145) copies an allowlist from `plugins/architect/`, the built
     `sdd-mcp.mjs`, `LICENSE` and the notices.
   - `packageTargets` (lines 213–227) runs `scripts/generate.mjs`, whose source defaults to
     `plugins/architect` (`scripts/generate/main.ts` line 112).
   - The two bundles are built from `src/cli.ts` and `src/mcp/server.ts` (`scripts/build.mjs` lines
     22–23), and `src/` imports nothing from `scripts/release/`.

   So `scripts/release/`, `docs/` and `tests/` reach no artifact, and `dist/` and the candidate
   7b8414a stay as they are. If the dry run reports ERR-REL-007, the task stops and goes to the
   conductor.

## Verification

- `npm test -- cap06/release-check` (C002-TC-668 rows 1 … 26 and the catalogue mirror)
- `npm test -- cap06/checklist`
- `npm run check`
- `node scripts/release-check.mjs --target copilot --dry-run`: with the draft record of run 4 moved
  out of `docs/checklists/records/` for the run, refuses on ERR-REL-003 only (plan critic CR-217); with
  the draft in place the outcome is no evidence. The rewritten record of run 4 is C002-T-050's (step
  0.5), and no ERR-REL-007 may appear.
- `git diff --stat -- plugins/architect/ dist/` is empty

## Done when

- [ ] The step check excuses an earlier `failed` run under `outside-narrowed-step` only with `defect` of the form `D-<NNN>` and `tracked_by` of the form `CHG-<NNN> D-<NNN>`, and refuses it otherwise with the new ERR-REL-004 text; `repeated` stays binding; the catalogue mirrors `errors.md` §3
- [ ] `release-check.test.ts` holds the 26 rows of C002-TS-668 and the supporting rows; green
- [ ] VSC-20's free-text half runs while a phase of the toy change is `draft`, `in-review` or `in-revision` (during the VSC-30 rework, or inside VSC-31 after the revise), never after an approval; "during or after the VSC-30 rework" is gone from the checklist and the run sheet; the Record names the open phase and the cause for a try outside the narrowed Do
- [ ] The template names `outside-narrowed-step` with `defect`, `tracked_by` and the note evidence for (a) … (e); `free_text_half` has `open_phase`; the template holds no "retake"
- [ ] The run sheet carries the run-4 banner, the batch order, the fourth cause in step 9 and step 11's instruction for VSC-20's `earlier_results` entry, with condition (c) in the spec's wording
- [ ] `npm test -- cap06/checklist` and `npm run check` green; the dry run gives no ERR-REL-007; no file under `plugins/architect/` or `dist/` changed
- [ ] Progress reported: `sdd task set C002-T-085 --status done --commit <sha>`
