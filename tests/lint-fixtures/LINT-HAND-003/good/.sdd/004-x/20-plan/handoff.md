---
id: C004-PLAN-HANDOFF
artifact: plan/handoff
change: CHG-004
phase: 20-plan
status: draft
---
# Hand-off

## Rules

Commit once per task.

## Reading order

Read the task file.

## Reporting protocol

The first command is a one-time install of the sdd CLI (Node.js 20 or later).

```bash
npm install -g architect-sdd@0.1.1
```

Run `sdd task set` and `sdd defect add`. Frontmatter fallback: edit the task file's frontmatter.

## Definition of change done

Every task is done.

## Ordered task list

| # | Task | Title | File |
|---|---|---|---|
| 1 | C004-T-001 | Thing | .sdd/004-x/20-plan/50-tasks/T-001-thing.md |
