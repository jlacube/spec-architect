---
id: C001-T-072
title: "Release gate v0.1.0"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-7
status: todo
depends_on: [C001-T-061, C001-T-062, C001-T-063, C001-T-064, C001-T-065, C001-T-054, C001-T-053, C001-T-070, C001-T-076, C001-T-077, C001-T-078, C001-T-079, C001-T-080, C001-T-081, C001-T-082]
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

Run the release gate: all TCs; the eval scenarios, the routing suite and the injection suite at
the release classes of C001-ADR-003 (revision 2026-10-23, Q-release-tier-01); clean-profile install;
DoD evidence collected for DOD-G and DOD-001…021; version 0.1.0 tagged locally.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `CHANGELOG.md` | 0.1.0 entry |
| add | `docs/release-0.1.0-evidence.md` | evidence per DoD item. For the evals: each scenario's release class, runs and result; the notional cost per part; and each deferred milestone item of `docs/milestone-log.md` with the run or evidence that closes it (C001-ADR-003) |
| modify | `docs/milestone-log.md` | status of the deferred M-3, M-4 and M-5 rows: closed, with the evidence reference |
| modify | `evals/README.md` | release table: link to the release classes of C001-ADR-003 |

## Preconditions

- All M-6 tasks
- Dependencies done: C001-T-061, C001-T-062, C001-T-063, C001-T-064, C001-T-065, C001-T-054, C001-T-053, C001-T-070, C001-T-076, C001-T-077, C001-T-078, C001-T-079, C001-T-080 (D-014 closed: `npm run check` green on Node 20 and 22 in both shells, with the encoding and coverage steps; coverage measured on Node 22, skipped with its reason on Node 20), C001-T-081 (D-015 closed: an interrupted archive resumes without duplicates), C001-T-082 (D-017 closed: the C001-IF-05 §1 blocking criteria in the skills)
- The constitution v2 is approved at G0, with DOD-G-01 carrying the floor of the release classes (Q-dodg01-amend-01).

## Step outline (no production code)

1. Run `npm run check`.
2. Run the eval test cases, the routing suite and the injection suite at the run count and pass
   rule of their release class in C001-ADR-003. Reuse an earlier result only under the reuse
   conditions of C001-ADR-003. Pace by the 5-hour window (≤ 90%) and tell P-01 when weekly usage
   nears 90%.
3. Keep a running notional total. At 350 USD, stop and ask P-01 to choose: a second weekly reset, or
   the cuts of C001-ADR-003 in their order.
4. If C001-TC-215, C001-TC-223 or C001-TC-224 ends below its pass rule, reopen D-017
   (`sdd defect reopen D-017`) and C001-T-082 (`sdd task set C001-T-082 --status in-progress`), and
   rerun both cases after the fix.
5. Close the deferred milestone items of `docs/milestone-log.md`:
   - the eval items through the runs of step 2;
   - the toy-change items (G2; G3 on cfg-full and cfg-bare) through a named change that met them;
   - if no change met one of them, run a toy change for it.
6. Clean-profile install (C001-TC-1102).
7. Collect evidence; tag v0.1.0 locally (no push).

## Verification

- All TCs pass; the release eval report meets the pass rule of each release class of C001-ADR-003
- Every deferred row of `docs/milestone-log.md` is closed with its evidence
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Evidence file complete for every DoD item and every deferred milestone item
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-072 --status done --commit <sha>` (or frontmatter fallback before T-026)
