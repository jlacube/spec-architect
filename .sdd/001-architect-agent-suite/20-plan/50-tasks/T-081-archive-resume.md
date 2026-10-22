---
id: C001-T-081
title: "Archive resumes after an interrupted run without duplicates (D-015)"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: todo
depends_on: [C001-T-080]
implements: [C001-REQ-924, C001-REQ-914, C001-REQ-915, C001-REQ-916, C001-REQ-917, C001-REQ-919, C001-REQ-920]
satisfies_ac: [C001-AC-924.1, C001-AC-914.1, C001-AC-915.1, C001-AC-916.1, C001-AC-917.1, C001-AC-919.1, C001-AC-920.1]
verified_by: [C001-TS-925, C001-TC-1131, C001-TC-914, C001-TC-915, C001-TC-916, C001-TC-917, C001-TC-918, C001-TC-919, C001-TC-920, C001-TC-921, C001-TC-922, C001-TC-1126]
components: [C001-COMP-06]
risk_refs: [C001-RISK-015]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-081 — Archive resumes after an interrupted run without duplicates (D-015)

## Intent

Implement C001-REQ-924 and close defect D-015, found by C001-T-080 (F-6; P-01,
Q-archive-faults-01 and Q-archive-resume-01). Suppose an `sdd archive` run is interrupted after part
of its writes and before the folder move. Running it again must finish the remaining operations, and
the result must match one uninterrupted run. The approach is idempotent application: each operation
checks whether its result for this change is already in the files, and is left out of the plan if
so. Every file is still written atomically (C001-NFR-301). No journal file and no new state file
are added.

The existing requirements change only as follows. C001-REQ-914 … 917 and 919 get the
already-applied checks. C001-REQ-917 also gets the write order of a cross-capability rename. C001-REQ-920
gets the folder-move retry and fault switch.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/archive/plan.ts › planArchive` | C001-REQ-924 resume: a change whose `change.md` says `archived` while its folder is still outside `_archive/` is planned like an active one, and the C001-REQ-913 preconditions are checked again. `stopped` still gives `ERR-CLI-014`. Already-applied operations are left out of the plan (Step outline 3–5). The date of a resumed run follows Step outline 6 |
| modify | `src/archive/plan.ts › locate` | an ID that is a requirement heading in two living files is resolved by the rule of Step outline 4, instead of taking the first file in sorted order |
| modify | `src/archive/plan.ts › ArchivePlan writes order` | CR-11: files that gain an entry are written before files that lose one. A first pass writes each living file that receives a moved entry (cross-capability RENAMED) with its additions only. A second pass writes every changed living file with its final content, skipping a file whose content is unchanged since the first pass. Then `_constitution/glossary.md`, then `change.md`. So a moved entry is in its target before it leaves its source, also when two renames move entries between the same files in opposite directions. Without cross-capability renames there is one pass, in sorted order as today |
| modify | `src/archive/living.ts` | two lookups for the checks: the change and the date named in an entry's `Source` line, and whether the History table has a row with given ID, Event and Change cells (Date and Note are not compared) |
| modify | `src/archive/apply.ts › applyArchive` | the folder move uses the bounded EPERM, EACCES and EBUSY retry that atomic writes already use (`renameWithRetry` in `src/io/atomic.ts`, exported for this). Test-only fault switch `SDD_TEST_FAULT=archive-move-fail`: after every write and before the folder move, the command fails with a non-zero exit. Same variable and comma-separated syntax as `atomic-write-fail-at=<k>` |
| modify | `src/io/atomic.ts › renameWithRetry` | exported; behaviour unchanged |
| modify | `src/cli/commands.ts › archiveCmd` | test-only date switch: when `SDD_TEST_TODAY=<YYYY-MM-DD>` is set, `archive` uses that date instead of `isoDate()` |
| add | `tests/integration/cap09/TC-1131-archive-resume.test.ts` | C001-TC-1131 |
| modify (only if it lacks a delta kind) | `tests/integration/cap09/archive-fixture.ts` | the Given data of C001-TS-925 |
| modify | `plugins/architect/commands/archive.md` | CR-16, recovery after an interrupted archive. If the change folder is still outside `_archive/`, run `/architect:archive <NNN>` again; it finishes the remaining operations (C001-REQ-924). If the folder is already under `_archive/`, run `sdd status --write` to regenerate `registry.json` and `SDD.md` (C001-RB-003) |
| modify | `plugins/architect/scripts/sdd.mjs` | rebuilt bundle (`node scripts/build.mjs`) |
| modify | `docs/nfr-results.md` | §1: the archive share of the fault campaign rerun on this commit; §7 F-6: D-015 resolved, with the commit |

## Preconditions

- C001-T-080 done: `tests/integration/faults.test.ts` and `bench/faults.mjs` cover `archive` with the
  C001-TC-1126 pass rule.
- C001-T-053 done: `src/archive/` and `tests/integration/cap09/TS-914.test.ts` … `TS-922.test.ts` exist.
- C001-REQ-913 … 921 and 924 are not changed. If the resume needs behaviour that they do not
  state, raise a defect instead.
- Out of scope: an interruption after the folder move. `sdd status --write` recovers it
  (C001-RB-003), as the command sentence above says.
- Test-only switches (`SDD_TEST_FAULT`, `SDD_TEST_TODAY`) are not documented for users. They follow
  the existing `SDD_TEST_FAULT` convention.

## Step outline (no production code)

1. Test first. Write C001-TC-1131, one case per Examples row of C001-TS-925, with the mechanisms
   that the TC row names. Watch it fail today: duplicate ADDED entries, `ERR-CLI-009` "not in
   _living/" for MODIFIED, a lost or doubled rename, or `ERR-CLI-014` once `change.md` says `archived`.
2. Resume (C001-REQ-924). An `archived` status outside `_archive/` can only come from an
   interrupted archive. Treat it as a resume and check the C001-REQ-913 preconditions as for a fresh run.
3. Already applied, keyed on the requirement ID and the change ID, never on the date:
   - ADDED: the capability file has an entry for the ID whose `Source` line names this change.
   - MODIFIED: the cited ID is absent, the new ID's entry names this change, and the History row
     "<old> superseded by <new>, <change>" exists.
   - REMOVED: the cited ID is absent and the History row "<old> removed, <change>" exists.
   - RENAMED within a capability: the entry has the new title and the History row exists.
   - RENAMED across capabilities: the move-in half (target entry and its History row) and the
     move-out half (source entry gone, source History row) are checked apart. Only the missing half
     is applied.
   - A cited ID that is absent with no matching History row stays a precondition error
     (`ERR-CLI-009`), as today.
4. Write order and split state (CR-11). Files that gain an entry are written before files that lose
   one, in the two passes of the Targets. An interruption between the target and source writes of a
   cross-capability rename therefore leaves the ID in both files, never in neither. An ID found as a requirement heading in two living files is
   resolved like this:
   - Suppose exactly one copy is this change's move-in: it is in the target capability of a RENAMED
     delta of this change, has the new title, and its file has the move-in History row of this change.
     Then the other copy is the source copy, and the re-run applies only the move-out.
   - Any other duplicate is refused with `ERR-CLI-009`, listing the ID and both files. No file is
     written.
5. Glossary and status (CR-14). A glossary row that already matches the delta row (same term, same
   definition) is left out. The `change.md` status write is left out when the status is already
   `archived`. So `--dry-run` on an interrupted archive lists only the operations that remain
   (C001-REQ-921 unchanged; C001-TC-922 still passes).
6. Date of a resumed run (CR-13). Already-applied checks never compare dates. Suppose `_living/` holds
   entries or History rows of this change. Then the re-run writes with the date of the interrupted
   run, taken from those `Source` lines or History rows. The files then match the uninterrupted
   reference, which C001-REQ-924 allows. Otherwise the re-run uses today's date (or `SDD_TEST_TODAY`).
7. Folder move (CR-12). Use the bounded rename retry. Add the `archive-move-fail` switch after the
   `change.md` write. Then add the sentence to `plugins/architect/commands/archive.md`, rebuild, and run
   the archive tests and the fault test on Node 20 and 22.
8. Run `npm run bench` on Node 20.20.2. The fault campaign must still report 0 failing state files
   by the C001-TC-1126 rule. Update §1 and §7 of `docs/nfr-results.md`.

## Verification

- `npm test -- cap09/TC-1131-archive-resume cap09/TS-914 cap09/TS-915 cap09/TS-916 cap09/TS-917 cap09/TS-918 cap09/TS-919 cap09/TS-920 cap09/TS-921 cap09/TS-922 faults` on Node 20.20.2 and on Node 22.22.3
- `npm run bench` on Node 20.20.2 (fault campaign: 0 failing state files over 1,000 runs; exit 0)
- `npm run check` on Node 22.22.3 (exit 0)
- `node plugins/architect/scripts/sdd.mjs lint`

## Done when

- [ ] C001-TC-1131 passes on Node 20 and 22: all six Examples rows of C001-TS-925, the later-date
      re-run (row 5) included.
- [ ] C001-TC-914 … C001-TC-922 and the fault test still pass; the fault campaign on Node 20.20.2
      reports 0 failing state files (C001-TC-1126).
- [ ] `plugins/architect/commands/archive.md` gives both recovery cases (before and after the folder move).
- [ ] `docs/nfr-results.md` §1 and §7 updated with the commit.
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003.
- [ ] Progress reported: `sdd task set C001-T-081 --status done --commit <sha>`. That commit is the
      resolution evidence for closing D-015.
