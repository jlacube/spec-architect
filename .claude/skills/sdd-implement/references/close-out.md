# Close-out

Starts when every non-dropped task except the archive task is `done`.

## 1. Definition of change done

From the hand-off's **Definition of change done** (usually: all tasks done, DoD evidence filled,
no open defect):

- **Tasks** — `sdd status` shows none left `todo`, `in-progress` or `blocked` (archive task aside).
- **Open defects** — none. If any, list them for the owner and stop.
- **DoD** (`10-spec/70-dod.md` full, `10-spec/dod.md` lite) — for each item, produce the evidence
  of its type (`test-report`, `coverage-report`, …): run the command, save the output where the
  hand-off or constitution says (an evidence file under `docs/`, a CI link), and list item →
  evidence. Do not edit the approved DoD file; the evidence lives beside it.
- **Global DoD** of the constitution — same treatment.

## 2. Deterministic checks

```bash
sdd lint <NNN>
sdd trace <NNN> --write
```

Errors that point at your code or task reports: fix and re-run. Errors in approved spec/plan
text: report as defects, do not edit. Commit the CLI's outputs as a reporting commit.

## 3. Archive task

The task with `archive_task: true` runs `sdd archive <NNN>`, which merges the change into
`_living/` and moves it to `_archive/`. It is the owner's decision:

1. Run the preview: `sdd archive <NNN> --dry-run`. Any `ERR-CLI-009` item → resolve or report.
2. Show the owner the planned operations and ask: "Apply the archive of CHG-<NNN>?"
3. Only on an explicit yes: run the archive task's steps (including `sdd archive <NNN>`), commit,
   report the archive task `done` per the hand-off (the archive moves the task file; follow the
   task's own steps for where the report goes).

In an Architect conductor session the owner may prefer `/architect:archive <NNN>` — offer it.

## 4. Summary for the owner

Tasks done (count, commits), DoD evidence list, lint/trace result, open questions, and what is
waiting on them (archive approval, push, release).
