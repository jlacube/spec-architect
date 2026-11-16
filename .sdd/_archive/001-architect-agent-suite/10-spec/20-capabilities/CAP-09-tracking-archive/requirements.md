---
id: C001-CAP-09
artifact: spec/requirements
capability: "Implementation tracking, orientation and archive"
change: CHG-001
phase: 10-spec
status: approved
delta_default: ADDED
---

# C001-CAP-09 — Requirements

All `Delta: ADDED`. Interfaces: CLI C001-IF-01 (`task`, `defect`, `archive`), task and
manifest frontmatter C001-IF-03 §2–§3, hooks C001-IF-07, living-spec format C001-IF-03 §10.

### C001-REQ-901 — Task status update
- **Pattern:** event-driven
- **Statement:** WHEN `sdd task set <task-id> --status <status>` runs, THE sdd CLI SHALL write the status, and the provided `--commit` and `--note` values, into the task's frontmatter (`status`, `report.commit`, `report.notes`, and `report.completed_at` when the status is `done`) and then rebuild the registry.
- **Rationale:** IDEA-§10.6
- **Stories:** C001-US-901
- **Priority:** Must
- **Acceptance:** C001-AC-901.1, C001-AC-901.2

### C001-REQ-902 — Valid statuses only
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd task set` receives a status other than `todo`, `in-progress`, `blocked`, `done` or `dropped`, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-005` without modifying any file.
- **Rationale:** consistent lifecycle (domain model)
- **Stories:** C001-US-901
- **Priority:** Must
- **Acceptance:** C001-AC-902.1

### C001-REQ-903 — Blocked needs a reason
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd task set --status blocked` is run without `--reason`, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-006`.
- **Rationale:** blocked tasks must be actionable
- **Stories:** C001-US-901
- **Priority:** Must
- **Acceptance:** C001-AC-903.1

### C001-REQ-904 — Done before dependencies
- **Pattern:** unwanted-behaviour
- **Statement:** IF a task is set to `done` while a task in its `depends_on` list has a status other than `done` or `dropped`, THEN THE sdd CLI SHALL record the update and print warning `WARN-CLI-001` naming the unfinished dependencies.
- **Rationale:** surfaces out-of-order work without blocking reality
- **Stories:** C001-US-901
- **Priority:** Should
- **Acceptance:** C001-AC-904.1

### C001-REQ-905 — Implementation status derivation
- **Pattern:** ubiquitous
- **Statement:** THE sdd CLI SHALL derive each change's `implementation.status` and task counts from its task statuses according to the rules of C001-IF-03 §2.3, whether the statuses were set by command or by editing frontmatter.
- **Rationale:** frontmatter fallback (IDEA-§10.6 point 3)
- **Stories:** C001-US-902
- **Priority:** Must
- **Acceptance:** C001-AC-905.1

### C001-REQ-906 — Done without commit
- **Pattern:** unwanted-behaviour
- **Statement:** IF a task has status `done` and an empty `report.commit`, THEN THE lint SHALL report warning `LINT-TASK-003`.
- **Rationale:** P-04 needs commit links for validation
- **Stories:** C001-US-902
- **Priority:** Should
- **Acceptance:** C001-AC-906.1

### C001-REQ-907 — Defect creation
- **Pattern:** event-driven
- **Statement:** WHEN `sdd defect add --ref <id> --summary "<text>"` runs, THE sdd CLI SHALL add to `change.md` and `registry.json` a defect `D-<seq>` with the referenced ID, the summary, the reporter, the date and status `open`.
- **Rationale:** IDEA-§10.6
- **Stories:** C001-US-903
- **Priority:** Must
- **Acceptance:** C001-AC-907.1

### C001-REQ-908 — Defect must reference a real ID
- **Pattern:** unwanted-behaviour
- **Statement:** IF the `--ref` value of `sdd defect add` is not an ID defined in a non-archived change, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-008`.
- **Rationale:** traceable defects
- **Stories:** C001-US-903
- **Priority:** Must
- **Acceptance:** C001-AC-908.1

### C001-REQ-909 — Conductor surfaces open defects
- **Pattern:** event-driven
- **Statement:** WHEN the conductor orients itself and a change has open defects, THE conductor SHALL list each open defect with its referenced ID and propose `/architect:revise` for the phase that defines that ID.
- **Rationale:** IDEA-§20.3
- **Stories:** C001-US-903
- **Priority:** Must
- **Acceptance:** C001-AC-909.1

### C001-REQ-910 — Defect closure
- **Pattern:** event-driven
- **Statement:** WHEN `sdd defect close <D-id> --resolution "<text>"` runs, THE sdd CLI SHALL set the defect's status to `closed` with the resolution text and date.
- **Rationale:** lifecycle completeness
- **Stories:** C001-US-903
- **Priority:** Must
- **Acceptance:** C001-AC-910.1

### C001-REQ-911 — Session-start brief
- **Pattern:** event-driven
- **Statement:** WHEN a Claude Code session starts in a repository containing `.sdd/`, THE session-start hook SHALL emit a brief of at most 10 lines listing each active change with its phase, phase status, task progress and open-defect count.
- **Rationale:** IDEA-§17.2; RK-13
- **Stories:** C001-US-904
- **Priority:** Must
- **Acceptance:** C001-AC-911.1

### C001-REQ-912 — Silent without workspace
- **Pattern:** unwanted-behaviour
- **Statement:** IF a Claude Code session starts in a repository without `.sdd/`, THEN THE session-start hook SHALL exit with code 0 and empty output.
- **Rationale:** the plugin must not disturb unrelated repositories
- **Stories:** C001-US-904
- **Priority:** Must
- **Acceptance:** C001-AC-912.1

### C001-REQ-913 — Archive preconditions
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd archive <change>` is requested while gate G3 is not approved, a task has a status other than `done` or `dropped`, or a defect is open, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-009` listing every unmet precondition.
- **Rationale:** living specs describe implemented behaviour only
- **Stories:** C001-US-906
- **Priority:** Must
- **Acceptance:** C001-AC-913.1

### C001-REQ-914 — Archive ADDED requirements
- **Pattern:** event-driven
- **Statement:** WHEN `sdd archive` applies an `ADDED` requirement, THE sdd CLI SHALL append it to `_living/CAP-<slug>.md` of its capability, creating that file if absent and setting `inventory_only: false` while keeping any inventory sections.
- **Rationale:** OA-09; OQ-07
- **Stories:** C001-US-905
- **Priority:** Must
- **Acceptance:** C001-AC-914.1

### C001-REQ-915 — Archive MODIFIED requirements
- **Pattern:** event-driven
- **Statement:** WHEN `sdd archive` applies a `MODIFIED` requirement, THE sdd CLI SHALL replace the living entry of the cited requirement with the new requirement under its own ID and record the superseded ID, the change ID and the date in the History section of that living file.
- **Rationale:** OA-08 (IDs keep provenance)
- **Stories:** C001-US-905
- **Priority:** Must
- **Acceptance:** C001-AC-915.1

### C001-REQ-916 — Archive REMOVED requirements
- **Pattern:** event-driven
- **Statement:** WHEN `sdd archive` applies a `REMOVED` requirement, THE sdd CLI SHALL delete the cited living entry and record its ID, the change ID and the date in the History section.
- **Rationale:** OA-09
- **Stories:** C001-US-905
- **Priority:** Must
- **Acceptance:** C001-AC-916.1

### C001-REQ-917 — Archive RENAMED requirements
- **Pattern:** event-driven
- **Statement:** WHEN `sdd archive` applies a `RENAMED` requirement, THE sdd CLI SHALL update the title of the cited living entry, moving it to the target capability file when the capability differs, and record the old title in the History section.
- **Rationale:** OpenSpec RENAMED semantics (IDEA-§6.1.2)
- **Stories:** C001-US-905
- **Priority:** Should
- **Acceptance:** C001-AC-917.1

### C001-REQ-918 — Criteria travel with requirements
- **Pattern:** event-driven
- **Statement:** WHEN `sdd archive` writes a requirement into a living file, THE sdd CLI SHALL include the requirement's acceptance criteria and scenarios under it.
- **Rationale:** current truth must stay verifiable (P-04)
- **Stories:** C001-US-905
- **Priority:** Must
- **Acceptance:** C001-AC-918.1

### C001-REQ-919 — Glossary merge
- **Pattern:** event-driven
- **Statement:** WHEN `sdd archive` completes the requirement merge, THE sdd CLI SHALL add each term of the change's `glossary-delta.md` to `_constitution/glossary.md`, replacing the definition of an existing term of the same name.
- **Rationale:** C001-REQ-418
- **Stories:** C001-US-905
- **Priority:** Should
- **Acceptance:** C001-AC-919.1

### C001-REQ-920 — Move to archive
- **Pattern:** event-driven
- **Statement:** WHEN `sdd archive` has applied all merges, THE sdd CLI SHALL move the change folder to `.sdd/_archive/`, set the change status to `archived` and regenerate the registry and the SDD.md status block.
- **Rationale:** IDEA-§11.1
- **Stories:** C001-US-905
- **Priority:** Must
- **Acceptance:** C001-AC-920.1

### C001-REQ-921 — Archive dry run
- **Pattern:** optional-feature
- **Statement:** WHERE `--dry-run` is passed to `sdd archive`, THE sdd CLI SHALL print every planned operation (file, operation, ID) without modifying any file.
- **Rationale:** preview before an irreversible-feeling merge
- **Stories:** C001-US-906
- **Priority:** Must
- **Acceptance:** C001-AC-921.1

### C001-REQ-924 — Interrupted archive completes on re-run
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd archive <change>` runs after an earlier `sdd archive` run of that change was interrupted after writing part of its results (living-spec entries, History rows, glossary rows or the `archived` status in `change.md`) and before moving the change folder to `.sdd/_archive/`, and the change's status is `active` or `archived` and the C001-REQ-913 preconditions hold, THEN THE sdd CLI SHALL complete the operations of C001-REQ-914 … C001-REQ-920 that the interrupted run left undone, so that `.sdd/_living/`, `.sdd/_constitution/glossary.md` and `.sdd/_archive/` (including the moved `change.md`) are byte-identical to one uninterrupted run from the same starting workspace on the date of the interrupted run, with no requirement entry and no History row written twice, the only allowed differences being the History `Date` cells and the living-file `updated` values that a re-run on a later date writes.
- **Rationale:** D-015 (C001-T-080 finding F-6); Q-archive-faults-01, Q-archive-resume-01; critic CR-17. An `archived` status outside `.sdd/_archive/` can only come from an interrupted archive, so `sdd archive` resumes such a change instead of refusing it with ERR-CLI-014; a `stopped` change is still refused with ERR-CLI-014 (C001-INV-06, `../../50-interfaces/errors.md` §1). Operations already applied are recognised without comparing dates, because the re-run can happen on a later day.
- **Stories:** C001-US-905
- **Priority:** Must
- **Acceptance:** C001-AC-924.1

### C001-REQ-922 — Allowed task transitions only
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd task set` requests a status transition that the task state machine (`../../40-domain/state-machines.md` §3) does not list, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-013` naming the current and requested statuses.
- **Rationale:** lifecycle integrity (domain model)
- **Stories:** C001-US-901
- **Priority:** Must
- **Acceptance:** C001-AC-922.1

### C001-REQ-923 — Defect reopening
- **Pattern:** event-driven
- **Statement:** WHEN `sdd defect reopen <D-id> --change <NNN>` runs on a closed defect, THE sdd CLI SHALL set its status to `open` while keeping its previous resolution and closing date in a history list of that defect.
- **Rationale:** a fix may turn out incomplete during implementation
- **Stories:** C001-US-903
- **Priority:** Should
- **Acceptance:** C001-AC-923.1
