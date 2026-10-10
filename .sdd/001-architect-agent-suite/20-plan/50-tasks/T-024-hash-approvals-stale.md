---
id: C001-T-024
title: "Approval hashing, approvals store and stale detection"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: todo
depends_on: [C001-T-017]
implements: [C001-REQ-806, C001-REQ-810, C001-REQ-814]
satisfies_ac: [C001-AC-806.1, C001-AC-806.2, C001-AC-810.1, C001-AC-810.2, C001-AC-814.1]
verified_by: [C001-TS-806, C001-TS-807, C001-TS-811, C001-TS-812, C001-TS-816, C001-TC-806, C001-TC-807, C001-TC-811, C001-TC-812, C001-TC-816]
components: [C001-COMP-05]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-024 — Approval hashing, approvals store and stale detection

## Intent

Implement the C001-IF-13 §2 hash (single- and multi-file), per-ID hashes in approvals.json, and stale propagation.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/gate/hash.ts` | normalise, per-file and phase hash, per-ID block hash |
| add | `src/gate/stale.ts` | recompute and propagate |
| add | `tests/integration/gate/hash.test.ts` | G1 and G2 hashes of this repository as golden values |

## Preconditions

- T-017
- Dependencies done: C001-T-017

## Step outline (no production code)

1. Port the prototype algorithm in tools/prototypes/phasehash.py.
2. Golden tests: G1 = sha256:c9c7849f…, G2 = value recorded in change.md.
3. Implement stale propagation to later phases.

## Verification

- C001-TC-806, 807, 811, 812, 816 pass
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Hashes of this repository’s approved phases reproduce exactly
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-024 --status done --commit <sha>` (or frontmatter fallback before T-026)
