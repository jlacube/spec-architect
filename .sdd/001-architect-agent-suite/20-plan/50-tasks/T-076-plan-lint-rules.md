---
id: C001-T-076
title: "Plan lint rules (task shape, TC fields, risks, rollout, hand-off)"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: todo
depends_on: [C001-T-043]
implements: [C001-REQ-602, C001-REQ-609, C001-REQ-613, C001-REQ-614, C001-REQ-616, C001-REQ-617]
satisfies_ac: [C001-AC-602.1, C001-AC-609.2, C001-AC-613.1, C001-AC-614.1, C001-AC-616.1, C001-AC-617.1]
verified_by: [C001-TS-602, C001-TS-611, C001-TS-615, C001-TS-617, C001-TS-619, C001-TS-620, C001-TC-602, C001-TC-611, C001-TC-615, C001-TC-617, C001-TC-619, C001-TC-620]
components: [C001-COMP-04]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-076 — Plan lint rules (task shape, TC fields, risks, rollout, hand-off)

## Intent

Promote the plan structure checks written in C001-T-043 (`tests/integration/cap06/plan-structure.ts`) into lint rules with the codes added by the D-003 revision, so `sdd lint` enforces the shape of every plan, not only this repository's.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/lint/rules/task-004.ts`, `tc-001.ts`, `risk-001.ts`, `roll-001.ts`, `hand-001.ts`, `hand-002.ts` | LINT-TASK-004, LINT-TC-001, LINT-RISK-001, LINT-ROLL-001, LINT-HAND-001, LINT-HAND-002 (plan-phase rules, full and lite profiles) |
| modify | `src/lint/rules/index.ts` | register the six rules |
| modify | `tests/integration/cap06/TS-602.test.ts` … `TS-620.test.ts` | assert the lint codes; keep the worked-example checks on CHG-001 |
| delete | `tests/integration/cap06/plan-structure.ts` | logic moved into the rules |

## Preconditions

- T-043
- Dependencies done: C001-T-043

## Step outline (no production code)

1. Port each structure check to a rule; findings name the file, line and ID.
2. Switch the six integration tests to the lint codes.
3. Run the lint on CHG-001 (the worked example must stay clean).

## Verification

- C001-TC-602, 611, 615, 617, 619, 620 pass
- Run `npm run check` and `node plugins/architect/scripts/sdd.mjs lint`.

## Done when

- [ ] The six codes are reported by `sdd lint` with the messages of the error catalogue
- [ ] CHG-001's plan lints clean
- [ ] Progress reported: `sdd task set C001-T-076 --status done --commit <sha>`
