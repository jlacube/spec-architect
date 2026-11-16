---
capability: quality
inventory_only: false
updated: 2026-11-16
---

# Quality: lint and traceability (`C001-CAP-07`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

The deterministic checks (lint engine and its rules) and the traceability graph, coverage matrices
and open-items list, plus the critic and auditor agents that run or interpret them.

## Entry points

- `sdd lint`, `sdd trace` (`lint`, `traceCmd`, `traceActive` in `src/cli/commands.ts`).
- Command `plugins/architect/commands/lint.md`.
- Agents `plugins/architect/agents/sdd-critic.md`, `sdd-auditor.md`.
- Hook `SubagentStop` runs `trace --quiet --write --active` (`plugins/architect/hooks/hooks.json`).

## Main modules

- `src/lint/` — `engine.ts`, `types.ts`, `ears.ts`, `spec.ts`, `spec-facts.ts`, and
  `rules/` (52 rule files, registry in `rules/index.ts`).
- `src/trace/` — `model.ts`, `matrix.ts`, `open-items.ts`, `write.ts`.
- Skill `plugins/architect/skills/critique-rubrics/`.
- Critic parsing for gates: `src/gate/critic-parse.ts`.

## Owning tests

- `tests/integration/cap07/` (`TS-701` … `TS-719`, `trace-fixture.ts`).
- `tests/unit/lint/`, `tests/lint-fixtures/` (run by `tests/unit/lint/fixtures.test.ts`).
- Evals and benchmarks: `evals/cap07/`, `bench/lint.mjs`, `bench/lint-quick.mjs`.

## Evidence

- **E-1** `src/lint/engine.ts:106` › `lintWorkspace()` — lint entry over a workspace.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/lint/rules/index.ts:58` › `RULES` — the rule registry.
  - layer: grep (matched, checked by reading) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/trace/write.ts:32` › `trace()` — builds the trace graph and writes `trace.json` and the generated matrices.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-4** `src/trace/matrix.ts:50` › `specCoverage()` — spec coverage computation.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127

## Requirements

### C001-REQ-701 — Lint scopes
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd lint` runs, THE lint SHALL check the change named as argument, or every non-archived change plus the workspace root files when no change is named, optionally restricted to one phase by `--phase`.
- **Rationale:** IDEA-§17.1
- **Stories:** C001-US-701
- **Priority:** Must
- **Acceptance:** C001-AC-701.1

#### C001-AC-701.1 — Scope selection
```gherkin
Scenario Outline: C001-TS-701 — lint scope
  Given changes "001" (archived), "002" and "003"
  When the user runs "$SDD lint <args>"
  Then the files checked are "<checked>"
  Examples:
    | args                | checked                                                 |
    | 002                 | change 002 only                                          |
    | (none)              | changes 002 and 003 plus SDD.md, registry.json, _living/ |
    | 003 --phase 20-plan | change 003 files under 20-plan/ plus cross-phase rules  |
```

### C001-REQ-702 — Finding format
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE lint SHALL report each finding with a rule code, a severity (`error`, `warn` or `info`), the file path relative to the repository root, the line number when applicable, the IDs involved and a one-line message.
- **Rationale:** actionable output; C001-NFR-601
- **Stories:** C001-US-701
- **Priority:** Must
- **Acceptance:** C001-AC-702.1

#### C001-AC-702.1 — Human-readable finding line
```gherkin
Scenario: C001-TS-702 — finding fields
  Given a requirement with two SHALLs at ".sdd/004-x/10-spec/20-capabilities/CAP-01-a/requirements.md" line 42
  When the user runs "$SDD lint"
  Then the output contains a line with "error", "LINT-EARS-002", that path, "42", "C004-REQ-012" and a message
```

### C001-REQ-703 — JSON output
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE `--json` is passed, THE lint SHALL write its findings to standard output as a JSON document conforming to C001-IF-11 §1.
- **Rationale:** tool consumption (hooks, auditor)
- **Stories:** C001-US-701
- **Priority:** Must
- **Acceptance:** C001-AC-703.1

#### C001-AC-703.1 — JSON output validates
```gherkin
Scenario: C001-TS-703 — --json
  When the user runs "$SDD lint --json"
  Then standard output parses as JSON and validates against C001-IF-11 §1
  And standard output contains nothing but that JSON document
```

### C001-REQ-704 — Exit codes
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE lint SHALL exit with code 0 when it reports no error-severity finding, 1 when it reports at least one, and 2 on usage or internal failure.
- **Rationale:** IDEA-§17.1 exit codes
- **Stories:** C001-US-701
- **Priority:** Must
- **Acceptance:** C001-AC-704.1

#### C001-AC-704.1 — Exit codes
```gherkin
Scenario Outline: C001-TS-704 — lint exit code
  Given a workspace with <errors> errors and <warnings> warnings
  When the user runs "$SDD lint"
  Then the exit code is <code>
  Examples:
    | errors | warnings | code |
    | 0      | 0        | 0    |
    | 0      | 5        | 0    |
    | 1      | 0        | 1    |
  And running "$SDD lint --bogus-flag" exits with code 2
```

### C001-REQ-705 — Quick single-file mode
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE `--quick --file <path>` is passed, THE lint SHALL evaluate only the rules whose inputs are contained in that file and finish within the time limit of C001-NFR-102.
- **Rationale:** PostToolUse hook feedback (IDEA-§17.2)
- **Stories:** C001-US-701
- **Priority:** Must
- **Acceptance:** C001-AC-705.1

#### C001-AC-705.1 — Single-file mode scope and time limit
```gherkin
Scenario: C001-TS-705 — quick single-file lint
  Given a workspace with 500 artifact files
  When the user runs "$SDD lint --quick --file <one requirements.md>"
  Then only findings located in that file are reported
  And the command completes within the C001-NFR-102 limit on the reference machine
```

### C001-REQ-706 — Trace graph and matrix
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd trace <change> --write` runs, THE sdd CLI SHALL write `10-spec/80-traceability.md`, `20-plan/80-traceability.md` (once the plan phase has started) and `trace.json` at the change root, built from every ID definition and reference in the change.
- **Rationale:** IDEA-§12.3
- **Stories:** C001-US-702
- **Priority:** Must
- **Acceptance:** C001-AC-706.1

#### C001-AC-706.1 — Files written per started phase
```gherkin
Scenario: C001-TS-706 — trace outputs
  Given change "004" in phase "20-plan"
  When the user runs "$SDD trace 004 --write"
  Then "10-spec/80-traceability.md", "20-plan/80-traceability.md" and "trace.json" exist under ".sdd/004-*/"
  And for a change in phase "10-spec" no "20-plan/80-traceability.md" is written
```

### C001-REQ-707 — Matrix directions
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the sdd CLI writes a traceability markdown file, THE sdd CLI SHALL include a forward table (US → REQ → AC → TS, and in the plan REQ → T → TC → DOD) and a backward table (TS → AC → REQ → US, and TC → T → REQ).
- **Rationale:** traceable both ways (IDEA-P-13)
- **Stories:** C001-US-702
- **Priority:** Must
- **Acceptance:** C001-AC-707.1

#### C001-AC-707.1 — Both directions present
```gherkin
Scenario: C001-TS-707 — forward and backward tables
  When "10-spec/80-traceability.md" is generated
  Then it contains a table headed "Forward: US → REQ → AC → TS" and a table headed "Backward: TS → AC → REQ → US"
  And every REQ ID of the change appears in the forward table
```

### C001-REQ-708 — Coverage statistics
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the sdd CLI writes a traceability file, THE sdd CLI SHALL include, for each traceability rule TR-01 to TR-08, the number of covered items, the number of items and the coverage percentage.
- **Rationale:** gate summary input (IDEA-§18.2)
- **Stories:** C001-US-702
- **Priority:** Must
- **Acceptance:** C001-AC-708.1

#### C001-AC-708.1 — Coverage numbers correct
```gherkin
Scenario: C001-TS-708 — coverage statistics
  Given 10 REQs of which 9 have at least one AC
  When "10-spec/80-traceability.md" is generated
  Then the TR-02 line reads "9 / 10 (90%)"
```

### C001-REQ-709 — trace.json schema
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE sdd CLI SHALL write `trace.json` conforming to C001-IF-12, containing every node (ID, type, file, line, title) and every typed edge (from, to, relation).
- **Rationale:** P-04 and v2 conformance checker
- **Stories:** C001-US-702
- **Priority:** Must
- **Acceptance:** C001-AC-709.1

#### C001-AC-709.1 — trace.json shape
```gherkin
Scenario: C001-TS-709 — trace.json content
  When "trace.json" is generated for change "004"
  Then it validates against C001-IF-12
  And it contains a node for every ID defined in change "004"
  And every "implements" field of every task appears as an edge with relation "implements"
```

### C001-REQ-710 — Critic report format
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the critic reviews a phase, THE critic SHALL write `critic-report.md` (ideation) or `90-critic-report.md` (spec, plan) with each finding carrying an ID, a severity (`blocker`, `major` or `minor`), the referenced artifact IDs, a verbatim quote with file and line, the reason it matters and a suggested fix.
- **Rationale:** IDEA-§14.3 A8
- **Stories:** C001-US-703
- **Priority:** Must
- **Acceptance:** C001-AC-710.1

#### C001-AC-710.1 — Finding structure
```gherkin
Scenario: C001-TS-710 — critic finding fields
  When the critic writes "90-critic-report.md"
  Then every finding has an ID "CR-<n>", a severity among blocker, major, minor, at least one artifact ID, a quote with file:line, a reason and a suggested fix
```

### C001-REQ-711 — Rubric-driven review
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the critic reviews an artifact type, THE critic SHALL apply every checklist item of the rubric for that type in the `critique-rubrics` skill and report the result of each item (pass, finding ID, or n/a with reason) in a rubric table.
- **Rationale:** mitigates lenience (IDEA-RK-08)
- **Stories:** C001-US-703
- **Priority:** Must
- **Acceptance:** C001-AC-711.1

#### C001-AC-711.1 — Rubric table present
```gherkin
Scenario: C001-TS-711 — rubric coverage
  Given the critique-rubrics skill defines 12 checklist items for "requirements"
  When the critic reviews a spec
  Then its report contains a rubric table with 12 rows for "requirements", each marked pass, a finding ID, or "n/a: <reason>"
```

### C001-REQ-712 — No silent pass
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the critic reports fewer than three findings for a phase review, THEN THE critic SHALL justify, per rubric section, why no further issue exists.
- **Rationale:** IDEA-RK-08 mitigation ("find ≥N issues or justify none")
- **Stories:** C001-US-703
- **Priority:** Should
- **Acceptance:** C001-AC-712.1

#### C001-AC-712.1 — Justification when few findings
```gherkin
Scenario: C001-TS-712 — clean review justified
  When the critic reports 2 findings for a spec review
  Then the report has a "Why no further findings" section with one paragraph per rubric section
```

### C001-REQ-713 — Critic is read-only on artifacts
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE critic SHALL NOT modify any file other than its own critic report.
- **Rationale:** independence; authors fix, critic reviews
- **Stories:** C001-US-703
- **Priority:** Must
- **Acceptance:** C001-AC-713.1

#### C001-AC-713.1 — Critic writes only its report
```gherkin
Scenario: C001-TS-713 — critic write scope
  When the critic reviews a phase in a scripted session
  Then every Write or Edit call in its transcript targets its critic report file
  And the path guard would deny any other target (C001-REQ-1102)
```

### C001-REQ-714 — Revision reviews focus on changes
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the critic reviews a phase in revision, THE critic SHALL review every ID whose content hash changed since the last approval plus every ID linked to them, listing that reviewed ID set in its report.
- **Rationale:** cost control (IDEA-§19)
- **Stories:** C001-US-703
- **Priority:** Should
- **Acceptance:** C001-AC-714.1

#### C001-AC-714.1 — Revision review set
```gherkin
Scenario: C001-TS-714 — focused re-review
  Given the spec of change "004" was approved and then REQ-012 was modified during revision
  When the critic reviews the revised spec
  Then the report lists the reviewed ID set including "C004-REQ-012", its ACs, its TSs and its stories
  And IDs unrelated to REQ-012 are not in the reviewed set
```

### C001-REQ-715 — Auditor duties
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the conductor requests an audit, THE auditor SHALL run `sdd lint --json`, `sdd trace --write`, `sdd stale check` and `sdd status --write` in that order and return the error, warning and info counts, the coverage statistics and the stale phases.
- **Rationale:** IDEA-§14.3 A9, §18.2 step 1
- **Stories:** C001-US-704
- **Priority:** Must
- **Acceptance:** C001-AC-715.1

#### C001-AC-715.1 — Audit sequence and summary
```gherkin
Scenario: C001-TS-715 — auditor run
  When the conductor requests an audit of change "004"
  Then the auditor transcript shows, in order, "sdd lint --json", "sdd trace", "sdd stale check", "sdd status --write"
  And its reply contains error/warning/info counts, TR-01..TR-08 coverage and the list of stale phases
```

### C001-REQ-716 — Open-items file
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd trace --write` runs, THE sdd CLI SHALL regenerate `85-open-items.md` in each started phase folder listing every `[NEEDS CLARIFICATION]`, `[ASSUMPTION]` and `[WAIVED]` marker located outside code spans, quoted strings and fenced code blocks, with its file, line and question or gate reference.
- **Rationale:** IDEA-§11.3
- **Stories:** C001-US-704
- **Priority:** Must
- **Acceptance:** C001-AC-716.1

#### C001-AC-716.1 — Open items regenerated
```gherkin
Scenario: C001-TS-716 — markers collected
  Given 2 "[NEEDS CLARIFICATION]" markers and 1 "[ASSUMPTION]" marker in "10-spec"
  When the user runs "$SDD trace 004 --write"
  Then "10-spec/85-open-items.md" lists 3 rows with type, file, line and reference
  And a marker written inside backticks, double quotes or a fenced code block (for example in this scenario) is not listed
```

### C001-REQ-717 — Dangling references
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF an artifact references an ID that is neither defined in the workspace nor tombstoned, THEN THE lint SHALL report error `TR-12` with the reference location.
- **Rationale:** IDEA-§12.2 TR-12
- **Stories:** C001-US-705
- **Priority:** Must
- **Acceptance:** C001-AC-717.1

#### C001-AC-717.1 — Dangling reference
```gherkin
Scenario: C001-TS-717 — reference to nowhere
  Given a story lists "C004-REQ-077" which is neither defined nor tombstoned
  When the user runs "$SDD lint"
  Then the report contains error "TR-12" naming "C004-REQ-077" and the story's file and line
  And a reference to a tombstoned ID raises no "TR-12"
```

### C001-REQ-718 — Duplicate or resurrected IDs
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF an ID is defined more than once in the workspace or a tombstoned ID is defined again, THEN THE lint SHALL report error `TR-13` listing each definition location.
- **Rationale:** IDEA-§12.2 TR-13
- **Stories:** C001-US-705
- **Priority:** Must
- **Acceptance:** C001-AC-718.1

#### C001-AC-718.1 — Duplicate definition
```gherkin
Scenario: C001-TS-718 — defined twice
  Given "C004-REQ-012" is defined as a heading in two different files
  When the user runs "$SDD lint"
  Then the report contains error "TR-13" listing both locations
```

### C001-REQ-719 — Placeholder text
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF an artifact contains `TBD`, `TODO`, `lorem` or `etc.` outside code blocks and quoted strings, THEN THE lint SHALL report error `LINT-TXT-001`.
- **Rationale:** IDEA-§13.8
- **Stories:** C001-US-705
- **Priority:** Must
- **Acceptance:** C001-AC-719.1

#### C001-AC-719.1 — Placeholders
```gherkin
Scenario Outline: C001-TS-719 — placeholder words
  Given an artifact line "<line>"
  When the user runs "$SDD lint"
  Then the report "<result>" error "LINT-TXT-001"
  Examples:
    | line                                   | result           |
    | Threshold: TBD                         | contains         |
    | Supports JSON, YAML, etc.              | contains         |
    | Run `grep TODO src/`                   | does not contain |
    | The message reads "TODO list empty"    | does not contain |
```

### C001-REQ-720 — Markers at gate time
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd gate approve` is requested for a phase that still contains, outside code spans, quoted strings and fenced code blocks, a `[NEEDS CLARIFICATION]` marker not listed in a `--waive` argument, THEN THE sdd CLI SHALL refuse the approval with error `ERR-CLI-011`.
- **Rationale:** IDEA-P-06
- **Stories:** C001-US-705
- **Priority:** Must
- **Acceptance:** C001-AC-720.1

#### C001-AC-720.1 — Approval refused with open markers
```gherkin
Scenario: C001-TS-720 — gate refusal
  Given "10-spec" of change "004" contains "[NEEDS CLARIFICATION: Q-spec-03]"
  When the user runs "$SDD gate approve 004 10-spec"
  Then the exit code is 2 and standard error contains "ERR-CLI-011" and "Q-spec-03"
  And running "$SDD gate approve 004 10-spec --waive Q-spec-03 --note \"decide in plan\"" succeeds
```

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
