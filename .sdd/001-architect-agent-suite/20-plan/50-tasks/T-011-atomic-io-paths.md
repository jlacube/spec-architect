---
id: C001-T-011
title: "Atomic writes and path normalisation"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: in-progress
depends_on: [C001-T-001]
implements: [C001-REQ-126]
satisfies_ac: [C001-AC-126.1]
verified_by: [C001-TS-132, C001-TC-132]
components: [C001-COMP-03, C001-COMP-08]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-011 — Atomic writes and path normalisation

## Intent

Provide the two low-level utilities everything writes through: atomic file replacement (temp + rename in the same directory) and platform-neutral path normalisation (case, separators, drive letters, .. and symlink resolution) used by the CLI and the path guard.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/io/atomic.ts` | writeFileAtomic(path, data): temp file in same dir, fsync, rename; cleanup on failure |
| add | `src/io/paths.ts` | normalise(), isInside(root, target) with realpath and Windows case folding |
| add | `tests/unit/io/*.test.ts` | fault-injection hooks; POSIX/Windows path tables |

## Preconditions

- T-001
- Dependencies done: C001-T-001

## Step outline (no production code)

1. Implement writeFileAtomic with an injectable fault point for tests.
2. Implement path normalisation; treat UNC and 8.3 short names via realpath.
3. Write LF + UTF-8 without BOM for all writes (C001-NFR-404).

## Verification

- C001-TC-132 passes (interrupted write leaves previous file, no temp residue)
- Path table tests pass on REF-WIN
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] No other module writes files without writeFileAtomic (grep check added to structure checks later)
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-011 --status done --commit <sha>` (or frontmatter fallback before T-026)
