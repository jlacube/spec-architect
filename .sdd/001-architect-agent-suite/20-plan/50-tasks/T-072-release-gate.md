---
id: C001-T-072
title: "Release gate v0.1.0"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-7
status: todo
depends_on: [C001-T-061, C001-T-062, C001-T-063, C001-T-064, C001-T-065, C001-T-054, C001-T-053, C001-T-070, C001-T-076, C001-T-077, C001-T-078, C001-T-079, C001-T-080, C001-T-081]
implements: []
satisfies_ac: [C001-AC-1102.1]
verified_by: [C001-TS-1102, C001-TC-1102]
components: [C001-COMP-11, C001-COMP-12]
risk_refs: [C001-RISK-005]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-072 — Release gate v0.1.0

## Intent

Run the release gate: all TCs, eval scenarios at the reduced release tier of C001-ADR-003 (revision 2026-10-23, Q-release-tier-01: 10 runs and ≥ 9/10 for high-risk scenarios, 3 runs and 3/3 for the rest, the routing and injection suites at 10 runs per case), clean-profile install, DoD evidence collected for DOD-G and DOD-001…021, version 0.1.0 tagged locally.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `CHANGELOG.md` | 0.1.0 entry |
| add | `docs/release-0.1.0-evidence.md` | evidence per DoD item; for the evals, each scenario's release class, runs, result and the notional cost per part (C001-ADR-003) |
| modify | `evals/README.md` | release tier table: the reduced tier of C001-ADR-003 |

## Preconditions

- All M-6 tasks
- Dependencies done: C001-T-061, C001-T-062, C001-T-063, C001-T-064, C001-T-065, C001-T-054, C001-T-053, C001-T-070, C001-T-076, C001-T-077, C001-T-078, C001-T-079, C001-T-080 (D-014 closed: `npm run check` green on Node 20 and 22 in both shells, with the encoding and coverage steps; coverage measured on Node 22, skipped with its reason on Node 20), C001-T-081 (D-015 closed: an interrupted archive resumes without duplicates)

## Step outline (no production code)

1. Run npm run check. Run the eval TCs by their release class in C001-ADR-003: the 12 high-risk test cases at 10 runs, the other 66 at 3 runs (a 2/3 result triggers a 10-run check), the routing suite (42 cases) and the injection suite (22 cases) at 10 runs per case. Pace by the 5-hour window (≤ 90%) and tell P-01 when weekly usage nears 90%. If the running total heads past 350 USD notional, tell P-01 and apply the cuts of C001-ADR-003 in their order.
2. Clean-profile install (C001-TC-1102).
3. Collect evidence; tag v0.1.0 locally (no push).

## Verification

- All TCs pass; the release eval report meets each class's pass rule of C001-ADR-003 (≥ 9/10 high-risk, 3/3 standard, ≥ 90% of routing runs, 0 injection runs acted upon)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Evidence file complete for every DoD item
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-072 --status done --commit <sha>` (or frontmatter fallback before T-026)
