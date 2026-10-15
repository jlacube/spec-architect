---
id: C002-T-047
title: "Release check per target and release records"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-034, C002-T-040, C002-T-046]
implements: [C002-REQ-617, C002-REQ-618, C002-REQ-619, C002-REQ-620, C002-REQ-621, C002-REQ-622, C002-REQ-629, C002-REQ-634, C002-NFR-501]
satisfies_ac: [C002-AC-617.1, C002-AC-618.1, C002-AC-619.1, C002-AC-620.1, C002-AC-621.1, C002-AC-622.1, C002-AC-629.1, C002-AC-634.1]
verified_by: [C002-TS-620, C002-TS-621, C002-TS-622, C002-TS-623, C002-TS-624, C002-TS-625, C002-TS-633, C002-TS-648, C002-TS-651]
components: [C002-COMP-010]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-047 — Release check per target and release records

## Intent

Implement C002-IF-009 §5. For one target at a time (C002-REQ-619), the check regenerates the package
at the release commit and compares it (C002-NFR-501). It recomputes every replay expectation, refuses a
report whose replay host lacks a capability that the cited corpora require (C002-REQ-634), and checks
injection, checklist and spike evidence at the tested versions (C002-REQ-617, C002-REQ-618,
C002-REQ-620, C002-REQ-621, C002-REQ-629). It then writes `release.json`, flagged under the hooks
fallback (C002-REQ-622).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/release-check.mjs` | thin entry bundling `scripts/release/main.ts` (C002-ADR-003) |
| add | `scripts/release/*.ts` | regeneration diff, replay recomputation, evidence readers, ERR-REL-001 … ERR-REL-013, record writer validated by `docs/releases/release-record.schema.json` |
| add | `tests/integration/cap06/release-check.test.ts` | the listed scenarios on fixture evidence folders |

## Preconditions

- C002-T-034 (generation), C002-T-040 (report format) and C002-T-046 (record template) done.

## Step outline (no production code)

1. Import the generator modules and the replay expectation rules; never copy them.
2. Read spike records by their frontmatter only (C002-IF-009 §3).
3. Refuse with every applicable ERR-REL code listed, not only the first.

## Verification

- `npm test -- cap06`
- `node scripts/release-check.mjs --target opencode --dry-run` on the fixture evidence

## Done when

- [ ] Listed scenarios pass for both targets, independently
- [ ] Progress reported: `sdd task set C002-T-047 --status done --commit <sha>`
