---
id: C001-T-065
title: "NFR measurements: performance, coverage, compatibility"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: done
depends_on: [C001-T-061, C001-T-052, C001-T-027]
implements: []
satisfies_ac: [C001-AC-705.1, C001-AC-1118.1]
verified_by: [C001-TS-705, C001-TS-1119, C001-TC-705, C001-TC-1119]
components: [C001-COMP-12]
risk_refs: []
estimate: M
report: { commit: 3990fc2, completed_at: 2026-10-21, notes: "Report docs/nfr-results.md. Fails: NFR-401/403 on Node 20 (F-1 scripts/package.mjs cpSync filter sees \\?\\ paths on Node 20 so targets/ ships; F-2 shell.test EPERM cleanup), NFR-502 lines 79.99% (F-3). F-4 archive not in fault bench; F-5 encoding/coverage not in npm run check. Logged as CHG-001 D-014. Not measured: macOS/Linux, dogfood/eval NFRs." }
---

# C001-T-065 — NFR measurements: performance, coverage, compatibility

## Intent

Run and record the measurements behind C001-DOD-011, 012, 015, 016, 017: benchmarks, coverage, Node 20/22, both shells, encoding scan, portability check, single-file runtime.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/nfr-results.md` | one row per NFR with result, threshold, date, machine |

## Preconditions

- T-061, T-052, T-027
- Dependencies done: C001-T-061, C001-T-052, C001-T-027

## Step outline (no production code)

1. Run benchmarks and coverage.
2. Run check under Node 20 and 22 and in PowerShell and Git Bash.
3. Record results.

## Verification

- Every NFR of 30-nfr has a recorded result meeting its threshold or a defect raised
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] docs/nfr-results.md complete
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-065 --status done --commit <sha>` (or frontmatter fallback before T-026)
