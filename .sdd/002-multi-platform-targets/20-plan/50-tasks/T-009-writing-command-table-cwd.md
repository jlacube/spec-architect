---
id: C002-T-009
title: "Writing-command table as a single source and the --cwd confinement"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: [C002-T-005, C002-T-006, C002-T-008]
implements: [C002-REQ-521, C002-REQ-607]
satisfies_ac: [C002-AC-521.1, C002-AC-607.1]
verified_by: [C002-TS-536, C002-TS-636, C002-TS-610, C002-TC-536, C002-TC-636, C002-TC-610]
components: [C002-COMP-012, C002-COMP-018]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-009 — Writing-command table as a single source and the --cwd confinement

## Intent

Deny a writing `sdd` subcommand whose `--cwd` resolves outside the repository root (C002-REQ-521,
C002-IF-008 §1.2), in both CLI forms. The list of writing subcommands lives in **one** data module.
The CLI's `COMMANDS` rows and the guard both read it, and a test ties it to C002-IF-008 §1.2. Without
that, three lists could drift (hotspots §3 item 4).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/cli/writing-commands.ts` | data only, no imports: the writing subcommands of C002-IF-008 §1.2, including the forms that write only with a flag (`status --write`, `trace --write`, `archive` without `--dry-run`) and the `install copilot` row (C002-REQ-325), which this task lists and C002-T-059 decides |
| modify | `src/cli/commands.ts` | each `COMMANDS` row takes its "writes" property from the table; no second list |
| modify | `src/hooks/guard-bash.ts` | recognise a writing subcommand by its first words, as `findCommand` does; resolve each `--cwd` like a write target with the C002-T-005 helper |
| modify | `tests/guards/bash-corpus.json` | for each writing subcommand: one case with `--cwd` outside the root (deny) and one inside (allow); BG-019 stays allow; the `install copilot` cases, `deny` in every form, are C002-T-059's |
| add | `tests/guards/writing-commands.test.ts` | the table equals the rows of C002-IF-008 §1.2 (read through the C002-T-006 locator); every table entry names a `COMMANDS` row, except the `install copilot` row until C002-T-058 registers that command (its deny rule is C002-T-059); `sdd --cwd x status --write` is a usage error of the CLI, not a bypass |

## Preconditions

- C002-T-005 (root helper), C002-T-006 (locator) and C002-T-008 (same file, serialised) done.

## Step outline (no production code)

1. Add the corpus cases and see them fail.
2. Create the table module, with no imports, so that `guard-bash.ts` gains no import from
   `commands.ts`.
3. Derive the `COMMANDS` "writes" property from the table.
4. Add the guard rule: after the CLI prefix is recognised and before the allow, read the subcommand
   from the first one or two words, find every `--cwd`, resolve it and compare it with the root.
5. Add the consistency test, including the reverse direction (every IF-008 §1.2 row is in the table).

## Verification

- `npm test -- tests/guards`, `npm test -- cap11` and `npm test -- integration/cli`
- `npm run bench`

## Done when

- [ ] Exactly one list of writing subcommands exists in `src/`
- [ ] The consistency test fails when a row is added on one side only (checked once by hand)
- [ ] Progress reported: `sdd task set C002-T-009 --status done --commit <sha>`
