---
id: C001-T-016
title: "ID ledger: id next, tombstone, type validation"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: in-progress
depends_on: [C001-T-012]
implements: [C001-REQ-109, C001-REQ-110, C001-REQ-111, C001-REQ-113]
satisfies_ac: [C001-AC-109.1, C001-AC-110.1, C001-AC-111.1, C001-AC-113.1]
verified_by: [C001-TS-114, C001-TS-115, C001-TS-116, C001-TS-118, C001-TC-114, C001-TC-115, C001-TC-116, C001-TC-118]
components: [C001-COMP-03]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-016 — ID ledger: id next, tombstone, type validation

## Intent

Implement ids.json management: allocation persisted before printing, block support, tombstones and type validation.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/workspace/ledger.ts` | next(type, block?), tombstone(id, reason), validate types per C001-IF-04 §2 |
| add | `tests/integration/workspace/ledger.test.ts` | allocation, reuse prevention, unknown type |

## Preconditions

- T-012
- Dependencies done: C001-T-012

## Step outline (no production code)

1. Implement ledger read/write via writeFileAtomic.
2. Skip allocated and tombstoned numbers.
3. Reject unknown types with ERR-CLI-004.

## Verification

- C001-TC-114…116, C001-TC-118 pass
- Loading this repo’s ids.json succeeds and recognises C001-REQ-308 as tombstoned
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] ids.json format matches C001-IF-03 §4
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-016 --status done --commit <sha>` (or frontmatter fallback before T-026)
