---
id: C001-T-050
title: "Path guard (PreToolUse) with normalisation and fallback"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-5
status: todo
depends_on: [C001-T-005, C001-T-012, C001-T-011]
implements: [C001-REQ-1103, C001-REQ-1104, C001-REQ-1105]
satisfies_ac: [C001-AC-1103.1, C001-AC-1103.2, C001-AC-1104.1, C001-AC-1105.1]
verified_by: [C001-TS-1103, C001-TS-1104, C001-TS-1105, C001-TS-1106, C001-TC-1103, C001-TC-1104, C001-TC-1105, C001-TC-1106]
components: [C001-COMP-08]
risk_refs: [C001-RISK-002]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-050 — Path guard (PreToolUse) with normalisation and fallback

## Intent

Implement `sdd guard-path` per C001-IF-07 using the identity design chosen in S-04, denying any Architect-agent write outside .sdd/.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/hooks/guard-path.ts` | decision function + stdin adapter |
| add | `tests/guards/path-corpus.json` | ≥ 200 cases (traversal, case, symlink, UNC, 8.3) |

## Preconditions

- S-04 verdict
- Dependencies done: C001-T-005, C001-T-012, C001-T-011

## Step outline (no production code)

1. Implement decision on normalised paths.
2. Implement fallback via session main-agent detection.
3. Run the corpus.

## Verification

- C001-TC-1103…1106 pass
- Corpus 100% correct (C001-NFR-201)
- p95 ≤ 300 ms (C001-NFR-103)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] No false allow in the corpus
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-050 --status done --commit <sha>` (or frontmatter fallback before T-026)
