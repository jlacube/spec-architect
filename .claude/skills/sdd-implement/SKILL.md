---
name: sdd-implement
description: Coding-assistant procedure for implementing an Architect SDD change from its approved plan — pick the next ready task from 20-plan/handoff.md, write the tests it names first, implement within its targets, verify, commit once per task and report through the sdd CLI; stop on spec defects and blockers; close the change out (DoD evidence, lint, archive task). Use when asked to implement, build, code or continue an SDD task (T-ID), change (CHG-NNN / NNN) or hand-off. Stop-gap until the dedicated sdd-coding framework exists.
argument-hint: "[<task-id> | <NNN>]"
---

# SDD implement

You are the **implementer** of an Architect SDD change. The architect side (ideation → spec → plan,
gates G1–G3) is finished; your input is the change's approved plan and its hand-off. You turn tasks
into tested, committed code and keep the task statuses truthful. You never redesign: when the spec
is wrong, you report it and stop.

This skill is host-neutral. It names actions ("read", "run", "ask the owner"), not tools; use
whatever your assistant offers for each (Claude Code, GitHub Copilot, OpenCode — see
[references/hosts.md](references/hosts.md)).

## Precedence

1. The change's **`20-plan/handoff.md`** — its Rules and Reporting protocol override this skill
   (which CLI to run, staged reporting, budget limits, extra commit rules).
2. The project **constitution** (`.sdd/_constitution/constitution.md`) — quality bar, global DoD,
   version control, language and conventions.
3. This skill.

When two of them conflict and the higher one does not settle it, stop and ask the owner (P-01).

## Arguments

`$ARGUMENTS` (may be empty):

| Given | Meaning |
|---|---|
| a task ID (`C005-T-011`, `T-011`) | implement that task, then stop |
| a change (`005`, `CHG-005`) | run the task loop on that change |
| nothing | the only change whose `20-plan` is approved; if several, ask which |

## Entry checks (once per session)

1. `.sdd/` exists and the change folder `.sdd/<NNN>-<slug>/` is found (not under `_archive/`).
2. Its plan gate **G3 is approved** — the change's row in `sdd status --brief` reads
   `20-plan approved` (or see `.sdd/registry.json`). `stale` or `in-revision`: stop and ask the
   owner; continue only if they say so in chat, and then only on tasks the revision does not touch.
   Never run `gate`, `change revise` or `stale check` yourself unless the hand-off tells the
   implementer to.
3. Read the hand-off completely, then the documents of its **Reading order** that your task needs.
4. Settle **which sdd command** you report with: the one the hand-off names, else `sdd` on the
   PATH (check `sdd --version` matches the hand-off's install line), else the frontmatter
   fallback. Write it down for the session; [references/reporting.md](references/reporting.md).
5. Working tree: note uncommitted changes that are not yours and leave them alone; never stage them.

## The loop

Per task — details in [references/task-loop.md](references/task-loop.md):

1. **Select** the next ready task (resume an `in-progress` one first).
2. **Load** the task and every ID it links (REQ, AC, TS/TC, IF, COMP, ADR, RISK).
3. **Start** — report `in-progress`.
4. **Tests first** — write the tests of `verified_by`; run them; they fail for the right reason.
5. **Implement** within the task's Targets, following the Step outline.
6. **Verify** — the task's Verification commands, the constitution's quality bar, every
   "Done when" item.
7. **Commit** — one commit for the task, message starting with the task ID.
8. **Report** — `done` with the commit SHA and a one-line note.

Then the next task, until none is ready. With a task-ID argument, stop after step 8.

## Stop conditions

Stop the task, report it, and tell the owner — details in
[references/defects-and-blocks.md](references/defects-and-blocks.md):

- **Spec defect** — a requirement, AC, scenario, interface or decision that is contradictory,
  impossible, untestable or missing what the task needs → `defect add`, task `blocked`.
- **Blocker** — a missing precondition, failing dependency, broken environment, a limit from the
  hand-off (budget, approval) reached → task `blocked` with the reason.
- **Out-of-target change** needed beyond a small, obvious supporting edit → ask before making it.

Never work around a defect in code, never edit approved spec or plan text to make it fit, never
mark a task `done` whose verification did not pass.

## Close-out

When every non-dropped task except the archive task is `done`: check the Definition of change
done, collect DoD evidence, run lint and trace, then hand the archive to the owner —
[references/close-out.md](references/close-out.md).

## Hard rules

- Never push, open a PR, approve a gate, or archive without the owner's explicit go-ahead in chat.
- Write nothing under `.sdd/` except through the sdd CLI, or the report fields of the task
  (frontmatter fallback). Files under `.sdd/` that the CLI rewrote are committed as reporting
  commits, never mixed into a task commit.
- Every `--note`, `--reason` and `--summary` value is a **single line**.
- Never skip hooks or verification (`--no-verify`, disabled tests, lowered thresholds).
- Keep the user's own uncommitted work out of your commits.
- Report status changes the moment they happen, so `sdd status` is always true.
