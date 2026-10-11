---
name: planning
description: How the planner writes the plan of an SDD change — strategy and milestones, task files with their frontmatter and sections, the dependency graph and critical path, risks, rollout and rollback, observability, the hand-off with its ordered task list, and the single-file lite plan. Use for every plan-phase artifact the planner owns.
---

# Planning

The plan says **how** and **in what order** the change is built and verified, precisely enough
that any implementer can start without asking. It never contains production code.

## Strategy (`10-strategy.md`)

Approach, sequencing rationale, and milestones `M-<seq>`: each with a goal, an exit criterion
(checkable) and its task IDs (LINT-PLAN-001).

## Tasks (`50-tasks/T-<seq>-<slug>.md`)

```yaml
---
id: C004-T-031
title: Add expiry validation to payment-method selection
milestone: C004-M-2
status: todo                 # todo | in-progress | blocked | done | dropped
depends_on: [C004-T-029]
implements: [C004-REQ-012]
satisfies_ac: [C004-AC-012.1]
verified_by: [C004-TS-040, C004-TC-077]
components: [C004-COMP-03]
risk_refs: [C004-RISK-004]
estimate: M                  # S | M | L
report: { commit: null, completed_at: null, notes: null }
---
```

Body sections, in this order: **Intent** (2–4 sentences) · **Targets** (table: Kind ∈ add,
modify, delete, rename; Target `path › symbol`; Change) · **Preconditions** · **Step outline**
(numbered, no production code: signatures belong in `50-interfaces/`) · **Verification**
(runnable commands) · **Done when** (checkboxes).

- Size: a task fits one focused session (S ≤ ½ day, M ≤ 1 day, L ≤ 2 days); split anything bigger.
- Every REQ is implemented by at least one task (TR-06); every task links a REQ/AC and a TS/TC
  (TR-07).
- `depends_on` forms an acyclic graph (TR-11); allocate IDs with `sdd id next T --change <NNN>`.

## Work breakdown (`40-work-breakdown.md`)

- A Mermaid `flowchart` with one `subgraph` per milestone containing its task nodes (node ID = task
  ID with `-` → `_`), and one edge per `depends_on` pair (dependency → dependent).
- A **Critical path** list: the longest chain of dependent tasks by estimate, in dependency order.
- A table: milestone, task, title, estimate, depends on.

## Test plan (`60-test-plan.md`, written by the test-designer)

Each scenario TS maps to test cases `TC-<seq>`: level (unit, integration, e2e, eval, manual),
location, test data, environment; manual cases name who executes them.

## Risks (`70-risks.md`)

`RISK-<seq>`: description, likelihood and impact (low, medium, high), mitigation (a task ID, or
"accepted by P-NN"), trigger, owner, and the T or COMP IDs it concerns. Every hotspot a task
touches has a risk (TR-15).

## Rollout (`75-rollout.md`)

Migration steps; feature flags with default values; rollback steps `RB-<seq>`, each linked to a T
or M ID; communication notes. Or exactly: "No rollout impact — <reason>".

## Observability (`78-observability.md`)

When the change has NFRs: one row per NFR — the log, metric, trace or alert that evidences it and
the task that implements that signal (LINT-OBS-001).

## Hand-off (`handoff.md`)

Sections, in this order of importance (all required):

- **Reading order** — constitution, spec index, capability files, strategy, tasks.
- **Rules** — do not change requirements; report a spec defect instead of working around one.
- **Ordered task list** — every non-dropped task exactly once, in a topological order of
  `depends_on` (no task before a task it depends on), each line `ID — title — path` with the path
  relative to the repository root (`.sdd/<NNN>-<slug>/20-plan/50-tasks/T-…md`).
- **Reporting protocol** — the commands `sdd task set <T-ID> --status … --commit <sha>`,
  `sdd defect add --ref <ID> --summary "…"`, and the frontmatter fallback for implementers who
  cannot run the CLI (edit `status` and `report` in the task file).
- **Definition of change done** — all tasks done, DoD evidence filled, no open defect.

## Lite plan (`20-plan/plan.md`)

One file with the sections **Strategy**, **Tasks** (one `### <T-ID> — <title>` sub-section per
task carrying the task fields above as a list: Status, Depends on, Implements, Satisfies AC,
Verified by, Estimate, Targets, Verification, Done when), **Test mapping** (TS → TC table) and
**Risks**; plus `handoff.md`. No `50-tasks/` folder.
