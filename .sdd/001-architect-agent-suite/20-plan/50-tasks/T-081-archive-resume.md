---
id: C001-T-081
title: "Archive resumes after an interrupted run without duplicates (D-015)"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: todo
depends_on: [C001-T-080]
implements: [C001-REQ-914, C001-REQ-915, C001-REQ-916, C001-REQ-917, C001-REQ-920]
satisfies_ac: [C001-AC-914.1, C001-AC-915.1, C001-AC-916.1, C001-AC-917.1, C001-AC-920.1]
verified_by: [C001-TS-915, C001-TC-1131, C001-TC-914, C001-TC-915, C001-TC-916, C001-TC-917, C001-TC-918, C001-TC-919, C001-TC-920, C001-TC-921, C001-TC-922, C001-TC-1126]
components: [C001-COMP-06]
risk_refs: [C001-RISK-015]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-081 — Archive resumes after an interrupted run without duplicates (D-015)

## Intent

Close defect D-015, found by C001-T-080 (F-6; P-01, Q-archive-faults-01 "Align bench, log defect
(Recommended)"). An `sdd archive` run interrupted between its in-place writes and the folder move
must finish when it is run again. The re-run must give the same files as one uninterrupted run:
no second living entry, no second History row. The approach is idempotent application. Each
operation checks whether its result for this change is already in the files and is skipped if so.
Every file is still written atomically (C001-NFR-301). No journal file and no new state file are
added.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/archive/plan.ts › planArchive` | resume: a change whose `change.md` says `archived` while its folder is still outside `_archive/` is planned like an active one (the C001-REQ-913 preconditions are checked again); `stopped` still gives `ERR-CLI-014`. Each delta operation is left out of the plan when its result for this change is already present (Step outline 2–4) |
| modify | `src/archive/living.ts` | two lookups for those checks: the change named in an entry's `Source` line, and whether the History table has a row with given ID, Event and Change cells (Date and Note are not compared) |
| add | `tests/integration/cap09/TC-1131-archive-resume.test.ts` | C001-TC-1131 |
| modify (only if it lacks a delta kind) | `tests/integration/cap09/archive-fixture.ts` | a fixture change with ADDED, MODIFIED, REMOVED and RENAMED requirements (RENAMED within and across capabilities) and a glossary delta |
| modify | `plugins/architect/commands/archive.md` | one sentence: after an interrupted archive, run `/architect:archive` again; it finishes the remaining operations |
| modify | `plugins/architect/scripts/sdd.mjs` | rebuilt bundle (`node scripts/build.mjs`) |
| modify | `docs/nfr-results.md` | §1: the archive share of the fault campaign rerun on this commit; §7 F-6: D-015 resolved, with the commit |

## Preconditions

- C001-T-080 done: `tests/integration/faults.test.ts` and `bench/faults.mjs` cover `archive` with the
  C001-TC-1126 pass rule.
- C001-T-053 done: `src/archive/` and `tests/integration/cap09/TS-914.test.ts` … `TS-922.test.ts` exist.
- Requirements C001-REQ-913 … 921 are not changed. If the resume needs behaviour that the spec
  forbids (for example a different `ERR-CLI-014` rule), raise a defect instead.
- Out of scope: an interruption after the folder move. `sdd status --write` already regenerates
  `registry.json` and `SDD.md` (C001-RB-003); C001-TC-1131 checks that path.

## Step outline (no production code)

1. Test first. Write C001-TC-1131: for each write point k of `archive`, fail write k, re-run, and
   compare every file under `.sdd/` with one uninterrupted run. Watch it fail today: duplicate
   ADDED entries, `ERR-CLI-009` "not in _living/" for MODIFIED or REMOVED, or `ERR-CLI-014` once
   `change.md` says `archived`.
2. Resume. An `archived` status outside `_archive/` can only come from an interrupted archive.
   Treat it as a resume and check the C001-REQ-913 preconditions as for a fresh run.
3. Already applied, keyed on the requirement ID and the change ID, never on the date (a resume can
   run on a later day):
   - ADDED: the capability file has an entry for the ID whose `Source` line names this change.
   - MODIFIED: the cited ID is absent, the new ID's entry names this change, and the History row
     "<old> superseded by <new>, <change>" exists.
   - REMOVED: the cited ID is absent and the History row "<old> removed, <change>" exists.
   - RENAMED within a capability: the entry has the new title and the History row exists.
     Across capabilities, check the move-out half (source file History row) and the move-in half
     (target entry and History row) apart, and apply only the half that is missing.
   - A cited ID that is absent with no matching History row stays a precondition error
     (`ERR-CLI-009`), as today.
4. Glossary rows and the `change.md` status are already idempotent (row replaced, same value set).
   Confirm this with the test; do not change them.
5. Left-out operations are not printed, so `--dry-run` on an interrupted archive lists only what
   remains (C001-REQ-921 unchanged; C001-TC-922 still passes).
6. Add the sentence to `plugins/architect/commands/archive.md`, rebuild, and run the archive tests
   and the fault test on Node 20 and 22.
7. Run `npm run bench` on Node 20.20.2. The fault campaign must still report 0 failing state files
   by the C001-TC-1126 rule. Update §1 and §7 of `docs/nfr-results.md`.

## Verification

- `npm test -- cap09/TC-1131-archive-resume cap09/TS-914 cap09/TS-915 cap09/TS-916 cap09/TS-917 cap09/TS-918 cap09/TS-919 cap09/TS-920 cap09/TS-921 cap09/TS-922 faults` on Node 20.20.2 and on Node 22.22.3
- `npm run bench` on Node 20.20.2 (fault campaign: 0 failing state files over 1,000 runs; exit 0)
- `npm run check` on Node 22.22.3 (exit 0)
- `node plugins/architect/scripts/sdd.mjs lint`

## Done when

- [ ] C001-TC-1131 passes on Node 20 and 22: after an interruption at any write point, the re-run
      exits 0 and leaves `.sdd/` byte-identical to one uninterrupted run (`generated_at` ignored).
- [ ] C001-TC-914 … C001-TC-922 and the fault test still pass; the fault campaign on Node 20.20.2
      reports 0 failing state files (C001-TC-1126).
- [ ] `docs/nfr-results.md` §1 and §7 updated with the commit.
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003.
- [ ] Progress reported: `sdd task set C001-T-081 --status done --commit <sha>`. That commit is the
      resolution evidence for closing D-015.
