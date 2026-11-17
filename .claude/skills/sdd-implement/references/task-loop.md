# Task loop

## 1. Select

Where task statuses live:

- **Full profile:** frontmatter `status` of `20-plan/50-tasks/T-<seq>-<slug>.md`.
- **Lite profile:** `- **Status:**` line of the `### <T-ID> — <title>` section in `20-plan/plan.md`.

Statuses: `todo` · `in-progress` · `blocked` · `done` · `dropped`.

Order of choice:

1. A task already `in-progress` (an interrupted session): resume it. Check `git log` for a commit
   carrying its ID first — if the work is committed, verify it and go straight to **Report**.
2. Otherwise walk the hand-off's **Ordered task list** top to bottom and take the first task that is
   `todo` and whose `depends_on` are all `done` (or `dropped`).
3. Skip `blocked` tasks; mention them in your summary. Never unblock a task yourself unless the
   reason it was blocked is visibly gone (defect closed, precondition met) — then say so.
4. The **archive task** (`archive_task: true`, lite `- **Archive task:** true`) is always last; it
   belongs to [close-out](close-out.md).

If nothing is ready, report why (all done → close-out; everything left is blocked → list the
reasons) and stop.

## 2. Load

Read the task in full: **Intent**, **Targets**, **Preconditions**, **Step outline**,
**Verification**, **Done when**, and its frontmatter links.

Resolve every linked ID inside the change folder (search for the ID string):

| Link | Where it is defined | Why you need it |
|---|---|---|
| `implements` REQ | capability files / lite `spec.md` | the behaviour to build (EARS) |
| `satisfies_ac` AC | `acceptance.md` / spec Acceptance | what "right" means |
| `verified_by` TS / TC | Gherkin scenarios; `60-test-plan.md` / Test mapping | the tests you write first (level, location, data) |
| IF | `50-interfaces/` / spec Interfaces | signatures, errors, contracts — follow exactly |
| COMP | `60-architecture/` / Architecture notes | where the code belongs, constraints |
| ADR / DEC | `20-plan/20-decisions/` | decisions you must not re-decide |
| RISK | `70-risks.md` / plan Risks | the mitigation the task carries |

Also read the impact/evidence notes for the files you will touch (regression set, hotspots) when
the plan has them.

Check the **Preconditions**. Any unmet → [blocked](defects-and-blocks.md).

## 3. Start

Report `in-progress` (see [reporting](reporting.md)). If the CLI rewrote files under `.sdd/`,
leave them for the reporting commit.

## 4. Tests first

- Write the test cases of `verified_by` at the level and location the test plan gives. Name or tag
  each test with its TS/TC ID so traceability can find it.
- One scenario → at least one test; keep Given/When/Then visible in the test's structure.
- Run them. They must **fail because the behaviour is missing** — not because of a typo, import
  error or wrong fixture. Fix the test until the failure is the right one.
- Exceptions: a pure refactor, doc or config task whose scenario is already green — say so in the
  note. `eval` and `manual` cases: prepare them (file, checklist, run command) but run them in
  Verify, respecting any budget rule of the hand-off.

## 5. Implement

- Follow the **Step outline** in order. Touch the **Targets** (`add` / `modify` / `delete` /
  `rename` at `path › symbol`).
- Interfaces, error codes and messages come from the spec's interface and error catalogue —
  verbatim.
- Small supporting edits outside Targets (an import, a test helper, a pinned-line test the change
  moves) are fine; name them in the note. Anything larger → ask the owner first.
- Follow the constitution's language and conventions and the surrounding code's style. No
  speculative features beyond the REQs.
- Apply the hand-off's extra rules (e.g. "rebuild and commit the bundled CLI when `src/`
  changes").

## 6. Verify

All of these, and keep the output for the note or the evidence file:

1. The task's **Verification** commands — every one, as written.
2. The tests you wrote — now green.
3. The constitution's **quality bar** (build, type check, lint, full or regression test set as it
   says). Run the regression set from the impact notes when the plan names one.
4. Each **Done when** checkbox — confirm it is true. Do not tick boxes in approved files; list
   them as met in the note when space allows.

A failure you cannot fix within the task's scope is a [blocker](defects-and-blocks.md), not a
reason to weaken the test.

## 7. Commit

- Stage only the files of this task (never the owner's unrelated changes, never `.sdd/` files the
  CLI rewrote).
- Message: `<T-ID>: <task title or short summary>` on the first line; body with what changed and
  the verification run if useful; add any trailer the project requires.
- One commit per task. If a fix-up is needed before reporting, amend only your own unpushed
  commit, or add a second commit with the same ID prefix.
- Never push.

## 8. Report

`done` with `--commit <sha>` (the task commit) and a single-line `--note` (what was built, tests
added, anything outside Targets). Then commit the `.sdd/` files the CLI changed as a separate
reporting commit — default message `CHG-<NNN>: <T-ID> done (<short sha>)` unless the hand-off says
otherwise.

Give the owner a two-line summary: task, commit, tests, next ready task.
