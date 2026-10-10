---
id: C001-T-013
title: "init, SDD.md generation and bootstrap adoption"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: todo
depends_on: [C001-T-012]
implements: [C001-REQ-101, C001-REQ-102, C001-REQ-103, C001-REQ-123, C001-REQ-124]
satisfies_ac: [C001-AC-101.1, C001-AC-101.2, C001-AC-102.1, C001-AC-103.1, C001-AC-123.1, C001-AC-124.1]
verified_by: [C001-TS-101, C001-TS-102, C001-TS-103, C001-TS-104, C001-TS-129, C001-TS-130, C001-TC-101, C001-TC-102, C001-TC-103, C001-TC-104, C001-TC-129, C001-TC-130]
components: [C001-COMP-03]
risk_refs: [C001-RISK-012]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-013 — init, SDD.md generation and bootstrap adoption

## Intent

Implement `sdd init` (idempotent), the SDD.md contract with its status block, adoption of the hand-written bootstrap workspace of this repository, and tolerance of foreign entries such as .sdd/metrics/.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/workspace/init.ts` | create root entries; never overwrite existing files without --force |
| add | `src/workspace/sddmd.ts` | render SDD.md; replace content between status markers only |
| add | `src/workspace/adopt.ts` | detect generator: manual*; preserve phases, hashes, gate logs; set generator |
| add | `tests/integration/workspace/init.test.ts` | fixtures fx-empty, fx-bootstrap, fx-brownfield-ts |

## Preconditions

- T-012
- Dependencies done: C001-T-012

## Step outline (no production code)

1. Implement init per C001-IF-06 §1.
2. Implement SDD.md rendering and marker replacement.
3. Implement bootstrap adoption against a copy of this repo’s .sdd at G2 (fixture fx-bootstrap).
4. Report unknown root entries as LINT-WS-002 info without touching them.

## Verification

- C001-TC-101…104, C001-TC-129, C001-TC-130 pass
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Running init on this repository changes nothing except adding missing folders
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-013 --status done --commit <sha>` (or frontmatter fallback before T-026)
