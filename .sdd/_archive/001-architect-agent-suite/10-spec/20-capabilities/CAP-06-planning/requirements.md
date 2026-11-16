---
id: C001-CAP-06
artifact: spec/requirements
capability: "Planning and hand-off"
change: CHG-001
phase: 10-spec
status: approved
delta_default: ADDED
---

# C001-CAP-06 — Requirements

All `Delta: ADDED`. Interfaces: task frontmatter C001-IF-03 §3, layout C001-IF-06 §2–§3,
reporting commands C001-IF-01.

### C001-REQ-601 — Strategy and milestones
- **Pattern:** event-driven
- **Statement:** WHEN the planner writes `20-plan/10-strategy.md`, THE planner SHALL include the approach, the sequencing rationale, and milestones identified as `M-<seq>`, each with a goal, an exit criterion and its task IDs.
- **Rationale:** IDEA-§11.4
- **Stories:** C001-US-601
- **Priority:** Must
- **Acceptance:** C001-AC-601.1

### C001-REQ-602 — Task file structure
- **Pattern:** event-driven
- **Statement:** WHEN the planner creates a task, THE planner SHALL write `20-plan/50-tasks/T-<seq>-<slug>.md` with the frontmatter of C001-IF-03 §3 and the body sections Intent, Targets, Preconditions, Step outline, Verification and Done when.
- **Rationale:** IDEA-§12.5; OA-11 option B
- **Stories:** C001-US-602
- **Priority:** Must
- **Acceptance:** C001-AC-602.1

### C001-REQ-603 — Minimum task content
- **Pattern:** unwanted-behaviour
- **Statement:** IF a task file has no row in its Targets table, no runnable step in Verification, or no checkbox in Done when, THEN THE lint SHALL report error `LINT-TASK-001` naming each empty section.
- **Rationale:** IDEA-§13.8
- **Stories:** C001-US-602
- **Priority:** Must
- **Acceptance:** C001-AC-603.1

### C001-REQ-604 — No production code in tasks
- **Pattern:** unwanted-behaviour
- **Statement:** IF a task file contains a fenced code block longer than five lines in a language other than `shell`, `bash`, `powershell`, `console` or `text`, THEN THE lint SHALL report warning `LINT-TASK-002`.
- **Rationale:** OA-11 (signatures belong in 50-interfaces); Q2 boundary
- **Stories:** C001-US-602
- **Priority:** Should
- **Acceptance:** C001-AC-604.1

### C001-REQ-605 — Every requirement planned
- **Pattern:** unwanted-behaviour
- **Statement:** IF a requirement of the change is not listed in the `implements` field of any task, THEN THE lint SHALL report error `TR-06` for that requirement.
- **Rationale:** IDEA-§12.2 TR-06
- **Stories:** C001-US-602
- **Priority:** Must
- **Acceptance:** C001-AC-605.1

### C001-REQ-606 — Every task verifiable
- **Pattern:** unwanted-behaviour
- **Statement:** IF a task lists no REQ or AC in `implements` or `satisfies_ac`, or no TS or TC in `verified_by`, THEN THE lint SHALL report error `TR-07` for that task.
- **Rationale:** IDEA-§12.2 TR-07
- **Stories:** C001-US-602
- **Priority:** Must
- **Acceptance:** C001-AC-606.1

### C001-REQ-607 — Acyclic dependencies
- **Pattern:** unwanted-behaviour
- **Statement:** IF the `depends_on` relation among a change's tasks contains a cycle or references a task ID that does not exist, THEN THE lint SHALL report error `TR-11` listing the cycle or the unresolved reference.
- **Rationale:** IDEA-§12.2 TR-11
- **Stories:** C001-US-603
- **Priority:** Must
- **Acceptance:** C001-AC-607.1, C001-AC-607.2

### C001-REQ-608 — Work breakdown and critical path
- **Pattern:** event-driven
- **Statement:** WHEN the planner writes `20-plan/40-work-breakdown.md`, THE planner SHALL include a Mermaid graph of all tasks grouped by milestone with `depends_on` edges and an ordered list of the tasks on the critical path.
- **Rationale:** IDEA-§11.4
- **Stories:** C001-US-601, C001-US-603
- **Priority:** Must
- **Acceptance:** C001-AC-608.1

### C001-REQ-609 — Test plan mapping
- **Pattern:** event-driven
- **Statement:** WHEN the test-designer writes `20-plan/60-test-plan.md`, THE test-designer SHALL map every TS of the change to one or more test cases `TC-<seq>`, each with level (`unit`, `integration`, `e2e`, `eval` or `manual`), target location, test data and environment.
- **Rationale:** IDEA-§11.4; TR-08
- **Stories:** C001-US-604
- **Priority:** Must
- **Acceptance:** C001-AC-609.1, C001-AC-609.2

### C001-REQ-610 — Regression set
- **Pattern:** optional-feature
- **Statement:** WHERE the change `kind` is `brownfield` or `mixed`, THE cartographer SHALL write `20-plan/30-impact/regression-set.md` listing the existing tests that reach the symbols targeted by tasks, each with its evidence layer.
- **Rationale:** IDEA-§7.2 (`--test-gate`)
- **Stories:** C001-US-605
- **Priority:** Must
- **Acceptance:** C001-AC-610.1

### C001-REQ-611 — Blast radius
- **Pattern:** optional-feature
- **Statement:** WHERE the change `kind` is `brownfield` or `mixed`, THE cartographer SHALL write `20-plan/30-impact/blast-radius.md` with, for each existing symbol targeted by a task, its direct callers, transitive reach count and evidence layer.
- **Rationale:** IDEA-§7.2 (`--impact`, `--callers`)
- **Stories:** C001-US-605
- **Priority:** Must
- **Acceptance:** C001-AC-611.1

### C001-REQ-612 — Hotspots linked to risks
- **Pattern:** unwanted-behaviour
- **Statement:** IF a hotspot listed in `30-impact/hotspots.md` is a target of a task and no RISK references that task or its component, THEN THE lint SHALL report warning `TR-15`.
- **Rationale:** IDEA-§12.2 TR-15
- **Stories:** C001-US-605
- **Priority:** Should
- **Acceptance:** C001-AC-612.1

### C001-REQ-613 — Risk register
- **Pattern:** event-driven
- **Statement:** WHEN the planner writes `20-plan/70-risks.md`, THE planner SHALL describe each risk `RISK-<seq>` with likelihood and impact (`low`, `medium`, `high`), mitigation, trigger, owner and the T or COMP IDs it concerns.
- **Rationale:** IDEA-§11.4
- **Stories:** C001-US-606
- **Priority:** Must
- **Acceptance:** C001-AC-613.1, C001-AC-613.2

### C001-REQ-614 — Rollout and rollback
- **Pattern:** event-driven
- **Statement:** WHEN the planner writes `20-plan/75-rollout.md`, THE planner SHALL include migration steps, feature flags with default values, rollback steps `RB-<seq>` each linked to a T or M ID, and communication notes, or a "No rollout impact" statement with its reason.
- **Rationale:** IDEA-§11.4
- **Stories:** C001-US-606
- **Priority:** Must
- **Acceptance:** C001-AC-614.1

### C001-REQ-615 — Observability plan
- **Pattern:** event-driven
- **Statement:** WHEN the change has at least one NFR, THE planner SHALL write `20-plan/78-observability.md` mapping each NFR to the log, metric, trace or alert that evidences it and to the task that implements that signal.
- **Rationale:** DOD-G-05 (signals for every NFR)
- **Stories:** C001-US-606
- **Priority:** Must
- **Acceptance:** C001-AC-615.1

### C001-REQ-616 — Hand-off document
- **Pattern:** event-driven
- **Statement:** WHEN the planner completes the plan, THE planner SHALL write `20-plan/handoff.md` with the sections Reading order, Rules, Ordered task list, Reporting protocol (CLI commands and the frontmatter fallback) and Definition of change done.
- **Rationale:** IDEA-§10.6
- **Stories:** C001-US-607
- **Priority:** Must
- **Acceptance:** C001-AC-616.1

### C001-REQ-617 — Ordered task list for plan executors
- **Pattern:** ubiquitous
- **Statement:** THE Ordered task list section of `handoff.md` SHALL list every non-dropped task in a topological order of `depends_on`, each with its ID, title and task-file path relative to the repository root.
- **Rationale:** C001-GOAL-07 (Superpowers executing-plans and plain sessions can follow it)
- **Stories:** C001-US-607
- **Priority:** Must
- **Acceptance:** C001-AC-617.1, C001-AC-617.2

### C001-REQ-618 — Lite plan
- **Pattern:** optional-feature
- **Statement:** WHERE a change has profile `lite`, THE planner SHALL write `20-plan/plan.md` containing the strategy, one section per task carrying the task fields of C001-IF-03 §3, the TS-to-TC mapping and the risk list.
- **Rationale:** OQ-05
- **Stories:** C001-US-608
- **Priority:** Must
- **Acceptance:** C001-AC-618.1
