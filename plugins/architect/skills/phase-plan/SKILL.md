---
name: phase-plan
description: Procedure of the planning phase (20-plan) of an SDD change — entry checks (G2 approved and not stale), ADRs for open technical decisions, brownfield impact, work breakdown and task files, test plan, risks, rollout, observability, hand-off, traceability, critique and gate G3. Use when starting or continuing the plan of a change.
---

# Planning phase (20-plan)

Goal: define **how** and **in what order** the change is built and verified. Run the steps in
order; plan them as your task list (one task per step, titles as below). Files: C001-IF-06 (full
profile) or `plan.md` + `handoff.md` (lite).

## Step 1 — Check entry

- `sdd stale check <NNN>`; `10-spec` must be `approved` and not `stale`. Otherwise reply naming
  `10-spec` and its status, propose `/architect:revise spec <NNN>` (content must change) or
  re-approval through `/architect:gate <NNN>`; dispatch no specialist and stop.
- When `20-plan` is `not-started`, set it `draft` and `phase: 20-plan` in `change.md`, then
  `sdd status --write`.

## Step 2 — Decisions

- List the technical decisions the spec leaves open (libraries, data strategy, integration,
  deployment). Dispatch `sdd-architect` for each: an option analysis and an ADR
  (architecture-decisions skill). Ask P-01 (interview-protocol) where the decision is theirs.

## Step 3 — Impact (brownfield and mixed)

- Dispatch `sdd-cartographer` for `30-impact/blast-radius.md`, `regression-set.md` and
  `hotspots.md` of the symbols the change touches. Independent of step 2: same turn.

## Step 4 — Work breakdown and tasks

- Dispatch `sdd-planner` (planning skill): `10-strategy.md`, `40-work-breakdown.md`,
  `50-tasks/T-*.md` (lite: the sections of `plan.md`).

## Step 5 — Test plan

- Dispatch `sdd-test-designer` for `60-test-plan.md` (every TS → TC with level, location, data,
  environment). Can run in the same turn as step 6.

## Step 6 — Risks, rollout, observability, hand-off

- Dispatch `sdd-planner` for `70-risks.md`, `75-rollout.md`, `78-observability.md` (when NFRs
  exist) and `handoff.md` with its ordered task list.

## Step 7 — Trace, lint and critique

- `sdd-auditor` (trace and lint), then `sdd-critic` (plan rubric). Route findings to their owners;
  re-run until lint has no error and no blocker is open.

## Step 8 — Gate G3

- Present G3 with the gate-protocol skill; approve only on P-01's answer. Approval hands the plan
  to implementers through `handoff.md`.
