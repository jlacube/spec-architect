# Reporting

Task status is the only channel the architect side reads, so it must be true at every moment.

## Which command

Decide once per session, in this order, and say which one you use:

1. **The hand-off's Reporting protocol.** It may name a staged or local CLI
   (e.g. `node plugins/architect/scripts/sdd.mjs …` while a change fixes the CLI itself). Follow it
   exactly, including stage boundaries.
2. **`sdd` on the PATH** — check `sdd --version` against the hand-off's install line
   (`npm install -g architect-sdd@<version>`). A different version: ask the owner before reporting
   with it (hash rules can differ between versions).
3. **Frontmatter fallback** — when no CLI can be run.

Ask the owner before installing anything globally.

## Commands

```bash
sdd task set <T-ID> --status in-progress
sdd task set <T-ID> --status done --commit <sha> --note "<one line>"
sdd task set <T-ID> --status blocked --reason "<one line>"
sdd defect add --ref <ID> --summary "<one line>"
```

Run them from the repository root (or pass `--cwd`). A non-zero exit or an `ERR-…` code: read the
"Fix:" text, correct the call, never edit the file by hand to get around it.

## Single-line values

`--note`, `--reason`, `--summary`: one line, no newline, plain text. Report fields can be part of a
phase's approval hash; a second line can turn the approved plan stale. Long output (logs, tables,
measurements) goes into the commit body or an evidence file the hand-off names.

Good note: `Added coupon expiry check in PaymentSelector.validate; TS-040/TC-077 green; touched test helper fixtures/cards.ts.`

## Frontmatter fallback

Only when no CLI can run. Edit exactly these fields and nothing else:

- **Full:** task file frontmatter `status`, `report.commit`, `report.completed_at` (ISO 8601 UTC),
  `report.notes`.
- **Lite:** the task section's `- **Status:**` and its report lines in `plan.md`.

Tell the owner the fallback was used; the next CLI run (`sdd status --write`, `sdd trace`) picks
the values up (`sdd trace <NNN> --write`).

## Reporting commits

The CLI rewrites files under `.sdd/` (the task file or `plan.md`, `registry.json`, `SDD.md`,
`trace.json`…). Commit them separately from the task commit, after `done` (or after `blocked` /
`defect add`), e.g. `CHG-005: C005-T-011 done (4b99310)`. Include only `.sdd/` files the CLI
changed for this report.
