---
id: C002-T-006
title: "Spec-contract locator, schema-copy equality test and CHG-001-coupled CLI tests"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: []
implements: []
satisfies_ac: [C002-AC-623.1]
verified_by: [C002-TS-626, C002-TS-627]
components: [C002-COMP-013]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-006 — Spec-contract locator, schema-copy equality test and CHG-001-coupled CLI tests

## Intent

Several tests read spec files by a fixed CHG-001 path, and those paths move when a change is archived
(baseline §4 note 7). C002-ADR-002 also asks for a test that the in-repository schema copies equal
their spec contracts. This task adds one locator for both, and it keeps finding a contract after
`sdd archive` moves it to `_living/`. It also updates the tests that mirror CHG-001 tables
(regression-set §4.2).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `tests/helpers/spec-file.ts` | finds a spec file of a change in `.sdd/<NNN>-*/…` or, after archive, under `.sdd/_living/…`; fails with both paths named when neither exists |
| add | `tests/integration/contracts/schema-copies.test.ts` | byte or canonical-JSON equality of each in-repository copy with its spec contract; the pair list is that of C002-ADR-002 and starts empty; C002-T-016, C002-T-024 and C002-T-040 each add their pair |
| modify | `tests/integration/cli/frontend.test.ts` | catalogue mirror reads the ERR-CLI and WARN-CLI rows of the CHG-001 and CHG-002 `errors.md`; command list reads C001-IF-01 and C002-IF-007; both through the locator |
| add | `tests/unit/helpers/spec-file.test.ts` | the locator on a fixture with an active change, and on one with the file only in `_living/` |

## Preconditions

- None.

## Step outline (no production code)

1. Write the locator: given a change number and a path relative to its spec folder, return the file in
   the active change folder; else the matching file under `_living/`, as `sdd archive` lays it out.
2. Write the equality test around a list of (copy, contract) pairs. Compare the canonical JSON, with
   key order and whitespace ignored.
3. Re-point the three `frontend.test.ts` assertions to the locator. Each later CLI task adds the
   `sampleArgs` of its new `COMMANDS` row, and those rows must not hang or read a real stdin.
4. Check that the approved-phase lint loop (`frontend.test.ts:147-165`) still passes once CHG-002's
   plan is approved, with the LINT-DELTA-001 waiver in effect (regression-set §4.2).

## Verification

- `npm test -- integration/cli` and `npm test -- contracts`
- `npm test -- helpers`

## Done when

- [ ] No test under `tests/` names `.sdd/001-architect-agent-suite/` directly, except through the locator
- [ ] The `_living/` fallback is covered by a test
- [ ] Progress reported: `sdd task set C002-T-006 --status done --commit <sha>`
