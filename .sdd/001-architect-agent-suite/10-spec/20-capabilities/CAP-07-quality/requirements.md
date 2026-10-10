---
id: C001-CAP-07
artifact: spec/requirements
capability: "Quality: lint, traceability, critic, auditor"
change: CHG-001
phase: 10-spec
status: draft
delta_default: ADDED
---

# C001-CAP-07 — Requirements

All `Delta: ADDED`. Interfaces: lint report C001-IF-11 §1, critic report C001-IF-11 §2,
trace.json C001-IF-12, rule catalogue `50-interfaces/errors.md`.

### C001-REQ-701 — Lint scopes
- **Pattern:** event-driven
- **Statement:** WHEN `sdd lint` runs, THE lint SHALL check the change named as argument, or every non-archived change plus the workspace root files when no change is named, optionally restricted to one phase by `--phase`.
- **Rationale:** IDEA-§17.1
- **Stories:** C001-US-701
- **Priority:** Must
- **Acceptance:** C001-AC-701.1

### C001-REQ-702 — Finding format
- **Pattern:** ubiquitous
- **Statement:** THE lint SHALL report each finding with a rule code, a severity (`error`, `warn` or `info`), the file path relative to the repository root, the line number when applicable, the IDs involved and a one-line message.
- **Rationale:** actionable output; C001-NFR-601
- **Stories:** C001-US-701
- **Priority:** Must
- **Acceptance:** C001-AC-702.1

### C001-REQ-703 — JSON output
- **Pattern:** optional-feature
- **Statement:** WHERE `--json` is passed, THE lint SHALL write its findings to standard output as a JSON document conforming to C001-IF-11 §1.
- **Rationale:** tool consumption (hooks, auditor)
- **Stories:** C001-US-701
- **Priority:** Must
- **Acceptance:** C001-AC-703.1

### C001-REQ-704 — Exit codes
- **Pattern:** ubiquitous
- **Statement:** THE lint SHALL exit with code 0 when it reports no error-severity finding, 1 when it reports at least one, and 2 on usage or internal failure.
- **Rationale:** IDEA-§17.1 exit codes
- **Stories:** C001-US-701
- **Priority:** Must
- **Acceptance:** C001-AC-704.1

### C001-REQ-705 — Quick single-file mode
- **Pattern:** optional-feature
- **Statement:** WHERE `--quick --file <path>` is passed, THE lint SHALL evaluate only the rules whose inputs are contained in that file and finish within the time limit of C001-NFR-102.
- **Rationale:** PostToolUse hook feedback (IDEA-§17.2)
- **Stories:** C001-US-701
- **Priority:** Must
- **Acceptance:** C001-AC-705.1

### C001-REQ-706 — Trace graph and matrix
- **Pattern:** event-driven
- **Statement:** WHEN `sdd trace <change> --write` runs, THE sdd CLI SHALL write `10-spec/80-traceability.md`, `20-plan/80-traceability.md` (once the plan phase has started) and `trace.json` at the change root, built from every ID definition and reference in the change.
- **Rationale:** IDEA-§12.3
- **Stories:** C001-US-702
- **Priority:** Must
- **Acceptance:** C001-AC-706.1

### C001-REQ-707 — Matrix directions
- **Pattern:** event-driven
- **Statement:** WHEN the sdd CLI writes a traceability markdown file, THE sdd CLI SHALL include a forward table (US → REQ → AC → TS, and in the plan REQ → T → TC → DOD) and a backward table (TS → AC → REQ → US, and TC → T → REQ).
- **Rationale:** traceable both ways (IDEA-P-13)
- **Stories:** C001-US-702
- **Priority:** Must
- **Acceptance:** C001-AC-707.1

### C001-REQ-708 — Coverage statistics
- **Pattern:** event-driven
- **Statement:** WHEN the sdd CLI writes a traceability file, THE sdd CLI SHALL include, for each traceability rule TR-01 to TR-08, the number of covered items, the number of items and the coverage percentage.
- **Rationale:** gate summary input (IDEA-§18.2)
- **Stories:** C001-US-702
- **Priority:** Must
- **Acceptance:** C001-AC-708.1

### C001-REQ-709 — trace.json schema
- **Pattern:** ubiquitous
- **Statement:** THE sdd CLI SHALL write `trace.json` conforming to C001-IF-12, containing every node (ID, type, file, line, title) and every typed edge (from, to, relation).
- **Rationale:** P-04 and v2 conformance checker
- **Stories:** C001-US-702
- **Priority:** Must
- **Acceptance:** C001-AC-709.1

### C001-REQ-710 — Critic report format
- **Pattern:** event-driven
- **Statement:** WHEN the critic reviews a phase, THE critic SHALL write `critic-report.md` (ideation) or `90-critic-report.md` (spec, plan) with each finding carrying an ID, a severity (`blocker`, `major` or `minor`), the referenced artifact IDs, a verbatim quote with file and line, the reason it matters and a suggested fix.
- **Rationale:** IDEA-§14.3 A8
- **Stories:** C001-US-703
- **Priority:** Must
- **Acceptance:** C001-AC-710.1

### C001-REQ-711 — Rubric-driven review
- **Pattern:** event-driven
- **Statement:** WHEN the critic reviews an artifact type, THE critic SHALL apply every checklist item of the rubric for that type in the `critique-rubrics` skill and report the result of each item (pass, finding ID, or n/a with reason) in a rubric table.
- **Rationale:** mitigates lenience (IDEA-RK-08)
- **Stories:** C001-US-703
- **Priority:** Must
- **Acceptance:** C001-AC-711.1

### C001-REQ-712 — No silent pass
- **Pattern:** unwanted-behaviour
- **Statement:** IF the critic reports fewer than three findings for a phase review, THEN THE critic SHALL justify, per rubric section, why no further issue exists.
- **Rationale:** IDEA-RK-08 mitigation ("find ≥N issues or justify none")
- **Stories:** C001-US-703
- **Priority:** Should
- **Acceptance:** C001-AC-712.1

### C001-REQ-713 — Critic is read-only on artifacts
- **Pattern:** ubiquitous
- **Statement:** THE critic SHALL NOT modify any file other than its own critic report.
- **Rationale:** independence; authors fix, critic reviews
- **Stories:** C001-US-703
- **Priority:** Must
- **Acceptance:** C001-AC-713.1

### C001-REQ-714 — Revision reviews focus on changes
- **Pattern:** event-driven
- **Statement:** WHEN the critic reviews a phase in revision, THE critic SHALL review every ID whose content hash changed since the last approval plus every ID linked to them, listing that reviewed ID set in its report.
- **Rationale:** cost control (IDEA-§19)
- **Stories:** C001-US-703
- **Priority:** Should
- **Acceptance:** C001-AC-714.1

### C001-REQ-715 — Auditor duties
- **Pattern:** event-driven
- **Statement:** WHEN the conductor requests an audit, THE auditor SHALL run `sdd lint --json`, `sdd trace --write`, `sdd stale check` and `sdd status --write` in that order and return the error, warning and info counts, the coverage statistics and the stale phases.
- **Rationale:** IDEA-§14.3 A9, §18.2 step 1
- **Stories:** C001-US-704
- **Priority:** Must
- **Acceptance:** C001-AC-715.1

### C001-REQ-716 — Open-items file
- **Pattern:** event-driven
- **Statement:** WHEN `sdd trace --write` runs, THE sdd CLI SHALL regenerate `85-open-items.md` in each started phase folder listing every `[NEEDS CLARIFICATION]`, `[ASSUMPTION]` and `[WAIVED]` marker located outside code spans, quoted strings and fenced code blocks, with its file, line and question or gate reference.
- **Rationale:** IDEA-§11.3
- **Stories:** C001-US-704
- **Priority:** Must
- **Acceptance:** C001-AC-716.1

### C001-REQ-717 — Dangling references
- **Pattern:** unwanted-behaviour
- **Statement:** IF an artifact references an ID that is neither defined in the workspace nor tombstoned, THEN THE lint SHALL report error `TR-12` with the reference location.
- **Rationale:** IDEA-§12.2 TR-12
- **Stories:** C001-US-705
- **Priority:** Must
- **Acceptance:** C001-AC-717.1

### C001-REQ-718 — Duplicate or resurrected IDs
- **Pattern:** unwanted-behaviour
- **Statement:** IF an ID is defined more than once in the workspace or a tombstoned ID is defined again, THEN THE lint SHALL report error `TR-13` listing each definition location.
- **Rationale:** IDEA-§12.2 TR-13
- **Stories:** C001-US-705
- **Priority:** Must
- **Acceptance:** C001-AC-718.1

### C001-REQ-719 — Placeholder text
- **Pattern:** unwanted-behaviour
- **Statement:** IF an artifact contains `TBD`, `TODO`, `lorem` or `etc.` outside code blocks and quoted strings, THEN THE lint SHALL report error `LINT-TXT-001`.
- **Rationale:** IDEA-§13.8
- **Stories:** C001-US-705
- **Priority:** Must
- **Acceptance:** C001-AC-719.1

### C001-REQ-720 — Markers at gate time
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd gate approve` is requested for a phase that still contains, outside code spans, quoted strings and fenced code blocks, a `[NEEDS CLARIFICATION]` marker not listed in a `--waive` argument, THEN THE sdd CLI SHALL refuse the approval with error `ERR-CLI-011`.
- **Rationale:** IDEA-P-06
- **Stories:** C001-US-705
- **Priority:** Must
- **Acceptance:** C001-AC-720.1
