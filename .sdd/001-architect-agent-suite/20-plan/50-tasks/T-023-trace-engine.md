---
id: C001-T-023
title: "Trace engine: matrices, trace.json, coverage, open items"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: in-progress
depends_on: [C001-T-018]
implements: [C001-REQ-706, C001-REQ-707, C001-REQ-708, C001-REQ-709, C001-REQ-716]
satisfies_ac: [C001-AC-706.1, C001-AC-707.1, C001-AC-708.1, C001-AC-709.1, C001-AC-716.1]
verified_by: [C001-TS-706, C001-TS-707, C001-TS-708, C001-TS-709, C001-TS-716, C001-TC-706, C001-TC-707, C001-TC-708, C001-TC-709, C001-TC-716]
components: [C001-COMP-04]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-023 — Trace engine: matrices, trace.json, coverage, open items

## Intent

Generate 80-traceability.md (forward/backward tables, coverage), trace.json (C001-IF-12) and 85-open-items.md (markers outside code/quotes/fences), replacing the prototype generator.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/trace/*.ts` | graph → markdown and JSON; deterministic ordering |
| add | `tests/integration/trace/*.test.ts` | schema validation of trace.json; determinism (C001-NFR-302) |

## Preconditions

- T-018
- Dependencies done: C001-T-018

## Step outline (no production code)

1. Render tables in stable order; exclude generated_at from determinism comparisons.
2. Validate trace.json against trace.schema.json.
3. Collect markers with the exemptions of C001-REQ-716.

## Verification

- C001-TC-706…709, 716 pass
- Regenerating CHG-001 traceability reproduces the prototype coverage table
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] tools/prototypes/specgen.py no longer needed
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-023 --status done --commit <sha>` (or frontmatter fallback before T-026)
