---
id: C002-T-053
title: "Approved-phase lint loop of frontend.test.ts excludes waived findings"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: []
implements: []
satisfies_ac: [C002-AC-623.1]
verified_by: [C002-TS-626, C002-TC-626]
components: [C002-COMP-013]
risk_refs: [C002-RISK-004]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-053 — Approved-phase lint loop of frontend.test.ts excludes waived findings

## Intent

The test "lint on a copy of this repository's workspace" (`tests/integration/cli/frontend.test.ts`,
lines 147-165 at commit 85bee21) lints every change whose current phase is approved and asserts exit
code 0 and no error or warning. `sdd lint 002` exits 1 on the 9 LINT-DELTA-001 findings that P-01
waived at G2 (C002-DEC-008), so the test turns red as soon as CHG-002's current phase is an approved
one (at G3 at the latest), and with it `npm test` and `npm run check`, which every task must pass. This
task makes the loop honour the change's recorded waivers. **The conductor makes this edit itself
before G3 is approved**, so that `npm run check` is green when implementation starts; the implementer
then verifies it and reports the task done with the conductor's commit (or makes the edit if it is
missing).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `tests/integration/cli/frontend.test.ts` › the approved-phase lint test | reads the `waivers` list of each linted change's `change.md` frontmatter; excludes from the assertion every finding whose `code` or any of whose `ids` equals the `item` of a waiver of that change; asserts that the remaining findings with a severity other than `info` are empty; accepts exit code 1 only when every error finding is excluded, and exit code 0 otherwise |

## Preconditions

- None. This task runs first in C002-M-02 (before C002-T-006, which edits the same file); if the
  conductor's edit is already committed, the task is a verification task.

## Step outline (no production code)

1. Check `git log -- tests/integration/cli/frontend.test.ts` for the conductor's pre-G3 edit. If it is
   there, review it against steps 2 to 4 and go to step 5.
2. For each change in the loop, read the `waivers` entries of its `change.md` (fields `item`, `gate`,
   `date`, `note`). A waiver's `item` is a requirement ID (for example C002-REQ-211) or a rule or
   global DoD code (for example DOD-G-01).
3. A finding is waived when its `code` equals a waiver `item`, or when one of its `ids` equals a
   waiver `item` (LINT-DELTA-001 findings carry the citing requirement in `ids`). Waived findings are
   excluded; everything else is asserted as today (no error, no warning).
4. Replace the exit-code assertion: exit 0, or exit 1 with every error finding waived. Keep the
   assertion message naming the change and listing the unwaived findings.
5. Show that the test would still catch a real finding: in a scratch copy, plant an unwaived finding
   in an approved change and confirm the test fails (not committed). Regression-set §4.2 classes
   this edit as an addition (Q-regression-01); C002-T-048 lists it so.

## Verification

- `npm test -- integration/cli`
- `node plugins/architect/scripts/sdd.mjs lint 002 --json` lists only waived findings (the 9
  LINT-DELTA-001 findings of C002-DEC-008)

## Done when

- [ ] The loop passes on this repository with CHG-002 in an approved phase, and fails on a planted unwaived finding
- [ ] No waived finding is hidden from `sdd lint` itself (only the test filters)
- [ ] Progress reported: `sdd task set C002-T-053 --status done --commit <sha>` (the conductor's commit when it made the edit)
