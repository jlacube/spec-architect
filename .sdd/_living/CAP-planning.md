---
capability: planning
inventory_only: false
updated: 2026-11-16
---

# Planning and hand-off (`C001-CAP-06`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

The planning phase: strategy and milestones, task files and their dependency graph, impact
analysis for brownfield changes, test plan, risks, rollout, observability and the implementer
hand-off. Mostly prompt content; task and plan lint rules check the outputs.

## Entry points

- Command `plugins/architect/commands/plan.md`.
- Agents `plugins/architect/agents/sdd-planner.md`, `sdd-test-designer.md` (plan-phase test plan).

## Main modules

- Skills `plugins/architect/skills/phase-plan/`, `planning/`.
- Lint rules `src/lint/rules/plan-001.ts`, `task-001.ts` … `task-003.ts`, `obs-001.ts`, `sec-001.ts`.
- Plan coverage in `src/trace/matrix.ts` (`planCoverage`, `planFacts`, `renderPlanMatrix`).

## Owning tests

- `tests/integration/cap06/` (`TS-601` … `TS-618`, `plan-fixture.ts`).
- Evals: `evals/cap06/` (`impact.eval.mjs`, `planner.mjs`, `TS-609`, `TS-622`).

## Evidence

- **E-1** `plugins/architect/agents/sdd-planner.md:1` › - — planning specialist agent.
  - layer: grep (description read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/lint/rules/task-001.ts:1` › - — task-file lint rule (purpose inferred from the file name).
  - layer: grep (git ls-files) · confidence: low
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127; purpose inferred from the file name
- **E-3** `src/trace/matrix.ts` › `planCoverage` — plan coverage computation (symbol listed by the overview; line not captured).
  - layer: serena · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127

## Requirements

### C001-REQ-601 — Strategy and milestones
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the planner writes `20-plan/10-strategy.md`, THE planner SHALL include the approach, the sequencing rationale, and milestones identified as `M-<seq>`, each with a goal, an exit criterion and its task IDs.
- **Rationale:** IDEA-§11.4
- **Stories:** C001-US-601
- **Priority:** Must
- **Acceptance:** C001-AC-601.1

#### C001-AC-601.1 — Milestones complete
```gherkin
Scenario: C001-TS-601 — milestone fields
  When the lint checks "20-plan/10-strategy.md"
  Then every milestone "M-<seq>" has a goal, an exit criterion and at least one task ID
  And a milestone without an exit criterion raises "LINT-PLAN-001"
```

### C001-REQ-602 — Task file structure
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the planner creates a task, THE planner SHALL write `20-plan/50-tasks/T-<seq>-<slug>.md` with the frontmatter of C001-IF-03 §3 and the body sections Intent, Targets, Preconditions, Step outline, Verification and Done when.
- **Rationale:** IDEA-§12.5; OA-11 option B
- **Stories:** C001-US-602
- **Priority:** Must
- **Acceptance:** C001-AC-602.1

#### C001-AC-602.1 — Task file sections and frontmatter
```gherkin
Scenario: C001-TS-602 — task file shape
  Given task file "T-031-expiry-guard.md"
  When the lint checks it
  Then its frontmatter validates against C001-IF-03 §3
  And its body has the headings Intent, Targets, Preconditions, Step outline, Verification, Done when
  And a missing field or heading raises "LINT-TASK-004"
```

### C001-REQ-603 — Minimum task content
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a task file has no row in its Targets table, no runnable step in Verification, or no checkbox in Done when, THEN THE lint SHALL report error `LINT-TASK-001` naming each empty section.
- **Rationale:** IDEA-§13.8
- **Stories:** C001-US-602
- **Priority:** Must
- **Acceptance:** C001-AC-603.1

#### C001-AC-603.1 — Empty sections flagged
```gherkin
Scenario Outline: C001-TS-603 — minimum content
  Given a task whose "<section>" is empty
  When the user runs "$SDD lint"
  Then the report contains error "LINT-TASK-001" naming "<section>"
  Examples:
    | section      |
    | Targets      |
    | Verification |
    | Done when    |
```

### C001-REQ-604 — No production code in tasks
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a task file contains a fenced code block longer than five lines in a language other than `shell`, `bash`, `powershell`, `console` or `text`, THEN THE lint SHALL report warning `LINT-TASK-002`.
- **Rationale:** OA-11 (signatures belong in 50-interfaces); Q2 boundary
- **Stories:** C001-US-602
- **Priority:** Should
- **Acceptance:** C001-AC-604.1

#### C001-AC-604.1 — Code bodies warned
```gherkin
Scenario Outline: C001-TS-604 — code in task files
  Given a task containing a "<lang>" fenced block of <lines> lines
  When the user runs "$SDD lint"
  Then the report "<result>" warning "LINT-TASK-002"
  Examples:
    | lang       | lines | result           |
    | typescript | 12    | contains         |
    | typescript | 4     | does not contain |
    | shell      | 20    | does not contain |
    | powershell | 8     | does not contain |
```

### C001-REQ-605 — Every requirement planned
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a requirement of the change is not listed in the `implements` field of any task, THEN THE lint SHALL report error `TR-06` for that requirement.
- **Rationale:** IDEA-§12.2 TR-06
- **Stories:** C001-US-602
- **Priority:** Must
- **Acceptance:** C001-AC-605.1

#### C001-AC-605.1 — Unplanned requirement
```gherkin
Scenario: C001-TS-605 — REQ without task
  Given requirement "C004-REQ-019" appears in no task's "implements"
  When the user runs "$SDD lint --phase 20-plan"
  Then the report contains error "TR-06" for "C004-REQ-019"
```

### C001-REQ-606 — Every task verifiable
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a task lists no REQ or AC in `implements` or `satisfies_ac`, or no TS or TC in `verified_by`, THEN THE lint SHALL report error `TR-07` for that task.
- **Rationale:** IDEA-§12.2 TR-07
- **Stories:** C001-US-602
- **Priority:** Must
- **Acceptance:** C001-AC-606.1

#### C001-AC-606.1 — Unverifiable task
```gherkin
Scenario Outline: C001-TS-606 — task links
  Given a task with implements "<impl>", satisfies_ac "<ac>" and verified_by "<ver>"
  When the user runs "$SDD lint"
  Then the report "<result>" error "TR-07"
  Examples:
    | impl         | ac            | ver           | result           |
    | C004-REQ-012 | C004-AC-012.1 | C004-TS-040   | does not contain |
    | (empty)      | (empty)       | C004-TS-040   | contains         |
    | C004-REQ-012 | (empty)       | (empty)       | contains         |
```

### C001-REQ-607 — Acyclic dependencies
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the `depends_on` relation among a change's tasks contains a cycle or references a task ID that does not exist, THEN THE lint SHALL report error `TR-11` listing the cycle or the unresolved reference.
- **Rationale:** IDEA-§12.2 TR-11
- **Stories:** C001-US-603
- **Priority:** Must
- **Acceptance:** C001-AC-607.1, C001-AC-607.2

#### C001-AC-607.1 — Cycle detected
```gherkin
Scenario: C001-TS-607 — dependency cycle
  Given tasks T-001 depends on T-003, T-003 depends on T-002, T-002 depends on T-001
  When the user runs "$SDD lint"
  Then the report contains error "TR-11" listing "T-001 → T-003 → T-002 → T-001"
```

#### C001-AC-607.2 — Unresolved dependency
```gherkin
Scenario: C001-TS-608 — dangling depends_on
  Given task T-005 depends on "C004-T-099" which does not exist and is not tombstoned
  When the user runs "$SDD lint"
  Then the report contains error "TR-11" naming "C004-T-099"
```

### C001-REQ-608 — Work breakdown and critical path
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the planner writes `20-plan/40-work-breakdown.md`, THE planner SHALL include a Mermaid graph of all tasks grouped by milestone with `depends_on` edges and an ordered list of the tasks on the critical path.
- **Rationale:** IDEA-§11.4
- **Stories:** C001-US-601, C001-US-603
- **Priority:** Must
- **Acceptance:** C001-AC-608.1

#### C001-AC-608.1 — Graph and critical path
```gherkin
Scenario: C001-TS-609 — work breakdown content
  Given 12 tasks in 3 milestones
  When the planner writes "40-work-breakdown.md"
  Then it contains a "mermaid" graph with 12 task nodes grouped in 3 subgraphs
  And every "depends_on" pair appears as an edge
  And a "Critical path" list orders a subset of tasks consistent with the edges
```

### C001-REQ-609 — Test plan mapping
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the test-designer writes `20-plan/60-test-plan.md`, THE test-designer SHALL map every TS of the change to one or more test cases `TC-<seq>`, each with level (`unit`, `integration`, `e2e`, `eval` or `manual`), target location, test data and environment.
- **Rationale:** IDEA-§11.4; TR-08
- **Stories:** C001-US-604
- **Priority:** Must
- **Acceptance:** C001-AC-609.1, C001-AC-609.2

#### C001-AC-609.1 — Every TS mapped
```gherkin
Scenario: C001-TS-610 — TR-08 enforcement
  Given scenario "C004-TS-041" is not mapped to any TC in "60-test-plan.md"
  When the user runs "$SDD lint --phase 20-plan"
  Then the report contains error "TR-08" for "C004-TS-041"
```

#### C001-AC-609.2 — TC fields
```gherkin
Scenario: C001-TS-611 — test case fields
  When the lint parses "60-test-plan.md"
  Then every TC has a level among unit, integration, e2e, eval, manual, a location, test data and an environment
  And a TC with level "manual" also names who executes it
  And a missing field raises "LINT-TC-001"
```

### C001-REQ-610 — Regression set
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE the change `kind` is `brownfield` or `mixed`, THE cartographer SHALL write `20-plan/30-impact/regression-set.md` listing the existing tests that reach the symbols targeted by tasks, each with its evidence layer.
- **Rationale:** IDEA-§7.2 (`--test-gate`)
- **Stories:** C001-US-605
- **Priority:** Must
- **Acceptance:** C001-AC-610.1

#### C001-AC-610.1 — Regression set for brownfield
```gherkin
Scenario: C001-TS-612 — regression set content
  Given a brownfield plan whose tasks target "createIntent" in "src/checkout/payments.ts"
  When the cartographer completes impact analysis with ripwire available
  Then "30-impact/regression-set.md" lists the tests reported by "ripwire --test-gate" for that symbol with layer "ripwire"
```

### C001-REQ-611 — Blast radius
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE the change `kind` is `brownfield` or `mixed`, THE cartographer SHALL write `20-plan/30-impact/blast-radius.md` with, for each existing symbol targeted by a task, its direct callers, transitive reach count and evidence layer.
- **Rationale:** IDEA-§7.2 (`--impact`, `--callers`)
- **Stories:** C001-US-605
- **Priority:** Must
- **Acceptance:** C001-AC-611.1

#### C001-AC-611.1 — Blast radius entries
```gherkin
Scenario: C001-TS-613 — blast radius content
  When the cartographer writes "30-impact/blast-radius.md" for target symbol "createIntent"
  Then the entry lists its direct callers, a transitive reach count and the evidence layer
```

### C001-REQ-612 — Hotspots linked to risks
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a hotspot listed in `30-impact/hotspots.md` is a target of a task and no RISK references that task or its component, THEN THE lint SHALL report warning `TR-15`.
- **Rationale:** IDEA-§12.2 TR-15
- **Stories:** C001-US-605
- **Priority:** Should
- **Acceptance:** C001-AC-612.1

#### C001-AC-612.1 — Hotspot without risk
```gherkin
Scenario: C001-TS-614 — TR-15 warning
  Given "hotspots.md" lists "src/checkout/payments.ts"
  And task T-031 targets that file
  And no RISK references T-031 or its component
  When the user runs "$SDD lint"
  Then the report contains warning "TR-15" for T-031
```

### C001-REQ-613 — Risk register
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the planner writes `20-plan/70-risks.md`, THE planner SHALL describe each risk `RISK-<seq>` with likelihood and impact (`low`, `medium`, `high`), mitigation, trigger, owner and the T or COMP IDs it concerns.
- **Rationale:** IDEA-§11.4
- **Stories:** C001-US-606
- **Priority:** Must
- **Acceptance:** C001-AC-613.1, C001-AC-613.2

#### C001-AC-613.1 — Risk fields
```gherkin
Scenario: C001-TS-615 — risk entry structure
  When the lint parses "70-risks.md"
  Then every RISK has likelihood and impact in {low, medium, high}, a mitigation, a trigger, an owner and at least one T or COMP ID
  And a missing field or another rating raises "LINT-RISK-001"
```

#### C001-AC-613.2 — High impact needs a mitigation task or explicit acceptance
```gherkin
Scenario: C001-TS-616 — TR-14 warning
  Given "C004-RISK-002" with impact "high" whose mitigation references no task and does not say "accepted by P-01"
  When the user runs "$SDD lint"
  Then the report contains warning "TR-14" for "C004-RISK-002"
```

### C001-REQ-614 — Rollout and rollback
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the planner writes `20-plan/75-rollout.md`, THE planner SHALL include migration steps, feature flags with default values, rollback steps `RB-<seq>` each linked to a T or M ID, and communication notes, or a "No rollout impact" statement with its reason.
- **Rationale:** IDEA-§11.4
- **Stories:** C001-US-606
- **Priority:** Must
- **Acceptance:** C001-AC-614.1

#### C001-AC-614.1 — Rollout content or explicit no-impact
```gherkin
Scenario Outline: C001-TS-617 — rollout file
  Given a change whose deployment impact is "<impact>"
  When the lint checks "75-rollout.md"
  Then it requires "<content>"
  And missing content raises "LINT-ROLL-001"
  Examples:
    | impact | content                                                                    |
    | yes    | migration steps, flags with defaults, RB-IDs linked to T or M, communication notes |
    | none   | the statement "No rollout impact" followed by a reason                      |
```

### C001-REQ-615 — Observability plan
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the change has at least one NFR, THE planner SHALL write `20-plan/78-observability.md` mapping each NFR to the log, metric, trace or alert that evidences it and to the task that implements that signal.
- **Rationale:** DOD-G-05 (signals for every NFR)
- **Stories:** C001-US-606
- **Priority:** Must
- **Acceptance:** C001-AC-615.1

#### C001-AC-615.1 — Every NFR has a signal
```gherkin
Scenario: C001-TS-618 — observability mapping
  Given the change has NFRs "C004-NFR-101" and "C004-NFR-301"
  When the lint checks "78-observability.md"
  Then each NFR maps to at least one signal and one task
  And a missing NFR raises "LINT-OBS-001"
```

### C001-REQ-616 — Hand-off document
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the planner completes the plan, THE planner SHALL write `20-plan/handoff.md` with the sections Reading order, Rules, Ordered task list, Reporting protocol (CLI commands and the frontmatter fallback) and Definition of change done.
- **Rationale:** IDEA-§10.6
- **Stories:** C001-US-607
- **Priority:** Must
- **Acceptance:** C001-AC-616.1

#### C001-AC-616.1 — Hand-off sections
```gherkin
Scenario: C001-TS-619 — handoff.md shape
  When the lint checks "20-plan/handoff.md"
  Then it contains the headings Reading order, Rules, Ordered task list, Reporting protocol, Definition of change done
  And Reporting protocol contains the commands "task set", "defect add" and a frontmatter fallback paragraph
  And a missing heading, command or fallback raises "LINT-HAND-001"
```

### C001-REQ-617 — Ordered task list for plan executors
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE Ordered task list section of `handoff.md` SHALL list every non-dropped task in a topological order of `depends_on`, each with its ID, title and task-file path relative to the repository root.
- **Rationale:** C001-GOAL-07 (Superpowers executing-plans and plain sessions can follow it)
- **Stories:** C001-US-607
- **Priority:** Must
- **Acceptance:** C001-AC-617.1, C001-AC-617.2

#### C001-AC-617.1 — Topological task list
```gherkin
Scenario: C001-TS-620 — ordered list respects dependencies
  Given tasks with depends_on edges
  When the lint checks the Ordered task list
  Then every non-dropped task appears exactly once with its relative path
  And no task appears before any task it depends on
  And a missing, repeated or misplaced task raises "LINT-HAND-002"
```

#### C001-AC-617.2 — Executable by a plan-execution tool
```gherkin
Scenario: C001-TS-621 — portability dogfood
  Given an approved plan from a dogfood change
  When a Claude Code session with Superpowers is told "execute the plan in <path>/handoff.md"
  Then it starts the first task of the Ordered task list without asking where the tasks are
```

### C001-REQ-618 — Lite plan
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE a change has profile `lite`, THE planner SHALL write `20-plan/plan.md` containing the strategy, one section per task carrying the task fields of C001-IF-03 §3, the TS-to-TC mapping and the risk list.
- **Rationale:** OQ-05
- **Stories:** C001-US-608
- **Priority:** Must
- **Acceptance:** C001-AC-618.1

#### C001-AC-618.1 — Lite plan sections
```gherkin
Scenario: C001-TS-622 — lite plan structure
  Given a lite change
  When the planner completes the plan
  Then "20-plan/plan.md" has sections Strategy, Tasks (one sub-section per task with the IF-03 §3 fields), Test mapping, Risks
  And "20-plan/handoff.md" exists
  And no "50-tasks/" folder exists
```

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
