---
id: "{{P}}-PLAN-HANDOFF"
artifact: plan/handoff
change: "{{CHANGE}}"
phase: 20-plan
status: draft
---
# {{CHANGE}} — Hand-off to the implementer

## Reading order

## Rules
- Do not change approved spec artifacts; report a spec defect instead.
- Write the tests listed in a task's `verified_by` first, then implement.
- Commit once per task with the task ID in the message.

## Reporting protocol

The first command is a one-time install of the sdd CLI (Node.js 20 or later); the others report progress.

```bash
npm install -g architect-sdd@{{VERSION}}
sdd task set <task-id> --status in-progress
sdd task set <task-id> --status done --commit <sha> --note "<summary>"
sdd task set <task-id> --status blocked --reason "<why>"
sdd defect add --ref <ID> --summary "<what is wrong>"
```

**Frontmatter fallback** (when the CLI cannot be run): edit the task file's frontmatter `status`
and fill `report.commit`, `report.completed_at` and `report.notes`.

## Definition of change done

## Ordered task list
| # | Task | Title | File |
|---|---|---|---|
<!-- Guidance: every non-dropped task in topological order of depends_on, with its path relative to the repository root. -->
