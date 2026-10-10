---
id: C001-CAP-06
artifact: spec/acceptance
capability: "Planning and hand-off"
change: CHG-001
phase: 10-spec
status: approved
---

# C001-CAP-06 — Acceptance criteria and scenarios

## C001-REQ-601

#### C001-AC-601.1 — Milestones complete
```gherkin
Scenario: C001-TS-601 — milestone fields
  When the lint checks "20-plan/10-strategy.md"
  Then every milestone "M-<seq>" has a goal, an exit criterion and at least one task ID
  And a milestone without an exit criterion raises "LINT-PLAN-001"
```

## C001-REQ-602

#### C001-AC-602.1 — Task file sections and frontmatter
```gherkin
Scenario: C001-TS-602 — task file shape
  Given task file "T-031-expiry-guard.md"
  When the lint checks it
  Then its frontmatter validates against C001-IF-03 §3
  And its body has the headings Intent, Targets, Preconditions, Step outline, Verification, Done when
```

## C001-REQ-603

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

## C001-REQ-604

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

## C001-REQ-605

#### C001-AC-605.1 — Unplanned requirement
```gherkin
Scenario: C001-TS-605 — REQ without task
  Given requirement "C004-REQ-019" appears in no task's "implements"
  When the user runs "$SDD lint --phase 20-plan"
  Then the report contains error "TR-06" for "C004-REQ-019"
```

## C001-REQ-606

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

## C001-REQ-607

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

## C001-REQ-608

#### C001-AC-608.1 — Graph and critical path
```gherkin
Scenario: C001-TS-609 — work breakdown content
  Given 12 tasks in 3 milestones
  When the planner writes "40-work-breakdown.md"
  Then it contains a "mermaid" graph with 12 task nodes grouped in 3 subgraphs
  And every "depends_on" pair appears as an edge
  And a "Critical path" list orders a subset of tasks consistent with the edges
```

## C001-REQ-609

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
```

## C001-REQ-610

#### C001-AC-610.1 — Regression set for brownfield
```gherkin
Scenario: C001-TS-612 — regression set content
  Given a brownfield plan whose tasks target "createIntent" in "src/checkout/payments.ts"
  When the cartographer completes impact analysis with ripwire available
  Then "30-impact/regression-set.md" lists the tests reported by "ripwire --test-gate" for that symbol with layer "ripwire"
```

## C001-REQ-611

#### C001-AC-611.1 — Blast radius entries
```gherkin
Scenario: C001-TS-613 — blast radius content
  When the cartographer writes "30-impact/blast-radius.md" for target symbol "createIntent"
  Then the entry lists its direct callers, a transitive reach count and the evidence layer
```

## C001-REQ-612

#### C001-AC-612.1 — Hotspot without risk
```gherkin
Scenario: C001-TS-614 — TR-15 warning
  Given "hotspots.md" lists "src/checkout/payments.ts"
  And task T-031 targets that file
  And no RISK references T-031 or its component
  When the user runs "$SDD lint"
  Then the report contains warning "TR-15" for T-031
```

## C001-REQ-613

#### C001-AC-613.1 — Risk fields
```gherkin
Scenario: C001-TS-615 — risk entry structure
  When the lint parses "70-risks.md"
  Then every RISK has likelihood and impact in {low, medium, high}, a mitigation, a trigger, an owner and at least one T or COMP ID
```

#### C001-AC-613.2 — High impact needs a mitigation task or explicit acceptance
```gherkin
Scenario: C001-TS-616 — TR-14 warning
  Given "C004-RISK-002" with impact "high" whose mitigation references no task and does not say "accepted by P-01"
  When the user runs "$SDD lint"
  Then the report contains warning "TR-14" for "C004-RISK-002"
```

## C001-REQ-614

#### C001-AC-614.1 — Rollout content or explicit no-impact
```gherkin
Scenario Outline: C001-TS-617 — rollout file
  Given a change whose deployment impact is "<impact>"
  When the lint checks "75-rollout.md"
  Then it requires "<content>"
  Examples:
    | impact | content                                                                    |
    | yes    | migration steps, flags with defaults, RB-IDs linked to T or M, communication notes |
    | none   | the statement "No rollout impact" followed by a reason                      |
```

## C001-REQ-615

#### C001-AC-615.1 — Every NFR has a signal
```gherkin
Scenario: C001-TS-618 — observability mapping
  Given the change has NFRs "C004-NFR-101" and "C004-NFR-301"
  When the lint checks "78-observability.md"
  Then each NFR maps to at least one signal and one task
  And a missing NFR raises "LINT-OBS-001"
```

## C001-REQ-616

#### C001-AC-616.1 — Hand-off sections
```gherkin
Scenario: C001-TS-619 — handoff.md shape
  When the lint checks "20-plan/handoff.md"
  Then it contains the headings Reading order, Rules, Ordered task list, Reporting protocol, Definition of change done
  And Reporting protocol contains the commands "task set", "defect add" and a frontmatter fallback paragraph
```

## C001-REQ-617

#### C001-AC-617.1 — Topological task list
```gherkin
Scenario: C001-TS-620 — ordered list respects dependencies
  Given tasks with depends_on edges
  When the lint checks the Ordered task list
  Then every non-dropped task appears exactly once with its relative path
  And no task appears before any task it depends on
```

#### C001-AC-617.2 — Executable by a plan-execution tool
```gherkin
Scenario: C001-TS-621 — portability dogfood
  Given an approved plan from a dogfood change
  When a Claude Code session with Superpowers is told "execute the plan in <path>/handoff.md"
  Then it starts the first task of the Ordered task list without asking where the tasks are
```

## C001-REQ-618

#### C001-AC-618.1 — Lite plan sections
```gherkin
Scenario: C001-TS-622 — lite plan structure
  Given a lite change
  When the planner completes the plan
  Then "20-plan/plan.md" has sections Strategy, Tasks (one sub-section per task with the IF-03 §3 fields), Test mapping, Risks
  And "20-plan/handoff.md" exists
  And no "50-tasks/" folder exists
```

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C001-REQ-601 | TS-601 | n/a | n/a | TS-601 | n/a | n/a | n/a |
| C001-REQ-602 | TS-602 | n/a | n/a | TS-602 | n/a | n/a | n/a |
| C001-REQ-603 | TS-603 | n/a | n/a | TS-603 | n/a | n/a | n/a |
| C001-REQ-604 | TS-604 | TS-604 (shell exempt) | TS-604 (5-line limit) | TS-604 | n/a | n/a | n/a |
| C001-REQ-605 | TS-605 | n/a | n/a | TS-605 | n/a | n/a | n/a |
| C001-REQ-606 | TS-606 | TS-606 | n/a | TS-606 | n/a | n/a | n/a |
| C001-REQ-607 | TS-607 | TS-608 | n/a | TS-607, TS-608 | n/a | n/a | n/a |
| C001-REQ-608 | TS-609 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-609 | TS-610 | TS-611 (manual level) | n/a | TS-610 | n/a | n/a | n/a |
| C001-REQ-610 | TS-612 | n/a: fallback layers in CAP-10 | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-611 | TS-613 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-612 | TS-614 | n/a | n/a | TS-614 | n/a | n/a | n/a |
| C001-REQ-613 | TS-615 | TS-616 | n/a | TS-616 | n/a | n/a | n/a |
| C001-REQ-614 | TS-617 | TS-617 (no impact) | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-615 | TS-618 | n/a | n/a | TS-618 | n/a | n/a | n/a |
| C001-REQ-616 | TS-619 | n/a | n/a | TS-619 | n/a | n/a | n/a |
| C001-REQ-617 | TS-620 | TS-621 | n/a | TS-620 | n/a | n/a | n/a |
| C001-REQ-618 | TS-622 | n/a | n/a | n/a | n/a | n/a | n/a |

Per-column n/a reasons: as in CAP-05 (single-path authoring rules; local single-user tool;
single writer per change; injection handled by C001-NFR-205).
