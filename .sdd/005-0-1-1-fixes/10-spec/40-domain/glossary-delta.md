---
id: "C005-SPEC-GLOSSARY"
artifact: spec/glossary-delta
change: "CHG-005"
phase: 10-spec
status: draft
---
# C005 — Glossary delta

Terms and system names of CHG-005 that `../../../_constitution/glossary.md` does not define. `sdd archive` merges both
tables into it (C001-REQ-919); it reads them from this file only, also for a lite change (`src/archive/plan.ts:360`;
critic CR-14). The Domain notes of `../spec.md` link here.

## 1. Domain terms
| Term | Definition |
|---|---|
| Create-change request | A request by P-01 that a new change be created: the new-change command (`/architect:new` on Claude Code, its generated prompt file on Copilot VS Code) or a request in plain words to the conductor (Q-newchange-01; C005-REQ-101) |
| New-change procedure | What the conductor does on a create-change request before the change exists: the size estimate against the constitution's profile thresholds, the new-change round, a further round for the kind after each kind answer that names no single kind and does not decline the change, then `sdd change new` with both options; an answer that declines the change ends the procedure with no change created (ideation §4.1 G-1; C005-REQ-101, C005-REQ-102, C005-REQ-123, C005-REQ-124) |
| New-change round | The first interview round of the new-change procedure: the profile proposal with its size estimate (C005-REQ-101) and, unless the create-change request gives the option `--kind`, the kind question (C005-REQ-123). A further round, which asks only for the kind, follows when the kind answer of this round or of a further round names no single kind (C005-REQ-124) |
| Change kind | `greenfield`, `brownfield` or `mixed`: the `kind` field of a change's `change.md`, set by the option `--kind` of `sdd change new`, which applies `greenfield` when the option is missing (C005-REQ-102, C005-REQ-123) |
| Pre-phase round | An interview round that P-01 answers after the approval of gate G1 or G2 and before the next phase starts; logged in the next phase's `questions-log.md` and marked as given before the phase started (Q-postgate-01; C005-REQ-103, C005-REQ-104); the lint result on that log: C005-REQ-126 |
| Install line | The one-time command `npm install -g architect-sdd@<version>` that comes before the bare `sdd` reporting commands in text for implementers, with `<version>` written as the bare semantic version of the plugin, never as a placeholder (Q-handoff-01; C005-REQ-105 to C005-REQ-110) |
| Frontmatter fallback | The paragraph of the Reporting protocol section, after its CLI commands, that tells an implementer who cannot run the sdd CLI to edit the task file's frontmatter `status` and fill `report.commit`, `report.completed_at` and `report.notes` (C001-REQ-616). The lite hand-off template gives the same paragraph, although a lite task is a section of `20-plan/plan.md` with report fields and no task file: a known limitation kept by ideation §4.2 item 5 (C005-US-103, Out of scope) |
| Report fields | The bullet fields Status, Commit, Notes and Completed at of a task section of a lite `20-plan/plan.md`, which `sdd task set` writes; the lite counterpart of the `status` and `report` keys of a task file's frontmatter. Their lines are outside the approval hash (Q-litehash-01; C005-REQ-121) |
| Archive task | A task whose work is to run `sdd archive` for its own change, such as C001-T-075; the sdd CLI recognises it only by the archive-task marker (Q-archive-01; C005-IF-002) |
| Archive-task marker | The optional frontmatter key of a full-profile task file, or the optional bullet field of a lite task section, that marks the task as its change's archive task; name and values: C005-IF-002 (Q-archive-01; C005-REQ-112, C005-REQ-114) |
| Archived change | A change whose folder `sdd archive` has moved to `.sdd/_archive/` and whose `change.md` status is `archived` |
| Change resolver | The part of the sdd CLI that turns the change number, or the full ID, given to a subcommand into a change folder; at 0.1.0 it searches `.sdd/NNN-*` only, and CHG-005 adds the lookup rules of C005-IF-001 |
| Read-only `sdd` subcommand | An `sdd` subcommand run in a form that writes no file: a subcommand absent from the table of writing `sdd` subcommands (C002-IF-008 §1.2, `WRITING_COMMANDS`), `status` or `trace` without `--write`, or `archive` with `--dry-run`. Those that name a change: `gate show`, `hash`, `lint`, `trace` without `--write`, `archive --dry-run` (C005-IF-001; C005-REQ-116) |

## 2. System names (allowed after `THE` in EARS statements)
| Name | Component |
|---|---|
| Reporting protocol section of `handoff.md` | The hand-off section with the install line, the reporting CLI commands and the frontmatter fallback (C001-REQ-616), written by the planner and, for a lite change, scaffolded by the sdd CLI |
| plugin README | `plugins/architect/README.md`, the README of the source plugin (C005-COMP-010); the system name "README" of the constitution is the repository's root `README.md` |
| 0.1.1 release | The GitHub release of Architect 0.1.1 that P-01 publishes, with the Claude Code plugin package (the plugin with its local marketplace) and the Copilot target package with its checksum, as for 0.1.0 (`docs/releases/github-release-notes-0.1.0.md`) |
| 0.1.1 release notes | The release notes of the 0.1.1 release |
