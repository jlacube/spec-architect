---
id: C001-T-025
title: "Gate commands: show, approve, record; refusals and waivers"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: done
depends_on: [C001-T-024, C001-T-018, C001-T-023]
implements: [C001-REQ-720, C001-REQ-801, C001-REQ-805, C001-REQ-807, C001-REQ-808, C001-REQ-809]
satisfies_ac: [C001-AC-720.1, C001-AC-801.1, C001-AC-805.1, C001-AC-807.1, C001-AC-808.1, C001-AC-809.1]
verified_by: [C001-TS-720, C001-TS-801, C001-TS-805, C001-TS-808, C001-TS-809, C001-TS-810, C001-TC-720, C001-TC-801, C001-TC-805, C001-TC-808, C001-TC-809, C001-TC-810]
components: [C001-COMP-05]
risk_refs: []
estimate: M
report: { commit: 6394200, completed_at: 2026-10-11, notes: "gate show/approve/record done; C001-TC-720, 801, 805, 808, 809, 810 pass; refusals write nothing (checked). The refusal checks run before --note is required because TS-808, 809 and 720 call approve without a note. gate show follows the C001-IF-13 §1 layout, while TS-801 quotes a different punctuation (US: 14, lint: … / …): spec inconsistency noted for C001-T-028. On this repository gate show 10-spec reports the 82 known lint errors (dogfood residue), so a re-approval today would need waivers." }
---

# C001-T-025 — Gate commands: show, approve, record; refusals and waivers

## Intent

Implement the gate summary, approval with its refusal conditions (lint errors, open markers, critic blockers, predecessor not approved), waivers and gate-log rows.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/gate/show.ts, approve.ts, record.ts` | C001-IF-13 §1 summary; approval transaction |
| add | `src/gate/critic-parse.ts` | read blocker findings and their status from critic reports |
| add | `tests/integration/gate/*.test.ts` | refusal matrix and waiver persistence |

## Preconditions

- T-024, T-018, T-023
- Dependencies done: C001-T-024, C001-T-018, C001-T-023

## Step outline (no production code)

1. Assemble the summary from lint, trace and critic outputs.
2. Apply refusal order: predecessor, lint errors, markers, blockers.
3. Write approval fields, approvals.json, gate-log row (with Usage column) and waivers atomically.

## Verification

- C001-TC-720, 801, 805, 808…810 pass
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Refusals never write any file
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-025 --status done --commit <sha>` (or frontmatter fallback before T-026)
