---
id: C001-T-014
title: "change new, profile, stop: numbering, slugs and scaffolds"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: done
depends_on: [C001-T-013, C001-T-015, C001-T-016]
implements: [C001-REQ-107, C001-REQ-108, C001-REQ-119, C001-REQ-120, C001-REQ-125]
satisfies_ac: [C001-AC-107.1, C001-AC-107.2, C001-AC-108.1, C001-AC-108.2, C001-AC-119.1, C001-AC-120.1, C001-AC-125.1]
verified_by: [C001-TS-110, C001-TS-111, C001-TS-112, C001-TS-113, C001-TS-125, C001-TS-126, C001-TS-131, C001-TC-110, C001-TC-111, C001-TC-112, C001-TC-113, C001-TC-125, C001-TC-126, C001-TC-131]
components: [C001-COMP-03, C001-COMP-13]
risk_refs: []
estimate: M
report: { commit: 5873bae, completed_at: 2026-10-11, notes: "change new and change profile done; C001-TC-110..113, 125, 126, 131 pass on the bundled CLI. Upgrade self-checks the set of found IDs (defined or referenced) and requirement texts and rolls back on difference; the lite capability reference C<NNN>-CAP-01 becomes a definition in the full layout. Full changes get empty phase folders; agents create files from templates. change stop is left to C001-T-044, which implements C001-REQ-815. change new does not yet update registry.json (status --write, C001-T-017)." }
---

# C001-T-014 — change new, profile, stop: numbering, slugs and scaffolds

## Intent

Implement change creation (numbering across active and archived changes, slug rules, manifest), the lite-to-full upgrade that preserves every ID and text, and refusal of downgrades.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/workspace/change.ts` | change new/profile/stop; slug(); nextNumber() |
| add | `src/workspace/upgrade.ts` | split lite spec.md/plan.md into the full layout |
| add | `tests/integration/workspace/change.test.ts` | numbering, slugs (Unicode transliteration via NFKD), upgrade round-trip |

## Preconditions

- T-013, T-015, T-016
- Dependencies done: C001-T-013, C001-T-015, C001-T-016

## Step outline (no production code)

1. Implement numbering and slugging per C001-REQ-107/108.
2. Write change.md frontmatter per C001-IF-03 §2 and body sections Index/Gate log.
3. Implement upgrade by section mapping; compare ID sets before/after.
4. Refuse full→lite with ERR-CLI-007.

## Verification

- C001-TC-110…113, C001-TC-125, C001-TC-126, C001-TC-131 pass
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Upgrade round-trip preserves ID set and statements byte-for-byte
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-014 --status done --commit <sha>` (or frontmatter fallback before T-026)
