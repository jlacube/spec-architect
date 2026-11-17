---
id: "C005-PLAN-HANDOFF"
artifact: plan/handoff
change: "CHG-005"
phase: 20-plan
status: draft
---
# CHG-005 — Hand-off to the implementer

## Reading order
1. `.sdd/_constitution/constitution.md`: Quality bar, Global DoD, Version control, Language & conventions.
2. `.sdd/005-0-1-1-fixes/10-spec/spec.md`: Context, then the requirements and scenarios your task names, then
   Interfaces (C005-IF-001 to C005-IF-005, Error and rule catalogue) and Architecture notes (components, constraints).
   The scenario lists of flow F5 in the Architecture notes omit C005-TS-173 and C005-TS-174 (critic CR-37; accepted by P-01 as navigation text, Q-specnav-01); both
   scenarios still bind C005-T-011 and C005-T-014.
3. `.sdd/005-0-1-1-fixes/10-spec/dod.md`.
4. `.sdd/005-0-1-1-fixes/20-plan/20-decisions/ADR-001-new-change-skill.md` (C005-ADR-001) and the release ADR of this
   change in the same folder (eval classes).
5. `.sdd/005-0-1-1-fixes/20-plan/evidence/impact.md`: regression set, hotspots, per-component notes.
6. `.sdd/005-0-1-1-fixes/20-plan/plan.md`: Strategy, then your task section.
7. For the release tasks: `docs/release-procedure-0.1.0.md`, then `docs/release-procedure-0.1.1.md` once C005-T-017
   has written it.

## Rules
- Do not change approved spec artifacts; report a spec defect instead (`defect add`, below) and stop the task.
- Write the tests listed in a task's Verified by first, then implement.
- Commit once per task with the task ID at the start of the message; never push without P-01.
- A task that changes `src/` runs `npm run build` and commits the rebuilt `plugins/architect/scripts/sdd.mjs` in the
  same commit (C005-RISK-002).
- A task that edits plugin text updates the tests that pin the lines it moves, in the same commit (C005-RISK-003).
- Eval runs use the per-run cost cap of the harness; stop and ask P-01 before the running total of C005-T-014 and
  C005-T-015 passes the upper bound of Q-budget-01 (`plan.md`, Strategy, Evals and budget). The Copilot CLI runs of
  C005-T-024 follow its own spending rule: stop and ask P-01 before a batch could take the overage past P-01's 50 €
  allowance (Q-copilot-cost-01).
- Every `--note` and `--reason` value, and every Notes field edited by hand, is a single line. A second line would
  stay inside the approval hash of `20-plan` and make it stale (C005-IF-005 §2). Multi-line output (command output,
  size tables) goes into `docs/release-0.1.1-evidence.md` or the commit message.
- Write nothing under `.sdd/` by hand except the report fields of a task section through the fallback below.
- **Conductor rule** until the installed Architect plugin is 0.1.1 (C005-T-021 step 5): on CHG-005 the conductor
  does not dispatch `sdd-auditor` and does not run `/architect:revise`, `/architect:gate`, `/architect:plan` or
  `/architect:archive`, because all of them call the 0.1.0 plugin CLI. It runs their CLI steps by hand with the
  working-tree CLI of stage 2 below. Every stale check names its change, with either CLI, and none runs
  unnumbered: CHG-005 with `node plugins/architect/scripts/sdd.mjs stale check 005`, every other change with the
  plugin CLI by number, so the working-tree CLI never touches the hashes of CHG-003 and CHG-004 (`plan.md`, Strategy
  rule 1).

## Reporting protocol

CHG-005 is a lite change that fixes the sdd CLI it is reported with. The sdd CLI 0.1.0 counts the report fields of
a lite task in the approval hash of `20-plan` (C005-REQ-121), so this change reports in three stages.

1. **Until C005-T-001 is committed:** report nothing on CHG-005 and run no `stale check`, `gate` or `archive`
   command on this workspace. C005-T-001 is set `done` after its commit, with the command of stage 2.
2. **From the commit of C005-T-001 until the installed Architect plugin is 0.1.1 (C005-T-021 step 5):** every sdd
   command on this workspace runs the CLI built from the working tree, from the repository root:
   `node plugins/architect/scripts/sdd.mjs …`. This covers `task set` and `defect add`, and also `stale check`, `hash`,
   `gate show`, `gate approve`, `change revise` and `archive`, whoever runs them: implementer or conductor. A stale
   check always names the change, `stale check 005`, and never runs unnumbered: the unnumbered form would also hash
   CHG-003 and CHG-004 with the 0.1.1 rule (Rules, Conductor rule). Do not use the conductor's plugin CLI of Architect 0.1.0, the agents and commands that
   call it (Rules, Conductor rule), or an npm `sdd` 0.1.0 here: their hash rule sets the `20-plan` of CHG-005 stale
   again after the re-approval of C005-T-002 (C005-REQ-122; `plan.md`, rollback step 4). Each note is one line.

```bash
node plugins/architect/scripts/sdd.mjs task set <task-id> --status in-progress
node plugins/architect/scripts/sdd.mjs task set <task-id> --status done --commit <sha> --note "<summary>"
node plugins/architect/scripts/sdd.mjs task set <task-id> --status blocked --reason "<why>"
node plugins/architect/scripts/sdd.mjs defect add --ref <ID> --summary "<what is wrong>"
```

3. **From C005-T-019 (`architect-sdd` 0.1.1 on npm):** the same commands may run as bare `sdd` commands after a
   one-time install (Node.js 20 or later). The line names 0.1.1, not the 0.1.0 that `sdd --version` printed when
   this plan was written: 0.1.0 has the hash fault that this change fixes. Once the installed plugin is 0.1.1 and
   the conductor's `sdd --version` prints 0.1.1 (C005-T-021 step 5), its CLI, its agents and its commands may be
   used again as well.

```bash
npm install -g architect-sdd@0.1.1
sdd task set <task-id> --status in-progress
sdd task set <task-id> --status done --commit <sha> --note "<summary>"
sdd task set <task-id> --status blocked --reason "<why>"
sdd defect add --ref <ID> --summary "<what is wrong>"
```

**Frontmatter fallback** (when no CLI can be run): a lite task has no task file and no frontmatter. Edit the
report fields of the task section in `.sdd/005-0-1-1-fixes/20-plan/plan.md` in the exact form that `sdd task set`
writes: `- **Status:** <status>`, `- **Commit:** <sha>`, `- **Completed at:** <YYYY-MM-DD>` and, for a note or a
blocked reason, `- **Notes:** <text>`, each on one line. From the commit of C005-T-001, lines in that form stay
outside the approval hash (C005-IF-005); a line in another form, a continuation line included, makes `20-plan` stale.

The archive task C005-T-023 is set `in-progress` before `sdd archive` runs and keeps that status in the archive
(C005-REQ-112, Open items).

## Definition of change done
- Every task other than C005-T-023 is `done` before C005-T-023 runs `sdd archive 005`.
- `docs/release-0.1.1-evidence.md` holds the evidence of C005-DOD-001 to C005-DOD-009 and DOD-G-01 to DOD-G-07,
  with P-01's decision on the DOD-G-01 waiver of C005-TS-156 (carried to CHG-003).
- No open defect of CHG-005.
- `node plugins/architect/scripts/sdd.mjs stale check 005` reports `20-plan` approved immediately before the archive.
- `sdd archive 005` has moved the change to `.sdd/_archive/005-0-1-1-fixes/` and updated the living files
  (DOD-G-06).

## Ordered task list
| # | Task | Title | File |
|---|---|---|---|
| 1 | C005-T-001 | Lite plan hash without the report-field lines | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 2 | C005-T-002 | G3 re-approval of CHG-005 with the working-tree CLI | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 3 | C005-T-003 | Versioned install line in the hand-off templates | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 4 | C005-T-004 | Lint rules LINT-HAND-003 and LINT-TASK-005 | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 5 | C005-T-005 | Lint engine: archived change selection and pre-phase questions log | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 6 | C005-T-006 | `SDD.md` implementer section with the install line | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 7 | C005-T-007 | Planning skill: versioned install line and archive-task marker | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 8 | C005-T-008 | Archive preconditions: archive-task marker and lite task sections | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 9 | C005-T-009 | CLI front-end: archived lookup for read-only and writing invocations | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 10 | C005-T-010 | New-change procedure in `phase-ideation`, `commands/new.md` and the conductor | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 11 | C005-T-011 | Eval cases of the kind round | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 12 | C005-T-012 | Pre-phase round: interview-protocol §5 and the conductor rule | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 13 | C005-T-013 | Plugin README step 6 and the plugin-path scan | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 14 | C005-T-014 | Eval floor on Claude Code: create-change scenarios | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 15 | C005-T-015 | Eval floor on Claude Code: pre-phase, planner and archive-marker scenarios | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 16 | C005-T-016 | Version 0.1.1, release build and checks | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 17 | C005-T-017 | Release notes 0.1.1 and release procedure | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 18 | C005-T-024 | Copilot CLI injection suite on the 0.1.1 package | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 19 | C005-T-018 | Manual Copilot VS Code runs and the Copilot release checklist | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 20 | C005-T-019 | Publish `architect-sdd` 0.1.1 on npm | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 21 | C005-T-020 | C005-NFR-001 check in three shells | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 22 | C005-T-021 | Release 0.1.1 on both hosts | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 23 | C005-T-022 | DoD evidence and close preconditions | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
| 24 | C005-T-023 | Archive CHG-005 into living specs | `.sdd/005-0-1-1-fixes/20-plan/plan.md` |
